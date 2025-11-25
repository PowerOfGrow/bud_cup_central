-- Migration: Sécurité du stockage COA - Signed URLs et logs de téléchargement
-- Permet une gestion fine des accès aux documents COA privés

-- Table pour logger les téléchargements de documents
create table if not exists public.coa_download_logs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  file_path text not null,
  bucket_id text not null default 'entry-documents',
  ip_address inet,
  user_agent text,
  download_count integer default 1,
  first_downloaded_at timestamptz not null default timezone('utc', now()),
  last_downloaded_at timestamptz not null default timezone('utc', now())
);

-- Index pour optimiser les requêtes
create index if not exists coa_download_logs_entry_idx on public.coa_download_logs(entry_id);
create index if not exists coa_download_logs_user_idx on public.coa_download_logs(user_id);
create index if not exists coa_download_logs_date_idx on public.coa_download_logs(last_downloaded_at desc);

-- RLS
alter table public.coa_download_logs enable row level security;

-- Politique RLS : les utilisateurs peuvent voir leurs propres logs, les organisateurs voient tout
do $$ begin
  create policy "Users can view their own download logs"
    on public.coa_download_logs
    for select
    using (
      auth.uid() = user_id
      or auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

-- Fonction pour logger un téléchargement de COA
create or replace function public.log_coa_download(
  p_entry_id uuid,
  p_file_path text,
  p_bucket_id text default 'entry-documents'
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_existing_log_id uuid;
begin
  v_user_id := auth.uid();
  
  -- Chercher un log existant pour cette combinaison entry_id + user_id + file_path
  select id into v_existing_log_id
  from public.coa_download_logs
  where entry_id = p_entry_id
    and user_id = v_user_id
    and file_path = p_file_path
  limit 1;
  
  if v_existing_log_id is not null then
    -- Incrémenter le compteur et mettre à jour la date
    update public.coa_download_logs
    set
      download_count = download_count + 1,
      last_downloaded_at = now()
    where id = v_existing_log_id;
  else
    -- Créer un nouveau log
    insert into public.coa_download_logs (
      entry_id,
      user_id,
      file_path,
      bucket_id
    )
    values (
      p_entry_id,
      v_user_id,
      p_file_path,
      p_bucket_id
    );
  end if;
end;
$$;

comment on function public.log_coa_download is 'Enregistre un téléchargement de document COA dans les logs';

-- Vue pour les statistiques de téléchargement par utilisateur
create or replace view public.coa_download_stats as
select
  user_id,
  p.display_name as user_name,
  p.role as user_role,
  count(distinct entry_id) as unique_entries_accessed,
  count(*) as total_downloads,
  sum(download_count) as total_download_count,
  min(first_downloaded_at) as first_download,
  max(last_downloaded_at) as last_download
from public.coa_download_logs cdl
left join public.profiles p on p.id = cdl.user_id
group by user_id, p.display_name, p.role
order by total_download_count desc;

comment on view public.coa_download_stats is 'Statistiques de téléchargement de COA par utilisateur';

-- Vue pour les organisateurs : vue d'ensemble des téléchargements
create or replace view public.coa_download_overview as
select
  e.id as entry_id,
  e.strain_name,
  e.coa_url,
  count(distinct cdl.user_id) as unique_downloaders,
  count(*) as total_download_sessions,
  sum(cdl.download_count) as total_downloads,
  max(cdl.last_downloaded_at) as last_download_at
from public.entries e
left join public.coa_download_logs cdl on cdl.entry_id = e.id
where e.coa_url is not null
group by e.id, e.strain_name, e.coa_url
order by total_downloads desc;

comment on view public.coa_download_overview is 'Vue d''ensemble des téléchargements de COA par entrée (pour organisateurs)';

-- Fonction pour vérifier la limite de téléchargements par utilisateur
create or replace function public.check_coa_download_limit(
  p_user_id uuid,
  p_max_downloads_per_day integer default 50
)
returns boolean
language plpgsql
immutable
as $$
declare
  v_downloads_today integer;
begin
  -- Compter les téléchargements d'aujourd'hui
  select coalesce(sum(download_count), 0)
  into v_downloads_today
  from public.coa_download_logs
  where user_id = p_user_id
    and last_downloaded_at >= date_trunc('day', now());
  
  -- Retourner true si la limite n'est pas dépassée
  return v_downloads_today < p_max_downloads_per_day;
end;
$$;

comment on function public.check_coa_download_limit is 'Vérifie si un utilisateur n''a pas dépassé la limite de téléchargements COA par jour';

-- RLS pour les vues
grant select on public.coa_download_stats to authenticated;
grant select on public.coa_download_overview to authenticated;

-- Politique RLS : seuls les organisateurs peuvent voir les statistiques détaillées
-- (implémentée via les permissions sur les tables sous-jacentes)

