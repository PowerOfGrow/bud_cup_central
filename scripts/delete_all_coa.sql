-- Script SQL pour supprimer TOUS les certificats COA
-- ATTENTION: Cette opération est IRRÉVERSIBLE
-- 
-- Ce script:
-- 1. Supprime toutes les références COA dans la table entries
-- 2. Réinitialise toutes les validations COA
-- 3. Supprime tous les logs de téléchargement COA
-- 4. Log toutes les suppressions dans l'audit trail
--
-- NOTE: Les fichiers physiques dans le storage Supabase devront être supprimés séparément
--       via l'interface Supabase Storage ou via l'API

BEGIN;

-- Vérifier qu'on est bien organisateur (à exécuter manuellement dans Supabase Dashboard)
-- SELECT id, role FROM public.profiles WHERE id = auth.uid();

-- Option 1: Utiliser la fonction sécurisée (recommandé)
SELECT public.delete_all_coa_certificates();

-- Option 2: Suppression directe (si vous avez les permissions)
-- 
-- -- Compter d'abord les entrées affectées
-- SELECT count(*) as total_entries_with_coa 
-- FROM public.entries 
-- WHERE coa_url IS NOT NULL;
--
-- -- Logger dans l'audit trail AVANT suppression
-- INSERT INTO public.entry_audit_log (
--   entry_id,
--   user_id,
--   action,
--   field_changed,
--   old_value,
--   new_value,
--   reason
-- )
-- SELECT
--   id,
--   auth.uid(),
--   'coa_deleted',
--   'coa_url',
--   jsonb_build_object('url', coa_url),
--   jsonb_build_object('url', null),
--   'COA supprimé en masse par administrateur'
-- FROM public.entries
-- WHERE coa_url IS NOT NULL;
--
-- -- Mettre à jour toutes les entrées
-- UPDATE public.entries
-- SET
--   coa_url = NULL,
--   coa_validated = false,
--   coa_validated_at = NULL,
--   coa_validated_by = NULL,
--   coa_validation_notes = 'COA supprimé en masse par administrateur',
--   coa_format_valid = false,
--   coa_data_readable = false,
--   coa_thc_compliant = false,
--   coa_lab_recognized = false,
--   status = CASE 
--     WHEN status = 'submitted' THEN 'draft'
--     ELSE status
--   END
-- WHERE coa_url IS NOT NULL;
--
-- -- Supprimer tous les logs de téléchargement
-- DELETE FROM public.coa_download_logs;

-- Vérifier le résultat
SELECT 
  count(*) as entries_with_coa_remaining,
  count(*) FILTER (WHERE coa_url IS NOT NULL) as still_has_coa
FROM public.entries;

-- Lister les fichiers à supprimer du storage (pour suppression manuelle)
SELECT 
  id,
  strain_name,
  coa_url,
  regexp_replace(
    coa_url,
    '^.*\/storage\/v1\/object\/(?:public|sign)\/[^\/]+\/(.+?)(?:\?|$)',
    '\1'
  ) as file_path_in_storage
FROM public.entries
WHERE coa_url IS NOT NULL;

COMMIT;

