# Configuration des Notifications Email

## Vue d'ensemble

Le système de notifications email est maintenant en place avec :
- Table `notification_preferences` pour gérer les préférences par utilisateur
- Page Settings (`/settings`) pour configurer les préférences
- Edge Function Supabase (`send-email`) pour l'envoi d'emails

## Configuration requise

### 1. Service d'Email

Vous devez choisir un service d'email pour envoyer les emails. Options recommandées :

#### Option A : Resend (Recommandé)
- Site : https://resend.com
- Gratuit jusqu'à 100 emails/jour
- API simple et moderne

#### Option B : SendGrid
- Site : https://sendgrid.com
- Gratuit jusqu'à 100 emails/jour
- Service mature et fiable

#### Option C : SMTP personnalisé
- Configuration SMTP standard
- Nécessite un serveur SMTP

### 2. Configuration Resend (Exemple)

1. Créer un compte sur https://resend.com
2. Obtenir votre API Key
3. Ajouter le secret dans Supabase :
   ```bash
   supabase secrets set RESEND_API_KEY=re_YtBwcfmi_8ZfqmncjbgPFYmZgvF1nyccV --project-ref hsrtfgpjmchsgunpynbg
   ```
   ⚠️ **Important** : Ne mettez JAMAIS cette clé dans les variables `VITE_*` car elles sont exposées au frontend. Utilisez uniquement `supabase secrets set`.
4. Vérifier votre domaine (optionnel mais recommandé)
5. Mettre à jour le `from` dans `supabase/functions/send-email/index.ts` avec votre domaine vérifié

### 3. Déploiement de l'Edge Function

```bash
supabase functions deploy send-email
```

### 4. Mise à jour des triggers SQL

Les triggers SQL existants créent déjà les notifications in-app. Pour envoyer des emails également, vous devez appeler l'Edge Function depuis les triggers ou créer une fonction PostgreSQL qui appelle l'Edge Function.

**Option recommandée** : Créer une fonction PostgreSQL qui appelle l'Edge Function après la création d'une notification :

```sql
-- Fonction pour envoyer un email via l'Edge Function
create or replace function public.send_notification_email(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_email text;
  v_preferences jsonb;
begin
  -- Récupérer l'email de l'utilisateur
  select email into v_user_email
  from auth.users
  where id = p_user_id;

  -- Vérifier les préférences
  select row_to_json(np.*)::jsonb into v_preferences
  from public.notification_preferences np
  where np.user_id = p_user_id;

  -- Si les emails sont activés pour ce type, appeler l'Edge Function
  -- Note: L'appel HTTP depuis PostgreSQL nécessite l'extension http
  -- ou vous pouvez utiliser pg_net ou appeler depuis le frontend/backend
end;
$$;
```

**Alternative** : Appeler l'Edge Function depuis le frontend après la création d'une notification, ou utiliser un webhook.

## Utilisation

1. Les utilisateurs peuvent gérer leurs préférences sur `/settings`
2. Les préférences sont vérifiées avant l'envoi d'emails
3. Les emails sont envoyés uniquement si :
   - `email_enabled` est `true`
   - Le type de notification spécifique est activé

## Templates d'Email

Vous pouvez créer des templates HTML pour chaque type de notification dans l'Edge Function.

## Notes importantes

- L'Edge Function actuelle est une structure de base
- Vous devez configurer un service d'email réel (Resend, SendGrid, etc.)
- Les secrets doivent être configurés dans Supabase
- Le domaine d'envoi doit être vérifié pour éviter le spam

