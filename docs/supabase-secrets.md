# Configuration des secrets Supabase

## Secrets pour les Edge Functions

L'Edge Function `send-email` nécessite des secrets configurés dans votre projet Supabase.

### Configuration requise

### Configuration manuelle

Exécutez ces commandes dans votre terminal (après `supabase login`) :

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
| `RESEND_API_KEY` | Supabase Secrets | Edge Function send-email | Resend API Key |
| `VITE_SUPABASE_URL` | Vercel | Frontend React | URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel | Frontend React | Anon Key (publique) |

