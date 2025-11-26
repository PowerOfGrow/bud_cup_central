-- Fix: Améliorer la fonction get_admin_user_stats avec vérification du rôle organisateur
-- et meilleure gestion des erreurs et valeurs NULL

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
set search_path = public, auth
as $$
begin
  -- Retourner les statistiques utilisateurs uniquement si l'utilisateur est organisateur
  -- Si l'utilisateur n'est pas organisateur, la requête ne retournera rien (pas d'exception)
  return query
  select
    p.id,
    p.display_name,
    coalesce(au.email::text, '') as email,
    p.role,
    p.created_at,
    coalesce(p.is_verified, false) as is_verified,
    
    -- Statistiques par rôle
    case 
      when p.role = 'producer' then (
        select count(*)::bigint from public.entries where producer_id = p.id
      )
      else null::bigint
    end as entries_count,
    
    case 
      when p.role = 'judge' then (
        select count(*)::bigint from public.judge_scores where judge_id = p.id
      )
      else null::bigint
    end as evaluations_count,
    
    case 
      when p.role = 'viewer' then (
        select count(*)::bigint from public.public_votes where voter_profile_id = p.id
      )
      else null::bigint
    end as votes_count,
    
    case
      when p.role = 'organizer' then (
        select count(*)::bigint from public.contests where created_by = p.id
      )
      else null::bigint
    end as contests_created_count,
    
    -- Dernière activité (gérer les valeurs NULL)
    coalesce(
      greatest(
        (select max(created_at) from public.entries where producer_id = p.id),
        (select max(created_at) from public.judge_scores where judge_id = p.id),
        (select max(created_at) from public.public_votes where voter_profile_id = p.id),
        p.updated_at
      ),
      p.created_at
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
    coalesce(
      (select count(*)::bigint from public.user_sanctions where user_id = p.id),
      0::bigint
    ) as sanctions_count

  from public.profiles p
  left join auth.users au on au.id = p.id
  where exists (
    select 1 from public.profiles organizer_check
    where organizer_check.id = auth.uid() 
      and organizer_check.role = 'organizer'
  )
  order by p.created_at desc;
end;
$$;

comment on function public.get_admin_user_stats is 'Statistiques détaillées par utilisateur pour la page Admin - Accessible aux organisateurs uniquement - Vérifie le rôle de l''utilisateur appelant';

