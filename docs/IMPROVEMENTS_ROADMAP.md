# 🚀 Roadmap d'Amélioration - CBD Flower Cup

## Vue d'ensemble

Ce document recense tous les points d'amélioration identifiés pour rendre la plateforme CBD Flower Cup plus robuste, professionnelle et alignée avec les besoins métier. Les améliorations sont organisées par priorité et impact.

---

## A) 🔧 Cohérence du Document / Fonctionnelle

### A.1 Uniformiser les Critères Jury ⚠️ CRITIQUE

**Problème actuel** :
- Document mentionne **4 critères** : Apparence, Aromatique, Goût, Effet
- Table `judge_scores` contient **5 colonnes** : `appearance_score`, `aroma_score`, `taste_score`, `effect_score`, `overall_score`
- Mais le document parle de "Densité" et "Terpènes" qui n'existent pas en DB

**Action requise** :
- [ ] **Décision** : Choisir entre 4 ou 5 critères définitifs
- [ ] Si 4 critères : 
  - [ ] Supprimer `aroma_score` de la DB OU le renommer en `terpene_score`
  - [ ] Ou fusionner densité + terpènes dans un seul critère
- [ ] Si 5 critères :
  - [ ] Ajouter `density_score` dans la table `judge_scores`
  - [ ] Mettre à jour l'interface d'évaluation
  - [ ] Mettre à jour le calcul du score global
- [ ] Aligner partout : UI, DB, calculs, documentations, OVERVIEW.md

**Fichiers à modifier** :
- `supabase/migrations/*` (ajout/suppression colonne)
- `src/pages/JudgeEvaluation.tsx`
- `docs/OVERVIEW.md`
- Schéma de base de données

---

### A.2 Clarifier le Calcul du Score Global ✅ TERMINÉ

**Problème résolu** :
- ✅ Modèle de calcul clairement défini et documenté
- ✅ Décision prise : Moyenne simple sans pondération par critère ni normalisation par juge
- ✅ Documentation complète avec formules détaillées et exemples

**Décisions prises** :
- ✅ **Moyenne simple des 4 critères** : Chaque critère compte pour 25% (pas de pondération différenciée)
- ✅ **Pas de pondération par critère** : Tous les critères sont traités de manière équitable
- ✅ **Pas de normalisation par juge dans le calcul final** : Les scores sont utilisés directement pour garantir la transparence. La normalisation existe uniquement pour l'analyse des biais (voir C.4 - Judge Bias Analysis)

**Modifications apportées** :
- ✅ `docs/OVERVIEW.md` : Section "Détail du Calcul des Scores" entièrement réécrite avec :
  - Formules explicites pour chaque étape
  - Exemples numériques complets
  - Justifications des choix (transparence, équité)
  - Clarification sur la gestion des biais (analyse uniquement, pas de correction du score)
  - Explication de la normalisation publique (0-5 vers 0-100)
  - Détails sur les pondérations configurables par concours

**État actuel** :
- Le calcul est transparent et documenté : moyenne simple → moyenne jury → normalisation publique → score combiné
- Les pondérations jury/public sont configurables par concours (par défaut 70/30)
- L'analyse des biais existe mais n'affecte pas les scores (utilisée uniquement pour monitoring)

---

### A.3 Rendre Paramétrables les Pondérations Jury/Public ✅ TERMINÉ

**Problème résolu** :
- ✅ Les pondérations sont maintenant configurables par concours
- ✅ Flexibilité pour des concours B2B avec besoins spécifiques

**Implémenté** :
- ✅ Migration SQL : Colonnes `jury_weight` et `public_weight` ajoutées dans `contests` (défaut 0.7/0.3)
- ✅ Contrainte SQL : `jury_weight + public_weight = 1.0`
- ✅ Interface organisateur : Champs configurables dans `ManageContests.tsx` avec validation
- ✅ Calcul dynamique : `ContestResults.tsx` utilise les poids du concours
- ✅ Fonction SQL helper : `calculate_combined_score()` avec pondérations personnalisables
- ✅ Avertissement visuel : Affichage d'un warning si la somme ≠ 100%
- ✅ Documentation : Explication de la formule dans l'interface

**Fichiers modifiés** :
- ✅ `supabase/migrations/20241201000003_add_jury_public_weights.sql`
- ✅ `src/pages/ManageContests.tsx` (champs configurables avec validation)
- ✅ `src/pages/ContestResults.tsx` (calcul dynamique selon les poids du concours)
- ✅ `docs/OVERVIEW.md` (mention des pondérations configurables)

---

### A.4 Catégories d'Entrées Custom par Concours ✅ TERMINÉ

**Problème résolu** :
- ✅ Les organisateurs peuvent maintenant définir des catégories personnalisées par concours
- ✅ Rétrocompatibilité complète : catégories globales utilisées si aucune custom

**Implémenté** :
- ✅ Migration SQL : Table `contest_categories` avec tous les champs nécessaires (weight, max_entries_per_producer, rules JSONB)
- ✅ Colonne `contest_category_id` ajoutée dans `entries` (nullable, rétrocompatible)
- ✅ Vue `available_categories_for_contest` combinant catégories custom + globales
- ✅ Fonction SQL `get_entry_category_name()` pour afficher le nom correct
- ✅ Interface organisateur : Page `/manage-contests/:contestId/categories` avec CRUD complet
- ✅ `SubmitEntry.tsx` : Chargement dynamique des catégories selon le concours sélectionné
- ✅ `Contests.tsx` : Filtre et Select mis à jour pour gérer catégories custom
- ✅ Composant `CategoryBadge` et hook `useEntryCategoryName()` pour affichage unifié
- ✅ Toutes les pages utilisent le système unifié pour afficher les catégories

**Fichiers créés/modifiés** :
- ✅ `supabase/migrations/20241202000004_add_contest_categories.sql`
- ✅ `src/pages/ManageContestCategories.tsx`
- ✅ `src/pages/SubmitEntry.tsx` (mise à jour)
- ✅ `src/pages/Contests.tsx` (mise à jour)
- ✅ `src/components/CategoryBadge.tsx`
- ✅ `src/hooks/use-entry-category.ts`

**Fichiers à créer/modifier** :
- Migration SQL
- `src/pages/ManageContests.tsx` (gestion catégories)
- `src/pages/SubmitEntry.tsx` (sélection catégorie)
- Schéma DB

---

### A.5 Statuts Concours + Transitions (State Machine) 🟡 MOYEN

**Problème actuel** :
- Statuts existent : `draft`, `registration`, `judging`, `completed`, `archived`
- Pas de règles de transition documentées
- Pas de validation des transitions

**Action requise** :
- [ ] **Définir State Machine** :
  ```
  draft → registration → judging → completed → archived
           ↓              ↓
        (cancel)    (pause/resume)
  ```
- [ ] Créer fonction PostgreSQL pour valider les transitions
- [ ] Contraintes : qui peut changer quel statut ?
  - [ ] `draft → registration` : Organisateur seulement
  - [ ] `registration → judging` : Auto quand date atteinte OU manuel orga
  - [ ] `judging → completed` : Auto quand toutes évaluations faites OU manuel
  - [ ] `completed → archived` : Organisateur seulement
- [ ] Interface organisateur : boutons conditionnels selon statut actuel
- [ ] Documenter dans OVERVIEW.md

**Fichiers à créer/modifier** :
- Migration SQL (fonction validate_transition)
- `src/pages/ManageContests.tsx` (gestion statuts)
- `docs/OVERVIEW.md`

---

### A.6 Certificats PDF - Clarifier Statut 🟢 MINEUR

**Problème actuel** :
- Mentionnés comme étape standard mais "prévu" en roadmap
- Ambiguïté sur la disponibilité

**Action requise** :
- [ ] Marquer explicitement dans OVERVIEW.md : "**Post-MVP / Premium Feature / Phase 2**"
- [ ] Dans Roadmap : déplacer en "Vision à Moyen Terme (6-12 mois)"
- [ ] OU décider : implémenter maintenant (2-3h de dev)
- [ ] Créer un ticket/story pour tracking

**Fichiers à modifier** :
- `docs/OVERVIEW.md`

---

### A.7 Emails - Planifier Déclenchement Auto V1 🟡 MOYEN

**Problème actuel** :
- "Infra prête mais déclenchement manuel" = ambigu
- Pas clair pour les utilisateurs

**Action requise** :
- [ ] **Planifier déclenchement automatique minimal V1** :
  - [ ] Trigger SQL qui appelle Edge Function après création notification
  - [ ] Ou job/worker qui scanne notifications non envoyées
- [ ] Types prioritaires à automatiser :
  - [ ] `judge_assigned` : Email au juge lors d'assignation
  - [ ] `entry_approved` : Email au producteur
  - [ ] `entry_rejected` : Email au producteur avec raison
- [ ] Documenter dans OVERVIEW.md : "Emails automatiques pour notifications critiques"

**Fichiers à créer/modifier** :
- Migration SQL (triggers ou fonctions)
- `supabase/functions/send-email/index.ts` (si besoin)
- `docs/OVERVIEW.md`

---

## B) ⚖️ Conformité Légale UE / Risques Réglementaires

### B.1 THC ≤0,3% Non Uniforme en Europe ⚠️ CRITIQUE

**Problème actuel** :
- Limite 0,3% est une moyenne européenne, mais certains pays ont des règles différentes
- Risque légal si concours multi-pays

**Action requise** :
- [ ] Ajouter champ dans table `contests` :
  - [ ] `thc_limit` (décimal, default 0.3)
  - [ ] `applicable_countries` (array de codes pays ISO)
  - [ ] `legal_disclaimer` (texte)
- [ ] Mettre à jour validation dans `SubmitEntry.tsx` pour utiliser `thc_limit` du concours
- [ ] Afficher warning dans formulaire : "Limite légale pour [pays] : [X]%"
- [ ] Migration SQL
- [ ] Documenter dans OVERVIEW.md section conformité

**Fichiers à créer/modifier** :
- Migration SQL
- `src/pages/SubmitEntry.tsx`
- `docs/OVERVIEW.md`

---

### B.2 Définir Règles de Validation COA ⚠️ IMPORTANT

**Problème actuel** :
- Pas de définition claire : formats acceptés, vérification manuelle vs auto
- Risque de non-conformité si COA invalides acceptés

**Action requise** :
- [ ] **Checklist d'acceptation COA** :
  - [ ] Formats acceptés : PDF uniquement ? Images ?
  - [ ] Taille max : 10MB
  - [ ] Champs obligatoires dans COA : THC, CBD, laboratoire, date
  - [ ] Vérification manuelle par organisateur avant approbation
- [ ] Interface organisateur : section "Validation COA" avec checklist
  - [ ] Cases à cocher : Format valide, Données lisibles, THC conforme, Labo reconnu
  - [ ] Champ "Notes de validation" / "Raisons de rejet"
- [ ] Statut d'entrée : ajouter `coa_pending_validation`
- [ ] Documenter dans OVERVIEW.md et USER_GUIDE.md

**Fichiers à créer/modifier** :
- Interface organisateur (nouvelle section)
- `docs/OVERVIEW.md`
- `docs/USER_GUIDE.md`

---

### B.3 Traçabilité et Audit Trail ⚠️ IMPORTANT

**Problème actuel** :
- Pas d'audit trail complet : qui a changé quoi / quand
- Risque pour conformité et résolution de conflits

**Action requise** :
- [ ] Créer table `entry_audit_log` :
  - [ ] `id`, `entry_id`, `user_id`, `action` (created, updated, status_changed, etc.)
  - [ ] `field_changed` (nom du champ modifié)
  - [ ] `old_value`, `new_value` (JSONB pour flexibilité)
  - [ ] `reason` (texte optionnel)
  - [ ] `ip_address`, `user_agent`
  - [ ] `created_at`
- [ ] Triggers PostgreSQL pour logger automatiquement :
  - [ ] Changements de statut
  - [ ] Modifications de scores
  - [ ] Modifications de données critiques (THC, COA)
- [ ] Interface organisateur : page "Historique des modifications" pour chaque entrée
- [ ] Migration SQL
- [ ] Documenter dans OVERVIEW.md

**Fichiers à créer/modifier** :
- Migration SQL
- Triggers SQL
- Interface organisateur
- `docs/OVERVIEW.md`

---

### B.4 Politique RGPD - Privacy Operations 🟡 MOYEN

**Problème actuel** :
- Manque : export données user, suppression compte, rétention COA
- Risque de non-conformité RGPD

**Action requise** :
- [ ] **Section "Privacy Operations" dans OVERVIEW.md** :
  - [ ] Export de données utilisateur (format JSON structuré)
  - [ ] Suppression de compte (soft delete avec anonymisation)
  - [ ] Rétention des données : COA conservés X années (légalement requis)
  - [ ] Consentement explicite pour traitement données
- [ ] Interface utilisateur :
  - [ ] Page Settings : "Télécharger mes données" (export JSON)
  - [ ] Page Settings : "Supprimer mon compte" (avec confirmation + anonymisation)
- [ ] Politique de rétention :
  - [ ] COA : 5-10 ans (selon réglementation)
  - [ ] Données personnelles : jusqu'à suppression compte
  - [ ] Analytics anonymisés : conservation illimitée
- [ ] Documenter processus dans docs/

**Fichiers à créer/modifier** :
- `src/pages/Settings.tsx` (export/suppression)
- Edge Function pour export de données
- `docs/OVERVIEW.md` (section Privacy)
- `docs/PRIVACY_POLICY.md` (nouveau)

---

### B.5 Mentions Légales et Disclaimers ⚠️ CRITIQUE

**Problème actuel** :
- Manque de pages légales obligatoires
- Risque juridique pour publicité produits CBD

**Action requise** :
- [ ] **Créer pages légales** :
  - [ ] `/legal/terms` - Conditions Générales d'Utilisation (CGU)
  - [ ] `/legal/privacy` - Politique de Confidentialité
  - [ ] `/legal/disclaimer` - Avertissements légaux CBD
  - [ ] `/legal/cookies` - Politique des cookies
- [ ] **Contenu des disclaimers** :
  - [ ] Pas d'allégations santé/thérapeutiques
  - [ ] Âge légal : 18+ (ou 21+ selon pays)
  - [ ] Restrictions géographiques
  - [ ] "Produits CBD conformes à la réglementation locale"
- [ ] Footer : liens vers toutes les pages légales
- [ ] Page About : disclaimer visible
- [ ] Documenter dans OVERVIEW.md

**Fichiers à créer** :
- `src/pages/legal/Terms.tsx`
- `src/pages/legal/Privacy.tsx`
- `src/pages/legal/Disclaimer.tsx`
- `src/pages/legal/Cookies.tsx`
- Routes dans `App.tsx`
- `docs/OVERVIEW.md` (section Conformité)

---

## C) 🔒 Sécurité / Anti-fraude / Intégrité

### C.1 Anti-fraude Vote Public ⚠️ CRITIQUE

**Problème actuel** :
- RLS OK, mais pas de protection contre bots/multi-comptes
- Risque de manipulation des votes

**Action requise** :
- [ ] **Rate limiting** :
  - [ ] Max X votes par heure par utilisateur
  - [ ] Max X votes par jour par utilisateur
  - [ ] Fonction PostgreSQL ou middleware
- [ ] **Détection anomalies** :
  - [ ] Alertes si utilisateur vote > X fois en Y minutes
  - [ ] Détection patterns suspects (votes identiques répétés)
- [ ] **CAPTCHA optionnel** :
  - [ ] Pour votes (optionnel selon organisateur)
  - [ ] Ou challenge simple (ex: "Combien font 2+2?")
- [ ] **Seuils de validation** :
  - [ ] Minimum de votes pour qu'un résultat soit valide
  - [ ] Suppression des votes suspects (requiert validation orga)
- [ ] **Logs de votes** :
  - [ ] IP address, user agent, timestamp
  - [ ] Détection multi-comptes (même IP, multiples votes)

**Fichiers à créer/modifier** :
- Migration SQL (rate limiting, logs)
- `src/pages/Vote.tsx` (validation)
- Edge Function ou middleware pour rate limiting
- Dashboard organisateur : "Alertes votes suspects"

---

### C.2 Vérification d'Identité Optionnelle 🟡 MOYEN

**Problème actuel** :
- Pas de vérification d'identité
- Risque pour concours sérieux

**Action requise** :
- [ ] Ajouter dans table `profiles` :
  - [ ] `verification_status` : `unverified`, `pending`, `verified`
  - [ ] `verification_type` : `none`, `email`, `kyc_light`, `professional`
  - [ ] `verification_documents` (array JSONB de documents uploadés)
- [ ] Interface utilisateur :
  - [ ] Page "Vérification" dans Settings
  - [ ] Upload pièce identité / preuve professionnelle
  - [ ] Badge "Vérifié ✅" sur profil
- [ ] Paramétrage concours :
  - [ ] Option "Seuls les producteurs/juges vérifiés peuvent participer"
- [ ] Workflow organisateur :
  - [ ] Validation manuelle des demandes de vérification
- [ ] Migration SQL

**Fichiers à créer/modifier** :
- Migration SQL
- `src/pages/Settings.tsx` (vérification)
- `docs/OVERVIEW.md`

---

### C.3 Gestion des Conflits d'Intérêt Juges ⚠️ IMPORTANT

**Problème actuel** :
- Un juge pourrait théoriquement noter son propre produit (si producteur aussi)
- Pas de blocage explicite

**Action requise** :
- [ ] **Policy RLS** :
  - [ ] Vérifier dans trigger : si `judge_id = producer_id` → bloquer
- [ ] **Fonction PostgreSQL** :
  ```sql
  CREATE FUNCTION check_judge_conflict() RETURNS TRIGGER AS $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM entries e 
      WHERE e.id = NEW.entry_id AND e.producer_id = NEW.judge_id
    ) THEN
      RAISE EXCEPTION 'Un juge ne peut pas évaluer son propre produit';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- [ ] **Interface** :
  - [ ] Message d'erreur clair si conflit détecté
  - [ ] Liste des entrées exclues pour un juge (dashboard)
- [ ] **Migration SQL** avec trigger

**Fichiers à créer/modifier** :
- Migration SQL (fonction + trigger)
- `src/pages/JudgeEvaluation.tsx` (validation préventive)
- `docs/OVERVIEW.md`

---

### C.4 Gestion du "Judge Bias" (Biais des Juges) 🟡 MOYEN

**Problème actuel** :
- Juges qui sur-notent/sous-notent systématiquement
- Pas de détection de biais

**Action requise** :
- [ ] **Calcul statistiques par juge** :
  - [ ] Score moyen donné par le juge
  - [ ] Écart-type
  - [ ] Comparaison avec moyenne globale
- [ ] **Z-score** :
  - [ ] Normaliser les scores par rapport à la moyenne du juge
  - [ ] Détecter scores anormaux (z-score > 2 ou < -2)
- [ ] **Alertes organisateur** :
  - [ ] Dashboard : "Juges avec scores anormaux"
  - [ ] Graphique : distribution des scores par juge
- [ ] **Interface juge** :
  - [ ] Affichage : "Votre score moyen : X/100 (moyenne globale : Y/100)"

**Fichiers à créer/modifier** :
- `src/hooks/use-judge-bias-analysis.ts` (nouveau)
- Dashboard organisateur (section analytics juges)
- `docs/OVERVIEW.md`

---

### C.5 Sécurité Storage COA 🟡 MOYEN

**Problème actuel** :
- Bucket privé OK, mais pas de gestion fine des accès temporaires

**Action requise** :
- [ ] **Signed URLs avec expiration** :
  - [ ] Durée de validité : 1h pour consultation
  - [ ] Refresh automatique si nécessaire
- [ ] **Watermarking optionnel** :
  - [ ] Watermark sur PDF COA téléchargés : "Confidentiel - CBD Flower Cup"
- [ ] **Contrôle download** :
  - [ ] Logs de tous les téléchargements
  - [ ] Limite de téléchargements par utilisateur/jour
- [ ] **Politique de rétention** :
  - [ ] COA supprimés après X années (configurable)
- [ ] Migration SQL si nécessaire

**Fichiers à créer/modifier** :
- `src/services/storage.ts` (signed URLs)
- Edge Function ou service pour watermarking (optionnel)
- `docs/OVERVIEW.md`

---

### C.6 Sécurité Edge Functions Email 🟡 MOYEN

**Action requise** :
- [ ] **Rate limiting** :
  - [ ] Max X emails par utilisateur par jour
  - [ ] Max X emails globaux par minute
- [ ] **Validation payload** :
  - [ ] Valider structure JSON
  - [ ] Sanitizer input (éviter injection)
- [ ] **Logs** :
  - [ ] Logger tous les envois (avec timestamp, destinataire, type)
  - [ ] Logger les erreurs
  - [ ] Dashboard admin pour consulter logs

**Fichiers à créer/modifier** :
- `supabase/functions/send-email/index.ts`
- Table de logs (optionnel)

---

### C.7 Protection Routes Front ET Back ⚠️ IMPORTANT

**Action requise** :
- [ ] **Audit complet des RLS policies** :
  - [ ] Vérifier que TOUTES les tables ont des policies
  - [ ] Vérifier que les policies sont restrictives (pas trop permissives)
- [ ] **Tests de sécurité** :
  - [ ] Tester qu'un utilisateur ne peut pas accéder aux données d'un autre
  - [ ] Tester que les rôles sont bien respectés
- [ ] **Documenter** :
  - [ ] Liste complète des policies RLS
  - [ ] Matrice de permissions par rôle

**Fichiers à créer/modifier** :
- Tests E2E de sécurité
- `docs/SECURITY.md` (nouveau document)
- `docs/OVERVIEW.md` (section Sécurité complétée)

---

## D) 🎨 Produit / Expérience Utilisateur

### D.1 Onboarding par Rôle ✅ TERMINÉ

**Problème actuel** :
- Pas de parcours d'introduction guidé
- Utilisateurs peuvent être perdus

**✅ Implémenté** :
- ✅ **Onboarding interactif** :
  - ✅ Step-by-step pour chaque rôle (organisateur, juge, producteur, viewer)
  - ✅ Checklist de progression avec tracking en base de données
- ✅ **Système de tracking** :
  - ✅ Table `user_onboarding` pour suivre la progression par utilisateur
  - ✅ Fonctions SQL : `complete_onboarding_step()`, `complete_onboarding()`, `reset_onboarding()`
  - ✅ Vue `user_onboarding_status` pour récupérer l'état
- ✅ **Intégration Dashboard** :
  - ✅ Affichage automatique pour nouveaux utilisateurs
  - ✅ Hook `use-onboarding.ts` pour gestion de l'état
  - ✅ Persistance de la progression entre sessions

**Fichiers créés/modifiés** :
- ✅ `src/components/OnboardingWizard.tsx` (amélioré)
- ✅ `src/pages/Dashboard.tsx` (intégration onboarding)
- ✅ `src/hooks/use-onboarding.ts` (nouveau)
- ✅ `supabase/migrations/20241201000018_add_onboarding_tracking.sql` (nouveau)

---

### D.2 Rappels et Deadlines 🟡 MOYEN

**Problème actuel** :
- Producteurs peuvent manquer les deadlines d'inscription
- Pas de visibilité claire des échéances

**Action requise** :
- [ ] **Timeline visible** :
  - [ ] Dashboard producteur : "Prochaines échéances"
  - [ ] Timeline visuelle des dates importantes (inscription, jugement, résultats)
- [ ] **Notifications ciblées** :
  - [ ] Email 7 jours avant deadline inscription
  - [ ] Email 24h avant deadline inscription
  - [ ] Notification in-app pour juges : "Évaluations en attente"
- [ ] **Calcul automatique** :
  - [ ] Basé sur `registration_close_date` du concours
- [ ] **Interface** :
  - [ ] Badge "⚠️ Deadline dans X jours" sur entrées
  - [ ] Compte à rebours sur dashboard

**Fichiers à créer/modifier** :
- `src/components/DeadlineTracker.tsx` (nouveau)
- `src/pages/Dashboard.tsx`
- Edge Function ou cron job pour emails de rappel
- `docs/OVERVIEW.md`

---

### D.3 UX Soumission COA - Champ Assisté ✅ TERMINÉ

**Problème résolu** :
- ✅ Producteurs guidés pour extraire THC/CBD/terpènes du COA
- ✅ Réduction des erreurs de saisie grâce aux helper texts contextuels

**Modifications apportées** :
- ✅ **Guide COA** : Carte informative indiquant ce que le COA doit contenir (THC, CBD, terpènes, laboratoire, date)
- ✅ **Helper texts contextuels** pour chaque champ :
  - THC : Indique où chercher dans le COA (section "Cannabinoids" ou "THC Total")
  - CBD : Guide pour trouver le taux CBD dans le COA
  - Terpènes : Instructions pour extraire le profil terpénique avec exemples
- ✅ **Validation visuelle en temps réel** : Affichage "THC conforme ✅" (vert) si ≤ limite, ou alerte rouge si non conforme
- ✅ **Icônes contextuelles** : Info, FileText, HelpCircle pour guider visuellement

**Fichiers modifiés** :
- ✅ `src/pages/SubmitEntry.tsx` : Ajout helper texts, guide COA, validation visuelle
- ⏭️ **OCR futur** (Roadmap) : Extraction automatique des valeurs depuis COA PDF à implémenter plus tard

---

### D.4 Gestion Multi-Photos ✅ CLARIFIÉ

**Décision prise** :
- ✅ **1 photo principale par entrée** : Le système utilise une seule photo principale stockée dans `photo_url`
- ✅ Documentation clarifiée : Toutes les références dans OVERVIEW.md et API.md ont été mises à jour pour indiquer "1 photo principale par entrée"

**État actuel** :
- La base de données utilise `photo_url` (singulier) dans la table `entries`
- Le code frontend gère l'upload d'une seule photo
- La documentation est maintenant cohérente : "photo principale" partout

**Fichiers modifiés** :
- ✅ `docs/OVERVIEW.md` : Clarifié "1 photo principale par entrée" (3 occurrences mises à jour)
- ✅ `docs/API.md` : Clarifié "URL de la photo principale (1 photo par entrée)"

**Note** : Si nécessaire à l'avenir, un système multi-photos peut être implémenté avec une table `entry_photos` dédiée et une interface d'upload multiple.

---

### D.5 Gestion "Samples Physiques aux Juges" 🟡 MOYEN

**Problème actuel** :
- Pas de tracking logistique si concours réel

**Action requise** :
- [ ] **Table `sample_shipping`** :
  - [ ] `id`, `entry_id`, `judge_id`, `shipping_status`
  - [ ] `tracking_number`, `shipped_at`, `received_at`
  - [ ] `shipping_provider`, `notes`
- [ ] **Workflow** :
  - [ ] Organisateur marque : "Sample envoyé"
  - [ ] Juge confirme : "Sample reçu"
  - [ ] Timeline de shipping visible
- [ ] **Intégration logistique** (future) :
  - [ ] API partenaires (ex: DHL, Chronopost)
  - [ ] Génération étiquettes d'expédition
- [ ] Documenter dans OVERVIEW.md comme "fonctionnalité prévue"

**Fichiers à créer/modifier** :
- Migration SQL
- Interface organisateur/juge
- `docs/OVERVIEW.md`

---

### D.6 Mode "Concours Virtuel" vs "Physique" 🟡 MOYEN

**Action requise** :
- [ ] Ajouter champ dans table `contests` :
  - [ ] `contest_type` : `virtual` | `physical` | `hybrid`
- [ ] **Concours virtuel** :
  - [ ] Pas besoin d'envoi samples
  - [ ] Jugement basé sur photos/vidéos/descriptions
- [ ] **Concours physique** :
  - [ ] Samples obligatoires
  - [ ] Tracking shipping requis
- [ ] **Interface organisateur** :
  - [ ] Sélection du type lors de création
  - [ ] Adaptation du workflow selon le type
- [ ] Documenter dans OVERVIEW.md

**Fichiers à créer/modifier** :
- Migration SQL
- `src/pages/ManageContests.tsx`
- `docs/OVERVIEW.md`

---

### D.7 Commentaires Publics : Modération ⚠️ IMPORTANT

**Problème actuel** :
- Risque de spam, contenu inapproprié
- Pas de modération

**Action requise** :
- [ ] **Signalement** :
  - [ ] Bouton "Signaler" sur chaque commentaire
  - [ ] Table `comment_reports` : `id`, `comment_id`, `reporter_id`, `reason`, `status`
- [ ] **Modération organisateur/admin** :
  - [ ] Page "Modération commentaires" dans dashboard organisateur
  - [ ] Actions : Approuver, Rejeter, Supprimer
- [ ] **Filtrage anti-spam** :
  - [ ] Liste de mots interdits (configurable)
  - [ ] Détection de liens suspects
  - [ ] Rate limiting : max X commentaires/heure
- [ ] **Statut commentaires** :
  - [ ] `pending`, `approved`, `rejected`, `hidden`
- [ ] Migration SQL

**Fichiers à créer/modifier** :
- Migration SQL
- `src/components/CommentsSection.tsx`
- Dashboard organisateur (modération)
- `docs/OVERVIEW.md`

---

### D.8 Favoris & Social - Collection Publique 🟢 MINEUR

**Action requise** :
- [ ] Option dans profil : "Rendre ma collection publique"
- [ ] Page publique : `/profiles/[userId]/favorites`
- [ ] Partage de collection : lien partageable
- [ ] Privacy : paramètre dans Settings

**Fichiers à créer/modifier** :
- `src/pages/Settings.tsx` (privacy)
- `src/pages/ProfileFavorites.tsx` (nouveau)
- `docs/OVERVIEW.md`

---

### D.9 Search Relevance - Ranking 🟡 MOYEN

**Problème actuel** :
- Tri simple par date/score
- Pas de ranking intelligent

**Action requise** :
- [ ] **Ranking algorithm** :
  - [ ] Score de pertinence = texte match + popularité + recency
  - [ ] Popularité : nombre de votes, scores
  - [ ] Recency : plus récent = boost
- [ ] **Ordre de tri** :
  - [ ] Par défaut : pertinence
  - [ ] Options : date, score, popularité
- [ ] **Full-text search** :
  - [ ] Index PostgreSQL full-text sur colonnes recherchables
  - [ ] Ranking PostgreSQL natif

**Fichiers à créer/modifier** :
- Migration SQL (indexes full-text)
- `src/hooks/use-global-search.ts`
- `docs/OVERVIEW.md`

---

### D.10 Pagination Flexible 🟢 MINEUR

**Action requise** :
- [ ] Paramètre utilisateur : "Résultats par page" (6, 12, 24, 48)
- [ ] Sauvegarde préférence dans Settings
- [ ] OU infinite scroll optionnel

**Fichiers à créer/modifier** :
- `src/components/PaginationControls.tsx`
- `src/pages/Settings.tsx`
- `docs/OVERVIEW.md`

---

### D.11 Accessibilité - Plan de Test ✅ TERMINÉ

**Problème actuel** :
- Annonce WCAG AA mais pas de plan de test

**✅ Implémenté** :
- ✅ **Checklist WCAG AA complète** :
  - ✅ Contraste couleurs (ratio 4.5:1) vérifié dans styles Tailwind
  - ✅ Navigation clavier (Tab, Enter, Escape) implémentée et testée
  - ✅ Lecteurs d'écran (ARIA labels, roles) sur tous les composants
  - ✅ Focus visible avec styles Tailwind `focus:ring`
  - ✅ Textes alternatifs images via composant `OptimizedImage`
- ✅ **Tests automatisés** :
  - ✅ `axe-core` intégré dans tests E2E Playwright
  - ✅ Tests complets d'accessibilité dans `e2e/accessibility.spec.ts`
  - ✅ Tests de navigation clavier, formulaires, images, structure
- ✅ **Documentation complète** :
  - ✅ `docs/ACCESSIBILITY.md` créé (plan de test, checklist WCAG, bonnes pratiques)
  - ✅ Mention dans OVERVIEW.md : "Tests d'accessibilité automatisés"
  - ✅ Scripts npm : `test:accessibility` et `test:a11y`

**Fichiers créés/modifiés** :
- ✅ `e2e/accessibility.spec.ts` (nouveau - tests automatisés)
- ✅ `docs/ACCESSIBILITY.md` (nouveau - documentation complète)
- ✅ `package.json` (scripts de test ajoutés)
- ✅ `docs/OVERVIEW.md` (section accessibilité ajoutée)

---

## E) 📊 Données / Analytics

### E.1 Définir KPIs "Vérité Source" ⚠️ IMPORTANT

**Problème actuel** :
- KPIs mentionnés mais pas de définition précise de leur calcul

**Action requise** :
- [ ] **Documenter chaque KPI** :
  - [ ] "Producteurs actifs" : définition exacte (ayant soumis entrée ? ayant entrée approuvée ?)
  - [ ] "Votants actifs" : ayant voté au moins 1 fois ? dans les 30 derniers jours ?
  - [ ] "Taux d'engagement" : formule exacte
- [ ] **Vues SQL** :
  - [ ] Créer vues matérialisées pour KPIs principaux
  - [ ] Documenter les requêtes dans `docs/ANALYTICS.md`
- [ ] **Section dans OVERVIEW.md** :
  - [ ] "Définitions des métriques" avec formules

**Fichiers à créer/modifier** :
- Migration SQL (vues)
- `docs/ANALYTICS.md` (nouveau)
- `docs/OVERVIEW.md`

---

### E.2 Analytics par Rôle - Benchmarks 🟡 MOYEN

**Action requise** :
- [ ] **Dashboard producteur** :
  - [ ] "Vos performances vs moyenne globale"
  - [ ] Graphique : vos scores vs moyenne par catégorie
  - [ ] Benchmarks anonymisés
- [ ] **Dashboard juge** :
  - [ ] "Votre sévérité vs moyenne" (score moyen donné)
  - [ ] Distribution de vos scores
- [ ] **Dashboard viewer** :
  - [ ] "Votre style de vote" (préférences catégories)

**Fichiers à créer/modifier** :
- `src/pages/Dashboard.tsx` (enrichissement)
- `docs/OVERVIEW.md`

---

### E.3 Normalisation des Scores 🟡 MOYEN

**Problème actuel** :
- Un concours peut être "plus généreux" qu'un autre
- Comparaison difficile entre concours

**Action requise** :
- [ ] **Standardisation** :
  - [ ] Z-score par concours (normaliser à moyenne 0, écart-type 1)
  - [ ] Percentiles historiques
- [ ] **Option organisateur** :
  - [ ] "Utiliser scoring normalisé" (checkbox)
- [ ] **Affichage** :
  - [ ] Score brut + score normalisé (optionnel)

**Fichiers à créer/modifier** :
- `src/services/analytics.ts` (fonctions normalisation)
- Interface organisateur
- `docs/OVERVIEW.md`

---

### E.4 Exports PDF - Lisibilité Charts 🟡 MOYEN

**Action requise** :
- [ ] **Vérifier lisibilité** :
  - [ ] Charts en noir/blanc pour impression
  - [ ] Labels lisibles même petits
  - [ ] Légendes claires
- [ ] **Tests** :
  - [ ] Générer PDF et vérifier qualité
  - [ ] Test impression papier
- [ ] **Améliorations** :
  - [ ] Ajuster tailles fonts si nécessaire
  - [ ] Ajouter titre/date sur chaque page

**Fichiers à créer/modifier** :
- `src/pages/Dashboard.tsx` (export PDF)
- Tests

---

## F) 🏗️ Architecture / Tech Debt Potentielle

### F.1 Gestion Multi-tenancy (B2B) 🟡 MOYEN

**Problème actuel** :
- Si plusieurs organisations utilisent la plateforme, pas d'isolation stricte

**Action requise** :
- [ ] **Isolation par organisation** :
  - [ ] Ajouter `organization_id` dans toutes les tables critiques
  - [ ] RLS policies par organisation
  - [ ] Chaque organisateur ne voit que ses concours
- [ ] **Table `organizations`** :
  - [ ] `id`, `name`, `slug`, `settings` (JSONB)
- [ ] **Migration** :
  - [ ] Rétrocompatibilité : organisation par défaut pour données existantes
- [ ] Documenter dans OVERVIEW.md comme "fonctionnalité B2B prévue"

**Fichiers à créer/modifier** :
- Migration SQL majeure
- RLS policies mises à jour
- `docs/OVERVIEW.md`

---

### F.2 Soft Delete vs Hard Delete 🟡 MOYEN

**Action requise** :
- [ ] **Soft delete** :
  - [ ] Ajouter `deleted_at` dans toutes les tables principales
  - [ ] RLS policies : exclure `deleted_at IS NOT NULL`
  - [ ] Interface admin : "Voir les éléments supprimés"
- [ ] **RGPD** :
  - [ ] Anonymisation après X jours (soft delete)
  - [ ] Suppression définitive après Y jours
- [ ] **Archive concours** :
  - [ ] Soft delete pour conservation historique

**Fichiers à créer/modifier** :
- Migration SQL (ajout `deleted_at`)
- RLS policies
- Services de suppression

---

### F.3 Indexation DB - Performance ⚠️ IMPORTANT

**Problème actuel** :
- Search globale + filtres = risque de performance

**Action requise** :
- [ ] **Indexes GIN pour full-text** :
  - [ ] `contests` : name, description
  - [ ] `entries` : strain_name, terpene_profile
  - [ ] `profiles` : display_name, organization
- [ ] **Indexes composés** :
  - [ ] `entries(contest_id, status)`
  - [ ] `judge_scores(entry_id, judge_id)`
- [ ] **Indexes sur dates** :
  - [ ] `contests(start_date, end_date)`
- [ ] **Migration SQL** : Créer tous les indexes
- [ ] **Monitoring** : EXPLAIN ANALYZE sur requêtes critiques

**Fichiers à créer/modifier** :
- Migration SQL
- `docs/PERFORMANCE.md` (mise à jour)

---

### F.4 Cache vs Temps Réel ✅ TERMINÉ

**✅ Implémenté** :
- ✅ **Stratégie** :
  - ✅ Analytics : cache via React Query (30s-1min)
  - ✅ Classements live : subscriptions Supabase Realtime
  - ✅ Votes : temps réel via subscriptions
- ✅ **Subscriptions Supabase** :
  - ✅ Hook `useRealtimeResults` : écoute changements scores, votes, entrées
  - ✅ Hook `useRealtimeEntries` : écoute changements entrées et votes pour liste
  - ✅ Mise à jour automatique des classements sans refresh
  - ✅ Filtrage intelligent via Set des entryIds du concours
- ✅ **Revalidate ciblé** :
  - ✅ Invalidation ciblée des queries React Query après changements
  - ✅ Indicateur visuel "Mise à jour en temps réel activée"

**Fichiers créés/modifiés** :
- ✅ `src/hooks/use-realtime-results.ts` (nouveau)
- ✅ `src/pages/ContestResults.tsx` (intégration temps réel)
- ✅ `src/pages/Contests.tsx` (intégration temps réel)

---

### F.5 Stratégie Migrations 🟡 MOYEN

**Action requise** :
- [ ] **Convention de nommage** :
  - [ ] `YYYYMMDDHHMMSS_description.sql`
  - [ ] Documenter dans README
- [ ] **Rollback** :
  - [ ] Scripts de rollback pour migrations critiques
  - [ ] Tests de rollback avant production
- [ ] **Versioning** :
  - [ ] Numéro de version de schéma DB
  - [ ] Table `schema_migrations` pour tracking
- [ ] **Documentation** :
  - [ ] `docs/MIGRATIONS.md` avec guide

**Fichiers à créer/modifier** :
- `docs/MIGRATIONS.md` (nouveau)
- Scripts de rollback (si nécessaire)

---

### F.6 Backups & Restore ✅ TERMINÉ

**Problème actuel** :
- Critique pour concours officiels
- Pas de plan documenté

**✅ Implémenté** :
- ✅ **Plan de sauvegarde** :
  - ✅ Fréquence : quotidienne (automatique Supabase)
  - ✅ Rétention : 30 jours minimum (recommandé 90 jours)
  - ✅ Tests restore : mensuels (procédure documentée)
- ✅ **Documentation complète** :
  - ✅ Procédure de backup (Supabase auto et manuel)
  - ✅ Procédure de restore (Dashboard et CLI)
  - ✅ RTO (Recovery Time Objective) : 4 heures
  - ✅ RPO (Recovery Point Objective) : 24 heures
- ✅ **Section dans OVERVIEW.md** :
  - ✅ "Sauvegarde et continuité" ajoutée

**Fichiers créés/modifiés** :
- ✅ `docs/BACKUP_RESTORE.md` (nouveau - documentation complète)
- ✅ `docs/OVERVIEW.md` (section ajoutée)

---

## G) 💼 Roadmap / Business

### G.1 Pricing Non Validé 🟡 MOYEN

**Action requise** :
- [ ] **Études marché** :
  - [ ] Interviews organisateurs existants
  - [ ] Analyse concurrence
  - [ ] Pricing sensitivity
- [ ] **Validation** :
  - [ ] Tests avec 3-5 organisateurs pilotes
  - [ ] Ajuster selon feedback
- [ ] **Documenter** :
  - [ ] Mettre à jour OVERVIEW.md avec pricing "validé" ou "à valider"

**Fichiers à modifier** :
- `docs/OVERVIEW.md` (section Monétisation)
- `docs/MARKET_RESEARCH.md` (nouveau, optionnel)

---

### G.2 Plan GTM (Go-To-Market) 🟡 MOYEN

**Action requise** :
- [ ] **Stratégie** :
  - [ ] Ciblage : organisateurs de concours CBD en Europe
  - [ ] Acquisition : SEO, content marketing, partenariats
  - [ ] Pilotes : 3-5 concours beta gratuits
  - [ ] Partenaires : associations CBD, médias spécialisés
- [ ] **Documenter** :
  - [ ] `docs/GTM_STRATEGY.md` (nouveau)

**Fichiers à créer** :
- `docs/GTM_STRATEGY.md`

---

### G.3 Partenariats Labos COA 🟢 MINEUR

**Action requise** :
- [ ] **Intégration labos** :
  - [ ] Liste de laboratoires reconnus
  - [ ] Badge "Lab Certified" sur entrées validées par labos partenaires
- [ ] **Validation automatique** :
  - [ ] API labos pour vérifier COA directement
- [ ] **Documenter** : Section dans OVERVIEW.md (Roadmap)

---

### G.4 Marketplace Juges 🟢 MINEUR

**Action requise** :
- [ ] **Charte juges** :
  - [ ] Code de conduite
  - [ ] Critères de qualification
- [ ] **Profils vérifiés** :
  - [ ] Badge "Juge Certifié"
  - [ ] Historique d'évaluations
- [ ] **Système de notation** :
  - [ ] Producteurs peuvent noter les juges
- [ ] **Documenter** : Roadmap moyen terme

---

### G.5 Risques Marketing CBD 🟢 MINEUR

**Action requise** :
- [ ] **Stratégie com safe** :
  - [ ] Pas de publicité directe produits CBD
  - [ ] Focus : plateforme de concours, pas produits
  - [ ] Contenu éducatif plutôt que promotionnel
- [ ] **Documenter** : Section dans OVERVIEW.md

---

## H) 🎯 UX Avancée mais Utile

### H.1 Leaderboards en Temps Réel 🟡 MOYEN

**Action requise** :
- [ ] **Widgets live** :
  - [ ] Widget embeddable pour sites tiers
  - [ ] Mise à jour automatique (WebSocket ou polling)
- [ ] **Historique** :
  - [ ] "Évolution du classement" par jour
  - [ ] Graphique : position dans le temps
- [ ] **Documenter** : Section dans OVERVIEW.md

**Fichiers à créer/modifier** :
- `src/components/LeaderboardWidget.tsx`
- `docs/OVERVIEW.md`

---

### H.2 Badges Producteurs - Règles d'Attribution 🟡 MOYEN

**Problème actuel** :
- Badges implémentés mais pas de règles automatiques

**Action requise** :
- [ ] **Règles automatiques** :
  - [ ] "Or" : 1ère place concours
  - [ ] "Argent" : 2ème place
  - [ ] "Bronze" : 3ème place
  - [ ] "Choix du public" : meilleur score public
- [ ] **Interface** :
  - [ ] Option organisateur : "Attribuer badges automatiquement"
  - [ ] Ou attribution manuelle (actuel)
- [ ] **Documenter** : Section dans OVERVIEW.md

**Fichiers à créer/modifier** :
- Fonction automatique d'attribution
- `docs/OVERVIEW.md`

---

### H.3 Multi-langue (i18n) 🟡 MOYEN

**Action requise** :
- [ ] **Internationalisation** :
  - [ ] Bibliothèque : `react-i18next` ou `next-intl`
  - [ ] Langues : FR, EN, DE, ES (priorités Europe)
- [ ] **Traductions** :
  - [ ] Tous les textes UI
  - [ ] Messages d'erreur
  - [ ] Emails de notification
- [ ] **Sélection langue** :
  - [ ] Dropdown dans header
  - [ ] Préférence sauvegardée
- [ ] **Documenter** : Roadmap court terme

**Fichiers à créer/modifier** :
- Configuration i18n
- Fichiers de traduction
- `docs/OVERVIEW.md`

---

### H.4 Support/Helpdesk 🟡 MOYEN

**Action requise** :
- [ ] **FAQ** :
  - [ ] Page FAQ avec recherche
  - [ ] Questions fréquentes par rôle
- [ ] **Support ticket** :
  - [ ] Table `support_tickets`
  - [ ] Interface utilisateur : "Contacter le support"
  - [ ] Interface admin : gestion tickets
- [ ] **Documenter** : Section dans OVERVIEW.md

**Fichiers à créer/modifier** :
- `src/pages/FAQ.tsx`
- `src/pages/Support.tsx`
- Migration SQL
- `docs/OVERVIEW.md`

---

## 📊 Priorisation Recommandée

### 🔴 PRIORITÉ 1 - Critique (Sécurité & Conformité)
1. B.5 Mentions légales et disclaimers
2. B.1 THC limite paramétrable par pays
3. B.2 Règles validation COA
4. B.3 Audit trail
5. C.1 Anti-fraude vote public
6. C.3 Conflits d'intérêt juges
7. C.7 Protection routes front ET back
8. F.6 Backups & restore
9. D.7 Modération commentaires

### 🟠 PRIORITÉ 2 - Important (Cohérence & Fonctionnel)
1. A.1 Uniformiser critères jury (4 ou 5)
2. A.2 Clarifier calcul score global
3. D.11 Accessibilité - plan de test
4. E.1 Définir KPIs vérité source
5. F.3 Indexation DB performance
6. A.5 Statuts concours + transitions
7. A.3 Pondérations jury/public paramétrables

### 🟡 PRIORITÉ 3 - Moyen (Améliorations UX)
1. D.1 Onboarding par rôle
2. D.2 Rappels et deadlines
3. A.7 Emails déclenchement auto
4. H.1 Leaderboards temps réel
5. F.4 Cache vs temps réel
6. E.2 Analytics benchmarks

### 🟢 PRIORITÉ 4 - Mineur (Nice to have)
1. D.8 Favoris collection publique
2. D.10 Pagination flexible
3. H.3 Multi-langue
4. G.4 Marketplace juges

---

## 📝 Résumé des Fichiers à Créer/Modifier

### Nouveaux Fichiers à Créer
- Migrations SQL (environ 10-15 nouvelles migrations)
- Pages légales (4 pages)
- Composants UX (OnboardingWizard, DeadlineTracker, etc.)
- Documentation (ACCESSIBILITY.md, ANALYTICS.md, SECURITY.md, etc.)

### Fichiers à Modifier
- `docs/OVERVIEW.md` (ajouts multiples selon priorités)
- `src/pages/*` (améliorations UX)
- Schéma DB (ajouts colonnes, tables, triggers)

---

*Document créé le : 2024-11-29*  
*État : Roadmap complète d'amélioration*

