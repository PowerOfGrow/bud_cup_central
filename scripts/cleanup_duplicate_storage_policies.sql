-- Script pour supprimer les politiques Storage dupliquées
-- Exécutez ce script dans Supabase SQL Editor
-- Si certaines suppressions échouent, supprimez-les manuellement via le Dashboard

-- Supprimer les politiques dupliquées (celles avec le suffixe généré automatiquement)

-- 1. Supprimer la politique DELETE dupliquée
DROP POLICY IF EXISTS "Organizers can delete guides in storage 1elw6bb_0" ON storage.objects;

-- 2. Supprimer la politique UPDATE dupliquée
DROP POLICY IF EXISTS "Organizers can update guides in storage 1elw6bb_0" ON storage.objects;

-- 3. Supprimer la politique INSERT dupliquée
DROP POLICY IF EXISTS "Organizers can upload guides in storage 1elw6bb_0" ON storage.objects;

-- 4. (Optionnel) Supprimer la politique SELECT si vous utilisez uniquement des signed URLs
-- Décommentez la ligne suivante si vous voulez supprimer la politique SELECT publique :
-- DROP POLICY IF EXISTS "Public can view active guides in storage" ON storage.objects;

SELECT 'Politiques dupliquées supprimées. Si certaines suppressions ont échoué, supprimez-les manuellement via le Dashboard.' as status;

