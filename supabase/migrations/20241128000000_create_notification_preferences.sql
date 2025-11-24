-- Migration: Création de la table des préférences de notification
-- Date: 2024-11-28

-- Table des préférences de notification par utilisateur
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  
  -- Préférences email (par défaut activées)
  email_enabled boolean not null default true,
  email_contest_created boolean not null default true,
  email_entry_approved boolean not null default true,
  email_judge_assigned boolean not null default true,
  email_results_published boolean not null default true,
  email_vote_received boolean not null default false,
  email_score_received boolean not null default false,
  
  -- Préférences notifications in-app (toujours activées, mais on peut les désactiver pour certains types)
  in_app_enabled boolean not null default true,
  in_app_contest_created boolean not null default true,
  in_app_entry_approved boolean not null default true,
  in_app_judge_assigned boolean not null default true,
  in_app_results_published boolean not null default true,
  in_app_vote_received boolean not null default true,
  in_app_score_received boolean not null default true,
  
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Index pour optimiser les requêtes
create index if not exists notification_preferences_user_id_idx on public.notification_preferences(user_id);

-- Trigger pour updated_at
drop trigger if exists handle_notification_preferences_updated on public.notification_preferences;
create trigger handle_notification_preferences_updated
  before update on public.notification_preferences
  for each row
  execute function public.handle_updated_at();

-- Fonction pour créer automatiquement les préférences par défaut lors de la création d'un profil
create or replace function public.create_default_notification_preferences()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger pour créer les préférences par défaut
drop trigger if exists on_profile_created_create_preferences on public.profiles;
create trigger on_profile_created_create_preferences
  after insert on public.profiles
  for each row
  execute function public.create_default_notification_preferences();

-- RLS Policies pour notification_preferences
do $$ begin
  create policy "Users can view their own notification preferences"
    on public.notification_preferences
    for select
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update their own notification preferences"
    on public.notification_preferences
    for update
    using (auth.uid() = user_id or auth.role() = 'service_role')
    with check (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert their own notification preferences"
    on public.notification_preferences
    for insert
    with check (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

