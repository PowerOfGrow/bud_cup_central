# Configuration des variables d’environnement

Ce guide explique comment préparer toutes les variables nécessaires pour travailler avec le projet **Bud Cup Central** (Vite + Supabase) en local et sur Vercel.

---

## 1. Variables locales (`.env`)

Crée un fichier `.env` à la racine du projet avec les valeurs connues :

```ini
VITE_SUPABASE_URL=https://hsrtfgpjmchsgunpynbg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzcnRmZ3BqbWNoc2d1bnB5bmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTYxMDAsImV4cCI6MjA3OTQ5MjEwMH0.kTJxSRmdMmkEwB-f35BIv56oGLkyEIFgL5WrxLG9PpE
VITE_VIEWER_PROFILE_ID=f7777777-7777-7777-7777-777777777777
VITE_PRODUCER_PROFILE_ID=b2222222-2222-2222-2222-222222222222
VITE_JUDGE_PROFILE_ID=d4444444-4444-4444-4444-444444444444
```

> - Les identifiants de profils correspondent aux comptes de démo définis dans `supabase/seed.sql`.  
> - Tu peux les remplacer par tes propres IDs Supabase si tu veux voir ton activité réelle dans les dashboards.

Pour les commandes ponctuelles, tu peux aussi exporter ces variables dans ta session PowerShell avant de lancer `npm run dev` ou `npm run build` :

```powershell
$env:VITE_SUPABASE_URL="https://hsrtfgpjmchsgunpynbg.supabase.co"
$env:VITE_SUPABASE_PUBLISHABLE_KEY="..."
...
npm run dev
```

---

## 2. Secrets Vercel

Assure-toi d’ajouter les mêmes valeurs dans **Project Settings → Environment Variables** sur Vercel.  
Grâce au `vercel.json`, Vercel attend les clés suivantes :

| Nom sur Vercel | Valeur |
| -------------- | ------ |
| `vite_supabase_url` | `https://hsrtfgpjmchsgunpynbg.supabase.co` |
| `vite_supabase_publishable_key` | Clé anon Supabase |
| `vite_viewer_profile_id` | `f7777777-7777-7777-7777-777777777777` (ou ton ID viewer) |
| `vite_producer_profile_id` | `b2222222-2222-2222-2222-222222222222` |
| `vite_judge_profile_id` | `d4444444-4444-4444-4444-444444444444` |

Vercel injectera automatiquement ces secrets lors du build (`import.meta.env.VITE_*`).

---

## 3. Variables côté Supabase CLI

Pour utiliser le CLI (migrations, seed, génération de types) :

```bash
supabase login
supabase link --project-ref hsrtfgpjmchsgunpynbg
```

Les commandes de migration/seed lisent directement les fichiers SQL du repo (`supabase/migrations` et `supabase/seed.sql`) et n’exigent pas d’autres variables tant que tu es connecté.

---

## 4. Résumé rapide

1. Remplir `.env` avec les 5 variables ci-dessus.  
2. Copier les mêmes valeurs dans Vercel (`Project Settings → Environment Variables`).  
3. Vérifier que `supabase link` pointe bien sur `hsrtfgpjmchsgunpynbg`.  
4. Lancer `npm run dev` ou `npm run build` : Vite lira automatiquement `VITE_*`.

Avec cette configuration, le client Supabase et les tableaux de bord (viewer/producteur/juré) fonctionneront partout (local, preview, prod).

