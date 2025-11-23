# Variables d'environnement Vercel

## Variables requises

Sur Vercel, vous devez créer les variables suivantes **exactement avec ces noms** (en minuscules) :

### Variables à créer sur Vercel

1. **`vite_supabase_url`**
   - Valeur : `https://hsrtfgpjmchsgunpynbg.supabase.co`
   - Scope : All Environments

2. **`vite_supabase_publishable_key`**
   - Valeur : Votre clé anonyme Supabase (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - Scope : All Environments

3. **`vite_viewer_profile_id`**
   - Valeur : `f7777777-7777-7777-7777-777777777777`
   - Scope : All Environments

4. **`vite_producer_profile_id`**
   - Valeur : `b2222222-2222-2222-2222-222222222222`
   - Scope : All Environments

5. **`vite_judge_profile_id`**
   - Valeur : `d4444444-4444-4444-4444-444444444444`
   - Scope : All Environments

## ⚠️ Important

- Les noms doivent être **en minuscules** (comme ci-dessus)
- `vercel.json` les transforme automatiquement en `VITE_...` (majuscules) pour Vite
- Ne créez **PAS** de variables avec des noms en majuscules comme `VITE_SUPABASE_URL`
- Supprimez les anciennes variables en majuscules si elles existent

## Variables optionnelles (non nécessaires)

- `VITE_SUPABASE_PROJECT_ID` - Non utilisée, peut être supprimée
- `SUPABASE_ACCESS_TOKEN` - Utilisée uniquement pour les scripts de déploiement, pas pour l'application

## Vérification

Après avoir créé/modifié les variables :
1. Allez dans Vercel → Settings → Environment Variables
2. Vérifiez que les 5 variables ci-dessus existent (en minuscules)
3. Redéployez l'application si nécessaire

