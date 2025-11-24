-- Fonction pour créer automatiquement un profil lors de l'inscription d'un utilisateur
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

  -- Récupérer le rôle depuis les metadata, sinon utiliser 'viewer' par défaut
  role_text := new.raw_user_meta_data->>'role';
  
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
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger qui s'exécute après l'insertion d'un nouvel utilisateur dans auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
