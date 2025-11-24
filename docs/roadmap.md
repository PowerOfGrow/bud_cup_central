# Roadmap - CBD Flower Cup

## 🔴 Priorité 1 : Authentification & Sécurité (Essentiel)

### 1.1 Gestion de l'état utilisateur
- [x] Créer un hook `useAuth()` pour gérer l'état de connexion
- [x] Afficher le profil utilisateur dans le Header (nom, avatar, menu déroulant)
- [x] Remplacer les boutons "Connexion/S'inscrire" par "Mon compte" quand connecté
- [x] Ajouter un bouton "Déconnexion"

### 1.2 Protection des routes
- [x] Créer un composant `<ProtectedRoute>` pour les pages privées
- [x] Rediriger vers `/login` si non authentifié
- [x] Protéger `/dashboard` et futures pages admin

### 1.3 Dashboard dynamique
- [x] Utiliser le profil réel de l'utilisateur connecté (au lieu des IDs hardcodés)
- [x] Afficher automatiquement l'onglet correspondant au rôle de l'utilisateur
- [x] Masquer les onglets non pertinents selon le rôle

---

## 🟠 Priorité 2 : Fonctionnalités Métier (Core Features)

### 2.1 Système de votes
- [x] Page de vote pour les viewers
- [x] Interface de notation (1-5 étoiles + commentaire)
- [x] Validation des votes (un vote par utilisateur par entrée)
- [x] Affichage des votes en temps réel

### 2.2 Gestion des entrées (Producteurs)
- [x] Formulaire de soumission d'entrée
- [x] Upload de documents (COA, photos) - Implémenté avec Supabase Storage
- [x] Suivi du statut (brouillon → soumis → en revue → approuvé)
- [x] Modification/Suppression des entrées en brouillon

### 2.3 Évaluation des juges
- [x] Interface de notation détaillée (apparence, densité, terpènes, etc.)
- [x] Formulaire de fiche d'évaluation
- [x] Historique des évaluations
- [x] Calcul automatique des scores moyens

### 2.4 Gestion des concours (Organisateurs)
- [x] Création/Édition de concours
- [x] Gestion des dates (inscription, jugement, résultats)
- [x] Assignation des juges
- [x] Publication des résultats

---

## 🟡 Priorité 3 : UX/UI & Performance

### 3.1 Améliorations UX
- [x] Loading states (skeletons) pour tous les chargements
- [x] Messages d'erreur plus explicites
- [x] Confirmations pour actions importantes (suppression, etc.)
- [x] Notifications en temps réel (toasts améliorés)

### 3.2 Optimisations Performance
- [x] Code splitting (lazy loading des routes)
- [x] Optimisation des images (lazy loading, gestion d'erreurs)
- [x] Mise en cache des requêtes fréquentes (React Query)
- [x] Pagination pour les listes longues

### 3.3 Responsive & Accessibilité
- [ ] Tests sur tous les breakpoints
- [ ] Amélioration du contraste (WCAG AA)
- [ ] Navigation au clavier
- [ ] Support des lecteurs d'écran

---

## 🟢 Priorité 4 : Fonctionnalités Avancées

### 4.1 Recherche & Filtres
- [x] Recherche globale (entrées par nom, producteur, terpènes)
- [x] Filtres avancés (catégorie)
- [x] Tri dynamique (nom, score jury, vote public)
- [x] Recherche globale étendue (concours, producteurs)

### 4.2 Notifications
- [x] Système de notifications in-app
- [ ] Notifications email (nouveau concours, résultat, etc.)
- [ ] Préférences de notification

### 4.3 Analytics & Reporting
- [x] Tableau de bord analytics pour organisateurs
- [x] Statistiques détaillées (participation, engagement)
- [x] Export de données (CSV)
- [x] Export PDF

### 4.4 Social Features
- [x] Partage sur réseaux sociaux
- [x] Favoris/Wishlist
- [x] Commentaires sur les entrées

---

## 🔵 Priorité 5 : Infrastructure & DevOps

### 5.1 Tests
- [ ] Tests unitaires (Vitest)
- [ ] Tests d'intégration
- [ ] Tests E2E (Playwright)

### 5.2 CI/CD
- [ ] Pipeline GitHub Actions
- [ ] Tests automatiques avant déploiement
- [ ] Déploiement automatique staging/prod

### 5.3 Monitoring
- [ ] Logging des erreurs (Sentry)
- [ ] Analytics (Google Analytics ou Plausible)
- [ ] Monitoring des performances (Vercel Analytics)

### 5.4 Documentation
- [ ] Documentation API
- [ ] Guide utilisateur
- [ ] Guide développeur

---

## 📋 Prochaines étapes immédiates

1. **Créer le hook `useAuth()`** - Base pour tout le reste
2. **Mettre à jour le Header** - Afficher l'état de connexion
3. **Protéger les routes** - Sécurité de base
4. **Dashboard dynamique** - Utiliser le vrai profil utilisateur

---

## 💡 Idées futures

- Application mobile (React Native)
- API publique pour intégrations tierces
- Système de badges et récompenses avancé
- Marketplace pour les producteurs
- Blog/Actualités intégré
- Multilingue (FR/EN)


