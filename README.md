# ॐ Sanatan API — Ancient Wisdom. Modern API.

A developer-first REST API for the **Bhagavad Gita** and all **four Vedas**, served as clean JSON with Sanskrit, transliteration, and Hindi / English meaning.

Built with a decoupled **Node.js + Express backend (Supabase + Redis)** and a dependency-free **static frontend (HTML + Tailwind CDN + vanilla JS)** with a glossy spiritual design system.

![Node](https://img.shields.io/badge/Node-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-black?logo=express)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-Static%20HTML%20%2B%20Tailwind-FF6A00)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

- 📜 **Gita + 4 Vedas** — 701 Gita verses, 10,552 Rigveda mantras (more Vedas loading), served as clean JSON.
- 🔑 **Hashed API keys** — `sanatan-` prefixed keys, bcrypt-verified, SHA-256 lookup, shown once, revocable.
- 🚦 **Rate limiting + quotas** — per-second burst + monthly quota via Redis (Upstash) with in-memory dev fallback. Standard `X-RateLimit-*` headers.
- 📊 **Live developer dashboard** — stats, 7-day chart and recent-call log auto-refresh every 20s (with countdown), no page reload.
- 📖 **Stripe-style docs** — auto-fills the logged-in user's key into every code sample (cURL / JS).
- 🕉 **Auth flow** — Supabase email auth with verification + forgot-password reset (`welcome.html`, `reset.html`).
- 🎨 **Glossy static UI** — no build step. Host the `frontend/` folder anywhere.
- 🧩 **Extensible schema** — Upanishads / Ramayana / Puranas fit as new tables + route groups.

---

## 🗂 Project structure

```text
sanatan-api/
├── verses.json                 # Gita corpus (701 verses, source for import)
├── chapters_summary.json       # 18 chapter names + EN/HI summaries (source for import)
├── chapters.json               # Chapter index (verse counts)
├── vedas.json                  # 4 Veda names + EN/HI descriptions + canonical totals
├── rigveda.json                # Rigveda corpus (10,552 mantras, source for import)
├── frontend/                   # Static site — host anywhere (Netlify, Vercel, S3, nginx)
│   ├── index.html            # Landing: hero, code preview, how-it-works, scriptures
│   ├── login.html            # Register / login (Supabase email + verification)
│   ├── reset.html            # Set-new-password (landing page for reset emails)
│   ├── welcome.html          # "Verification Successful" screen
│   ├── dashboard.html        # Stats, Chart.js usage graph, recent calls
│   ├── keys.html             # Generate / revoke API keys
│   ├── docs.html             # API reference, auto-fills your key
│   ├── profile.html          # Name, email, Supabase user ID
│   └── assets/
│       ├── style.css         # Spiritual Glossy design system
│       ├── app.js            # Shared auth / API / UI helpers (fetch + XHR polling)
│       ├── om-logo.svg       # Golden Om logo (dark glyph on gold disc)
│       └── favicon.svg
└── backend/                  # Node + Express — host anywhere (Render, Railway, Fly, VPS)
    ├── server.js             # Express entrypoint, CORS, /health, route mounts
    ├── package.json
    ├── .env.example          # Copy to .env and fill in (git-ignored)
    ├── db/
    │   ├── schema.sql        # Base tables, indexes, RLS, signup trigger
    │   ├── seed.sql          # Starter sample rows (day-one data)
    │   ├── gita_chapters.sql # gita_chapters table + 18 real chapters (run once in SQL Editor)
    │   ├── vedas.sql         # vedas table + 4 canonical totals (run once in SQL Editor)
    │   ├── vedas_tables.sql  # shloks_rigveda/yajurveda/samaveda/atharvaveda + trigram indexes; retires shloks_vedas
    │   ├── import_gita.js    # Upserts verses.json → shloks_gita (run: `node db/import_gita.js`)
    │   └── import_vedas.js   # Wipe + load: `node db/import_vedas.js <rigveda|yajurveda|samaveda|atharvaveda>`
    └── src/
        ├── config/supabase.js  # Admin client + tier limits
        ├── config/redis.js     # Upstash Redis with in-memory fallback
        ├── lib/keys.js         # generate / bcrypt-hash / SHA-256 lookup
        ├── middleware/requireUser.js  # Supabase session guard
        ├── middleware/apiKey.js       # x-api-key auth + limits + usage log
        └── routes/keys.js, usage.js, config.js (public UI config), gita.js, vedas.js, search.js
```

---

## 🚀 Quickstart

### Prerequisites

- Node.js `>= 18`
- A free [Supabase](https://supabase.com) project
- (Optional) An [Upstash](https://upstash.com) Redis URL for multi-instance rate limiting

### 1. Supabase setup (5 min)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run in order:
   - `backend/db/schema.sql` (base tables)
   - `backend/db/seed.sql` (starter samples)
   - `backend/db/gita_chapters.sql` (18 chapter metadata rows)
   - `backend/db/vedas.sql` (4 Veda metadata rows)
   - `backend/db/vedas_tables.sql` (per-Veda mantra tables + search indexes)
3. **Authentication → Providers → Email** → enable email confirmation.
4. **Authentication → URL Configuration** → allow-list your redirects, e.g.:
   - `http://localhost:5500/welcome.html`
   - `http://localhost:5500/reset.html`
   - `https://yourdomain.com/welcome.html`
   - `https://yourdomain.com/reset.html`
5. **Project Settings → API** → copy:
   - Project URL → frontend + backend
   - `anon` key → frontend only
   - `service_role` key → backend only (never ship to the browser)

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in your values (see table below)
npm install
npm run dev            # or: npm start
```

Health check: `GET http://127.0.0.1:8080/health` → `{ "ok": true }` (same as `http://localhost:8080/health`).

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No (default `8080`) | Server port |
| `HOST` | No (default `127.0.0.1`) | Bind address. `127.0.0.1` = localhost only (dev). Use `0.0.0.0` only for Docker/prod |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB access — keep secret |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated frontend origins, e.g. `https://yourdomain.com` |
| `REDIS_URL` | No | Upstash/Redis URL. Blank = in-memory limiter (single-instance dev only) |
| `REDIS_TLS` | No | Set `true` for Upstash TLS |
| `FREE_TIER_MONTHLY` / `FREE_TIER_RPS` / `FREE_TIER_KEYS` | No | Quota tuning (defaults `1000` / `10` / `2`) |
| `KEY_PREFIX` | No | Default `sanatan-` |

### 3. Frontend

Pure static files — HTML + CSS + JS, no Node, no build step, no config file.
The backend serves these pages itself (same domain as the API), so each page
boots from same-origin `/api/config` with zero per-host setup:

```bash
# One terminal does everything (needs backend/.env, see .env.example)
cd backend
node server.js
# UI:  http://localhost:8080/login.html
# API: http://localhost:8080/api/v1/gita/chapters/2/verses/47
```

Hosting the UI elsewhere (Netlify, Vercel, S3, nginx) also works: the API is
open to any origin (Bearer-token auth, no cookies), so no backend change is
needed — but that UI then needs its own backend URL, which this setup avoids
by serving both from one place.

---

## 🔌 API reference

Base URL: `https://yourdomain.com/api/v1` · Auth header: `x-api-key: sanatan-xxxxxxxxxxxxxxxx`

```bash
curl https://yourdomain.com/api/v1/gita/chapters/2/verses/47 \
  -H "x-api-key: sanatan-a8f3k9p2l6q1x5z7"
```

### Public scripture endpoints (require `x-api-key`)

| Method | Path | Description |
|---|---|---|
| GET | `/gita/chapters` | All 18 chapters with `verses_available` counts |
| GET | `/gita/chapters/{id}` | Chapter meta + ordered verses |
| GET | `/gita/chapters/{id}/verses/{verseId}` | Single verse (e.g. `/gita/chapters/2/verses/47`) |
| GET | `/gita/random` | Random verse |
| GET | `/vedas` | Four Vedas with metadata, canonical totals + `mantras_available` |
| GET | `/vedas/{vedaName}` | Browse one Veda (`rigveda` \| `yajurveda` \| `samaveda` \| `atharvaveda`, `?limit=` default 50 max 200, `?offset=`) |
| GET | `/vedas/{vedaName}/mandala/{m}/sukta/{s}/mantra/{mm}` | Single mantra |
| GET | `/search?q=agni&limit=20` | Full-text-ish search across Gita + Vedas (max `limit=50`) |

### Dashboard endpoints (require Supabase session, not `x-api-key`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/keys` | List caller's keys (no plaintext/hashes) |
| POST | `/api/keys/generate` | Create key — plaintext returned **once** |
| DELETE | `/api/keys/:id` | Revoke key (soft delete, keeps audit trail) |
| GET | `/api/usage/stats` | Month total, today, quota, 7-day buckets, last 15 calls |

### Response shapes

Gita verse:

```json
{
  "id": "gita_2_47",
  "source": "Bhagavad Gita",
  "chapter": 2,
  "verse": 47,
  "sanskrit": "कर्मण्येवाधिकारस्ते...",
  "transliteration": "karmanyevadhikaraste...",
  "translations": { "hindi": "...", "english": "..." },
  "meaning": "..."
}
```

Veda mantra:

```json
{
  "id": "rigveda_1_1_1",
  "source": "Rigveda",
  "veda": "rigveda",
  "mandala": 1, "sukta": 1, "mantra": 1,
  "sanskrit": "...",
  "transliteration": "...",
  "translations": { "hindi": "...", "english": "..." },
  "meaning": "..."
}
```

### Rate limits & headers

Free tier defaults: **1,000 req/month · 10 req/sec burst · 2 active keys**.

Every public response carries:

```text
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1728576000
```

`429` = burst or monthly quota exceeded (`Retry-After: 1` on burst). `401` = missing/invalid key. `403` = revoked key or key cap reached.

---

## 🔒 How API keys work

1. Key = `sanatan-` + 16 random `[a-z0-9]` chars (`crypto.randomBytes`).
2. Backend stores a **bcrypt (cost 12)** hash for verification + a **SHA-256 lookup hash** for O(1) row fetch — plaintext is never persisted.
3. Plaintext is returned **once** on `POST /api/keys/generate`. The docs page caches it in `localStorage` only to pre-fill samples.
4. Requests verify via `key_lookup` → `bcrypt.compare`, then enforce burst + monthly counters, then log to `api_usage_logs` and touch `last_used_at`.

---

## 📦 Loading the full corpora

`seed.sql` ships a small verified sample. The real Gita data lives in
`verses.json` (701 verses) + `chapters_summary.json` (18 chapters) at the repo root.
Load them into Supabase once — upserts, so re-running is safe and demo rows get
overwritten:

```bash
# 1. Chapter metadata — paste backend/db/gita_chapters.sql
#    into the Supabase SQL Editor and run it (creates gita_chapters, 18 rows).

# 2. Verses — from backend/ (uses .env credentials):
node db/import_gita.js --dry-run   # validate mapping, touches nothing
node db/import_gita.js              # upserts 701 rows into shloks_gita
```

Column mapping (`verses.json` → `shloks_gita`):
`sloka→sanskrit`, `transliteration→transliteration`,
`meaning.hi→hindi`, `meaning.en→english + meaning`.
Unique key `(chapter, verse)` — no code change needed; `GET /gita/*`
serves chapter names/summaries from `gita_chapters` automatically
(falls back to `Chapter N` if the table isn't migrated yet).

Chapter response shape (`GET /gita/chapters`, `GET /gita/chapters/{id}`):

```json
{
  "id": 2,
  "chapter_number": 2,
  "eng_name": "Sankhya Yoga",
  "sanskrit_name": "सांख्य योग",
  "meaning": { "en": "...", "hi": "..." },
  "summary": { "en": "...", "hi": "..." },
  "verses_count": 72,
  "verses_available": 72
}
```

For the Vedas, load each corpus with its matching script (wipes + reloads that
Veda's table, so re-running is safe):

```bash
# 1. Metadata — paste backend/db/vedas.sql into the SQL Editor (4 rows).
# 2. Mantra tables — paste backend/db/vedas_tables.sql (creates the 4
#    shloks_* tables + trigram search indexes; migrates legacy demo rows).
# 3. Mantras — from backend/ (uses .env credentials):
node db/import_vedas.js rigveda --dry-run   # validate, touches nothing
node db/import_vedas.js rigveda              # loads rigveda.json (10,552 rows)
```

One lean table per Veda (`shloks_rigveda`, `shloks_yajurveda`,
`shloks_samaveda`, `shloks_atharvaveda`), each `(mandala, sukta, mantra,
sanskrit, transliteration, english, hindi)` with a trigram index for search.
Veda names/totals live once in `vedas`; row IDs (`rigveda_1_1_1`) are built
in code, never stored. Browse supports `?limit=` (default 50, max 200) +
`?offset=`. Keep translations attributed to their source.

---

## 🌍 Deployment notes

- **Frontend** and **backend** are decoupled — deploy independently.
- Frontend: any static host. Set `API_BASE` to your backend origin.
- Backend: any Node host. Set `CORS_ORIGINS` to your frontend origin(s), `SUPABASE_*` secrets, and `REDIS_URL` in production (the in-memory limiter does not share state across instances).
- Health check for load balancers: `GET /health`.

---

## 🛣 Roadmap

- Upanishads, Ramayana, Puranas as new sources
- Paid tiers + Stripe billing
- Webhooks, bulk export, GraphQL
- Official SDKs (JS / Python)

---

## 🤝 Contributing

PRs welcome. Keep verses faithful to source texts, attribute translations, and add/adjust seed data via SQL.

## 📄 License

MIT — free for personal and commercial use. If you publish verse translations at scale, credit their original translators.
