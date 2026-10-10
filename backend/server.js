// Sanatan API — Express entrypoint.
import "dotenv/config";
import express from "express";
import cors from "cors";

import keysRouter from "./src/routes/keys.js";
import usageRouter from "./src/routes/usage.js";
import gitaRouter from "./src/routes/gita.js";
import vedasRouter from "./src/routes/vedas.js";
import searchRouter from "./src/routes/search.js";
import { apiKeyAuth } from "./src/middleware/apiKey.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// ---- CORS ----
const origins = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
}));

// ---- Health ----
app.get("/health", (_req, res) => res.json({ ok: true, service: "sanatan-api", version: "3.0.0" }));

// ---- Dashboard / account routes (Supabase session auth) ----
app.use("/api/keys", keysRouter);
app.use("/api/usage", usageRouter);

// ---- Public scripture API (x-api-key auth + rate limiting) ----
app.use("/api/v1/gita", apiKeyAuth, gitaRouter);
app.use("/api/v1/vedas", apiKeyAuth, vedasRouter);
app.use("/api/v1/search", apiKeyAuth, searchRouter);

// ---- 404 + error handler ----
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ॐ  Sanatan API listening on :${PORT}`));
