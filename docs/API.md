# Documentation API - CBD Flower Cup

## Vue d'ensemble

L'application utilise **Supabase** comme backend, qui fournit :
- **PostgreSQL** : Base de données relationnelle
- **Row Level Security (RLS)** : Sécurité au niveau des lignes
- **Storage** : Stockage de fichiers (photos, documents)
- **Edge Functions** : Fonctions serverless
- **Realtime** : Mises à jour en temps réel (optionnel)

## Architecture

### Client Supabase

Le client Supabase est initialisé dans `src/integrations/supabase/client.ts` et utilise :
- **URL** : `VITE_SUPABASE_URL`
- **Clé anonyme** : `VITE_SUPABASE_PUBLISHABLE_KEY`

### Authentification

L'authentification est gérée par Supabase Auth :

```typescript
// Connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password"
});

// Inscription
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password",
  options: {
    data: {
      display_name: "John Doe",
      role: "producer"
    }
  }
});

// Déconnexion
await supabase.auth.signOut();
```

## Tables de base de données

### `profiles`

Profil utilisateur lié à `auth.users`.

**Colonnes principales** :
- `id` (uuid) : Référence à `auth.users.id`
- `display_name` (text) : Nom d'affichage
- `role` (enum) : `organizer` | `producer` | `judge` | `viewer`
- `organization` (text) : Organisation (optionnel)
- `avatar_url` (text) : URL de l'avatar
- `country` (text) : Pays
- `bio` (text) : Biographie
- `is_verified` (boolean) : Vérification du compte

**RLS** : Les utilisateurs peuvent lire tous les profils publics, modifier uniquement leur propre profil.

### `contests`

Concours organisés.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `slug` (text) : Slug URL unique
- `name` (text) : Nom du concours
- `description` (text) : Description
- `status` (enum) : `draft` | `registration` | `judging` | `completed` | `archived`
- `location` (text) : Lieu
- `start_date` (timestamptz) : Date de début
- `end_date` (timestamptz) : Date de fin
- `registration_close_date` (timestamptz) : Date limite d'inscription
- `prize_pool` (numeric) : Prix total
- `rules_url` (text) : URL du règlement
- `featured_image_url` (text) : Image mise en avant
- `created_by` (uuid) : Référence à `profiles.id`

**RLS** : Lecture publique, modification uniquement par les organisateurs.

### `entries`

Entrées soumises par les producteurs.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `contest_id` (uuid) : Référence à `contests.id`
- `producer_id` (uuid) : Référence à `profiles.id`
- `strain_name` (text) : Nom de la variété
- `cultivar` (text) : Cultivar
- `category` (enum) : `indica` | `sativa` | `hybrid` | `outdoor` | `hash` | `other`
- `thc_percent` (numeric) : Pourcentage THC
- `cbd_percent` (numeric) : Pourcentage CBD
- `terpene_profile` (text) : Profil terpénique
- `batch_code` (text) : Code de lot
- `coa_url` (text) : URL du certificat d'analyse
- `photo_url` (text) : URL de la photo
- `status` (enum) : `draft` | `submitted` | `under_review` | `approved` | `rejected` | `disqualified` | `archived`

**RLS** : Les producteurs peuvent créer/modifier leurs propres entrées (brouillons uniquement). Lecture publique des entrées approuvées.

### `judge_scores`

Scores attribués par les juges.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `entry_id` (uuid) : Référence à `entries.id`
- `judge_id` (uuid) : Référence à `profiles.id`
- `appearance_score` (numeric) : Score apparence (0-100)
- `density_score` (numeric) : Score densité (0-100)
- `terpene_score` (numeric) : Score terpènes (0-100)
- `taste_score` (numeric) : Score goût (0-100)
- `effect_score` (numeric) : Score effet (0-100)
- `overall_score` (numeric) : Score global (moyenne)
- `comments` (text) : Commentaires du juge

**RLS** : Les juges peuvent créer/modifier leurs propres scores. Lecture publique des scores.

### `public_votes`

Votes du public.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `entry_id` (uuid) : Référence à `entries.id`
- `user_id` (uuid) : Référence à `profiles.id`
- `rating` (integer) : Note (1-5)
- `comment` (text) : Commentaire (optionnel)

**RLS** : Un utilisateur peut voter une seule fois par entrée. Lecture publique des votes.

### `contest_judges`

Assignation des juges aux concours.

**Colonnes principales** :
- `id` (serial) : Identifiant unique
- `contest_id` (uuid) : Référence à `contests.id`
- `judge_id` (uuid) : Référence à `profiles.id`
- `invitation_status` (text) : `pending` | `accepted` | `declined`
- `judge_role` (text) : Rôle du juge

**RLS** : Seuls les organisateurs peuvent assigner des juges.

### `entry_documents`

Documents associés aux entrées.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `entry_id` (uuid) : Référence à `entries.id`
- `document_type` (enum) : `coa` | `photo` | `lab_report` | `marketing` | `other`
- `file_url` (text) : URL du fichier
- `file_name` (text) : Nom du fichier
- `file_size` (integer) : Taille en octets

**RLS** : Les producteurs peuvent gérer les documents de leurs entrées.

### `notifications`

Notifications in-app.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `user_id` (uuid) : Référence à `profiles.id`
- `type` (text) : Type de notification
- `title` (text) : Titre
- `message` (text) : Message
- `link` (text) : Lien vers la ressource
- `is_read` (boolean) : Lu/non lu
- `created_at` (timestamptz) : Date de création

**RLS** : Les utilisateurs peuvent lire/modifier uniquement leurs propres notifications.

### `favorites`

Favoris des utilisateurs.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `user_id` (uuid) : Référence à `profiles.id`
- `entry_id` (uuid) : Référence à `entries.id`
- `created_at` (timestamptz) : Date d'ajout

**RLS** : Les utilisateurs peuvent gérer uniquement leurs propres favoris.

### `entry_comments`

Commentaires sur les entrées.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `entry_id` (uuid) : Référence à `entries.id`
- `user_id` (uuid) : Référence à `profiles.id`
- `content` (text) : Contenu du commentaire
- `created_at` (timestamptz) : Date de création
- `updated_at` (timestamptz) : Date de mise à jour

**RLS** : Lecture publique, modification uniquement par l'auteur.

### `notification_preferences`

Préférences de notification.

**Colonnes principales** :
- `id` (uuid) : Identifiant unique
- `user_id` (uuid) : Référence à `profiles.id`
- `email_enabled` (boolean) : Notifications email activées
- `in_app_enabled` (boolean) : Notifications in-app activées
- `email_contest_created` (boolean) : Email nouveau concours
- `email_entry_approved` (boolean) : Email entrée approuvée
- `email_judge_assigned` (boolean) : Email assignation juge
- `email_results_published` (boolean) : Email résultats publiés
- `email_vote_received` (boolean) : Email vote reçu
- `email_score_received` (boolean) : Email score reçu

**RLS** : Les utilisateurs peuvent gérer uniquement leurs propres préférences.

## Storage (Supabase Storage)

### Buckets

- **`entry-photos`** (public) : Photos des entrées
- **`entry-documents`** (private) : Documents COA et autres fichiers

### Utilisation

```typescript
// Upload
const { data, error } = await supabase.storage
  .from('entry-photos')
  .upload(`${entryId}/${fileName}`, file);

// Récupération URL publique
const { data } = supabase.storage
  .from('entry-photos')
  .getPublicUrl(`${entryId}/${fileName}`);

// Suppression
await supabase.storage
  .from('entry-photos')
  .remove([`${entryId}/${fileName}`]);
```

## Edge Functions

### `send-email`

Envoie un email via Resend.

**Endpoint** : `POST /functions/v1/send-email`

**Body** :
```json
{
  "to": "user@example.com",
  "subject": "Sujet",
  "html": "<p>Contenu HTML</p>",
  "type": "contest_created"
}
```

## Exemples de requêtes

### Récupérer tous les concours actifs

```typescript
const { data, error } = await supabase
  .from('contests')
  .select('*')
  .eq('status', 'registration')
  .order('start_date', { ascending: false });
```

### Récupérer les entrées d'un concours

```typescript
const { data, error } = await supabase
  .from('entries')
  .select('*, profiles(*), contests(*)')
  .eq('contest_id', contestId)
  .eq('status', 'approved');
```

### Créer une entrée

```typescript
const { data, error } = await supabase
  .from('entries')
  .insert({
    contest_id: contestId,
    producer_id: userId,
    strain_name: "Emerald Velvet",
    category: "hybrid",
    status: "draft"
  })
  .select()
  .single();
```

### Voter pour une entrée

```typescript
const { data, error } = await supabase
  .from('public_votes')
  .upsert({
    entry_id: entryId,
    user_id: userId,
    rating: 5,
    comment: "Excellent produit !"
  });
```

## Sécurité (RLS)

Toutes les tables utilisent **Row Level Security (RLS)** pour garantir que :
- Les utilisateurs ne peuvent accéder qu'aux données autorisées
- Les modifications sont limitées aux propriétaires
- Les données publiques sont accessibles en lecture seule

Les politiques RLS sont définies dans les migrations SQL (`supabase/migrations/`).

## Références

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Edge Functions](https://supabase.com/docs/guides/functions)

