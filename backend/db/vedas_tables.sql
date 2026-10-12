-- =========================================================
-- Sanatan API — Veda mantra tables (one per Veda)
-- Run AFTER schema.sql in Supabase SQL Editor.
--
-- Design: 4 lean tables, identical shape. No repeated data —
-- veda names/totals live once in public.vedas; mantra row IDs
-- (rigveda_1_1_1) are built in code, never stored.
-- Safe to re-run. Migrates the 2 demo Rigveda rows from the
-- legacy public.shloks_vedas table, then drops it.
-- =========================================================

create extension if not exists pg_trgm;

-- ---------- Rigveda ----------
create table if not exists public.shloks_rigveda (
  id              bigserial primary key,
  mandala         int  not null,
  sukta           int  not null,
  mantra          int  not null,
  sanskrit        text not null,
  transliteration text,
  english         text,
  hindi           text,
  unique (mandala, sukta, mantra)
);
create index if not exists rigveda_order_idx on public.shloks_rigveda (mandala, sukta, mantra);
create index if not exists rigveda_search_sanskrit on public.shloks_rigveda using gin (sanskrit gin_trgm_ops);
create index if not exists rigveda_search_translit on public.shloks_rigveda using gin (transliteration gin_trgm_ops);
create index if not exists rigveda_search_english on public.shloks_rigveda using gin (english gin_trgm_ops);

-- ---------- Yajurveda ----------
create table if not exists public.shloks_yajurveda (
  id              bigserial primary key,
  mandala         int  not null,
  sukta           int  not null,
  mantra          int  not null,
  sanskrit        text not null,
  transliteration text,
  english         text,
  hindi           text,
  unique (mandala, sukta, mantra)
);
create index if not exists yajurveda_order_idx on public.shloks_yajurveda (mandala, sukta, mantra);
create index if not exists yajurveda_search_sanskrit on public.shloks_yajurveda using gin (sanskrit gin_trgm_ops);
create index if not exists yajurveda_search_translit on public.shloks_yajurveda using gin (transliteration gin_trgm_ops);
create index if not exists yajurveda_search_english on public.shloks_yajurveda using gin (english gin_trgm_ops);

-- ---------- Samaveda ----------
create table if not exists public.shloks_samaveda (
  id              bigserial primary key,
  mandala         int  not null,
  sukta           int  not null,
  mantra          int  not null,
  sanskrit        text not null,
  transliteration text,
  english         text,
  hindi           text,
  unique (mandala, sukta, mantra)
);
create index if not exists samaveda_order_idx on public.shloks_samaveda (mandala, sukta, mantra);
create index if not exists samaveda_search_sanskrit on public.shloks_samaveda using gin (sanskrit gin_trgm_ops);
create index if not exists samaveda_search_translit on public.shloks_samaveda using gin (transliteration gin_trgm_ops);
create index if not exists samaveda_search_english on public.shloks_samaveda using gin (english gin_trgm_ops);

-- ---------- Atharvaveda ----------
create table if not exists public.shloks_atharvaveda (
  id              bigserial primary key,
  mandala         int  not null,
  sukta           int  not null,
  mantra          int  not null,
  sanskrit        text not null,
  transliteration text,
  english         text,
  hindi           text,
  unique (mandala, sukta, mantra)
);
create index if not exists atharvaveda_order_idx on public.shloks_atharvaveda (mandala, sukta, mantra);
create index if not exists atharvaveda_search_sanskrit on public.shloks_atharvaveda using gin (sanskrit gin_trgm_ops);
create index if not exists atharvaveda_search_translit on public.shloks_atharvaveda using gin (transliteration gin_trgm_ops);
create index if not exists atharvaveda_search_english on public.shloks_atharvaveda using gin (english gin_trgm_ops);

-- ---------- Public read (reference data) ----------
alter table public.shloks_rigveda    enable row level security;
alter table public.shloks_yajurveda  enable row level security;
alter table public.shloks_samaveda   enable row level security;
alter table public.shloks_atharvaveda enable row level security;
drop policy if exists "rigveda public read"    on public.shloks_rigveda;
drop policy if exists "yajurveda public read"  on public.shloks_yajurveda;
drop policy if exists "samaveda public read"   on public.shloks_samaveda;
drop policy if exists "atharvaveda public read" on public.shloks_atharvaveda;
create policy "rigveda public read"    on public.shloks_rigveda    for select using (true);
create policy "yajurveda public read"  on public.shloks_yajurveda  for select using (true);
create policy "samaveda public read"   on public.shloks_samaveda   for select using (true);
create policy "atharvaveda public read" on public.shloks_atharvaveda for select using (true);

-- ---------- Migrate legacy demo rows, then retire old table ----------
-- (2 Rigveda rows from seed.sql; translation -> english, hindi stays null.)
insert into public.shloks_rigveda (mandala, sukta, mantra, sanskrit, transliteration, english)
select mandala, sukta, mantra, sanskrit, transliteration, translation
from public.shloks_vedas
where veda_name = 'rigveda'
on conflict (mandala, sukta, mantra) do nothing;

drop table if exists public.shloks_vedas;
