-- Migration: Optimisation des performances avec index supplémentaires
-- Ajoute des index composites et optimise les requêtes fréquentes

-- 1. Index composite pour entries : contest + status (très fréquent)
create index if not exists entries_contest_status_idx 
  on public.entries(contest_id, status)
  where status in ('submitted', 'under_review', 'approved');

-- 2. Index composite pour entries : contest + producer (pour dashboard producteur)
create index if not exists entries_contest_producer_idx 
  on public.entries(contest_id, producer_id);

-- 3. Index composite pour entries : producer + status (pour dashboard producteur)
create index if not exists entries_producer_status_idx 
  on public.entries(producer_id, status, created_at desc);

-- 4. Index pour entries : date de création (pour tri chronologique)
create index if not exists entries_created_at_idx 
  on public.entries(created_at desc);

-- 5. Index composite pour entries : contest + category + status (pour filtrage)
create index if not exists entries_contest_category_status_idx 
  on public.entries(contest_id, category, status)
  where status in ('approved', 'archived');

-- 6. Index pour judge_scores : judge + entry (pour dashboard juge)
create index if not exists judge_scores_judge_entry_idx 
  on public.judge_scores(judge_id, entry_id);

-- 7. Index composite pour judge_scores : entry + overall_score (pour tri rapide)
create index if not exists judge_scores_entry_overall_idx 
  on public.judge_scores(entry_id, overall_score desc);

-- 8. Index pour judge_scores : judge + created_at (pour historique)
create index if not exists judge_scores_judge_created_idx 
  on public.judge_scores(judge_id, created_at desc);

-- 9. Index pour public_votes : voter + entry (pour vérification unicité rapide)
create index if not exists public_votes_voter_entry_idx 
  on public.public_votes(voter_profile_id, entry_id);

-- 10. Index composite pour public_votes : entry + score + created_at (pour tri)
create index if not exists public_votes_entry_score_created_idx 
  on public.public_votes(entry_id, score desc, created_at desc);

-- 11. Index pour notifications : user + type + read (très fréquent)
create index if not exists notifications_user_type_read_idx 
  on public.notifications(user_id, type, read)
  where read = false;

-- 12. Index composite pour notifications : user + created_at (pour tri)
create index if not exists notifications_user_created_idx 
  on public.notifications(user_id, created_at desc);

-- 13. Index pour notifications : type + created_at (pour analytics)
create index if not exists notifications_type_created_idx 
  on public.notifications(type, created_at desc);

-- 14. Index pour contest_judges : judge + invitation_status (pour dashboard juge)
create index if not exists contest_judges_judge_status_idx 
  on public.contest_judges(judge_id, invitation_status);

-- 15. Index composite pour contest_judges : contest + invitation_status (pour filtrage)
create index if not exists contest_judges_contest_status_idx 
  on public.contest_judges(contest_id, invitation_status);

-- 16. Index pour contests : status + start_date (pour liste concours actifs)
create index if not exists contests_status_start_date_idx 
  on public.contests(status, start_date desc)
  where status in ('registration', 'judging', 'completed');

-- 17. Index pour contests : created_by + status (pour dashboard organisateur)
create index if not exists contests_created_by_status_idx 
  on public.contests(created_by, status);

-- 18. Index pour profiles : role (pour filtrage rapide)
create index if not exists profiles_role_idx 
  on public.profiles(role)
  where role in ('organizer', 'judge', 'producer');

-- 19. Index pour profiles : country (pour analytics géographiques)
create index if not exists profiles_country_idx 
  on public.profiles(country)
  where country is not null;

-- 20. Index partiel pour entries : COA validé (pour validation workflow)
create index if not exists entries_coa_validated_status_idx 
  on public.entries(coa_validated, status)
  where coa_validated = false and status in ('submitted', 'under_review');

-- 21. Index pour entries : THC percent (pour filtrage légal)
create index if not exists entries_thc_percent_idx 
  on public.entries(thc_percent)
  where thc_percent is not null;

-- 22. Index composite pour entries : contest + THC compliance (pour vérifications)
create index if not exists entries_contest_thc_idx 
  on public.entries(contest_id, thc_percent)
  where thc_percent is not null;

-- 23. Index pour entry_audit_log : entry + action + created_at (pour historique)
create index if not exists entry_audit_log_entry_action_created_idx 
  on public.entry_audit_log(entry_id, action, created_at desc);

-- 24. Index pour coa_download_logs : user + date (pour statistiques)
create index if not exists coa_download_logs_user_date_idx 
  on public.coa_download_logs(user_id, last_downloaded_at desc);

-- 25. Index pour coa_download_logs : entry + date (pour tracking)
create index if not exists coa_download_logs_entry_date_idx 
  on public.coa_download_logs(entry_id, last_downloaded_at desc);

-- Commentaires pour documentation
comment on index entries_contest_status_idx is 'Optimise les requêtes de liste d''entrées par concours et statut';
comment on index entries_contest_producer_idx is 'Optimise les requêtes de dashboard producteur par concours';
comment on index entries_producer_status_idx is 'Optimise les requêtes de dashboard producteur avec tri chronologique';
comment on index judge_scores_judge_entry_idx is 'Optimise les requêtes de dashboard juge';
comment on index public_votes_voter_entry_idx is 'Optimise la vérification d''unicité des votes';
comment on index notifications_user_type_read_idx is 'Optimise l''affichage des notifications non lues';
comment on index contests_status_start_date_idx is 'Optimise l''affichage des concours actifs';
comment on index entries_coa_validated_status_idx is 'Optimise la liste des entrées nécessitant validation COA';

