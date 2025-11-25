# Suppression de tous les certificats COA

Ce dossier contient les scripts pour supprimer **TOUS** les certificats COA de la base de données.

## ⚠️ ATTENTION

**Cette opération est IRRÉVERSIBLE !** Assurez-vous d'avoir fait une sauvegarde avant de l'exécuter.

## 📋 Ce que font les scripts

1. ✅ Supprime toutes les références `coa_url` dans la table `entries`
2. ✅ Réinitialise toutes les validations COA
3. ✅ Supprime tous les logs de téléchargement COA
4. ✅ Log toutes les suppressions dans l'audit trail
5. ⚠️ **N'INCLUT PAS** la suppression des fichiers physiques dans le storage Supabase

## 🚀 Méthode 1 : Utiliser la fonction SQL (Recommandé)

### Étape 1 : Appliquer la migration

La migration crée deux fonctions :
- `delete_all_coa_certificates()` : Supprime tous les COA
- `list_all_coa_file_paths()` : Liste les fichiers pour suppression manuelle

```bash
# La migration sera appliquée automatiquement via Supabase CLI
# Ou copiez-collez le contenu de:
# supabase/migrations/20241203000001_delete_all_coa_certificates.sql
# dans le SQL Editor de Supabase Dashboard
```

### Étape 2 : Exécuter la fonction

Dans le **Supabase Dashboard > SQL Editor**, exécutez :

```sql
SELECT public.delete_all_coa_certificates();
```

Cette fonction retourne un JSON avec les statistiques :
```json
{
  "entries_updated": 42,
  "download_logs_deleted": 15,
  "file_paths_count": 42,
  "timestamp": "2024-12-03T10:30:00Z",
  "message": "Suppression réussie: 42 entrées mises à jour, 15 logs supprimés"
}
```

### Étape 3 : Lister les fichiers à supprimer du storage

Pour obtenir la liste des fichiers à supprimer manuellement du storage :

```sql
SELECT * FROM public.list_all_coa_file_paths();
```

## 🚀 Méthode 2 : Script SQL direct

Vous pouvez utiliser le script `delete_all_coa.sql` :

1. Ouvrez le **Supabase Dashboard > SQL Editor**
2. Copiez-collez le contenu de `scripts/delete_all_coa.sql`
3. Exécutez le script

⚠️ **Note** : Décommentez la section "Option 2" si vous préférez une suppression directe au lieu d'utiliser la fonction.

## 📁 Suppression des fichiers du storage

Les fichiers physiques dans le bucket `entry-documents` doivent être supprimés séparément.

### Option A : Via Supabase Dashboard

1. Allez dans **Storage > entry-documents**
2. Sélectionnez tous les fichiers COA
3. Cliquez sur "Delete"

### Option B : Via l'API Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Lister tous les fichiers dans le bucket
const { data: files } = await supabase.storage
  .from('entry-documents')
  .list('', {
    limit: 1000,
    offset: 0,
  });

// Supprimer tous les fichiers
const filePaths = files.map(f => f.name);
await supabase.storage
  .from('entry-documents')
  .remove(filePaths);
```

### Option C : Via l'interface de ligne de commande

```bash
# Utiliser Supabase CLI (si configuré)
supabase storage list entry-documents
# Puis supprimer manuellement ou via script
```

## ✅ Vérification après suppression

Vérifiez que tous les COA ont bien été supprimés :

```sql
-- Compter les entrées avec COA restantes (devrait être 0)
SELECT count(*) 
FROM public.entries 
WHERE coa_url IS NOT NULL;

-- Vérifier les logs d'audit
SELECT count(*) 
FROM public.entry_audit_log 
WHERE action = 'coa_deleted' 
  AND reason = 'COA supprimé en masse par administrateur';
```

## 🔐 Permissions requises

- Seuls les utilisateurs avec le rôle `organizer` peuvent exécuter ces fonctions
- L'utilisateur doit être authentifié dans Supabase

## 📝 Notes importantes

1. **Sauvegarde** : Faites toujours une sauvegarde avant d'exécuter ces scripts
2. **Tests** : Testez d'abord sur un environnement de développement
3. **Storage** : N'oubliez pas de supprimer les fichiers physiques après la suppression en base
4. **Audit Trail** : Toutes les suppressions sont loggées dans `entry_audit_log`

## 🆘 En cas de problème

Si quelque chose ne va pas :

1. Vérifiez les logs dans `entry_audit_log`
2. Consultez les logs Supabase
3. Restaurez depuis une sauvegarde si nécessaire

