// Redis (Upstash) connection with a safe in-memory fallback for local dev.
import Redis from "ioredis";

let client = null;

if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL, {
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });
  client.on("error", (e) => console.warn("[redis] error:", e.message));
  console.log("[redis] connected via REDIS_URL");
} else {
  console.warn("[redis] REDIS_URL not set — using in-memory limiter (single-instance dev only).");
}

/* ---------- In-memory fallback ---------- */
const mem = new Map(); // key -> { count, expiresAt }

function memIncr(key, ttlSeconds) {
  const now = Date.now();
  const cur = mem.get(key);
  if (!cur || cur.expiresAt <= now) {
    mem.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  cur.count += 1;
  return cur.count;
}

/**
 * Increment a counter with a TTL. Returns the new count.
 * Works identically against Redis or the in-memory fallback.
 */
export async function incrWithTTL(key, ttlSeconds) {
  if (!client) return memIncr(key, ttlSeconds);
  const pipeline = client.multi();
  pipeline.incr(key);
  pipeline.ttl(key);
  const [count, ttl] = await pipeline.exec().then((r) => [r[0][1], r[1][1]]);
  if (ttl === -1) await client.expire(key, ttlSeconds);
  return Number(count);
}

export async function getCount(key) {
  if (!client) {
    const cur = mem.get(key);
    return cur && cur.expiresAt > Date.now() ? cur.count : 0;
  }
  return Number((await client.get(key)) || 0);
}

export { client as redis };
