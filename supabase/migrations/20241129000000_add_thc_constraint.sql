-- Migration: Ajout de contrainte pour limiter le taux THC à 0.3% max (conformité UE)
-- Date: 2024-11-29

-- 1. Ajouter une contrainte CHECK pour limiter thc_percent à 0.3% maximum
-- Cette contrainte garantit la conformité avec la réglementation européenne

alter table public.entries
  drop constraint if exists entries_thc_percent_limit;

alter table public.entries
  add constraint entries_thc_percent_limit
    check (
      thc_percent is null 
      or (thc_percent >= 0 and thc_percent <= 0.3)
    );

-- 2. Ajouter un commentaire sur la colonne pour documenter la limite légale
comment on column public.entries.thc_percent is 
  'Pourcentage de THC (tétrahydrocannabinol). Limite légale UE : ≤0,3% conformément à la réglementation européenne sur les produits CBD.';

-- 3. Créer une fonction pour valider le THC lors de l'insertion/mise à jour
-- Cette fonction peut être appelée dans un trigger si nécessaire
create or replace function public.validate_thc_limit()
returns trigger
language plpgsql
as $$
begin
  -- Si thc_percent est fourni, vérifier qu'il est ≤ 0.3
  if new.thc_percent is not null and new.thc_percent > 0.3 then
    raise exception '%', 
      format('Le taux THC doit être ≤0,3%% selon la réglementation européenne. Valeur fournie: %.2f%%', new.thc_percent);
  end if;
  
  return new;
end;
$$;

-- Note: La contrainte CHECK ci-dessus est suffisante pour bloquer les valeurs invalides
-- La fonction est fournie à des fins de documentation et d'utilisation future si besoin

