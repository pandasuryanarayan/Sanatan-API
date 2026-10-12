// Bhagavad Gita endpoints.
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const GITA_CHAPTERS = 18;

// Chapter metadata lives in public.gita_chapters (see
// backend/db/gita_chapters.sql). If that table is missing or empty
// (fresh clone with only schema.sql), endpoints fall back to "Chapter N"
// so the API keeps working.
async function getChaptersMap() {
  try {
    const { data, error } = await supabaseAdmin.from("gita_chapters").select("*");
    if (error) throw error;
    const map = new Map();
    for (const c of data || []) map.set(c.chapter_number, c);
    return map;
  } catch {
    return new Map();
  }
}

function fmtChapter(n, meta, available) {
  if (!meta) {
    return { id: n, chapter_number: n, eng_name: `Chapter ${n}`, verses_available: available };
  }
  return {
    id: n,
    chapter_number: n,
    eng_name: meta.eng_name,
    sanskrit_name: meta.sanskrit_name,
    meaning: { en: meta.meaning_en, hi: meta.meaning_hi },
    summary: { en: meta.summary_en, hi: meta.summary_hi },
    verses_count: meta.verses_count,
    verses_available: available,
  };
}

function fmtGita(row) {
  return {
    id: `gita_${row.chapter}_${row.verse}`,
    source: "Bhagavad Gita",
    chapter: row.chapter,
    verse: row.verse,
    sanskrit: row.sanskrit,
    transliteration: row.transliteration,
    translations: { hindi: row.hindi, english: row.english },
    meaning: row.meaning ?? row.english,
  };
}

// GET /gita/chapters — list all chapters with verse counts.
router.get("/chapters", async (_req, res, next) => {
  try {
    const [{ data, error }, meta] = await Promise.all([
      supabaseAdmin.from("shloks_gita").select("chapter"),
      getChaptersMap(),
    ]);
    if (error) throw error;
    const counts = {};
    (data || []).forEach((r) => { counts[r.chapter] = (counts[r.chapter] || 0) + 1; });
    const chapters = Array.from({ length: GITA_CHAPTERS }, (_, i) => i + 1).map((n) =>
      fmtChapter(n, meta.get(n), counts[n] || 0)
    );
    res.json({ source: "Bhagavad Gita", total_chapters: GITA_CHAPTERS, chapters });
  } catch (e) { next(e); }
});

// GET /gita/chapters/:id — chapter meta + its verses.
router.get("/chapters/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1 || id > GITA_CHAPTERS) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    const [{ data, error }, meta] = await Promise.all([
      supabaseAdmin
        .from("shloks_gita")
        .select("*")
        .eq("chapter", id)
        .order("verse", { ascending: true }),
      getChaptersMap(),
    ]);
    if (error) throw error;
    const info = fmtChapter(id, meta.get(id), (data || []).length);
    res.json({
      id: `gita_chapter_${id}`,
      source: "Bhagavad Gita",
      chapter: id,
      chapter_number: info.chapter_number,
      eng_name: info.eng_name,
      ...(info.sanskrit_name ? {
        sanskrit_name: info.sanskrit_name,
        meaning: info.meaning,
        summary: info.summary,
        verses_count: info.verses_count,
      } : {}),
      verses_available: (data || []).length,
      verses: (data || []).map(fmtGita),
    });
  } catch (e) { next(e); }
});

// GET /gita/chapters/:id/verses/:verseId — one verse.
router.get("/chapters/:id/verses/:verseId", async (req, res, next) => {
  try {
    const chapter = Number(req.params.id);
    const verse = Number(req.params.verseId);
    const { data, error } = await supabaseAdmin
      .from("shloks_gita")
      .select("*")
      .eq("chapter", chapter)
      .eq("verse", verse)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Verse not found" });
    res.json(fmtGita(data));
  } catch (e) { next(e); }
});

// GET /gita/random — a random verse.
router.get("/random", async (_req, res, next) => {
  try {
    const { count, error: cErr } = await supabaseAdmin
      .from("shloks_gita")
      .select("id", { count: "exact", head: true });
    if (cErr) throw cErr;
    if (!count) return res.status(404).json({ error: "No verses loaded yet" });
    const offset = Math.floor(Math.random() * count);
    const { data, error } = await supabaseAdmin
      .from("shloks_gita")
      .select("*")
      .range(offset, offset)
      .single();
    if (error) throw error;
    res.json(fmtGita(data));
  } catch (e) { next(e); }
});

export default router;
