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
import { matchIntent, consumeIntent } from "@/lib/payments/intents";
import { logEvent } from "@/lib/analytics/server";
import type { PlanId } from "@/lib/plans";

const VALID_PLANS = new Set(["starter", "pro", "max"]);

// ─── Идемпотентность без БД ───────────────────────────────────────────────────
// В Supabase-режиме дубль webhook отсекает журнал платежей (`status = PAID`).
// Когда БД не настроена, ту же гарантию даёт отметка «track_id уже обработан»:
// Upstash (переживает рестарты и общий для инстансов) или память процесса.
const seenTracks = new Set<string>();

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** true = первый раз видим этот track_id; false = дубль, начислять нельзя. */
async function claimTrackId(trackId: string): Promise<boolean> {
  if (!trackId) return true; // без track_id дедупить не по чему — пропускаем
  if (upstashConfigured()) {
    try {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
        // SET NX — атомарно: только один вызов получит "OK". TTL 30 дней.
        body: JSON.stringify([["SET", `oxapay:track:${trackId}`, "1", "NX", "PX", 30 * 864e5]]),
        cache: "no-store",
      });
      const r = await res.json();
      return r?.[0]?.result === "OK";
    } catch { /* Redis недоступен — падаем в память ниже */ }
  }
  if (seenTracks.has(trackId)) return false;
  seenTracks.add(trackId);
  return true;
}

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
  email?: string;
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
    void logEvent("payment_failed", null, { track_id: trackId, status });
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
      await setEntitlement(record.user_id, record.plan as PlanId, 1,
        { paymentId: trackId, amount: record.amount, currency: record.currency });
      await consumeIntent(record.user_id);
      void logEvent("payment_success", record.user_id, { plan: record.plan, amount: record.amount, track_id: trackId });
      void logEvent("subscription_started", record.user_id, { plan: record.plan });
    }
    return NextResponse.json({ success: true, ack: "activated" });
  }

  // 5. Журнала нет — активируем по order_id, который мы же зашили при создании
  //    счёта (userId::plan::ts). Подпись уже проверена. Дубль webhook по тому же
  //    track_id начислять нельзя — сначала занимаем отметку.
  if (!(await claimTrackId(trackId))) {
    return NextResponse.json({ success: true, ack: "duplicate" });
  }
  const parsed = orderId ? parseOrderId(orderId) : null;
  if (parsed && VALID_PLANS.has(parsed.plan)) {
    await setEntitlement(parsed.userId, parsed.plan as PlanId, 1,
      { paymentId: trackId, amount: Number(p.amount) || undefined, currency: p.currency });
    await consumeIntent(parsed.userId);
    void logEvent("payment_success", parsed.userId, { plan: parsed.plan, amount: Number(p.amount) || null, track_id: trackId });
    void logEvent("subscription_started", parsed.userId, { plan: parsed.plan });
    return NextResponse.json({ success: true, ack: "activated" });
  }

  // 6. Оплата по СТАТИЧНОЙ ссылке: order_id нет. Сопоставляем с намерением,
  //    записанным при клике по тарифу — по email плательщика или по сумме.
  const payerEmail = typeof p.email === "string" ? p.email : undefined;
  const paidAmount = Number(p.amount);
  const { intent, reason } = await matchIntent(payerEmail, paidAmount);
  if (intent) {
    await setEntitlement(intent.userId, intent.plan, 1,
      { paymentId: trackId, amount: intent.amount, currency: "USD" });
    await consumeIntent(intent.userId);
    void logEvent("payment_success", intent.userId, { plan: intent.plan, amount: intent.amount, track_id: trackId, matched: reason });
    void logEvent("subscription_started", intent.userId, { plan: intent.plan });
    console.log(`[payments] paid track=${trackId} user=${intent.userId} plan=${intent.plan} matched=${reason} at=${new Date().toISOString()}`);
    return NextResponse.json({ success: true, ack: "activated", matchedBy: reason });
  }

  // Не смогли определить плательщика (нет намерения или несколько совпадений) —
  // тариф выдаётся вручную через /admin. Причина — в логи, без персональных данных.
  console.warn(`[payments] paid link payment not matched (${reason}) — grant manually in /admin`);
  return NextResponse.json({ success: true, ack: "unmatched", reason });
}
