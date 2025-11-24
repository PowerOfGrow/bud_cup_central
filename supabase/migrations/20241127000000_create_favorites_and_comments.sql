-- Migration: Création des tables pour favoris et commentaires
-- Date: 2024-11-27

-- Table des favoris
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, entry_id)
);

-- Index pour optimiser les requêtes
create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_entry_id_idx on public.favorites(entry_id);

-- Table des commentaires
create table if not exists public.entry_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Index pour optimiser les requêtes
create index if not exists entry_comments_entry_id_idx on public.entry_comments(entry_id);
create index if not exists entry_comments_user_id_idx on public.entry_comments(user_id);
create index if not exists entry_comments_created_at_idx on public.entry_comments(created_at desc);

-- Trigger pour updated_at sur entry_comments
drop trigger if exists handle_entry_comments_updated on public.entry_comments;
create trigger handle_entry_comments_updated
  before update on public.entry_comments
  for each row
  execute function public.handle_updated_at();

-- RLS Policies pour favorites
do $$ begin
  create policy "Users can view their own favorites"
    on public.favorites
    for select
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can add their own favorites"
    on public.favorites
    for insert
    with check (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can delete their own favorites"
    on public.favorites
    for delete
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

-- RLS Policies pour entry_comments
do $$ begin
  create policy "Anyone can view comments on approved entries"
    on public.entry_comments
    for select
    using (
      auth.role() = 'service_role'
      or exists (
        select 1 from public.entries e
        where e.id = entry_comments.entry_id
        and e.status = 'approved'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users can create comments"
    on public.entry_comments
    for insert
    with check (
      auth.role() = 'service_role'
      or (
        auth.uid() = user_id
        and exists (
          select 1 from public.entries e
          where e.id = entry_comments.entry_id
          and e.status = 'approved'
        )
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update their own comments"
    on public.entry_comments
    for update
    using (auth.uid() = user_id or auth.role() = 'service_role')
    with check (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can delete their own comments"
    on public.entry_comments
    for delete
    using (auth.uid() = user_id or auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

