-- Migration: Rendre la limite THC paramétrable par concours
-- Permet de gérer les différences réglementaires entre pays

-- Ajouter le champ thc_limit dans contests
alter table public.contests
add column if not exists thc_limit numeric(4,2) default 0.3;

-- Ajouter le champ applicable_countries pour gérer les restrictions géographiques
alter table public.contests
add column if not exists applicable_countries text[] default array['EU']::text[];

-- Ajouter un champ pour le disclaimer légal spécifique au concours
alter table public.contests
add column if not exists legal_disclaimer text;

-- Ajouter un commentaire pour documenter
comment on column public.contests.thc_limit is 'Limite légale THC pour ce concours (en %). Par défaut : 0.3% (réglementation UE standard).';
comment on column public.contests.applicable_countries is 'Codes pays ISO où ce concours est applicable (ex: ["FR", "BE", "CH"]). Vide ou ["EU"] = applicable en Europe.';
comment on column public.contests.legal_disclaimer is 'Disclaimer légal spécifique à ce concours (ex: restrictions géographiques, réglementations locales)';

-- Mettre à jour la contrainte CHECK existante pour être plus flexible
-- (La validation se fera dans l'application selon la limite du concours)
-- On garde une limite maximale absolue de sécurité à 1% pour éviter les erreurs
alter table public.entries
drop constraint if exists entries_thc_percent_limit;

alter table public.entries
add constraint entries_thc_percent_limit
  check (
    thc_percent is null 
    or (thc_percent >= 0 and thc_percent <= 1.0) -- Limite absolue de sécurité (validation exacte dans l'app)
  );

-- Créer une fonction pour valider le THC selon la limite du concours
create or replace function public.validate_thc_against_contest_limit(
  p_entry_id uuid,
  p_thc_percent numeric
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_contest_thc_limit numeric;
begin
  -- Récupérer la limite THC du concours
  select c.thc_limit into v_contest_thc_limit
  from public.entries e
  join public.contests c on c.id = e.contest_id
  where e.id = p_entry_id;

  -- Si pas de limite définie, utiliser 0.3% par défaut
  if v_contest_thc_limit is null then
    v_contest_thc_limit := 0.3;
  end if;

  -- Vérifier que le THC est inférieur ou égal à la limite du concours
  if p_thc_percent is not null and p_thc_percent > v_contest_thc_limit then
    raise exception '%', 
      format('Le taux THC (%.2f%%) dépasse la limite légale pour ce concours (≤%.2f%%).', p_thc_percent, v_contest_thc_limit);
  end if;

  return true;
end;
$$;

-- Créer une vue pour afficher les limites THC par concours
create or replace view public.contest_thc_limits as
select
  c.id as contest_id,
  c.name as contest_name,
  c.thc_limit,
  c.applicable_countries,
  c.legal_disclaimer,
  case
    when c.thc_limit = 0.3 then 'UE standard'
    when c.thc_limit = 0.2 then 'Suisse / Strict'
    when c.thc_limit < 0.3 then 'Réglementation stricte'
    else 'Personnalisé'
  end as limit_type
from public.contests c
order by c.created_at desc;

-- Commentaires
comment on function public.validate_thc_against_contest_limit is 'Valide le taux THC d''une entrée selon la limite légale du concours associé';
comment on view public.contest_thc_limits is 'Vue récapitulative des limites THC par concours';

