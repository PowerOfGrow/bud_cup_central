-- Fix: Fonction SQL sécurisée pour les organisateurs pour récupérer les conflits de juges
-- Évite les problèmes de RLS avec les jointures complexes sur profiles.email

create or replace function public.get_judge_conflicts_for_organizer()
returns table (
  id uuid,
  contest_id uuid,
  judge_id uuid,
  judge_display_name text,
  judge_organization text,
  judge_role profile_role,
  created_at timestamptz,
  contest_name text,
  contest_status contest_status,
  has_entries boolean,
  entries_count bigint,
  entry_names text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Retourner les conflits uniquement si l'utilisateur est organisateur
  return query
  select
    cj.id,
    cj.contest_id,
    cj.judge_id,
    p.display_name as judge_display_name,
    p.organization as judge_organization,
    p.role as judge_role,
    cj.created_at,
    c.name as contest_name,
    c.status as contest_status,
    -- Vérifier si le juge a des entrées dans ce concours
    exists(
      select 1 
      from public.entries e 
      where e.contest_id = cj.contest_id
        and e.producer_id = cj.judge_id
        and e.status != 'rejected'
    ) as has_entries,
    -- Compter les entrées
    coalesce((
      select count(*)::bigint
      from public.entries e 
      where e.contest_id = cj.contest_id
        and e.producer_id = cj.judge_id
        and e.status != 'rejected'
    ), 0::bigint) as entries_count,
    -- Liste des noms d'entrées
    coalesce((
      select array_agg(e.strain_name)
      from public.entries e 
      where e.contest_id = cj.contest_id
        and e.producer_id = cj.judge_id
        and e.status != 'rejected'
    ), ARRAY[]::text[]) as entry_names
  from public.contest_judges cj
  join public.profiles p on p.id = cj.judge_id
  join public.contests c on c.id = cj.contest_id
  where exists (
    select 1 from public.profiles organizer_check
    where organizer_check.id = auth.uid() 
      and organizer_check.role = 'organizer'
  )
    -- Filtrer uniquement les conflits (juges avec entrées dans le concours)
    and exists(
      select 1 
      from public.entries e 
      where e.contest_id = cj.contest_id
        and e.producer_id = cj.judge_id
        and e.status != 'rejected'
    )
  order by cj.created_at desc;
end;
$$;

comment on function public.get_judge_conflicts_for_organizer is 'Récupère les conflits d''intérêt des juges pour les organisateurs - Évite les problèmes de RLS avec les jointures complexes';

