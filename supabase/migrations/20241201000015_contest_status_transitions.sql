-- Migration: State Machine pour transitions de statut des concours
-- Définit les règles de transition et automatise certaines transitions

-- Table pour stocker l'historique des transitions de statut
create table if not exists public.contest_status_history (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  change_reason text,
  is_automatic boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- Index pour optimiser les requêtes
create index if not exists contest_status_history_contest_id_idx on public.contest_status_history(contest_id);
create index if not exists contest_status_history_created_at_idx on public.contest_status_history(created_at desc);

-- Fonction pour valider une transition de statut
create or replace function public.validate_contest_status_transition(
  p_old_status text,
  p_new_status text,
  p_changed_by_role text
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_valid_transitions jsonb := jsonb_build_object(
    'draft', jsonb_build_array('registration'),
    'registration', jsonb_build_array('judging', 'draft'), -- Retour draft si annulation
    'judging', jsonb_build_array('completed', 'registration'), -- Retour registration si pause
    'completed', jsonb_build_array('archived'),
    'archived', jsonb_build_array() -- Archivé est terminal
  );
  
  v_allowed_transitions jsonb;
  v_is_valid boolean := false;
begin
  -- Récupérer les transitions autorisées depuis l'ancien statut
  v_allowed_transitions := v_valid_transitions->p_old_status;
  
  -- Vérifier si la transition est autorisée
  v_is_valid := v_new_status = any(
    select jsonb_array_elements_text(v_allowed_transitions)
  );
  
  -- Vérifications spéciales selon le rôle
  if p_new_status = 'archived' and p_changed_by_role != 'organizer' then
    v_is_valid := false;
  end if;
  
  if p_old_status = 'draft' and p_new_status = 'registration' and p_changed_by_role != 'organizer' then
    v_is_valid := false;
  end if;
  
  return jsonb_build_object(
    'valid', v_is_valid,
    'allowed_transitions', v_allowed_transitions,
    'message', case
      when not v_is_valid then 'Transition non autorisée de ' || coalesce(p_old_status, 'NULL') || ' vers ' || p_new_status
      else 'Transition valide'
    end
  );
end;
$$;

comment on function public.validate_contest_status_transition is 'Valide si une transition de statut de concours est autorisée selon les règles de la state machine';

-- Fonction pour changer le statut d'un concours avec validation
create or replace function public.change_contest_status(
  p_contest_id uuid,
  p_new_status text,
  p_reason text default null,
  p_changed_by uuid default null,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_old_status text;
  v_changed_by_role text;
  v_validation jsonb;
  v_result jsonb;
begin
  -- Récupérer l'ancien statut
  select status into v_old_status
  from public.contests
  where id = p_contest_id;
  
  if v_old_status is null then
    return jsonb_build_object(
      'success', false,
      'error', 'contest_not_found',
      'message', 'Concours introuvable'
    );
  end if;
  
  -- Si le nouveau statut est identique, rien à faire
  if v_old_status = p_new_status then
    return jsonb_build_object(
      'success', true,
      'message', 'Le concours est déjà dans ce statut',
      'old_status', v_old_status,
      'new_status', p_new_status
    );
  end if;
  
  -- Récupérer le rôle de l'utilisateur
  select role into v_changed_by_role
  from public.profiles
  where id = coalesce(p_changed_by, auth.uid());
  
  -- Valider la transition
  v_validation := public.validate_contest_status_transition(
    v_old_status,
    p_new_status,
    coalesce(v_changed_by_role, 'viewer')
  );
  
  -- Si non valide et pas forcé, retourner erreur
  if not (v_validation->>'valid')::boolean and not p_force then
    return jsonb_build_object(
      'success', false,
      'error', 'invalid_transition',
      'message', v_validation->>'message',
      'allowed_transitions', v_validation->'allowed_transitions'
    );
  end if;
  
  -- Effectuer le changement de statut
  update public.contests
  set status = p_new_status::contest_status
  where id = p_contest_id;
  
  -- Enregistrer dans l'historique
  insert into public.contest_status_history (
    contest_id,
    old_status,
    new_status,
    changed_by,
    change_reason,
    is_automatic
  )
  values (
    p_contest_id,
    v_old_status,
    p_new_status,
    coalesce(p_changed_by, auth.uid()),
    p_reason,
    false
  );
  
  return jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status,
    'message', 'Statut modifié avec succès'
  );
end;
$$;

comment on function public.change_contest_status is 'Change le statut d''un concours avec validation de la transition et enregistrement dans l''historique';

-- Fonction pour automatiser les transitions basées sur les dates
create or replace function public.auto_transition_contest_statuses()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_contest record;
  v_transitions_count integer := 0;
  v_transitions jsonb := jsonb_build_array();
  v_now timestamptz := timezone('utc', now());
begin
  -- Transition automatique : registration → judging quand registration_close_date est atteinte
  for v_contest in
    select id, status, registration_close_date
    from public.contests
    where status = 'registration'
      and registration_close_date is not null
      and registration_close_date <= v_now
  loop
    -- Vérifier qu'il y a au moins une entrée soumise
    if exists (
      select 1 from public.entries
      where contest_id = v_contest.id
        and status in ('submitted', 'under_review', 'approved')
    ) then
      -- Effectuer la transition
      perform public.change_contest_status(
        v_contest.id,
        'judging',
        'Transition automatique : date limite d''inscription atteinte',
        null,
        true -- Force la transition même si l'utilisateur n'est pas organisateur (c'est automatique)
      );
      
      -- Enregistrer comme automatique dans l'historique
      update public.contest_status_history
      set is_automatic = true
      where contest_id = v_contest.id
        and new_status = 'judging'
        and created_at > v_now - interval '1 minute';
      
      v_transitions_count := v_transitions_count + 1;
      v_transitions := v_transitions || jsonb_build_object(
        'contest_id', v_contest.id,
        'transition', 'registration → judging',
        'reason', 'Date limite d''inscription atteinte'
      );
    end if;
  end loop;
  
  return jsonb_build_object(
    'success', true,
    'transitions_count', v_transitions_count,
    'transitions', v_transitions,
    'timestamp', v_now
  );
end;
$$;

comment on function public.auto_transition_contest_statuses is 'Déclenche les transitions automatiques de statut basées sur les dates (appelé par un job/cron)';

-- Fonction pour obtenir les transitions possibles pour un concours
create or replace function public.get_contest_allowed_transitions(
  p_contest_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_current_status text;
  v_user_role text;
  v_transitions jsonb := jsonb_build_object(
    'draft', jsonb_build_array(
      jsonb_build_object('status', 'registration', 'label', 'Ouvrir les inscriptions', 'requires_organizer', true)
    ),
    'registration', jsonb_build_array(
      jsonb_build_object('status', 'judging', 'label', 'Démarrer les évaluations', 'requires_organizer', false),
      jsonb_build_object('status', 'draft', 'label', 'Annuler et revenir au brouillon', 'requires_organizer', true)
    ),
    'judging', jsonb_build_array(
      jsonb_build_object('status', 'completed', 'label', 'Finaliser le concours', 'requires_organizer', false),
      jsonb_build_object('status', 'registration', 'label', 'Mettre en pause (retour inscriptions)', 'requires_organizer', true)
    ),
    'completed', jsonb_build_array(
      jsonb_build_object('status', 'archived', 'label', 'Archiver', 'requires_organizer', true)
    ),
    'archived', jsonb_build_array()
  );
begin
  -- Récupérer le statut actuel
  select status into v_current_status
  from public.contests
  where id = p_contest_id;
  
  -- Récupérer le rôle de l'utilisateur
  select role into v_user_role
  from public.profiles
  where id = auth.uid();
  
  -- Filtrer les transitions selon le rôle
  return jsonb_build_object(
    'current_status', v_current_status,
    'allowed_transitions', (
      select jsonb_agg(transition)
      from jsonb_array_elements(v_transitions->v_current_status) as transition
      where not (transition->>'requires_organizer')::boolean or v_user_role = 'organizer'
    ),
    'user_role', v_user_role
  );
end;
$$;

comment on function public.get_contest_allowed_transitions is 'Retourne les transitions possibles pour un concours selon le statut actuel et le rôle de l''utilisateur';

-- Vue pour l'historique des changements de statut
create or replace view public.contest_status_changes as
select
  csh.id,
  csh.contest_id,
  c.name as contest_name,
  csh.old_status,
  csh.new_status,
  csh.change_reason,
  csh.is_automatic,
  p.display_name as changed_by_name,
  csh.created_at
from public.contest_status_history csh
join public.contests c on c.id = csh.contest_id
left join public.profiles p on p.id = csh.changed_by
order by csh.created_at desc;

comment on view public.contest_status_changes is 'Vue de l''historique complet des changements de statut des concours';

-- Trigger pour enregistrer automatiquement les changements de statut (fallback)
create or replace function public.log_contest_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.status != new.status then
    insert into public.contest_status_history (
      contest_id,
      old_status,
      new_status,
      changed_by,
      is_automatic
    )
    values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      false
    );
  end if;
  return new;
end;
$$;

comment on function public.log_contest_status_change is 'Trigger pour logger automatiquement les changements de statut (fallback si la fonction change_contest_status n''est pas utilisée)';

-- Créer le trigger (désactivé par défaut car on préfère utiliser la fonction change_contest_status)
-- drop trigger if exists log_contest_status_change_trigger on public.contests;
-- create trigger log_contest_status_change_trigger
--   after update of status on public.contests
--   for each row
--   execute function public.log_contest_status_change();

-- RLS Policies
alter table public.contest_status_history enable row level security;

-- Les organisateurs peuvent voir l'historique de tous les concours
do $$ begin
  create policy "Organizers can view contest status history"
    on public.contest_status_history
    for select
    using (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'organizer'
      )
      or auth.role() = 'service_role'
    );
exception
  when duplicate_object then null;
end $$;

-- Les utilisateurs peuvent voir l'historique des concours publics (approuvés)
do $$ begin
  create policy "Users can view public contest status history"
    on public.contest_status_history
    for select
    using (
      exists (
        select 1 from public.contests c
        where c.id = contest_status_history.contest_id
          and c.status != 'draft'
      )
      or auth.role() = 'service_role'
    );
exception
  when duplicate_object then null;
end $$;

-- Grants
grant execute on function public.validate_contest_status_transition(text, text, text) to authenticated;
grant execute on function public.change_contest_status(uuid, text, text, uuid, boolean) to authenticated;
grant execute on function public.auto_transition_contest_statuses() to authenticated;
grant execute on function public.get_contest_allowed_transitions(uuid) to authenticated;
grant select on public.contest_status_changes to authenticated;

-- Commentaires
comment on table public.contest_status_history is 'Historique des changements de statut des concours pour traçabilité complète';

