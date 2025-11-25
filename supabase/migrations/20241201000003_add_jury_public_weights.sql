-- Migration: Rendre paramétrables les pondérations Jury/Public
-- Permet de configurer le ratio de calcul du score combiné par concours

-- Ajouter les champs de pondération dans contests
alter table public.contests
add column if not exists jury_weight numeric(3,2) default 0.7,
add column if not exists public_weight numeric(3,2) default 0.3;

-- Supprimer la contrainte si elle existe déjà (pour rendre la migration idempotente)
alter table public.contests
drop constraint if exists contests_weights_sum_check;

-- Contrainte pour garantir que la somme = 1.0
alter table public.contests
add constraint contests_weights_sum_check 
  check (abs((coalesce(jury_weight, 0.7) + coalesce(public_weight, 0.3)) - 1.0) < 0.01);

-- Commentaires
comment on column public.contests.jury_weight is 'Pondération des scores jury dans le calcul du score combiné (par défaut 0.7 = 70%)';
comment on column public.contests.public_weight is 'Pondération des votes publics dans le calcul du score combiné (par défaut 0.3 = 30%)';

-- Créer une fonction helper pour calculer le score combiné selon les poids du concours
create or replace function public.calculate_combined_score(
  p_judge_average numeric,
  p_public_average numeric,
  p_jury_weight numeric default 0.7,
  p_public_weight numeric default 0.3
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_normalized_public_score numeric;
begin
  -- Normaliser le vote public (0-5 étoiles) vers une échelle 0-100
  -- Si publicAverage est sur 5, on le convertit en 0-100
  v_normalized_public_score := (p_public_average / 5.0) * 100.0;
  
  -- Calculer le score combiné avec les pondérations
  return (p_judge_average * p_jury_weight) + (v_normalized_public_score * p_public_weight);
end;
$$;

-- Commentaire
comment on function public.calculate_combined_score is 'Calcule le score combiné à partir des moyennes jury/public avec pondérations personnalisables';

