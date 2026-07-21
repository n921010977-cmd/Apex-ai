import crypto from "crypto";

// ─── Stateless email-verification tokens ──────────────────────────────────────
// Same HMAC-SHA256 scheme as reset-token, but the payload carries a distinct
// purpose tag ("verify") so a password-reset link can never be replayed as an
// email-verification link (or vice-versa). No DB row needed; self-expiring.

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "vertlix-dev-secret-change-me";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signVerifyToken(email: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({ e: email.toLowerCase(), p: "verify", x: Date.now() + TTL_MS })));
  const sig = b64url(crypto.createHmac("sha256", secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

/** Returns the email if the token is a valid, unexpired verification token, else null. */
export function verifyVerifyToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = b64url(crypto.createHmac("sha256", secret()).update(payload).digest());
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (data.p !== "verify" || !data.e || typeof data.x !== "number" || Date.now() > data.x) return null;
    return String(data.e);
  } catch {
    return null;
  }
}
