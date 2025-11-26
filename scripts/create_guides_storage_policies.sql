-- Script SQL pour créer les politiques RLS du bucket Storage 'guides'
-- ATTENTION: Ce script peut nécessiter des permissions spéciales
-- Si vous obtenez une erreur de permissions, créez les politiques via le Dashboard Supabase
-- 
-- Instructions pour créer les politiques via le Dashboard:
-- 1. Allez dans Supabase Dashboard > Storage > guides > Policies
-- 2. Cliquez sur "New Policy"
-- 3. Créez les 4 politiques suivantes:

-- POLITIQUE 1: SELECT (Lecture publique des guides actifs)
-- Name: "Public can view active guides in storage"
-- Allowed operation: SELECT
-- Policy definition:
--   (bucket_id = 'guides' AND EXISTS (SELECT 1 FROM public.guides g WHERE g.file_path = (storage.objects.name) AND g.is_active = true))

-- POLITIQUE 2: INSERT (Upload par les organisateurs)
-- Name: "Organizers can upload guides in storage"
-- Allowed operation: INSERT
-- Policy definition:
--   (bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'organizer')))

-- POLITIQUE 3: UPDATE (Mise à jour par les organisateurs)
-- Name: "Organizers can update guides in storage"
-- Allowed operation: UPDATE
-- Policy definition:
--   (bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'organizer')))

-- POLITIQUE 4: DELETE (Suppression par les organisateurs)
-- Name: "Organizers can delete guides in storage"
-- Allowed operation: DELETE
-- Policy definition:
--   (bucket_id = 'guides' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'organizer')))

-- ============================================
-- Si vous avez les permissions, vous pouvez exécuter ce SQL:
-- ============================================

-- Lecture publique des guides actifs
do $$ begin
  drop policy if exists "Public can view active guides in storage" on storage.objects;
  create policy "Public can view active guides in storage"
    on storage.objects for select
    using (
      bucket_id = 'guides'
      and exists (
        select 1 from public.guides g
        where g.file_path = (storage.objects.name)
          and g.is_active = true
      )
    );
exception
  when insufficient_privilege then
    raise notice 'Permissions insuffisantes pour créer la politique. Créez-la manuellement via le Dashboard.';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

-- Upload par les organisateurs uniquement
do $$ begin
  drop policy if exists "Organizers can upload guides in storage" on storage.objects;
  create policy "Organizers can upload guides in storage"
    on storage.objects for insert
    with check (
      bucket_id = 'guides'
      and (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'organizer'
        )
      )
    );
exception
  when insufficient_privilege then
    raise notice 'Permissions insuffisantes pour créer la politique. Créez-la manuellement via le Dashboard.';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

-- Mise à jour par les organisateurs
do $$ begin
  drop policy if exists "Organizers can update guides in storage" on storage.objects;
  create policy "Organizers can update guides in storage"
    on storage.objects for update
    using (
      bucket_id = 'guides'
      and (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'organizer'
        )
      )
    );
exception
  when insufficient_privilege then
    raise notice 'Permissions insuffisantes pour créer la politique. Créez-la manuellement via le Dashboard.';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

-- Suppression par les organisateurs
do $$ begin
  drop policy if exists "Organizers can delete guides in storage" on storage.objects;
  create policy "Organizers can delete guides in storage"
    on storage.objects for delete
    using (
      bucket_id = 'guides'
      and (
        auth.role() = 'service_role'
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'organizer'
        )
      )
    );
exception
  when insufficient_privilege then
    raise notice 'Permissions insuffisantes pour créer la politique. Créez-la manuellement via le Dashboard.';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

select 'Politiques de storage créées (ou instructions affichées si erreur de permissions)' as status;

