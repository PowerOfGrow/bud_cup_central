-- Script de test pour vérifier que la fonction existe et est accessible

-- 1. Vérifier si la fonction existe
select 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  proacl as permissions
from pg_proc
where proname = 'get_pending_comments_for_organizer'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');

-- 2. Tester l'appel de la fonction (si vous êtes organisateur)
-- Décommentez la ligne suivante pour tester :
-- select * from public.get_pending_comments_for_organizer('pending');

-- 3. Vérifier les permissions
select 
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_name = 'get_pending_comments_for_organizer'
  and routine_schema = 'public';

