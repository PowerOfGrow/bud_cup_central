-- Migration: Système de tracking de l'onboarding par utilisateur
-- Permet de suivre la progression de l'onboarding et d'afficher les étapes appropriées

-- Table pour stocker l'état de l'onboarding par utilisateur
create table if not exists public.user_onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  role profile_role not null,
  onboarding_completed boolean not null default false,
  current_step integer not null default 1,
  completed_steps jsonb not null default '[]'::jsonb,
  skipped boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.user_onboarding is 'Suivi de la progression de l''onboarding pour chaque utilisateur par rôle';

-- Index pour performance
create index if not exists user_onboarding_user_idx on public.user_onboarding(user_id);
create index if not exists user_onboarding_completed_idx on public.user_onboarding(onboarding_completed, skipped);

-- Trigger pour updated_at
create trigger handle_user_onboarding_updated
  before update on public.user_onboarding
  for each row
  execute function public.handle_updated_at();

-- Fonction pour créer un onboarding pour un nouvel utilisateur
create or replace function public.create_user_onboarding()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_onboarding (user_id, role)
  values (new.id, new.role)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

comment on function public.create_user_onboarding is 'Crée automatiquement un enregistrement d''onboarding lors de la création d''un profil';

-- Trigger pour créer l'onboarding automatiquement
drop trigger if exists trigger_create_user_onboarding on public.profiles;
create trigger trigger_create_user_onboarding
  after insert on public.profiles
  for each row
  execute function public.create_user_onboarding();

-- Fonction pour marquer une étape comme complétée
create or replace function public.complete_onboarding_step(
  p_user_id uuid,
  p_step_number integer
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_current jsonb;
  v_onboarding public.user_onboarding%rowtype;
begin
  -- Récupérer l'état actuel
  select * into v_onboarding
  from public.user_onboarding
  where user_id = p_user_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Onboarding not found');
  end if;
  
  -- Ajouter l'étape aux étapes complétées si pas déjà présente
  v_current := coalesce(v_onboarding.completed_steps, '[]'::jsonb);
  
  if not (v_current @> jsonb_build_array(p_step_number)) then
    v_current := v_current || jsonb_build_array(p_step_number);
    
    update public.user_onboarding
    set 
      completed_steps = v_current,
      current_step = greatest(p_step_number + 1, current_step),
      updated_at = timezone('utc', now())
    where user_id = p_user_id;
  end if;
  
  -- Récupérer le current_step mis à jour
  select current_step into v_onboarding.current_step
  from public.user_onboarding
  where user_id = p_user_id;
  
  return jsonb_build_object(
    'success', true,
    'completed_steps', v_current,
    'current_step', v_onboarding.current_step
  );
end;
$$;

comment on function public.complete_onboarding_step is 'Marque une étape d''onboarding comme complétée pour un utilisateur';

-- Fonction pour compléter tout l'onboarding
create or replace function public.complete_onboarding(
  p_user_id uuid,
  p_skip boolean default false
)
returns jsonb
language plpgsql
security definer
as $$
begin
  update public.user_onboarding
  set 
    onboarding_completed = true,
    skipped = p_skip,
    completed_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where user_id = p_user_id;
  
  return jsonb_build_object('success', true);
end;
$$;

comment on function public.complete_onboarding is 'Marque l''onboarding comme complété (ou skippé) pour un utilisateur';

-- Fonction pour réinitialiser l'onboarding (pour tests ou réaffichage)
create or replace function public.reset_onboarding(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
begin
  update public.user_onboarding
  set 
    onboarding_completed = false,
    skipped = false,
    current_step = 1,
    completed_steps = '[]'::jsonb,
    completed_at = null,
    updated_at = timezone('utc', now())
  where user_id = p_user_id;
  
  return jsonb_build_object('success', true);
end;
$$;

comment on function public.reset_onboarding is 'Réinitialise l''onboarding d''un utilisateur (pour tests ou réaffichage)';

-- Grants
grant select, insert, update on public.user_onboarding to authenticated;
grant select on public.profiles to authenticated; -- Nécessaire pour la jointure
grant execute on function public.complete_onboarding_step(uuid, integer) to authenticated;
grant execute on function public.complete_onboarding(uuid, boolean) to authenticated;
grant execute on function public.reset_onboarding(uuid) to authenticated;

-- RLS Policies
alter table public.user_onboarding enable row level security;

-- Policy: Les utilisateurs peuvent voir uniquement leur propre onboarding
create policy "Users can view their own onboarding"
  on public.user_onboarding for select
  using (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour uniquement leur propre onboarding
create policy "Users can update their own onboarding"
  on public.user_onboarding for update
  using (auth.uid() = user_id);

