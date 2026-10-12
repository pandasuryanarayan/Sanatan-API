// Veda endpoints (Rigveda, Yajurveda, Samaveda, Atharvaveda).
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const VEDAS = ["rigveda", "yajurveda", "samaveda", "atharvaveda"];

// Canonical metadata lives in public.vedas (see backend/db/vedas.sql).
// If that table is missing or empty, endpoints fall back to bare names
// so the API keeps working.
async function getVedasMap() {
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

function fmtVedaMeta(id, meta, available) {
  const fallbackName = id.replace(/^\w/, (c) => c.toUpperCase());
  return {
    id,
    eng_name: (meta && meta.eng_name) || fallbackName,
    sanskrit_name: (meta && meta.sanskrit_name) || null,
    description: meta ? { en: meta.description_en, hi: meta.description_hi } : null,
    total_mantras: (meta && meta.total_mantras) || null,
    mantras_available: available,
  };
}

function fmtVeda(row) {
  return {
    id: `${row.veda_name}_${row.mandala}_${row.sukta}_${row.mantra}`,
    source: row.veda_name.replace(/^\w/, (c) => c.toUpperCase()),
    veda: row.veda_name,
    mandala: row.mandala,
    sukta: row.sukta,
    mantra: row.mantra,
    sanskrit: row.sanskrit,
    transliteration: row.transliteration,
    translations: { english: row.translation },
    meaning: row.translation,
  };
}

// GET /vedas — list the four Vedas with available mantra counts.
router.get("/", async (_req, res, next) => {
  try {
    const [{ data, error }, meta] = await Promise.all([
      supabaseAdmin.from("shloks_vedas").select("veda_name"),
      getVedasMap(),
    ]);
    if (error) throw error;
    const counts = {};
    (data || []).forEach((r) => { counts[r.veda_name] = (counts[r.veda_name] || 0) + 1; });
    res.json({
      vedas: VEDAS.map((v) => fmtVedaMeta(v, meta.get(v), counts[v] || 0)),
    });
  } catch (e) { next(e); }
});

// GET /vedas/:vedaName — browse a single Veda.
router.get("/:vedaName", async (req, res, next) => {
  try {
    const veda = req.params.vedaName.toLowerCase();
    if (!VEDAS.includes(veda)) return res.status(404).json({ error: "Veda not found" });
    const [{ data, error }, meta] = await Promise.all([
      supabaseAdmin
        .from("shloks_vedas")
        .select("*")
        .eq("veda_name", veda)
        .order("mandala", { ascending: true })
        .order("sukta", { ascending: true })
        .order("mantra", { ascending: true })
        .limit(50),
      getVedasMap(),
    ]);
    if (error) throw error;
    const info = fmtVedaMeta(veda, meta.get(veda), 0);
    res.json({
      id: veda,
      source: info.eng_name,
      eng_name: info.eng_name,
      sanskrit_name: info.sanskrit_name,
      description: info.description,
      total_mantras: info.total_mantras,
      mantras_available: (data || []).length,
      mantras: (data || []).map(fmtVeda),
    });
  } catch (e) { next(e); }
});

// GET /vedas/:vedaName/mandala/:m/sukta/:s/mantra/:mm — one mantra.
router.get("/:vedaName/mandala/:m/sukta/:s/mantra/:mm", async (req, res, next) => {
  try {
    const veda = req.params.vedaName.toLowerCase();
    const { m, s, mm } = req.params;
    const { data, error } = await supabaseAdmin
      .from("shloks_vedas")
      .select("*")
      .eq("veda_name", veda)
      .eq("mandala", Number(m))
      .eq("sukta", Number(s))
      .eq("mantra", Number(mm))
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Mantra not found" });
    res.json(fmtVeda(data));
  } catch (e) { next(e); }
});

export default router;
