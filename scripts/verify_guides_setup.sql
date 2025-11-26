-- Script de vérification pour le système de guides
-- Exécutez ce script dans Supabase SQL Editor pour vérifier l'installation

-- 1. Vérifier que le bucket existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'guides';

-- 2. Vérifier que la table existe
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'guides';

-- 3. Vérifier les colonnes de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'guides' 
ORDER BY ordinal_position;

-- 4. Vérifier les index
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'guides' 
  AND schemaname = 'public';

-- 5. Vérifier les politiques RLS de la table
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'guides';

-- 6. Vérifier les politiques Storage (devraient être vides si créées via Dashboard)
-- Note: Les politiques Storage ne s'affichent pas facilement via SQL
-- Utilisez le Dashboard pour vérifier: Storage > guides > Policies

SELECT '✅ Vérification terminée. Si tous les résultats sont présents, la table est correctement configurée.' as status;
SELECT '⚠️ Les politiques Storage doivent être vérifiées via le Dashboard Supabase.' as note;

