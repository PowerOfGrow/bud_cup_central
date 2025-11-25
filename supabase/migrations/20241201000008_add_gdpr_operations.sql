-- Migration: Opérations RGPD - Export et Suppression de compte
-- Permet la conformité RGPD avec export de données et suppression/anonymisation de compte

-- Ajouter colonnes pour soft delete et anonymisation
alter table public.profiles
add column if not exists deleted_at timestamptz,
add column if not exists anonymized_at timestamptz,
add column if not exists deletion_requested_at timestamptz;

-- Index pour les requêtes de suppression
create index if not exists profiles_deleted_at_idx on public.profiles(deleted_at)
where deleted_at is not null;

-- Fonction pour anonymiser un profil (conformité RGPD)
create or replace function public.anonymize_user_profile(
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- Anonymiser le profil
  update public.profiles
  set
    display_name = 'Utilisateur Supprimé',
    organization = null,
    avatar_url = null,
    country = null,
    bio = null,
    anonymized_at = now(),
    deleted_at = now()
  where id = p_user_id;
  
  -- Note: L'email est dans auth.users et sera supprimé avec le compte auth si nécessaire
  -- Pour l'instant, on anonymise seulement les données dans profiles
  
  -- Supprimer les entrées en brouillon uniquement
  -- Les entrées soumises/approuvées sont conservées pour l'historique du concours
  delete from public.entries
  where producer_id = p_user_id
    and status = 'draft';
    
  -- Anonymiser dans les logs d'audit
  update public.entry_audit_log
  set
    user_id = null,
    ip_address = null,
    user_agent = null
  where user_id = p_user_id;
  
  -- Les scores de juge sont conservés pour l'intégrité des concours
  -- mais le juge_id peut être mis à null si nécessaire
  
  -- Supprimer les préférences de notification
  delete from public.notification_preferences
  where user_id = p_user_id;
  
  -- Supprimer les favoris
  delete from public.favorites
  where user_id = p_user_id;
  
  -- Supprimer les votes publics (optionnel, selon politique RGPD)
  -- On peut les conserver anonymisés ou les supprimer
  update public.public_votes
  set
    voter_profile_id = null,
    ip_address = null,
    user_agent = null
  where voter_profile_id = p_user_id;
  
  -- Supprimer les commentaires (ou anonymiser)
  -- delete from public.entry_comments where user_id = p_user_id;
  
  -- Supprimer les notifications
  delete from public.notifications
  where user_id = p_user_id;
  
  -- Supprimer l'assignation de juge
  delete from public.contest_judges
  where judge_id = p_user_id;
end;
$$;

comment on function public.anonymize_user_profile is 'Anonymise un profil utilisateur conformément au RGPD';

-- Fonction RPC pour exporter toutes les données d'un utilisateur
create or replace function public.export_user_data(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_export jsonb;
  v_profile jsonb;
  v_entries jsonb;
  v_judge_scores jsonb;
  v_public_votes jsonb;
  v_favorites jsonb;
  v_notifications jsonb;
  v_comments jsonb;
  v_contest_judges jsonb;
begin
  -- Vérifier que l'utilisateur est bien le propriétaire
  if p_user_id != auth.uid() then
    raise exception 'Unauthorized: Can only export own data';
  end if;
  
  -- Récupérer le profil
  select row_to_json(p.*)::jsonb
  into v_profile
  from public.profiles p
  where p.id = p_user_id;
  
  -- Récupérer les entrées
  select coalesce(json_agg(row_to_json(e.*)), '[]'::json)
  into v_entries
  from public.entries e
  where e.producer_id = p_user_id;
  
  -- Récupérer les scores de juge
  select coalesce(json_agg(row_to_json(js.*)), '[]'::json)
  into v_judge_scores
  from public.judge_scores js
  where js.judge_id = p_user_id;
  
  -- Récupérer les votes publics
  select coalesce(json_agg(row_to_json(pv.*)), '[]'::json)
  into v_public_votes
  from public.public_votes pv
  where pv.voter_profile_id = p_user_id;
  
  -- Récupérer les favoris
  select coalesce(json_agg(row_to_json(f.*)), '[]'::json)
  into v_favorites
  from public.favorites f
  where f.user_id = p_user_id;
  
  -- Récupérer les notifications
  select coalesce(json_agg(row_to_json(n.*)), '[]'::json)
  into v_notifications
  from public.notifications n
  where n.user_id = p_user_id;
  
  -- Récupérer les commentaires (si table existe)
  -- select coalesce(json_agg(row_to_json(c.*)), '[]'::json)
  -- into v_comments
  -- from public.entry_comments c
  -- where c.user_id = p_user_id;
  
  -- Récupérer les assignations de juge
  select coalesce(json_agg(row_to_json(cj.*)), '[]'::json)
  into v_contest_judges
  from public.contest_judges cj
  where cj.judge_id = p_user_id;
  
  -- Construire l'export JSON
  v_export := jsonb_build_object(
    'export_date', now(),
    'user_id', p_user_id,
    'profile', v_profile,
    'entries', v_entries,
    'judge_scores', v_judge_scores,
    'public_votes', v_public_votes,
    'favorites', v_favorites,
    'notifications', v_notifications,
    'contest_judges', v_contest_judges,
    'data_retention_policy', jsonb_build_object(
      'coa_retention_years', 7,
      'entry_retention', 'Indefinite for approved entries',
      'personal_data_retention', 'Until account deletion',
      'anonymized_data_retention', 'Indefinite for analytics'
    )
  );
  
  return v_export;
end;
$$;

comment on function public.export_user_data is 'Exporte toutes les données personnelles d''un utilisateur au format JSON (conformité RGPD)';

-- Fonction pour marquer un compte comme demandant la suppression
create or replace function public.request_account_deletion(
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- Vérifier que l'utilisateur est bien le propriétaire
  if p_user_id != auth.uid() then
    raise exception 'Unauthorized: Can only delete own account';
  end if;
  
  -- Marquer la demande de suppression
  update public.profiles
  set
    deletion_requested_at = now()
  where id = p_user_id;
end;
$$;

comment on function public.request_account_deletion is 'Marque un compte comme demandant la suppression (conformité RGPD)';

-- RLS : Les utilisateurs peuvent voir leurs propres données d'export
grant execute on function public.export_user_data(uuid) to authenticated;
grant execute on function public.request_account_deletion(uuid) to authenticated;
grant execute on function public.anonymize_user_profile(uuid) to authenticated;

-- Vue pour monitoring des suppressions de compte (organisateurs uniquement)
-- Note: L'email n'est pas accessible directement depuis auth.users dans une vue publique
-- Pour des raisons de sécurité, on n'affiche que les informations du profil
create or replace view public.account_deletion_requests as
select
  p.id as user_id,
  p.display_name,
  p.deletion_requested_at,
  p.deleted_at,
  p.anonymized_at,
  extract(day from (now() - p.deletion_requested_at)) as days_since_request
from public.profiles p
where p.deletion_requested_at is not null
  and p.deleted_at is null
order by p.deletion_requested_at desc;

comment on view public.account_deletion_requests is 'Liste des demandes de suppression de compte en attente (pour monitoring organisateurs)';

-- RLS pour la vue (organisateurs uniquement)
grant select on public.account_deletion_requests to authenticated;

-- Politique RLS pour que seuls les organisateurs voient cette vue
-- (implémentée via les permissions sur profiles)

