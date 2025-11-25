# CBD Flower Cup - Vue d'ensemble de l'Application

## 📋 Résumé Exécutif

**CBD Flower Cup** est une plateforme web complète et moderne dédiée à l'organisation et à la gestion de concours de fleurs de CBD. L'application permet aux organisateurs de créer et gérer des concours, aux producteurs de soumettre leurs produits, aux juges experts d'évaluer les entrées selon des critères professionnels, et au public de voter et interagir avec les candidatures.

**Conformité légale UE** : La plateforme garantit la conformité réglementaire européenne avec vérification obligatoire des certificats d'analyse (COA) et contrôle automatique du taux de THC (≤0,3% conformément à la réglementation UE). Les données sensibles sont stockées en Europe (Supabase EU), garantissant le respect du RGPD.

---

## 💎 Proposition de Valeur

### Pour les Organisateurs

- **Gain de temps massif** : Réduction de 70% des tâches administratives grâce à l'automatisation complète (gestion des inscriptions, assignation des juges, calcul des scores, publication des résultats)
- **Plateforme tout-en-un** : Plus besoin de bricoler avec Google Forms, Excel et emails. Tout est centralisé et automatisé
- **Résultats transparents** : Système de scoring normé et traçable, renforçant la crédibilité du concours
- **Analytics poussés** : Statistiques détaillées, exports CSV/PDF pour rapports et communication
- **Gestion simplifiée** : Interface intuitive pour créer, gérer et suivre tous les aspects du concours

### Pour les Producteurs

- **Mise en avant professionnelle** : Profil dédié avec historique des participations et performances
- **Crédibilité renforcée** : Certification via COA obligatoire et affichage public des résultats légitimes
- **Data sur leurs performances** : Accès à des statistiques détaillées (scores jury vs public, évolution dans le temps)
- **Gain de visibilité** : Participation à des concours reconnus avec communauté engagée
- **Traçabilité totale** : Gestion des codes de lot et certificats d'analyse pour la conformité réglementaire

### Pour les Juges

- **Interface normée et professionnelle** : Formulaire d'évaluation standardisé sur 4 critères (Apparence, Aromatique, Goût, Effet)
- **Scores cohérents** : Système de notation uniforme (0-100) garantissant la comparabilité des évaluations
- **Historique centralisé** : Dashboard dédié avec historique de toutes les évaluations et statistiques personnelles
- **Gain de temps** : Calcul automatique des scores globaux, pas de calculs manuels
- **Traçabilité** : Commentaires et notes détaillées sauvegardés pour chaque évaluation

### Pour le Public (Viewers)

- **Transparence totale** : Accès à toutes les informations produits (profil cannabinoïde, terpènes, COA validés)
- **Gamification** : Système de votes interactif avec commentaires, favoris et classements en temps réel
- **Interaction sociale** : Commentaires, partage social amélioré (Facebook, Twitter, LinkedIn + API native), recherche avancée
- **Découverte** : Accès à une base de données riche de produits CBD avec filtres avancés
- **Crédibilité** : Confiance dans les résultats grâce au système de double évaluation (jury expert + public)

---

## 🏆 Avantages Concurrentiels

### 1. Sécurité et Intégrité Inégalées

- **Authentification forte + Row Level Security (RLS)** : Protection au niveau base de données garantissant qu'aucun utilisateur ne peut accéder ou modifier des données non autorisées. Zéro risque d'abus ou de manipulations
- **Contrôle d'accès granulaire** : 4 rôles distincts avec permissions précises, impossible de contourner les restrictions
- **Anti-fraude vote public** : Système de rate limiting (10 votes/heure, 50 votes/jour par utilisateur), détection de multi-comptes (même IP), vue de monitoring pour organisateurs permettant d'identifier les votes suspects
- **Prévention des conflits d'intérêt** : Blocage automatique des juges producteurs (impossible d'évaluer ses propres entrées ou d'être assigné comme juge dans un concours où l'on participe). Triggers PostgreSQL et interface avec alertes visuelles

### 2. Conformité Réglementaire UE Unique

- **COA obligatoire + traçabilité THC** : Upload obligatoire du Certificat d'Analyse avec saisie du taux THC. Validation automatique selon la limite légale configurée par concours (par défaut ≤0,3% UE, personnalisable pour différents pays/réglementations). Traçabilité complète pour conformité réglementaire. Unique dans l'écosystème des concours CBD européens
- **Limite THC paramétrable par concours** : Configuration flexible de la limite légale THC selon les réglementations locales (ex: 0.3% UE standard, 0.2% Suisse, 0.1% stricte). Interface organisateur pour définir la limite, les pays applicables et un disclaimer légal spécifique
- **Traçabilité complète** : Codes de lot, certificats d'analyse, historique complet pour audit
- **Stockage des données en Europe** : Conformité RGPD garantie avec hébergement européen
- **Pages légales complètes** : CGU, Politique de Confidentialité (RGPD), Avertissements légaux CBD, Politique des Cookies. Footer avec liens légaux sur toutes les pages

### 3. Crédibilité et Professionnalisme

- **Jury professionnel avec scoring normé** : Évaluation standardisée sur 4 critères (Apparence, Aromatique, Goût, Effet) avec notation 0-100, garantissant la comparabilité et la légitimité des résultats
- **Double évaluation** : Scores jury experts + votes public pour un classement transparent et équilibré
- **Historique complet** : Tous les concours et résultats archivés et consultables

### 4. Automatisation Complète vs Solutions Bricolées

- **Zéro gestion manuelle** : Calcul automatique des scores, assignation des juges, notifications, publication des résultats
- **Contrairement aux Google Forms** : Pas de copier-coller d'Excel, pas de gestion d'emails, tout est automatisé et intégré
- **Contrairement aux concours Instagram** : Système structuré, traçable et professionnel vs votes non vérifiés

### 5. Analytics et Insights Avancés

- **Dashboard analytics complet** : Statistiques globales, métriques par concours, graphiques temporels
- **Export CSV/PDF** : Rapports professionnels pour communication et analyse
- **Métriques d'engagement** : Suivi détaillé de la participation et de l'engagement de la communauté

### 6. Expérience Utilisateur Moderne

- **Interface responsive et accessible** : Conforme WCAG AA, optimisée mobile/tablette/desktop
- **Performance optimisée** : Code splitting, lazy loading, cache intelligent pour une expérience fluide
- **Fonctionnalités sociales intégrées** : Favoris, commentaires, recherche avancée, partage social amélioré (boutons spécifiques + API native)

---

## 🔄 Parcours Utilisateur (User Flow)

### Parcours Organisateur

```
1. Inscription/Connexion
   ↓
2. Création d'un concours
   - Définition des dates, catégories, prix
   - Configuration du règlement
   ↓
3. Invitation des juges
   - Assignation via interface dédiée
   - Suivi des acceptations/refus
   ↓
4. Gestion des inscriptions
   - Validation automatique des entrées
   - Vérification des COA
   ↓
5. Suivi du jugement
   - Monitoring des évaluations en temps réel
   - Analytics de participation
   ↓
6. Publication des résultats
   - Calcul automatique des classements (70% jury + 30% public)
   - Affichage des podiums et classements complets
   - Attribution de badges aux entrées gagnantes (Or, Argent, Bronze, Choix du public, Innovation, etc.)
   - *Certificats PDF téléchargeables : fonctionnalité prévue pour les gagnants*
   ↓
7. Analytics post-concours
   - Rapports détaillés
   - Export CSV/PDF
```

### Parcours Producteur

```
1. Inscription/Connexion
   ↓
2. Consultation des concours ouverts
   - Recherche et filtres
   ↓
3. Soumission d'une entrée
   - Formulaire produit (nom, cultivar, catégorie)
   - Profil cannabinoïde (THC, CBD, terpènes)
   - Upload photo principale + COA
   ↓
4. Suivi du statut
   - Workflow : Brouillon → Soumis → En revue → Approuvé/Rejeté
   - Possibilité de disqualification après approbation si non-respect des règles
   - Archivage automatique après la fin du concours
   ↓
5. Monitoring des performances
   - Scores jury en temps réel
   - Votes public
   - Commentaires et feedback
   ↓
6. Consultation des résultats finaux
   - Classement et statistiques détaillées
   - Historique de toutes les participations
```

### Parcours Juge

```
1. Invitation reçue (email + notification)
   ↓
2. Acceptation de l'invitation
   ↓
3. Accès au dashboard juge
   - Liste des concours assignés
   - Entrées en attente d'évaluation
   ↓
4. Évaluation détaillée
   - Notation sur 4 critères (0-100) : Apparence, Aromatique, Goût, Effet
   - Commentaires pour chaque critère
   - Score global calculé automatiquement (moyenne des 4 critères)
   ↓
5. Historique et statistiques
   - Toutes les évaluations passées
   - Métriques personnelles
```

### Parcours Public (Viewer)

```
1. Inscription gratuite
   ↓
2. Découverte des concours
   - Liste des concours actifs
   - Recherche et filtres
   ↓
3. Consultation des entrées
   - Profil produit détaillé
   - Photo principale, COA, profil terpénique
   ↓
4. Vote et interaction
   - Vote par étoiles (1-5)
   - Commentaires
   - Ajout aux favoris
   ↓
5. Suivi des résultats
   - Classements en temps réel
   - Statistiques et analytics publics
```

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
  - **Configuration légale** : Limite THC paramétrable (par défaut 0.3% UE), pays applicables (codes ISO), disclaimer légal spécifique
  - **Configuration des pondérations** : Poids jury/public pour le calcul du score combiné (par défaut 70% jury + 30% public, personnalisable par concours)
- **Assignation des juges** aux concours avec suivi des invitations et prévention automatique des conflits d'intérêt (blocage des producteurs)
- **Publication des résultats** avec classements et badges, calcul automatique selon les pondérations configurées
- **Analytics et reporting** :
  - Statistiques globales (concours, entrées, votes, participants)
  - Métriques par concours (participation, engagement, scores)
  - Graphiques temporels (30 derniers jours)
  - Export CSV et PDF

### 3. Gestion des Entrées (Producteurs)

- **Soumission d'entrées** avec formulaire complet :
  - Informations produit (nom, cultivar, catégorie)
  - Profil cannabinoïde (THC, CBD) avec validation dynamique selon la limite légale du concours sélectionné
  - Profil terpénique
  - Code de lot
  - Upload d'une photo principale et documents COA (Certificat d'Analyse)
- **Validation THC intelligente** : La limite légale s'adapte automatiquement selon le concours choisi. Affichage du disclaimer légal spécifique si configuré par l'organisateur
- **Gestion du cycle de vie** avec 7 statuts possibles et workflow détaillé :

  #### 📊 Statuts des Entrées

  1. **`draft` (Brouillon)** 
     - **Description** : Entrée en cours de création par le producteur
     - **Actions possibles** : Modification complète, suppression, soumission
     - **Visibilité** : Privée (visible uniquement par le producteur)
     - **Qui peut créer** : Producteur uniquement

  2. **`submitted` (Soumis)**
     - **Description** : Entrée soumise formellement pour participation au concours
     - **Actions possibles** : Aucune modification possible (transition vers `under_review` par l'organisateur)
     - **Visibilité** : Visible par le producteur et les organisateurs uniquement
     - **Transition** : Automatique ou manuelle vers `under_review` pour validation COA

  3. **`under_review` (En revue)**
     - **Description** : Entrée en cours de vérification par l'organisateur (validation du COA, conformité légale, vérification des données)
     - **Actions possibles** : L'organisateur peut approuver, rejeter, ou demander des corrections (suppression du COA)
     - **Visibilité** : Visible par le producteur et les organisateurs uniquement
     - **Notifications** : Le producteur est notifié du passage en revue et des actions nécessaires

  4. **`approved` (Approuvé)**
     - **Description** : Entrée validée et officiellement admise dans le concours
     - **Actions possibles** : Visible publiquement, éligible pour évaluation par les juges et votes du public
     - **Visibilité** : Publique (tous les utilisateurs peuvent voir l'entrée)
     - **Cas d'usage** : Entrée prête pour la phase d'évaluation du concours

  5. **`rejected` (Rejeté)**
     - **Description** : Entrée refusée **lors de la soumission initiale** (avant approbation)
     - **Raisons possibles** : 
       - COA invalide ou manquant
       - Non-conformité à la limite THC du concours
       - Données incomplètes ou erronées
       - Non-respect du règlement du concours
     - **Actions possibles** : Le producteur peut corriger et resoumettre (retour à `draft`)
     - **Visibilité** : Visible uniquement par le producteur et les organisateurs
     - **Différence avec `disqualified`** : `rejected` = refus initial, `disqualified` = exclusion après approbation

  6. **`disqualified` (Disqualifié)**
     - **Description** : Entrée disqualifiée **après avoir été approuvée** (pendant ou après le concours)
     - **Raisons possibles** :
       - Découverte de non-conformité après validation
       - Fraude ou manipulation détectée
       - Non-respect des règles pendant le concours
       - Décision de l'organisateur suite à un problème
     - **Actions possibles** : Aucune action possible par le producteur (décision finale)
     - **Visibilité** : Visible publiquement mais marquée comme disqualifiée
     - **Différence avec `rejected`** : `disqualified` = exclusion après approbation, `rejected` = refus initial

  7. **`archived` (Archivé)**
     - **Description** : Entrée archivée automatiquement ou manuellement après la fin du concours
     - **Actions possibles** : Lecture seule (aucune modification possible)
     - **Visibilité** : Visible publiquement mais marquée comme archivée
     - **Transition** : Automatique après clôture du concours ou manuelle par l'organisateur

  #### 🔄 Workflow Complet des Statuts

  ```
  ┌─────────┐
  │  draft  │ ← Producteur crée l'entrée
  └────┬────┘
       │ Producteur soumet
       ↓
  ┌──────────┐
  │ submitted│ ← Entrée soumise pour validation
  └────┬─────┘
       │ Organisateur démarre la validation
       ↓
  ┌──────────────┐
  │ under_review │ ← Vérification COA et conformité
  └────┬─────────┘
       │
       ├───✅ Validation OK ───────────────┐
       │                                   ↓
       │                            ┌───────────┐
       │                            │ approved  │ ← Entrée visible publiquement
       │                            └─────┬─────┘
       │                                  │
       │                                  ├───⚠️ Problème détecté ──→ ┌──────────────┐
       │                                  │                           │ disqualified │
       │                                  │                           └──────────────┘
       │                                  │
       │                                  └───📦 Fin concours ──→ ┌──────────┐
       │                                                          │ archived │
       │                                                          └──────────┘
       │
       └───❌ Rejet ────────────────────→ ┌─────────┐
                                          │ rejected│ ← Producteur peut corriger
                                          └────┬────┘
                                               │ Producteur modifie
                                               ↓
                                          ┌─────────┐
                                          │  draft  │ ← Retour au brouillon
                                          └─────────┘
  ```

  #### 🔐 Permissions et Actions par Statut

  | Statut | Producteur peut modifier | Producteur peut supprimer | Organisateur peut approuver | Organisateur peut rejeter/disqualifier | Visible publiquement |
  |--------|-------------------------|---------------------------|----------------------------|---------------------------------------|---------------------|
  | `draft` | ✅ Oui | ✅ Oui | ❌ Non | ❌ Non | ❌ Non |
  | `submitted` | ❌ Non | ❌ Non | ✅ Oui | ✅ Oui | ❌ Non |
  | `under_review` | ❌ Non | ❌ Non | ✅ Oui | ✅ Oui | ❌ Non |
  | `approved` | ❌ Non | ❌ Non | ❌ Non | ✅ Oui (disqualifier) | ✅ Oui |
  | `rejected` | ❌ Non* | ❌ Non | ❌ Non | ❌ Non | ❌ Non |
  | `disqualified` | ❌ Non | ❌ Non | ❌ Non | ❌ Non | ✅ Oui** |
  | `archived` | ❌ Non | ❌ Non | ❌ Non | ❌ Non | ✅ Oui*** |

  *Le producteur peut retourner à `draft` pour corriger et resoumettre  
  **Visible mais marquée comme disqualifiée  
  ***Visible mais marquée comme archivée
- **Suivi des performances** :
  - Score moyen jury
  - Note moyenne publique
  - Nombre de votes et commentaires

### 4. Évaluation par les Juges

- **Interface d'évaluation détaillée** avec **4 critères standardisés** notés sur 100 :
  - **Apparence** : Évaluation visuelle incluant couleur, structure, **densité** et présence de trichomes
  - **Arôme** : Profil aromatique incluant intensité, complexité et **profil terpénique**
  - **Goût** : Qualité gustative incluant saveur, texture et persistance en bouche
  - **Effet** : Effets ressentis incluant intensité, qualité et durée
- **Note** : Densité et terpènes sont intégrés dans les critères Apparence et Arôme respectivement (pas de critères séparés pour simplifier l'évaluation)
- **Calcul automatique du score global** :
  - **Formule** : `Score Global = (Apparence + Arôme + Goût + Effet) / 4`
  - **Modifiable par le juge** : Le score global calculé automatiquement peut être ajusté par le juge selon son appréciation générale (permet de refléter des aspects non couverts par les critères individuels)
  - **Exemple** : Si un juge attribue Apparence=85, Arôme=90, Goût=88, Effet=87, le score global calculé sera (85+90+88+87)/4 = 87.5, que le juge peut modifier manuellement
- **Prévention des conflits d'intérêt** : Blocage automatique de l'évaluation si le juge est producteur de l'entrée. Message d'erreur explicite avec protection au niveau base de données (trigger PostgreSQL)
- **Commentaires et notes** pour chaque critère
- **Historique des évaluations** dans le dashboard

#### Détail du Calcul des Scores

##### Modèle de Calcul Standardisé

Le système utilise un **modèle de moyenne simple sans pondération par critère** et **sans normalisation par juge** pour garantir la simplicité et la transparence. Chaque étape du calcul est détaillée ci-dessous :

**1. Score Global d'un Juge** :
- **Formule** : `Score Global = (Apparence + Arôme + Goût + Effet) / 4`
- **Moyenne arithmétique simple** : Tous les critères ont le même poids (25% chacun, équitablement répartis)
- **Pondération par critère** : ❌ **Non utilisée** - Chaque critère compte pour 25% afin de maintenir l'équité entre tous les aspects évalués
- **Normalisation par juge** : ❌ **Non appliquée au calcul final** - Les scores sont utilisés directement pour garantir la transparence. La normalisation (z-score) existe uniquement pour l'analyse des biais des juges (voir section "Analyse des biais" dans le dashboard organisateur)
- **Modifiable par le juge** : ✅ Oui - Le juge peut ajuster manuellement le score global calculé automatiquement pour refléter son appréciation globale ou des aspects non couverts par les critères individuels
- **Exemple concret** :
  - Apparence : 85/100
  - Arôme : 90/100
  - Goût : 88/100
  - Effet : 87/100
  - **Score global calculé automatiquement** : (85 + 90 + 88 + 87) / 4 = **87.5/100**
  - Le juge peut modifier cette valeur (ex: 88.0) s'il estime que l'appréciation globale mérite un ajustement

**2. Moyenne Jury d'une Entrée** :
- **Formule** : `Moyenne Jury = (Somme de tous les scores globaux des juges) / Nombre de juges`
- **Moyenne arithmétique simple** : Tous les juges ont le même poids dans le calcul final
- **Gestion des biais** : Les biais des juges sont détectés et analysés (z-score) pour information, mais n'affectent pas le calcul final afin de préserver la transparence et l'équité
- **Exemple** : Si 3 juges ont évalué une entrée avec les scores globaux 87.5, 92.0 et 85.5, la moyenne jury sera :
  - Moyenne Jury = (87.5 + 92.0 + 85.5) / 3 = **88.3/100**

**3. Moyenne Public d'une Entrée** :
- **Formule** : `Moyenne Public = (Somme de tous les votes) / Nombre de votes`
- **Échelle** : Les votes publics sont sur une échelle de 1 à 5 étoiles (1 = très faible, 5 = excellent)
- **Calcul** : Moyenne arithmétique simple de tous les votes reçus
- **Exemple** : Si 10 utilisateurs ont voté avec les notes suivantes : [5, 5, 4, 5, 3, 4, 5, 4, 5, 4]
  - Moyenne Public = (5 + 5 + 4 + 5 + 3 + 4 + 5 + 4 + 5 + 4) / 10 = **4.4/5**

**4. Score Combiné Final** (pour le classement) :
- **Formule complète** : `Score Combiné = (Moyenne Jury × Poids Jury) + (Moyenne Public normalisée × Poids Public)`
- **Normalisation publique** : La moyenne publique (échelle 0-5) est convertie sur une échelle 0-100 pour permettre la combinaison :
  - `Moyenne Public normalisée = (Moyenne Public / 5) × 100`
- **Pondérations Jury/Public** : ✅ **Configurables par concours** (par défaut : 70% jury, 30% public)
  - Permet d'adapter le poids relatif entre évaluation experte et opinion publique selon le type de concours
  - Les pondérations doivent toujours totaliser 100% (contrainte en base de données)
- **Exemple complet avec pondération par défaut 70/30** :
  - Moyenne Jury : **88.3/100**
  - Moyenne Public : **4.4/5**
  - Moyenne Public normalisée : (4.4 / 5) × 100 = **88.0/100**
  - Poids Jury : **70%** (0.7)
  - Poids Public : **30%** (0.3)
  - **Score Combiné** = (88.3 × 0.7) + (88.0 × 0.3) = 61.81 + 26.4 = **88.2/100**
- **Classement** : Les entrées sont classées par Score Combiné décroissant. En cas d'égalité, la Moyenne Jury est utilisée comme critère de départage

### 5. Système de Vote Public

- **Vote par étoiles** (1 à 5 étoiles) pour chaque entrée
- **Commentaires publics** associés aux votes
- **Un vote par utilisateur par entrée** (système d'upsert)
- **Système anti-fraude intégré** :
  - Rate limiting : maximum 10 votes par heure, 50 votes par jour par utilisateur
  - Détection de multi-comptes : alerte si plus de 3 utilisateurs différents votent depuis la même IP en 1 heure
  - Logging complet : IP, user agent, timestamp pour traçabilité
  - Vue de monitoring pour organisateurs : `suspicious_votes` pour identifier les votes suspects
- **Affichage en temps réel** des moyennes et statistiques

### 6. Fonctionnalités Sociales

- **Favoris** : Ajout/suppression d'entrées en favoris
- **Commentaires** : Système de commentaires sur les entrées avec édition/suppression
- **Partage social amélioré** : Boutons de partage spécifiques pour Facebook, Twitter, LinkedIn, avec option d'utiliser l'API native du navigateur (mobile) et copie de lien. Partage direct vers les pages d'entrées individuelles. 
  - Utilise l'API Web Share native du navigateur pour un partage optimal sur mobile
  - Fallback automatique : copie du lien dans le presse-papiers si l'API n'est pas disponible
  - Disponible sur les cartes d'entrées dans les pages Concours et Favoris
- **Recherche globale** : Page dédiée (`/search`) permettant de rechercher dans les concours (nom, description, localisation), producteurs (nom, organisation) et entrées (nom variété, catégorie, profil terpénique). Voir section "Recherche et Filtres" (9.1) pour les détails complets

### 7. Notifications et Préférences

- **Système de notifications in-app** (automatique via triggers SQL) :
  - **`contest_created`** : Nouveau concours créé (notifie producteurs, juges, viewers)
  - **`entry_approved`** : Entrée approuvée (notifie le producteur)
  - **`entry_rejected`** : Entrée rejetée (notifie le producteur)
  - **`judge_assigned`** : Juge assigné à un concours (notifie le juge)
  - **`judge_invitation`** : Invitation de juge reçue
  - **`vote_received`** : Nouveau vote reçu sur une entrée
  - **`score_received`** : Nouveau score de jury reçu
  - **`results_published`** : Résultats publiés

- **Notifications email** (via Edge Function `send-email` avec Resend) :
  - ✅ Infrastructure prête (Edge Function configurée avec Resend)
  - ✅ Vérification des préférences utilisateur (activé/désactivé par type)
  - ✅ Support des types : `contest_created`, `entry_approved`, `judge_assigned`, `results_published`, `vote_received`, `score_received`
  - ⚠️ **Note** : L'envoi d'emails doit être déclenché manuellement depuis l'application ou via triggers supplémentaires (actuellement seules les notifications in-app sont automatiques)

- **Préférences utilisateur** :
  - Configuration globale email/in-app (activé/désactivé)
  - Préférences granulaires par type de notification
  - Page Settings dédiée pour gérer toutes les préférences
  
- **Compteur de notifications non lues** : Affiché dans le header avec badge visuel

### 8. Dashboard Multi-Rôles

- **Dashboard personnalisé** selon le rôle :
  - **Viewer** : Historique des votes, concours à venir, favoris
  - **Producteur** : Statistiques d'entrées, prochaines échéances, liste des candidatures
  - **Juge** : Concours assignés, statistiques d'évaluations, prochaines sessions
  - **Organisateur** : Analytics complets, gestion des concours, statistiques globales

### 9. Recherche et Filtres

#### 9.1. Recherche Globale (`/search`)

Page dédiée de recherche unifiée couvrant l'ensemble de la plateforme :

**Champs recherchables** :
- **Concours** :
  - `name` (nom du concours)
  - `description` (description du concours)
  - `location` (localisation/lieu du concours)
- **Producteurs** :
  - `display_name` (nom d'affichage du producteur)
  - `organization` (nom de l'organisation/entreprise)
  - Filtré par rôle `producer` uniquement
- **Entrées** :
  - `strain_name` (nom de la variété)
  - `category` (catégorie : indica, sativa, hybrid, outdoor, hash, other)
  - `terpene_profile` (profil terpénique)
  - Filtré par statut `approved` uniquement (entrées validées)

**Fonctionnalités** :
- **Minimum 2 caractères** : Recherche déclenchée après saisie de 2 caractères minimum
- **Recherche insensible à la casse** : Utilise `ilike` (case-insensitive LIKE)
- **Interface à onglets** : Filtrage par type de contenu (Tout / Concours / Producteurs / Entrées)
- **Pagination séparée** : 6 éléments par page pour chaque type de contenu avec contrôles de navigation indépendants
- **Tri automatique** :
  - Concours : Par `start_date` décroissant (plus récents en premier)
  - Producteurs : Par `display_name` alphabétique
  - Entrées : Par `created_at` décroissant (plus récentes en premier)
- **Limite de résultats** : Maximum 20 résultats par type de contenu (avant pagination)
- **Cache** : 30 secondes de cache pour optimiser les recherches répétées
- **Affichage contextuel** : Résultats affichés avec métadonnées pertinentes (dates, statuts, catégories, badges)

**Exemples de requêtes** :
- "OG Kush" → Recherche dans les entrées (strain_name, terpene_profile)
- "Paris" → Recherche dans les concours (location)
- "Green Leaf" → Recherche dans les producteurs (display_name, organization) et concours (name)
- "indica" → Recherche dans les entrées (category)

#### 9.2. Recherche Locale dans les Concours (`/contests`)

Barre de recherche intégrée dans la page des concours pour filtrer les entrées affichées :

**Champs recherchables** :
- `strain_name` (nom de la variété)
- `producerName` / `producerOrganization` (nom du producteur ou organisation)
- `terpene_profile` (profil terpénique)

**Fonctionnalités** :
- **Filtrage en temps réel** : Résultats filtrés au fur et à mesure de la saisie
- **Combinable avec filtres** : Recherche + filtre par catégorie + tri
- **Tri dynamique** : Possibilité de trier par score, date, nom (selon le filtre sélectionné)

#### 9.3. Filtres Avancés

**Filtres par catégorie d'entrée** :
- `indica`
- `sativa`
- `hybrid`
- `outdoor`
- `hash`
- `other`
- Gestion des catégories custom par concours (si définies par l'organisateur)

**Filtres par statut** :
- **Concours** : `registration`, `judging`, `completed`, `archived`
- **Entrées** (dans les dashboards organisateurs/producteurs) : `draft`, `submitted`, `under_review`, `approved`, `rejected`, `disqualified`, `archived`

**Filtres contextuels** :
- Filtrage par concours actif (sélection d'un concours spécifique)
- Filtrage par date (dans certains dashboards)

#### 9.4. Performance et Optimisation

- **Indexes de recherche** : Indexes PostgreSQL sur les colonnes fréquemment recherchées
- **Cache React Query** : Cache de 30 secondes pour éviter les requêtes répétées
- **Débouncing** : Recherche déclenchée après saisie (pas de requête à chaque caractère)
- **Limites de résultats** : Maximum 20 résultats par type dans la recherche globale, pagination pour le reste
- **Lazy loading** : Chargement progressif des résultats avec pagination

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

## 🏗️ Architecture de l'Application

### Diagramme d'Architecture (Simplifié)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages UI   │→│   Components  │→│  React Query  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │          Supabase Auth (JWT Sessions)            │      │
│  └──────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │      PostgreSQL Database (RLS Policies)          │      │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │      │
│  │  │Profiles│ │Contests│ │Entries │ │Scores  │   │      │
│  │  └────────┘ └────────┘ └────────┘ └────────┘   │      │
│  └──────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │        Supabase Storage (Buckets)                │      │
│  │  ┌──────────────┐  ┌──────────────┐             │      │
│  │  │entry-photos  │  │entry-docs    │             │      │
│  │  │  (public)    │  │  (private)   │             │      │
│  │  └──────────────┘  └──────────────┘             │      │
│  └──────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │      Edge Functions (Deno Runtime)               │      │
│  │           send-email function                    │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Resend    │  │    Sentry    │  │   Vercel     │      │
│  │  (Emails)    │  │ (Monitoring) │  │  Analytics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Flux de Données Principal

1. **Authentification** : Frontend → Supabase Auth → JWT Token
2. **Requêtes Data** : Frontend → Supabase API (PostgreSQL avec RLS) → Réponse JSON
3. **Upload Fichiers** : Frontend → Supabase Storage → URL publique/privée
4. **Notifications** : Backend Trigger → Edge Function → Resend API → Email
5. **Monitoring** : Frontend/Backend → Sentry/Vercel Analytics

---

## 💻 Stack Technique & Qualité

### Frontend

- **Framework** : React 18 avec TypeScript
- **Build Tool** : Vite (compilation rapide, HMR)
- **Styling** :
  - Tailwind CSS (utility-first CSS)
  - shadcn/ui (composants React accessibles basés sur Radix UI)
- **Routing** : React Router DOM
- **State Management** :
  - React Query (TanStack Query) pour cache et synchronisation serveur
  - React Hook Form pour gestion de formulaires
- **Validation** : Zod (validation de schémas TypeScript)
- **Graphiques** : Recharts (visualisation de données)
- **Export** : jsPDF + jspdf-autotable (génération PDF)
- **Notifications** : Sonner (toasts modernes)
- **Icons** : Lucide React

### Backend & Infrastructure

- **Backend-as-a-Service** : Supabase
  - **Base de données** : PostgreSQL avec Row Level Security (RLS)
  - **Authentification** : Supabase Auth (JWT, sessions)
  - **Storage** : Supabase Storage (photos, documents COA)
  - **Edge Functions** : Deno runtime (send-email)
  - **Hébergement EU** : Données stockées en Europe pour conformité RGPD
- **Monitoring** :
  - Sentry (erreurs et performance)
  - Vercel Analytics (métriques web)

### DevOps & Qualité

- **CI/CD** : GitHub Actions
  - Tests automatiques (lint, type-check, unit, E2E)
  - Déploiement automatique sur Vercel (production et staging)
- **Tests** :
  - Vitest (tests unitaires)
  - Playwright (tests E2E)
  - React Testing Library
- **Linting** : ESLint avec TypeScript ESLint
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

*Note : Les versions détaillées des dépendances sont disponibles dans le fichier `package.json` ou peuvent être consultées dans un document séparé "Stack détaillée".*

---

## 🚀 Roadmap & Vision

### Vision à Court Terme (3-6 mois)

- **Amélioration de l'expérience utilisateur** :
  - Interface mobile optimisée (PWA)
  - Onboarding interactif pour nouveaux utilisateurs
  - Guides vidéo et tutoriels intégrés
  
- **Fonctionnalités sociales avancées** :
  - Système de badges et récompenses pour les producteurs (✅ **Implémenté**)
  - Classements et leaderboards communautaires
  - Partage de résultats optimisé via boutons sociaux (Facebook, Twitter, LinkedIn) et API Web Share native
  
- **Traçabilité et accessibilité** :
  - Génération de QR codes pour chaque entrée (accès rapide aux informations produit)
  - Certificats PDF téléchargeables pour les gagnants de concours

### Vision à Moyen Terme (6-12 mois)

- **Système d'abonnements / plans premium (B2B)** :
  - Plans premium pour organisateurs avec fonctionnalités avancées
  - Plans producteurs avec analytics approfondis et mise en avant
  - Marketplace de services premium (mise en avant, analytics avancés)
  
- **Logistique et échantillons** :
  - Intégration avec partenaires logistiques pour envoi de kits de samples
  - Gestion automatisée de l'envoi des produits aux juges
  - Tracking des envois intégré dans la plateforme
  
- **API publique** :
  - API REST documentée pour intégrer les concours dans d'autres sites
  - Widgets embeddable pour afficher les résultats sur sites tiers
  - Webhooks pour notifications externes

### Vision à Long Terme (12+ mois)

- **Intelligence Artificielle** :
  - IA pour analyser les COA et détecter automatiquement les anomalies
  - Système de recommandation de produits basé sur les préférences utilisateur
  - Analyse prédictive des tendances du marché CBD
  
- **Automatisation poussée** :
  - Outil de génération automatique de fiche entrée à partir d'images
  - Reconnaissance optique de caractères (OCR) pour extraction de données COA
  - Suggestions automatiques de catégories et cultivars
  
- **Blockchain et traçabilité** :
  - NFT / certificats blockchain pour résultats de concours vérifiables
  - Traçabilité blockchain des produits de la production aux résultats
  - Certificats numériques blockchain infalsifiables pour les lauréats
  - *Note : Différents des certificats PDF classiques mentionnés en court terme*

---

## 💰 Modèle de Monétisation

### Modèles Principaux

#### 1. Frais pour Organisateurs (B2B - Principal)

- **Licence par concours** : Frais fixe ou variable selon le nombre de participants
- **Plans d'abonnement mensuel/annuel** :
  - Plan Starter : Concours jusqu'à 50 participants
  - Plan Professional : Concours illimités, analytics avancés, support prioritaire
  - Plan Enterprise : Fonctionnalités personnalisées, intégrations, dédié CSM
  
- **Services additionnels** :
  - Gestion de la logistique (envoi samples)
  - Promotion et marketing du concours
  - Support technique dédié

#### 2. Abonnement Producteur Premium

- **Plan Premium Producteur** :
  - Analytics approfondis (tendances, comparaisons)
  - Mise en avant dans les résultats de recherche
  - Accès anticipé aux concours
  - Badge "Premium" sur le profil
  
- **Services à la carte** :
  - Audit de profil et recommandations
  - Aide à l'optimisation des soumissions

#### 3. Marketplace de Services

- **Mise en relation producteurs/jurys** :
  - Commission sur les mises en relation
  - Répertoire de juges certifiés
  - Système de notation des juges
  
- **Services tiers** :
  - Intégration de laboratoires d'analyse (partenariats)
  - Services marketing pour producteurs
  - Formation et certification

#### 4. Modèles Complémentaires (Optionnels)

- **NFT / Certificats Blockchain** :
  - Vente de certificats numériques vérifiables pour les lauréats
  - Collection NFT des gagnants de concours historiques
  
- **API et Intégrations** :
  - Accès API premium pour développeurs tiers
  - Intégrations payantes avec systèmes tiers (CRMs, outils marketing)

### Projection de Revenus (Exemple)

- **Organisateurs** : 10-50 concours/mois × 200-500€/concours = 2K-25K€/mois
- **Producteurs Premium** : 100-500 abonnés × 29-49€/mois = 3K-25K€/mois
- **Marketplace** : Commission 10-15% sur services = 1K-5K€/mois

*Note : Les prix et projections sont indicatifs et devront être validés par une étude de marché détaillée.*

---

## 📈 KPIs Cibles et Métriques de Succès

### Indicateurs Clés Visés

#### Croissance et Adoption

- **Nombre de concours annuels** : 
  - Objectif année 1 : 100-200 concours
  - Objectif année 2 : 500+ concours
  
- **Nombre de producteurs inscrits** :
  - Objectif année 1 : 500-1000 producteurs actifs
  - Objectif année 2 : 3000+ producteurs
  
- **Taux d'engagement public** :
  - Taux de conversion viewer → voter : 40-60%
  - Nombre moyen de votes par concours : 500-2000 votes
  - Taux de rétention utilisateurs (30 jours) : 50-70%

#### Efficacité Opérationnelle

- **Temps moyen de gestion d'un concours** :
  - Réduction de 70% vs méthodes manuelles
  - Temps cible : 2-4 heures de gestion totale (vs 15-20h manuel)
  
- **Taux d'automatisation** :
  - 90%+ des tâches administratives automatisées
  - 100% des calculs de scores automatisés

#### Qualité et Satisfaction

- **Satisfaction organisateurs** :
  - NPS (Net Promoter Score) : 50+
  - Taux de réinscription : 80%+
  
- **Satisfaction producteurs** :
  - NPS : 40+
  - Taux de participation multiple : 60%+
  
- **Satisfaction juges** :
  - Temps moyen d'évaluation réduit de 50%
  - Taux d'acceptation des invitations : 70%+

#### Performance Technique

- **Disponibilité** : 99.9% uptime
- **Performance** : Temps de chargement < 2s (LCP)
- **Sécurité** : 0 incident de sécurité majeur

#### Business

- **Taux de conversion freemium → premium** : 10-15%
- **Churn rate mensuel** : < 5%
- **LTV/CAC ratio** : > 3:1

*Note : Ces KPIs seront ajustés et affinés selon les données réelles collectées et les objectifs business spécifiques.*

---

## 💾 Sauvegarde et Continuité de Service

### Objectifs de Continuité

- **RTO (Recovery Time Objective)** : 4 heures  
  Objectif de restauration complète de la plateforme dans les 4 heures suivant un incident majeur.

- **RPO (Recovery Point Objective)** : 24 heures  
  Limitation de la perte de données à un maximum de 24 heures (sauvegarde quotidienne).

### Stratégie de Sauvegarde

#### Sauvegardes Automatiques Supabase

La plateforme utilise les sauvegardes automatiques de Supabase :

- **Fréquence** : Quotidienne (automatique)
- **Rétention** : 30 jours minimum (recommandé : 90 jours pour les concours critiques)
- **Point-in-time Recovery (PITR)** : Disponible sur les plans Pro et supérieurs
- **Région** : Europe (conformité RGPD)

**Configuration requise** :
- Plan Supabase Team ou Enterprise pour une rétention optimale
- Activation du Point-in-Time Recovery pour une restauration granulaire

#### Sauvegardes Additionnelles

- **Migrations SQL** : Toutes les migrations sont versionnées dans Git (`supabase/migrations/`)
- **Storage (Photos & COA)** : Sauvegardes séparées des fichiers (buckets `entry-photos` et `entry-documents`)
- **Sauvegardes locales** : Recommandées pour les environnements critiques (voir `docs/BACKUP_RESTORE.md`)

### Procédures de Restauration

1. **Restauration depuis Dashboard Supabase** :
   - Accès via Dashboard → Settings → Database → Backups
   - Restauration point-in-time disponible
   - Restauration complète ou sur nouvelle instance

2. **Restauration via CLI** :
   - Utilisation de `supabase db reset` et `pg_restore`
   - Documentation complète dans `docs/BACKUP_RESTORE.md`

### Tests de Restauration

- **Fréquence** : Mensuelle (recommandé)
- **Procédure** : Tests sur environnement de développement ou instance de test
- **Validation** : Vérification de l'intégrité des données, relations, triggers et politiques RLS

### Monitoring

- Vérification quotidienne de l'état des sauvegardes automatiques
- Alertes configurées pour les échecs de sauvegarde
- Documentation des incidents et procédures correctives

**Documentation détaillée** : Voir `docs/BACKUP_RESTORE.md` pour les procédures complètes de sauvegarde et restauration.

---

## 📸 Interface Utilisateur

Un guide complet pour les captures d'écran est disponible dans [`docs/SCREENSHOTS_GUIDE.md`](./SCREENSHOTS_GUIDE.md). Ce guide liste 15 captures d'écran recommandées pour documenter l'interface utilisateur :

### Captures d'écran recommandées

1. **Dashboard Organisateur** avec analytics et graphiques
2. **Page d'Évaluation Jury** avec formulaire d'évaluation standardisé
3. **Page de Soumission d'Entrée** (Producteur) avec validation COA assistée
4. **Page de Résultats** avec badges et classements
5. **Page de Vote Public** avec système de notation et commentaires
6. **Page de Validation COA** (Organisateur) avec visualiseur et checklist
7. **Page Admin - Vue d'ensemble** avec KPIs globaux
8. **Page Admin - Gestion Utilisateurs** avec système de modération
9. **Page de Recherche Globale** avec résultats par type
10. **Page de Favoris** avec partage social
11. **Système de Partage Social** (menu déroulant)
12. **Système de Commentaires** avec modération
13. **Dashboard Producteur** avec deadline tracker
14. **Dashboard Juge** avec liste des évaluations
15. **Interface de Gestion des Concours** avec transitions de statut

*Note : Les captures d'écran peuvent être ajoutées dans un dossier `docs/screenshots/` et référencées dans cette section pour illustrer l'expérience utilisateur. Consultez [`docs/SCREENSHOTS_GUIDE.md`](./SCREENSHOTS_GUIDE.md) pour les instructions complètes de capture et d'intégration.*

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
  - URL QR code (`qr_code_url`) : *Fonctionnalité prévue - QR codes pour accès rapide aux informations de l'entrée*

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
  - Photo principale des produits soumis (1 photo par entrée)
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

- **Row Level Security (RLS)** : Politiques de sécurité au niveau base de données garantissant l'isolation complète des données par utilisateur
- **Authentification JWT** : Tokens sécurisés avec expiration automatique
- **Validation côté client et serveur** : Zod + contraintes SQL pour double validation
- **Protection CSRF** : Intégration Supabase native
- **Stockage sécurisé** : Documents sensibles (COA) en bucket privé avec accès restreint par RLS
- **Anti-fraude vote public** : Système de rate limiting (10 votes/heure, 50 votes/jour), détection de multi-comptes (même IP), vue de monitoring pour organisateurs
- **Prévention conflits d'intérêt juges** : Blocage automatique des juges producteurs (impossible d'évaluer ses propres entrées ou d'être assigné comme juge dans un concours où l'on participe). Triggers PostgreSQL et interface avec alertes visuelles
- **Accessibilité WCAG 2.1 AA** : Conformité complète avec tests automatisés (axe-core), navigation clavier, support lecteurs d'écran, contraste suffisant, labels ARIA sur tous les composants (voir `docs/ACCESSIBILITY.md`)

### Conformité Réglementaire CBD - Compatible Europe

- **Vérification COA obligatoire** : 
  - Toutes les entrées doivent fournir un Certificat d'Analyse (COA) en upload
  - Validation manuelle par les organisateurs lors de l'approbation des entrées
  
- **Limite THC paramétrable par concours** :
  - **Configuration flexible** : Limite légale configurable par concours (par défaut 0.3% UE standard)
  - **Support multi-pays** : Codes pays ISO et disclaimers légaux spécifiques par concours
  - **Validation automatique** : Contraintes SQL CHECK + validation côté client selon la limite du concours
  - **Interface organisateur** : Configuration de la limite THC, pays applicables et disclaimer légal lors de la création/édition de concours
  - **Validation dynamique** : Le formulaire de soumission adapte automatiquement la limite affichée selon le concours sélectionné
  
- **Pages légales complètes (RGPD)** :
  - Conditions Générales d'Utilisation (CGU) - `/legal/terms`
  - Politique de Confidentialité (RGPD) - `/legal/privacy`
  - Avertissements légaux CBD - `/legal/disclaimer`
  - Politique des Cookies - `/legal/cookies`
  - Footer avec liens légaux sur toutes les pages
  - Disclaimer visible dans la page "À propos"
  
- **Conformité légale UE complète** :
  - Respect de la réglementation européenne sur les produits CBD
  - Vérification systématique de la traçabilité des produits
  - Sécurisation des données sensibles conformément au RGPD
  
- **Stockage en Europe** :
  - Hébergement Supabase Europe (régions UE)
  - Données stockées conformément aux exigences RGPD
  - Aucun transfert de données hors UE
  
- **Traçabilité complète** :
  - Code de lot obligatoire pour chaque entrée
  - Certificats d'analyse archivés et consultables
  - Historique complet des modifications (audit trail avec timestamps)
  - Liens entre produits, lots et COA pour traçabilité end-to-end

---

## 📈 Métriques et Analytics

### Données Collectées pour Analytics

- **Statistiques globales** :
  - Nombre total de concours
  - Nombre de concours actifs (`registration` ou `judging`)
  - Nombre total d'entrées
  - Nombre total de producteurs (rôle `producer`)
  - Nombre total de juges (rôle `judge`)
  - Nombre total de votes publics

- **Métriques de participation** :
  - Producteurs actifs : Nombre de producteurs ayant soumis au moins une entrée (statut ≠ `draft`)
  - Producteurs total : Nombre total de producteurs inscrits
  - Votants actifs : Nombre de viewers ayant voté au moins une fois
  - Viewers total : Nombre total d'utilisateurs avec rôle `viewer`

- **Métriques d'engagement** :
  - Votes moyens par entrée : Nombre moyen de votes pour les entrées approuvées
  - Scores moyens par entrée : Nombre moyen d'évaluations de jury pour les entrées approuvées
  - Taux de complétion : Pourcentage d'entrées approuvées ayant reçu au moins une évaluation de jury

- **Métriques par concours** :
  - Nombre d'entrées par concours
  - Nombre de votes reçus par les entrées du concours
  - Nombre de juges assignés au concours
  - Score moyen (moyenne des `overall_score` des juges)

- **Données temporelles** : 
  - Timeline sur 30 derniers jours
  - Nombre d'entrées créées par jour
  - Nombre de votes déposés par jour
  - Nombre de scores de jury enregistrés par jour
  - Affichage via graphiques (Recharts) : ligne temporelle et barres par concours

- **Visualisations** :
  - Graphique d'évolution temporelle (30 jours) : Entrées, Votes, Scores
  - Graphique par concours : Nombre d'entrées, votes, score moyen
  - Statistiques détaillées par concours dans tableaux

### Export de Données

- **Export CSV** : 
  - Statistiques globales (totaux)
  - Métriques de participation
  - Métriques d'engagement
  - Statistiques détaillées par concours (nom, statut, entrées, votes, juges, score moyen)
  - Format téléchargeable avec horodatage dans le nom de fichier

- **Export PDF** :
  - Rapports complets avec graphiques intégrés (Recharts)
  - Tableaux détaillés par concours
  - Métadonnées (date de génération)
  - Génération via jsPDF + jspdf-autotable

---

## ♿ Accessibilité (WCAG 2.1 Level AA)

### Conformité

La plateforme CBD Flower Cup est conçue pour être accessible à tous les utilisateurs, conformément aux **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA**.

### Fonctionnalités d'Accessibilité Implémentées

#### Navigation et Structure
- ✅ **Skip Links** : Lien permettant de sauter directement au contenu principal
- ✅ **Navigation clavier complète** : Toutes les fonctionnalités accessibles au clavier (Tab, Enter, Escape, flèches)
- ✅ **Focus visible** : Indicateur de focus clair sur tous les éléments interactifs
- ✅ **Structure sémantique HTML5** : Utilisation appropriée des balises (`<header>`, `<nav>`, `<main>`, `<footer>`, etc.)

#### Contraste et Couleurs
- ✅ **Contraste WCAG AA** : Ratio minimum 4.5:1 pour texte normal, 3:1 pour texte large
- ✅ **Indépendance des couleurs** : Information non basée uniquement sur la couleur (icônes + texte)

#### Support Lecteurs d'Écran
- ✅ **Labels ARIA** : Tous les boutons et éléments interactifs ont des labels accessibles
- ✅ **Roles ARIA** : Utilisation appropriée des rôles (`button`, `navigation`, `dialog`, etc.)
- ✅ **Live regions** : Annonces pour les notifications et mises à jour dynamiques
- ✅ **Textes alternatifs** : Attribut `alt` pour toutes les images significatives

#### Formulaires
- ✅ **Labels associés** : Tous les champs ont des labels via `<label>` ou `aria-label`
- ✅ **Messages d'erreur accessibles** : Utilisation de `role="alert"` et `aria-describedby`
- ✅ **Descriptions contextuelles** : Helper texts pour guider la saisie

### Tests d'Accessibilité

#### Tests Automatisés
- ✅ **axe-core** : Tests automatisés intégrés dans Playwright (`e2e/accessibility.spec.ts`)
- ✅ **CI/CD** : Tests d'accessibilité exécutés automatiquement dans la pipeline
- ✅ **Scripts npm** : `npm run test:accessibility` pour exécuter les tests manuellement

#### Tests Manuels
- ✅ **Procédures documentées** : Tests avec lecteurs d'écran (NVDA, JAWS, VoiceOver)
- ✅ **Navigation clavier** : Tests de navigation complète au clavier uniquement
- ✅ **Zoom 200%** : Vérification que l'interface reste fonctionnelle

**Documentation détaillée** : Voir `docs/ACCESSIBILITY.md` pour le plan de test complet, la checklist WCAG, et les bonnes pratiques pour développeurs.

---

## 🚀 Déploiement et Infrastructure

- **Hébergement** : Vercel (Edge Network global)
- **Base de données** : Supabase PostgreSQL (hébergé, sauvegardes automatiques)
- **CDN** : Distribution globale des assets statiques
- **Monitoring** : Sentry (erreurs) + Vercel Analytics (performance)
- **CI/CD** : GitHub Actions (tests et déploiement automatiques)

---

## 💾 Sauvegarde et Continuité de Service

### Objectifs de Continuité

- **RTO (Recovery Time Objective)** : 4 heures  
  Objectif de restauration complète de la plateforme dans les 4 heures suivant un incident majeur.

- **RPO (Recovery Point Objective)** : 24 heures  
  Limitation de la perte de données à un maximum de 24 heures (sauvegarde quotidienne).

### Stratégie de Sauvegarde

#### Sauvegardes Automatiques Supabase

La plateforme utilise les sauvegardes automatiques de Supabase :

- **Fréquence** : Quotidienne (automatique)
- **Rétention** : 30 jours minimum (recommandé : 90 jours pour les concours critiques)
- **Point-in-time Recovery (PITR)** : Disponible sur les plans Pro et supérieurs
- **Région** : Europe (conformité RGPD)

**Configuration requise** :
- Plan Supabase Team ou Enterprise pour une rétention optimale
- Activation du Point-in-Time Recovery pour une restauration granulaire

#### Sauvegardes Additionnelles

- **Migrations SQL** : Toutes les migrations sont versionnées dans Git (`supabase/migrations/`)
- **Storage (Photos & COA)** : Sauvegardes séparées des fichiers (buckets `entry-photos` et `entry-documents`)
- **Sauvegardes locales** : Recommandées pour les environnements critiques (voir `docs/BACKUP_RESTORE.md`)

### Procédures de Restauration

1. **Restauration depuis Dashboard Supabase** :
   - Accès via Dashboard → Settings → Database → Backups
   - Restauration point-in-time disponible
   - Restauration complète ou sur nouvelle instance

2. **Restauration via CLI** :
   - Utilisation de `supabase db reset` et `pg_restore`
   - Documentation complète dans `docs/BACKUP_RESTORE.md`

### Tests de Restauration

- **Fréquence** : Mensuelle (recommandé)
- **Procédure** : Tests sur environnement de développement ou instance de test
- **Validation** : Vérification de l'intégrité des données, relations, triggers et politiques RLS

### Monitoring

- Vérification quotidienne de l'état des sauvegardes automatiques
- Alertes configurées pour les échecs de sauvegarde
- Documentation des incidents et procédures correctives

**Documentation détaillée** : Voir `docs/BACKUP_RESTORE.md` pour les procédures complètes de sauvegarde et restauration.

---

## 📝 Conclusion

**CBD Flower Cup** est une plateforme web complète et moderne qui révolutionne l'organisation de concours de fleurs de CBD en Europe. Avec sa **proposition de valeur claire** pour chaque type d'utilisateur (organisateurs, producteurs, juges, public), ses **avantages concurrentiels uniques** (sécurité RLS, conformité UE, automatisation complète), et son **modèle de monétisation solide**, la plateforme se positionne comme la solution professionnelle de référence.

L'architecture technique moderne (React/TypeScript, Supabase, Vercel), la **conformité réglementaire européenne** garantie (RGPD, limite THC paramétrable par concours, pages légales complètes), et les **fonctionnalités avancées** (analytics, automatisation, scoring normé, anti-fraude, prévention des conflits d'intérêt) en font une solution robuste et évolutive. La **roadmap ambitieuse** (API publique, IA, blockchain) et les **KPIs cibles** définis démontrent la vision à long terme du projet.

La collecte de données structurée permet une analyse approfondie des performances et de l'engagement, tandis que l'automatisation complète réduit drastiquement les tâches administratives, libérant les organisateurs pour se concentrer sur l'essentiel : créer des événements mémorables et valoriser la qualité des produits CBD.

---

*Document généré le : 2024-12-01*  
*Version de l'application : 0.1.0*  
*Dernière mise à jour majeure : Ajout des pages légales, anti-fraude votes, prévention conflits d'intérêt, limite THC paramétrable*

