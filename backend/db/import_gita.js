// Sanatan API — one-time Gita import (real data).
// Reads ../../verses.json (701 rows) and upserts into public.shloks_gita.
// Demo rows in Supabase are overwritten via ON CONFLICT (chapter, verse).
//
// Usage:
//   cd backend
//   node db/import_gita.js            # uses .env (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
//   node db/import_gita.js --dry-run # validate mapping without touching the DB
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const DRY = process.argv.includes("--dry-run");

const raw = readFileSync(join(ROOT, "verses.json"), "utf-8");
const verses = JSON.parse(raw);

if (!Array.isArray(verses) || verses.length === 0) {
  console.error("verses.json is empty or not an array");
  process.exit(1);
}

// Validate + map: verses.json -> shloks_gita columns.
const rows = [];
for (const [i, v] of verses.entries()) {
  const chapter = Number(v.chapter);
  const verse = Number(v.verse);
  const sanskrit = v.sloka;
  const transliteration = v.transliteration ?? null;
  const hindi = v.meaning?.hi ?? null;
  const english = v.meaning?.en ?? null;
  if (!Number.isInteger(chapter) || !Number.isInteger(verse) || !sanskrit || !english) {
    console.error(`Row ${i} invalid (chapter=${v.chapter} verse=${v.verse}) — skipped`);
    continue;
  }
  rows.push({ chapter, verse, sanskrit, transliteration, hindi, english, meaning: english });
}

console.log(`Loaded ${verses.length} verses from verses.json, mapped ${rows.length} rows.`);

// Duplicate check (should be 0 for the shipped file).
const seen = new Set();
const dups = rows.filter((r) => {
  const k = `${r.chapter}:${r.verse}`;
  if (seen.has(k)) return true;
  seen.add(k);
  return false;
});
if (dups.length) console.warn(`WARNING: ${dups.length} duplicate (chapter,verse) keys — last wins.`);

if (DRY) {
  console.log("Dry run — first row that would be upserted:");
  console.log(JSON.stringify(rows[0], null, 2).slice(0, 800));
  process.exit(0);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BATCH = 100;
let upserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase
    .from("shloks_gita")
    .upsert(batch, { onConflict: "chapter,verse" });
  if (error) {
    console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
    process.exit(1);
  }
  upserted += batch.length;
  console.log(`Upserted ${upserted}/${rows.length}`);
}

// Verify.
const { count, error } = await supabase.from("shloks_gita").select("id", { count: "exact", head: true });
if (error) {
  console.error("Verify failed:", error.message);
  process.exit(1);
}
console.log(`Done. shloks_gita now holds ${count} rows (expected >= ${rows.length}).`);
console.log("Next: run backend/db/gita_chapters.sql in Supabase SQL Editor for chapter names/summaries.");
