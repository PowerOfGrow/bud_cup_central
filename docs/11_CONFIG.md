# ⚙️ Configuration - Variables d'Environnement et Secrets

Ce document regroupe toute la configuration nécessaire pour l'application CBD Flower Cup : variables d'environnement Vercel, secrets Supabase, et configuration Resend.

---

## 🔐 Variables d'Environnement Vercel

### Variables requises

Sur Vercel, créez les variables suivantes **exactement avec ces noms** (en majuscules avec le préfixe `VITE_`) :

1. **`VITE_SUPABASE_URL`**
   - Valeur : `https://hsrtfgpjmchsgunpynbg.supabase.co`
   - Scope : All Environments

2. **`VITE_SUPABASE_PUBLISHABLE_KEY`**
   - Valeur : Votre clé anonyme Supabase (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - Scope : All Environments
   - ⚠️ **Utilisez la clé `anon`, pas la `service_role`**

3. **`VITE_VIEWER_PROFILE_ID`** (optionnel)
   - Valeur : `f7777777-7777-7777-7777-777777777777`
   - Scope : All Environments

4. **`VITE_PRODUCER_PROFILE_ID`** (optionnel)
   - Valeur : `b2222222-2222-2222-2222-222222222222`
   - Scope : All Environments

5. **`VITE_JUDGE_PROFILE_ID`** (optionnel)
   - Valeur : `d4444444-4444-4444-4444-444444444444`
   - Scope : All Environments

### Configuration

1. Allez dans **Vercel Dashboard → Settings → Environment Variables**
2. Créez les variables ci-dessus en majuscules avec le préfixe `VITE_`
3. Vite ne charge automatiquement que les variables qui commencent par `VITE_`
4. Redéployez l'application après modification

### Notes importantes

- Les noms doivent être **en majuscules avec le préfixe `VITE_`**
- `vercel.json` n'a plus besoin de la section `env` - Vercel utilise directement les variables d'environnement
- Supprimez les anciennes variables en minuscules si elles existent

---

## 🔒 Secrets Supabase (Edge Functions)

### Configuration requise

Les Edge Functions utilisent des secrets configurés dans Supabase, **pas dans Vercel**.

### Résumé des secrets

| Variable | Où | Usage | Type de clé |
|----------|-----|-------|-------------|
| `RESEND_API_KEY` | Supabase Secrets | Edge Function send-email | Resend API Key |
| `SUPABASE_URL` | Supabase Secrets | Edge Functions internes | URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | Edge Functions internes | Service Role Key |

### Configuration manuelle

1. Connectez-vous à Supabase CLI :
   ```bash
   supabase login
   ```

2. Liez votre projet :
   ```bash
   supabase link --project-ref hsrtfgpjmchsgunpynbg
   ```

3. Configurez les secrets :
   ```bash
   supabase secrets set RESEND_API_KEY=<votre-clé-resend> --project-ref hsrtfgpjmchsgunpynbg
   supabase secrets set SUPABASE_URL=https://hsrtfgpjmchsgunpynbg.supabase.co --project-ref hsrtfgpjmchsgunpynbg
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<votre-service-role-key> --project-ref hsrtfgpjmchsgunpynbg
   ```

4. Vérifiez la configuration :
   ```bash
   supabase secrets list --project-ref hsrtfgpjmchsgunpynbg
   ```

---

## 📧 Configuration Resend pour les Emails

### ⚠️ Important - Sécurité

**NE JAMAIS** mettre la clé API Resend dans les variables `VITE_*` car elles sont exposées au frontend et visibles par tous les utilisateurs.

La clé API Resend doit être configurée dans **Supabase Secrets** pour être utilisée par les Edge Functions côté serveur.

### Étape 1 : Obtenir la clé API Resend

1. Allez sur https://resend.com/api-keys
2. Créez une nouvelle clé API
3. Copiez la clé (format : `re_...`)

### Étape 2 : Configurer dans Supabase

```bash
supabase secrets set RESEND_API_KEY=<votre-clé-resend> --project-ref hsrtfgpjmchsgunpynbg
```

### Étape 3 : Vérifier la configuration

```bash
supabase secrets list --project-ref hsrtfgpjmchsgunpynbg
```

Vous devriez voir `RESEND_API_KEY` dans la liste.

### Étape 4 : Déployer l'Edge Function

```bash
supabase functions deploy send-email --project-ref hsrtfgpjmchsgunpynbg
```

### Vérification du domaine (Recommandé)

Pour éviter que les emails soient marqués comme spam :

1. Allez sur https://resend.com/domains
2. Ajoutez et vérifiez votre domaine
3. Mettez à jour le `from` dans `supabase/functions/send-email/index.ts` :
   ```typescript
   from: "CBD Flower Cup <noreply@votre-domaine.com>",
   ```

---

## 🔄 Différence entre Vercel et Supabase

### Variables Frontend (Vercel)

- **Usage** : Accessibles depuis le frontend React
- **Préfixe** : `VITE_`
- **Sécurité** : ⚠️ **Publiques** - visibles par tous les utilisateurs
- **Exemples** :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Secrets Backend (Supabase)

- **Usage** : Accessibles uniquement par les Edge Functions
- **Configuration** : `supabase secrets set`
- **Sécurité** : ✅ **Privés** - jamais exposés au frontend
- **Exemples** :
  - `RESEND_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 📝 Résumé de Configuration

### Frontend (Vercel Environment Variables)
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` (clé `anon`)
- ⚪ `VITE_VIEWER_PROFILE_ID` (optionnel)
- ⚪ `VITE_PRODUCER_PROFILE_ID` (optionnel)
- ⚪ `VITE_JUDGE_PROFILE_ID` (optionnel)

### Backend (Supabase Secrets)
- ✅ `RESEND_API_KEY` (pour Edge Function send-email)
- ✅ `SUPABASE_URL` (pour Edge Functions internes)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (pour Edge Functions internes)

---

## ✅ Vérification

### Vérifier Vercel

1. Vercel Dashboard → Settings → Environment Variables
2. Vérifiez que toutes les variables `VITE_*` existent
3. Redéployez si nécessaire

### Vérifier Supabase

```bash
supabase secrets list --project-ref hsrtfgpjmchsgunpynbg
```

Vous devriez voir tous les secrets listés ci-dessus.

---

## 🔗 Références

- **Documentation Resend** : https://resend.com/docs
- **Documentation Supabase Secrets** : https://supabase.com/docs/guides/functions/secrets
- **Edge Function send-email** : `supabase/functions/send-email/index.ts`

