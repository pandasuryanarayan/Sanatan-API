// User-scoped API key management (requires a valid Supabase session).
import { Router } from "express";
import { supabaseAdmin, TIERS } from "../config/supabase.js";
import { generateApiKey, hashKey, lookupHash, keyPreview, lastFour } from "../lib/keys.js";
import { requireUser } from "../middleware/requireUser.js";

const router = Router();
const TIER = TIERS.free;

// List the caller's keys (never returns the plaintext or the hash).
router.get("/", requireUser, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, key_preview, last_four, is_active, created_at, last_used_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ keys: data || [] });
  } catch (e) { next(e); }
});

// Generate a new key. Plaintext returned exactly once.
router.post("/generate", requireUser, async (req, res, next) => {
  try {
    const name = (req.body && req.body.name) ? String(req.body.name).slice(0, 60) : "Default";

    const { count, error: cErr } = await supabaseAdmin
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .eq("is_active", true);
    if (cErr) throw cErr;
    if ((count || 0) >= TIER.maxKeys) {
      return res.status(403).json({ error: `Free tier allows ${TIER.maxKeys} active keys. Revoke one first.` });
    }

    const plain = generateApiKey(16);
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        user_id: req.user.id,
        name,
        key_hash: await hashKey(plain),
        key_lookup: lookupHash(plain),
        key_preview: keyPreview(plain),
        last_four: lastFour(plain),
        is_active: true,
      })
      .select("id, name, key_preview, created_at")
      .single();
    if (error) throw error;

    // `key` is shown to the user once and never stored in plaintext.
    res.status(201).json({ key: plain, meta: data });
  } catch (e) { next(e); }
});

// Revoke a key (soft delete — keeps the audit trail).
router.delete("/:id", requireUser, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
