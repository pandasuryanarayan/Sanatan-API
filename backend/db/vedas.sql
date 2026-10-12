-- =========================================================
-- Sanatan API — Vedas metadata (canonical totals)
-- Run AFTER schema.sql in Supabase SQL Editor.
-- Creates public.vedas and upserts 4 rows from vedas.json.
-- Safe to re-run. Mantra texts themselves live in shloks_vedas.
-- =========================================================

create table if not exists public.vedas (
  veda_id        text primary key,
  eng_name       text not null,
  sanskrit_name  text not null,
  description_en text,
  description_hi text,
  total_mantras  int not null
);

alter table public.vedas enable row level security;
drop policy if exists "vedas public read" on public.vedas;
create policy "vedas public read" on public.vedas for select using (true);

-- Migrate tables created by the first version of this file
-- (columns name/description -> eng_name/description_en/description_hi).
alter table public.vedas add column if not exists eng_name       text;
alter table public.vedas add column if not exists sanskrit_name  text;
alter table public.vedas add column if not exists description_en text;
alter table public.vedas add column if not exists description_hi text;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'vedas' and column_name = 'name') then
    update public.vedas set eng_name = name where eng_name is null and name is not null;
    alter table public.vedas drop column name;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'vedas' and column_name = 'description') then
    update public.vedas set description_en = description where description_en is null and description is not null;
    alter table public.vedas drop column description;
  end if;
end $$;

insert into public.vedas (veda_id, eng_name, sanskrit_name, description_en, description_hi, total_mantras)
values
  ('rigveda', 'Rigveda', 'ऋग्वेद', 'The oldest Veda, consisting of hymns dedicated to various deities and cosmic order.', 'सबसे पुराना वेद, जिसमें विभिन्न देवताओं और ब्रह्मांडीय व्यवस्था को समर्पित भजन शामिल हैं।', 10552),
  ('yajurveda', 'Yajurveda', 'यजुर्वेद', 'The Veda of rituals and mantras used by priests during sacrificial ceremonies.', 'यज्ञ और कर्मकांडों का वेद, जिसमें पुरोहितों द्वारा अनुष्ठानों के दौरान उपयोग किए जाने वाले मंत्र हैं।', 1975),
  ('samaveda', 'Samaveda', 'सामवेद', 'The Veda of melodies and chants, highly focused on musical recitation.', 'धुनों और भजनों का वेद, जो मुख्य रूप से संगीत के उच्चारण पर केंद्रित है।', 1875),
  ('atharvaveda', 'Atharvaveda', 'अथर्ववेद', 'The Veda of everyday procedures, containing spells, prayers, and charms for daily life.', 'दैनिक जीवन की प्रक्रियाओं का वेद, जिसमें दैनिक जीवन के लिए मंत्र, प्रार्थनाएं और टोटके शामिल हैं।', 5977)
on conflict (veda_id) do update set
  eng_name       = excluded.eng_name,
  sanskrit_name  = excluded.sanskrit_name,
  description_en = excluded.description_en,
  description_hi = excluded.description_hi,
  total_mantras  = excluded.total_mantras;

-- All rows are filled by the upsert above, so constraints are safe now.
alter table public.vedas alter column eng_name set not null;
alter table public.vedas alter column sanskrit_name set not null;
alter table public.vedas alter column total_mantras set not null;
