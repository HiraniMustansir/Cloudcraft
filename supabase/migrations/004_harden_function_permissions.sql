-- Restrict trigger functions that do not need to be callable through the API.
-- Run after 001_cloudcraft.sql and 002_collaboration_activity.sql.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

revoke execute on function public.track_architecture_fork() from public;
revoke execute on function public.track_architecture_fork() from anon, authenticated;

-- Make future functions private by default. Explicitly grant EXECUTE in the
-- migration that creates a function when it is intentionally exposed as RPC.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
