-- Fix: Fonction SQL sécurisée pour les organisateurs pour récupérer les commentaires à modérer
-- Évite les problèmes de RLS avec les jointures complexes sur profiles

drop function if exists public.get_pending_comments_for_organizer(text);

create or replace function public.get_pending_comments_for_organizer(
  p_status_filter text default 'pending'
)
returns table (
  id uuid,
  entry_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  spam_score numeric,
  flagged_as_spam boolean,
  status text,
  entry_name text,
  contest_id uuid,
  contest_name text,
  user_name text,
  user_organization text,
  user_avatar_url text,
  report_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Retourner les commentaires uniquement si l'utilisateur est organisateur
  return query
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
    p.avatar_url as user_avatar_url,
    coalesce((
      select count(*)::bigint
      from public.comment_reports cr
      where cr.comment_id = ec.id
        and cr.status = 'pending'
    ), 0::bigint) as report_count
  from public.entry_comments ec
  join public.entries e on e.id = ec.entry_id
  join public.contests c on c.id = e.contest_id
  join public.profiles p on p.id = ec.user_id
  where exists (
    select 1 from public.profiles organizer_check
    where organizer_check.id = auth.uid() 
      and organizer_check.role = 'organizer'
  )
    and ec.status in (
      case 
        when p_status_filter = 'pending' then array['pending', 'hidden']::text[]
        else array['pending', 'approved', 'rejected', 'hidden']::text[]
      end
    )
  order by ec.created_at desc;
end;
$$;

comment on function public.get_pending_comments_for_organizer is 'Récupère les commentaires à modérer pour les organisateurs - Évite les problèmes de RLS avec les jointures complexes';

