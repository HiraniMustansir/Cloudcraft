-- Public merged-contribution history and efficient profile contribution stats.
-- Run this after 001_cloudcraft.sql and 002_collaboration_activity.sql.

create index if not exists pull_requests_author_idx
  on public.pull_requests(author_id, created_at desc);

create index if not exists architecture_forks_author_idx
  on public.architecture_forks(author_id, created_at desc);

drop policy if exists "contributors and owners read pull requests"
  on public.pull_requests;

create policy "contributors owners and public merged requests read pull requests"
on public.pull_requests for select
using (
  status = 'approved'
  or auth.uid() = author_id
  or exists (
    select 1 from public.architectures target
    where target.id = target_architecture_id
      and target.author_id = auth.uid()
  )
);
