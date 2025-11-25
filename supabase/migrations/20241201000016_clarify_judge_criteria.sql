-- Migration: Clarification et uniformisation des critères d'évaluation des juges
-- Confirme que le système utilise 4 critères (Apparence, Arôme, Goût, Effet)
-- avec densité inclus dans Apparence et terpènes inclus dans Arôme

-- Ajouter des commentaires sur les colonnes pour clarifier ce qui est évalué dans chaque critère
comment on column public.judge_scores.appearance_score is 'Score Apparence (0-100) : Évaluation visuelle incluant couleur, structure, densité et présence de trichomes';
comment on column public.judge_scores.aroma_score is 'Score Arôme (0-100) : Évaluation aromatique incluant intensité, complexité et profil terpénique';
comment on column public.judge_scores.taste_score is 'Score Goût (0-100) : Évaluation gustative incluant saveur, texture et persistance en bouche';
comment on column public.judge_scores.effect_score is 'Score Effets (0-100) : Évaluation des effets ressentis incluant intensité, qualité et durée';
comment on column public.judge_scores.overall_score is 'Score Global (0-100) : Moyenne calculée des 4 critères (Apparence + Arôme + Goût + Effets) / 4, modifiable par le juge';

-- Vue pour clarifier le calcul du score global
create or replace view public.judge_score_calculation_guide as
select 
  'Critères d''évaluation' as section,
  jsonb_build_object(
    'criteria', jsonb_build_array(
      jsonb_build_object(
        'name', 'Apparence',
        'column', 'appearance_score',
        'description', 'Couleur, structure, densité, présence de trichomes',
        'weight', 25
      ),
      jsonb_build_object(
        'name', 'Arôme',
        'column', 'aroma_score',
        'description', 'Intensité, complexité, profil terpénique',
        'weight', 25
      ),
      jsonb_build_object(
        'name', 'Goût',
        'column', 'taste_score',
        'description', 'Saveur, texture, persistance en bouche',
        'weight', 25
      ),
      jsonb_build_object(
        'name', 'Effets',
        'column', 'effect_score',
        'description', 'Intensité, qualité, durée des effets ressentis',
        'weight', 25
      )
    ),
    'overall_calculation', 'Moyenne simple : (Apparence + Arôme + Goût + Effets) / 4',
    'overall_modifiable', true,
    'total_criteria', 4
  ) as details;

comment on view public.judge_score_calculation_guide is 'Guide explicatif du système de notation des juges avec les 4 critères standardisés';

-- Fonction pour documenter et valider la structure des critères
create or replace function public.validate_judge_score_structure()
returns jsonb
language plpgsql
immutable
as $$
begin
  return jsonb_build_object(
    'criteria_count', 4,
    'criteria_list', jsonb_build_array(
      'appearance_score',
      'aroma_score',
      'taste_score',
      'effect_score'
    ),
    'overall_score', 'Calculated average of 4 criteria, modifiable by judge',
    'formula', '(appearance_score + aroma_score + taste_score + effect_score) / 4',
    'clarifications', jsonb_build_object(
      'appearance_score', 'Includes: color, structure, density, trichomes',
      'aroma_score', 'Includes: intensity, complexity, terpene profile',
      'taste_score', 'Includes: flavor, texture, mouthfeel persistence',
      'effect_score', 'Includes: intensity, quality, duration of effects'
    ),
    'standardized', true,
    'version', '1.0'
  );
end;
$$;

comment on function public.validate_judge_score_structure is 'Valide et documente la structure standardisée des critères d''évaluation (4 critères confirmés)';

-- Grant pour permettre la consultation
grant select on public.judge_score_calculation_guide to authenticated;
grant execute on function public.validate_judge_score_structure() to authenticated;

