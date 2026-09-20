-- Cloudcraft Collective application schema.
-- Run this file once in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9][a-z0-9-]{2,31}$'),
  display_name text not null,
  title text not null default 'Cloud professional',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.architectures (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  summary text not null default '',
  problem text not null default '',
  approach text not null default '',
  tradeoffs text not null default '',
  provider text not null default 'AWS' check (provider in ('AWS', 'Azure', 'GCP', 'Multi-cloud')),
  tags text[] not null default '{}',
  diagram jsonb not null default '{"nodes":[],"groups":[],"connections":[]}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  forked_from uuid references public.architectures(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.architecture_versions (
  id uuid primary key default gen_random_uuid(),
  architecture_id uuid not null references public.architectures(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  version_number integer not null,
  message text not null default 'Saved architecture',
  diagram jsonb not null,
  created_at timestamptz not null default now(),
  unique (architecture_id, version_number)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  architecture_id uuid not null references public.architectures(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, architecture_id)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  architecture_id uuid not null references public.architectures(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, architecture_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  architecture_id uuid not null references public.architectures(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pull_requests (
  id uuid primary key default gen_random_uuid(),
  source_architecture_id uuid not null references public.architectures(id) on delete cascade,
  target_architecture_id uuid not null references public.architectures(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  proposed_diagram jsonb not null,
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists architectures_author_idx on public.architectures(author_id);
create index if not exists architectures_published_idx on public.architectures(status, published_at desc);
create index if not exists architectures_tags_idx on public.architectures using gin(tags);
create index if not exists comments_architecture_idx on public.comments(architecture_id, created_at);
create index if not exists follows_following_idx on public.follows(following_id);
create index if not exists pull_requests_target_idx on public.pull_requests(target_architecture_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists architectures_set_updated_at on public.architectures;
create trigger architectures_set_updated_at before update on public.architectures
for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists pull_requests_set_updated_at on public.pull_requests;
create trigger pull_requests_set_updated_at before update on public.pull_requests
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'developer'),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_username := trim(both '-' from base_username);
  if char_length(base_username) < 3 then base_username := 'developer'; end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    left(base_username, 24) || '-' || left(new.id::text, 6),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Developer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger-only function: prevent direct execution through the Data API.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.architectures enable row level security;
alter table public.architecture_versions enable row level security;
alter table public.follows enable row level security;
alter table public.bookmarks enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.pull_requests enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "published architectures are public" on public.architectures for select
using (status = 'published' or auth.uid() = author_id);
create policy "users create own architectures" on public.architectures for insert
with check (auth.uid() = author_id);
create policy "authors update architectures" on public.architectures for update
using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "authors delete architectures" on public.architectures for delete
using (auth.uid() = author_id);

create policy "visible architecture versions" on public.architecture_versions for select
using (exists (
  select 1 from public.architectures a
  where a.id = architecture_id and (a.status = 'published' or a.author_id = auth.uid())
));
create policy "authors create versions" on public.architecture_versions for insert
with check (auth.uid() = author_id and exists (
  select 1 from public.architectures a where a.id = architecture_id and a.author_id = auth.uid()
));

create policy "follows are public" on public.follows for select using (true);
create policy "users follow as themselves" on public.follows for insert with check (auth.uid() = follower_id);
create policy "users remove own follows" on public.follows for delete using (auth.uid() = follower_id);

create policy "users read own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "users add own bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "users remove own bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

create policy "likes are public" on public.likes for select using (true);
create policy "users add own likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "users remove own likes" on public.likes for delete using (auth.uid() = user_id);

create policy "comments on visible architectures are public" on public.comments for select
using (exists (
  select 1 from public.architectures a
  where a.id = architecture_id and (a.status = 'published' or a.author_id = auth.uid())
));
create policy "users add own comments" on public.comments for insert with check (auth.uid() = author_id);
create policy "authors update own comments" on public.comments for update
using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "authors delete own comments" on public.comments for delete using (auth.uid() = author_id);

create policy "contributors and owners read pull requests" on public.pull_requests for select
using (
  auth.uid() = author_id or exists (
    select 1 from public.architectures target
    where target.id = target_architecture_id and target.author_id = auth.uid()
  )
);
create policy "fork authors create pull requests" on public.pull_requests for insert
with check (
  auth.uid() = author_id and exists (
    select 1 from public.architectures source
    where source.id = source_architecture_id
      and source.author_id = auth.uid()
      and source.forked_from = target_architecture_id
  )
);
create policy "target owners review pull requests" on public.pull_requests for update
using (exists (
  select 1 from public.architectures target
  where target.id = target_architecture_id and target.author_id = auth.uid()
))
with check (exists (
  select 1 from public.architectures target
  where target.id = target_architecture_id and target.author_id = auth.uid()
));

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.architectures, public.architecture_versions, public.follows, public.likes, public.comments to anon, authenticated;
grant insert, update, delete on public.profiles, public.architectures, public.architecture_versions, public.follows, public.bookmarks, public.likes, public.comments to authenticated;
grant select, insert, update on public.pull_requests to authenticated;
grant select on public.bookmarks to authenticated;

-- Backfill profiles for any users created before this migration.
insert into public.profiles (id, username, display_name)
select
  u.id,
  left(lower(regexp_replace(coalesce(split_part(u.email, '@', 1), 'developer'), '[^a-z0-9]+', '-', 'g')), 24)
    || '-' || left(u.id::text, 6),
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'Developer')
from auth.users u
on conflict (id) do nothing;
