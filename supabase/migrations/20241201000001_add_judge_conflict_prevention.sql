-- Migration: Prévention des conflits d'intérêt pour les juges
-- Un juge ne peut pas évaluer ses propres entrées ou être assigné à un concours où il participe

-- Fonction pour vérifier si un juge est producteur dans un concours
create or replace function public.check_judge_producer_conflict(
  p_judge_id uuid,
  p_contest_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_has_entries integer;
begin
  -- Vérifier si le juge a des entrées dans ce concours
  select count(*) into v_has_entries
  from public.entries
  where contest_id = p_contest_id
    and producer_id = p_judge_id
    and status != 'rejected';

  -- Si le juge a des entrées, il y a un conflit
  if v_has_entries > 0 then
    raise exception '%', 
      format('Conflict of interest: Judge cannot be assigned to a contest where they have entries (%s entries found)', v_has_entries);
  end if;

  return false; -- Pas de conflit
end;
$$;

-- Fonction pour assigner un juge avec vérification de conflit
create or replace function public.assign_contest_judge(
  p_contest_id uuid,
  p_judge_id uuid,
  p_judge_role text default 'judge',
  p_invitation_status text default 'pending'
)
returns bigint
language plpgsql
security definer
as $$
declare
  v_assignment_id bigint;
begin
  -- Vérifier le conflit d'intérêt
  perform public.check_judge_producer_conflict(p_judge_id, p_contest_id);

  -- Insérer l'assignation
  insert into public.contest_judges (
    contest_id,
    judge_id,
    judge_role,
    invitation_status
  )
  values (
    p_contest_id,
    p_judge_id,
    p_judge_role,
    p_invitation_status
  )
  returning id into v_assignment_id;

  return v_assignment_id;
exception
  when unique_violation then
    raise exception 'Judge is already assigned to this contest';
end;
$$;

-- Fonction pour vérifier avant l'évaluation
create or replace function public.check_judge_entry_conflict(
  p_judge_id uuid,
  p_entry_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_is_producer boolean;
begin
  -- Vérifier si le juge est le producteur de cette entrée
  select exists(
    select 1
    from public.entries
    where id = p_entry_id
      and producer_id = p_judge_id
  ) into v_is_producer;

  if v_is_producer then
    raise exception 'Conflict of interest: Judge cannot evaluate their own entry';
  end if;

  return false; -- Pas de conflit
end;
$$;

-- Trigger pour empêcher l'assignation de juges producteurs
create or replace function public.prevent_judge_producer_assignment()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Vérifier le conflit avant l'insertion
  perform public.check_judge_producer_conflict(new.judge_id, new.contest_id);
  return new;
end;
$$;

-- Créer le trigger (on ignore les erreurs si déjà existant)
drop trigger if exists check_judge_conflict_before_assignment on public.contest_judges;
create trigger check_judge_conflict_before_assignment
  before insert on public.contest_judges
  for each row
  execute function public.prevent_judge_producer_assignment();

-- Trigger pour empêcher l'évaluation de ses propres entrées
create or replace function public.prevent_judge_own_entry_evaluation()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Vérifier le conflit avant l'insertion/update d'un score
  perform public.check_judge_entry_conflict(new.judge_id, new.entry_id);
  return new;
end;
$$;

-- Créer le trigger pour les scores
drop trigger if exists check_judge_entry_conflict_before_score on public.judge_scores;
create trigger check_judge_entry_conflict_before_score
  before insert or update on public.judge_scores
  for each row
  execute function public.prevent_judge_own_entry_evaluation();

-- Vue pour identifier les juges avec conflits potentiels dans un concours
create or replace view public.contest_judge_conflicts as
select
  c.id as contest_id,
  c.name as contest_name,
  p.id as judge_id,
  p.display_name as judge_name,
  p.role as judge_role,
  count(e.id) as entries_count,
  array_agg(e.strain_name) as entry_names
from public.contests c
cross join public.profiles p
left join public.entries e on e.contest_id = c.id
  and e.producer_id = p.id
  and e.status != 'rejected'
where p.role in ('judge', 'organizer')
  and exists (
    select 1 from public.contest_judges cj
    where cj.contest_id = c.id and cj.judge_id = p.id
  )
group by c.id, c.name, p.id, p.display_name, p.role
having count(e.id) > 0;

-- RLS pour la vue (organisateurs uniquement)
grant select on public.contest_judge_conflicts to authenticated;

-- Commentaires
comment on function public.check_judge_producer_conflict is 'Vérifie si un juge a des entrées dans un concours (conflit d''intérêt)';
comment on function public.assign_contest_judge is 'Assigner un juge à un concours avec vérification de conflit d''intérêt';
comment on function public.check_judge_entry_conflict is 'Vérifie si un juge est producteur de l''entrée qu''il évalue (conflit d''intérêt)';
comment on view public.contest_judge_conflicts is 'Liste des conflits d''intérêt détectés (juges avec entrées dans les concours où ils sont assignés)';

