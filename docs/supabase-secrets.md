# Configuration des secrets Supabase

## Secrets pour les Edge Functions

Les fonctions Edge Supabase (`viewer-dashboard`, `producer-dashboard`, `judge-dashboard`) nécessitent deux secrets configurés dans votre projet Supabase.

### Configuration requise

#### Option 1 : Script PowerShell automatique (recommandé)

```powershell
# Avec la clé service role
.\scripts\supabase-setup.ps1 -AccessToken "sbp_..." -ServiceRoleKey "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ou sans la clé (vous devrez la configurer manuellement après)
.\scripts\supabase-setup.ps1 -AccessToken "sbp_..."
```

#### Option 2 : Configuration manuelle

Exécutez ces commandes dans votre terminal (après `supabase login`) :

```bash
# URL de votre projet Supabase
supabase secrets set SUPABASE_URL=https://hsrtfgpjmchsgunpynbg.supabase.co --project-ref hsrtfgpjmchsgunpynbg

# Clé service role (trouvable dans Supabase Dashboard → Settings → API → service_role key)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<votre-service-role-key> --project-ref hsrtfgpjmchsgunpynbg
```

### Où trouver la Service Role Key

1. Allez sur https://supabase.com/dashboard/project/hsrtfgpjmchsgunpynbg/settings/api
2. Dans la section "Project API keys"
3. Copiez la clé **service_role** (⚠️ gardez-la secrète, elle a tous les droits)

### Vérification

Pour vérifier que les secrets sont bien configurés :

```bash
supabase secrets list --project-ref hsrtfgpjmchsgunpynbg
```

Vous devriez voir :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Variables Frontend (Vercel)

Ces variables sont différentes et sont configurées sur Vercel (voir `docs/vercel-env-vars.md`) :

- `VITE_SUPABASE_URL` → `https://hsrtfgpjmchsgunpynbg.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` → Clé **anon** (publique, pas la service_role)

### Configuration Resend pour les emails

Pour activer l'envoi d'emails via l'Edge Function `send-email`, ajoutez votre clé API Resend :

```bash
supabase secrets set RESEND_API_KEY=re_YtBwcfmi_8ZfqmncjbgPFYmZgvF1nyccV --project-ref hsrtfgpjmchsgunpynbg
```

⚠️ **Important** : Ne mettez JAMAIS la clé API Resend dans les variables `VITE_*` car elles sont exposées au frontend. Utilisez uniquement `supabase secrets set` pour les Edge Functions.

## Résumé

| Variable | Où | Usage | Type de clé |
|----------|-----|-------|-------------|
| `SUPABASE_URL` | Supabase Secrets | Edge Functions | URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | Edge Functions | Service Role Key |
| `RESEND_API_KEY` | Supabase Secrets | Edge Function send-email | Resend API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets | Edge Functions | Service Role (privée) |
| `VITE_SUPABASE_URL` | Vercel | Frontend React | URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel | Frontend React | Anon Key (publique) |

