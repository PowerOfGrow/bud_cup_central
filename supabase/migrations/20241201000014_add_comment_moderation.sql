-- Migration: Système de modération des commentaires
-- Ajoute le statut des commentaires, les signalements, et le filtrage anti-spam

-- 1. Ajouter colonne de statut aux commentaires
alter table public.entry_comments
add column if not exists status text not null default 'approved' 
  check (status in ('pending', 'approved', 'rejected', 'hidden'));

-- Ajouter colonne pour raison de modération
alter table public.entry_comments
add column if not exists moderation_reason text,
add column if not exists moderated_at timestamptz,
add column if not exists moderated_by uuid references public.profiles(id) on delete set null;

-- Ajouter colonne pour détection automatique de spam
alter table public.entry_comments
add column if not exists spam_score numeric(3,2) default 0.0,
add column if not exists flagged_as_spam boolean default false;

-- Index pour optimiser les requêtes de modération
create index if not exists entry_comments_status_idx on public.entry_comments(status);
create index if not exists entry_comments_flagged_spam_idx on public.entry_comments(flagged_as_spam) where flagged_as_spam = true;

-- 2. Table pour les signalements de commentaires
create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.entry_comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  -- Un utilisateur ne peut signaler qu'une fois le même commentaire
  unique (comment_id, reporter_id)
);

-- Index pour optimiser les requêtes de signalements
create index if not exists comment_reports_comment_id_idx on public.comment_reports(comment_id);
create index if not exists comment_reports_status_idx on public.comment_reports(status);
create index if not exists comment_reports_reporter_id_idx on public.comment_reports(reporter_id);

-- 3. Table pour liste de mots interdits (configurable par organisateur)
create table if not exists public.banned_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null
);

-- Index pour recherche rapide de mots bannis
create index if not exists banned_words_word_idx on public.banned_words(word);

-- Insérer quelques mots interdits par défaut (exemples)
insert into public.banned_words (word, severity) values
  ('spam', 'high'),
  ('scam', 'critical'),
  ('hack', 'critical'),
  ('cheat', 'medium')
on conflict (word) do nothing;

-- 4. Table pour suivre le rate limiting des commentaires
create table if not exists public.comment_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_count integer not null default 1,
  window_start timestamptz not null default timezone('utc', now()),
  window_type text not null check (window_type in ('hour', 'day'))
);

-- Index pour rate limiting
create index if not exists comment_rate_limits_user_window_idx on public.comment_rate_limits(user_id, window_type, window_start);

-- 5. Fonction pour détecter les mots interdits dans un commentaire
create or replace function public.detect_banned_words(
  p_content text
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_banned_word record;
  v_detected_words text[] := array[]::text[];
  v_max_severity text := 'low';
  v_severity_score numeric := 0.0;
begin
  -- Rechercher les mots interdits (case insensitive)
  for v_banned_word in 
    select word, severity
    from public.banned_words
    where lower(p_content) like '%' || lower(word) || '%'
  loop
    v_detected_words := array_append(v_detected_words, v_banned_word.word);
    
    -- Calculer le score de spam selon la sévérité
    case v_banned_word.severity
      when 'critical' then 
        v_severity_score := greatest(v_severity_score, 1.0);
        v_max_severity := 'critical';
      when 'high' then 
        v_severity_score := greatest(v_severity_score, 0.8);
        if v_max_severity not in ('critical') then v_max_severity := 'high'; end if;
      when 'medium' then 
        v_severity_score := greatest(v_severity_score, 0.5);
        if v_max_severity not in ('critical', 'high') then v_max_severity := 'medium'; end if;
      when 'low' then 
        v_severity_score := greatest(v_severity_score, 0.2);
        if v_max_severity not in ('critical', 'high', 'medium') then v_max_severity := 'low'; end if;
    end case;
  end loop;
  
  -- Détecter les liens suspects (http://, https://, www.)
  if p_content ~* '(https?://|www\.)' then
    v_severity_score := greatest(v_severity_score, 0.3);
    if v_max_severity not in ('critical', 'high') then v_max_severity := 'medium'; end if;
  end if;
  
  return jsonb_build_object(
    'detected_words', v_detected_words,
    'severity', v_max_severity,
    'spam_score', v_severity_score,
    'has_suspicious_links', p_content ~* '(https?://|www\.)'
  );
end;
$$;

comment on function public.detect_banned_words is 'Détecte les mots interdits et liens suspects dans un commentaire et retourne un score de spam';

-- 6. Fonction pour vérifier le rate limiting
create or replace function public.check_comment_rate_limit(
  p_user_id uuid,
  p_max_per_hour integer default 10,
  p_max_per_day integer default 50
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_hourly_count integer := 0;
  v_daily_count integer := 0;
  v_window_start_hour timestamptz;
  v_window_start_day timestamptz;
begin
  -- Calculer la fenêtre de 1 heure
  v_window_start_hour := date_trunc('hour', timezone('utc', now()));
  
  -- Calculer la fenêtre de 1 jour
  v_window_start_day := date_trunc('day', timezone('utc', now()));
  
  -- Compter les commentaires dans la dernière heure
  select coalesce(sum(comment_count), 0)
  into v_hourly_count
  from public.comment_rate_limits
  where user_id = p_user_id
    and window_type = 'hour'
    and window_start >= v_window_start_hour;
  
  -- Compter les commentaires dans le dernier jour
  select coalesce(sum(comment_count), 0)
  into v_daily_count
  from public.comment_rate_limits
  where user_id = p_user_id
    and window_type = 'day'
    and window_start >= v_window_start_day;
  
  -- Vérifier les limites
  return jsonb_build_object(
    'allowed', (v_hourly_count < p_max_per_hour) and (v_daily_count < p_max_per_day),
    'hourly_count', v_hourly_count,
    'daily_count', v_daily_count,
    'hourly_limit', p_max_per_hour,
    'daily_limit', p_max_per_day,
    'hourly_remaining', greatest(0, p_max_per_hour - v_hourly_count),
    'daily_remaining', greatest(0, p_max_per_day - v_daily_count)
  );
end;
$$;

comment on function public.check_comment_rate_limit is 'Vérifie si un utilisateur n''a pas dépassé les limites de commentaires (par heure et par jour)';

-- 7. Trigger pour automatiquement mettre en pending si spam détecté
create or replace function public.auto_moderate_comment()
returns trigger
language plpgsql
as $$
declare
  v_detection jsonb;
  v_rate_limit jsonb;
begin
  -- Détecter les mots interdits
  v_detection := public.detect_banned_words(new.content);
  
  new.spam_score := (v_detection->>'spam_score')::numeric;
  new.flagged_as_spam := (v_detection->>'spam_score')::numeric > 0.5;
  
  -- Si score de spam élevé, mettre en pending automatiquement
  if new.flagged_as_spam then
    new.status := 'pending';
  end if;
  
  -- Vérifier le rate limiting
  v_rate_limit := public.check_comment_rate_limit(new.user_id);
  
  -- Si limite dépassée, rejeter le commentaire
  if not (v_rate_limit->>'allowed')::boolean then
    new.status := 'rejected';
    new.moderation_reason := 'Limite de commentaires dépassée';
  end if;
  
  return new;
end;
$$;

comment on function public.auto_moderate_comment is 'Déclencheur pour modération automatique des commentaires (détection spam + rate limiting)';

-- Créer le trigger
drop trigger if exists auto_moderate_comment_trigger on public.entry_comments;
create trigger auto_moderate_comment_trigger
  before insert on public.entry_comments
  for each row
  execute function public.auto_moderate_comment();

-- 8. Fonction pour créer un commentaire avec modération automatique
create or replace function public.create_comment_with_moderation(
  p_entry_id uuid,
  p_user_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rate_limit jsonb;
  v_detection jsonb;
  v_comment_id uuid;
  v_result jsonb;
begin
  -- Vérifier le rate limiting
  v_rate_limit := public.check_comment_rate_limit(p_user_id);
  
  if not (v_rate_limit->>'allowed')::boolean then
    return jsonb_build_object(
      'success', false,
      'error', 'rate_limit_exceeded',
      'message', format('Limite de commentaires dépassée. Maximum %s/heure et %s/jour.', 
        v_rate_limit->>'hourly_limit', 
        v_rate_limit->>'daily_limit'),
      'rate_limit', v_rate_limit
    );
  end if;
  
  -- Détecter les mots interdits
  v_detection := public.detect_banned_words(p_content);
  
  -- Créer le commentaire
  insert into public.entry_comments (
    entry_id,
    user_id,
    content,
    status,
    spam_score,
    flagged_as_spam
  )
  values (
    p_entry_id,
    p_user_id,
    p_content,
    case 
      when (v_detection->>'spam_score')::numeric > 0.5 then 'pending'
      else 'approved'
    end,
    (v_detection->>'spam_score')::numeric,
    (v_detection->>'spam_score')::numeric > 0.5
  )
  returning id into v_comment_id;
  
  -- Enregistrer le rate limiting
  insert into public.comment_rate_limits (user_id, comment_count, window_type)
  values 
    (p_user_id, 1, 'hour'),
    (p_user_id, 1, 'day')
  on conflict do nothing;
  
  -- Retourner le résultat
  return jsonb_build_object(
    'success', true,
    'comment_id', v_comment_id,
    'status', case when (v_detection->>'spam_score')::numeric > 0.5 then 'pending' else 'approved' end,
    'moderation', v_detection
  );
end;
$$;

comment on function public.create_comment_with_moderation is 'Crée un commentaire avec modération automatique et vérification du rate limiting';

-- 9. Vue pour les commentaires en attente de modération
create or replace view public.pending_comments_moderation as
select
  ec.id,
  ec.entry_id,
  ec.user_id,
  ec.content,
  ec.created_at,
  ec.spam_score,
  ec.flagged_as_spam,
  ec.status,
  e.strain_name as entry_name,
  e.contest_id,
  c.name as contest_name,
  p.display_name as user_name,
  p.organization as user_organization,
  count(cr.id) as report_count
from public.entry_comments ec
join public.entries e on e.id = ec.entry_id
join public.contests c on c.id = e.contest_id
join public.profiles p on p.id = ec.user_id
left join public.comment_reports cr on cr.comment_id = ec.id and cr.status = 'pending'
where ec.status in ('pending', 'hidden')
group by ec.id, ec.entry_id, ec.user_id, ec.content, ec.created_at, ec.spam_score, 
         ec.flagged_as_spam, ec.status, e.strain_name, e.contest_id, c.name, 
         p.display_name, p.organization
order by ec.created_at desc;

comment on view public.pending_comments_moderation is 'Vue des commentaires en attente de modération pour les organisateurs';

-- 10. Fonction pour modérer un commentaire
create or replace function public.moderate_comment(
  p_comment_id uuid,
  p_status text,
  p_reason text default null,
  p_moderator_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  -- Vérifier que le statut est valide
  if p_status not in ('pending', 'approved', 'rejected', 'hidden') then
    return jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Statut invalide'
    );
  end if;
  
  -- Modérer le commentaire
  update public.entry_comments
  set 
    status = p_status,
    moderation_reason = p_reason,
    moderated_at = timezone('utc', now()),
    moderated_by = coalesce(p_moderator_id, auth.uid())
  where id = p_comment_id;
  
  -- Si approuvé, marquer les signalements comme résolus
  if p_status = 'approved' then
    update public.comment_reports
    set 
      status = 'resolved',
      reviewed_at = timezone('utc', now()),
      reviewed_by = coalesce(p_moderator_id, auth.uid())
    where comment_id = p_comment_id and status = 'pending';
  end if;
  
  -- Si rejeté/caché, marquer les signalements comme résolus
  if p_status in ('rejected', 'hidden') then
    update public.comment_reports
    set 
      status = 'resolved',
      reviewed_at = timezone('utc', now()),
      reviewed_by = coalesce(p_moderator_id, auth.uid())
    where comment_id = p_comment_id and status = 'pending';
  end if;
  
  return jsonb_build_object(
    'success', true,
    'comment_id', p_comment_id,
    'new_status', p_status
  );
end;
$$;

comment on function public.moderate_comment is 'Modère un commentaire (approuver, rejeter, cacher)';

-- 11. Fonction pour signaler un commentaire
create or replace function public.report_comment(
  p_comment_id uuid,
  p_reporter_id uuid,
  p_reason text,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_report_id uuid;
begin
  -- Créer le signalement
  insert into public.comment_reports (
    comment_id,
    reporter_id,
    reason,
    details
  )
  values (
    p_comment_id,
    p_reporter_id,
    p_reason,
    p_details
  )
  returning id into v_report_id;
  
  -- Si 3 signalements ou plus, mettre automatiquement en pending
  if (select count(*) from public.comment_reports where comment_id = p_comment_id and status = 'pending') >= 3 then
    update public.entry_comments
    set status = 'pending'
    where id = p_comment_id and status = 'approved';
  end if;
  
  return jsonb_build_object(
    'success', true,
    'report_id', v_report_id
  );
end;
$$;

comment on function public.report_comment is 'Signale un commentaire inapproprié';

-- 12. RLS Policies pour les nouvelles tables
alter table public.comment_reports enable row level security;
alter table public.banned_words enable row level security;
alter table public.comment_rate_limits enable row level security;

-- Policies pour comment_reports
do $$ begin
  create policy "Anyone can view their own reports"
    on public.comment_reports
    for select
    using (auth.uid() = reporter_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can view all reports"
    on public.comment_reports
    for select
    using (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'organizer'
      )
      or auth.role() = 'service_role'
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can report comments"
    on public.comment_reports
    for insert
    with check (auth.uid() = reporter_id);
exception
  when duplicate_object then null;
end $$;

-- Policies pour banned_words (lecture publique, modification organisateurs)
do $$ begin
  create policy "Anyone can view banned words"
    on public.banned_words
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage banned words"
    on public.banned_words
    for all
    using (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'organizer'
      )
      or auth.role() = 'service_role'
    );
exception
  when duplicate_object then null;
end $$;

-- Policies pour comment_rate_limits (lecture/écriture par utilisateur)
do $$ begin
  create policy "Users can view their own rate limits"
    on public.comment_rate_limits
    for select
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

-- Mettre à jour les RLS policies des commentaires pour tenir compte du statut
drop policy if exists "Anyone can view comments on approved entries" on public.entry_comments;
do $$ begin
  create policy "View approved comments only (or own pending/rejected)"
    on public.entry_comments
    for select
    using (
      status = 'approved'
      or auth.uid() = user_id
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'organizer'
      )
      or auth.role() = 'service_role'
    );
exception
  when duplicate_object then null;
end $$;

-- Grants
grant execute on function public.detect_banned_words(text) to authenticated;
grant execute on function public.check_comment_rate_limit(uuid, integer, integer) to authenticated;
grant execute on function public.create_comment_with_moderation(uuid, uuid, text) to authenticated;
grant execute on function public.moderate_comment(uuid, text, text, uuid) to authenticated;
grant execute on function public.report_comment(uuid, uuid, text, text) to authenticated;
grant select on public.pending_comments_moderation to authenticated;
grant select on public.banned_words to authenticated;

