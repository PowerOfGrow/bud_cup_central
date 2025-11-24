# Documentation - CBD Flower Cup

Bienvenue dans la documentation du projet CBD Flower Cup. Cette documentation est organisée par thème pour faciliter la navigation.

## 📚 Index de la documentation

### 📊 Analyse et État du Projet

- **[Phases Accomplies](./PHASES_ACCOMPLIES.md)** - Récapitulatif complet de toutes les phases de développement accomplies
- **[Analyse de l'Application](./ANALYSE_APPLICATION.md)** - Analyse détaillée de l'architecture, des fonctionnalités et des recommandations
- **[Roadmap](./roadmap.md)** - Feuille de route complète avec priorités et fonctionnalités à venir

### 🔧 Configuration et Déploiement

- **[Edge Functions](./edge-functions.md)** - Documentation des fonctions serverless Supabase
- **[Variables d'environnement Vercel](./vercel-env-vars.md)** - Configuration des variables d'environnement pour Vercel
- **[Secrets Supabase](./supabase-secrets.md)** - Gestion des secrets et clés API Supabase

## 🚀 Démarrage Rapide

Pour commencer à développer :

1. **Installation des dépendances**
   ```bash
   npm install
   ```

2. **Configuration de l'environnement**
   - Copiez `.env.example` vers `.env.local`
   - Configurez vos variables Supabase (voir [supabase-secrets.md](./supabase-secrets.md))

3. **Lancement du serveur de développement**
   ```bash
   npm run dev
   ```

4. **Application des migrations SQL**
   ```bash
   supabase db push
   ```

## 📖 Structure du Projet

```
bud-cup-central/
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── hooks/         # Hooks personnalisés (useAuth, usePagination, etc.)
│   ├── pages/         # Pages de l'application
│   ├── integrations/  # Intégrations (Supabase, etc.)
│   └── lib/          # Utilitaires et helpers
├── supabase/
│   ├── migrations/    # Migrations SQL
│   └── functions/    # Edge Functions
└── docs/             # Documentation (ce dossier)
```

## 🎯 Fonctionnalités Principales

### ✅ Implémentées

- **Authentification complète** avec Supabase
- **Protection des routes** par rôle
- **Dashboard multi-rôles** (Viewer/Producer/Judge/Organizer)
- **Système de votes public** (1-5 étoiles)
- **Gestion complète des entrées** (CRUD)
- **Évaluation détaillée par les juges** (5 critères)
- **Gestion des concours** par organisateurs
- **Recherche et filtres** avancés
- **Pagination** pour listes longues

### 🔄 En cours / À venir

- Upload réel de fichiers vers Supabase Storage
- Assignation des juges aux concours
- Publication des résultats
- Notifications en temps réel
- Analytics et reporting
- Export de données (CSV, PDF)

## 🔐 Rôles et Permissions

- **Viewer** : Peut voter pour les entrées
- **Producer** : Peut créer et gérer ses entrées
- **Judge** : Peut évaluer les entrées assignées
- **Organizer** : Peut gérer les concours et voir toutes les entrées

## 📝 Notes Importantes

- Toutes les migrations SQL doivent être appliquées dans l'ordre
- Les politiques RLS (Row Level Security) sont activées sur toutes les tables
- Le bundle JavaScript est optimisé avec code splitting
- L'application utilise React 18, TypeScript, Vite et Tailwind CSS

## 🤝 Contribution

Pour contribuer au projet, consultez la [roadmap](./roadmap.md) pour voir les fonctionnalités prioritaires.

## 📞 Support

Pour toute question ou problème, consultez :
- [Analyse de l'Application](./ANALYSE_APPLICATION.md) pour comprendre l'architecture
- [Phases Accomplies](./PHASES_ACCOMPLIES.md) pour voir ce qui a été fait
- [Roadmap](./roadmap.md) pour les prochaines étapes

