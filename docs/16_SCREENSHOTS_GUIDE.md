# 📸 Guide pour les Captures d'Écran

Ce document liste les captures d'écran nécessaires pour documenter l'interface utilisateur de CBD Flower Cup.

---

## 📋 Liste des Captures d'Écran Requises

### 1. Dashboard Organisateur avec Analytics

**Chemin** : `/dashboard` (connecté en tant qu'organisateur)

**Éléments à capturer** :
- Vue d'ensemble du dashboard avec toutes les statistiques
- Graphiques temporels (30 derniers jours)
- Tableau des statistiques par concours
- Boutons d'export CSV/PDF

**Nom suggéré** : `01-dashboard-organisateur-analytics.png`

---

### 2. Page d'Évaluation Jury

**Chemin** : `/judge-evaluation/:entryId` (connecté en tant que juge)

**Éléments à capturer** :
- Formulaire d'évaluation avec les 4 critères (Apparence, Arôme, Goût, Effet)
- Champs de notation (0-100)
- Zone de commentaires pour chaque critère
- Score global calculé automatiquement
- Bouton de soumission

**Nom suggéré** : `02-judge-evaluation-form.png`

---

### 3. Page de Soumission d'Entrée (Producteur)

**Chemin** : `/submit-entry/:contestId?` (connecté en tant que producteur)

**Éléments à capturer** :
- Formulaire complet de soumission
- Champs pour nom de variété, cultivar, catégorie
- Profil cannabinoïde (THC, CBD) avec validation visuelle
- Champ profil terpénique
- Upload photo principale
- Upload certificat COA avec guide assisté
- Messages d'aide contextuels pour COA
- Validation THC en temps réel

**Nom suggéré** : `03-producer-submit-entry-form.png`

---

### 4. Page de Résultats avec Badges

**Chemin** : `/contests/:contestId/results` (concours terminé)

**Éléments à capturer** :
- Podium avec les 3 premiers (or, argent, bronze)
- Liste complète des résultats avec classement
- Badges attribués (Gold, Silver, Bronze, People's Choice)
- Scores combinés (jury + public)
- Bouton pour télécharger les certificats PDF
- QR codes pour partager les entrées

**Nom suggéré** : `04-contest-results-with-badges.png`

---

### 5. Page de Vote Public

**Chemin** : `/vote/:entryId` (connecté en tant que viewer)

**Éléments à capturer** :
- Informations complètes de l'entrée
- Photo principale
- Profil cannabinoïde affiché
- Profil terpénique
- Certificat COA (lien de visualisation)
- Formulaire de vote (étoiles 0-5)
- Zone de commentaires
- QR code pour partager l'entrée
- Section des commentaires publics

**Nom suggéré** : `05-public-vote-page.png`

---

### 6. Page de Validation COA (Organisateur)

**Chemin** : `/review-entries` (connecté en tant qu'organisateur)

**Éléments à capturer** :
- Liste des entrées en attente de validation
- Visualiseur COA (PDF/image)
- Checklist de validation
- Boutons "Supprimer COA" et "Envoyer Email"
- Informations de l'entrée (THC, CBD, terpènes)

**Nom suggéré** : `06-coa-validation-review.png`

---

### 7. Page Admin - Vue d'ensemble

**Chemin** : `/admin` (connecté en tant qu'organisateur)

**Éléments à capturer** :
- Vue d'ensemble avec KPIs globaux
- Statistiques par rôle (producers, viewers, judges/organizers)
- Compteurs d'utilisateurs actifs et bannis

**Nom suggéré** : `07-admin-overview.png`

---

### 8. Page Admin - Gestion Utilisateurs

**Chemin** : `/admin` → Onglet "Utilisateurs"

**Éléments à capturer** :
- Liste des utilisateurs avec statistiques
- Filtres par rôle
- Recherche par nom/email
- Actions (Ban, Unban, Delete, Historique des sanctions)

**Nom suggéré** : `08-admin-user-management.png`

---

### 9. Page de Recherche Globale

**Chemin** : `/search`

**Éléments à capturer** :
- Barre de recherche
- Résultats dans les onglets (Tout / Concours / Producteurs / Entrées)
- Exemple de résultats affichés avec métadonnées

**Nom suggéré** : `09-global-search-results.png`

---

### 10. Page de Favoris

**Chemin** : `/favorites` (connecté avec des favoris)

**Éléments à capturer** :
- Liste des entrées favorites
- Boutons de partage social
- Informations affichées (scores, catégories)
- QR codes pour partage

**Nom suggéré** : `10-favorites-page.png`

---

### 11. Page de Partage Social (Modal)

**Capture** : Menu déroulant de partage social ouvert

**Éléments à capturer** :
- Options de partage (Facebook, Twitter, LinkedIn)
- Option API native du navigateur
- Option copie de lien
- Interface du menu déroulant

**Nom suggéré** : `11-social-share-dropdown.png`

---

### 12. Système de Commentaires avec Modération

**Chemin** : `/vote/:entryId` ou `/moderate-comments`

**Éléments à capturer** :
- Commentaires publics affichés
- Bouton "Signaler" sur un commentaire
- Interface de modération (pour organisateur)
- Statuts des commentaires (pending, approved, rejected)

**Nom suggéré** : `12-comments-moderation.png`

---

### 13. Dashboard Producteur

**Chemin** : `/dashboard` (connecté en tant que producteur)

**Éléments à capturer** :
- Liste des entrées soumises avec statuts
- Deadlines tracker visuel
- Alertes de dates limites approchantes
- Statistiques personnelles

**Nom suggéré** : `13-producer-dashboard.png`

---

### 14. Dashboard Juge

**Chemin** : `/dashboard` (connecté en tant que juge)

**Éléments à capturer** :
- Liste des concours assignés
- Entrées en attente d'évaluation
- Statistiques d'évaluations
- Historique des évaluations

**Nom suggéré** : `14-judge-dashboard.png`

---

### 15. Interface de Gestion des Concours

**Chemin** : `/manage-contests`

**Éléments à capturer** :
- Liste des concours créés
- Boutons de gestion (éditer, gérer juges, catégories)
- Transitions de statut avec validation
- Interface complète de création/édition

**Nom suggéré** : `15-manage-contests-interface.png`

---

## 📁 Structure de Dossier Recommandée

Créer un dossier `docs/screenshots/` avec les sous-dossiers suivants :

```
docs/screenshots/
├── dashboard/
│   ├── 01-dashboard-organisateur-analytics.png
│   ├── 13-producer-dashboard.png
│   └── 14-judge-dashboard.png
├── evaluation/
│   └── 02-judge-evaluation-form.png
├── submission/
│   └── 03-producer-submit-entry-form.png
├── results/
│   └── 04-contest-results-with-badges.png
├── voting/
│   └── 05-public-vote-page.png
├── validation/
│   └── 06-coa-validation-review.png
├── admin/
│   ├── 07-admin-overview.png
│   └── 08-admin-user-management.png
├── search/
│   └── 09-global-search-results.png
├── favorites/
│   └── 10-favorites-page.png
├── social/
│   └── 11-social-share-dropdown.png
├── comments/
│   └── 12-comments-moderation.png
└── management/
    └── 15-manage-contests-interface.png
```

---

## 📝 Instructions pour les Captures d'Écran

### Préparation

1. **Résolution recommandée** : 1920x1080 minimum
2. **Format** : PNG ou JPG (PNG préféré pour qualité)
3. **Outils** :
   - Windows : `Win + Shift + S` (Outils de capture)
   - Mac : `Cmd + Shift + 4`
   - Navigateur : Extensions comme "Nimbus Screenshot" ou "Lightshot"

### Conseils

1. **Masquer les données sensibles** :
   - Flouter les emails réels si nécessaire
   - Utiliser des données de test pour les captures
   - Masquer les identifiants personnels

2. **Cohérence visuelle** :
   - Utiliser le même navigateur pour toutes les captures
   - Mode clair ou sombre cohérent (choisir le plus représentatif)
   - Fenêtre de navigateur en plein écran

3. **Contenu** :
   - Avoir des données de test réalistes dans la base
   - Au moins 2-3 concours, 5-10 entrées, quelques votes
   - Statuts variés pour montrer le workflow

4. **Annotations (optionnel)** :
   - Ajouter des flèches pour pointer des éléments importants
   - Numéroter les fonctionnalités clés
   - Ajouter des légendes si nécessaire

---

## 🔗 Intégration dans OVERVIEW.md

Une fois les captures d'écran prises, ajouter une section dans `docs/OVERVIEW.md` :

```markdown
## 📸 Interface Utilisateur

### Dashboard Organisateur
![Dashboard Organisateur](./screenshots/dashboard/01-dashboard-organisateur-analytics.png)

### Évaluation Jury
![Évaluation Jury](./screenshots/evaluation/02-judge-evaluation-form.png)

[... etc ...]
```

---

## ✅ Checklist de Capture

- [ ] Dashboard Organisateur avec Analytics
- [ ] Page d'Évaluation Jury
- [ ] Page de Soumission d'Entrée (Producteur)
- [ ] Page de Résultats avec Badges
- [ ] Page de Vote Public
- [ ] Page de Validation COA (Organisateur)
- [ ] Page Admin - Vue d'ensemble
- [ ] Page Admin - Gestion Utilisateurs
- [ ] Page de Recherche Globale
- [ ] Page de Favoris
- [ ] Système de Partage Social (Modal)
- [ ] Système de Commentaires avec Modération
- [ ] Dashboard Producteur
- [ ] Dashboard Juge
- [ ] Interface de Gestion des Concours

---

**Note** : Cette tâche nécessite que l'application soit déployée et accessible, ou d'utiliser un serveur de développement local avec des données de test.


