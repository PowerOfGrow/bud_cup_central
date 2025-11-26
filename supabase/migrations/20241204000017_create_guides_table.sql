-- Migration: Création de la table guides pour stocker les guides PDF par catégorie
-- Date: 2024-12-04

-- 1. Créer le bucket pour les guides PDF
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guides',
  'guides',
  false, -- Privé - on utilisera des signed URLs pour l'accès
  10485760, -- 10 MB max
  ARRAY['application/pdf']
)
on conflict (id) do nothing;

-- 2. Créer la table guides
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('producer', 'judge', 'viewer', 'organizer')),
  title text not null,
  description text,
  file_path text not null, -- Chemin dans Supabase Storage
  file_name text not null, -- Nom du fichier original
  file_size bigint, -- Taille en bytes
  mime_type text default 'application/pdf',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true
);

-- Contrainte unique partielle : un seul guide actif par catégorie
create unique index if not exists idx_guides_unique_active_category 
  on public.guides(category) 
  where is_active = true;

-- Index pour les recherches par catégorie
create index if not exists idx_guides_category on public.guides(category);
create index if not exists idx_guides_active on public.guides(is_active) where is_active = true;

-- Fonction pour mettre à jour updated_at automatiquement
create or replace function public.update_guides_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger pour updated_at
drop trigger if exists update_guides_updated_at on public.guides;
create trigger update_guides_updated_at
  before update on public.guides
  for each row
  execute function public.update_guides_updated_at();

-- RLS: Lecture publique des guides actifs
alter table public.guides enable row level security;

do $$ begin
  create policy "Anyone can view active guides"
    on public.guides
    for select
    using (is_active = true);
exception
  when duplicate_object then null;
end $$;

-- RLS: Seuls les organisateurs peuvent créer/modifier/supprimer
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

-- Fonction pour désactiver l'ancien guide quand un nouveau est activé
create or replace function public.handle_guide_activation()
returns trigger as $$
begin
  -- Si on active un nouveau guide, désactiver les autres de la même catégorie
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

-- Trigger pour gérer l'activation
drop trigger if exists handle_guide_activation on public.guides;
create trigger handle_guide_activation
  before insert or update on public.guides
  for each row
  execute function public.handle_guide_activation();

-- Commentaires
comment on table public.guides is 'Stocke les guides PDF par catégorie (producteur, juge, viewer, organisateur)';
comment on column public.guides.category is 'Catégorie du guide: producer, judge, viewer, organizer';
comment on column public.guides.file_path is 'Chemin du fichier dans Supabase Storage (bucket: guides)';
comment on column public.guides.is_active is 'Un seul guide actif par catégorie';

-- NOTE IMPORTANTE sur les politiques Storage:
-- Les politiques RLS pour storage.objects nécessitent des permissions superuser.
-- L'application utilise des signed URLs pour accéder aux fichiers du bucket 'guides'.
-- Si vous souhaitez créer des politiques de storage manuellement via le Dashboard Supabase:
-- 1. Allez dans Storage > guides > Policies
-- 2. Créez des politiques pour permettre aux organisateurs d'uploader/supprimer
--    Mais ce n'est pas nécessaire car l'application utilise signed URLs pour tout.
