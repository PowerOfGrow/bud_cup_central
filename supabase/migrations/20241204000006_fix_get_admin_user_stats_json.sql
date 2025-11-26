-- Fix v6: Version qui retourne JSON au lieu d'une table
-- Alternative pour contourner le problème PostgREST avec les fonctions RETURNS TABLE

create or replace function public.get_admin_user_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  -- Construire le résultat en JSON
  select jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'email', '',
      'role', p.role,
      'created_at', p.created_at,
      'is_verified', coalesce(p.is_verified, false),
      'entries_count', null,
      'evaluations_count', null,
      'votes_count', null,
      'contests_created_count', null,
      'last_activity_at', p.created_at,
      'is_banned', false,
      'sanctions_count', 0
    )
    order by p.created_at desc
  )
  into v_result
  from public.profiles p;
  
  return coalesce(v_result, '[]'::jsonb);
end;
$$;

comment on function public.get_admin_user_stats is 'Statistiques utilisateurs - Version JSON pour contourner problème PostgREST';

