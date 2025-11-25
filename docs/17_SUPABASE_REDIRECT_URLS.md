# Configuration des URLs de Redirection Supabase

## 🚨 Problème Rencontré

Lors de l'inscription, l'email de confirmation redirige vers `localhost:3000` au lieu de l'URL de production.

## 🔧 Solution

### 1. Configuration dans le Dashboard Supabase

1. Accédez au Dashboard Supabase : https://app.supabase.com/project/hsrtfgpjmchsgunpynbg
2. Allez dans **Settings** → **Authentication** → **URL Configuration**
3. Dans la section **Redirect URLs**, ajoutez les URLs suivantes :

#### URLs de Production
```
https://votre-domaine.vercel.app/**
https://votre-domaine.vercel.app/dashboard
https://votre-domaine.vercel.app/login
```

#### URLs de Développement (optionnel)
```
http://localhost:3000/**
http://localhost:3000/dashboard
http://localhost:3000/login
http://localhost:8080/**
http://localhost:8080/dashboard
http://localhost:8080/login
```

**⚠️ Important** : 
- Utilisez `**` à la fin pour autoriser toutes les sous-routes
- Ou spécifiez chaque route individuellement pour plus de sécurité
- Les URLs doivent correspondre exactement (protocole, domaine, port)

### 2. Site URL

Dans la même section, configurez le **Site URL** :

**Pour la production** :
```
https://votre-domaine.vercel.app
```

**Pour le développement** :
```
http://localhost:3000
```
ou
```
http://localhost:8080
```

### 3. Vérification de la Configuration

Après avoir configuré les URLs, testez :

1. Créez un nouveau compte depuis la production
2. Vérifiez que l'email de confirmation contient l'URL de production
3. Cliquez sur le lien dans l'email
4. Vous devriez être redirigé vers `https://votre-domaine.vercel.app/auth/callback` qui traitera le token et vous redirigera vers `/dashboard`

**Note** : L'application a maintenant une page dédiée `/auth/callback` qui gère correctement les tokens dans l'URL (#access_token, etc.)

## 📝 Note sur le Code

Le code dans `src/pages/Register.tsx` utilise `window.location.origin` qui s'adapte automatiquement à l'environnement :

```typescript
emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
```

Une nouvelle page `/auth/callback` a été créée pour gérer les callbacks d'authentification (confirmation d'email, réinitialisation de mot de passe, etc.). Cette page :
- Extrait les tokens de l'URL (#access_token, #refresh_token)
- Définit la session avec `supabase.auth.setSession()`
- Gère les erreurs éventuelles
- Redirige vers `/dashboard` après succès

Cela fonctionne correctement, mais Supabase doit avoir cette URL dans sa liste d'URLs autorisées.

## 🔍 Vérification Actuelle

Pour vérifier quelle URL est configurée actuellement, consultez :
- Dashboard Supabase → Settings → Authentication → URL Configuration

## 🚀 Actions Immédiates

1. **Ajoutez votre URL de production Vercel dans les Redirect URLs**
2. **Mettez à jour le Site URL pour pointer vers la production**
3. **Testez l'inscription depuis la production**

## 📚 Documentation Supabase

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)
- [URL Configuration Guide](https://supabase.com/docs/guides/auth/redirect-urls)

