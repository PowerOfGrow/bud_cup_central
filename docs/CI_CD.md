# CI/CD - GitHub Actions

## Vue d'ensemble

Le projet utilise GitHub Actions pour automatiser les tests, les vérifications de qualité de code, et les déploiements.

## Workflows

### 1. CI - Tests et Quality Checks (`.github/workflows/ci.yml`)

Ce workflow s'exécute sur chaque push et pull request vers `main` ou `develop`.

**Actions effectuées :**
- ✅ Installation des dépendances (`npm ci`)
- ✅ Linting avec ESLint (`npm run lint`)
- ✅ Vérification des types TypeScript (`npx tsc --noEmit`)
- ✅ Exécution des tests unitaires (`npm run test`)
- ✅ Build de l'application (`npm run build`)

**Déclenchement :**
- Push sur `main` ou `develop`
- Pull Request vers `main` ou `develop`

### 2. Deploy to Vercel Production (`.github/workflows/deploy.yml`)

Ce workflow déploie automatiquement l'application sur Vercel en production.

**Actions effectuées :**
- ✅ Installation de Vercel CLI
- ✅ Pull des variables d'environnement depuis Vercel
- ✅ Build de l'application
- ✅ Déploiement en production

**Déclenchement :**
- Push sur `main` uniquement
- Ignore les changements dans `docs/`, `*.md`, `.gitignore`

### 3. Deploy to Vercel Staging (`.github/workflows/deploy-staging.yml`)

Ce workflow déploie automatiquement l'application sur Vercel en staging (preview).

**Actions effectuées :**
- ✅ Installation de Vercel CLI
- ✅ Pull des variables d'environnement depuis Vercel (preview)
- ✅ Build de l'application
- ✅ Déploiement en staging/preview

**Déclenchement :**
- Push sur `develop` uniquement
- Ignore les changements dans `docs/`, `*.md`, `.gitignore`

**Note** : Pour activer le staging, créez une branche `develop` :
```bash
git checkout -b develop
git push origin develop
```

## Configuration requise

### Secrets GitHub

Pour que les workflows fonctionnent, vous devez configurer les secrets suivants dans GitHub :

**Settings → Secrets and variables → Actions**

#### Pour le workflow CI :
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` : Clé anonyme Supabase

#### Pour le workflow Deploy :
- `VERCEL_TOKEN` : Token d'API Vercel
  - Obtenez-le sur : https://vercel.com/account/tokens
- `VERCEL_ORG_ID` : ID de votre organisation Vercel
  - Trouvable dans l'URL de votre projet Vercel
- `VERCEL_PROJECT_ID` : ID de votre projet Vercel
  - Trouvable dans l'URL de votre projet Vercel

### Comment obtenir les IDs Vercel

1. Allez sur votre projet Vercel
2. Ouvrez les Settings → General
3. L'**Org ID** et le **Project ID** sont visibles dans l'URL ou dans les paramètres

## Utilisation

### Tests locaux avant push

Avant de pousser votre code, vous pouvez exécuter les mêmes vérifications localement :

```bash
# Linting
npm run lint

# Type check
npx tsc --noEmit

# Tests
npm run test -- --run

# Build
npm run build
```

### Déploiement manuel

Si vous devez déployer manuellement :

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod
```

## Statut des workflows

Vous pouvez voir le statut des workflows :
- Dans l'onglet **Actions** de votre dépôt GitHub
- Sur chaque commit (badge de statut)
- Sur chaque Pull Request (check de statut)

## Dépannage

### Le workflow CI échoue

1. Vérifiez les logs dans l'onglet **Actions**
2. Exécutez les commandes localement pour reproduire l'erreur
3. Vérifiez que tous les secrets sont configurés

### Le déploiement échoue

1. Vérifiez que `VERCEL_TOKEN`, `VERCEL_ORG_ID`, et `VERCEL_PROJECT_ID` sont configurés
2. Vérifiez que vous avez les permissions sur le projet Vercel
3. Vérifiez les logs dans l'onglet **Actions**

## Améliorations futures

- [x] Tests E2E avec Playwright dans le CI
- [x] Déploiement staging automatique sur la branche `develop`
- [ ] Notifications Slack/Discord sur les échecs
- [ ] Cache des dépendances pour accélérer les builds
- [ ] Tests de performance (Lighthouse CI)

