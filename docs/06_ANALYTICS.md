# 📊 Analytics & KPIs - Documentation Complète

## ✅ Statut : TOUTES LES MÉTRIQUES SONT IMPLÉMENTÉES

Ce document définit les métriques et KPIs (Key Performance Indicators) utilisés dans la plateforme CBD Flower Cup. Toutes les métriques sont calculées via des vues SQL pour garantir la cohérence et servir de "source de vérité".

---

## 📈 KPIs Globaux

### Producteurs Actifs

**Définition** : Producteurs ayant soumis au moins une entrée (statut: `submitted`, `under_review`, ou `approved`)

**Calcul** :
```sql
SELECT active_producers_count 
FROM kpi_global_stats;
```

**Variantes** :
- `active_producers_last_30d` : Producteurs actifs dans les 30 derniers jours

**Vue SQL** : `kpi_active_producers` - Liste détaillée de tous les producteurs actifs

---

### Votants Actifs

**Définition** : Utilisateurs ayant voté au moins une fois pour une entrée

**Calcul** :
```sql
SELECT active_voters_count 
FROM kpi_global_stats;
```

**Variantes** :
- `active_voters_last_30d` : Votants actifs dans les 30 derniers jours

**Vue SQL** : `kpi_active_voters` - Liste détaillée de tous les votants actifs

---

### Taux d'Engagement

**Définition** : Ratio entre le nombre total de votes et le nombre d'entrées approuvées

**Formule** :
```
Taux d'Engagement = (Votes totaux / Entrées approuvées) × 100
```

**Calcul** :
```sql
SELECT engagement_rate_percent 
FROM kpi_global_stats;
```

**Interprétation** :
- 100% = chaque entrée a reçu 1 vote en moyenne
- 200% = chaque entrée a reçu 2 votes en moyenne
- <100% = certaines entrées n'ont pas encore de votes

---

### Taux de Complétion

**Définition** : Pourcentage d'entrées approuvées qui ont été évaluées par au moins un juge

**Formule** :
```
Taux de Complétion = (Entrées évaluées / Entrées approuvées) × 100
```

**Calcul** :
```sql
SELECT completion_rate_percent 
FROM kpi_global_stats;
```

**Interprétation** :
- 100% = toutes les entrées approuvées ont été évaluées
- <100% = certaines entrées attendent encore une évaluation

---

## 🎯 KPIs par Concours

**Vue SQL** : `kpi_contest_stats`

### Métriques disponibles

1. **`producers_count`** : Nombre de producteurs uniques ayant soumis au moins une entrée
2. **`entries_approved`** : Nombre d'entrées approuvées
3. **`total_votes`** : Nombre total de votes publics
4. **`unique_voters`** : Nombre de votants uniques
5. **`average_vote_score`** : Score moyen des votes publics (sur 5)
6. **`total_scores`** : Nombre total de scores jury
7. **`active_judges_count`** : Nombre de juges ayant évalué
8. **`average_judge_score`** : Score moyen des juges (sur 100)
9. **`engagement_rate_percent`** : Taux d'engagement pour ce concours
10. **`completion_rate_percent`** : Taux de complétion pour ce concours

**Exemple d'utilisation** :
```sql
SELECT 
  contest_name,
  entries_approved,
  total_votes,
  engagement_rate_percent,
  completion_rate_percent
FROM kpi_contest_stats
WHERE contest_status = 'judging';
```

---

## 👥 Producteurs Actifs - Détails

**Vue SQL** : `kpi_active_producers`

### Colonnes disponibles

- `producer_id` : ID du producteur
- `producer_name` : Nom d'affichage
- `organization` : Organisation
- `total_entries` : Nombre total d'entrées soumises
- `approved_entries` : Nombre d'entrées approuvées
- `contests_participated` : Nombre de concours participés
- `average_score` : Score moyen reçu
- `last_entry_date` : Date de dernière soumission
- `last_activity_date` : Date de dernière activité

**Exemple** :
```sql
SELECT * 
FROM kpi_active_producers 
ORDER BY total_entries DESC 
LIMIT 10;
```

---

## 🗳️ Votants Actifs - Détails

**Vue SQL** : `kpi_active_voters`

### Colonnes disponibles

- `voter_id` : ID du votant
- `voter_name` : Nom d'affichage
- `total_votes` : Nombre total de votes
- `unique_entries_voted` : Nombre d'entrées uniques votées
- `contests_voted` : Nombre de concours où le votant a voté
- `average_vote` : Score moyen donné
- `votes_last_30d` : Votes dans les 30 derniers jours
- `votes_last_7d` : Votes dans les 7 derniers jours

**Exemple** :
```sql
SELECT * 
FROM kpi_active_voters 
ORDER BY total_votes DESC 
LIMIT 10;
```

---

## 📊 Métriques d'Engagement

**Vue SQL** : `kpi_engagement_metrics`

### Métriques disponibles

1. **`global_engagement_rate`** : Taux d'engagement global (voir définition ci-dessus)
2. **`average_votes_per_entry`** : Nombre moyen de votes par entrée
3. **`producer_participation_rate`** : % de producteurs ayant soumis au moins une entrée
4. **`voter_participation_rate`** : % de viewers ayant voté au moins une fois

**Formules** :

**Producer Participation Rate** :
```
(Producteurs actifs / Total producteurs) × 100
```

**Voter Participation Rate** :
```
(Votants actifs / Total viewers) × 100
```

---

## ✅ Vérification de l'Implémentation

### Métriques Mentionnées dans OVERVIEW.md

#### Section "Analytics et Insights Avancés"
- ✅ **Statistiques globales** - IMPLÉMENTÉ
- ✅ **Métriques par concours** - IMPLÉMENTÉ
- ✅ **Graphiques temporels** - IMPLÉMENTÉ
- ✅ **Export CSV/PDF** - IMPLÉMENTÉ
- ✅ **Métriques d'engagement** - IMPLÉMENTÉ

#### Section "Analytics et reporting" - Organisateurs
- ✅ **Statistiques globales (concours, entrées, votes, participants)** - IMPLÉMENTÉ
- ✅ **Métriques par concours (participation, engagement, scores)** - IMPLÉMENTÉ
- ✅ **Graphiques temporels (30 derniers jours)** - IMPLÉMENTÉ
- ✅ **Export CSV et PDF** - IMPLÉMENTÉ

### Détail de l'Implémentation Frontend

**Fichiers** :
- `src/hooks/use-organizer-analytics.ts` - Hook principal pour les analytics
- `src/pages/Dashboard.tsx` - Affichage des métriques et exports
- `src/components/OrganizerCharts.tsx` - Graphiques temporels

**Métriques disponibles** :
- `totalContests`, `activeContests`, `totalEntries`, `totalProducers`, `totalJudges`, `totalVotes`
- Métriques par concours avec `entriesCount`, `votesCount`, `judgesCount`, `averageScore`
- Participation : `totalProducers`, `activeProducers`, `totalViewers`, `activeVoters`
- Engagement : `averageVotesPerEntry`, `averageScoresPerEntry`, `completionRate`
- Graphiques temporels : 30 jours de données avec `entries`, `votes`, `scores` par jour

**Exports** :
- ✅ CSV : Export complet avec toutes les statistiques
- ✅ PDF : Export formaté avec tables et graphiques (lazy loaded avec jsPDF)

### Vues SQL KPIs (Source de Vérité)

**Migration** : `supabase/migrations/20241201000012_create_kpi_views.sql`

#### Vues disponibles :

1. ✅ `kpi_global_stats` - KPIs globaux de la plateforme
   - Producteurs actifs (total et 30 jours)
   - Votants actifs (total et 30 jours)
   - Juges actifs
   - Entrées approuvées (total et 30 jours)
   - Votes totaux (total et 30 jours)
   - Scores totaux
   - Taux d'engagement

2. ✅ `kpi_contest_stats` - KPIs par concours
   - Nombre de producteurs
   - Entrées approuvées
   - Votes totaux et votants uniques
   - Score moyen des votes publics
   - Scores totaux et juges actifs
   - Score moyen des juges
   - Taux d'engagement et complétion

3. ✅ `kpi_active_producers` - Liste détaillée des producteurs actifs
4. ✅ `kpi_active_voters` - Liste détaillée des votants actifs
5. ✅ `kpi_engagement_metrics` - Métriques d'engagement standardisées

---

## 🔄 Fréquence de Calcul

### Vues SQL

Les vues SQL sont calculées **en temps réel** à chaque requête. Pour des performances optimales sur de grands volumes de données, envisager des vues matérialisées avec rafraîchissement périodique.

### Cache Frontend

Les KPIs sont mis en cache côté frontend via React Query avec un `refetchInterval` de 60 secondes par défaut.

---

## 📝 Notes d'Implémentation

### Définitions Standardisées

- **Producteur actif** : A soumis au moins une entrée (statut soumis/approuvé)
- **Votant actif** : A voté au moins une fois
- **Juge actif** : A accepté une invitation et a évalué au moins une entrée

### Périodes

- **Derniers 30 jours** : `created_at > now() - interval '30 days'`
- **Derniers 7 jours** : `created_at > now() - interval '7 days'`

### Arrondissements

- Les pourcentages sont arrondis à 2 décimales
- Les scores moyens sont arrondis à 2 décimales

---

## 🔍 Requêtes Utiles

### Top 10 Producteurs par Entrées
```sql
SELECT producer_name, total_entries, approved_entries, average_score
FROM kpi_active_producers
ORDER BY total_entries DESC
LIMIT 10;
```

### Concours les plus engagés
```sql
SELECT contest_name, total_votes, engagement_rate_percent
FROM kpi_contest_stats
WHERE contest_status = 'completed'
ORDER BY engagement_rate_percent DESC
LIMIT 10;
```

### Évolution temporelle des votes
```sql
SELECT 
  date_trunc('day', created_at) as date,
  count(*) as votes_count
FROM public_votes
WHERE created_at > now() - interval '30 days'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;
```

---

## ✅ Résumé des Vérifications

| Métrique | Documentation | Implémentation | Statut |
|----------|--------------|----------------|--------|
| Statistiques globales | ✅ OVERVIEW.md | ✅ use-organizer-analytics.ts | ✅ OK |
| Métriques par concours | ✅ OVERVIEW.md | ✅ use-organizer-analytics.ts | ✅ OK |
| Graphiques temporels | ✅ OVERVIEW.md | ✅ use-organizer-analytics.ts | ✅ OK |
| Export CSV | ✅ OVERVIEW.md | ✅ Dashboard.tsx | ✅ OK |
| Export PDF | ✅ OVERVIEW.md | ✅ Dashboard.tsx | ✅ OK |
| Participation | ✅ OVERVIEW.md | ✅ use-organizer-analytics.ts | ✅ OK |
| Engagement | ✅ OVERVIEW.md | ✅ use-organizer-analytics.ts | ✅ OK |

---

## 📚 Références

- Vues SQL : `supabase/migrations/20241201000012_create_kpi_views.sql`
- Hook React : `src/hooks/use-organizer-analytics.ts`
- Dashboard : `src/pages/Dashboard.tsx`
- Composant Graphiques : `src/components/OrganizerCharts.tsx`

**Date de vérification** : 2024-12-03  
**Statut** : ✅ TOUTES LES MÉTRIQUES SONT IMPLÉMENTÉES

