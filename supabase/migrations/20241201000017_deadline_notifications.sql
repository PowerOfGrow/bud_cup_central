-- Migration: Système de notifications automatiques pour les deadlines
-- Détecte les deadlines approchant et crée des notifications pour les utilisateurs concernés

-- Vue pour détecter les deadlines approchant (7 jours et 24h)
create or replace view public.upcoming_deadlines as
select
  c.id as contest_id,
  c.name as contest_name,
  c.registration_close_date,
  c.start_date,
  c.status as contest_status,
  case
    when c.registration_close_date <= timezone('utc', now()) + interval '24 hours' then '24h'
    when c.registration_close_date <= timezone('utc', now()) + interval '7 days' then '7d'
    else 'future'
  end as deadline_type,
  extract(epoch from (c.registration_close_date - timezone('utc', now()))) / 3600 as hours_until_deadline,
  extract(epoch from (c.registration_close_date - timezone('utc', now()))) / 86400 as days_until_deadline
from public.contests c
where c.status = 'registration'
  and c.registration_close_date is not null
  and c.registration_close_date > timezone('utc', now())
  and c.registration_close_date <= timezone('utc', now()) + interval '7 days'
order by c.registration_close_date asc;

comment on view public.upcoming_deadlines is 'Vue des deadlines d''inscription approchant (dans les 7 prochains jours)';

-- Vue pour les producteurs avec des entrées non soumises et deadlines approchant
create or replace view public.producers_with_pending_entries as
select distinct
  p.id as producer_id,
  p.display_name,
  e.id as entry_id,
  e.strain_name,
  e.status as entry_status,
  c.id as contest_id,
  c.name as contest_name,
  c.registration_close_date,
  case
    when c.registration_close_date <= timezone('utc', now()) + interval '24 hours' then '24h'
    when c.registration_close_date <= timezone('utc', now()) + interval '7 days' then '7d'
    else null
  end as deadline_type
from public.entries e
join public.contests c on c.id = e.contest_id
join public.profiles p on p.id = e.producer_id
where e.status in ('draft', 'submitted')
  and c.status = 'registration'
  and c.registration_close_date is not null
  and c.registration_close_date > timezone('utc', now())
  and c.registration_close_date <= timezone('utc', now()) + interval '7 days';

comment on view public.producers_with_pending_entries is 'Liste des producteurs ayant des entrées en brouillon ou soumises avec deadline approchant';

-- Vue pour les juges avec évaluations en attente
create or replace view public.judges_with_pending_evaluations as
select distinct
  p.id as judge_id,
  p.display_name,
  cj.contest_id,
  c.name as contest_name,
  count(e.id) filter (where not exists (
    select 1 from public.judge_scores js
    where js.entry_id = e.id and js.judge_id = p.id
  )) as pending_evaluations_count
from public.contest_judges cj
join public.profiles p on p.id = cj.judge_id
join public.contests c on c.id = cj.contest_id
left join public.entries e on e.contest_id = cj.contest_id
  and e.status in ('approved', 'under_review')
where cj.invitation_status = 'accepted'
  and c.status = 'judging'
group by p.id, p.display_name, cj.contest_id, c.name
having count(e.id) filter (where not exists (
    select 1 from public.judge_scores js
    where js.entry_id = e.id and js.judge_id = p.id
  )) > 0;

comment on view public.judges_with_pending_evaluations is 'Liste des juges ayant des évaluations en attente';

-- Fonction pour créer des notifications de deadline pour les producteurs
create or replace function public.create_deadline_notifications_for_producers(
  p_deadline_type text default null -- '7d' ou '24h', null pour les deux
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_notification_count integer := 0;
  v_producer record;
  v_notification_id uuid;
begin
  -- Parcourir les producteurs avec des entrées en attente
  for v_producer in
    select distinct
      pwe.producer_id,
      pwe.contest_id,
      pwe.contest_name,
      pwe.registration_close_date,
      pwe.deadline_type,
      count(*) as pending_entries_count
    from public.producers_with_pending_entries pwe
    where (p_deadline_type is null or pwe.deadline_type = p_deadline_type)
    group by pwe.producer_id, pwe.contest_id, pwe.contest_name, pwe.registration_close_date, pwe.deadline_type
  loop
    -- Vérifier si une notification similaire existe déjà (éviter les doublons)
    if not exists (
      select 1 from public.notifications
      where user_id = v_producer.producer_id
        and notification_type = case
          when v_producer.deadline_type = '24h' then 'deadline_24h'
          when v_producer.deadline_type = '7d' then 'deadline_7d'
          else 'deadline_approaching'
        end
        and created_at > timezone('utc', now()) - interval '1 day'
    ) then
      -- Créer la notification
      insert into public.notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        action_url,
        action_label
      )
      values (
        v_producer.producer_id,
        case
          when v_producer.deadline_type = '24h' then 'deadline_24h'
          when v_producer.deadline_type = '7d' then 'deadline_7d'
          else 'deadline_approaching'
        end,
        case
          when v_producer.deadline_type = '24h' then '⚠️ Deadline dans 24h !'
          when v_producer.deadline_type = '7d' then '📅 Deadline dans 7 jours'
          else '📅 Deadline approchant'
        end,
        format(
          'Le concours "%s" ferme ses inscriptions %s. Vous avez %s entrée(s) en attente de soumission.',
          v_producer.contest_name,
          case
            when v_producer.deadline_type = '24h' then 'dans moins de 24 heures'
            when v_producer.deadline_type = '7d' then 'dans 7 jours'
            else format('le %s', to_char(v_producer.registration_close_date, 'DD/MM/YYYY à HH24h'))
          end,
          v_producer.pending_entries_count
        ),
        case when v_producer.deadline_type = '24h' then 2 else 1 end, -- Urgent si 24h
        format('/submit-entry/%s', v_producer.contest_id),
        'Soumettre une entrée'
      )
      returning id into v_notification_id;
      
      v_notification_count := v_notification_count + 1;
    end if;
  end loop;
  
  return jsonb_build_object(
    'success', true,
    'notifications_created', v_notification_count,
    'deadline_type', coalesce(p_deadline_type, 'all')
  );
end;
$$;

comment on function public.create_deadline_notifications_for_producers is 'Crée des notifications pour les producteurs ayant des deadlines approchant (7j ou 24h)';

-- Fonction pour créer des notifications pour les juges avec évaluations en attente
create or replace function public.create_pending_evaluation_notifications_for_judges()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_notification_count integer := 0;
  v_judge record;
begin
  -- Parcourir les juges avec des évaluations en attente
  for v_judge in
    select *
    from public.judges_with_pending_evaluations
  loop
    -- Vérifier si une notification similaire existe déjà (éviter les doublons récents)
    if not exists (
      select 1 from public.notifications
      where user_id = v_judge.judge_id
        and notification_type = 'judge_evaluation_pending'
        and created_at > timezone('utc', now()) - interval '3 days'
    ) then
      -- Créer la notification
      insert into public.notifications (
        user_id,
        notification_type,
        title,
        message,
        priority,
        action_url,
        action_label
      )
      values (
        v_judge.judge_id,
        'judge_evaluation_pending',
        '⚖️ Évaluations en attente',
        format(
          'Vous avez %s entrée(s) à évaluer pour le concours "%s".',
          v_judge.pending_evaluations_count,
          v_judge.contest_name
        ),
        1, -- Priorité normale
        format('/contests?contest=%s', v_judge.contest_id),
        'Voir les entrées'
      );
      
      v_notification_count := v_notification_count + 1;
    end if;
  end loop;
  
  return jsonb_build_object(
    'success', true,
    'notifications_created', v_notification_count
  );
end;
$$;

comment on function public.create_pending_evaluation_notifications_for_judges is 'Crée des notifications pour les juges ayant des évaluations en attente';

-- Fonction globale pour créer toutes les notifications de deadline (à appeler par un cron/job)
create or replace function public.process_deadline_notifications()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_7d_notifications jsonb;
  v_24h_notifications jsonb;
  v_judge_notifications jsonb;
  v_total_count integer;
begin
  -- Créer les notifications 7 jours avant
  v_7d_notifications := public.create_deadline_notifications_for_producers('7d');
  
  -- Créer les notifications 24h avant
  v_24h_notifications := public.create_deadline_notifications_for_producers('24h');
  
  -- Créer les notifications pour les juges
  v_judge_notifications := public.create_pending_evaluation_notifications_for_judges();
  
  v_total_count := 
    (v_7d_notifications->>'notifications_created')::integer +
    (v_24h_notifications->>'notifications_created')::integer +
    (v_judge_notifications->>'notifications_created')::integer;
  
  return jsonb_build_object(
    'success', true,
    'total_notifications_created', v_total_count,
    'producers_7d', v_7d_notifications,
    'producers_24h', v_24h_notifications,
    'judges_pending', v_judge_notifications,
    'processed_at', timezone('utc', now())
  );
end;
$$;

comment on function public.process_deadline_notifications is 'Traite toutes les notifications de deadline (7j, 24h, juges) - À appeler périodiquement par un cron/job';

-- Vue pour afficher les deadlines avec compteur de temps restant
create or replace view public.deadlines_with_countdown as
select
  c.id as contest_id,
  c.name as contest_name,
  c.status,
  c.registration_close_date,
  c.start_date,
  c.end_date,
  extract(epoch from (c.registration_close_date - timezone('utc', now()))) / 86400 as days_remaining,
  extract(epoch from (c.registration_close_date - timezone('utc', now()))) / 3600 as hours_remaining,
  case
    when c.registration_close_date <= timezone('utc', now()) then 'passed'
    when c.registration_close_date <= timezone('utc', now()) + interval '24 hours' then 'urgent'
    when c.registration_close_date <= timezone('utc', now()) + interval '3 days' then 'soon'
    when c.registration_close_date <= timezone('utc', now()) + interval '7 days' then 'approaching'
    else 'ok'
  end as urgency_status,
  count(e.id) filter (where e.status in ('draft', 'submitted')) as pending_entries_count
from public.contests c
left join public.entries e on e.contest_id = c.id
where c.status = 'registration'
  and c.registration_close_date is not null
  and c.registration_close_date > timezone('utc', now())
group by c.id, c.name, c.status, c.registration_close_date, c.start_date, c.end_date
order by c.registration_close_date asc;

comment on view public.deadlines_with_countdown is 'Vue des deadlines avec compteur de temps restant et statut d''urgence';

-- Grants
grant select on public.upcoming_deadlines to authenticated;
grant select on public.producers_with_pending_entries to authenticated;
grant select on public.judges_with_pending_evaluations to authenticated;
grant select on public.deadlines_with_countdown to authenticated;
grant execute on function public.create_deadline_notifications_for_producers(text) to authenticated;
grant execute on function public.create_pending_evaluation_notifications_for_judges() to authenticated;
grant execute on function public.process_deadline_notifications() to authenticated;

