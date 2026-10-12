// Sanatan API — Veda mantra import (full data).
// Reads <veda>.json (e.g. rigveda.json) and loads it into the matching
// shloks_<veda> table. No repeated data is stored: row `id` and
// `sanskrit_name` from the JSON are derived from/lived in code + the
// public.vedas table, so they are skipped. Hindi passes through as-is
// (null stays null — never invented here).
//
// Usage:
//   cd backend
//   node db/import_vedas.js rigveda            # wipe + load rigveda.json
//   node db/import_vedas.js rigveda --dry-run  # validate, touches nothing
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const TABLES = {
  rigveda: "shloks_rigveda",
  yajurveda: "shloks_yajurveda",
  samaveda: "shloks_samaveda",
  atharvaveda: "shloks_atharvaveda",
};

const veda = (process.argv[2] || "").toLowerCase();
const DRY = process.argv.includes("--dry-run");

if (!TABLES[veda]) {
  console.error(`Usage: node db/import_vedas.js <${Object.keys(TABLES).join("|")}> [--dry-run]`);
  process.exit(1);
}
const table = TABLES[veda];

const doc = JSON.parse(readFileSync(join(ROOT, `${veda}.json`), "utf-8"));
const mantras = doc.mantras;
if (!Array.isArray(mantras) || mantras.length === 0) {
  console.error(`${veda}.json has no mantras array`);
  process.exit(1);
}

// Validate + map to table columns (id/sanskrit_name skipped by design).
const rows = [];
for (const [i, m] of mantras.entries()) {
  const mandala = Number(m.mandala);
  const sukta = Number(m.sukta);
  const mantra = Number(m.mantra);
  if (!Number.isInteger(mandala) || !Number.isInteger(sukta) || !Number.isInteger(mantra) || !m.sanskrit) {
    console.error(`Row ${i} invalid — skipped`);
    continue;
  }
  rows.push({
    mandala,
    sukta,
    mantra,
    sanskrit: m.sanskrit,
    transliteration: m.transliteration ?? null,
    english: m.translations?.english ?? null,
    hindi: m.translations?.hindi ?? null,
  });
}

console.log(`Loaded ${mantras.length}, mapped ${rows.length} rows for ${table}.`);

const seen = new Set();
const dups = rows.filter((r) => {
  const k = `${r.mandala}:${r.sukta}:${r.mantra}`;
  if (seen.has(k)) return true;
  seen.add(k);
  return false;
});
if (dups.length) {
  console.error(`ABORT: ${dups.length} duplicate keys`);
  process.exit(1);
}

if (DRY) {
  console.log("Dry run OK — first row:", JSON.stringify(rows[0]).slice(0, 200) + "...");
  process.exit(0);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Wipe test/demo rows so the table holds exactly the file's data.
const { error: delErr } = await supabase.from(table).delete().neq("id", 0);
if (delErr) {
  console.error("Wipe failed:", delErr.message);
  process.exit(1);
}
console.log(`Wiped ${table} (test/demo rows removed).`);

const BATCH = 500;
let done = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const { error } = await supabase.from(table).insert(rows.slice(i, i + BATCH));
  if (error) {
    console.error(`Batch ${i} failed:`, error.message);
    process.exit(1);
  }
  done += Math.min(BATCH, rows.length - i);
  console.log(`Inserted ${done}/${rows.length}`);
}

const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
console.log(`Done. ${table} now holds ${count} rows (expected ${rows.length}).`);
