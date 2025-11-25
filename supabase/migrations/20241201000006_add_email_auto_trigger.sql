-- Migration: Système de déclenchement automatique des emails pour notifications critiques
-- Version simplifiée qui fonctionne avec ou sans pg_net

-- Ajouter une colonne pour suivre l'état d'envoi d'email
alter table public.notifications
add column if not exists email_sent boolean default false,
add column if not exists email_sent_at timestamptz,
add column if not exists email_error text;

-- Index pour optimiser les requêtes
create index if not exists notifications_email_sent_idx on public.notifications(email_sent, created_at)
where email_sent = false;

-- Vue pour identifier les notifications nécessitant un envoi d'email
create or replace view public.notifications_pending_email as
select
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.link,
  n.metadata,
  n.created_at,
  u.email as user_email,
  p.display_name as user_display_name
from public.notifications n
join auth.users u on u.id = n.user_id
left join public.profiles p on p.id = n.user_id
left join public.notification_preferences np on np.user_id = n.user_id
where
  n.email_sent = false
  and n.type in ('judge_assigned', 'entry_approved', 'entry_rejected')
  and coalesce(np.email_enabled, true) = true
  and case n.type
    when 'judge_assigned' then coalesce(np.email_judge_assigned, true)
    when 'entry_approved' then coalesce(np.email_entry_approved, true)
    when 'entry_rejected' then coalesce(np.email_entry_approved, true)
    else false
  end = true
  and n.created_at > now() - interval '24 hours' -- Seulement les notifications récentes
order by n.created_at asc;

comment on view public.notifications_pending_email is 'Vue des notifications nécessitant un envoi d''email (utilisée par un job/worker ou appel depuis l''application)';

-- Fonction helper pour marquer une notification comme email envoyé
create or replace function public.mark_notification_email_sent(
  p_notification_id uuid,
  p_error text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update public.notifications
  set
    email_sent = true,
    email_sent_at = case when p_error is null then now() else null end,
    email_error = p_error
  where id = p_notification_id;
end;
$$;

comment on function public.mark_notification_email_sent is 'Marque une notification comme email envoyé (ou en erreur)';

-- Fonction RPC pour déclencher l'envoi d'email depuis l'application
-- Cette fonction peut être appelée depuis le frontend après création de notification
create or replace function public.trigger_notification_email(
  p_notification_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_notification record;
  v_preferences record;
  v_email_enabled boolean;
  v_type_enabled boolean;
  v_result jsonb;
begin
  -- Récupérer la notification
  select n.*, u.email as user_email
  into v_notification
  from public.notifications n
  join auth.users u on u.id = n.user_id
  where n.id = p_notification_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Notification not found');
  end if;
  
  -- Vérifier si déjà envoyé
  if v_notification.email_sent then
    return jsonb_build_object('success', true, 'message', 'Email already sent');
  end if;
  
  -- Récupérer les préférences
  select
    coalesce(email_enabled, true) as email_enabled,
    case v_notification.type
      when 'judge_assigned' then coalesce(email_judge_assigned, true)
      when 'entry_approved' then coalesce(email_entry_approved, true)
      when 'entry_rejected' then coalesce(email_entry_approved, true)
      else false
    end as type_enabled
  into v_preferences
  from public.notification_preferences
  where user_id = v_notification.user_id;
  
  v_email_enabled := coalesce(v_preferences.email_enabled, true);
  v_type_enabled := coalesce(v_preferences.type_enabled, true);
  
  if not v_email_enabled or not v_type_enabled then
    -- Marquer comme envoyé (mais skip) pour ne pas réessayer
    perform public.mark_notification_email_sent(p_notification_id, 'Notifications disabled');
    return jsonb_build_object('success', true, 'message', 'Notifications disabled by user preferences');
  end if;
  
  -- Retourner les informations nécessaires pour que l'application appelle l'Edge Function
  v_result := jsonb_build_object(
    'success', true,
    'should_send', true,
    'email', v_notification.user_email,
    'type', v_notification.type,
    'title', v_notification.title,
    'message', v_notification.message,
    'link', v_notification.link,
    'user_id', v_notification.user_id
  );
  
  return v_result;
end;
$$;

comment on function public.trigger_notification_email is 'Vérifie si une notification doit envoyer un email et retourne les informations nécessaires. À appeler depuis l''application qui ensuite appellera l''Edge Function.';

-- Fonction pour générer le contenu HTML des emails (pour référence)
create or replace function public.generate_email_html(
  p_type text,
  p_title text,
  p_message text,
  p_link text default null
)
returns text
language plpgsql
immutable
as $$
declare
  v_html text;
  v_base_url text := 'https://cbdflowercup.com';
begin
  v_html := '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; }
        .header { background-color: #4CAF50; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .content h2 { color: #333; margin-top: 0; }
        .content p { color: #666; margin-bottom: 15px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌿 CBD Flower Cup</h1>
        </div>
        <div class="content">
          <h2>' || p_title || '</h2>
          <p>' || p_message || '</p>';
  
  if p_link is not null then
    v_html := v_html || '<a href="' || coalesce(p_link, v_base_url) || '" class="button">Voir les détails</a>';
  end if;
  
  v_html := v_html || '
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par CBD Flower Cup.</p>
          <p>Vous pouvez modifier vos préférences de notification dans les <a href="' || v_base_url || '/settings">paramètres de votre compte</a>.</p>
        </div>
      </div>
    </body>
    </html>';
  
  return v_html;
end;
$$;

comment on function public.generate_email_html is 'Génère le contenu HTML d''un email de notification (pour référence dans l''Edge Function)';

-- Vue récapitulative pour monitoring
create or replace view public.notification_email_stats as
select
  date_trunc('day', created_at) as date,
  type,
  count(*) as total,
  count(*) filter (where email_sent = true) as sent,
  count(*) filter (where email_sent = false) as pending,
  count(*) filter (where email_error is not null) as errors
from public.notifications
where type in ('judge_assigned', 'entry_approved', 'entry_rejected')
  and created_at > now() - interval '30 days'
group by date_trunc('day', created_at), type
order by date desc, type;

comment on view public.notification_email_stats is 'Statistiques d''envoi d''emails par jour et par type (pour monitoring)';
