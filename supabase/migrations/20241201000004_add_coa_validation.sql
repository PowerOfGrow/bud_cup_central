-- Migration: Ajout des champs de validation COA pour les organisateurs
-- Permet de suivre la validation manuelle des certificats d'analyse

-- Ajouter les champs de validation COA dans entries
alter table public.entries
add column if not exists coa_validated boolean default false,
add column if not exists coa_validated_at timestamptz,
add column if not exists coa_validated_by uuid references public.profiles(id) on delete set null,
add column if not exists coa_validation_notes text,
add column if not exists coa_format_valid boolean default false,
add column if not exists coa_data_readable boolean default false,
add column if not exists coa_thc_compliant boolean default false,
add column if not exists coa_lab_recognized boolean default false;

-- Index pour faciliter les requêtes de validation
create index if not exists entries_coa_validated_idx on public.entries(coa_validated);
create index if not exists entries_status_coa_idx on public.entries(status, coa_validated);

-- Commentaires
comment on column public.entries.coa_validated is 'Indique si le COA a été validé par un organisateur';
comment on column public.entries.coa_validated_at is 'Date et heure de validation du COA';
comment on column public.entries.coa_validated_by is 'Profil de l''organisateur qui a validé le COA';
comment on column public.entries.coa_validation_notes is 'Notes de validation ou raisons de rejet du COA';
comment on column public.entries.coa_format_valid is 'Checklist : Format du COA est valide (PDF ou image)';
comment on column public.entries.coa_data_readable is 'Checklist : Données du COA sont lisibles';
comment on column public.entries.coa_thc_compliant is 'Checklist : THC conforme à la limite du concours';
comment on column public.entries.coa_lab_recognized is 'Checklist : Laboratoire reconnu';

-- Fonction helper pour réinitialiser la validation si le COA change
create or replace function public.reset_coa_validation_on_update()
returns trigger
language plpgsql
as $$
begin
  -- Si le COA URL change, réinitialiser la validation
  if old.coa_url is distinct from new.coa_url then
    new.coa_validated := false;
    new.coa_validated_at := null;
    new.coa_validated_by := null;
    new.coa_validation_notes := null;
    new.coa_format_valid := false;
    new.coa_data_readable := false;
    new.coa_thc_compliant := false;
    new.coa_lab_recognized := false;
  end if;
  return new;
end;
$$;

-- Trigger pour réinitialiser la validation si le COA change
drop trigger if exists reset_coa_validation_trigger on public.entries;
create trigger reset_coa_validation_trigger
  before update on public.entries
  for each row
  execute function public.reset_coa_validation_on_update();

-- Vue pour les organisateurs : entrées nécessitant validation COA
create or replace view public.entries_pending_coa_validation as
select
  e.id,
  e.contest_id,
  e.producer_id,
  e.strain_name,
  e.category,
  e.status,
  e.coa_url,
  e.thc_percent,
  e.cbd_percent,
  e.created_at,
  e.coa_validated,
  e.coa_format_valid,
  e.coa_data_readable,
  e.coa_thc_compliant,
  e.coa_lab_recognized,
  e.coa_validation_notes,
  c.name as contest_name,
  c.thc_limit as contest_thc_limit,
  p.display_name as producer_name,
  p.organization as producer_organization
from public.entries e
join public.contests c on c.id = e.contest_id
join public.profiles p on p.id = e.producer_id
where
  e.status in ('submitted', 'under_review')
  and e.coa_url is not null
  and (e.coa_validated = false or e.coa_validated is null)
order by e.created_at desc;

-- Commentaire sur la vue
comment on view public.entries_pending_coa_validation is 'Vue listant les entrées avec COA nécessitant une validation par les organisateurs';

-- RLS pour la vue (même que entries)
grant select on public.entries_pending_coa_validation to authenticated;

-- Politique RLS pour permettre aux organisateurs de mettre à jour les champs de validation COA
do $$ begin
  create policy "Organizers can update COA validation fields"
    on public.entries
    for update
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'organizer'
      )
    )
    with check (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

