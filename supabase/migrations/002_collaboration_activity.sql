-- Fork activity for architecture owners and collaboration history.
-- Run this after 001_cloudcraft.sql in Supabase Dashboard → SQL Editor.

create table if not exists public.architecture_forks (
  source_architecture_id uuid not null references public.architectures(id) on delete cascade,
  fork_architecture_id uuid primary key references public.architectures(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists architecture_forks_source_idx
  on public.architecture_forks(source_architecture_id, created_at desc);

alter table public.architecture_forks enable row level security;

drop policy if exists "fork activity is visible for published work" on public.architecture_forks;
create policy "fork activity is visible for published work"
on public.architecture_forks for select
using (
  auth.uid() = author_id
  or exists (
    select 1 from public.architectures source
    where source.id = source_architecture_id
      and (source.status = 'published' or source.author_id = auth.uid())
  )
);

create or replace function public.track_architecture_fork()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.forked_from is not null then
    insert into public.architecture_forks (
      source_architecture_id,
      fork_architecture_id,
      author_id,
      created_at
    ) values (
      new.forked_from,
      new.id,
      new.author_id,
      new.created_at
    )
    on conflict (fork_architecture_id) do nothing;
  end if;
  return new;
end;
$$;

-- Trigger-only function: prevent direct execution through the Data API.
revoke execute on function public.track_architecture_fork() from public;
revoke execute on function public.track_architecture_fork() from anon, authenticated;

drop trigger if exists on_architecture_fork_created on public.architectures;
create trigger on_architecture_fork_created
after insert on public.architectures
for each row execute function public.track_architecture_fork();

-- Backfill forks that were created before this migration.
insert into public.architecture_forks (
  source_architecture_id,
  fork_architecture_id,
  author_id,
  created_at
)
select forked_from, id, author_id, created_at
from public.architectures
where forked_from is not null
on conflict (fork_architecture_id) do nothing;

grant select on public.architecture_forks to anon, authenticated;
