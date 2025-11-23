# Variables d'environnement Vercel

## Variables requises

Sur Vercel, vous devez créer les variables suivantes **exactement avec ces noms** (en majuscules avec le préfixe `VITE_`) :

### Variables à créer sur Vercel

1. **`VITE_SUPABASE_URL`**
   - Valeur : `https://hsrtfgpjmchsgunpynbg.supabase.co`
   - Scope : All Environments

2. **`VITE_SUPABASE_PUBLISHABLE_KEY`**
   - Valeur : Votre clé anonyme Supabase (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - Scope : All Environments

3. **`VITE_VIEWER_PROFILE_ID`**
   - Valeur : `f7777777-7777-7777-7777-777777777777`
   - Scope : All Environments

4. **`VITE_PRODUCER_PROFILE_ID`**
   - Valeur : `b2222222-2222-2222-2222-222222222222`
   - Scope : All Environments

5. **`VITE_JUDGE_PROFILE_ID`**
   - Valeur : `d4444444-4444-4444-4444-444444444444`
   - Scope : All Environments

## ⚠️ Important

- Les noms doivent être **en majuscules avec le préfixe `VITE_`** (comme ci-dessus)
- Vite ne charge automatiquement que les variables qui commencent par `VITE_`
- `vercel.json` n'a plus besoin de la section `env` - Vercel utilise directement les variables d'environnement
- Supprimez les anciennes variables en minuscules si elles existent

## Variables optionnelles (non nécessaires)

- `VITE_SUPABASE_PROJECT_ID` - Non utilisée, peut être supprimée
- `SUPABASE_ACCESS_TOKEN` - Utilisée uniquement pour les scripts de déploiement, pas pour l'application

## Vérification

Après avoir créé/modifié les variables :
1. Allez dans Vercel → Settings → Environment Variables
2. Vérifiez que les 5 variables ci-dessus existent (en majuscules avec `VITE_`)
3. Redéployez l'application si nécessaire

## Note

`vercel.json` a été simplifié - la section `env` a été supprimée car Vercel utilise automatiquement les variables d'environnement configurées dans le dashboard.

