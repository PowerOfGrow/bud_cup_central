-- Migration: Ajouter 'coa_deleted' à l'enum audit_action
-- Nécessaire pour logger la suppression de certificats COA
--
-- Note: ALTER TYPE ... ADD VALUE ne peut pas être exécuté dans une transaction
-- et PostgreSQL n'a pas de syntaxe "IF NOT EXISTS" pour ADD VALUE.
-- On doit vérifier si la valeur existe d'abord.

-- Fonction helper pour ajouter la valeur si elle n'existe pas
do $$ 
declare
  v_exists boolean;
begin
  -- Vérifier si la valeur existe déjà
  select exists (
    select 1 
    from pg_enum 
    where enumlabel = 'coa_deleted' 
    and enumtypid = (select oid from pg_type where typname = 'audit_action')
  ) into v_exists;
  
  -- Ajouter la valeur seulement si elle n'existe pas
  if not v_exists then
    alter type audit_action add value 'coa_deleted';
  end if;
exception
  when others then
    -- Si erreur, on vérifie si c'est parce que la valeur existe déjà
    -- ou si c'est une autre erreur (on ignore silencieusement)
    raise notice 'Could not add coa_deleted to audit_action enum: %', SQLERRM;
end $$;

-- Mettre à jour le commentaire
comment on type audit_action is 'Types d''actions auditables pour les entrées. Valeurs: created, updated, status_changed, thc_modified, coa_modified, coa_validated, coa_rejected, coa_deleted, score_modified, deleted';

