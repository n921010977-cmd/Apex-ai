import crypto from "node:crypto";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { LINK_CODE_TTL_MS, MAX_LINK_ATTEMPTS } from "../config/constants.js";

// Account linking: user proves ownership of a Vertlix email by entering a
// one-time code we email them. On success we bind telegram_id → user.id.
// Reuses the app's Resend integration (raw fetch, no npm dep).

function hashCode(code: string): string {
  return crypto.createHmac("sha256", env.BOT_SECRET).update(code).digest("hex");
}

export async function startEmailLink(telegramId: bigint, email: string): Promise<{ ok: boolean; reason?: string }> {
  const addr = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return { ok: false, reason: "Некорректный email" };

  const user = await prisma.user.findUnique({ where: { email: addr }, select: { id: true } });
  // Do not reveal whether the account exists (anti-enumeration) — always "sent".
  if (!user) { void sendCodeEmail(addr, generateCode(), true); return { ok: true }; }

  const code = generateCode();
  await prisma.telegramLinkCode.deleteMany({ where: { telegramId } });
  await prisma.telegramLinkCode.create({
    data: { telegramId, email: addr, codeHash: hashCode(code), expiresAt: new Date(Date.now() + LINK_CODE_TTL_MS) },
  });
  await sendCodeEmail(addr, code, false);
  return { ok: true };
}

export async function verifyEmailLink(telegramId: bigint, code: string): Promise<{ ok: boolean; reason?: string; userId?: string; email?: string }> {
  const rec = await prisma.telegramLinkCode.findFirst({ where: { telegramId }, orderBy: { createdAt: "desc" } });
  if (!rec) return { ok: false, reason: "Код не запрашивался. Начните заново: /link" };
  if (rec.attempts >= MAX_LINK_ATTEMPTS) return { ok: false, reason: "Слишком много попыток. Начните заново: /link" };
  if (rec.expiresAt < new Date()) return { ok: false, reason: "Код истёк. Начните заново: /link" };

  if (hashCode(code.trim()) !== rec.codeHash) {
    await prisma.telegramLinkCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "Неверный код. Попробуйте ещё раз." };
  }
  const user = await prisma.user.findUnique({ where: { email: rec.email }, select: { id: true, email: true } });
  if (!user) return { ok: false, reason: "Аккаунт не найден." };
  await prisma.telegramLinkCode.deleteMany({ where: { telegramId } });
  return { ok: true, userId: user.id, email: user.email };
}

function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

async function sendCodeEmail(to: string, code: string, silent: boolean): Promise<void> {
  if (silent) return; // account doesn't exist — send nothing, stay generic
  if (!env.RESEND_API_KEY) { console.log(`[link] code for ${to}: ${code}`); return; }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM, to,
        subject: `Код привязки Telegram · Vertlix AI`,
        html: `<p>Ваш код для привязки Telegram к Vertlix AI: <b style="font-size:20px">${code}</b></p><p>Код действует 15 минут. Если это были не вы — проигнорируйте письмо.</p>`,
      }),
    });
  } catch (e) { console.error("[link] resend", e); }
}
