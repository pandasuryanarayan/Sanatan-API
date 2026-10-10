/* =========================================================
   Sanatan API — shared frontend runtime
   Loads Supabase, exposes auth guard + API helper + UI utils.
   Depends on: config.js  (window.SANATAN_CONFIG)
   ========================================================= */
(function () {
  const CFG = window.SANATAN_CONFIG || {};

  /* ---------- Supabase client ---------- */
  // supabase-js UMD is loaded via <script> on each page; it exposes window.supabase.createClient
  let sb = null;
  function getClient() {
    if (sb) return sb;
    if (!window.supabase || !window.supabase.createClient) {
      console.warn("[Sanatan] supabase-js not loaded on this page.");
      return null;
    }
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
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
    window.location.href = "login.html";
  }

  /* ---------- Backend API helper (Bearer = Supabase access token) ---------- */
  async function api(path, options = {}) {
    const c = getClient();
    let token = "";
    if (c) {
      const { data } = await c.auth.getSession();
      token = data && data.session ? data.session.access_token : "";
    }
    const res = await fetch(CFG.API_BASE + path, {
      method: options.method || "GET",
      headers: Object.assign(
        { "Content-Type": "application/json", Authorization: "Bearer " + token },
        options.headers || {}
      ),
      body: options.body ? JSON.stringify(options.body) : undefined,
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

  /* ---------- Mobile sidebar ---------- */
  function wireSidebar() {
    const toggle = $(".menu-toggle");
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
    cfg: CFG, getClient, getUser, requireAuth, logout, api,
    $, $$, esc, fmtDate, fmtRelative, maskKey, showMsg, hideMsg, copyText, wireSidebar,
    getDisplayName, getInitial, wireNavAvatar,
  };
})();
