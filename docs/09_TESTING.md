# Guide de Tests - CBD Flower Cup

## Vue d'ensemble

Ce projet utilise **Vitest** comme framework de test, avec **React Testing Library** pour tester les composants React.

## Installation

Les dépendances de test sont déjà installées :

```bash
npm install
```

## Types de tests

### Tests unitaires
Les tests unitaires vérifient le comportement isolé des composants et hooks.

**Localisation** : `src/**/__tests__/`

### Tests d'intégration
Les tests d'intégration vérifient le comportement de plusieurs composants ensemble.

**Localisation** : `src/__tests__/integration/`

**Tests disponibles** :
- `auth-flow.test.tsx` : Flux d'authentification (login, register, protected routes)
- `entry-flow.test.tsx` : Flux des entrées (affichage, recherche)

### Tests E2E
Les tests end-to-end vérifient le comportement complet de l'application.

**Localisation** : `e2e/`

**Voir** : [Documentation E2E](./E2E_TESTING.md)

## Exécution des tests

### Tous les tests
```bash
npm run test
```

### Tests en mode watch (développement)
```bash
npm run test
# Vitest s'exécute en mode watch par défaut
```

### Tests avec interface graphique
```bash
npm run test:ui
```

### Tests avec couverture de code
```bash
npm run test:coverage
```

## Structure des tests

Les tests sont organisés dans des dossiers `__tests__` à côté des fichiers qu'ils testent :

```
src/
├── hooks/
│   ├── use-auth.ts
│   └── __tests__/
│       └── use-auth.test.tsx
├── components/
│   ├── LoadingState.tsx
│   └── __tests__/
│       └── LoadingState.test.tsx
└── test/
    └── setup.ts  # Configuration globale des tests
```

## Tests existants

### Hooks
- ✅ `use-auth.test.tsx` - Tests du hook d'authentification
- ✅ `use-pagination.test.tsx` - Tests du hook de pagination

### Composants
- ✅ `LoadingState.test.tsx` - Tests du composant de chargement

## Écrire de nouveaux tests

### Exemple : Test d'un hook

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "../use-my-hook";

describe("useMyHook", () => {
  it("should do something", () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.value).toBe(expected);
  });
});
```

### Exemple : Test d'un composant

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "../MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## Mocking

### Mock Supabase

Pour mocker Supabase dans les tests :

```typescript
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));
```

## Bonnes pratiques

1. **Nommage** : Utilisez des noms descriptifs pour les tests
2. **Isolation** : Chaque test doit être indépendant
3. **AAA Pattern** : Arrange, Act, Assert
4. **Accessibilité** : Testez avec `screen.getByRole()` plutôt que `getByText()` quand possible
5. **Couverture** : Viser au moins 70% de couverture pour les composants critiques

## Configuration

La configuration des tests se trouve dans :
- `vitest.config.ts` - Configuration principale
- `src/test/setup.ts` - Setup global (matchers, cleanup)

## Prochaines étapes

- [ ] Tests E2E avec Playwright
- [ ] Tests d'intégration pour les pages complètes
- [ ] Tests de performance
- [ ] Tests d'accessibilité automatisés

