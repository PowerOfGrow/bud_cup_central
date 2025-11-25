# 📧 Système de Notifications Email

## Vue d'ensemble

Le système de notifications email de CBD Flower Cup permet d'envoyer des emails automatiques pour les événements critiques de l'application. Il s'intègre avec le système de notifications in-app et respecte les préférences utilisateur.

## Architecture

### Composants principaux

1. **Edge Function `send-email`** : Service Deno qui envoie les emails via Resend
2. **Base de données** : Suivi de l'état d'envoi dans la table `notifications`
3. **Vue SQL `notifications_pending_email`** : Identifie les notifications nécessitant un email
4. **Fonction RPC `trigger_notification_email()`** : Vérifie et prépare l'envoi d'email
5. **Préférences utilisateur** : Table `notification_preferences` pour contrôler les emails

## Types de notifications avec email

Les emails sont envoyés pour les types de notifications suivants :

1. **`judge_assigned`** : Un juge est assigné à un concours
2. **`entry_approved`** : Une entrée de producteur est approuvée
3. **`entry_rejected`** : Une entrée de producteur est rejetée
4. **`coa_rejected`** : Un COA (Certificat d'Analyse) est rejeté (cas spécial)

### Types supportés mais non automatiques

Ces types sont supportés par l'Edge Function mais ne déclenchent pas automatiquement d'email :

- `contest_created` : Nouveau concours créé
- `results_published` : Résultats publiés
- `vote_received` : Vote reçu
- `score_received` : Score reçu

## Fonctionnement

### Flux d'envoi automatique

1. **Création de notification** : Une notification est créée dans la table `notifications`
2. **Vue `notifications_pending_email`** : La vue identifie les notifications nécessitant un email
3. **Vérification des préférences** : L'Edge Function vérifie :
   - `email_enabled` : Les emails sont activés pour l'utilisateur
   - Préférence spécifique au type (ex: `email_judge_assigned`)
4. **Envoi via Resend** : Si autorisé, l'email est envoyé
5. **Marquage comme envoyé** : La notification est marquée avec `email_sent = true`

### Déclenchement manuel

L'envoi d'email peut aussi être déclenché manuellement depuis le frontend :

```typescript
// Exemple depuis ReviewEntries.tsx pour rejet de COA
const { error } = await supabase.functions.invoke("send-email", {
  body: {
    to: producerEmail,
    subject: subject,
    html: htmlTemplate,
    type: "coa_rejected",
    userId: producerId,
  },
});
```

## Configuration

### 1. Configuration de Resend

Voir `docs/RESEND_SETUP.md` pour les détails complets.

**Étapes principales** :
1. Créer un compte Resend et obtenir une clé API
2. Ajouter le secret dans Supabase :
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx --project-ref YOUR_PROJECT_REF
   ```
3. Déployer l'Edge Function :
   ```bash
   supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
   ```

### 2. Vérification du domaine

**Recommandé** : Vérifier votre domaine dans Resend pour éviter le spam :
1. Aller sur https://resend.com/domains
2. Ajouter et vérifier votre domaine
3. Mettre à jour l'adresse `from` dans `supabase/functions/send-email/index.ts` :
   ```typescript
   from: "CBD Flower Cup <noreply@votre-domaine.com>",
   ```

## Structure de la base de données

### Table `notifications`

Colonnes ajoutées pour le suivi des emails :

```sql
email_sent boolean default false        -- Email envoyé ?
email_sent_at timestamptz               -- Date d'envoi
email_error text                        -- Erreur si échec
```

### Vue `notifications_pending_email`

Vue qui liste les notifications nécessitant un email :

```sql
SELECT * FROM notifications_pending_email
WHERE email_sent = false
  AND type IN ('judge_assigned', 'entry_approved', 'entry_rejected')
  AND created_at > NOW() - INTERVAL '24 hours'
```

### Fonction `trigger_notification_email(p_notification_id uuid)`

Vérifie si une notification doit envoyer un email et retourne les informations nécessaires :

```sql
SELECT * FROM trigger_notification_email('notification-uuid');
-- Retourne JSON avec : success, should_send, email, type, title, message, link, user_id
```

## Préférences utilisateur

### Table `notification_preferences`

Les utilisateurs peuvent contrôler quels emails ils reçoivent :

- **`email_enabled`** : Activer/désactiver tous les emails (défaut: `true`)
- **`email_judge_assigned`** : Emails pour assignation de juge (défaut: `true`)
- **`email_entry_approved`** : Emails pour approbation/rejet d'entrée (défaut: `true`)
- **`email_contest_created`** : Emails pour nouveaux concours (défaut: `true`)
- **`email_results_published`** : Emails pour résultats publiés (défaut: `true`)

### Modification des préférences

Les utilisateurs peuvent modifier leurs préférences depuis la page Settings (à implémenter).

## Templates d'email

### Structure HTML standard

L'Edge Function utilise des templates HTML générés dynamiquement :

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; }
    .header { background-color: #4CAF50; color: white; }
    .content { padding: 30px 20px; }
    .button { background-color: #4CAF50; color: white; padding: 12px 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 CBD Flower Cup</h1>
    </div>
    <div class="content">
      <h2>{title}</h2>
      <p>{message}</p>
      <a href="{link}" class="button">Voir les détails</a>
    </div>
    <div class="footer">
      <p>Modifier vos préférences dans les paramètres</p>
    </div>
  </div>
</body>
</html>
```

### Exemple : Email de rejet de COA

Un template spécialisé est utilisé dans `ReviewEntries.tsx` pour les emails de rejet de COA, avec des instructions détaillées sur la soumission des certificats.

## Monitoring et statistiques

### Vue `notification_email_stats`

Statistiques d'envoi par jour et par type :

```sql
SELECT * FROM notification_email_stats
ORDER BY date DESC, type;
```

Retourne :
- `date` : Jour
- `type` : Type de notification
- `total` : Nombre total
- `sent` : Envoyés avec succès
- `pending` : En attente
- `errors` : Erreurs

## Dépannage

### Email non envoyé

1. **Vérifier les préférences** :
   ```sql
   SELECT * FROM notification_preferences WHERE user_id = 'user-uuid';
   ```

2. **Vérifier l'état de la notification** :
   ```sql
   SELECT id, type, email_sent, email_error FROM notifications WHERE id = 'notification-uuid';
   ```

3. **Vérifier la configuration Resend** :
   ```bash
   supabase secrets list --project-ref YOUR_PROJECT_REF
   ```

4. **Vérifier les logs de l'Edge Function** :
   - Aller dans Supabase Dashboard → Edge Functions → send-email → Logs

### Mode développement

Si `RESEND_API_KEY` n'est pas configuré, l'Edge Function log l'email dans la console sans l'envoyer :

```json
{
  "message": "Email service not configured. Email logged to console.",
  "email": { "to": "...", "subject": "..." }
}
```

## Sécurité

### ⚠️ Important

- **NE JAMAIS** mettre `RESEND_API_KEY` dans les variables `VITE_*` (visibles côté client)
- La clé doit être dans **Supabase Secrets** uniquement
- L'Edge Function utilise `SUPABASE_SERVICE_ROLE_KEY` pour accéder à `auth.users`

### Accès aux emails utilisateurs

L'Edge Function accède à `auth.users` via le service role pour récupérer les emails. C'est sécurisé car :
- L'Edge Function s'exécute côté serveur
- Seul le service role peut accéder à `auth.users`
- Les préférences utilisateur sont respectées

## Workflow recommandé

### Pour ajouter un nouveau type d'email

1. **Ajouter le type dans l'enum SQL** (si nouveau) :
   ```sql
   -- Déjà fait dans la migration initiale
   ```

2. **Mettre à jour la vue `notifications_pending_email`** :
   ```sql
   -- Ajouter le type dans la clause WHERE
   AND n.type IN (..., 'nouveau_type')
   ```

3. **Mettre à jour `trigger_notification_email()`** :
   ```sql
   -- Ajouter le cas dans le CASE statement
   when 'nouveau_type' then coalesce(np.email_nouveau_type, true)
   ```

4. **Mettre à jour l'Edge Function** :
   ```typescript
   // Ajouter dans emailTypeMap
   nouveau_type: "email_nouveau_type",
   ```

5. **Ajouter la préférence dans `notification_preferences`** :
   ```sql
   ALTER TABLE notification_preferences
   ADD COLUMN email_nouveau_type boolean default true;
   ```

## Références

- **Setup Resend** : `docs/RESEND_SETUP.md`
- **Edge Function** : `supabase/functions/send-email/index.ts`
- **Migration SQL** : `supabase/migrations/20241201000006_add_email_auto_trigger.sql`
- **Notifications SQL** : `supabase/migrations/20241126000000_create_notifications.sql`

## Prochaines améliorations

- [ ] Job/Worker automatique pour traiter `notifications_pending_email`
- [ ] Templates d'email personnalisables par organisateur
- [ ] Statistiques d'ouverture et de clic (via Resend)
- [ ] Queues d'envoi pour gérer les pics de charge
- [ ] Logs structurés pour debugging

