# Guide : Créer les politiques Storage via le Dashboard Supabase

Si vous avez rencontré l'erreur `42501: must be owner of table objects`, c'est normal. Les politiques de storage doivent être créées via le Dashboard Supabase.

## Instructions étape par étape

### 1. Accéder aux politiques Storage

1. Connectez-vous à votre projet Supabase
2. Allez dans **Storage** (dans le menu de gauche)
3. Cliquez sur le bucket **`guides`**
4. Allez dans l'onglet **Policies**

### 2. Créer la politique INSERT (Upload)

Cette politique permet aux organisateurs d'uploader des guides.

1. Cliquez sur **"New Policy"**
2. Sélectionnez **"Create a policy from scratch"** (ou utilisez un template)
3. Configurez :
   - **Policy name** : `Organizers can upload guides in storage`
   - **Allowed operation** : `INSERT`
   - **Policy definition** : Utilisez **UNE** de ces options :

**Option A - Syntaxe simple (recommandée pour le Dashboard) :**
```
(bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')))
```

**Option B - Si l'Option A ne fonctionne pas, utilisez l'interface graphique :**
- Dans le champ "Policy definition", utilisez l'éditeur visuel si disponible
- Ou essayez cette version avec guillemets échappés :
```
bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'organizer'))
```

**Option C - Utilisez le template "Allow authenticated users to upload files" :**
- Sélectionnez le template
- Modifiez la condition pour vérifier le rôle organizer

4. Cliquez sur **"Review"** puis **"Save policy"**

### 3. Créer la politique UPDATE

Cette politique permet aux organisateurs de modifier des guides.

1. Cliquez sur **"New Policy"**
2. **Policy name** : `Organizers can update guides in storage`
3. **Allowed operation** : `UPDATE`
4. **Policy definition** : Utilisez la même syntaxe que pour INSERT :
   
```
(bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')))
```

5. Cliquez sur **"Save policy"**

### 4. Créer la politique DELETE

Cette politique permet aux organisateurs de supprimer des guides.

1. Cliquez sur **"New Policy"**
2. **Policy name** : `Organizers can delete guides in storage`
3. **Allowed operation** : `DELETE`
4. **Policy definition** : Utilisez la même syntaxe que pour INSERT :
   
```
(bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')))
```

5. Cliquez sur **"Save policy"**

## Important : Pas de politique SELECT

❌ **Ne créez PAS** de politique SELECT publique pour le bucket `guides`.

✅ **Pourquoi ?** Les téléchargements utilisent des **signed URLs** qui sont générées dynamiquement par l'application. Ces URLs sont :
- Temporaires (valides 1 heure)
- Sécurisées (signées cryptographiquement)
- Plus sûres qu'une politique SELECT publique

L'application génère automatiquement ces signed URLs via la fonction `getGuideDownloadUrl()` dans `src/hooks/use-guides.ts`.

## Vérification

Après avoir créé les 3 politiques, vous devriez pouvoir :

1. **Uploader un guide** : En tant qu'organisateur, allez dans Dashboard > Gérer les guides et essayez d'uploader un PDF
2. **Vérifier les politiques** : Dans Storage > guides > Policies, vous devriez voir vos 3 politiques (INSERT, UPDATE, DELETE)

## Si vous avez des erreurs

### Erreur lors de l'upload : "new row violates row-level security policy"

- Vérifiez que vous êtes bien connecté en tant qu'organisateur
- Vérifiez que la politique INSERT existe et est correcte
- Vérifiez que votre profil a bien le rôle `organizer` dans la table `profiles`

### Erreur : "Unable to generate download URL"

- C'est normal si le fichier n'existe pas encore
- Vérifiez que le guide est actif (`is_active = true`)
- Vérifiez les logs de la console pour plus de détails

## Résumé

✅ **À faire** :
1. Créer la table via `scripts/create_guides_table_fixed.sql` (déjà fait)
2. Créer les 3 politiques Storage (INSERT, UPDATE, DELETE) via le Dashboard

❌ **À ne PAS faire** :
- Créer une politique SELECT publique
- Exécuter les scripts SQL pour les politiques Storage (ils échoueront)

