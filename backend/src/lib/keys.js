// API key generation + hashing helpers.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { KEY_PREFIX } from "../config/supabase.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"; // a-z, 0-9

/** Generate `sanatan-` + 16 random alphanumeric chars. */
export function generateApiKey(length = 16) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return KEY_PREFIX + out;
}

/** bcrypt hash — the only form of the key we persist for verification. */
export function hashKey(plain) {
  return bcrypt.hash(plain, 12);
}

/** Constant-time-ish verification against the stored bcrypt hash. */
export function verifyKey(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Deterministic SHA-256 lookup hash.
 * bcrypt hashes can't be queried, so we store this alongside to find the row
 * in O(1) without ever keeping the plaintext key.
 */
export function lookupHash(plain) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

/** Display preview: sanatan-…x5z7 (last 4 chars visible). */
export function keyPreview(plain) {
  const last4 = plain.slice(-4);
  return KEY_PREFIX + "••••••••" + last4;
}

export function lastFour(plain) {
  return plain.slice(-4);
}
