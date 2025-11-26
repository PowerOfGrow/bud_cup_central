-- Script SQL corrigé pour créer la table guides
-- Les politiques de storage doivent être créées via l'interface Supabase Dashboard

-- 1. Créer le bucket pour les guides PDF (si nécessaire)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guides',
  'guides',
  false, -- Privé - on utilisera des signed URLs
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
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text default 'application/pdf',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true
);

-- 3. Contrainte unique partielle : un seul guide actif par catégorie
create unique index if not exists idx_guides_unique_active_category 
  on public.guides(category) 
  where is_active = true;

-- 4. Index pour les recherches
create index if not exists idx_guides_category on public.guides(category);
create index if not exists idx_guides_active on public.guides(is_active) where is_active = true;

-- 5. Fonction pour mettre à jour updated_at
create or replace function public.update_guides_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 6. Trigger pour updated_at
drop trigger if exists update_guides_updated_at on public.guides;
create trigger update_guides_updated_at
  before update on public.guides
  for each row
  execute function public.update_guides_updated_at();

-- 7. Activer RLS
alter table public.guides enable row level security;

-- 8. Politique RLS: Lecture publique des guides actifs
do $$ begin
  create policy "Anyone can view active guides"
    on public.guides
    for select
    using (is_active = true);
exception
  when duplicate_object then null;
end $$;

-- 9. Politique RLS: Seuls les organisateurs peuvent créer/modifier/supprimer
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

-- 10. Fonction pour désactiver l'ancien guide quand un nouveau est activé
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

-- 11. Trigger pour gérer l'activation
drop trigger if exists handle_guide_activation on public.guides;
create trigger handle_guide_activation
  before insert or update on public.guides
  for each row
  execute function public.handle_guide_activation();

-- 12. Commentaires
comment on table public.guides is 'Stocke les guides PDF par catégorie (producteur, juge, viewer, organisateur)';
comment on column public.guides.category is 'Catégorie du guide: producer, judge, viewer, organizer';
comment on column public.guides.file_path is 'Chemin du fichier dans Supabase Storage (bucket: guides)';
comment on column public.guides.is_active is 'Un seul guide actif par catégorie';

-- IMPORTANT: 
-- Les politiques RLS pour le bucket Storage 'guides' doivent être créées manuellement via Supabase Dashboard:
-- 1. Aller dans Storage > Policies > guides
-- 2. Créer les politiques suivantes :
--    - SELECT: Organisateurs + service_role (ou utiliser signed URLs)
--    - INSERT: Organisateurs + service_role
--    - UPDATE: Organisateurs + service_role  
--    - DELETE: Organisateurs + service_role
-- 
-- Ou bien, utilisez des signed URLs dans l'application (recommandé pour plus de sécurité)

select 'Table guides créée avec succès. N''oubliez pas de configurer les politiques de Storage via le Dashboard.' as status;

