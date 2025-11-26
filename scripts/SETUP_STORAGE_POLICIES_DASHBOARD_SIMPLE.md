# Guide Simple : Politiques Storage via Dashboard (Syntaxe corrigée)

Si vous avez l'erreur `syntax error at or near "bucket_id"`, c'est que le Dashboard Supabase a besoin d'une syntaxe spécifique.

## Solution rapide : Syntaxe pour le Dashboard

### Étape 1 : Accéder aux politiques

1. Supabase Dashboard > **Storage** > **guides** > **Policies**

### Étape 2 : Créer les 3 politiques

Pour **chaque politique**, copiez-collez cette syntaxe EXACTE dans le champ "Policy definition" :

#### Politique INSERT (Upload)

- **Policy name** : `Organizers can upload guides in storage`
- **Operation** : `INSERT`
- **Policy definition** (copiez TOUT sur une seule ligne) :
```
(bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')))
```

#### Politique UPDATE

- **Policy name** : `Organizers can update guides in storage`
- **Operation** : `UPDATE`
- **Policy definition** (même syntaxe) :
```
(bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')))
```

#### Politique DELETE

- **Policy name** : `Organizers can delete guides in storage`
- **Operation** : `DELETE`
- **Policy definition** (même syntaxe) :
```
(bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer')))
```

## Différences importantes

✅ **Utilisez** :
- Des parenthèses autour de toute l'expression
- `SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'organizer'` (sans alias `p`)
- Tout sur une seule ligne ou avec des retours à la ligne simples

❌ **Évitez** :
- Les alias de table (`p`) qui peuvent causer des problèmes
- Les retours à la ligne multiples
- Les espaces supplémentaires

## Alternative : Utiliser l'éditeur visuel

Si la syntaxe SQL ne fonctionne toujours pas :

1. Cliquez sur **"New Policy"**
2. Sélectionnez **"Use the visual editor"** (si disponible)
3. Ou utilisez un **template** :
   - Sélectionnez "Allow authenticated users to upload files"
   - Puis modifiez la condition pour vérifier `role = 'organizer'`

## Vérification

Après avoir créé les 3 politiques, vous devriez voir :
- ✅ INSERT : `Organizers can upload guides in storage`
- ✅ UPDATE : `Organizers can update guides in storage`
- ✅ DELETE : `Organizers can delete guides in storage`

## Test

1. Connectez-vous en tant qu'**organisateur**
2. Allez dans **Dashboard > Gérer les guides**
3. Essayez d'uploader un guide PDF

Si ça fonctionne, c'est bon ! 🎉

