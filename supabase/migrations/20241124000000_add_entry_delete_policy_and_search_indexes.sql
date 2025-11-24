-- Migration: Ajout de la politique DELETE pour les entrées et index pour la recherche
-- Date: 2024-11-24

-- 1. Politique RLS pour permettre aux producteurs de supprimer leurs propres entrées
-- (surtout celles en brouillon)
do $$ begin
  create policy "Producers delete their draft entries"
    on public.entries
    for delete
    using (
      auth.role() = 'service_role'
      or (
        auth.uid() = producer_id
        and status = 'draft'  -- Seulement les brouillons peuvent être supprimés
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

-- 2. Index pour optimiser la recherche par nom de variété (case-insensitive)
create index if not exists entries_strain_name_idx 
  on public.entries(lower(strain_name));

-- 3. Index pour optimiser le filtre par catégorie
create index if not exists entries_category_idx 
  on public.entries(category);

-- 4. Index composite pour optimiser les requêtes de recherche avec filtre catégorie
create index if not exists entries_category_status_idx 
  on public.entries(category, status) 
  where status in ('approved', 'archived');

-- 5. Index pour optimiser la recherche dans les profils terpéniques (si utilisé souvent)
-- Note: Pour une recherche full-text plus avancée, on pourrait utiliser tsvector
-- mais pour l'instant, un index simple suffit
create index if not exists entries_terpene_profile_idx 
  on public.entries(terpene_profile) 
  where terpene_profile is not null;

-- 6. Index pour optimiser les requêtes de votes publics (tri par score)
create index if not exists public_votes_entry_score_idx 
  on public.public_votes(entry_id, score desc);

-- 7. Index pour optimiser les requêtes de scores jury (tri par score)
create index if not exists judge_scores_entry_overall_idx 
  on public.judge_scores(entry_id, overall_score desc);

-- Commentaire: Ces index améliorent les performances pour:
-- - Recherche par nom de variété (case-insensitive)
-- - Filtrage par catégorie
-- - Tri par scores (jury et public)
-- - Recherche dans les profils terpéniques

