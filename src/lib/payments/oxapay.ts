// ─── OxaPay — крипто-приём оплаты (USDT и др.), без KYC ───────────────────────
// Некастодиальный шлюз: клиент платит на странице OxaPay, деньги идут на твой
// кошелёк (адрес вывода — Trust Wallet — настраивается в кабинете OxaPay, в коде
// его нет). Мы создаём счёт и проверяем webhook по подписи HMAC.
//
// Ключ задаётся в окружении (НЕ в коде):
//   OXAPAY_MERCHANT_KEY — merchant API key (им же OxaPay подписывает webhook)
//   NEXT_PUBLIC_APP_URL — базовый URL сайта (для callback/return)

import crypto from "crypto";

const API_BASE = process.env.OXAPAY_API_BASE?.trim() || "https://api.oxapay.com";

export function oxapayConfigured(): boolean {
  return Boolean(process.env.OXAPAY_MERCHANT_KEY?.trim());
}

export interface CreatedPayment {
  trackId: string;
  payLink: string;
}

/** Создаёт счёт и возвращает ссылку на оплату (payLink). */
export async function createPayment(params: {
  amountUsd: number;
  orderId: string;
  description: string;
  callbackUrl: string;
  returnUrl: string;
}): Promise<CreatedPayment> {
  const key = process.env.OXAPAY_MERCHANT_KEY?.trim();
  if (!key) throw new Error("OXAPAY_MERCHANT_KEY не задан");

  const res = await fetch(`${API_BASE}/merchants/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant: key,
      amount: params.amountUsd,
      currency: "USD",
      lifeTime: 60,          // минут на оплату
      feePaidByPayer: 1,     // комиссию сети платит покупатель
      callbackUrl: params.callbackUrl,
      returnUrl: params.returnUrl,
      description: params.description,
      orderId: params.orderId,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OxaPay ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { result: number; message?: string; trackId?: number | string; payLink?: string };
  if (data.result !== 100 || !data.payLink) {
    throw new Error(`OxaPay отклонил счёт: ${data.message ?? "unknown"}`);
  }
  return { trackId: String(data.trackId ?? ""), payLink: data.payLink };
}

/**
 * Проверяет подпись webhook OxaPay.
 * OxaPay считает HMAC-SHA512 от СЫРОГО тела запроса на merchant-ключе и кладёт
 * результат (hex) в заголовок `HMAC`. Сравнение — constant-time.
 */
export function verifyCallbackSignature(rawBody: string, hmacHeader: string | null): boolean {
  const key = process.env.OXAPAY_MERCHANT_KEY?.trim();
  if (!key || !hmacHeader) return false;

  const digest = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(digest.toLowerCase(), "utf8");
  const b = Buffer.from(hmacHeader.toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Собирает order_id, кодирующий пользователя и тариф. */
export function buildOrderId(userId: string, plan: string): string {
  return `${userId}::${plan}::${Date.now()}`;
}

/** Разбирает order_id обратно. */
export function parseOrderId(orderId: string): { userId: string; plan: string } | null {
  const parts = orderId.split("::");
  if (parts.length < 2) return null;
  return { userId: parts[0], plan: parts[1] };
}
