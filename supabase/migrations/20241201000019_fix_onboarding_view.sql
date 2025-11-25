-- Migration corrective : Suppression de la vue user_onboarding_status
-- Cette vue n'est pas nécessaire car le frontend utilise la table directement avec jointure
-- Elle peut causer des erreurs car les vues ne peuvent pas avoir de policies RLS

-- Supprimer la vue si elle existe
drop view if exists public.user_onboarding_status cascade;

-- Note: Le frontend utilise maintenant directement la table user_onboarding
-- avec une jointure sur profiles via Supabase, ce qui est plus flexible et compatible avec RLS

