-- Test de la fonction get_judge_conflicts_for_organizer
-- À exécuter dans Supabase SQL Editor pour vérifier qu'elle fonctionne

-- Appeler la fonction
select * from public.get_judge_conflicts_for_organizer();

-- Si vous obtenez des résultats, c'est que la fonction fonctionne !
-- Si vous obtenez une erreur, vérifiez que :
-- 1. Vous êtes connecté en tant qu'organisateur
-- 2. La migration a bien été exécutée

