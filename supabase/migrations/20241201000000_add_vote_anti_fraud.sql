-- Migration: Anti-fraude pour les votes publics
-- Ajout de logging et rate limiting pour prévenir les abus

-- Ajouter des colonnes de logging à public_votes
alter table public.public_votes
add column if not exists ip_address inet,
add column if not exists user_agent text,
add column if not exists client_fingerprint text; -- Hash anonymisé pour détection patterns

-- Créer une fonction pour vérifier le rate limiting
create or replace function public.check_vote_rate_limit(
  p_user_id uuid,
  p_ip_address inet default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_votes_last_hour integer;
  v_votes_last_day integer;
  v_max_votes_per_hour integer := 10; -- Maximum 10 votes par heure
  v_max_votes_per_day integer := 50; -- Maximum 50 votes par jour
begin
  -- Compter les votes de l'utilisateur dans la dernière heure
  select count(*) into v_votes_last_hour
  from public.public_votes
  where voter_profile_id = p_user_id
    and created_at > now() - interval '1 hour';

  -- Compter les votes de l'utilisateur dans les dernières 24 heures
  select count(*) into v_votes_last_day
  from public.public_votes
  where voter_profile_id = p_user_id
    and created_at > now() - interval '24 hours';

  -- Vérifier les limites
  if v_votes_last_hour >= v_max_votes_per_hour then
    raise exception 'Rate limit exceeded: maximum % votes per hour allowed', v_max_votes_per_hour;
  end if;

  if v_votes_last_day >= v_max_votes_per_day then
    raise exception 'Rate limit exceeded: maximum % votes per day allowed', v_max_votes_per_day;
  end if;

  -- Vérifier les votes depuis la même IP (si fournie)
  if p_ip_address is not null then
    -- Détecter si trop de votes depuis la même IP dans la dernière heure
    -- (possible multi-comptes)
    select count(distinct voter_profile_id) into v_votes_last_hour
    from public.public_votes
    where ip_address = p_ip_address
      and created_at > now() - interval '1 hour';

    -- Si plus de 3 utilisateurs différents votent depuis la même IP en 1h, c'est suspect
    if v_votes_last_hour > 3 then
      raise exception 'Suspicious activity detected: too many different users from the same IP address';
    end if;
  end if;

  return true;
end;
$$;

-- Créer une fonction pour enregistrer un vote avec vérifications
create or replace function public.create_public_vote(
  p_entry_id uuid,
  p_voter_profile_id uuid,
  p_score smallint,
  p_comment text default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_vote_id uuid;
begin
  -- Vérifier que l'utilisateur est authentifié
  if p_voter_profile_id is null then
    raise exception 'User must be authenticated to vote';
  end if;

  -- Vérifier le rate limiting
  perform public.check_vote_rate_limit(p_voter_profile_id, p_ip_address);

  -- Vérifier que l'entrée existe et est approuvée
  if not exists (
    select 1 from public.entries
    where id = p_entry_id and status = 'approved'
  ) then
    raise exception 'Entry does not exist or is not approved for voting';
  end if;

  -- Insérer ou mettre à jour le vote (upsert)
  insert into public.public_votes (
    entry_id,
    voter_profile_id,
    score,
    comment,
    ip_address,
    user_agent,
    created_at
  )
  values (
    p_entry_id,
    p_voter_profile_id,
    p_score,
    p_comment,
    p_ip_address,
    p_user_agent,
    now()
  )
  on conflict (entry_id, voter_profile_id)
  do update set
    score = excluded.score,
    comment = excluded.comment,
    ip_address = excluded.ip_address,
    user_agent = excluded.user_agent,
    created_at = now()
  returning id into v_vote_id;

  return v_vote_id;
end;
$$;

-- Créer une vue pour les alertes de votes suspects (pour les organisateurs)
create or replace view public.suspicious_votes as
select
  pv.id,
  pv.entry_id,
  pv.voter_profile_id,
  p.display_name as voter_name,
  pv.score,
  pv.created_at,
  pv.ip_address,
  pv.user_agent,
  e.contest_id,
  c.name as contest_name,
  -- Compter les votes depuis la même IP dans la dernière heure
  (
    select count(distinct pv2.voter_profile_id)
    from public.public_votes pv2
    where pv2.ip_address = pv.ip_address
      and pv2.created_at > pv.created_at - interval '1 hour'
      and pv2.created_at <= pv.created_at + interval '1 hour'
  ) as users_same_ip_last_hour,
  -- Compter les votes de l'utilisateur dans la dernière heure
  (
    select count(*)
    from public.public_votes pv3
    where pv3.voter_profile_id = pv.voter_profile_id
      and pv3.created_at > pv.created_at - interval '1 hour'
      and pv3.created_at <= pv.created_at + interval '1 hour'
  ) as user_votes_last_hour
from public.public_votes pv
join public.profiles p on p.id = pv.voter_profile_id
join public.entries e on e.id = pv.entry_id
join public.contests c on c.id = e.contest_id
where
  -- Votes suspects : plus de 3 utilisateurs depuis la même IP en 1h
  (
    select count(distinct pv2.voter_profile_id)
    from public.public_votes pv2
    where pv2.ip_address = pv.ip_address
      and pv2.created_at > pv.created_at - interval '1 hour'
      and pv2.created_at <= pv.created_at + interval '1 hour'
  ) > 3
  or
  -- Votes suspects : plus de 8 votes par utilisateur en 1h
  (
    select count(*)
    from public.public_votes pv3
    where pv3.voter_profile_id = pv.voter_profile_id
      and pv3.created_at > pv.created_at - interval '1 hour'
      and pv3.created_at <= pv.created_at + interval '1 hour'
  ) > 8
order by pv.created_at desc;

-- RLS pour la vue des votes suspects (organisateurs uniquement)
create policy "Organizers can view suspicious votes"
  on public.public_votes
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'organizer'
    )
    or auth.role() = 'service_role'
  );

-- Commentaires
comment on function public.check_vote_rate_limit is 'Vérifie les limites de taux pour les votes (rate limiting)';
comment on function public.create_public_vote is 'Crée un vote public avec vérifications anti-fraude';
comment on view public.suspicious_votes is 'Vue des votes suspects pour détection de fraude (organisateurs uniquement)';

