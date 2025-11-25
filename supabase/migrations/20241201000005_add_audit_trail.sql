-- Migration: Système d'audit trail pour traçabilité complète
-- Permet de logger toutes les modifications critiques sur les entrées

-- Créer un type enum pour les actions d'audit
do $$ begin
  create type audit_action as enum (
    'created',
    'updated',
    'status_changed',
    'thc_modified',
    'coa_modified',
    'coa_validated',
    'coa_rejected',
    'score_modified',
    'deleted'
  );
exception
  when duplicate_object then null;
end $$;

-- Créer la table d'audit log
create table if not exists public.entry_audit_log (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action audit_action not null,
  field_changed text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Index pour optimiser les requêtes
create index if not exists entry_audit_log_entry_idx on public.entry_audit_log(entry_id);
create index if not exists entry_audit_log_user_idx on public.entry_audit_log(user_id);
create index if not exists entry_audit_log_action_idx on public.entry_audit_log(action);
create index if not exists entry_audit_log_created_idx on public.entry_audit_log(created_at desc);
create index if not exists entry_audit_log_entry_created_idx on public.entry_audit_log(entry_id, created_at desc);

-- Activer RLS
alter table public.entry_audit_log enable row level security;

-- Politique RLS : les organisateurs et les producteurs propriétaires peuvent voir les logs
do $$ begin
  create policy "Organizers and producers can view audit logs"
    on public.entry_audit_log
    for select
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        where e.id = entry_audit_log.entry_id
        and (
          e.producer_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'organizer'
          )
        )
      )
    );
exception
  when duplicate_object then null;
end $$;

-- Fonction helper pour logger les changements
create or replace function public.log_entry_audit(
  p_entry_id uuid,
  p_action audit_action,
  p_field_changed text default null,
  p_old_value jsonb default null,
  p_new_value jsonb default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_ip_address inet;
  v_user_agent text;
begin
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  -- Pour l'instant, on ne peut pas récupérer IP et user_agent depuis PostgreSQL
  -- Ces informations devront être passées depuis l'application si nécessaire
  
  -- Insérer le log
  insert into public.entry_audit_log (
    entry_id,
    user_id,
    action,
    field_changed,
    old_value,
    new_value,
    reason
  ) values (
    p_entry_id,
    v_user_id,
    p_action,
    p_field_changed,
    p_old_value,
    p_new_value,
    p_reason
  );
end;
$$;

-- Trigger pour logger les changements de statut
create or replace function public.log_entry_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.status is distinct from new.status then
    perform public.log_entry_audit(
      new.id,
      'status_changed'::audit_action,
      'status',
      to_jsonb(old.status::text),
      to_jsonb(new.status::text),
      null
    );
  end if;
  return new;
end;
$$;

-- Trigger pour logger les modifications THC
create or replace function public.log_entry_thc_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.thc_percent is distinct from new.thc_percent then
    perform public.log_entry_audit(
      new.id,
      'thc_modified'::audit_action,
      'thc_percent',
      to_jsonb(old.thc_percent),
      to_jsonb(new.thc_percent),
      null
    );
  end if;
  return new;
end;
$$;

-- Trigger pour logger les modifications COA
create or replace function public.log_entry_coa_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.coa_url is distinct from new.coa_url then
    perform public.log_entry_audit(
      new.id,
      'coa_modified'::audit_action,
      'coa_url',
      to_jsonb(old.coa_url),
      to_jsonb(new.coa_url),
      null
    );
  end if;
  
  -- Logger les changements de validation COA
  if old.coa_validated is distinct from new.coa_validated then
    if new.coa_validated = true then
      perform public.log_entry_audit(
        new.id,
        'coa_validated'::audit_action,
        'coa_validated',
        to_jsonb(old.coa_validated),
        to_jsonb(new.coa_validated),
        new.coa_validation_notes
      );
    else
      perform public.log_entry_audit(
        new.id,
        'coa_rejected'::audit_action,
        'coa_validated',
        to_jsonb(old.coa_validated),
        to_jsonb(new.coa_validated),
        new.coa_validation_notes
      );
    end if;
  end if;
  
  return new;
end;
$$;

-- Trigger pour logger la création d'entrées
create or replace function public.log_entry_creation()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.log_entry_audit(
    new.id,
    'created'::audit_action,
    null,
    null,
    jsonb_build_object(
      'strain_name', new.strain_name,
      'contest_id', new.contest_id,
      'status', new.status::text
    ),
    null
  );
  return new;
end;
$$;

-- Trigger pour logger les modifications générales
create or replace function public.log_entry_updates()
returns trigger
language plpgsql
security definer
as $$
declare
  changed_fields text[];
  field_name text;
begin
  changed_fields := array[]::text[];
  
  -- Liste des champs à tracker (exclure updated_at)
  if old.strain_name is distinct from new.strain_name then
    changed_fields := array_append(changed_fields, 'strain_name');
    perform public.log_entry_audit(
      new.id,
      'updated'::audit_action,
      'strain_name',
      to_jsonb(old.strain_name),
      to_jsonb(new.strain_name),
      null
    );
  end if;
  
  if old.cbd_percent is distinct from new.cbd_percent then
    perform public.log_entry_audit(
      new.id,
      'updated'::audit_action,
      'cbd_percent',
      to_jsonb(old.cbd_percent),
      to_jsonb(new.cbd_percent),
      null
    );
  end if;
  
  -- Les autres champs critiques sont gérés par leurs triggers spécifiques
  -- (status, thc_percent, coa_url, coa_validated)
  
  return new;
end;
$$;

-- Créer les triggers
drop trigger if exists entry_audit_creation on public.entries;
create trigger entry_audit_creation
  after insert on public.entries
  for each row
  execute function public.log_entry_creation();

drop trigger if exists entry_audit_status_change on public.entries;
create trigger entry_audit_status_change
  after update on public.entries
  for each row
  execute function public.log_entry_status_change();

drop trigger if exists entry_audit_thc_change on public.entries;
create trigger entry_audit_thc_change
  after update on public.entries
  for each row
  execute function public.log_entry_thc_change();

drop trigger if exists entry_audit_coa_change on public.entries;
create trigger entry_audit_coa_change
  after update on public.entries
  for each row
  execute function public.log_entry_coa_change();

drop trigger if exists entry_audit_updates on public.entries;
create trigger entry_audit_updates
  after update on public.entries
  for each row
  execute function public.log_entry_updates();

-- Vue pour faciliter l'accès aux logs avec informations utilisateur
create or replace view public.entry_audit_log_with_user as
select
  al.id,
  al.entry_id,
  al.user_id,
  al.action,
  al.field_changed,
  al.old_value,
  al.new_value,
  al.reason,
  al.ip_address,
  al.user_agent,
  al.created_at,
  p.display_name as user_display_name,
  p.role as user_role,
  e.strain_name as entry_strain_name,
  e.contest_id
from public.entry_audit_log al
left join public.profiles p on p.id = al.user_id
left join public.entries e on e.id = al.entry_id;

-- Commentaires
comment on table public.entry_audit_log is 'Journal d''audit pour tracer toutes les modifications sur les entrées';
comment on column public.entry_audit_log.action is 'Type d''action effectuée (created, updated, status_changed, etc.)';
comment on column public.entry_audit_log.field_changed is 'Nom du champ modifié (si applicable)';
comment on column public.entry_audit_log.old_value is 'Ancienne valeur (format JSONB)';
comment on column public.entry_audit_log.new_value is 'Nouvelle valeur (format JSONB)';
comment on column public.entry_audit_log.reason is 'Raison optionnelle de la modification';
comment on function public.log_entry_audit is 'Fonction helper pour logger une action d''audit';

