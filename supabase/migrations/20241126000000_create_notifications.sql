-- Migration: Création du système de notifications
-- Date: 2024-11-26

-- Type enum pour les types de notifications
do $$ begin
  create type notification_type as enum (
    'contest_created',
    'contest_started',
    'contest_completed',
    'entry_submitted',
    'entry_approved',
    'entry_rejected',
    'judge_assigned',
    'judge_invitation',
    'vote_received',
    'score_received',
    'results_published'
  );
exception
  when duplicate_object then null;
end $$;

-- Table des notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  link text, -- URL vers la ressource concernée
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  metadata jsonb -- Données supplémentaires (contest_id, entry_id, etc.)
);

-- Index pour optimiser les requêtes
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read);

-- RLS Policies pour les notifications
do $$ begin
  create policy "Users can view their own notifications"
    on public.notifications
    for select
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update their own notifications"
    on public.notifications
    for update
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role can insert notifications"
    on public.notifications
    for insert
    with check (auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

-- Fonction pour créer une notification
create or replace function public.create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_link text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_notification_id uuid;
begin
  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata
  )
  values (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata
  )
  returning id into v_notification_id;
  
  return v_notification_id;
end;
$$;

-- Fonction pour créer des notifications lors de la création d'un concours
create or replace function public.notify_contest_created()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Notifier tous les producteurs et juges
  insert into public.notifications (user_id, type, title, message, link, metadata)
  select
    p.id,
    'contest_created'::notification_type,
    'Nouveau concours disponible',
    'Le concours "' || new.name || '" est maintenant ouvert aux inscriptions.',
    '/contests',
    jsonb_build_object('contest_id', new.id, 'contest_name', new.name)
  from public.profiles p
  where p.role in ('producer', 'judge', 'viewer');
  
  return new;
end;
$$;

-- Trigger pour notifier lors de la création d'un concours
drop trigger if exists on_contest_created_notify on public.contests;
create trigger on_contest_created_notify
  after insert on public.contests
  for each row
  when (new.status = 'registration')
  execute function public.notify_contest_created();

-- Fonction pour notifier lors de l'approbation d'une entrée
create or replace function public.notify_entry_approved()
returns trigger
language plpgsql
security definer
as $$
declare
  v_contest_name text;
begin
  -- Récupérer le nom du concours
  select c.name into v_contest_name
  from public.contests c
  where c.id = new.contest_id;
  
  -- Notifier le producteur
  if new.status = 'approved' and (old.status is null or old.status != 'approved') then
    insert into public.notifications (user_id, type, title, message, link, metadata)
    values (
      new.producer_id,
      'entry_approved'::notification_type,
      'Entrée approuvée',
      'Votre entrée "' || new.strain_name || '" pour le concours "' || v_contest_name || '" a été approuvée.',
      '/contests',
      jsonb_build_object('entry_id', new.id, 'contest_id', new.contest_id)
    );
  end if;
  
  return new;
end;
$$;

-- Trigger pour notifier lors de l'approbation d'une entrée
drop trigger if exists on_entry_approved_notify on public.entries;
create trigger on_entry_approved_notify
  after update of status on public.entries
  for each row
  when (new.status = 'approved' and (old.status is null or old.status != 'approved'))
  execute function public.notify_entry_approved();

-- Fonction pour notifier lors de l'assignation d'un juge
create or replace function public.notify_judge_assigned()
returns trigger
language plpgsql
security definer
as $$
declare
  v_contest_name text;
begin
  -- Récupérer le nom du concours
  select c.name into v_contest_name
  from public.contests c
  where c.id = new.contest_id;
  
  -- Notifier le juge
  insert into public.notifications (user_id, type, title, message, link, metadata)
  values (
    new.judge_id,
    'judge_assigned'::notification_type,
    'Invitation à juger',
    'Vous avez été invité à juger le concours "' || v_contest_name || '".',
    '/manage-contest-judges/' || new.contest_id::text,
    jsonb_build_object('contest_id', new.contest_id, 'assignment_id', new.id)
  );
  
  return new;
end;
$$;

-- Trigger pour notifier lors de l'assignation d'un juge
drop trigger if exists on_judge_assigned_notify on public.contest_judges;
create trigger on_judge_assigned_notify
  after insert on public.contest_judges
  for each row
  execute function public.notify_judge_assigned();

