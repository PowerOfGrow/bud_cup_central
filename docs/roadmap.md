# Roadmap - CBD Flower Cup

## 🔴 Priorité 1 : Authentification & Sécurité (Essentiel)

### 1.1 Gestion de l'état utilisateur
- [ ] Créer un hook `useAuth()` pour gérer l'état de connexion
- [ ] Afficher le profil utilisateur dans le Header (nom, avatar, menu déroulant)
- [ ] Remplacer les boutons "Connexion/S'inscrire" par "Mon compte" quand connecté
- [ ] Ajouter un bouton "Déconnexion"

### 1.2 Protection des routes
- [ ] Créer un composant `<ProtectedRoute>` pour les pages privées
- [ ] Rediriger vers `/login` si non authentifié
- [ ] Protéger `/dashboard` et futures pages admin

### 1.3 Dashboard dynamique
- [ ] Utiliser le profil réel de l'utilisateur connecté (au lieu des IDs hardcodés)
- [ ] Afficher automatiquement l'onglet correspondant au rôle de l'utilisateur
- [ ] Masquer les onglets non pertinents selon le rôle

---

## 🟠 Priorité 2 : Fonctionnalités Métier (Core Features)

### 2.1 Système de votes
- [ ] Page de vote pour les viewers
- [ ] Interface de notation (1-5 étoiles + commentaire)
- [ ] Validation des votes (un vote par utilisateur par entrée)
- [ ] Affichage des votes en temps réel

### 2.2 Gestion des entrées (Producteurs)
- [ ] Formulaire de soumission d'entrée
- [ ] Upload de documents (COA, photos)
- [ ] Suivi du statut (brouillon → soumis → en revue → approuvé)
- [ ] Modification/Suppression des entrées en brouillon

### 2.3 Évaluation des juges
- [ ] Interface de notation détaillée (apparence, densité, terpènes, etc.)
- [ ] Formulaire de fiche d'évaluation
- [ ] Historique des évaluations
- [ ] Calcul automatique des scores moyens

### 2.4 Gestion des concours (Organisateurs)
- [ ] Création/Édition de concours
- [ ] Gestion des dates (inscription, jugement, résultats)
- [ ] Assignation des juges
- [ ] Publication des résultats

---

## 🟡 Priorité 3 : UX/UI & Performance

### 3.1 Améliorations UX
- [ ] Loading states (skeletons) pour tous les chargements
- [ ] Messages d'erreur plus explicites
- [ ] Confirmations pour actions importantes (suppression, etc.)
- [ ] Notifications en temps réel (toasts améliorés)

### 3.2 Optimisations Performance
- [ ] Code splitting (lazy loading des routes)
- [ ] Optimisation des images (WebP, lazy loading)
- [ ] Mise en cache des requêtes fréquentes
- [ ] Pagination pour les listes longues

### 3.3 Responsive & Accessibilité
- [ ] Tests sur tous les breakpoints
- [ ] Amélioration du contraste (WCAG AA)
- [ ] Navigation au clavier
- [ ] Support des lecteurs d'écran

---

## 🟢 Priorité 4 : Fonctionnalités Avancées

### 4.1 Recherche & Filtres
- [ ] Recherche globale (concours, entrées, producteurs)
- [ ] Filtres avancés (catégorie, statut, date)
- [ ] Tri dynamique

### 4.2 Notifications
- [ ] Système de notifications in-app
- [ ] Notifications email (nouveau concours, résultat, etc.)
- [ ] Préférences de notification

### 4.3 Analytics & Reporting
- [ ] Tableau de bord analytics pour organisateurs
- [ ] Statistiques détaillées (participation, engagement)
- [ ] Export de données (CSV, PDF)

### 4.4 Social Features
- [ ] Partage sur réseaux sociaux
- [ ] Commentaires sur les entrées
- [ ] Favoris/Wishlist

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

