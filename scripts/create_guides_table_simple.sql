-- Script SQL simplifié pour créer la table guides
-- À exécuter directement dans Supabase SQL Editor si la migration échoue

-- 1. Créer la table guides
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('producer', 'judge', 'viewer', 'organizer')),
  title text not null,
  description text,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text default 'application/pdf',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true
);

-- 2. Créer l'index unique partiel
create unique index if not exists idx_guides_unique_active_category 
  on public.guides(category) 
  where is_active = true;

-- 3. Créer les autres index
create index if not exists idx_guides_category on public.guides(category);
create index if not exists idx_guides_active on public.guides(is_active) where is_active = true;

-- 4. Activer RLS
alter table public.guides enable row level security;

-- 5. Créer les politiques RLS (table)
do $$ begin
  create policy "Anyone can view active guides"
    on public.guides
    for select
    using (is_active = true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage guides"
    on public.guides
    for all
    using (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'organizer'
      )
    )
    with check (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

-- 6. Créer le bucket storage (si nécessaire)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guides',
  'guides',
  false,
  10485760,
  ARRAY['application/pdf']
)
on conflict (id) do nothing;

-- 7. Créer les politiques RLS pour le bucket storage
do $$ begin
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
  when duplicate_object then null;
end $$;

do $$ begin
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
  when duplicate_object then null;
end $$;

do $$ begin
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
  when duplicate_object then null;
end $$;

do $$ begin
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
  when duplicate_object then null;
end $$;

-- 8. Fonctions et triggers
create or replace function public.update_guides_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_guides_updated_at on public.guides;
create trigger update_guides_updated_at
  before update on public.guides
  for each row
  execute function public.update_guides_updated_at();

create or replace function public.handle_guide_activation()
returns trigger as $$
begin
  if new.is_active = true and (old.is_active is null or old.is_active = false) then
    update public.guides
    set is_active = false
    where category = new.category
      and id != new.id
      and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists handle_guide_activation on public.guides;
create trigger handle_guide_activation
  before insert or update on public.guides
  for each row
  execute function public.handle_guide_activation();

-- Vérification
select 'Table guides créée avec succès' as status;

