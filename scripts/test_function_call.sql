-- Script pour tester l'appel de la fonction directement
-- Exécutez ceci dans Supabase SQL Editor pour vérifier que la fonction fonctionne

-- Test 1: Vérifier la signature exacte
select 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
from pg_proc
where proname = 'get_pending_comments_for_organizer'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');

-- Test 2: Appeler la fonction (remplacez 'pending' par 'all' si nécessaire)
-- ATTENTION: Exécutez ceci seulement si vous êtes connecté en tant qu'organisateur
select * from public.get_pending_comments_for_organizer('pending');

-- Test 3: Appeler avec le paramètre par défaut
select * from public.get_pending_comments_for_organizer();

-- Test 4: Vérifier le schéma public est accessible
select current_schema(), current_user;

