import crypto from "crypto";

/**
 * Application-level encryption for sensitive fields at rest (AES-256-GCM,
 * authenticated). Use this for anything that must not be readable straight from
 * the database dump — e.g. OAuth/refresh tokens, 2FA secrets, third-party API
 * keys, or PII you are contractually required to encrypt.
 *
 * Key: DATA_ENCRYPTION_KEY — a base64 (or hex) string decoding to exactly 32
 * bytes. Generate one with:  openssl rand -base64 32
 *
 * Format of the returned string:  v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 * The version prefix lets us rotate algorithms/keys later without ambiguity.
 */

const VERSION = "v1";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length

function getKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error("DATA_ENCRYPTION_KEY is not set");
  // Accept base64 or hex; both must decode to 32 bytes.
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must decode to 32 bytes (256 bits)");
  return key;
}

/** True when an encryption key is configured. Lets callers degrade gracefully. */
export function encryptionConfigured(): boolean {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) return false;
  try { getKey(); return true; } catch { return false; }
}

/** Encrypt a UTF-8 string. Returns a self-describing token safe to store as text. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

/**
 * Decrypt a token produced by {@link encrypt}. Throws if the token is malformed
 * or authentication fails (tampered ciphertext / wrong key) — never returns
 * partial or unauthenticated data.
 */
export function decrypt(token: string): string {
  const parts = token.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("Unrecognized ciphertext format");
  const [, ivB64, tagB64, ctB64] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

/** Encrypt only if a key is configured; otherwise return the value unchanged. */
export function encryptIfConfigured(plaintext: string): string {
  return encryptionConfigured() ? encrypt(plaintext) : plaintext;
}
