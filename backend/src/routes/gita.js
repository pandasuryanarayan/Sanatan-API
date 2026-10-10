// Bhagavad Gita endpoints.
import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const GITA_CHAPTERS = 18;

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
    const { data, error } = await supabaseAdmin
      .from("shloks_gita")
      .select("chapter");
    if (error) throw error;
    const counts = {};
    (data || []).forEach((r) => { counts[r.chapter] = (counts[r.chapter] || 0) + 1; });
    const chapters = Array.from({ length: GITA_CHAPTERS }, (_, i) => i + 1).map((n) => ({
      id: n,
      name: `Chapter ${n}`,
      verses_available: counts[n] || 0,
    }));
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
    const { data, error } = await supabaseAdmin
      .from("shloks_gita")
      .select("*")
      .eq("chapter", id)
      .order("verse", { ascending: true });
    if (error) throw error;
    res.json({
      id: `gita_chapter_${id}`,
      source: "Bhagavad Gita",
      chapter: id,
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
