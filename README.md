# CBD Flower Cup – Plateforme Concours

Application React (Vite + TypeScript) dédiée à la gestion des concours “CBD Flower Cup”.

## Pile technique
- Vite + React 18 + TypeScript  
- Tailwind CSS + shadcn/ui  
- Supabase (auth, base de données, stockage)  
- React Router, React Query (prévu)

## Prérequis
- Node.js ≥ 18.18  
- npm 9+ (ou Bun si vous préférez, mais le lock officiel est `package-lock.json`)  
- Compte Supabase avec accès au projet `hsrtfgpjmchsgunpynbg`

## Installation locale
```bash
git clone <votre-url>
cd bud-cup-central
npm install
npm run dev
```

## Variables d’environnement
Créer un fichier `.env` à la racine :
```
VITE_SUPABASE_URL=https://hsrtfgpjmchsgunpynbg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<clé anonyme ou service key restreinte>
VITE_VIEWER_PROFILE_ID=f7777777-7777-7777-7777-777777777777
VITE_PRODUCER_PROFILE_ID=b2222222-2222-2222-2222-222222222222
VITE_JUDGE_PROFILE_ID=d4444444-4444-4444-4444-444444444444
```
> ⚠️ Sans ces variables, le client Supabase ne sera pas initialisé (erreur explicite côté runtime).
> Les IDs de profil sont optionnels : s'ils sont renseignés, les nouveaux dashboards utiliseront vos propres comptes.

## Migration Supabase
1. Installer le CLI si besoin : `npm install -g supabase`  
2. Lier le projet :
   ```bash
   supabase link --project-ref hsrtfgpjmchsgunpynbg
   ```
3. Appliquer les migrations SQL versionnées (ex: `supabase/migrations/20241123150000_initial_schema.sql`) :
   ```bash
   supabase db push    # ou supabase db reset pour un nouveau projet
   ```
4. (Optionnel) injecter les données d’exemple `supabase/seed.sql` :
   ```bash
   supabase db remote commit --file supabase/seed.sql
   # ou supabase db reset --seed supabase/seed.sql en local
   ```
5. Générer les types TypeScript chaque fois que le schéma évolue :
   ```bash
   supabase gen types typescript --project-id hsrtfgpjmchsgunpynbg --schema public > src/integrations/supabase/types.ts
   ```
   (Nécessite un `SUPABASE_ACCESS_TOKEN` avec accès au projet.)

### Tables principales
- `profiles` : miroir de `auth.users` avec rôle (`organizer`, `producer`, `judge`, `viewer`)  
- `contests` : métadonnées d’un concours (statut, dates, règlement, visuel)  
- `entries` + `entry_documents` + `entry_badges` : candidatures, pièces jointes, trophées  
- `contest_judges` : assignations des juges par concours  
- `judge_scores` et `public_votes` : notations expertes + votes communautaires

Les règles RLS de base sont en place (lecture publique des données approuvées, modifications réservées aux producteurs/juges/organisateurs). Adaptez-les selon vos flux métier.

## Scripts npm
- `npm run dev` : serveur de développement Vite  
- `npm run build` : build production  
- `npm run preview` : prévisualisation du build  
- `npm run lint` : ESLint

## Structure rapide
- `src/pages` : pages React (Index, NotFound…)  
- `src/pages/Dashboard.tsx` : tableaux de bord Viewer/Producteur/Jury connectés à Supabase  
- `src/components` : UI et sections marketing  
- `src/integrations/supabase` : client + types générés  
- `supabase/config.toml` : configuration CLI pointant sur `hsrtfgpjmchsgunpynbg`
- `supabase/migrations` & `supabase/seed.sql` : schéma versionné + données d’exemple

## Prochaines étapes
- Remplir `.env` avec les clés Supabase réelles  
- Mettre en place React Query + `QueryClientProvider` pour consommer les tables  
- Définir le schéma (Concours, Entrées, Votes, Jurés) et regénérer `types.ts`  
- Ajouter des tests et CI

Bonne contribution !
