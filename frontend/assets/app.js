/* =========================================================
   Sanatan API — shared frontend runtime
   The backend serves these pages AND the API from one domain, so config
   loads same-origin from /api/config — no URLs, files, or per-host setup.
   Call `await Sanatan.ready()` before touching auth on every page.
   ========================================================= */
(function () {
  // Stable reference: pages read S.cfg any time after ready().
  const CFG = {};

  let sb = null;
  let sbForUrl = "";
  let readyPromise = null;

  async function loadConfig() {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      if (r.ok) Object.assign(CFG, await r.json());
    } catch {}
    CFG.API_BASE = "";
    return CFG;
  }

  function ready() {
    if (!readyPromise) readyPromise = loadConfig();
    return readyPromise;
  }

  /* ---------- Supabase client ---------- */
  // supabase-js UMD is loaded via <script> on each page; it exposes window.supabase.createClient
  function getClient() {
    if (sb && sbForUrl === CFG.SUPABASE_URL) return sb;
    if (!window.supabase || !window.supabase.createClient) {
      console.warn("[Sanatan] supabase-js not loaded on this page.");
      return null;
    }
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
      console.warn("[Sanatan] backend config not loaded yet — await Sanatan.ready() first.");
      return null;
    }
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    sbForUrl = CFG.SUPABASE_URL;
    return sb;
  }

  /* ---------- Auth ---------- */
  async function getUser() {
    const c = getClient();
    if (!c) return null;
    const { data } = await c.auth.getUser();
    return data ? data.user : null;
  }

  async function requireAuth() {
    const user = await getUser();
    if (!user) {
      window.location.href = "login.html";
      return null;
    }
    return user;
  }

  async function logout() {
    const c = getClient();
    if (c) await c.auth.signOut();
    // Drop the cached API key too — otherwise logged-out pages keep
    // acting (and announcing) as if a key were still in use.
    try { localStorage.removeItem("sanatan_last_key"); } catch {}
    window.location.href = "login.html";
  }

  /* ---------- Backend API helper (Bearer = Supabase access token) ---------- */
  // options.timeout (ms) aborts slow requests so a stalled poll fails fast
  // instead of overlapping the next one.
  async function api(path, options = {}) {
    const c = getClient();
    let token = "";
    if (c) {
      const { data } = await c.auth.getSession();
      token = data && data.session ? data.session.access_token : "";
    }
    const ctrl = new AbortController();
    const killer = options.timeout ? setTimeout(() => ctrl.abort(), options.timeout) : null;
    try {
      const res = await fetch(CFG.API_BASE + path, {
        method: options.method || "GET",
        headers: Object.assign(
          { "Content-Type": "application/json", Authorization: "Bearer " + token },
          options.headers || {}
        ),
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (!res.ok) {
        const err = new Error((data && data.error) || "Request failed (" + res.status + ")");
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (e) {
      if (e && e.name === "AbortError") throw new Error("Request timed out — slow network?");
      throw e;
    } finally {
      if (killer) clearTimeout(killer);
    }
  }

  /* ---------- UI utils ---------- */
  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function fmtRelative(iso) {
    if (!iso) return "Never";
    const d = new Date(iso);
    if (isNaN(d)) return "Never";
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  // sanatan-a8f3k9p2l6q1x5z7  ->  sanatan-…x5z7
  function maskKey(preview, last4) {
    if (preview) return preview;
    if (last4) return "sanatan-••••••••" + last4;
    return "sanatan-••••••••";
  }

  function showMsg(el, text, type = "error") {
    if (!el) return;
    el.textContent = text;
    el.className = "msg show " + (type === "ok" ? "ok" : "error");
  }
  function hideMsg(el) { if (el) el.className = "msg"; }

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) { const o = btn.textContent; btn.textContent = "Copied!"; setTimeout(() => (btn.textContent = o), 1400); }
      return true;
    } catch {
      return false;
    }
  }

  /* ---------- Mobile top-nav hamburger (auto-wires any .nav-toggle) ---------- */
  function wireNav() {
    document.querySelectorAll(".nav-toggle").forEach((btn) => {
      const header = btn.closest("header.nav");
      if (!header) return;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = header.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    // Tapping a link (or anywhere outside) closes the menu.
    document.querySelectorAll("header.nav .nav-links a").forEach((a) => {
      a.addEventListener("click", () => {
        const header = a.closest("header.nav");
        if (header) {
          header.classList.remove("open");
          const btn = header.querySelector(".nav-toggle");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    });
    document.addEventListener("click", (e) => {
      document.querySelectorAll("header.nav.open").forEach((h) => {
        if (!h.contains(e.target)) {
          h.classList.remove("open");
          const btn = h.querySelector(".nav-toggle");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireNav);
  } else {
    wireNav();
  }

  /* ---------- Mobile sidebar ---------- */
  function wireSidebar() {    const toggle = $(".menu-toggle");
    const bar = $(".sidebar");
    if (!toggle || !bar) return;
    toggle.addEventListener("click", () => bar.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 820 && bar.classList.contains("open") &&
          !bar.contains(e.target) && !toggle.contains(e.target)) bar.classList.remove("open");
    });
  }

  /* ---------- Navbar avatar ---------- */
  function getDisplayName(user) {
    if (!user) return "";
    const m = user.user_metadata || {};
    return String(m.name || m.full_name || m.display_name || "").trim();
  }

  // First letter of name, else first letter of email, else "R".
  function getInitial(user) {
    const name = getDisplayName(user);
    const src = (name || (user && user.email) || "").trim();
    return (src ? src[0] : "R").toUpperCase();
  }

  // If a #navCta (Login) link exists and a session is active,
  // swap it for a circular avatar linking to profile.html.
  async function wireNavAvatar() {
    const cta = $("#navCta");
    if (!cta) return null;
    const user = await getUser();
    if (!user) return null;
    const a = document.createElement("a");
    a.href = "profile.html";
    a.className = "avatar";
    a.id = "navAvatar";
    a.title = getDisplayName(user) || (user && user.email) || "Profile";
    a.textContent = getInitial(user);
    cta.replaceWith(a);
    return user;
  }

  /* ---------- Expose ---------- */
  window.Sanatan = {
    cfg: CFG, ready, getClient, getUser, requireAuth, logout, api,
    $, $$, esc, fmtDate, fmtRelative, maskKey, showMsg, hideMsg, copyText, wireSidebar,
    getDisplayName, getInitial, wireNavAvatar,
  };
})();
