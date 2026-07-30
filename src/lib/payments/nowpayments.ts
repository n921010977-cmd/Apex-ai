// ─── NOWPayments — крипто-приём оплаты (USDT и др.) ───────────────────────────
// Некастодиальный шлюз: клиент платит на странице NOWPayments, деньги идут на
// твой кошелёк (адрес вывода — Trust Wallet — настраивается в кабинете
// NOWPayments, в коде его нет). Мы только создаём счёт и проверяем webhook (IPN).
//
// Ключи задаются в окружении (НЕ в коде):
//   NOWPAYMENTS_API_KEY    — для создания счёта
//   NOWPAYMENTS_IPN_SECRET — для проверки подписи webhook
//   NEXT_PUBLIC_APP_URL    — базовый URL сайта (для callback/return)

import crypto from "crypto";

const API_BASE = process.env.NOWPAYMENTS_API_BASE?.trim() || "https://api.nowpayments.io/v1";

export function nowpaymentsConfigured(): boolean {
  return Boolean(process.env.NOWPAYMENTS_API_KEY?.trim());
}

export interface CreatedInvoice {
  id: string;
  invoice_url: string;
}

/** Создаёт счёт (hosted invoice) и возвращает ссылку на оплату. */
export async function createInvoice(params: {
  amountUsd: number;
  orderId: string;
  description: string;
  ipnUrl: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CreatedInvoice> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY не задан");

  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: params.amountUsd,
      price_currency: "usd",
      order_id: params.orderId,
      order_description: params.description,
      ipn_callback_url: params.ipnUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NOWPayments invoice ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: string; invoice_url: string };
  return { id: String(data.id), invoice_url: data.invoice_url };
}

/**
 * Проверяет подпись IPN-webhook.
 * NOWPayments считает HMAC-SHA512 от JSON тела с ключами, отсортированными по
 * алфавиту (верхний уровень), на секрете IPN. Сравнение — constant-time.
 */
export function verifyIpnSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!secret || !signature) return false;

  let obj: Record<string, unknown>;
  try { obj = JSON.parse(rawBody); } catch { return false; }

  const sortedKeys = Object.keys(obj).sort();
  const sortedJson = JSON.stringify(obj, sortedKeys);

  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(sortedJson);
  const digest = hmac.digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
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
