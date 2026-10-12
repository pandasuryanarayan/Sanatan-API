/* =========================================================
   Sanatan API — Frontend configuration (EXAMPLE)
   Copy this file to `config.js` and fill in your values.
   `config.js` is git-ignored — never commit real credentials.
   Note: the Supabase anon key is safe for browsers (RLS protects
   data), but keep one config per deployment anyway.
   ========================================================= */
window.SANATAN_CONFIG = {
  // --- Supabase (from your Supabase project settings) ---
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY",

  // --- Backend API (your Express server, host-agnostic) ---
  // e.g. https://api.yourdomain.com  or  http://localhost:8080
  API_BASE: "http://localhost:8080",

  // --- Public docs display ---
  PUBLIC_API_BASE: "http://localhost:8080/api/v1",

  // Free-tier limits (display only; enforced server-side)
  FREE_TIER_MONTHLY: 1000,
  FREE_TIER_KEYS: 2,
  FREE_TIER_RPS: 10,
};
