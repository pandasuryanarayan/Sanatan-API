// Full-text-ish search across Gita (1 table) and Vedas (4 tables).
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { VEDA_TABLES, VEDA_IDS, getVedasMap, vedaDisplay, fmtMantra } from "./vedas.js";

const router = Router();

// GET /search?q=agni&limit=20
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Query param 'q' is required" });
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const like = `%${q}%`;
    const vedaCols = "mandala,sukta,mantra,sanskrit,transliteration,english,hindi";
    const vedaOr = `sanskrit.ilike.${like},transliteration.ilike.${like},english.ilike.${like},hindi.ilike.${like}`;

    const [gita, meta, ...vedaHits] = await Promise.all([
      supabaseAdmin
        .from("shloks_gita")
        .select("*")
        .or(`sanskrit.ilike.${like},transliteration.ilike.${like},hindi.ilike.${like},english.ilike.${like}`)
        .limit(limit),
      getVedasMap(),
      ...VEDA_IDS.map((v) =>
        supabaseAdmin.from(VEDA_TABLES[v]).select(vedaCols).or(vedaOr).limit(limit)
          .then((r) => ({ veda: v, ...r }))
      ),
    ]);
    if (gita.error) throw gita.error;
    for (const h of vedaHits) if (h.error) throw h.error;

    const results = [
      ...(gita.data || []).map((r) => ({
        id: `gita_${r.chapter}_${r.verse}`,
        source: "Bhagavad Gita",
        sanskrit: r.sanskrit,
        transliteration: r.transliteration,
        translations: { hindi: r.hindi, english: r.english },
      })),
      ...vedaHits.flatMap((h) =>
        (h.data || []).map((r) => {
          const m = fmtMantra(h.veda, vedaDisplay(h.veda, meta.get(h.veda)), r);
          return {
            id: m.id,
            source: m.source,
            sanskrit: m.sanskrit,
            transliteration: m.transliteration,
            translations: m.translations,
          };
        })
      ),
    ].slice(0, limit);

    res.json({ query: q, count: results.length, results });
  } catch (e) { next(e); }
});

export default router;
