# Configuration des Guides - Instructions complètes

Ce guide explique comment configurer le système de guides PDF par catégorie dans l'application.

## Vue d'ensemble

Le système permet aux organisateurs d'uploader et de gérer des guides PDF pour différentes catégories d'utilisateurs :
- **Guide Producteur** (`producer`)
- **Guide Juge** (`judge`)
- **Guide Utilisateur Gratuit** (`viewer`)
- **Guide Organisateur** (`organizer`)

Un seul guide actif par catégorie est autorisé. Quand un nouveau guide est activé, l'ancien est automatiquement désactivé.

## Architecture

- **Bucket Storage** : `guides` (privé, 10 MB max, PDF uniquement)
- **Table** : `public.guides`
- **Accès** : Utilisation de **signed URLs** pour les téléchargements (sécurisé)
- **Upload** : Organisateurs uniquement (via politiques RLS Storage)

## Installation

### Étape 1 : Créer la table guides

Exécutez le script `scripts/create_guides_table_fixed.sql` dans Supabase SQL Editor.

Ce script crée :
- Le bucket Storage `guides`
- La table `public.guides` avec toutes les colonnes, index et contraintes
- Les politiques RLS pour la table (lecture publique des guides actifs, gestion par les organisateurs)
- Les triggers pour `updated_at` et l'activation automatique

### Étape 2 : Configurer les politiques Storage (Optionnel mais recommandé)

**Option A : Exécuter le script SQL (si vous avez les permissions)**

Exécutez `scripts/create_guides_storage_policies_minimal.sql` dans Supabase SQL Editor.

Ce script crée uniquement les politiques nécessaires pour :
- **INSERT** : Permettre aux organisateurs d'uploader des fichiers
- **UPDATE** : Permettre aux organisateurs de modifier des fichiers
- **DELETE** : Permettre aux organisateurs de supprimer des fichiers

**Pas de politique SELECT publique** car les téléchargements utilisent des signed URLs.

**Option B : Créer les politiques via le Dashboard (si erreur de permissions)**

Si le script SQL échoue avec une erreur de permissions (`42501: must be owner`), créez les politiques manuellement :

1. Allez dans **Supabase Dashboard > Storage > guides > Policies**
2. Cliquez sur **"New Policy"** pour chaque opération :

#### Politique INSERT (Upload)

- **Name** : `Organizers can upload guides in storage`
- **Allowed operation** : `INSERT`
- **Policy definition** :
```sql
bucket_id = 'guides' 
AND (
  auth.role() = 'service_role' 
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'organizer'
  )
)
```

#### Politique UPDATE

- **Name** : `Organizers can update guides in storage`
- **Allowed operation** : `UPDATE`
- **Policy definition** : (même que INSERT)

#### Politique DELETE

- **Name** : `Organizers can delete guides in storage`
- **Allowed operation** : `DELETE`
- **Policy definition** : (même que INSERT)

**Important** : Ne créez **PAS** de politique SELECT publique. Les téléchargements utilisent des signed URLs générées dynamiquement.

### Étape 3 : Vérifier l'installation

1. Vérifiez que la table `guides` existe :
```sql
SELECT * FROM public.guides LIMIT 1;
```

2. Vérifiez que le bucket `guides` existe :
```sql
SELECT * FROM storage.buckets WHERE id = 'guides';
```

3. Testez l'upload via l'interface :
   - Connectez-vous en tant qu'organisateur
   - Allez dans Dashboard > Gérer les guides
   - Essayez d'uploader un guide PDF

## Utilisation dans l'application

### Pour les organisateurs

1. **Accéder à la gestion des guides** : Dashboard > Gérer les guides (`/manage-guides`)
2. **Uploader un guide** :
   - Sélectionner une catégorie
   - Ajouter un titre et une description (optionnel)
   - Sélectionner un fichier PDF (max 10 MB)
   - Cliquer sur "Uploader"
3. **Activer/Désactiver** : Un seul guide actif par catégorie
4. **Télécharger** : Pour prévisualiser ou télécharger un guide
5. **Supprimer** : Supprime le guide et le fichier associé

### Pour les utilisateurs

Les guides actifs sont accessibles via :
- **Page Contests** : Bouton "Télécharger le guide producteur" (si guide actif)
- **Hooks** : `useGuideByCategory('producer')` pour récupérer un guide par catégorie

Les téléchargements utilisent automatiquement des **signed URLs** (valides 1 heure) générées par `getGuideDownloadUrl()`.

## Fonctionnalités

### Contraintes

- **Un seul guide actif par catégorie** : Activé automatiquement via trigger
- **PDF uniquement** : Validé côté client et serveur (MIME type)
- **10 MB maximum** : Configuré au niveau du bucket

### Sécurité

- **Bucket privé** : Pas d'accès direct aux fichiers
- **Signed URLs** : URLs temporaires (1 heure) pour les téléchargements
- **RLS** : Politiques de sécurité au niveau de la table et du storage
- **Authentification** : Seuls les organisateurs peuvent gérer les guides

### Fallback

Si aucun guide actif n'est trouvé dans la base de données, l'application peut utiliser une URL externe (configurée dans le code) comme fallback.

## Résolution de problèmes

### Erreur : "relation public.guides does not exist"

**Solution** : Exécutez `scripts/create_guides_table_fixed.sql` dans Supabase SQL Editor.

### Erreur : "must be owner of table objects"

**Solution** : Créez les politiques Storage via le Dashboard Supabase (voir Option B ci-dessus).

### Erreur lors de l'upload : "new row violates row-level security policy"

**Solution** : 
1. Vérifiez que l'utilisateur est bien un organisateur
2. Vérifiez que les politiques RLS de la table `guides` existent
3. Vérifiez que les politiques Storage INSERT existent

### Erreur lors du téléchargement : "Unable to generate download URL"

**Solution** :
1. Vérifiez que le guide est actif (`is_active = true`)
2. Vérifiez que le fichier existe dans le bucket Storage
3. Vérifiez les logs de la console pour plus de détails

## Fichiers importants

- **Migration** : `supabase/migrations/20241204000017_create_guides_table.sql`
- **Hooks** : `src/hooks/use-guides.ts`
- **Page gestion** : `src/pages/ManageGuides.tsx`
- **Scripts SQL** : 
  - `scripts/create_guides_table_fixed.sql`
  - `scripts/create_guides_storage_policies_minimal.sql`

