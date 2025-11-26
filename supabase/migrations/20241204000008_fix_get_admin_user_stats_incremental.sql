-- Fix v8: Version incrémentale - ajout progressif des fonctionnalités
-- Identifier quelle partie cause le problème

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
    
    -- Statistiques par rôle (version simplifiée d'abord)
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
    
    -- Dernière activité (simplifiée)
    coalesce(p.updated_at, p.created_at) as last_activity_at,
    
    -- Statut bannissement (simplifié)
    false as is_banned,
    
    -- Nombre de sanctions (simplifié)
    0::bigint as sanctions_count

  from public.profiles p
  order by p.created_at desc;
end;
$$;

comment on function public.get_admin_user_stats is 'Statistiques utilisateurs - Version incrémentale avec statistiques de base';

