// Sanatan frontend — zero-dependency static server for containers.
// Serves this directory over $PORT on 0.0.0.0. `/` maps to index.html.
//
// /assets/config.js is special: if the file exists on disk it is served
// as-is (local dev); otherwise it is generated from environment variables
// so deployed browsers get working config with nothing secret committed:
//   SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE, PUBLIC_API_BASE,
//   FREE_TIER_MONTHLY, FREE_TIER_KEYS, FREE_TIER_RPS
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

function num(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function buildConfigJs() {
  const cfg = {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    API_BASE: process.env.API_BASE || "",
    PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "",
    FREE_TIER_MONTHLY: num("FREE_TIER_MONTHLY", 1000),
    FREE_TIER_KEYS: num("FREE_TIER_KEYS", 2),
    FREE_TIER_RPS: num("FREE_TIER_RPS", 10),
  };
  return "window.SANATAN_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
}

function send(res, status, type, body, cache) {
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(body),
    ...(cache ? { "Cache-Control": cache } : {}),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  // Scripts/styles stay 'unsafe-inline' (pages use inline blocks + Tailwind CDN);
  // the policy still locks down framing, plugins, base URIs and network targets.
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sanatan-api.antideploy.app",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; "));
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
    return;
  }
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad request");
    return;
  }
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  // Generated config for deployed browsers (no secrets in the repo).
  if (urlPath === "/assets/config.js" && !fs.existsSync(file)) {
    const body = buildConfigJs();
    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": TYPES[".js"], "Content-Length": Buffer.byteLength(body) });
      res.end();
      return;
    }
    send(res, 200, TYPES[".js"], body, "no-store");
    return;
  }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": type, "Content-Length": st.size });
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": st.size });
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Sanatan frontend serving ${ROOT} on http://${HOST}:${PORT}`);
});
