-- Script SQL pour créer les politiques RLS minimales du bucket Storage 'guides'
-- Ces politiques permettent uniquement aux organisateurs d'uploader/gérer les fichiers
-- Les téléchargements utilisent des signed URLs (pas de politique SELECT publique nécessaire)
--
-- ⚠️ ATTENTION : Ce script va probablement ÉCHOUER avec l'erreur "must be owner of table objects"
-- C'est NORMAL - les politiques de storage nécessitent des permissions superuser.
--
-- ✅ SOLUTION : Créez les politiques via le Dashboard Supabase
-- Voir le guide détaillé : SETUP_STORAGE_POLICIES_DASHBOARD.md
--
-- Ce script est fourni uniquement à titre de référence pour voir la syntaxe des politiques.
-- NE L'EXÉCUTEZ PAS - utilisez le Dashboard à la place.

-- POLITIQUE 1: INSERT (Upload par les organisateurs uniquement)
-- Nécessaire pour que les organisateurs puissent uploader des guides
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
    raise notice 'ERREUR: Permissions insuffisantes. Créez cette politique manuellement via le Dashboard Supabase:';
    raise notice '  - Storage > guides > Policies > New Policy';
    raise notice '  - Name: "Organizers can upload guides in storage"';
    raise notice '  - Operation: INSERT';
    raise notice '  - Policy: bucket_id = ''guides'' AND (auth.role() = ''service_role'' OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''organizer''))';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

-- POLITIQUE 2: UPDATE (Mise à jour par les organisateurs)
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
    raise notice 'ERREUR: Permissions insuffisantes. Créez cette politique manuellement via le Dashboard Supabase.';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

-- POLITIQUE 3: DELETE (Suppression par les organisateurs)
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
    raise notice 'ERREUR: Permissions insuffisantes. Créez cette politique manuellement via le Dashboard Supabase.';
  when others then
    raise notice 'Erreur lors de la création de la politique: %', SQLERRM;
end $$;

-- NOTE: Pas de politique SELECT publique car on utilise des signed URLs pour les téléchargements
-- Les signed URLs permettent un accès temporaire sécurisé aux fichiers sans politique RLS SELECT

select 'Politiques de storage créées (ou instructions affichées si erreur de permissions)' as status;
select 'Les téléchargements utilisent des signed URLs - pas de politique SELECT publique nécessaire' as note;

