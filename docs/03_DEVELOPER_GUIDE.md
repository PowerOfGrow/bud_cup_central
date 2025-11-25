# Guide Développeur - CBD Flower Cup

Ce guide est destiné aux développeurs qui souhaitent contribuer au projet ou comprendre son architecture.

## Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Structure du projet](#structure-du-projet)
4. [Architecture](#architecture)
5. [Développement](#développement)
6. [Tests](#tests)
7. [Déploiement](#déploiement)
8. [Conventions de code](#conventions-de-code)
9. [Contribuer](#contribuer)

---

## Prérequis

- **Node.js** ≥ 18.18
- **npm** 9+ (ou équivalent)
- **Git**
- **Compte Supabase** avec accès au projet
- **Compte Vercel** (pour le déploiement)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/PowerOfGrow/bud_cup_central.git
cd bud-cup-central
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Créez un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://hsrtfgpjmchsgunpynbg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_anon
VITE_VIEWER_PROFILE_ID=f7777777-7777-7777-7777-777777777777
VITE_PRODUCER_PROFILE_ID=b2222222-2222-2222-2222-222222222222
VITE_JUDGE_PROFILE_ID=d4444444-4444-4444-4444-444444444444
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:8080`

---

## Structure du projet

```
bud-cup-central/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── ui/             # Composants shadcn/ui
│   │   └── __tests__/      # Tests des composants
│   ├── hooks/              # Hooks personnalisés
│   │   └── __tests__/      # Tests des hooks
│   ├── pages/              # Pages de l'application
│   ├── integrations/       # Intégrations externes
│   │   └── supabase/       # Client Supabase et types
│   ├── lib/                # Utilitaires et helpers
│   └── services/           # Services métier
├── supabase/
│   ├── migrations/         # Migrations SQL
│   ├── functions/          # Edge Functions
│   └── seed.sql            # Données d'exemple
├── e2e/                    # Tests E2E Playwright
├── docs/                   # Documentation
├── public/                 # Fichiers statiques
└── scripts/                # Scripts utilitaires
```

---

## Architecture

### Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **Routing** : React Router v6
- **State Management** : React Query (TanStack Query)
- **Tests** : Vitest (unitaires) + Playwright (E2E)
- **CI/CD** : GitHub Actions
- **Monitoring** : Sentry

### Flux de données

```
User Action
    ↓
React Component
    ↓
Hook (useAuth, useContests, etc.)
    ↓
Supabase Client
    ↓
PostgreSQL Database
```

### Authentification

L'authentification est gérée par Supabase Auth :

1. L'utilisateur se connecte via `supabase.auth.signInWithPassword()`
2. Un profil est automatiquement créé dans `profiles` (trigger SQL)
3. Le hook `useAuth()` récupère le profil et le met en cache
4. Les routes protégées utilisent `<ProtectedRoute>`

### Gestion d'état

- **React Query** : Cache des données serveur
- **Context API** : Thème, authentification
- **Local State** : `useState` pour l'état local des composants

---

## Développement

### Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
npm run test         # Tests unitaires (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
```

### Ajouter une nouvelle page

1. Créez le fichier dans `src/pages/` :

```typescript
// src/pages/NewPage.tsx
import Header from "@/components/Header";

const NewPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" tabIndex={-1} className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <h1>Nouvelle Page</h1>
        </div>
      </main>
    </div>
  );
};

export default NewPage;
```

2. Ajoutez la route dans `src/App.tsx` :

```typescript
const NewPage = lazy(() => import("./pages/NewPage"));

// Dans <Routes>
<Route path="/new-page" element={<NewPage />} />
```

### Créer un hook personnalisé

```typescript
// src/hooks/use-custom.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCustom() {
  return useQuery({
    queryKey: ["custom"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("table_name")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });
}
```

### Ajouter un composant UI

Les composants shadcn/ui sont dans `src/components/ui/`. Pour ajouter un nouveau :

```bash
npx shadcn-ui@latest add [component-name]
```

### Migrations SQL

1. Créez un fichier dans `supabase/migrations/` :

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql
create table if not exists public.new_table (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);
```

2. Appliquez la migration :

```bash
supabase db push
```

3. Régénérez les types TypeScript :

```bash
supabase gen types typescript --project-id hsrtfgpjmchsgunpynbg > src/integrations/supabase/types.ts
```

---

## Tests

### Tests unitaires (Vitest)

Les tests sont dans `src/**/__tests__/` :

```typescript
// src/hooks/__tests__/use-auth.test.tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "../use-auth";

describe("useAuth", () => {
  it("should return user and profile", () => {
    // Test implementation
  });
});
```

Exécuter les tests :

```bash
npm run test
```

### Tests E2E (Playwright)

Les tests sont dans `e2e/` :

```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

Exécuter les tests :

```bash
npm run test:e2e
```

---

## Déploiement

### Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement (voir `docs/vercel-env-vars.md`)
3. Le déploiement est automatique via GitHub Actions

### Déploiement manuel

```bash
npm run build
vercel --prod
```

### Edge Functions Supabase

```bash
supabase functions deploy function-name --project-ref hsrtfgpjmchsgunpynbg
```

---

## Conventions de code

### Nommage

- **Composants** : PascalCase (`UserProfile.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAuth.ts`)
- **Fichiers** : kebab-case pour les pages (`submit-entry.tsx`)
- **Variables** : camelCase (`userName`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_RETRIES`)

### TypeScript

- Utilisez TypeScript strict
- Définissez les types pour toutes les props
- Utilisez les types générés de Supabase (`Database`)

### Formatage

Le projet utilise ESLint. Formatez votre code avant de commit :

```bash
npm run lint
```

### Structure des composants

```typescript
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Composant
export const Component = ({ title }: Props) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => {
    // ...
  };
  
  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Click</Button>
    </div>
  );
};
```

### Gestion des erreurs

Utilisez `ErrorState` pour les erreurs :

```typescript
if (error) {
  return <ErrorState message="Erreur de chargement" onRetry={refetch} />;
}
```

### Loading states

Utilisez `LoadingState` pour les chargements :

```typescript
if (isLoading) {
  return <LoadingState message="Chargement..." />;
}
```

---

## Contribuer

### Workflow Git

1. Créez une branche depuis `main` :

```bash
git checkout -b feature/ma-fonctionnalite
```

2. Faites vos modifications
3. Commitez avec des messages clairs :

```bash
git commit -m "feat: Ajouter nouvelle fonctionnalité"
```

4. Poussez et créez une Pull Request

### Messages de commit

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

### Pull Request

1. Décrivez clairement les changements
2. Référencez les issues liées
3. Ajoutez des captures d'écran si nécessaire
4. Assurez-vous que les tests passent

### Code Review

- Les PR doivent être revues par au moins un développeur
- Tous les tests doivent passer
- Le code doit respecter les conventions

---

## Ressources

### Documentation

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)

### Outils

- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [ESLint](https://eslint.org/)

---

## Support

Pour toute question :
- Consultez la [documentation](./README.md)
- Ouvrez une [issue GitHub](https://github.com/PowerOfGrow/bud_cup_central/issues)
- Contactez l'équipe de développement

---

**Dernière mise à jour** : Novembre 2024

