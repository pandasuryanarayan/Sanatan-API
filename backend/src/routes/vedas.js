// Veda endpoints (Rigveda, Yajurveda, Samaveda, Atharvaveda).
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const VEDAS = ["rigveda", "yajurveda", "samaveda", "atharvaveda"];

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
    const { data, error } = await supabaseAdmin.from("shloks_vedas").select("veda_name");
    if (error) throw error;
    const counts = {};
    (data || []).forEach((r) => { counts[r.veda_name] = (counts[r.veda_name] || 0) + 1; });
    res.json({
      vedas: VEDAS.map((v) => ({
        id: v,
        name: v.replace(/^\w/, (c) => c.toUpperCase()),
        mantras_available: counts[v] || 0,
      })),
    });
  } catch (e) { next(e); }
});

// GET /vedas/:vedaName — browse a single Veda.
router.get("/:vedaName", async (req, res, next) => {
  try {
    const veda = req.params.vedaName.toLowerCase();
    if (!VEDAS.includes(veda)) return res.status(404).json({ error: "Veda not found" });
    const { data, error } = await supabaseAdmin
      .from("shloks_vedas")
      .select("*")
      .eq("veda_name", veda)
      .order("mandala", { ascending: true })
      .order("sukta", { ascending: true })
      .order("mantra", { ascending: true })
      .limit(50);
    if (error) throw error;
    res.json({
      id: veda,
      source: veda.replace(/^\w/, (c) => c.toUpperCase()),
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
