-- Script de VÉRIFICATION et CORRECTION pour get_pending_comments_for_organizer
-- Copiez-collez dans Supabase SQL Editor

-- ÉTAPE 1: Vérifier si la fonction existe
select 
  'Fonction existe: ' || proname || '(' || pg_get_function_arguments(oid) || ')' as status
from pg_proc
where proname = 'get_pending_comments_for_organizer'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');

-- Si rien ne s'affiche ci-dessus, la fonction n'existe pas. Procédez à l'ÉTAPE 2.

-- ÉTAPE 2: Supprimer complètement la fonction (si elle existe)
drop function if exists public.get_pending_comments_for_organizer(text);
drop function if exists public.get_pending_comments_for_organizer();

-- ÉTAPE 3: Recréer la fonction complète
create function public.get_pending_comments_for_organizer(
  p_status_filter text default 'pending'
)
returns table (
  id uuid,
  entry_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  spam_score numeric,
  flagged_as_spam boolean,
  status text,
  entry_name text,
  contest_id uuid,
  contest_name text,
  user_name text,
  user_organization text,
  user_avatar_url text,
  report_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ec.id,
    ec.entry_id,
    ec.user_id,
    ec.content,
    ec.created_at,
    coalesce(ec.spam_score, 0.0) as spam_score,
    coalesce(ec.flagged_as_spam, false) as flagged_as_spam,
    ec.status,
    e.strain_name as entry_name,
    e.contest_id,
    c.name as contest_name,
    p.display_name as user_name,
    p.organization as user_organization,
    p.avatar_url as user_avatar_url,
    coalesce((
      select count(*)::bigint
      from public.comment_reports cr
      where cr.comment_id = ec.id
        and cr.status = 'pending'
    ), 0::bigint) as report_count
  from public.entry_comments ec
  join public.entries e on e.id = ec.entry_id
  join public.contests c on c.id = e.contest_id
  join public.profiles p on p.id = ec.user_id
  where exists (
    select 1 from public.profiles organizer_check
    where organizer_check.id = auth.uid() 
      and organizer_check.role = 'organizer'
  )
    and (
      (p_status_filter = 'pending' and ec.status in ('pending', 'hidden'))
      or 
      (p_status_filter != 'pending' and ec.status in ('pending', 'approved', 'rejected', 'hidden'))
    )
  order by ec.created_at desc;
end;
$$;

-- ÉTAPE 4: Ajouter les permissions
grant execute on function public.get_pending_comments_for_organizer(text) to authenticated;
grant execute on function public.get_pending_comments_for_organizer(text) to anon;
grant execute on function public.get_pending_comments_for_organizer(text) to service_role;

-- ÉTAPE 5: Vérifier que la fonction a été créée et les permissions
select 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  proacl::text as permissions
from pg_proc
where proname = 'get_pending_comments_for_organizer'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');

-- ÉTAPE 6: Vérifier les permissions explicites
select 
  grantee::text,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'get_pending_comments_for_organizer';

