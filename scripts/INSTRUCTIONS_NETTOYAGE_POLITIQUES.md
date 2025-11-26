# Nettoyage des politiques Storage dupliquées

## Méthode 1 : Via SQL Editor (à essayer en premier)

1. Ouvrez **Supabase SQL Editor**
2. Exécutez le script : `scripts/cleanup_duplicate_storage_policies.sql`
3. Si ça fonctionne, c'est terminé ! ✅

## Méthode 2 : Via Dashboard (si le SQL ne fonctionne pas)

Si le script SQL ne fonctionne pas, supprimez les doublons manuellement :

### Étape 1 : Accéder aux politiques

1. Allez dans **Supabase Dashboard > Storage > guides > Policies**

### Étape 2 : Supprimer les politiques dupliquées

Supprimez ces politiques (celles avec le suffixe `_1elw6bb_0`) :

1. **Organizers can delete guides in storage 1elw6bb_0**
   - Cliquez sur le menu (3 points) à droite
   - Sélectionnez "Delete"

2. **Organizers can update guides in storage 1elw6bb_0**
   - Cliquez sur le menu (3 points) à droite
   - Sélectionnez "Delete"

3. **Organizers can upload guides in storage 1elw6bb_0**
   - Cliquez sur le menu (3 points) à droite
   - Sélectionnez "Delete"

### Étape 3 : (Optionnel) Supprimer la politique SELECT

Si vous voulez utiliser uniquement des signed URLs (recommandé), supprimez aussi :

- **Public can view active guides in storage** (SELECT)
  - Cliquez sur le menu (3 points) à droite
  - Sélectionnez "Delete"

## Configuration finale attendue

Après nettoyage, vous devriez avoir uniquement ces 3 politiques :

✅ **INSERT** : `Organizers can upload guides in storage`
✅ **UPDATE** : `Organizers can update guides in storage`
✅ **DELETE** : `Organizers can delete guides in storage`

❌ **Pas de politique SELECT** (si vous utilisez uniquement des signed URLs)

## Vérification

Vérifiez que vous n'avez plus de doublons dans la liste des politiques.

