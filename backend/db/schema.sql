-- =========================================================
-- Sanatan API — Supabase schema (v3.0)
-- Run in the Supabase SQL editor (or `supabase db push`).
-- =========================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- api_keys ----------
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null default 'Default',
  key_hash     text not null,             -- bcrypt hash of the plaintext key
  key_lookup   text not null unique,      -- sha256(key) for O(1) lookup
  key_preview  text not null,             -- sanatan-••••••••x5z7
  last_four    text not null,             -- x5z7
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists api_keys_user_idx on public.api_keys(user_id);

-- ---------- api_usage_logs ----------
create table if not exists public.api_usage_logs (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  key_id      uuid references public.api_keys(id) on delete set null,
  endpoint    text not null,
  status_code int  not null,
  timestamp   timestamptz not null default now()
);
create index if not exists usage_user_time_idx on public.api_usage_logs(user_id, timestamp desc);
create index if not exists usage_key_idx       on public.api_usage_logs(key_id);

-- ---------- shloks_gita ----------
create table if not exists public.shloks_gita (
  id              bigserial primary key,
  chapter         int  not null,
  verse           int  not null,
  sanskrit        text not null,
  transliteration text,
  hindi           text,
  english         text,
  meaning         text,
  unique (chapter, verse)
);
create index if not exists gita_chapter_idx on public.shloks_gita(chapter);

-- ---------- shloks_vedas ----------
create table if not exists public.shloks_vedas (
  id              bigserial primary key,
  veda_name       text not null,           -- rigveda | yajurveda | samaveda | atharvaveda
  mandala         int,
  sukta           int,
  mantra          int,
  sanskrit        text not null,
  transliteration text,
  translation     text,
  unique (veda_name, mandala, sukta, mantra)
);
create index if not exists vedas_name_idx on public.shloks_vedas(veda_name);

-- =========================================================
-- Row Level Security
-- The backend uses the service-role key (bypasses RLS). These
-- policies protect the data if the frontend ever queries directly.
-- =========================================================
alter table public.profiles       enable row level security;
alter table public.api_keys       enable row level security;
alter table public.api_usage_logs enable row level security;

-- Profiles: a user sees only their own row.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for select using (auth.uid() = id);

-- API keys: users manage only their own keys.
drop policy if exists "own keys read"   on public.api_keys;
drop policy if exists "own keys write"  on public.api_keys;
drop policy if exists "own keys update" on public.api_keys;
create policy "own keys read"   on public.api_keys for select using (auth.uid() = user_id);
create policy "own keys write"  on public.api_keys for insert with check (auth.uid() = user_id);
create policy "own keys update" on public.api_keys for update using (auth.uid() = user_id);

-- Usage logs: users read only their own.
drop policy if exists "own usage" on public.api_usage_logs;
create policy "own usage" on public.api_usage_logs
  for select using (auth.uid() = user_id);

-- Scripture tables are public reference data (read-only via anon if desired).
alter table public.shloks_gita  enable row level security;
alter table public.shloks_vedas enable row level security;
drop policy if exists "gita public read"  on public.shloks_gita;
drop policy if exists "vedas public read" on public.shloks_vedas;
create policy "gita public read"  on public.shloks_gita  for select using (true);
create policy "vedas public read" on public.shloks_vedas for select using (true);
