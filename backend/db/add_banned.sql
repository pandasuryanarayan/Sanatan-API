-- Sanatan API — add ban flag to profiles.
-- Run once in the Supabase SQL Editor (safe to re-run).
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

-- To ban / unban a user by email:
--   update public.profiles set is_banned = true  where email = 'user@example.com';
--   update public.profiles set is_banned = false where email = 'user@example.com';
