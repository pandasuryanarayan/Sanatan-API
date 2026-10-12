// Veda endpoints — one lean table per Veda (no repeated data).
// Veda names/totals live once in public.vedas; mantra row IDs
// (rigveda_1_1_1) are built here, never stored.
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// Public veda id -> mantra table. NEVER pass raw user input to .from() —
// every handler validates req.params.vedaName against this map first.
export const VEDA_TABLES = {
  rigveda: "shloks_rigveda",
  yajurveda: "shloks_yajurveda",
  samaveda: "shloks_samaveda",
  atharvaveda: "shloks_atharvaveda",
};

export const VEDA_IDS = Object.keys(VEDA_TABLES);

// Canonical metadata lives in public.vedas (see backend/db/vedas.sql).
// Empty map = table not migrated yet; endpoints fall back to bare names.
export async function getVedasMap() {
  try {
    const { data, error } = await supabaseAdmin.from("vedas").select("*");
    if (error) throw error;
    const map = new Map();
    for (const v of data || []) map.set(v.veda_id, v);
    return map;
  } catch {
    return new Map();
  }
}

export function vedaDisplay(id, meta) {
  if (meta && meta.eng_name) return meta.eng_name;
  return id.replace(/^\w/, (c) => c.toUpperCase());
}

function fmtVedaMeta(id, meta, available) {
  return {
    id,
    eng_name: vedaDisplay(id, meta),
    sanskrit_name: (meta && meta.sanskrit_name) || null,
    description: meta ? { en: meta.description_en, hi: meta.description_hi } : null,
    total_mantras: (meta && meta.total_mantras) || null,
    mantras_available: available,
  };
}

export function fmtMantra(veda, displayName, row) {
  return {
    id: `${veda}_${row.mandala}_${row.sukta}_${row.mantra}`,
    source: displayName,
    veda,
    mandala: row.mandala,
    sukta: row.sukta,
    mantra: row.mantra,
    sanskrit: row.sanskrit,
    transliteration: row.transliteration,
    translations: { hindi: row.hindi, english: row.english },
    meaning: row.english ?? row.hindi ?? null,
  };
}

// GET /vedas — list the four Vedas with metadata + loaded counts.
router.get("/", async (_req, res, next) => {
  try {
    const [counts, meta] = await Promise.all([
      Promise.all(
        VEDA_IDS.map(async (v) => {
          const { count, error } = await supabaseAdmin
            .from(VEDA_TABLES[v])
            .select("id", { count: "exact", head: true });
          if (error) throw error;
          return [v, count || 0];
        })
      ).then((entries) => Object.fromEntries(entries)),
      getVedasMap(),
    ]);
    res.json({ vedas: VEDA_IDS.map((v) => fmtVedaMeta(v, meta.get(v), counts[v] || 0)) });
  } catch (e) { next(e); }
});

// GET /vedas/:vedaName — browse mantras, ordered (limit/offset paging).
router.get("/:vedaName", async (req, res, next) => {
  try {
    const veda = req.params.vedaName.toLowerCase();
    const table = VEDA_TABLES[veda];
    if (!table) return res.status(404).json({ error: "Veda not found" });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [{ data, error }, meta] = await Promise.all([
      supabaseAdmin
        .from(table)
        .select("mandala,sukta,mantra,sanskrit,transliteration,english,hindi")
        .order("mandala", { ascending: true })
        .order("sukta", { ascending: true })
        .order("mantra", { ascending: true })
        .range(offset, offset + limit - 1),
      getVedasMap(),
    ]);
    if (error) throw error;
    const m = meta.get(veda);
    const info = fmtVedaMeta(veda, m, 0);
    res.json({
      id: veda,
      source: info.eng_name,
      eng_name: info.eng_name,
      sanskrit_name: info.sanskrit_name,
      description: info.description,
      total_mantras: info.total_mantras,
      limit,
      offset,
      mantras_available: (data || []).length,
      mantras: (data || []).map((r) => fmtMantra(veda, info.eng_name, r)),
    });
  } catch (e) { next(e); }
});

// GET /vedas/:vedaName/mandala/:m/sukta/:s/mantra/:mm — one mantra.
router.get("/:vedaName/mandala/:m/sukta/:s/mantra/:mm", async (req, res, next) => {
  try {
    const veda = req.params.vedaName.toLowerCase();
    const table = VEDA_TABLES[veda];
    if (!table) return res.status(404).json({ error: "Veda not found" });
    const { m, s, mm } = req.params;
    const [{ data, error }, meta] = await Promise.all([
      supabaseAdmin
        .from(table)
        .select("*")
        .eq("mandala", Number(m))
        .eq("sukta", Number(s))
        .eq("mantra", Number(mm))
        .maybeSingle(),
      getVedasMap(),
    ]);
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "mantra not found" });
    res.json(fmtMantra(veda, vedaDisplay(veda, meta.get(veda)), data));
  } catch (e) { next(e); }
});

export default router;
