-- Migration: Fonction pour supprimer COA et notifier le producteur
-- Permet aux organisateurs de supprimer un COA et d'envoyer un email explicatif

-- Fonction pour supprimer le COA d'une entrée
create or replace function public.delete_entry_coa(
  p_entry_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_coa_url text;
  v_producer_id uuid;
  v_strain_name text;
begin
  -- Vérifier que l'utilisateur est organisateur
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Seuls les organisateurs peuvent supprimer un COA';
  end if;

  -- Récupérer les informations de l'entrée
  select coa_url, producer_id, strain_name
  into v_coa_url, v_producer_id, v_strain_name
  from public.entries
  where id = p_entry_id;

  if not found then
    raise exception 'Entrée non trouvée';
  end if;

  -- Mettre à jour l'entrée : supprimer le COA et réinitialiser la validation
  -- Note: La suppression du fichier du storage se fait côté frontend
  update public.entries
  set
    coa_url = null,
    coa_validated = false,
    coa_validated_at = null,
    coa_validated_by = null,
    coa_validation_notes = p_reason,
    coa_format_valid = false,
    coa_data_readable = false,
    coa_thc_compliant = false,
    coa_lab_recognized = false,
    status = 'draft' -- Remettre en brouillon pour que le producteur puisse corriger
  where id = p_entry_id;

  -- Logger dans l'audit trail
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
    auth.uid(),
    'coa_deleted',
    'coa_url',
    jsonb_build_object('url', v_coa_url),
    jsonb_build_object('url', null),
    coalesce(p_reason, 'COA supprimé par l''organisateur')
  );
end;
$$;

-- Commentaire
comment on function public.delete_entry_coa is 'Supprime le COA d''une entrée et réinitialise la validation. Accessible uniquement aux organisateurs.';

-- Grant
grant execute on function public.delete_entry_coa to authenticated;

-- Fonction pour préparer l'envoi d'un email au producteur concernant son COA
-- Cette fonction crée une notification. L'email sera envoyé via l'Edge Function depuis le frontend
create or replace function public.send_coa_rejection_email(
  p_entry_id uuid,
  p_subject text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producer_name text;
  v_strain_name text;
  v_contest_name text;
  v_producer_id uuid;
  v_notification_id uuid;
begin
  -- Vérifier que l'utilisateur est organisateur
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Seuls les organisateurs peuvent envoyer des emails';
  end if;

  -- Récupérer les informations de l'entrée et du producteur
  select 
    e.strain_name,
    e.producer_id,
    c.name as contest_name,
    p.display_name
  into
    v_strain_name,
    v_producer_id,
    v_contest_name,
    v_producer_name
  from public.entries e
  join public.contests c on c.id = e.contest_id
  join public.profiles p on p.id = e.producer_id
  where e.id = p_entry_id;

  if not found then
    raise exception 'Entrée non trouvée';
  end if;

  -- Créer une notification pour le producteur
  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    action_label,
    priority
  ) values (
    v_producer_id,
    'coa_rejected',
    p_subject,
    p_message,
    '/submit-entry',
    'Corriger mon entrée',
    'high'
  )
  returning id into v_notification_id;

  -- Retourner les informations nécessaires pour l'envoi d'email côté frontend
  return jsonb_build_object(
    'producer_id', v_producer_id,
    'producer_name', v_producer_name,
    'strain_name', v_strain_name,
    'contest_name', v_contest_name,
    'notification_id', v_notification_id
  );
end;
$$;

-- Fonction helper pour récupérer l'email d'un utilisateur (pour les organisateurs)
create or replace function public.get_user_email(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  -- Vérifier que l'utilisateur est organisateur
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Seuls les organisateurs peuvent accéder aux emails';
  end if;

  -- Récupérer l'email depuis auth.users
  select email into v_email
  from auth.users
  where id = p_user_id;

  return v_email;
end;
$$;

-- Commentaires
comment on function public.send_coa_rejection_email is 'Prépare l''envoi d''un email au producteur concernant son COA. Crée une notification et retourne les infos nécessaires.';
comment on function public.get_user_email is 'Récupère l''email d''un utilisateur depuis auth.users. Accessible uniquement aux organisateurs.';

-- Grants
grant execute on function public.send_coa_rejection_email to authenticated;
grant execute on function public.get_user_email to authenticated;
