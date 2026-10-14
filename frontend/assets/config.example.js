/* =========================================================
   Sanatan API — Frontend configuration (OPTIONAL OVERRIDE)
   Only needed when serving these pages WITHOUT the node server
   (e.g. `python -m http.server`), which has no /api proxy.
   Copy to `config.js` (git-ignored, never commit it) and fill in.
   Normal path: the UI fetches /api/config from the backend at boot,
   so no file is needed at all.
   Note: the Supabase anon key is safe for browsers (RLS protects
   data).
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
