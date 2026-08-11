// ─── Обработка webhook OxaPay (общая для обоих роутов) ────────────────────────
// По docs.oxapay.com/webhook: OxaPay шлёт POST (application/json) на callback_url
// с заголовком `HMAC` — sha512-подписью сырого тела на merchant API key.
// Статусы платежа: New / Waiting / Confirming / Paid / Expired / Failed
// («Paid» = деньги зачислены мерчанту, можно выдавать товар).
//
// Порядок: подпись → парсинг → маппинг статуса → (если есть журнал) проверка
// суммы/валюты и идемпотентность → активация тарифа.

import { NextResponse } from "next/server";
import { verifyCallbackSignature, parseOrderId } from "@/lib/payments/oxapay";
import { setEntitlement } from "@/lib/payments/entitlement";
import { getPaymentByTrackId, markPaymentStatus, type PaymentStatus } from "@/lib/payments/records";
import type { PlanId } from "@/lib/plans";

const VALID_PLANS = new Set(["starter", "pro", "max"]);

/** OxaPay-статус → внутренний. Неизвестные/промежуточные — PENDING (только ack). */
function mapStatus(s: string): PaymentStatus | "PENDING" {
  switch (s.trim().toLowerCase()) {
    case "paid":       return "PAID";
    case "expired":    return "EXPIRED";
    case "failed":     return "FAILED";
    case "canceled":
    case "cancelled":  return "CANCELED";
    default:           return "PENDING"; // new / waiting / confirming / ...
  }
}

interface WebhookPayload {
  status?: string;
  type?: string;
  track_id?: string | number;
  trackId?: string | number;   // легаси-формат
  order_id?: string;
  orderId?: string;            // легаси-формат
  amount?: string | number;
  currency?: string;
}

export async function handleOxapayWebhook(req: Request): Promise<NextResponse> {
  const raw = await req.text();
  const sig = req.headers.get("HMAC") ?? req.headers.get("hmac");

  // 1. Подпись. Никаким данным без неё не верим.
  if (!verifyCallbackSignature(raw, sig)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let p: WebhookPayload;
  try { p = JSON.parse(raw); } catch { return NextResponse.json({ success: false }, { status: 400 }); }

  const trackId = String(p.track_id ?? p.trackId ?? "");
  const orderId = String(p.order_id ?? p.orderId ?? "");
  const status = mapStatus(String(p.status ?? ""));

  // 2. Промежуточные статусы просто подтверждаем (OxaPay перестаёт ретраить).
  if (status === "PENDING") return NextResponse.json({ success: true, ack: "pending" });

  // 3. Терминальные неуспехи — фиксируем в журнале, тариф не трогаем.
  if (status !== "PAID") {
    if (trackId) await markPaymentStatus(trackId, status);
    return NextResponse.json({ success: true, ack: status.toLowerCase() });
  }

  // 4. Paid. Сначала пробуем журнал (есть при настроенной БД).
  const record = trackId ? await getPaymentByTrackId(trackId) : null;

  if (record) {
    // Повторный webhook по уже зачисленному платежу — не начисляем дважды.
    if (record.status === "PAID") {
      return NextResponse.json({ success: true, ack: "duplicate" });
    }
    // Сверяем сумму и валюту с тем, что МЫ выставляли (цене с фронта не верим —
    // её там и нет). Допуск 1% на округления курса.
    const amt = Number(p.amount);
    const currencyOk = !p.currency || p.currency.toUpperCase() === record.currency.toUpperCase();
    const amountOk = Number.isFinite(amt) && amt >= record.amount * 0.99;
    if (!currencyOk || !amountOk) {
      await markPaymentStatus(trackId, "AMOUNT_MISMATCH");
      return NextResponse.json({ success: true, ack: "amount_mismatch" });
    }
    const { updated } = await markPaymentStatus(trackId, "PAID");
    if (!updated) return NextResponse.json({ success: true, ack: "duplicate" });

    if (VALID_PLANS.has(record.plan)) {
      await setEntitlement(record.user_id, record.plan as PlanId, 1);
    }
    return NextResponse.json({ success: true, ack: "activated" });
  }

  // 5. Журнала нет (демо-режим без БД) — активируем по order_id, который мы же
  //    зашили при создании счёта (userId::plan::ts). Подпись уже проверена.
  const parsed = orderId ? parseOrderId(orderId) : null;
  if (parsed && VALID_PLANS.has(parsed.plan)) {
    await setEntitlement(parsed.userId, parsed.plan as PlanId, 1);
    return NextResponse.json({ success: true, ack: "activated" });
  }

  return NextResponse.json({ success: true, ack: "ignored" });
}
