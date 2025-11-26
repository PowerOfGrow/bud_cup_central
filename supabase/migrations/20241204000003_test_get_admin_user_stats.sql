-- Test: Version minimale pour identifier le problème
-- Retour exactement à la fonction originale de la migration 20241202000002

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
    au.email::text,
    p.role,
    p.created_at,
    p.is_verified,
  
  -- Statistiques par rôle
  case 
    when p.role = 'producer' then (
      select count(*) from public.entries where producer_id = p.id
    )
    else null
  end as entries_count,
  
  case 
    when p.role = 'judge' then (
      select count(*) from public.judge_scores where judge_id = p.id
    )
    else null
  end as evaluations_count,
  
  case 
    when p.role = 'viewer' then (
      select count(*) from public.public_votes where voter_profile_id = p.id
    )
    else null
  end as votes_count,
  
  case
    when p.role = 'organizer' then (
      select count(*) from public.contests where created_by = p.id
    )
    else null
  end as contests_created_count,
  
  -- Dernière activité
  greatest(
    (select max(created_at) from public.entries where producer_id = p.id),
    (select max(created_at) from public.judge_scores where judge_id = p.id),
    (select max(created_at) from public.public_votes where voter_profile_id = p.id),
    p.updated_at
  ) as last_activity_at,
  
  -- Statut bannissement
  exists (
    select 1 from public.user_sanctions us2 
    where us2.user_id = p.id 
      and us2.is_active = true
      and (
        us2.sanction_type = 'permanent_ban'
        or (us2.sanction_type = 'temporary_ban' and (us2.expires_at is null or us2.expires_at > timezone('utc', now())))
      )
  ) as is_banned,
  
  -- Nombre de sanctions
  (select count(*)::bigint from public.user_sanctions where user_id = p.id) as sanctions_count

  from public.profiles p
  left join auth.users au on au.id = p.id;
end;
$$;

comment on function public.get_admin_user_stats is 'Statistiques détaillées par utilisateur pour la page Admin - Version originale pour test';

