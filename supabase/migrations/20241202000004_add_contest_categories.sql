-- Migration: Catégories custom par concours
-- Permet aux organisateurs de définir des catégories spécifiques à chaque concours

-- Table pour stocker les catégories custom par concours
create table if not exists public.contest_categories (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  weight numeric(3,2) default 1.0, -- Pour pondération dans classements (défaut 1.0 = pas de pondération)
  max_entries_per_producer integer, -- Limite optionnelle d'entrées par producteur pour cette catégorie
  rules jsonb, -- Règles spécifiques JSONB (ex: critères particuliers, format de soumission, etc.)
  display_order integer default 0, -- Ordre d'affichage dans les formulaires
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  -- Contraintes
  constraint contest_categories_contest_slug_unique unique (contest_id, slug),
  constraint contest_categories_weight_check check (weight > 0 and weight <= 1.0)
);

-- Index pour optimiser les requêtes
create index if not exists contest_categories_contest_idx on public.contest_categories(contest_id);
create index if not exists contest_categories_slug_idx on public.contest_categories(lower(slug));
create index if not exists contest_categories_active_idx on public.contest_categories(is_active) where is_active = true;

-- Trigger pour updated_at
drop trigger if exists handle_contest_categories_updated on public.contest_categories;
create trigger handle_contest_categories_updated
  before update on public.contest_categories
  for each row
  execute function public.handle_updated_at();

-- Commentaires
comment on table public.contest_categories is 'Catégories personnalisées définies par organisateur pour chaque concours';
comment on column public.contest_categories.weight is 'Pondération pour le calcul des classements (0 < weight <= 1.0). Par défaut 1.0 = pas de pondération';
comment on column public.contest_categories.max_entries_per_producer is 'Limite optionnelle d''entrées par producteur pour cette catégorie. NULL = pas de limite';
comment on column public.contest_categories.rules is 'Règles spécifiques au format JSONB (critères particuliers, format, etc.)';
comment on column public.contest_categories.display_order is 'Ordre d''affichage dans les formulaires (plus petit = affiché en premier)';

-- Ajouter colonne optionnelle dans entries pour référencer une catégorie custom
-- Si NULL, on utilise la colonne category (enum existant) pour rétrocompatibilité
alter table public.entries
add column if not exists contest_category_id uuid references public.contest_categories(id) on delete set null;

-- Index pour la nouvelle colonne
create index if not exists entries_contest_category_idx on public.entries(contest_category_id);

-- Commentaire
comment on column public.entries.contest_category_id is 'Référence à une catégorie custom du concours. Si NULL, utiliser la colonne category (enum global) pour rétrocompatibilité';

-- RLS pour contest_categories
alter table public.contest_categories enable row level security;

-- Politique : Lecture publique, modification uniquement par les organisateurs du concours
do $$ begin
  create policy "Anyone can view active contest categories"
    on public.contest_categories
    for select
    using (is_active = true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers can manage their contest categories"
    on public.contest_categories
    for all
    using (
      exists (
        select 1 from public.contests c
        where c.id = contest_categories.contest_id
        and c.created_by = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;

-- Vue helper pour obtenir les catégories disponibles pour un concours
-- Combine catégories custom + catégories globales si aucune custom
create or replace view public.available_categories_for_contest as
select 
  cc.id as category_id,
  cc.contest_id,
  cc.name,
  cc.slug,
  cc.description,
  cc.weight,
  cc.max_entries_per_producer,
  cc.rules,
  cc.display_order,
  'custom'::text as category_type,
  cc.is_active
from public.contest_categories cc
where cc.is_active = true

union all

-- Catégories globales (fallback) seulement si le concours n'a pas de catégories custom
select 
  null::uuid as category_id,
  c.id as contest_id,
  gc.name,
  gc.slug,
  null as description,
  1.0::numeric as weight,
  null as max_entries_per_producer,
  null as rules,
  gc.display_order,
  'global'::text as category_type,
  true as is_active
from public.contests c
cross join (
  select 'Indica' as name, 'indica' as slug, 1 as display_order
  union all select 'Sativa', 'sativa', 2
  union all select 'Hybrid', 'hybrid', 3
  union all select 'Outdoor', 'outdoor', 4
  union all select 'Hash', 'hash', 5
  union all select 'Autre', 'other', 6
) gc
where not exists (
  select 1 from public.contest_categories cc
  where cc.contest_id = c.id
  and cc.is_active = true
);

comment on view public.available_categories_for_contest is 'Vue combinant catégories custom et globales pour chaque concours. Si un concours a des catégories custom, seules celles-ci sont retournées. Sinon, les catégories globales sont retournées.';

-- Fonction helper pour obtenir le nom de catégorie (custom ou global)
create or replace function public.get_entry_category_name(
  p_entry_id uuid
)
returns text
language plpgsql
stable
as $$
declare
  v_contest_category_id uuid;
  v_category_enum text;
  v_custom_name text;
begin
  -- Récupérer les infos de l'entrée
  select contest_category_id, category
  into v_contest_category_id, v_category_enum
  from public.entries
  where id = p_entry_id;

  -- Si une catégorie custom est référencée, utiliser son nom
  if v_contest_category_id is not null then
    select name into v_custom_name
    from public.contest_categories
    where id = v_contest_category_id;
    
    if v_custom_name is not null then
      return v_custom_name;
    end if;
  end if;

  -- Sinon, utiliser le nom de l'enum global
  return case v_category_enum
    when 'indica' then 'Indica'
    when 'sativa' then 'Sativa'
    when 'hybrid' then 'Hybrid'
    when 'outdoor' then 'Outdoor'
    when 'hash' then 'Hash'
    when 'other' then 'Autre'
    else 'Autre'
  end;
end;
$$;

comment on function public.get_entry_category_name is 'Retourne le nom de la catégorie d''une entrée (custom ou global)';

