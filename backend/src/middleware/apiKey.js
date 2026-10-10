// Public-API authentication + rate limiting + usage logging.
// Reads `x-api-key`, verifies it, enforces limits, and logs the call.
import { supabaseAdmin, TIERS, KEY_PREFIX } from "../config/supabase.js";
import { verifyKey, lookupHash } from "../lib/keys.js";
import { incrWithTTL } from "../config/redis.js";

const TIER = TIERS.free;

function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function apiKeyAuth(req, res, next) {
  const raw = req.headers["x-api-key"];
  if (!raw || typeof raw !== "string" || !raw.startsWith(KEY_PREFIX)) {
    return res.status(401).json({ error: "Missing or malformed x-api-key" });
  }

  // 1) O(1) lookup by deterministic hash, then bcrypt-verify.
  const { data: row, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, user_id, key_hash, is_active")
    .eq("key_lookup", lookupHash(raw))
    .maybeSingle();

  if (error) return next(error);
  if (!row) return res.status(401).json({ error: "Invalid API key" });

  const ok = await verifyKey(raw, row.key_hash);
  if (!ok) return res.status(401).json({ error: "Invalid API key" });
  if (!row.is_active) return res.status(403).json({ error: "API key revoked" });

  // 2) Per-second burst limit.
  const secCount = await incrWithTTL(`rl:sec:${row.id}`, 1);
  if (secCount > TIER.rps) {
    res.set("Retry-After", "1");
    return res.status(429).json({ error: "Rate limit exceeded (requests/second)" });
  }

  // 3) Monthly quota.
  const mk = monthKey();
  const monthCount = await incrWithTTL(`usage:${row.id}:${mk}`, 32 * 24 * 3600);
  if (monthCount > TIER.monthly) {
    return res.status(429).json({ error: "Monthly quota exceeded. Upgrade for more." });
  }

  // 4) Standard rate-limit headers.
  const remaining = Math.max(0, TIER.monthly - monthCount);
  res.set("X-RateLimit-Limit", String(TIER.monthly));
  res.set("X-RateLimit-Remaining", String(remaining));
  res.set("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 60));

  req.apiKey = { id: row.id, userId: row.user_id };

  // 5) Log usage + touch last_used_at once the response is done.
  res.on("finish", () => {
    const endpoint = req.originalUrl.split("?")[0];
    supabaseAdmin
      .from("api_usage_logs")
      .insert({
        user_id: row.user_id,
        key_id: row.id,
        endpoint,
        status_code: res.statusCode,
      })
      .then(() => {}, () => {});
    supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id)
      .then(() => {}, () => {});
  });

  next();
}
