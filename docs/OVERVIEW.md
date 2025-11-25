# CBD Flower Cup - Vue d'ensemble de l'Application

## 📋 Résumé Exécutif

**CBD Flower Cup** est une plateforme web complète et moderne dédiée à l'organisation et à la gestion de concours de fleurs de CBD. L'application permet aux organisateurs de créer et gérer des concours, aux producteurs de soumettre leurs produits, aux juges experts d'évaluer les entrées selon des critères professionnels, et au public de voter et interagir avec les candidatures.

---

## 🎯 Fonctionnalités Principales

### 1. Système d'Authentification et Gestion des Rôles

- **Inscription et connexion sécurisées** via Supabase Auth
- **4 rôles distincts** avec permissions granulaires :
  - **Organisateur** : Création et gestion complète des concours
  - **Producteur** : Soumission et gestion de ses entrées
  - **Juge** : Évaluation détaillée des entrées assignées
  - **Membre gratuit (Viewer)** : Vote public et consultation
- **Création automatique de profil** lors de l'inscription
- **Protection des routes** par rôle avec redirection automatique

### 2. Gestion des Concours (Organisateurs)

- **Création et édition de concours** avec métadonnées complètes :
  - Nom, description, slug unique
  - Dates (début, fin, clôture des inscriptions)
  - Localisation, prix, règlement
  - Statuts : brouillon, inscription, jugement, terminé, archivé
- **Assignation des juges** aux concours avec suivi des invitations
- **Publication des résultats** avec classements et badges
- **Analytics et reporting** :
  - Statistiques globales (concours, entrées, votes, participants)
  - Métriques par concours (participation, engagement, scores)
  - Graphiques temporels (30 derniers jours)
  - Export CSV et PDF

### 3. Gestion des Entrées (Producteurs)

- **Soumission d'entrées** avec formulaire complet :
  - Informations produit (nom, cultivar, catégorie)
  - Profil cannabinoïde (THC, CBD)
  - Profil terpénique
  - Code de lot
  - Upload de photos et documents COA (Certificat d'Analyse)
- **Gestion du cycle de vie** :
  - Brouillon → Soumis → En revue → Approuvé/Rejeté
  - Modification et suppression des brouillons uniquement
- **Suivi des performances** :
  - Score moyen jury
  - Note moyenne publique
  - Nombre de votes et commentaires

### 4. Évaluation par les Juges

- **Interface d'évaluation détaillée** avec 5 critères notés sur 100 :
  - Apparence
  - Densité
  - Terpènes
  - Goût
  - Effet
- **Calcul automatique du score global** (moyenne pondérée)
- **Commentaires et notes** pour chaque critère
- **Historique des évaluations** dans le dashboard

### 5. Système de Vote Public

- **Vote par étoiles** (1 à 5 étoiles) pour chaque entrée
- **Commentaires publics** associés aux votes
- **Un vote par utilisateur par entrée** (système d'upsert)
- **Affichage en temps réel** des moyennes et statistiques

### 6. Fonctionnalités Sociales

- **Favoris** : Ajout/suppression d'entrées en favoris
- **Commentaires** : Système de commentaires sur les entrées avec édition/suppression
- **Partage social** : Partage d'entrées sur les réseaux sociaux
- **Recherche globale** : Recherche avancée dans les concours, producteurs et entrées

### 7. Notifications et Préférences

- **Système de notifications in-app** :
  - Création de concours
  - Assignation de juge
  - Approbation/rejet d'entrée
  - Nouveaux votes et scores
- **Préférences utilisateur** : Configuration des notifications email et in-app
- **Compteur de notifications non lues** dans le header

### 8. Dashboard Multi-Rôles

- **Dashboard personnalisé** selon le rôle :
  - **Viewer** : Historique des votes, concours à venir, favoris
  - **Producteur** : Statistiques d'entrées, prochaines échéances, liste des candidatures
  - **Juge** : Concours assignés, statistiques d'évaluations, prochaines sessions
  - **Organisateur** : Analytics complets, gestion des concours, statistiques globales

### 9. Recherche et Filtres

- **Recherche globale** : Recherche dans concours, producteurs et entrées
- **Filtres avancés** :
  - Par catégorie (indica, sativa, hybrid, etc.)
  - Par statut de concours
  - Par statut d'entrée
- **Tri dynamique** : Par date, score, nombre de votes
- **Pagination** pour les listes longues

### 10. Accessibilité et Performance

- **Conformité WCAG AA** :
  - Navigation au clavier (skip links)
  - Support des lecteurs d'écran (ARIA)
  - Contraste amélioré
  - Focus visible
- **Optimisations de performance** :
  - Code splitting et lazy loading
  - Images optimisées (lazy loading, WebP)
  - Bundle optimisé (chunks séparés)
  - Cache des requêtes (React Query)

---

## 💻 Technologies et Stack Technique

### Frontend

- **Framework** : React 18.3.1 avec TypeScript 5.8.3
- **Build Tool** : Vite 5.4.19 (compilation rapide, HMR)
- **Styling** :
  - Tailwind CSS 3.4.17 (utility-first CSS)
  - shadcn/ui (composants React accessibles basés sur Radix UI)
- **Routing** : React Router DOM 6.30.1
- **State Management** :
  - React Query (TanStack Query) 5.83.0 (cache et synchronisation serveur)
  - React Hook Form 7.61.1 (gestion de formulaires)
- **Validation** : Zod 3.25.76 (validation de schémas TypeScript)
- **Graphiques** : Recharts 2.15.4 (visualisation de données)
- **Export** : jsPDF 3.0.4 + jspdf-autotable 5.0.2 (génération PDF)
- **Notifications** : Sonner 1.7.4 (toasts modernes)
- **Icons** : Lucide React 0.462.0

### Backend & Infrastructure

- **Backend-as-a-Service** : Supabase
  - **Base de données** : PostgreSQL avec Row Level Security (RLS)
  - **Authentification** : Supabase Auth (JWT, sessions)
  - **Storage** : Supabase Storage (photos, documents COA)
  - **Edge Functions** : Deno runtime (send-email)
- **Monitoring** :
  - Sentry 10.26.0 (erreurs et performance)
  - Vercel Analytics 1.5.0 (métriques web)

### DevOps & Qualité

- **CI/CD** : GitHub Actions
  - Tests automatiques (lint, type-check, unit, E2E)
  - Déploiement automatique sur Vercel (production et staging)
- **Tests** :
  - Vitest 4.0.13 (tests unitaires)
  - Playwright 1.56.1 (tests E2E)
  - React Testing Library 16.3.0
- **Linting** : ESLint 9.32.0 avec TypeScript ESLint
- **Hébergement** : Vercel (déploiement automatique, CDN global)

### Architecture du Code

- **Structure modulaire** :
  - Composants réutilisables (`src/components/`)
  - Hooks personnalisés (`src/hooks/`)
  - Pages (`src/pages/`)
  - Services (`src/services/`)
  - Intégrations (`src/integrations/`)
- **Type Safety** : TypeScript strict avec types générés depuis Supabase
- **Code Splitting** : Lazy loading des routes et composants lourds
- **Error Boundaries** : Gestion d'erreurs React avec Sentry

---

## 📊 Données Collectées et Stockées

### Données Utilisateur

#### Table `profiles`
- **Identifiant** : UUID (lié à `auth.users`)
- **Informations personnelles** :
  - Nom d'affichage (`display_name`)
  - Organisation (`organization`)
  - Pays (`country`)
  - Biographie (`bio`)
  - Avatar (`avatar_url`)
- **Métadonnées** :
  - Rôle (`organizer`, `producer`, `judge`, `viewer`)
  - Statut de vérification (`is_verified`)
  - Dates de création et modification

#### Table `notification_preferences`
- Préférences de notifications par utilisateur :
  - Notifications email activées/désactivées
  - Notifications in-app activées/désactivées
  - Préférences par type de notification

### Données de Concours

#### Table `contests`
- **Informations générales** :
  - Nom, description, slug unique
  - Statut (draft, registration, judging, completed, archived)
  - Localisation
- **Dates** :
  - Date de début (`start_date`)
  - Date de fin (`end_date`)
  - Date limite d'inscription (`registration_close_date`)
- **Métadonnées** :
  - Prix total (`prize_pool`)
  - URL du règlement (`rules_url`)
  - Image mise en avant (`featured_image_url`)
  - Créateur (`created_by`)

#### Table `contest_judges`
- Assignation des juges aux concours :
  - Concours assigné (`contest_id`)
  - Juge assigné (`judge_id`)
  - Statut d'invitation (`pending`, `accepted`, `declined`)
  - Rôle du juge (`judge_role`)

### Données de Produits (Entrées)

#### Table `entries`
- **Informations produit** :
  - Nom de la variété (`strain_name`)
  - Cultivar (`cultivar`)
  - Catégorie (`indica`, `sativa`, `hybrid`, `outdoor`, `hash`, `other`)
- **Profil cannabinoïde** :
  - Pourcentage THC (`thc_percent`)
  - Pourcentage CBD (`cbd_percent`)
  - Profil terpénique (`terpene_profile`)
- **Métadonnées** :
  - Code de lot (`batch_code`)
  - Statut (`draft`, `submitted`, `under_review`, `approved`, `rejected`, `disqualified`, `archived`)
  - Notes de soumission (`submission_notes`)
- **Fichiers** :
  - URL photo (`photo_url`)
  - URL certificat COA (`coa_url`)
  - URL QR code (`qr_code_url`)

#### Table `entry_documents`
- Documents associés aux entrées :
  - Type de document (`coa`, `photo`, `lab_report`, `marketing`, `other`)
  - Chemin de stockage (`storage_path`)
  - Label (`label`)

### Données d'Évaluation

#### Table `judge_scores`
- **Scores détaillés** (0-100 pour chaque critère) :
  - Score apparence (`appearance_score`)
  - Score densité (`density_score`)
  - Score terpènes (`terpene_score`)
  - Score goût (`taste_score`)
  - Score effet (`effect_score`)
- **Score global** : Moyenne calculée automatiquement (`overall_score`)
- **Commentaires** du juge (`comments`)
- **Métadonnées** : Entrée évaluée, juge, dates

#### Table `public_votes`
- Votes du public :
  - Note (1-5 étoiles) (`rating`)
  - Commentaire optionnel (`comment`)
  - Entrée votée (`entry_id`)
  - Utilisateur (`user_id`)
  - **Contrainte** : Un vote unique par utilisateur par entrée

### Données Sociales

#### Table `favorites`
- Favoris utilisateur :
  - Entrée favorisée (`entry_id`)
  - Utilisateur (`user_id`)
  - Date d'ajout

#### Table `entry_comments`
- Commentaires sur les entrées :
  - Contenu (`content`)
  - Entrée commentée (`entry_id`)
  - Auteur (`user_id`)
  - Dates de création et modification

### Données de Notifications

#### Table `notifications`
- Notifications in-app :
  - Type (`contest_created`, `entry_approved`, `judge_assigned`, etc.)
  - Titre et message
  - Lien vers la ressource (`link`)
  - Statut de lecture (`read`)
  - Métadonnées JSON (`metadata` : contest_id, entry_id, etc.)
  - Destinataire (`user_id`)

### Données de Stockage

#### Supabase Storage Buckets
- **`entry-photos`** (public) :
  - Photos des produits soumis
  - Structure : `{entryId}/{filename}`
- **`entry-documents`** (private) :
  - Documents COA et autres fichiers sensibles
  - Structure : `{entryId}/{filename}`
  - Accès restreint par RLS

### Métadonnées Techniques

- **Timestamps** : Toutes les tables incluent `created_at` et `updated_at` (UTC)
- **Indexes** : Optimisation des requêtes de recherche, filtrage et tri
- **RLS Policies** : Sécurité au niveau des lignes pour toutes les tables
- **Triggers** : Mise à jour automatique de `updated_at`

---

## 🔒 Sécurité et Conformité

### Sécurité des Données

- **Row Level Security (RLS)** : Politiques de sécurité au niveau base de données
- **Authentification JWT** : Tokens sécurisés avec expiration
- **Validation côté client et serveur** : Zod + contraintes SQL
- **Protection CSRF** : Intégration Supabase native
- **Stockage sécurisé** : Documents sensibles en bucket privé

### Conformité Réglementaire

- **Vérification COA obligatoire** : Toutes les entrées doivent respecter ≤0,3% THC (UE)
- **Traçabilité** : Code de lot et certificats d'analyse stockés
- **Audit trail** : Historique complet des modifications (timestamps)

---

## 📈 Métriques et Analytics

### Données Collectées pour Analytics

- **Statistiques globales** :
  - Nombre total de concours (actifs, terminés)
  - Nombre total d'entrées
  - Nombre de producteurs actifs
  - Nombre de juges
  - Nombre total de votes publics
- **Métriques de participation** :
  - Producteurs actifs vs total
  - Votants actifs vs total viewers
- **Métriques d'engagement** :
  - Votes moyens par entrée
  - Scores moyens par entrée
  - Taux de complétion des évaluations
- **Métriques par concours** :
  - Nombre d'entrées
  - Nombre de votes
  - Nombre de juges assignés
  - Score moyen
- **Données temporelles** : Timeline sur 30 jours (entrées, votes, scores)

### Export de Données

- **CSV** : Export des statistiques et métriques
- **PDF** : Rapports complets avec graphiques et tableaux

---

## 🚀 Déploiement et Infrastructure

- **Hébergement** : Vercel (Edge Network global)
- **Base de données** : Supabase PostgreSQL (hébergé, sauvegardes automatiques)
- **CDN** : Distribution globale des assets statiques
- **Monitoring** : Sentry (erreurs) + Vercel Analytics (performance)
- **CI/CD** : GitHub Actions (tests et déploiement automatiques)

---

## 📝 Conclusion

CBD Flower Cup est une application web moderne, sécurisée et performante qui offre une solution complète pour l'organisation de concours de fleurs de CBD. L'architecture modulaire, le type safety avec TypeScript, et les optimisations de performance garantissent une expérience utilisateur fluide et une maintenance facilitée. La collecte de données structurée permet une analyse approfondie des performances et de l'engagement des participants.

---

*Document généré le : 2024-11-28*  
*Version de l'application : 0.0.0*

