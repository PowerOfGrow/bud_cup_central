-- Migration: Création des vues KPIs "Source de Vérité" pour les analytics
-- Définit et calcule les métriques principales de manière standardisée

-- ============================================================================
-- VUE 1: KPIs Globaux de la Plateforme
-- ============================================================================
create or replace view public.kpi_global_stats as
select
  -- Producteurs
  (select count(distinct producer_id) 
   from public.entries 
   where status in ('submitted', 'under_review', 'approved')) as active_producers_count,
  
  (select count(distinct producer_id) 
   from public.entries 
   where status = 'approved' 
   and created_at > now() - interval '30 days') as active_producers_last_30d,
  
  -- Votants actifs
  (select count(distinct voter_profile_id) 
   from public.public_votes) as active_voters_count,
  
  (select count(distinct voter_profile_id) 
   from public.public_votes 
   where created_at > now() - interval '30 days') as active_voters_last_30d,
  
  -- Juges actifs
  (select count(distinct judge_id) 
   from public.contest_judges 
   where invitation_status = 'accepted') as active_judges_count,
  
  -- Entrées
  (select count(*) 
   from public.entries 
   where status = 'approved') as approved_entries_count,
  
  (select count(*) 
   from public.entries 
   where status in ('submitted', 'under_review', 'approved')
   and created_at > now() - interval '30 days') as entries_last_30d,
  
  -- Votes
  (select count(*) 
   from public.public_votes) as total_votes_count,
  
  (select count(*) 
   from public.public_votes 
   where created_at > now() - interval '30 days') as votes_last_30d,
  
  -- Scores
  (select count(*) 
   from public.judge_scores) as total_scores_count,
  
  -- Taux d'engagement
  (select 
     case 
       when count(distinct e.id) > 0 
       then round(
         (count(distinct pv.id)::numeric / count(distinct e.id)::numeric) * 100, 
         2
       )
       else 0 
     end
   from public.entries e
   left join public.public_votes pv on pv.entry_id = e.id
   where e.status = 'approved'
  ) as engagement_rate_percent,
  
  -- Taux de complétion (entrées évaluées)
  (select 
     case 
       when count(distinct e.id) > 0 
       then round(
         (count(distinct js.entry_id)::numeric / count(distinct e.id)::numeric) * 100, 
         2
       )
       else 0 
     end
   from public.entries e
   left join public.judge_scores js on js.entry_id = e.id
   where e.status = 'approved'
  ) as completion_rate_percent;

comment on view public.kpi_global_stats is 'KPIs globaux de la plateforme - Source de vérité pour les métriques principales';

-- ============================================================================
-- VUE 2: KPIs par Concours
-- ============================================================================
create or replace view public.kpi_contest_stats as
select
  c.id as contest_id,
  c.name as contest_name,
  c.status as contest_status,
  c.start_date,
  c.end_date,
  c.registration_close_date,
  
  -- Producteurs uniques ayant soumis au moins une entrée
  count(distinct e.producer_id) filter (
    where e.status in ('submitted', 'under_review', 'approved')
  ) as producers_count,
  
  -- Entrées par statut
  count(*) filter (where e.status = 'draft') as entries_draft,
  count(*) filter (where e.status = 'submitted') as entries_submitted,
  count(*) filter (where e.status = 'under_review') as entries_under_review,
  count(*) filter (where e.status = 'approved') as entries_approved,
  count(*) filter (where e.status = 'rejected') as entries_rejected,
  count(*) filter (where e.status in ('submitted', 'under_review', 'approved')) as entries_active,
  
  -- Votes
  count(distinct pv.id) as total_votes,
  count(distinct pv.voter_profile_id) as unique_voters,
  round(avg(pv.score) filter (where pv.score is not null), 2) as average_vote_score,
  
  -- Scores jury
  count(distinct js.id) as total_scores,
  count(distinct js.judge_id) as active_judges_count,
  round(avg(js.overall_score) filter (where js.overall_score is not null), 2) as average_judge_score,
  
  -- Taux d'engagement
  round(
    (count(distinct pv.id)::numeric / 
     nullif(count(distinct e.id) filter (where e.status = 'approved'), 0)) * 100, 
    2
  ) as engagement_rate_percent,
  
  -- Taux de complétion
  round(
    (count(distinct js.entry_id)::numeric / 
     nullif(count(distinct e.id) filter (where e.status = 'approved'), 0)) * 100, 
    2
  ) as completion_rate_percent

from public.contests c
left join public.entries e on e.contest_id = c.id
left join public.public_votes pv on pv.entry_id = e.id
left join public.judge_scores js on js.entry_id = e.id
group by c.id, c.name, c.status, c.start_date, c.end_date, c.registration_close_date;

comment on view public.kpi_contest_stats is 'KPIs détaillés par concours - Statistiques complètes pour chaque concours';

-- ============================================================================
-- VUE 3: Producteurs Actifs (définition standardisée)
-- ============================================================================
create or replace view public.kpi_active_producers as
select
  p.id as producer_id,
  p.display_name as producer_name,
  p.organization,
  count(distinct e.id) filter (
    where e.status in ('submitted', 'under_review', 'approved')
  ) as total_entries,
  count(distinct e.id) filter (
    where e.status = 'approved'
  ) as approved_entries,
  count(distinct e.contest_id) filter (
    where e.status in ('submitted', 'under_review', 'approved')
  ) as contests_participated,
  max(e.created_at) filter (
    where e.status in ('submitted', 'under_review', 'approved')
  ) as last_entry_date,
  min(e.created_at) filter (
    where e.status in ('submitted', 'under_review', 'approved')
  ) as first_entry_date,
  
  -- Score moyen
  round(avg(js.overall_score) filter (where js.overall_score is not null), 2) as average_score,
  
  -- Dernière activité
  greatest(
    max(e.created_at) filter (where e.status in ('submitted', 'under_review', 'approved')),
    max(js.created_at) filter (where js.judge_id = p.id)
  ) as last_activity_date

from public.profiles p
inner join public.entries e on e.producer_id = p.id
left join public.judge_scores js on js.entry_id = e.id
where p.role = 'producer'
group by p.id, p.display_name, p.organization
having count(distinct e.id) filter (
  where e.status in ('submitted', 'under_review', 'approved')
) > 0;

comment on view public.kpi_active_producers is 'Liste des producteurs actifs avec leurs statistiques - Définition: ayant soumis au moins une entrée';

-- ============================================================================
-- VUE 4: Votants Actifs (définition standardisée)
-- ============================================================================
create or replace view public.kpi_active_voters as
select
  p.id as voter_id,
  p.display_name as voter_name,
  count(distinct pv.id) as total_votes,
  count(distinct pv.entry_id) as unique_entries_voted,
  count(distinct e.contest_id) as contests_voted,
  round(avg(pv.score) filter (where pv.score is not null), 2) as average_vote,
  min(pv.created_at) as first_vote_date,
  max(pv.created_at) as last_vote_date,
  
  -- Activité récente
  count(distinct pv.id) filter (
    where pv.created_at > now() - interval '30 days'
  ) as votes_last_30d,
  
  count(distinct pv.id) filter (
    where pv.created_at > now() - interval '7 days'
  ) as votes_last_7d

from public.profiles p
inner join public.public_votes pv on pv.voter_profile_id = p.id
left join public.entries e on e.id = pv.entry_id
group by p.id, p.display_name
having count(distinct pv.id) > 0;

comment on view public.kpi_active_voters is 'Liste des votants actifs avec leurs statistiques - Définition: ayant voté au moins une fois';

-- ============================================================================
-- VUE 5: Taux d'Engagement Global (formule standardisée)
-- ============================================================================
create or replace view public.kpi_engagement_metrics as
select
  -- Taux d'engagement global = (Votes totaux / Entrées approuvées) * 100
  round(
    (select count(*) from public.public_votes)::numeric / 
    nullif((select count(*) from public.entries where status = 'approved'), 0) * 100, 
    2
  ) as global_engagement_rate,
  
  -- Taux d'engagement moyen par entrée
  round(
    (select avg(vote_count) 
     from (
       select count(*) as vote_count
       from public.public_votes
       group by entry_id
     ) sub
    ), 
    2
  ) as average_votes_per_entry,
  
  -- Taux de participation (producteurs ayant soumis / producteurs total)
  round(
    (select count(distinct producer_id) 
     from public.entries 
     where status in ('submitted', 'under_review', 'approved'))::numeric /
    nullif((select count(*) from public.profiles where role = 'producer'), 0) * 100,
    2
  ) as producer_participation_rate,
  
  -- Taux de participation votants (votants actifs / viewers total)
  round(
    (select count(distinct voter_profile_id) from public.public_votes)::numeric /
    nullif((select count(*) from public.profiles where role = 'viewer'), 0) * 100,
    2
  ) as voter_participation_rate;

comment on view public.kpi_engagement_metrics is 'Métriques d''engagement standardisées - Formules définies pour cohérence';

-- ============================================================================
-- GRANTS pour permettre l'accès aux vues (organisateurs uniquement)
-- ============================================================================
grant select on public.kpi_global_stats to authenticated;
grant select on public.kpi_contest_stats to authenticated;
grant select on public.kpi_active_producers to authenticated;
grant select on public.kpi_active_voters to authenticated;
grant select on public.kpi_engagement_metrics to authenticated;

-- RLS pour les vues (organisateurs peuvent tout voir, autres rôles limités)
-- Note: Les vues ne supportent pas directement RLS, 
-- mais les tables sous-jacentes ont déjà RLS activé

