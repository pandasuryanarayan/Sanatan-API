// Sanatan API — Express entrypoint.
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import keysRouter from "./src/routes/keys.js";
import usageRouter from "./src/routes/usage.js";
import configRouter from "./src/routes/config.js";
import gitaRouter from "./src/routes/gita.js";
import vedasRouter from "./src/routes/vedas.js";
import searchRouter from "./src/routes/search.js";
import { apiKeyAuth } from "./src/middleware/apiKey.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// ---- CORS ----
// Public API product: any website may call it. Auth rides on per-key /
// per-session Bearer tokens (never cookies), so reflecting any origin is
// safe here — and the UI can move hosts without a backend redeploy.
// Set CORS_ORIGINS to a comma list only to restrict if ever needed.
const origins = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
}));

// ---- Health ----
app.get("/health", (_req, res) => res.json({ ok: true, service: "sanatan-api", version: "3.0.0" }));

// ---- Public client config (no auth — the UI needs it before login) ----
app.use("/api/config", configRouter);

// ---- Dashboard / account routes (Supabase session auth) ----
app.use("/api/keys", keysRouter);
app.use("/api/usage", usageRouter);

// ---- Public scripture API (x-api-key auth + rate limiting) ----
app.use("/api/v1/gita", apiKeyAuth, gitaRouter);
app.use("/api/v1/vedas", apiKeyAuth, vedasRouter);
app.use("/api/v1/search", apiKeyAuth, searchRouter);

// ---- Static UI (same domain as the API) ----
// Serves ../frontend so https://<host>/login.html and
// https://<host>/api/v1/... share one origin, like hosted products do.
// API routes above win (registered first); only real files are served here.
// Skipped silently when the folder isn't next to the backend (e.g. a
// backend-only container build), so the API never depends on it.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..", "frontend");
if (fs.existsSync(path.join(frontendDir, "index.html"))) {
  app.use(express.static(frontendDir, {
    index: "index.html",
    dotfiles: "ignore",
    maxAge: 0,
  }));
}

// ---- 404 + error handler ----
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 8080;
// Bind all interfaces by default — containers/proxies (Docker, Antideploy,
// Render, Railway) must reach the app from outside localhost. Local dev is
// unaffected: http://localhost still works when bound to 0.0.0.0.
const HOST = process.env.HOST || "0.0.0.0";
// Normalize display: 0.0.0.0 / :: mean "all interfaces" — show loopback instead
// so the console never confuses you when you opened http://localhost or http://127.0.0.1.
const displayHost = HOST === "0.0.0.0" || HOST === "::" ? "127.0.0.1" : HOST;
app.listen(PORT, HOST, () => {
  console.log(`ॐ  Sanatan API listening on http://${displayHost}:${PORT}`);
  console.log(`   → Local:    http://localhost:${PORT}`);
  console.log(`   → Loopback: http://127.0.0.1:${PORT}`);
  console.log(`   → Health:   http://${displayHost}:${PORT}/health`);
});
