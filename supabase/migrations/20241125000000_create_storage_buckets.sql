-- Migration: Création des buckets Storage pour les fichiers des entrées
-- Date: 2024-11-25

-- 1. Créer le bucket pour les photos des entrées
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-photos',
  'entry-photos',
  true,
  5242880, -- 5 MB max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. Créer le bucket pour les documents (COA, rapports, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-documents',
  'entry-documents',
  false, -- Privé par défaut
  10485760, -- 10 MB max
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 3. Politique RLS pour le bucket entry-photos : Lecture publique
create policy "Public can view entry photos"
  on storage.objects for select
  using (bucket_id = 'entry-photos');

-- 4. Politique RLS pour le bucket entry-photos : Upload par les producteurs uniquement
create policy "Producers can upload entry photos"
  on storage.objects for insert
  with check (
    bucket_id = 'entry-photos'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      )
    )
  );

-- 5. Politique RLS pour le bucket entry-photos : Mise à jour par les producteurs propriétaires
create policy "Producers can update their entry photos"
  on storage.objects for update
  using (
    bucket_id = 'entry-photos'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      )
    )
  );

-- 6. Politique RLS pour le bucket entry-photos : Suppression par les producteurs propriétaires
create policy "Producers can delete their entry photos"
  on storage.objects for delete
  using (
    bucket_id = 'entry-photos'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      )
    )
  );

-- 7. Politique RLS pour le bucket entry-documents : Lecture par les producteurs propriétaires, juges et organisateurs
create policy "Authorized users can view entry documents"
  on storage.objects for select
  using (
    bucket_id = 'entry-documents'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'judge', 'organizer')
      )
    )
  );

-- 8. Politique RLS pour le bucket entry-documents : Upload par les producteurs uniquement
create policy "Producers can upload entry documents"
  on storage.objects for insert
  with check (
    bucket_id = 'entry-documents'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      )
    )
  );

-- 9. Politique RLS pour le bucket entry-documents : Mise à jour par les producteurs propriétaires
create policy "Producers can update their entry documents"
  on storage.objects for update
  using (
    bucket_id = 'entry-documents'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      )
    )
  );

-- 10. Politique RLS pour le bucket entry-documents : Suppression par les producteurs propriétaires
create policy "Producers can delete their entry documents"
  on storage.objects for delete
  using (
    bucket_id = 'entry-documents'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      )
    )
  );

