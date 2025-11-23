# Supabase Edge Functions

Ces fonctions edge exposent les données utilisées par les nouveaux tableaux de bord.  
Chaque fonction attend un paramètre `profileId` (UUID) et renvoie un JSON formaté pour l’UI.

> ⚠️ Les fonctions utilisent `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.  
> Configure-les dans le projet Supabase (`supabase secrets set ...`) avant le déploiement.

---

## 1. viewer-dashboard

- **Fichier**: `supabase/functions/viewer-dashboard/index.ts`  
- **Méthode**: `GET`  
- **Paramètres**:
  - `profileId` (query string) – identifiant du membre gratuit.  
- **Réponse**:
  ```jsonc
  {
    "totalVotes": 5,
    "averageScore": 4.6,
    "latestVotes": [...],
    "upcomingContests": [...]
  }
  ```
- **Usage**: alimente l’onglet “Membre gratuit” du dashboard (historique des votes + concours ouverts).

---

## 2. producer-dashboard

- **Fichier**: `supabase/functions/producer-dashboard/index.ts`  
- **Méthode**: `GET`  
- **Paramètres**:
  - `profileId` (query string) – identifiant du producteur.  
- **Réponse**:
  ```jsonc
  {
    "totals": { "totalEntries": 2, "approved": 1, ... },
    "overallAverage": 91.5,
    "nextDeadline": "2025-02-15T23:59:59Z",
    "entries": [
      {
        "strain_name": "Emerald Velvet",
        "judgeAverage": 91,
        "publicAverage": 5,
        ...
      }
    ]
  }
  ```
- **Usage**: statistiques producteur (avancement dossiers, notes jurés/public, prochaines échéances).

---

## 3. judge-dashboard

- **Fichier**: `supabase/functions/judge-dashboard/index.ts`  
- **Méthode**: `GET`  
- **Paramètres**:
  - `profileId` (query string) – identifiant du juré.  
- **Réponse**:
  ```jsonc
  {
    "assignments": [...],
    "reviews": [...],
    "stats": { "totalReviews": 6, "averageScore": 88.5 }
  }
  ```
- **Usage**: suivi des concours assignés et des fiches d’évaluation remplies.

---

## Déploiement

```bash
supabase functions deploy viewer-dashboard
supabase functions deploy producer-dashboard
supabase functions deploy judge-dashboard
```

Puis, pour tester en local :

```bash
supabase functions serve viewer-dashboard --env-file .env
# GET http://localhost:54321/functions/v1/viewer-dashboard?profileId=...
```

Adapte les `profileId` selon tes utilisateurs réels ou ceux fournis par le seed (`supabase/seed.sql`).

