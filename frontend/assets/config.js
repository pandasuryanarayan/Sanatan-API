/* =========================================================
   Sanatan API — Frontend configuration
   Fill these in for your deployment. Nothing secret here:
   the Supabase anon key is safe to expose (RLS protects data).
   ========================================================= */
window.SANATAN_CONFIG = {
  // --- Supabase (from your Supabase project settings) ---
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",

  // --- Backend API (your Express server, host-agnostic) ---
  // e.g. https://api.yourdomain.com  or  http://localhost:8080
  API_BASE: "http://localhost:8080",

  // --- Public docs display ---
  PUBLIC_API_BASE: "https://yourdomain.com/api/v1",

  // Free-tier limits (display only; enforced server-side)
  FREE_TIER_MONTHLY: 1000,
  FREE_TIER_KEYS: 2,
  FREE_TIER_RPS: 10,
};
