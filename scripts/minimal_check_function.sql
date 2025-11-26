-- Script MINIMAL pour vérifier si la fonction existe
-- Exécutez ceci en premier dans Supabase SQL Editor

-- 1. Vérifier si la fonction existe
select 
  '✅ Fonction existe' as status,
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where proname = 'get_pending_comments_for_organizer'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');

-- Si vous voyez "Fonction existe" ci-dessus, passez à l'étape 2
-- Si vous ne voyez rien, la fonction n'existe pas, exécutez le script fix_pending_comments_function_final.sql

-- 2. Vérifier les permissions
select 
  grantee::text as role,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'get_pending_comments_for_organizer';

-- Si vous ne voyez pas "authenticated" dans la liste, exécutez :
-- grant execute on function public.get_pending_comments_for_organizer(text) to authenticated;

