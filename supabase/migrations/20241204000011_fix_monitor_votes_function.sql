-- Fix: Fonction SQL sécurisée pour les organisateurs pour récupérer les votes suspects
-- Évite les problèmes de RLS avec les jointures complexes

create or replace function public.get_suspicious_votes_for_organizer(
  p_days_back integer default 7
)
returns table (
  id uuid,
  entry_id uuid,
  voter_profile_id uuid,
  voter_display_name text,
  score smallint,
  comment text,
  created_at timestamptz,
  ip_address inet,
  user_agent text,
  client_fingerprint text,
  entry_strain_name text,
  contest_id uuid,
  contest_name text,
  users_same_ip_last_hour bigint,
  user_votes_last_hour bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Vérifier que l'utilisateur est organisateur
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Seuls les organisateurs peuvent accéder à cette fonction';
  end if;

  -- Retourner les votes avec toutes les informations nécessaires
  return query
  select
    pv.id,
    pv.entry_id,
    pv.voter_profile_id,
    p.display_name as voter_display_name,
    pv.score,
    pv.comment,
    pv.created_at,
    pv.ip_address,
    pv.user_agent,
    pv.client_fingerprint,
    e.strain_name as entry_strain_name,
    e.contest_id,
    c.name as contest_name,
    -- Compter les votes depuis la même IP dans la dernière heure
    (
      select count(distinct pv2.voter_profile_id)::bigint
      from public.public_votes pv2
      where pv2.ip_address = pv.ip_address
        and pv2.created_at > pv.created_at - interval '1 hour'
        and pv2.created_at <= pv.created_at + interval '1 hour'
    ) as users_same_ip_last_hour,
    -- Compter les votes de l'utilisateur dans la dernière heure
    (
      select count(*)::bigint
      from public.public_votes pv3
      where pv3.voter_profile_id = pv.voter_profile_id
        and pv3.created_at > pv.created_at - interval '1 hour'
        and pv3.created_at <= pv.created_at + interval '1 hour'
    ) as user_votes_last_hour
  from public.public_votes pv
  join public.profiles p on p.id = pv.voter_profile_id
  join public.entries e on e.id = pv.entry_id
  join public.contests c on c.id = e.contest_id
  where pv.created_at >= (now() - (p_days_back || ' days')::interval)
  order by pv.created_at desc
  limit 1000;
end;
$$;

comment on function public.get_suspicious_votes_for_organizer is 'Récupère les votes suspects pour les organisateurs - Évite les problèmes de RLS avec les jointures complexes';

