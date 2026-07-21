import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { encrypt, decrypt, encryptionConfigured } from "@/lib/crypto/encryption";

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

/** Generate a new TOTP secret + QR code for the enrollment screen. Not persisted yet. */
export async function generateTwoFactorSetup(email: string): Promise<TwoFactorSetup> {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: "Vertlix AI", label: email, secret });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
  return { secret, otpauthUrl, qrDataUrl };
}

/** Encrypt a TOTP secret for storage. Throws if DATA_ENCRYPTION_KEY isn't configured — 2FA secrets must never be stored in plaintext. */
export function encryptSecret(secret: string): string {
  if (!encryptionConfigured()) throw new Error("DATA_ENCRYPTION_KEY is not configured — cannot store 2FA secrets safely");
  return encrypt(secret);
}

export async function verifyTotpCode(secretEnc: string, code: string): Promise<boolean> {
  try {
    const secret = decrypt(secretEnc);
    const token = code.replace(/\s/g, "");
    const result = await verify({ secret, token, epochTolerance: 30 }); // ±1 step (30s) clock drift
    return result.valid;
  } catch {
    return false;
  }
}

/** Generate N human-friendly one-time backup codes (e.g. "A1B2C-3D4E5") and their bcrypt hashes. */
export async function generateBackupCodes(count = 8): Promise<{ plain: string[]; hashed: string[] }> {
  const plain: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  const hashed = await Promise.all(plain.map(c => bcrypt.hash(c, 10)));
  return { plain, hashed };
}

/** Check a candidate backup code against the stored hashes. Returns the index consumed, or -1. */
export async function matchBackupCode(hashedCodes: string[], candidate: string): Promise<number> {
  const normalized = candidate.trim().toUpperCase();
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(normalized, hashedCodes[i])) return i;
  }
  return -1;
}
