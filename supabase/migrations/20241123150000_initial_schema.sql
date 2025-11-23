create extension if not exists "pgcrypto";

do $$ begin
  create type profile_role as enum ('organizer', 'producer', 'judge', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type contest_status as enum ('draft', 'registration', 'judging', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type entry_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'disqualified', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type entry_category as enum ('indica', 'sativa', 'hybrid', 'outdoor', 'hash', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type document_type as enum ('coa', 'photo', 'lab_report', 'marketing', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type badge_type as enum ('gold', 'silver', 'bronze', 'people_choice', 'innovation', 'terpene', 'compliance');
exception
  when duplicate_object then null;
end $$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  organization text,
  role profile_role not null default 'viewer',
  avatar_url text,
  country text,
  bio text,
  is_verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists handle_profiles_updated on public.profiles;
create trigger handle_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status contest_status not null default 'draft',
  location text,
  start_date timestamptz,
  end_date timestamptz,
  registration_close_date timestamptz,
  prize_pool numeric(12,2),
  rules_url text,
  featured_image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists handle_contests_updated on public.contests;
create trigger handle_contests_updated
  before update on public.contests
  for each row
  execute function public.handle_updated_at();

create index if not exists contests_status_idx on public.contests(status);
create index if not exists contests_slug_idx on public.contests(lower(slug));

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  producer_id uuid not null references public.profiles(id) on delete cascade,
  strain_name text not null,
  cultivar text,
  category entry_category not null default 'hybrid',
  thc_percent numeric(4,2),
  cbd_percent numeric(4,2),
  terpene_profile text,
  batch_code text,
  coa_url text,
  photo_url text,
  qr_code_url text,
  status entry_status not null default 'draft',
  submission_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists handle_entries_updated on public.entries;
create trigger handle_entries_updated
  before update on public.entries
  for each row
  execute function public.handle_updated_at();

create index if not exists entries_contest_idx on public.entries(contest_id);
create index if not exists entries_producer_idx on public.entries(producer_id);
create index if not exists entries_status_idx on public.entries(status);

create table if not exists public.entry_documents (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  document_type document_type not null default 'other',
  storage_path text not null,
  label text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists entry_documents_entry_idx on public.entry_documents(entry_id);

create table if not exists public.contest_judges (
  id bigserial primary key,
  contest_id uuid not null references public.contests(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  invitation_status text not null default 'pending',
  judge_role text not null default 'judge',
  created_at timestamptz not null default timezone('utc', now()),
  unique (contest_id, judge_id)
);

create index if not exists contest_judges_contest_idx on public.contest_judges(contest_id);
create index if not exists contest_judges_judge_idx on public.contest_judges(judge_id);

create table if not exists public.judge_scores (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  appearance_score smallint not null check (appearance_score between 0 and 100),
  aroma_score smallint not null check (aroma_score between 0 and 100),
  taste_score smallint not null check (taste_score between 0 and 100),
  effect_score smallint not null check (effect_score between 0 and 100),
  overall_score smallint not null check (overall_score between 0 and 100),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (entry_id, judge_id)
);

create index if not exists judge_scores_entry_idx on public.judge_scores(entry_id);
create index if not exists judge_scores_judge_idx on public.judge_scores(judge_id);

create table if not exists public.public_votes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  voter_profile_id uuid references public.profiles(id) on delete set null,
  score smallint not null check (score between 0 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (entry_id, voter_profile_id)
);

create index if not exists public_votes_entry_idx on public.public_votes(entry_id);

create table if not exists public.entry_badges (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  badge badge_type not null,
  label text not null,
  description text,
  awarded_at timestamptz not null default timezone('utc', now())
);

create index if not exists entry_badges_entry_idx on public.entry_badges(entry_id);

alter table public.profiles enable row level security;
alter table public.contests enable row level security;
alter table public.entries enable row level security;
alter table public.entry_documents enable row level security;
alter table public.contest_judges enable row level security;
alter table public.judge_scores enable row level security;
alter table public.public_votes enable row level security;
alter table public.entry_badges enable row level security;

do $$ begin
  create policy "Profiles are publicly readable"
    on public.profiles
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users manage their profile"
    on public.profiles
    for all
    using (auth.uid() = id or auth.role() = 'service_role')
    with check (auth.uid() = id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Contests visible to everyone"
    on public.contests
    for select
    using (status != 'draft' or auth.role() = 'service_role' or coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000') = created_by);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers manage contests"
    on public.contests
    for all
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

do $$ begin
  create policy "Entries visible to community"
    on public.entries
    for select
    using (
      status in ('approved', 'archived')
      or auth.role() = 'service_role'
      or auth.uid() = producer_id
      or exists (
        select 1 from public.contest_judges cj
        where cj.contest_id = entries.contest_id and cj.judge_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Producers manage their entries"
    on public.entries
    for insert
    with check (
      auth.role() = 'service_role'
      or (auth.uid() = producer_id and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('producer', 'organizer')
      ))
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Producers update their entries"
    on public.entries
    for update
    using (
      auth.role() = 'service_role'
      or auth.uid() = producer_id
    )
    with check (
      auth.role() = 'service_role'
      or auth.uid() = producer_id
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Documents accessible to relevant users"
    on public.entry_documents
    for select
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        where e.id = entry_documents.entry_id
          and (
            e.status in ('approved', 'archived')
            or e.producer_id = auth.uid()
            or exists (
              select 1 from public.contest_judges cj
              where cj.contest_id = e.contest_id and cj.judge_id = auth.uid()
            )
          )
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Producers manage their documents"
    on public.entry_documents
    for all
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        where e.id = entry_documents.entry_id and e.producer_id = auth.uid()
      )
    )
    with check (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        where e.id = entry_documents.entry_id and e.producer_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Judges visible per contest"
    on public.contest_judges
    for select
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.contests c
        where c.id = contest_judges.contest_id
          and (
            c.status != 'draft'
            or c.created_by = auth.uid()
          )
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers manage contest judges"
    on public.contest_judges
    for all
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.contests c
        join public.profiles p on p.id = auth.uid()
        where c.id = contest_judges.contest_id and p.role = 'organizer'
      )
    )
    with check (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.contests c
        join public.profiles p on p.id = auth.uid()
        where c.id = contest_judges.contest_id and p.role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Judges manage their scores"
    on public.judge_scores
    for all
    using (
      auth.role() = 'service_role'
      or judge_id = auth.uid()
    )
    with check (
      auth.role() = 'service_role'
      or judge_id = auth.uid()
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Votes readable by all"
    on public.public_votes
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users vote once per entry"
    on public.public_votes
    for insert
    with check (
      auth.role() = 'service_role'
      or auth.uid() = voter_profile_id
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Voters can update their vote"
    on public.public_votes
    for update
    using (
      auth.role() = 'service_role'
      or auth.uid() = voter_profile_id
    )
    with check (
      auth.role() = 'service_role'
      or auth.uid() = voter_profile_id
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Badges visible to everyone"
    on public.entry_badges
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Organizers manage badges"
    on public.entry_badges
    for all
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        join public.profiles p on p.id = auth.uid()
        where e.id = entry_badges.entry_id and p.role = 'organizer'
      )
    )
    with check (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        join public.profiles p on p.id = auth.uid()
        where e.id = entry_badges.entry_id and p.role = 'organizer'
      )
    );
exception
  when duplicate_object then null;
end $$;

