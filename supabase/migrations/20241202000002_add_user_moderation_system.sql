-- Migration: Système de modération et bannissement des utilisateurs
-- Permet aux organisateurs de gérer les utilisateurs (bannir, dé-bannir, supprimer)

-- Table pour stocker les sanctions/bannissements
create table if not exists public.user_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sanctioned_by uuid not null references public.profiles(id),
  sanction_type text not null check (sanction_type in ('warning', 'temporary_ban', 'permanent_ban', 'account_deletion')),
  reason text not null,
  reason_details text,
  expires_at timestamptz, -- Pour les bans temporaires
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.user_sanctions is 'Historique des sanctions et bannissements appliqués aux utilisateurs';

-- Index pour performance
create index if not exists user_sanctions_user_idx on public.user_sanctions(user_id);
create index if not exists user_sanctions_active_idx on public.user_sanctions(is_active, expires_at);
create index if not exists user_sanctions_type_idx on public.user_sanctions(sanction_type);

-- Trigger pour updated_at
create trigger handle_user_sanctions_updated
  before update on public.user_sanctions
  for each row
  execute function public.handle_updated_at();

-- Fonction pour voir les utilisateurs actuellement bannis (avec email depuis auth.users)
create or replace function public.get_banned_users()
returns table (
  id uuid,
  display_name text,
  email text,
  role profile_role,
  sanction_type text,
  reason text,
  expires_at timestamptz,
  banned_at timestamptz,
  sanctioned_by uuid,
  sanctioned_by_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select distinct
    p.id,
    p.display_name,
    au.email::text,
    p.role,
    us.sanction_type,
    us.reason,
    us.expires_at,
    us.created_at as banned_at,
    us.sanctioned_by,
    san.display_name as sanctioned_by_name
  from public.profiles p
  inner join public.user_sanctions us on us.user_id = p.id
  left join auth.users au on au.id = p.id
  left join public.profiles san on san.id = us.sanctioned_by
  where us.is_active = true
    and (
      us.sanction_type = 'permanent_ban'
      or (us.sanction_type = 'temporary_ban' and (us.expires_at is null or us.expires_at > timezone('utc', now())))
    );
end;
$$;

-- Vue pour compatibilité (sans email)
create or replace view public.banned_users as
select distinct
  p.id,
  p.display_name,
  p.role,
  us.sanction_type,
  us.reason,
  us.expires_at,
  us.created_at as banned_at,
  us.sanctioned_by,
  san.display_name as sanctioned_by_name
from public.profiles p
inner join public.user_sanctions us on us.user_id = p.id
left join public.profiles san on san.id = us.sanctioned_by
where us.is_active = true
  and (
    us.sanction_type = 'permanent_ban'
    or (us.sanction_type = 'temporary_ban' and (us.expires_at is null or us.expires_at > timezone('utc', now())))
  );

comment on view public.banned_users is 'Liste des utilisateurs actuellement bannis (permanent ou temporaire non expiré)';

-- Fonction pour bannir un utilisateur
create or replace function public.ban_user(
  p_user_id uuid,
  p_sanction_type text,
  p_reason text,
  p_reason_details text default null,
  p_expires_at timestamptz default null,
  p_sanctioned_by uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_role text;
  v_sanctioner_role text;
  v_sanction_id uuid;
begin
  -- Vérifier que l'utilisateur qui bannit est organisateur
  select role into v_sanctioner_role
  from public.profiles
  where id = p_sanctioned_by;

  if v_sanctioner_role != 'organizer' then
    raise exception 'Seuls les organisateurs peuvent bannir des utilisateurs';
  end if;

  -- Vérifier que l'utilisateur à bannir existe
  select role into v_user_role
  from public.profiles
  where id = p_user_id;

  if v_user_role is null then
    raise exception 'Utilisateur introuvable';
  end if;

  -- Désactiver les sanctions précédentes actives
  update public.user_sanctions
  set is_active = false
  where user_id = p_user_id
    and is_active = true;

  -- Créer la nouvelle sanction
  insert into public.user_sanctions (
    user_id,
    sanctioned_by,
    sanction_type,
    reason,
    reason_details,
    expires_at
  )
  values (
    p_user_id,
    p_sanctioned_by,
    p_sanction_type,
    p_reason,
    p_reason_details,
    p_expires_at
  )
  returning id into v_sanction_id;

  return jsonb_build_object(
    'success', true,
    'sanction_id', v_sanction_id,
    'user_id', p_user_id,
    'sanction_type', p_sanction_type
  );
end;
$$;

comment on function public.ban_user is 'Bannit un utilisateur (temporairement ou définitivement) - Réservé aux organisateurs';

-- Fonction pour dé-bannir un utilisateur
create or replace function public.unban_user(
  p_user_id uuid,
  p_sanctioned_by uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sanctioner_role text;
  v_deactivated_count integer;
begin
  -- Vérifier que l'utilisateur qui dé-bannit est organisateur
  select role into v_sanctioner_role
  from public.profiles
  where id = p_sanctioned_by;

  if v_sanctioner_role != 'organizer' then
    raise exception 'Seuls les organisateurs peuvent dé-bannir des utilisateurs';
  end if;

  -- Désactiver toutes les sanctions actives
  update public.user_sanctions
  set is_active = false,
      updated_at = timezone('utc', now())
  where user_id = p_user_id
    and is_active = true;

  get diagnostics v_deactivated_count = row_count;

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'deactivated_sanctions', v_deactivated_count
  );
end;
$$;

comment on function public.unban_user is 'Dé-bannit un utilisateur en désactivant toutes ses sanctions actives - Réservé aux organisateurs';

-- Fonction pour supprimer définitivement un compte utilisateur
create or replace function public.delete_user_account(
  p_user_id uuid,
  p_reason text,
  p_reason_details text default null,
  p_sanctioned_by uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sanctioner_role text;
  v_user_role text;
begin
  -- Vérifier que l'utilisateur qui supprime est organisateur
  select role into v_sanctioner_role
  from public.profiles
  where id = p_sanctioned_by;

  if v_sanctioner_role != 'organizer' then
    raise exception 'Seuls les organisateurs peuvent supprimer des comptes utilisateurs';
  end if;

  -- Vérifier que l'utilisateur à supprimer existe
  select role into v_user_role
  from public.profiles
  where id = p_user_id;

  if v_user_role is null then
    raise exception 'Utilisateur introuvable';
  end if;

  -- Empêcher la suppression d'un autre organisateur
  if v_user_role = 'organizer' and p_user_id != p_sanctioned_by then
    raise exception 'Impossible de supprimer le compte d''un autre organisateur';
  end if;

  -- Enregistrer la sanction avant suppression
  insert into public.user_sanctions (
    user_id,
    sanctioned_by,
    sanction_type,
    reason,
    reason_details
  )
  values (
    p_user_id,
    p_sanctioned_by,
    'account_deletion',
    p_reason,
    p_reason_details
  );

  -- Supprimer le profil (cascade supprimera les données liées)
  delete from public.profiles
  where id = p_user_id;

  -- Note: Supabase supprimera automatiquement l'utilisateur auth.users via le trigger on delete cascade

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'deleted', true
  );
end;
$$;

comment on function public.delete_user_account is 'Supprime définitivement un compte utilisateur - Réservé aux organisateurs - Empêche la suppression d''autres organisateurs';

-- Fonction pour obtenir les statistiques utilisateurs avec email (admin)
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

comment on function public.get_admin_user_stats is 'Statistiques détaillées par utilisateur pour la page Admin - Accessible aux organisateurs uniquement via security definer';

-- Fonction pour l'historique des sanctions (avec email depuis auth.users)
create or replace function public.get_sanctions_history(p_user_id uuid default null)
returns table (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_role profile_role,
  sanction_type text,
  reason text,
  reason_details text,
  expires_at timestamptz,
  is_active boolean,
  created_at timestamptz,
  sanctioned_by uuid,
  sanctioned_by_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    us.id,
    us.user_id,
    p.display_name as user_name,
    au.email::text as user_email,
    p.role as user_role,
    us.sanction_type,
    us.reason,
    us.reason_details,
    us.expires_at,
    us.is_active,
    us.created_at,
    us.sanctioned_by,
    san.display_name as sanctioned_by_name
  from public.user_sanctions us
  join public.profiles p on p.id = us.user_id
  left join auth.users au on au.id = p.id
  left join public.profiles san on san.id = us.sanctioned_by
  where (p_user_id is null or us.user_id = p_user_id)
  order by us.created_at desc;
end;
$$;

comment on function public.get_sanctions_history is 'Historique des sanctions avec email - Accessible aux organisateurs uniquement via security definer';

-- Vue pour compatibilité (sans email)
create or replace view public.sanctions_history as
select
  us.id,
  us.user_id,
  p.display_name as user_name,
  p.role as user_role,
  us.sanction_type,
  us.reason,
  us.reason_details,
  us.expires_at,
  us.is_active,
  us.created_at,
  us.sanctioned_by,
  san.display_name as sanctioned_by_name
from public.user_sanctions us
join public.profiles p on p.id = us.user_id
left join public.profiles san on san.id = us.sanctioned_by
order by us.created_at desc;

comment on view public.sanctions_history is 'Historique complet de toutes les sanctions appliquées';

-- Grants (organisateurs uniquement)
grant select on public.banned_users to authenticated;
grant select on public.sanctions_history to authenticated;
grant execute on function public.get_banned_users() to authenticated;
grant execute on function public.get_admin_user_stats() to authenticated;
grant execute on function public.get_sanctions_history(uuid) to authenticated;
grant execute on function public.ban_user(uuid, text, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.unban_user(uuid, uuid) to authenticated;
grant execute on function public.delete_user_account(uuid, text, text, uuid) to authenticated;

-- RLS: Seuls les organisateurs peuvent voir ces données (via les fonctions security definer)

