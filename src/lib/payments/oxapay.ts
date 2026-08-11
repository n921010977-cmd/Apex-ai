// ─── OxaPay — крипто-приём оплаты (USDT и др.) ────────────────────────────────
// Актуальный Payment API v1 (docs.oxapay.com/api-reference/payment/generate-invoice):
//   POST https://api.oxapay.com/v1/payment/invoice
//   auth: заголовок `merchant_api_key`
//   body: amount, currency, lifetime, callback_url, return_url, order_id, ...
//   resp: data.track_id, data.payment_url
//
// Webhook (docs.oxapay.com/webhook): OxaPay шлёт POST на callback_url и кладёт в
// заголовок `HMAC` подпись sha512 от СЫРОГО тела, посчитанную на MERCHANT API
// KEY (отдельного webhook-секрета у OxaPay нет).
//
// Ключ задаётся только в окружении сервера (НЕ во frontend):
//   OXAPAY_MERCHANT_KEY — merchant API key (им же проверяется подпись webhook)

import crypto from "crypto";

const API_BASE = process.env.OXAPAY_API_BASE?.trim() || "https://api.oxapay.com";

export function oxapayConfigured(): boolean {
  return Boolean(process.env.OXAPAY_MERCHANT_KEY?.trim());
}

export interface CreatedPayment {
  trackId: string;
  payLink: string;
}

/** Создаёт счёт (invoice) и возвращает ссылку на оплату + track_id. */
export async function createPayment(params: {
  amountUsd: number;
  orderId: string;
  description: string;
  callbackUrl: string;
  returnUrl: string;
}): Promise<CreatedPayment> {
  const key = process.env.OXAPAY_MERCHANT_KEY?.trim();
  if (!key) throw new Error("OXAPAY_MERCHANT_KEY не задан");

  const res = await fetch(`${API_BASE}/v1/payment/invoice`, {
    method: "POST",
    headers: { merchant_api_key: key, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: params.amountUsd,
      currency: "USD",
      lifetime: 60,            // минут на оплату (docs: 15–2880)
      fee_paid_by_payer: 1,    // комиссию сети платит покупатель
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      description: params.description,
      order_id: params.orderId,
    }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let json: { data?: Record<string, unknown>; message?: string } & Record<string, unknown> = {};
  try { json = JSON.parse(text); } catch { /* ниже отдадим текст ошибки */ }

  // Ответ v1 приходит в конверте { data: {...}, message, status }; на всякий
  // случай поддерживаем и плоскую форму (легаси-совместимость).
  const data = (json.data ?? json) as Record<string, unknown>;
  const payLink = (data.payment_url ?? data.payLink) as string | undefined;
  const trackId = (data.track_id ?? data.trackId) as string | number | undefined;

  if (!res.ok || !payLink) {
    const reason = (json.message as string) || text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(`OxaPay ${res.status}: ${reason}`);
  }
  return { trackId: String(trackId ?? ""), payLink };
}

/**
 * Проверяет подпись webhook OxaPay: HMAC-SHA512 от сырого тела на merchant-ключе,
 * значение приходит в заголовке `HMAC`. Сравнение — constant-time.
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
