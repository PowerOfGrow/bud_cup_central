-- Migration: Attribution automatique des badges selon les résultats de concours
-- Permet d'attribuer automatiquement les badges (Or, Argent, Bronze, Choix du public) selon les classements

-- Fonction pour calculer le classement des entrées d'un concours
create or replace function public.calculate_contest_rankings(
  p_contest_id uuid
)
returns table (
  entry_id uuid,
  strain_name text,
  producer_id uuid,
  combined_score numeric,
  judge_average numeric,
  public_average numeric,
  rank bigint
)
language plpgsql
security definer
as $$
declare
  v_jury_weight numeric;
  v_public_weight numeric;
begin
  -- Récupérer les pondérations du concours
  select 
    coalesce(jury_weight, 0.7),
    coalesce(public_weight, 0.3)
  into v_jury_weight, v_public_weight
  from public.contests
  where id = p_contest_id;

  -- Calculer les classements
  return query
  with entry_scores as (
    select
      e.id as entry_id,
      e.strain_name,
      e.producer_id,
      -- Moyenne des scores jury
      coalesce(avg(js.overall_score), 0) as judge_average,
      -- Moyenne des votes publics (normalisée sur 100)
      coalesce((avg(pv.score) / 5.0) * 100.0, 0) as public_average,
      -- Score combiné selon les pondérations
      (
        (coalesce(avg(js.overall_score), 0) * v_jury_weight) +
        ((coalesce((avg(pv.score) / 5.0) * 100.0, 0)) * v_public_weight)
      ) as combined_score
    from public.entries e
    left join public.judge_scores js on js.entry_id = e.id
    left join public.public_votes pv on pv.entry_id = e.id
    where e.contest_id = p_contest_id
      and e.status = 'approved'
    group by e.id, e.strain_name, e.producer_id
  )
  select
    es.entry_id,
    es.strain_name,
    es.producer_id,
    es.combined_score,
    es.judge_average,
    es.public_average,
    rank() over (order by es.combined_score desc, es.judge_average desc) as rank
  from entry_scores es
  order by es.combined_score desc, es.judge_average desc;
end;
$$;

comment on function public.calculate_contest_rankings is 'Calcule le classement des entrées d''un concours selon le score combiné (jury + public)';

-- Fonction pour attribuer automatiquement les badges selon les résultats
create or replace function public.award_automatic_badges(
  p_contest_id uuid,
  p_auto_people_choice boolean default true
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_entry record;
  v_rank integer;
  v_public_winner_entry_id uuid;
  v_badge_count integer := 0;
  v_results jsonb := jsonb_build_array();
begin
  -- Vérifier que le concours est terminé
  if not exists (
    select 1 from public.contests 
    where id = p_contest_id and status = 'completed'
  ) then
    raise exception 'Le concours doit être terminé pour attribuer les badges automatiquement';
  end if;

  -- Attribuer les badges Or, Argent, Bronze selon le classement
  for v_entry in 
    select * from public.calculate_contest_rankings(p_contest_id)
    limit 3
  loop
    v_rank := v_entry.rank::integer;
    
    -- Vérifier si le badge existe déjà
    if not exists (
      select 1 from public.entry_badges 
      where entry_id = v_entry.entry_id 
        and badge = case 
          when v_rank = 1 then 'gold'
          when v_rank = 2 then 'silver'
          when v_rank = 3 then 'bronze'
        end
    ) then
      -- Attribuer le badge
      insert into public.entry_badges (entry_id, badge, label, description)
      values (
        v_entry.entry_id,
        case 
          when v_rank = 1 then 'gold'
          when v_rank = 2 then 'silver'
          when v_rank = 3 then 'bronze'
        end,
        case 
          when v_rank = 1 then 'Médaille d''Or - 1ère Place'
          when v_rank = 2 then 'Médaille d''Argent - 2ème Place'
          when v_rank = 3 then 'Médaille de Bronze - 3ème Place'
        end,
        case 
          when v_rank = 1 then 'Première place du concours avec un score combiné de ' || round(v_entry.combined_score, 2) || '/100'
          when v_rank = 2 then 'Deuxième place du concours avec un score combiné de ' || round(v_entry.combined_score, 2) || '/100'
          when v_rank = 3 then 'Troisième place du concours avec un score combiné de ' || round(v_entry.combined_score, 2) || '/100'
        end
      );
      
      v_badge_count := v_badge_count + 1;
      v_results := v_results || jsonb_build_object(
        'entry_id', v_entry.entry_id,
        'badge', case 
          when v_rank = 1 then 'gold'
          when v_rank = 2 then 'silver'
          when v_rank = 3 then 'bronze'
        end,
        'rank', v_rank
      );
    end if;
  end loop;

  -- Attribuer le badge "Choix du public" si demandé
  if p_auto_people_choice then
    -- Trouver l'entrée avec le meilleur score public
    select entry_id into v_public_winner_entry_id
    from (
      select 
        e.id as entry_id,
        avg(pv.score) as public_avg_score,
        count(pv.id) as vote_count
      from public.entries e
      join public.public_votes pv on pv.entry_id = e.id
      where e.contest_id = p_contest_id
        and e.status = 'approved'
      group by e.id
      order by avg(pv.score) desc, count(pv.id) desc
      limit 1
    ) winner;

    -- Attribuer le badge "Choix du public" si trouvé et pas déjà attribué
    if v_public_winner_entry_id is not null 
      and not exists (
        select 1 from public.entry_badges 
        where entry_id = v_public_winner_entry_id 
          and badge = 'people_choice'
      ) then
      
      insert into public.entry_badges (entry_id, badge, label, description)
      values (
        v_public_winner_entry_id,
        'people_choice',
        'Choix du Public',
        'Meilleur score moyen du public pour ce concours'
      );
      
      v_badge_count := v_badge_count + 1;
      v_results := v_results || jsonb_build_object(
        'entry_id', v_public_winner_entry_id,
        'badge', 'people_choice',
        'type', 'public_choice'
      );
    end if;
  end if;

  -- Retourner les résultats
  return jsonb_build_object(
    'success', true,
    'badges_awarded', v_badge_count,
    'results', v_results
  );
end;
$$;

comment on function public.award_automatic_badges is 'Attribue automatiquement les badges (Or, Argent, Bronze, Choix du public) selon les résultats du concours';

-- Vue pour voir les classements actuels d'un concours
create or replace view public.contest_rankings as
select
  c.id as contest_id,
  c.name as contest_name,
  r.entry_id,
  r.strain_name,
  r.producer_id,
  r.combined_score,
  r.judge_average,
  r.public_average,
  r.rank
from public.contests c
cross join lateral public.calculate_contest_rankings(c.id) r
where c.status = 'completed'
order by c.name, r.rank;

comment on view public.contest_rankings is 'Vue des classements de tous les concours terminés';

-- Fonction pour obtenir les classements d'un concours spécifique
create or replace function public.get_contest_rankings(
  p_contest_id uuid
)
returns table (
  entry_id uuid,
  strain_name text,
  producer_id uuid,
  combined_score numeric,
  judge_average numeric,
  public_average numeric,
  rank bigint,
  has_gold_badge boolean,
  has_silver_badge boolean,
  has_bronze_badge boolean,
  has_people_choice_badge boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select
    cr.entry_id,
    cr.strain_name,
    cr.producer_id,
    cr.combined_score,
    cr.judge_average,
    cr.public_average,
    cr.rank,
    exists(select 1 from public.entry_badges where entry_id = cr.entry_id and badge = 'gold') as has_gold_badge,
    exists(select 1 from public.entry_badges where entry_id = cr.entry_id and badge = 'silver') as has_silver_badge,
    exists(select 1 from public.entry_badges where entry_id = cr.entry_id and badge = 'bronze') as has_bronze_badge,
    exists(select 1 from public.entry_badges where entry_id = cr.entry_id and badge = 'people_choice') as has_people_choice_badge
  from public.calculate_contest_rankings(p_contest_id) cr;
end;
$$;

comment on function public.get_contest_rankings is 'Retourne les classements d''un concours avec les badges déjà attribués';

-- Grants pour permettre l'exécution des fonctions (organisateurs uniquement)
grant execute on function public.calculate_contest_rankings(uuid) to authenticated;
grant execute on function public.award_automatic_badges(uuid, boolean) to authenticated;
grant execute on function public.get_contest_rankings(uuid) to authenticated;
grant select on public.contest_rankings to authenticated;

