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

- 📜 **Gita + 4 Vedas** — 700 Gita verses, Rigveda, Yajurveda, Samaveda, Atharvaveda as versioned JSON.
- 🔑 **Hashed API keys** — `sanatan-` prefixed keys, bcrypt-verified, SHA-256 lookup, shown once, revocable.
- 🚦 **Rate limiting + quotas** — per-second burst + monthly quota via Redis (Upstash) with in-memory dev fallback. Standard `X-RateLimit-*` headers.
- 📊 **Developer dashboard** — key management, usage stats, 7-day chart, recent-call log.
- 📖 **Stripe-style docs** — auto-fills the logged-in user's key into every code sample (cURL / JS).
- 🕉 **Auth flow** — Supabase email auth with verification (`welcome.html` success screen).
- 🎨 **Glossy static UI** — no build step. Host the `frontend/` folder anywhere.
- 🧩 **Extensible schema** — Upanishads / Ramayana / Puranas fit as new `source` values + route groups.

---

## 🗂 Project structure

```text
sanatan-api/
├── frontend/                 # Static site — host anywhere (Netlify, Vercel, S3, nginx)
│   ├── index.html            # Landing: hero, code preview, how-it-works, scriptures
│   ├── login.html            # Register / login (Supabase email + verification)
│   ├── welcome.html          # "Verification Successful" screen
│   ├── dashboard.html        # Stats, Chart.js usage graph, recent calls
│   ├── keys.html             # Generate / revoke API keys
│   ├── docs.html             # API reference, auto-fills your key
│   ├── profile.html          # Name, email, Supabase user ID
│   └── assets/
│       ├── style.css         # Spiritual Glossy design system
│       ├── app.js            # Shared auth / API / UI helpers
│       ├── config.js         # ← Supabase + backend URLs (edit this)
│       ├── om-logo.svg       # Golden Om logo (dark glyph on gold disc)
│       └── favicon.svg
└── backend/                  # Node + Express — host anywhere (Render, Railway, Fly, VPS)
    ├── server.js             # Express entrypoint, CORS, /health, route mounts
    ├── package.json
    ├── .env.example          # Copy to .env and fill in
    ├── db/
    │   ├── schema.sql        # Tables, indexes, RLS, signup trigger
    │   └── seed.sql          # Starter Gita + Rigveda sample rows
    └── src/
        ├── config/supabase.js  # Admin client + tier limits
        ├── config/redis.js     # Upstash Redis with in-memory fallback
        ├── lib/keys.js         # generate / bcrypt-hash / SHA-256 lookup
        ├── middleware/requireUser.js  # Supabase session guard
        ├── middleware/apiKey.js       # x-api-key auth + limits + usage log
        └── routes/keys.js, usage.js, gita.js, vedas.js, search.js
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
   - `backend/db/schema.sql`
   - `backend/db/seed.sql`
3. **Authentication → Providers → Email** → enable email confirmation.
4. **Authentication → URL Configuration** → allow-list your redirects, e.g.:
   - `http://localhost:5500/welcome.html`
   - `https://yourdomain.com/welcome.html`
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

Health check: `GET http://localhost:8080/health` → `{ "ok": true }`.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No (default `8080`) | Server port |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB access — keep secret |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated frontend origins, e.g. `https://yourdomain.com` |
| `REDIS_URL` | No | Upstash/Redis URL. Blank = in-memory limiter (single-instance dev only) |
| `REDIS_TLS` | No | Set `true` for Upstash TLS |
| `FREE_TIER_MONTHLY` / `FREE_TIER_RPS` / `FREE_TIER_KEYS` | No | Quota tuning (defaults `1000` / `10` / `2`) |
| `KEY_PREFIX` | No | Default `sanatan-` |

### 3. Frontend

No build step — plain static files.

1. Edit `frontend/assets/config.js`:

```js
window.SANATAN_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
  API_BASE: "https://api.yourdomain.com",       // Express backend
  PUBLIC_API_BASE: "https://yourdomain.com/api/v1",
  FREE_TIER_MONTHLY: 1000,
  FREE_TIER_KEYS: 2,
  FREE_TIER_RPS: 10,
};
```

2. Serve locally:

```bash
cd frontend
python3 -m http.server 5500
# open http://localhost:5500
```

Or deploy the folder as-is to Netlify / Vercel / Cloudflare Pages / S3 / nginx.

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
| GET | `/vedas` | Four Vedas with `mantras_available` counts |
| GET | `/vedas/{vedaName}` | Browse one Veda (`rigveda` \| `yajurveda` \| `samaveda` \| `atharvaveda`, first 50) |
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
  "translations": { "english": "..." },
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

`seed.sql` ships a small verified sample. For the complete Gita (700 verses) and Vedas, bulk-import from an authoritative, attributable source into:

- `shloks_gita (chapter, verse, sanskrit, transliteration, hindi, english, meaning)` — unique `(chapter, verse)`
- `shloks_vedas (veda_name, mandala, sukta, mantra, sanskrit, transliteration, translation)` — unique `(veda_name, mandala, sukta, mantra)`

Schema, indexes, and endpoints already match — no code change needed. Keep translations attributed to their source.

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
