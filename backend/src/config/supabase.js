// Supabase admin client (service-role). Server-side only.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn("[config] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — DB calls will fail.");
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const TIERS = {
  free: {
    monthly: Number(process.env.FREE_TIER_MONTHLY || 1000),
    rps: Number(process.env.FREE_TIER_RPS || 10),
    maxKeys: Number(process.env.FREE_TIER_KEYS || 2),
  },
};

export const KEY_PREFIX = process.env.KEY_PREFIX || "sanatan-";
