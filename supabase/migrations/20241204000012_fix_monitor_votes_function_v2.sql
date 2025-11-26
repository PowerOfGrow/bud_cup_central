-- Fix v2: Corriger la fonction get_suspicious_votes_for_organizer
-- Simplifier pour éviter les erreurs 400 - Pas de raise exception, juste filtrer

drop function if exists public.get_suspicious_votes_for_organizer(integer);

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
declare
  v_cutoff_date timestamptz;
begin
  -- Calculer la date de coupure
  v_cutoff_date := now() - (p_days_back::text || ' days')::interval;

  -- Retourner les votes uniquement si l'utilisateur est organisateur
  -- Si ce n'est pas le cas, la requête retournera une liste vide (pas d'exception)
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
    coalesce((
      select count(distinct pv2.voter_profile_id)::bigint
      from public.public_votes pv2
      where pv2.ip_address = pv.ip_address
        and pv2.created_at > pv.created_at - interval '1 hour'
        and pv2.created_at <= pv.created_at + interval '1 hour'
    ), 0::bigint) as users_same_ip_last_hour,
    -- Compter les votes de l'utilisateur dans la dernière heure
    coalesce((
      select count(*)::bigint
      from public.public_votes pv3
      where pv3.voter_profile_id = pv.voter_profile_id
        and pv3.created_at > pv.created_at - interval '1 hour'
        and pv3.created_at <= pv.created_at + interval '1 hour'
    ), 0::bigint) as user_votes_last_hour
  from public.public_votes pv
  join public.profiles p on p.id = pv.voter_profile_id
  join public.entries e on e.id = pv.entry_id
  join public.contests c on c.id = e.contest_id
  where pv.created_at >= v_cutoff_date
    and exists (
      select 1 from public.profiles organizer_check
      where organizer_check.id = auth.uid() 
        and organizer_check.role = 'organizer'
    )
  order by pv.created_at desc
  limit 1000;
end;
$$;

comment on function public.get_suspicious_votes_for_organizer is 'Récupère les votes suspects pour les organisateurs - Version corrigée';

