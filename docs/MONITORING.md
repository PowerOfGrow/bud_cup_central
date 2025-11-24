# Monitoring et Logging des Erreurs

## Vue d'ensemble

Le projet utilise **Sentry** pour le logging des erreurs et le monitoring des performances en production.

## Configuration Sentry

### Installation

Les dépendances sont déjà installées :
- `@sentry/react` : SDK Sentry pour React
- `@sentry/vite-plugin` : Plugin Vite pour l'upload des source maps

### Configuration requise

#### 1. Créer un projet Sentry

1. Allez sur https://sentry.io et créez un compte (gratuit)
2. Créez un nouveau projet React
3. Copiez le **DSN** fourni

#### 2. Variables d'environnement

Ajoutez la variable suivante dans votre `.env` (local) et sur Vercel :

```env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Pour Vercel** :
- Allez dans Settings → Environment Variables
- Ajoutez `VITE_SENTRY_DSN` avec votre DSN Sentry

#### 3. Configuration pour l'upload des source maps (optionnel)

Pour l'upload automatique des source maps lors du build :

```env
SENTRY_ORG=votre-org
SENTRY_PROJECT=votre-projet
SENTRY_AUTH_TOKEN=votre-token-auth
```

**Comment obtenir le token** :
1. Allez sur https://sentry.io/settings/account/api/auth-tokens/
2. Créez un nouveau token avec les permissions `project:releases`
3. Ajoutez-le comme secret GitHub (pour CI/CD) ou variable d'environnement Vercel

### Fonctionnalités

#### Error Boundary

Un `ErrorBoundary` est configuré dans `App.tsx` pour capturer toutes les erreurs React non gérées.

**Fichier** : `src/components/ErrorBoundary.tsx`

- Capture automatiquement les erreurs React
- Envoie les erreurs à Sentry avec le contexte
- Affiche une interface utilisateur conviviale en cas d'erreur

#### Initialisation

Sentry est initialisé dans `src/main.tsx` avant le rendu de l'application.

**Fichier** : `src/lib/sentry.ts`

**Configuration** :
- **Performance Monitoring** : Activé (10% des transactions en production)
- **Session Replay** : Activé (10% des sessions, 100% des erreurs)
- **Environnement** : Détecté automatiquement (`development` / `production`)
- **Développement** : Les erreurs sont loggées dans la console mais pas envoyées

### Utilisation manuelle

#### Capturer une erreur

```typescript
import * as Sentry from "@sentry/react";

try {
  // Code qui peut échouer
} catch (error) {
  Sentry.captureException(error);
  // Gérer l'erreur
}
```

#### Ajouter du contexte

```typescript
Sentry.setContext("user", {
  id: user.id,
  email: user.email,
  role: profile.role,
});

Sentry.setTag("feature", "voting");
```

#### Messages personnalisés

```typescript
Sentry.captureMessage("Something important happened", "info");
```

### Dashboard Sentry

Une fois configuré, vous pouvez voir :

- **Erreurs** : Toutes les erreurs JavaScript capturées
- **Performance** : Temps de chargement des pages, requêtes lentes
- **Session Replay** : Enregistrements vidéo des sessions avec erreurs
- **Releases** : Suivi des déploiements et des erreurs par version

### Dépannage

#### Sentry ne capture pas les erreurs

1. Vérifiez que `VITE_SENTRY_DSN` est configuré
2. Vérifiez la console du navigateur pour les warnings
3. Vérifiez que vous êtes en mode `production` (les erreurs ne sont pas envoyées en `development`)

#### Les source maps ne fonctionnent pas

1. Vérifiez que `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, et `SENTRY_PROJECT` sont configurés
2. Vérifiez que le build génère des source maps (`build.sourcemap: "hidden"` dans `vite.config.ts`)
3. Vérifiez les logs du build pour les erreurs d'upload

### Bonnes pratiques

1. **Ne pas logger les erreurs sensibles** : Évitez de logger les mots de passe, tokens, etc.
2. **Ajouter du contexte** : Utilisez `setContext` et `setTag` pour faciliter le débogage
3. **Grouper les erreurs** : Utilisez des fingerprints personnalisés si nécessaire
4. **Tester en production** : Les erreurs ne sont envoyées qu'en production

## Vercel Analytics (à venir)

Pour le monitoring des performances et analytics, vous pouvez ajouter Vercel Analytics :

```bash
npm install @vercel/analytics
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

// Dans le render
<Analytics />
```

## Alternatives

Si vous préférez d'autres solutions :

- **LogRocket** : Session replay et logging
- **Bugsnag** : Error tracking similaire à Sentry
- **Rollbar** : Error tracking avec intégrations

