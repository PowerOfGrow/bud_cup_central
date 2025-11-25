-- Migration: Supprimer tous les certificats COA
-- ATTENTION: Cette fonction supprime TOUS les certificats COA de la base de données
-- Les fichiers du storage devront être supprimés manuellement ou via l'API Storage

-- Fonction pour supprimer tous les certificats COA
create or replace function public.delete_all_coa_certificates()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_entries_count integer;
  v_logs_count integer;
  v_file_paths text[];
  v_result jsonb;
  v_entry_record record;
begin
  -- Vérifier que l'utilisateur est organisateur
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Seuls les organisateurs peuvent supprimer tous les certificats COA';
  end if;

  -- Compter les entrées avec COA
  select count(*)
  into v_entries_count
  from public.entries
  where coa_url is not null;

  -- Récupérer les chemins des fichiers pour le résultat
  select array_agg(coa_url)
  into v_file_paths
  from public.entries
  where coa_url is not null;

  -- Logger dans l'audit trail et mettre à jour chaque entrée
  for v_entry_record in 
    select id, coa_url, status
    from public.entries
    where coa_url is not null
  loop
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
      v_entry_record.id,
      auth.uid(),
      'coa_deleted',
      'coa_url',
      jsonb_build_object('url', v_entry_record.coa_url),
      jsonb_build_object('url', null),
      'COA supprimé en masse par administrateur'
    );

    -- Mettre à jour l'entrée
    update public.entries
    set
      coa_url = null,
      coa_validated = false,
      coa_validated_at = null,
      coa_validated_by = null,
      coa_validation_notes = 'COA supprimé en masse par administrateur',
      coa_format_valid = false,
      coa_data_readable = false,
      coa_thc_compliant = false,
      coa_lab_recognized = false,
      status = case 
        when v_entry_record.status = 'submitted' then 'draft'  -- Remettre en brouillon si soumis
        else v_entry_record.status  -- Garder le statut actuel sinon
      end
    where id = v_entry_record.id;
  end loop;

  -- Compter et supprimer les logs de téléchargement COA
  select count(*)
  into v_logs_count
  from public.coa_download_logs;

  delete from public.coa_download_logs;

  -- Construire le résultat
  v_result := jsonb_build_object(
    'entries_updated', v_entries_count,
    'download_logs_deleted', v_logs_count,
    'file_paths_count', coalesce(array_length(v_file_paths, 1), 0),
    'timestamp', now(),
    'message', format('Suppression réussie: %s entrées mises à jour, %s logs supprimés', v_entries_count, v_logs_count)
  );

  return v_result;
end;
$$;

-- Commentaire
comment on function public.delete_all_coa_certificates is 'Supprime tous les certificats COA de la base de données. ATTENTION: Les fichiers du storage doivent être supprimés séparément via l''API Storage. Retourne les statistiques de suppression.';

-- Grant execute
grant execute on function public.delete_all_coa_certificates to authenticated;

-- Fonction helper pour lister tous les fichiers COA dans le storage (pour suppression manuelle)
create or replace function public.list_all_coa_file_paths()
returns table (
  entry_id uuid,
  strain_name text,
  coa_url text,
  file_path text
)
language plpgsql
security definer
as $$
begin
  -- Vérifier que l'utilisateur est organisateur
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Seuls les organisateurs peuvent lister les fichiers COA';
  end if;

  return query
  select 
    e.id,
    e.strain_name,
    e.coa_url,
    -- Extraire le chemin du fichier depuis l'URL
    case
      when e.coa_url ~ '/storage/v1/object/(public|sign)/[^/]+/(.+?)(?:\?|$)' then
        (regexp_match(e.coa_url, '/storage/v1/object/(?:public|sign)/[^/]+/(.+?)(?:\?|$)'))[1]
      when e.coa_url ~ '/entry-documents/(.+?)(?:\?|$)' then
        (regexp_match(e.coa_url, '/entry-documents/(.+?)(?:\?|$)'))[1]
      else
        substring(e.coa_url from '[^/]+$')
    end as file_path
  from public.entries e
  where e.coa_url is not null
  order by e.created_at desc;
end;
$$;

-- Commentaire
comment on function public.list_all_coa_file_paths is 'Liste tous les fichiers COA avec leurs chemins dans le storage pour faciliter la suppression manuelle.';

-- Grant execute
grant execute on function public.list_all_coa_file_paths to authenticated;

