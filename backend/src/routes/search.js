// Full-text-ish search across Gita and Vedas.
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// GET /search?q=agni&limit=20
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Query param 'q' is required" });
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const like = `%${q}%`;

    const [gita, vedas] = await Promise.all([
      supabaseAdmin
        .from("shloks_gita")
        .select("*")
        .or(`sanskrit.ilike.${like},transliteration.ilike.${like},hindi.ilike.${like},english.ilike.${like}`)
        .limit(limit),
      supabaseAdmin
        .from("shloks_vedas")
        .select("*")
        .or(`sanskrit.ilike.${like},transliteration.ilike.${like},translation.ilike.${like}`)
        .limit(limit),
    ]);
    if (gita.error) throw gita.error;
    if (vedas.error) throw vedas.error;

    const results = [
      ...(gita.data || []).map((r) => ({
        id: `gita_${r.chapter}_${r.verse}`,
        source: "Bhagavad Gita",
        sanskrit: r.sanskrit,
        transliteration: r.transliteration,
        translations: { hindi: r.hindi, english: r.english },
      })),
      ...(vedas.data || []).map((r) => ({
        id: `${r.veda_name}_${r.mandala}_${r.sukta}_${r.mantra}`,
        source: r.veda_name.replace(/^\w/, (c) => c.toUpperCase()),
        sanskrit: r.sanskrit,
        transliteration: r.transliteration,
        translations: { english: r.translation },
      })),
    ].slice(0, limit);

    res.json({ query: q, count: results.length, results });
  } catch (e) { next(e); }
});

export default router;
