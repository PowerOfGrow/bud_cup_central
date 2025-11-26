# ⚠️ IMPORTANT : Comment créer les politiques Storage

## Le problème

Les scripts SQL **ne peuvent PAS** créer les politiques Storage via SQL Editor car elles nécessitent des permissions superuser. Même si le script s'exécute sans erreur, les politiques ne sont **PAS créées**.

## ✅ La solution : Utiliser l'interface graphique du Dashboard

### Étape 1 : Accéder à l'interface des politiques Storage

1. Allez dans votre projet **Supabase Dashboard**
2. Dans le menu de gauche, cliquez sur **"Storage"**
3. Cliquez sur le bucket **"guides"**
4. Cliquez sur l'onglet **"Policies"** (en haut de la page)

### Étape 2 : Créer la première politique (INSERT)

1. Cliquez sur le bouton **"New Policy"** (en haut à droite)
2. Vous avez deux options :
   
   **Option A - Utiliser un template (plus facile) :**
   - Sélectionnez **"Use a template"**
   - Choisissez un template comme **"Allow authenticated users to upload files"**
   - Modifiez le nom : `Organizers can upload guides in storage`
   - Modifiez la condition pour vérifier le rôle organizer
   
   **Option B - Créer depuis zéro :**
   - Sélectionnez **"Create a policy from scratch"**
   - **Policy name** : `Organizers can upload guides in storage`
   - **Allowed operation** : Sélectionnez **`INSERT`**
   - **Policy definition** : Utilisez l'**éditeur visuel** ou collez cette condition :
   
   ```
   bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer'))
   ```

3. Cliquez sur **"Save policy"** ou **"Review"** puis **"Save"**

### Étape 3 : Créer la deuxième politique (UPDATE)

1. Cliquez à nouveau sur **"New Policy"**
2. **Policy name** : `Organizers can update guides in storage`
3. **Allowed operation** : **`UPDATE`**
4. **Policy definition** : Même condition que pour INSERT
5. Cliquez sur **"Save policy"**

### Étape 4 : Créer la troisième politique (DELETE)

1. Cliquez à nouveau sur **"New Policy"**
2. **Policy name** : `Organizers can delete guides in storage`
3. **Allowed operation** : **`DELETE`**
4. **Policy definition** : Même condition que pour INSERT
5. Cliquez sur **"Save policy"**

## ✅ Vérification

Après avoir créé les 3 politiques, vous devriez voir dans la liste :

- ✅ `Organizers can upload guides in storage` (INSERT)
- ✅ `Organizers can update guides in storage` (UPDATE)
- ✅ `Organizers can delete guides in storage` (DELETE)

## 🧪 Test

1. Connectez-vous en tant qu'**organisateur** dans votre application
2. Allez dans **Dashboard > Gérer les guides**
3. Essayez d'uploader un guide PDF

Si l'upload fonctionne, c'est que les politiques sont correctement configurées ! 🎉

## ❌ À ne PAS faire

- ❌ Ne créez **PAS** de politique SELECT (on utilise des signed URLs)
- ❌ N'essayez **PAS** de créer les politiques via SQL Editor (ça ne fonctionnera pas)

## 📝 Note

Les scripts SQL dans `create_guides_storage_policies_minimal.sql` sont fournis uniquement pour référence - ils montrent la syntaxe mais ne peuvent pas être exécutés directement.

