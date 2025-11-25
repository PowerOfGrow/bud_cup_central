# Documentation - CBD Flower Cup

Bienvenue dans la documentation du projet CBD Flower Cup. Cette documentation est organisée par thème et ordre d'implémentation.

## 📚 Index de la documentation

### 📖 Documentation Principale

1. **[01_README.md](./01_README.md)** - Index de la documentation (ce fichier)
2. **[02_OVERVIEW.md](./02_OVERVIEW.md)** - Vue d'ensemble complète de l'application
3. **[03_DEVELOPER_GUIDE.md](./03_DEVELOPER_GUIDE.md)** - Guide pour les développeurs
4. **[04_USER_GUIDE.md](./04_USER_GUIDE.md)** - Guide complet pour les utilisateurs finaux
5. **[05_API.md](./05_API.md)** - Documentation complète de l'API Supabase

### 🔧 Documentation Technique

6. **[06_ANALYTICS.md](./06_ANALYTICS.md)** - Analytics, KPIs et métriques
7. **[07_SECURITY.md](./07_SECURITY.md)** - Sécurité et bonnes pratiques
8. **[08_PERFORMANCE.md](./08_PERFORMANCE.md)** - Optimisations et métriques de performance
9. **[09_TESTING.md](./09_TESTING.md)** - Guide de tests unitaires avec Vitest
10. **[10_EMAIL_NOTIFICATIONS.md](./10_EMAIL_NOTIFICATIONS.md)** - Système de notifications email

### ⚙️ Configuration & Opérations

11. **[11_CONFIG.md](./11_CONFIG.md)** - Configuration complète (Vercel, Supabase, Resend)
12. **[12_MONITORING.md](./12_MONITORING.md)** - Configuration Sentry pour le logging des erreurs
13. **[13_ACCESSIBILITY.md](./13_ACCESSIBILITY.md)** - Plan de test et checklist WCAG 2.1 AA
14. **[14_BACKUP_RESTORE.md](./14_BACKUP_RESTORE.md)** - Procédures de sauvegarde et restauration

### 📋 Roadmap & Statut

15. **[15_IMPROVEMENTS_ROADMAP.md](./15_IMPROVEMENTS_ROADMAP.md)** - Feuille de route complète avec priorités
16. **[16_SCREENSHOTS_GUIDE.md](./16_SCREENSHOTS_GUIDE.md)** - Guide pour ajouter des captures d'écran
17. **[17_SUPABASE_REDIRECT_URLS.md](./17_SUPABASE_REDIRECT_URLS.md)** - Configuration des URLs de redirection
18. **[18_CI_CD.md](./18_CI_CD.md)** - Configuration et utilisation des workflows GitHub Actions
19. **[19_E2E_TESTING.md](./19_E2E_TESTING.md)** - Guide des tests end-to-end avec Playwright
20. **[20_COMPLETE_IMPLEMENTATION_STATUS.md](./20_COMPLETE_IMPLEMENTATION_STATUS.md)** - État complet de l'implémentation
21. **[21_TASKS_REMAINING.md](./21_TASKS_REMAINING.md)** - Tâches restantes et statut du projet

---

## 🚀 Démarrage Rapide

Pour commencer à développer :

1. **Installation des dépendances**
   ```bash
   npm install
   ```

2. **Configuration de l'environnement**
   - Copiez `.env.example` vers `.env.local`
   - Configurez vos variables Supabase (voir [11_CONFIG.md](./11_CONFIG.md))

3. **Lancement du serveur de développement**
   ```bash
   npm run dev
   ```

4. **Application des migrations SQL**
   ```bash
   supabase db push
   ```

---

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
│   ├── migrations/    # Migrations SQL (33 fichiers, ordre chronologique)
│   └── functions/    # Edge Functions
├── docs/             # Documentation (ce dossier - 21 fichiers optimisés)
└── scripts/          # Scripts utilitaires
```

---

## 🎯 Fonctionnalités Principales

### ✅ Implémentées

- **Authentification complète** avec Supabase
- **Protection des routes** par rôle
- **Dashboard multi-rôles** (Viewer/Producer/Judge/Organizer)
- **Système de votes public** (1-5 étoiles)
- **Gestion complète des entrées** (CRUD)
- **Évaluation détaillée par les juges** (4 critères)
- **Gestion des concours** par organisateurs
- **Recherche et filtres** avancés
- **Pagination** pour listes longues
- **Analytics et reporting** avec exports CSV/PDF
- **Système de badges** automatique
- **Validation COA** avec workflow complet
- **QR Codes** pour partage d'entrées
- **Catégories custom** par concours

---

## 🔐 Rôles et Permissions

- **Viewer** : Peut voter pour les entrées
- **Producer** : Peut créer et gérer ses entrées
- **Judge** : Peut évaluer les entrées assignées
- **Organizer** : Peut gérer les concours et voir toutes les entrées

---

## 📝 Notes Importantes

- Toutes les migrations SQL doivent être appliquées dans l'ordre chronologique
- Les politiques RLS (Row Level Security) sont activées sur toutes les tables
- Le bundle JavaScript est optimisé avec code splitting
- L'application utilise React 18, TypeScript, Vite et Tailwind CSS

---

## 🤝 Contribution

Pour contribuer au projet, consultez la [15_IMPROVEMENTS_ROADMAP.md](./15_IMPROVEMENTS_ROADMAP.md) pour voir les fonctionnalités prioritaires.

---

## 📞 Support

Pour toute question ou problème, consultez :
- [03_DEVELOPER_GUIDE.md](./03_DEVELOPER_GUIDE.md) pour comprendre l'architecture
- [15_IMPROVEMENTS_ROADMAP.md](./15_IMPROVEMENTS_ROADMAP.md) pour les prochaines étapes
- [11_CONFIG.md](./11_CONFIG.md) pour la configuration
