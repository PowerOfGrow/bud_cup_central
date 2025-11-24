# Configuration Resend API Key

## ⚠️ Important - Sécurité

**NE JAMAIS** mettre la clé API Resend dans les variables `VITE_*` car elles sont exposées au frontend et visibles par tous les utilisateurs.

La clé API Resend doit être configurée dans **Supabase Secrets** pour être utilisée par les Edge Functions côté serveur.

## Configuration

### Étape 1 : Ajouter le secret dans Supabase

Exécutez cette commande dans votre terminal (après `supabase login`) :

```bash
supabase secrets set RESEND_API_KEY=re_YtBwcfmi_8ZfqmncjbgPFYmZgvF1nyccV --project-ref hsrtfgpjmchsgunpynbg
```

### Étape 2 : Vérifier la configuration

```bash
supabase secrets list --project-ref hsrtfgpjmchsgunpynbg
```

Vous devriez voir `RESEND_API_KEY` dans la liste.

### Étape 3 : Déployer l'Edge Function

```bash
supabase functions deploy send-email --project-ref hsrtfgpjmchsgunpynbg
```

### Étape 4 : Tester l'envoi d'email

L'Edge Function `send-email` est maintenant prête à envoyer des emails via Resend.

## Utilisation

L'Edge Function vérifie automatiquement :
1. Si les emails sont activés pour l'utilisateur (`email_enabled`)
2. Si le type de notification spécifique est activé (ex: `email_contest_created`)

Les emails sont envoyés uniquement si les deux conditions sont remplies.

## Vérification du domaine (Recommandé)

Pour éviter que les emails soient marqués comme spam :
1. Allez sur https://resend.com/domains
2. Ajoutez et vérifiez votre domaine
3. Mettez à jour le `from` dans `supabase/functions/send-email/index.ts` :
   ```typescript
   from: "CBD Flower Cup <noreply@votre-domaine.com>",
   ```

## Notes

- La clé API est maintenant sécurisée dans Supabase Secrets
- Les Edge Functions peuvent y accéder via `Deno.env.get("RESEND_API_KEY")`
- Le frontend n'a jamais accès à cette clé

