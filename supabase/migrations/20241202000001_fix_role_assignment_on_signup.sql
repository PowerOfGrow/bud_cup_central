-- Migration: Correction de l'assignation du rôle lors de l'inscription
-- Problème: Le rôle peut ne pas être correctement récupéré depuis les metadata lors de la création du profil
-- Solution: Améliorer le trigger pour mieux gérer le rôle et ajouter une fonction de correction

-- Fonction pour corriger le rôle d'un utilisateur
create or replace function public.fix_user_role(user_id_param uuid)
returns void
language plpgsql
security definer
as $$
declare
  user_role_text text;
  user_role_value profile_role;
begin
  -- Récupérer le rôle depuis les metadata de l'utilisateur dans auth.users
  select 
    raw_user_meta_data->>'role'
  into user_role_text
  from auth.users
  where id = user_id_param;

  -- Vérifier si le rôle est valide
  if user_role_text in ('organizer', 'producer', 'judge', 'viewer') then
    user_role_value := user_role_text::profile_role;
    
    -- Mettre à jour le profil avec le bon rôle
    update public.profiles
    set role = user_role_value
    where id = user_id_param
      and role != user_role_value;
  end if;
end;
$$;

comment on function public.fix_user_role is 'Corrige le rôle d''un utilisateur en se basant sur ses metadata auth.users';

-- Améliorer la fonction handle_new_user pour mieux gérer le rôle
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  display_name_value text;
  role_value profile_role;
  role_text text;
begin
  -- Récupérer le display_name depuis les metadata de l'utilisateur
  display_name_value := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  -- Récupérer le rôle depuis les metadata
  -- Essayer d'abord raw_user_meta_data, puis raw_app_meta_data
  role_text := coalesce(
    new.raw_user_meta_data->>'role',
    new.raw_app_meta_data->>'role',
    null
  );
  
  -- Vérifier si le rôle est valide, sinon utiliser 'viewer' par défaut
  if role_text in ('organizer', 'producer', 'judge', 'viewer') then
    role_value := role_text::profile_role;
  else
    role_value := 'viewer'::profile_role;
  end if;

  -- Créer le profil dans la table profiles
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    display_name_value,
    role_value
  )
  on conflict (id) do update
    set role = excluded.role,
        display_name = excluded.display_name
    where profiles.role != excluded.role;

  return new;
end;
$$;

comment on function public.handle_new_user is 'Crée ou met à jour automatiquement un profil lors de l''inscription d''un utilisateur, avec gestion améliorée du rôle';

