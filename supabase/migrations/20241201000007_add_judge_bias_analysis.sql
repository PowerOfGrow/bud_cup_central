-- Migration: Système d'analyse du biais des juges
-- Permet de détecter les juges qui sur-notent ou sous-notent systématiquement

-- Vue pour les statistiques de scoring par juge
create or replace view public.judge_scoring_stats as
select
  js.judge_id,
  p.display_name as judge_name,
  p.role as judge_role,
  count(*) as total_evaluations,
  round(avg(js.overall_score)::numeric, 2) as average_score_given,
  round(stddev(js.overall_score)::numeric, 2) as score_stddev,
  round(min(js.overall_score)::numeric, 2) as min_score,
  round(max(js.overall_score)::numeric, 2) as max_score,
  round(avg(js.appearance_score)::numeric, 2) as avg_appearance,
  round(avg(js.aroma_score)::numeric, 2) as avg_aroma,
  round(avg(js.taste_score)::numeric, 2) as avg_taste,
  round(avg(js.effect_score)::numeric, 2) as avg_effect
from public.judge_scores js
join public.profiles p on p.id = js.judge_id
group by js.judge_id, p.display_name, p.role
having count(*) >= 3; -- Au moins 3 évaluations pour avoir des statistiques significatives

comment on view public.judge_scoring_stats is 'Statistiques de scoring par juge (moyenne, écart-type, min, max)';

-- Vue pour comparer les scores des juges avec la moyenne globale
create or replace view public.judge_bias_analysis as
with global_stats as (
  select
    round(avg(overall_score)::numeric, 2) as global_average,
    round(stddev(overall_score)::numeric, 2) as global_stddev
  from public.judge_scores
),
judge_stats as (
  select
    js.judge_id,
    p.display_name as judge_name,
    p.role as judge_role,
    count(*) as total_evaluations,
    round(avg(js.overall_score)::numeric, 2) as judge_average,
    round(stddev(js.overall_score)::numeric, 2) as judge_stddev
  from public.judge_scores js
  join public.profiles p on p.id = js.judge_id
  group by js.judge_id, p.display_name, p.role
  having count(*) >= 3
)
select
  js.judge_id,
  js.judge_name,
  js.judge_role,
  js.total_evaluations,
  js.judge_average,
  js.judge_stddev,
  gs.global_average,
  gs.global_stddev,
  round((js.judge_average - gs.global_average)::numeric, 2) as score_difference,
  round(
    case
      when gs.global_stddev > 0 then
        (js.judge_average - gs.global_average) / gs.global_stddev
      else 0
    end::numeric,
    2
  ) as z_score,
  case
    when js.judge_average > gs.global_average + (gs.global_stddev * 1.5) then 'high_scorer'
    when js.judge_average < gs.global_average - (gs.global_stddev * 1.5) then 'low_scorer'
    else 'normal'
  end as bias_category
from judge_stats js
cross join global_stats gs;

comment on view public.judge_bias_analysis is 'Analyse du biais des juges : compare leurs scores moyens avec la moyenne globale et calcule des z-scores';

-- Fonction pour calculer le z-score d'un score spécifique par rapport au juge
create or replace function public.calculate_judge_z_score(
  p_judge_id uuid,
  p_score numeric
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_judge_avg numeric;
  v_judge_stddev numeric;
begin
  -- Récupérer la moyenne et l'écart-type du juge
  select
    avg(overall_score)::numeric,
    stddev(overall_score)::numeric
  into v_judge_avg, v_judge_stddev
  from public.judge_scores
  where judge_id = p_judge_id;
  
  -- Si pas assez de données, retourner 0
  if v_judge_avg is null or v_judge_stddev is null or v_judge_stddev = 0 then
    return 0;
  end if;
  
  -- Calculer le z-score : (score - moyenne) / écart-type
  return round(((p_score - v_judge_avg) / v_judge_stddev)::numeric, 2);
end;
$$;

comment on function public.calculate_judge_z_score is 'Calcule le z-score d''un score par rapport à la distribution des scores d''un juge';

-- Vue pour identifier les scores anormaux (z-score > 2 ou < -2)
create or replace view public.abnormal_judge_scores as
select
  js.id,
  js.entry_id,
  js.judge_id,
  js.overall_score,
  js.appearance_score,
  js.aroma_score,
  js.taste_score,
  js.effect_score,
  js.created_at,
  p.display_name as judge_name,
  e.strain_name,
  e.contest_id,
  c.name as contest_name,
  round(public.calculate_judge_z_score(js.judge_id, js.overall_score)::numeric, 2) as z_score,
  jba.judge_average,
  jba.global_average,
  case
    when abs(public.calculate_judge_z_score(js.judge_id, js.overall_score)) > 2 then 'abnormal'
    else 'normal'
  end as score_status
from public.judge_scores js
join public.profiles p on p.id = js.judge_id
join public.entries e on e.id = js.entry_id
join public.contests c on c.id = e.contest_id
left join public.judge_bias_analysis jba on jba.judge_id = js.judge_id
where abs(public.calculate_judge_z_score(js.judge_id, js.overall_score)) > 2; -- Z-score > 2 ou < -2

comment on view public.abnormal_judge_scores is 'Scores anormaux des juges (z-score > 2 ou < -2 par rapport à leur propre distribution)';

-- Vue récapitulative pour le dashboard organisateur
create or replace view public.judge_bias_summary as
select
  jba.judge_id,
  jba.judge_name,
  jba.judge_role,
  jba.total_evaluations,
  jba.judge_average,
  jba.global_average,
  jba.score_difference,
  jba.z_score,
  jba.bias_category,
  count(ajs.id) as abnormal_scores_count
from public.judge_bias_analysis jba
left join public.abnormal_judge_scores ajs on ajs.judge_id = jba.judge_id
group by
  jba.judge_id,
  jba.judge_name,
  jba.judge_role,
  jba.total_evaluations,
  jba.judge_average,
  jba.global_average,
  jba.score_difference,
  jba.z_score,
  jba.bias_category
order by abs(jba.z_score) desc;

comment on view public.judge_bias_summary is 'Résumé du biais des juges pour le dashboard organisateur, trié par biais le plus important';

-- RLS : Les organisateurs peuvent voir ces analyses
grant select on public.judge_scoring_stats to authenticated;
grant select on public.judge_bias_analysis to authenticated;
grant select on public.abnormal_judge_scores to authenticated;
grant select on public.judge_bias_summary to authenticated;

-- Politique RLS pour les vues (via les tables sous-jacentes)
-- Les vues héritent des politiques des tables qu'elles utilisent
-- Les organisateurs peuvent voir toutes les analyses via leurs permissions sur judge_scores

