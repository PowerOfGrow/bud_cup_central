-- Fix v5: Version minimale - juste les profiles de base
-- Pour tester si le problème vient de la complexité de la requête

create or replace function public.get_admin_user_stats()
returns table (
  id uuid,
  display_name text,
  email text,
  role profile_role,
  created_at timestamptz,
  is_verified boolean,
  entries_count bigint,
  evaluations_count bigint,
  votes_count bigint,
  contests_created_count bigint,
  last_activity_at timestamptz,
  is_banned boolean,
  sanctions_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id,
    p.display_name,
    ''::text as email,
    p.role,
    p.created_at,
    coalesce(p.is_verified, false) as is_verified,
    null::bigint as entries_count,
    null::bigint as evaluations_count,
    null::bigint as votes_count,
    null::bigint as contests_created_count,
    p.created_at as last_activity_at,
    false as is_banned,
    0::bigint as sanctions_count
  from public.profiles p
  order by p.created_at desc;
end;
$$;

comment on function public.get_admin_user_stats is 'Statistiques utilisateurs - Version minimale pour test';

