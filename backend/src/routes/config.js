// Public client config — values safe for browsers only.
// The anon key is public by design (RLS protects the data); the
// service-role key must NEVER appear here. No auth: the UI needs this
// before login to even build its Supabase client.
import { Router } from "express";
import { TIERS } from "../config/supabase.js";

const router = Router();

router.get("/", (req, res) => {
  const host = req.headers.host || "";
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim() || "http";
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    API_BASE: "",
    PUBLIC_API_BASE: host ? `${proto}://${host}/api/v1` : "",
    FREE_TIER_MONTHLY: TIERS.free.monthly,
    FREE_TIER_KEYS: TIERS.free.maxKeys,
    FREE_TIER_RPS: TIERS.free.rps,
  });
});

export default router;
