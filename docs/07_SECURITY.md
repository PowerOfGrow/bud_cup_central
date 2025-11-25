# 🔐 Document de Sécurité - CBD Flower Cup

## Vue d'ensemble

Ce document recense toutes les mesures de sécurité mises en place pour la plateforme CBD Flower Cup, incluant les Row Level Security (RLS) policies, les permissions par rôle, et les protections frontend/backend.

**Date de dernière mise à jour** : 2024-12-01  
**Version** : 1.0

---

## 1. Architecture de Sécurité

### 1.1 Protection Multi-Couches

1. **Frontend** : Composant `ProtectedRoute` avec vérification d'authentification et de rôle
2. **Backend (Supabase)** : Row Level Security (RLS) sur toutes les tables
3. **Storage** : Policies sur les buckets Supabase Storage
4. **Functions** : Security definer avec vérifications internes

### 1.2 Rôles Utilisateurs

- **viewer** : Membre gratuit (lecture seule + votes)
- **producer** : Producteur (peut soumettre et gérer ses entrées)
- **judge** : Juge (peut évaluer les entrées)
- **organizer** : Organisateur (gestion complète des concours)

---

## 2. Row Level Security (RLS) Policies

### 2.1 Table `profiles`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Profiles are publicly readable` | SELECT | `true` (lecture publique) |
| `Users manage their profile` | ALL | `auth.uid() = id OR service_role` |

**Permissions** :
- ✅ Tous : Lecture des profils
- ✅ Propriétaire : Modification de son propre profil

---

### 2.2 Table `contests`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Contests visible to everyone` | SELECT | `status != 'draft' OR service_role OR created_by = auth.uid()` |
| `Organizers manage contests` | ALL | `role = 'organizer' OR service_role` |

**Permissions** :
- ✅ Public : Lecture des concours non-brouillons
- ✅ Organisateurs : Gestion complète (CRUD)
- ✅ Créateur : Lecture de ses brouillons

---

### 2.3 Table `entries`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Entries visible to community` | SELECT | `status IN ('approved', 'archived') OR producer_id = auth.uid() OR juge assigné OR organizer` |
| `Producers manage their entries` | INSERT | `producer_id = auth.uid() AND role IN ('producer', 'organizer')` |
| `Producers update their entries` | UPDATE | `producer_id = auth.uid() OR service_role` |
| `Producers delete their draft entries` | DELETE | `producer_id = auth.uid() AND status = 'draft'` |

**Permissions** :
- ✅ Public : Lecture des entrées approuvées
- ✅ Producteur : Gestion de ses propres entrées (sauf suppression si soumises)
- ✅ Juge : Lecture des entrées des concours assignés
- ✅ Organisateur : Lecture de toutes les entrées

---

### 2.4 Table `entry_documents`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Documents accessible to relevant users` | SELECT | `entry approuvée OU producer_id = auth.uid() OU juge assigné OU organizer` |
| `Producers manage their documents` | ALL | `producer_id = auth.uid() OR service_role` |

**Permissions** :
- ✅ Producteur : Gestion des documents de ses entrées
- ✅ Juge : Lecture des documents des entrées à évaluer
- ✅ Organisateur : Lecture de tous les documents

---

### 2.5 Table `contest_judges`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Judges visible per contest` | SELECT | `contest.status != 'draft' OR created_by = auth.uid()` |
| `Organizers manage contest judges` | ALL | `role = 'organizer' OR service_role` |

**Permissions** :
- ✅ Public : Lecture des juges pour concours non-brouillons
- ✅ Organisateur : Gestion complète des assignations

---

### 2.6 Table `judge_scores`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Judges manage their scores` | ALL | `judge_id = auth.uid() OR service_role` |

**Permissions** :
- ✅ Juge : Gestion de ses propres scores uniquement
- ⚠️ **Note** : Les scores ne sont pas visibles publiquement par design (seulement agrégés)

---

### 2.7 Table `public_votes`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Votes readable by all` | SELECT | `true` (lecture publique) |
| `Authenticated users vote once per entry` | INSERT | `voter_profile_id = auth.uid() OR service_role` |
| `Voters can update their vote` | UPDATE | `voter_profile_id = auth.uid() OR service_role` |

**Permissions** :
- ✅ Public : Lecture de tous les votes
- ✅ Authentifié : Un vote par utilisateur par entrée (contrainte unique en DB)

---

### 2.8 Table `entry_badges`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Badges visible to everyone` | SELECT | `true` (lecture publique) |
| `Organizers manage badges` | ALL | `role = 'organizer' OR service_role` |

**Permissions** :
- ✅ Public : Lecture des badges
- ✅ Organisateur : Attribution/gestion des badges

---

### 2.9 Table `entry_comments`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `View approved comments only (or own pending/rejected)` | SELECT | `status = 'approved' OR user_id = auth.uid() OR organizer` |
| `Authenticated users can create comments` | INSERT | `user_id = auth.uid() AND entry.status = 'approved'` |
| `Users can update their own comments` | UPDATE | `user_id = auth.uid() OR service_role` |
| `Users can delete their own comments` | DELETE | `user_id = auth.uid() OR service_role` |

**Permissions** :
- ✅ Public : Lecture des commentaires approuvés
- ✅ Auteur : Gestion de ses propres commentaires
- ✅ Organisateur : Voir tous les commentaires (y compris en modération)

---

### 2.10 Table `comment_reports`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Anyone can view their own reports` | SELECT | `reporter_id = auth.uid() OR service_role` |
| `Organizers can view all reports` | SELECT | `role = 'organizer' OR service_role` |
| `Authenticated users can report comments` | INSERT | `reporter_id = auth.uid()` |

**Permissions** :
- ✅ Utilisateur : Voir ses propres signalements
- ✅ Organisateur : Voir tous les signalements
- ✅ Authentifié : Signaler un commentaire

---

### 2.11 Table `banned_words`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Anyone can view banned words` | SELECT | `true` (lecture publique) |
| `Organizers can manage banned words` | ALL | `role = 'organizer' OR service_role` |

**Permissions** :
- ✅ Public : Lecture (pour vérification côté client)
- ✅ Organisateur : Gestion complète

---

### 2.12 Table `notifications`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Users can view their own notifications` | SELECT | `user_id = auth.uid() OR service_role` |
| `Users can update their own notifications` | UPDATE | `user_id = auth.uid() OR service_role` |
| `Service role can insert notifications` | INSERT | `service_role` |

**Permissions** :
- ✅ Utilisateur : Gestion de ses propres notifications uniquement

---

### 2.13 Table `favorites`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Users can view their own favorites` | SELECT | `user_id = auth.uid() OR service_role` |
| `Users can add their own favorites` | INSERT | `user_id = auth.uid() OR service_role` |
| `Users can delete their own favorites` | DELETE | `user_id = auth.uid() OR service_role` |

**Permissions** :
- ✅ Utilisateur : Gestion de ses propres favoris uniquement

---

### 2.14 Table `entry_audit_log`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Organizers and producers can view audit logs` | SELECT | `role IN ('organizer', 'producer') OR service_role` |

**Permissions** :
- ✅ Organisateur : Lecture de tous les logs
- ✅ Producteur : Lecture des logs de ses entrées

---

### 2.15 Table `contest_status_history`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Organizers can view contest status history` | SELECT | `role = 'organizer' OR service_role` |
| `Users can view public contest status history` | SELECT | `contest.status != 'draft'` |

**Permissions** :
- ✅ Organisateur : Lecture de tout l'historique
- ✅ Public : Lecture de l'historique des concours publics

---

### 2.16 Table `coa_download_logs`

**RLS activé** : ✅

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Users can view their own download logs` | SELECT | `user_id = auth.uid() OR service_role` |

**Permissions** :
- ✅ Utilisateur : Voir ses propres logs de téléchargement
- ✅ Organisateur : Accès via vues dédiées (fonction RPC)

---

## 3. Supabase Storage Policies

### 3.1 Bucket `entry-photos`

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Public can view entry photos` | SELECT | `true` (lecture publique) |
| `Producers can upload entry photos` | INSERT | `role IN ('producer', 'organizer')` |
| `Producers can update their entry photos` | UPDATE | `role IN ('producer', 'organizer')` |
| `Producers can delete their entry photos` | DELETE | `role IN ('producer', 'organizer')` |

---

### 3.2 Bucket `entry-documents`

| Policy | Opération | Condition |
|--------|-----------|-----------|
| `Authorized users can view entry documents` | SELECT | `role IN ('producer', 'judge', 'organizer')` |
| `Producers can upload entry documents` | INSERT | `role IN ('producer', 'organizer')` |
| `Producers can update their entry documents` | UPDATE | `role IN ('producer', 'organizer')` |
| `Producers can delete their entry documents` | DELETE | `role IN ('producer', 'organizer')` |

**Note** : Les documents COA utilisent des **signed URLs** avec expiration et logging pour sécurité renforcée.

---

## 4. Matrice de Permissions par Rôle

### 4.1 Viewer (Membre gratuit)

| Ressource | Lecture | Écriture | Suppression |
|-----------|---------|----------|-------------|
| Profils | ✅ Tous | ✅ Son propre | ❌ |
| Concours | ✅ Publics | ❌ | ❌ |
| Entrées | ✅ Approuvées | ❌ | ❌ |
| Votes | ✅ Tous | ✅ Ses votes | ✅ Son vote |
| Commentaires | ✅ Approuvés | ✅ Ses commentaires | ✅ Son commentaire |
| Favoris | ✅ Ses favoris | ✅ | ✅ |
| Notifications | ✅ Ses notifications | ✅ (lu/non-lu) | ❌ |

---

### 4.2 Producer (Producteur)

| Ressource | Lecture | Écriture | Suppression |
|-----------|---------|----------|-------------|
| Profils | ✅ Tous | ✅ Son propre | ❌ |
| Concours | ✅ Publics | ❌ | ❌ |
| Entrées | ✅ Approuvées + Ses entrées | ✅ Ses entrées | ✅ Brouillons seulement |
| Documents | ✅ Ses documents + approuvés | ✅ Ses documents | ✅ Ses documents |
| Photos | ✅ Toutes | ✅ Ses photos | ✅ Ses photos |
| Votes | ✅ Tous | ✅ Ses votes | ✅ Son vote |
| Commentaires | ✅ Approuvés | ✅ Ses commentaires | ✅ Son commentaire |
| Favoris | ✅ Ses favoris | ✅ | ✅ |
| Audit Log | ✅ Ses entrées | ❌ | ❌ |

---

### 4.3 Judge (Juge)

| Ressource | Lecture | Écriture | Suppression |
|-----------|---------|----------|-------------|
| Profils | ✅ Tous | ✅ Son propre | ❌ |
| Concours | ✅ Assignés | ❌ | ❌ |
| Entrées | ✅ Concours assignés | ❌ | ❌ |
| Scores | ✅ Ses scores | ✅ Ses scores | ✅ Ses scores |
| Documents | ✅ Entrées à évaluer | ❌ | ❌ |
| Votes | ✅ Tous | ✅ Ses votes | ✅ Son vote |
| Commentaires | ✅ Approuvés | ✅ Ses commentaires | ✅ Son commentaire |
| Favoris | ✅ Ses favoris | ✅ | ✅ |

---

### 4.4 Organizer (Organisateur)

| Ressource | Lecture | Écriture | Suppression |
|-----------|---------|----------|-------------|
| **Tout** | ✅ **Tout** | ✅ **Gestion complète** | ✅ **Gestion complète** |
| Concours | ✅ Tous | ✅ Tous | ✅ Tous |
| Entrées | ✅ Toutes | ✅ Validation COA | ✅ (via rejet) |
| Juges | ✅ Tous | ✅ Assignation | ✅ Retrait |
| Badges | ✅ Tous | ✅ Attribution | ✅ Suppression |
| Commentaires | ✅ Tous (incl. modération) | ✅ Modération | ✅ |
| Audit Log | ✅ Tous | ❌ | ❌ |
| Statistiques | ✅ Complètes | ❌ | ❌ |

---

## 5. Protection Frontend (Routes)

### 5.1 Routes Publiques

- `/` (Index)
- `/contests` (Liste des concours)
- `/about` (À propos)
- `/login` (Connexion)
- `/register` (Inscription)
- `/legal/*` (Pages légales)

### 5.2 Routes Protégées (Authentification requise)

| Route | Protection | Rôle requis |
|-------|------------|-------------|
| `/dashboard` | `ProtectedRoute` | Aucun (tous rôles) |
| `/vote/:entryId` | `ProtectedRoute` | Aucun |
| `/submit-entry` | `ProtectedRoute` | `producer` |
| `/judge-evaluation/:entryId` | `ProtectedRoute` | `judge` |
| `/notifications` | `ProtectedRoute` | Aucun |
| `/favorites` | `ProtectedRoute` | Aucun |
| `/settings` | `ProtectedRoute` | Aucun |

### 5.3 Routes Organisateur

| Route | Protection | Rôle requis |
|-------|------------|-------------|
| `/manage-contests` | `ProtectedRoute` + vérif interne | `organizer` |
| `/manage-contests/:contestId/judges` | `ProtectedRoute` + vérif interne | `organizer` |
| `/review-entries` | `ProtectedRoute` | `organizer` |
| `/monitor-votes` | `ProtectedRoute` | `organizer` |
| `/monitor-judge-conflicts` | `ProtectedRoute` | `organizer` |
| `/judge-bias-analysis` | `ProtectedRoute` | `organizer` |
| `/moderate-comments` | `ProtectedRoute` | `organizer` |
| `/entries/:entryId/audit-history` | `ProtectedRoute` | `organizer` |

### 5.4 Routes Publiques avec Données Sensibles

| Route | Protection | Notes |
|-------|------------|-------|
| `/contests/:contestId/results` | Publique | Données filtrées par RLS backend |
| `/search` | Publique | Résultats filtrés par RLS backend |

---

## 6. Fonctions de Sécurité Backend

### 6.1 Fonctions avec `SECURITY DEFINER`

Toutes les fonctions RPC critiques utilisent `security definer` avec vérifications internes :

- `change_contest_status()` : Validation des transitions
- `create_comment_with_moderation()` : Détection spam + rate limiting
- `award_automatic_badges()` : Vérification concours terminé
- `moderate_comment()` : Vérification rôle organisateur
- `get_contest_allowed_transitions()` : Filtrage par rôle
- `log_coa_download()` : Logging sécurisé
- `check_coa_download_limit()` : Rate limiting téléchargements
- `check_judge_producer_conflict()` : Prévention conflits d'intérêt
- `check_judge_entry_conflict()` : Validation avant évaluation

### 6.2 Triggers de Sécurité

- **Anti-fraude votes** : Rate limiting, détection IP suspectes
- **Conflits juges** : Blocage évaluation si juge = producteur
- **Audit trail** : Logging automatique des modifications
- **Modération commentaires** : Détection automatique spam

---

## 7. Mesures Anti-Fraude

### 7.1 Votes Publics

- ✅ Rate limiting : 10 votes/heure, 50 votes/jour
- ✅ Détection IP : Alerte si > 3 utilisateurs/IP en 1h
- ✅ Logging complet : IP, user agent, timestamp
- ✅ Vue monitoring : `suspicious_votes` pour organisateurs

### 7.2 Commentaires

- ✅ Rate limiting : 10 commentaires/heure, 50/jour
- ✅ Détection spam : Liste mots interdits + score
- ✅ Auto-modération : Mise en pending si score > 0.5
- ✅ Signalements : 3 signalements = auto pending

### 7.3 Documents COA

- ✅ Signed URLs : Expiration automatique (1h)
- ✅ Rate limiting : 50 téléchargements/jour
- ✅ Logging : Traçabilité complète des accès

---

## 8. Conformité RGPD

### 8.1 Droits Utilisateurs

- ✅ **Export données** : Fonction `export_user_data()`
- ✅ **Suppression compte** : Fonction `request_account_deletion()`
- ✅ **Anonymisation** : Fonction `anonymize_user_profile()`
- ✅ **Vues de monitoring** : `account_deletion_requests`

### 8.2 Politique de Rétention

- ✅ Logs de téléchargement : Conservation 90 jours
- ✅ Audit trail : Conservation indéfinie (conformité légale)
- ✅ Votes : Conservation indéfinie (intégrité résultats)

---

## 9. Tests de Sécurité Recommandés

### 9.1 Tests à Effectuer

- [ ] Tester qu'un utilisateur ne peut pas accéder aux données d'un autre
- [ ] Tester que les rôles sont bien respectés (judge ne peut pas créer concours)
- [ ] Tester que les RLS bloquent les accès non autorisés
- [ ] Tester les transitions de statut (ne pas sauter d'étapes)
- [ ] Tester le rate limiting (dépassement des limites)
- [ ] Tester la détection de spam (commentaires avec mots interdits)
- [ ] Tester les conflits d'intérêt (juge producteur de l'entrée)

### 9.2 Scénarios de Test

1. **Vote frauduleux** : Tenter > 50 votes/jour
2. **Accès non autorisé** : Producteur tentant d'accéder aux stats organisateur
3. **Modification données** : Utilisateur tentant de modifier l'entrée d'un autre
4. **Bypass RLS** : Tentative d'accès direct via API sans authentification

---

## 10. Recommandations Sécurité

### 10.1 Bonnes Pratiques Actuelles

✅ Toutes les tables ont RLS activé  
✅ Policies restrictives par défaut  
✅ Validation des transitions d'état  
✅ Rate limiting sur actions critiques  
✅ Logging complet des actions sensibles  

### 10.2 Améliorations Futures

- [ ] Ajouter 2FA pour organisateurs (optionnel)
- [ ] Implémenter captcha pour votes/commentaires (si abus)
- [ ] Monitoring automatique des tentatives d'intrusion
- [ ] Alertes email pour actions sensibles (changement statut concours)
- [ ] Chiffrement des documents COA au repos (optionnel)

---

## 11. Contacts Sécurité

En cas de découverte d'une vulnérabilité de sécurité, merci de contacter l'équipe de développement.

---

*Document créé le : 2024-12-01*  
*Dernière mise à jour : 2024-12-01*

