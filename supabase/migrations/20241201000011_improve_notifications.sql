-- Migration: Améliorations du système de notifications
-- Ajoute des fonctionnalités pour une meilleure gestion des notifications

-- Ajouter colonne "priority" pour trier les notifications importantes
alter table public.notifications
add column if not exists priority smallint default 0;

comment on column public.notifications.priority is 'Priorité de la notification : 0 = normale, 1 = importante, 2 = urgente';

-- Ajouter colonne "action_url" pour actions rapides depuis la notification
alter table public.notifications
add column if not exists action_url text,
add column if not exists action_label text;

comment on column public.notifications.action_url is 'URL pour action rapide depuis la notification';
comment on column public.notifications.action_label is 'Label du bouton d''action rapide (ex: "Valider", "Voir", "Répondre")';

-- Index pour optimiser le filtrage par type et priorité
create index if not exists notifications_type_priority_idx 
  on public.notifications(type, priority desc, created_at desc);

-- Note: Le groupement par date est fait côté application
-- L'index existant sur created_at (notifications_created_at_idx) suffit pour optimiser les requêtes

-- Vue pour les statistiques de notifications par type
create or replace view public.notification_stats_by_type as
select
  type,
  count(*) as total_count,
  count(*) filter (where read = false) as unread_count,
  count(*) filter (where read = true) as read_count,
  count(*) filter (where created_at > now() - interval '7 days') as last_7_days,
  count(*) filter (where created_at > now() - interval '30 days') as last_30_days,
  min(created_at) as first_notification,
  max(created_at) as last_notification
from public.notifications
group by type
order by total_count desc;

comment on view public.notification_stats_by_type is 'Statistiques des notifications groupées par type';

-- Fonction pour obtenir les notifications groupées par jour
create or replace function public.get_notifications_grouped_by_date(
  p_user_id uuid,
  p_limit integer default 50
)
returns table (
  date_group date,
  notification_count bigint,
  unread_count bigint,
  notifications jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  select
    date_trunc('day', n.created_at)::date as date_group,
    count(*)::bigint as notification_count,
    count(*) filter (where n.read = false)::bigint as unread_count,
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'type', n.type,
        'title', n.title,
        'message', n.message,
        'link', n.link,
        'action_url', n.action_url,
        'action_label', n.action_label,
        'read', n.read,
        'priority', n.priority,
        'created_at', n.created_at,
        'metadata', n.metadata
      )
      order by n.priority desc, n.created_at desc
    ) as notifications
  from public.notifications n
  where n.user_id = p_user_id
  group by date_trunc('day', n.created_at)
  order by date_group desc
  limit p_limit;
end;
$$;

comment on function public.get_notifications_grouped_by_date is 'Retourne les notifications groupées par jour pour un utilisateur';

-- Fonction pour obtenir le nombre de notifications non lues par type
create or replace function public.get_unread_notifications_by_type(
  p_user_id uuid
)
returns table (
  type text,
  unread_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select
    n.type::text,
    count(*)::bigint as unread_count
  from public.notifications n
  where n.user_id = p_user_id
    and n.read = false
  group by n.type
  order by unread_count desc;
end;
$$;

comment on function public.get_unread_notifications_by_type is 'Retourne le nombre de notifications non lues par type pour un utilisateur';

-- RLS pour les fonctions
grant execute on function public.get_notifications_grouped_by_date(uuid, integer) to authenticated;
grant execute on function public.get_unread_notifications_by_type(uuid) to authenticated;

