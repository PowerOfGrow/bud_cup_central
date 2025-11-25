# Tests E2E avec Playwright

## Vue d'ensemble

Le projet utilise **Playwright** pour les tests end-to-end (E2E) qui vérifient le comportement complet de l'application du point de vue de l'utilisateur.

## Installation

Les dépendances sont déjà installées. Si nécessaire :

```bash
npm install
npx playwright install --with-deps chromium
```

## Exécution des tests

### Tous les tests E2E

```bash
npm run test:e2e
```

### Tests avec interface graphique

```bash
npm run test:e2e:ui
```

### Tests en mode headed (avec navigateur visible)

```bash
npm run test:e2e:headed
```

## Structure des tests

Les tests E2E sont organisés dans le dossier `e2e/` :

```
e2e/
├── auth.spec.ts        # Tests d'authentification
├── navigation.spec.ts  # Tests de navigation
└── contests.spec.ts    # Tests de la page concours
```

## Tests disponibles

### Authentification (`auth.spec.ts`)

- ✅ Affichage du bouton de connexion
- ✅ Navigation vers la page de connexion
- ✅ Affichage du formulaire de connexion
- ✅ Affichage du formulaire d'inscription
- ✅ Sélecteurs de rôle dans l'inscription

### Navigation (`navigation.spec.ts`)

- ✅ Présence du header
- ✅ Navigation vers les concours
- ✅ Navigation vers À propos
- ✅ Lien dashboard (si connecté)
- ✅ Contenu principal

### Concours (`contests.spec.ts`)

- ✅ Affichage de la page concours
- ✅ Présence du contenu principal
- ✅ Barre de recherche
- ✅ Affichage des entrées ou message vide

## Configuration

La configuration Playwright se trouve dans `playwright.config.ts` :

- **Base URL** : `http://localhost:8080` (ou `PLAYWRIGHT_TEST_BASE_URL`)
- **Timeout** : 30 secondes par test
- **Retry** : 2 tentatives en CI
- **Screenshots** : Capturés uniquement en cas d'échec
- **Traces** : Capturés lors des retries

## CI/CD

Les tests E2E sont automatiquement exécutés dans le workflow GitHub Actions (`.github/workflows/ci.yml`) :

1. Le serveur de développement est démarré automatiquement
2. Les navigateurs Playwright sont installés
3. Les tests sont exécutés
4. Les rapports sont générés

## Écriture de nouveaux tests

### Exemple de test

```typescript
import { test, expect } from '@playwright/test';

test('devrait faire quelque chose', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
});
```

### Bonnes pratiques

1. **Utiliser des sélecteurs robustes** : Préférer `getByRole`, `getByLabel`, `getByText`
2. **Attendre les chargements** : Utiliser `waitForLoadState('networkidle')` si nécessaire
3. **Gérer les états asynchrones** : Utiliser `expect().toBeVisible()` avec timeout
4. **Isoler les tests** : Chaque test doit être indépendant
5. **Nommer clairement** : Utiliser des noms descriptifs en français

### Helpers utiles

```typescript
// Attendre qu'un élément soit visible
await expect(page.getByText('Texte')).toBeVisible();

// Attendre la fin du chargement réseau
await page.waitForLoadState('networkidle');

// Vérifier l'URL
await expect(page).toHaveURL(/.*login/);

// Cliquer sur un élément
await page.getByRole('button', { name: /connexion/i }).click();
```

## Dépannage

### Les tests échouent localement

1. Vérifiez que le serveur de développement est démarré (`npm run dev`)
2. Vérifiez que les navigateurs sont installés (`npx playwright install`)
3. Exécutez en mode headed pour voir ce qui se passe : `npm run test:e2e:headed`

### Les tests sont lents

- Réduisez le nombre de workers dans `playwright.config.ts`
- Utilisez `page.waitForLoadState('domcontentloaded')` au lieu de `networkidle`

### Les sélecteurs ne fonctionnent pas

- Utilisez `page.locator()` avec des sélecteurs CSS si nécessaire
- Ajoutez des `data-testid` dans vos composants pour des sélecteurs plus stables

## Tests Responsive

Des tests spécifiques pour le responsive design sont disponibles dans `e2e/responsive.spec.ts` :

- ✅ Tests sur mobile (320px, 375px)
- ✅ Tests sur tablette (768px)
- ✅ Tests sur desktop (1280px, 1920px)
- ✅ Vérification des débordements horizontaux
- ✅ Tests sur différents devices (Chrome, Safari, iPad)

## Améliorations futures

- [ ] Tests d'authentification complète (login/logout)
- [ ] Tests de soumission d'entrée (producteur)
- [ ] Tests d'évaluation (juge)
- [ ] Tests de gestion de concours (organisateur)
- [ ] Tests de vote public
- [ ] Tests de recherche et filtres

