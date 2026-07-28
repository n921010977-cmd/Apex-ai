import crypto from "crypto";
import { authSecret as secret } from "@/lib/auth-secret";

// ─── Stateless password-reset tokens ──────────────────────────────────────────
// A reset link carries a signed token instead of a DB row: base64url(payload)
// + "." + HMAC-SHA256(payload, NEXTAUTH_SECRET). No table needed, and the token
// self-expires. Changing NEXTAUTH_SECRET invalidates all outstanding links.

const TTL_MS = 60 * 60 * 1000; // 1 hour

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signResetToken(email: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({ e: email.toLowerCase(), x: Date.now() + TTL_MS })));
  const sig = b64url(crypto.createHmac("sha256", secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

/** Returns the email if the token is valid and unexpired, else null. */
export function verifyResetToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = b64url(crypto.createHmac("sha256", secret()).update(payload).digest());
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (!data.e || typeof data.x !== "number" || Date.now() > data.x) return null;
    return String(data.e);
  } catch {
    return null;
  }
}
