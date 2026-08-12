import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";
import { createPayment, buildOrderId, oxapayConfigured } from "@/lib/payments/oxapay";
import { recordPaymentCreated } from "@/lib/payments/records";

// POST /api/payments/create — открывает оплату тарифа. Два пути, по приоритету:
//
//  1. API-счёт OxaPay (merchant key) — автоматическая активация по webhook.
//  2. Статичная платёжная ссылка OxaPay («Ссылка на оплату» из кабинета,
//     NEXT_PUBLIC_PAYLINK_*) — работает сразу, без одобрения мерчанта;
//     тариф в этом случае выдаёт админ через /api/admin/grant.
//
// Если не настроено ничего — configured:false, фронт включает демо-режим.

function baseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host");
  return host ? `https://${host}` : "";
}

/** Статичная платёжная ссылка: env-переменная, иначе — вшитая в код (paylinks.ts). */
function staticLinkFor(plan: PlanId): string | null {
  const map: Record<PlanId, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_PAYLINK_STARTER,
    pro:     process.env.NEXT_PUBLIC_PAYLINK_PRO,
    max:     process.env.NEXT_PUBLIC_PAYLINK_MAX,
  };
  const v = (map[plan]?.trim() || PAYLINKS[plan]?.trim()) ?? "";
  return v && /^https:\/\//i.test(v) ? v : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }

  const plan = body.plan as PlanId;
  const planObj = plan && PLAN_BY_ID[plan];
  if (!planObj) return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 422 });

  const link = staticLinkFor(plan);

  // Ничего не настроено → демо-режим на фронте.
  if (!oxapayConfigured() && !link) {
    return NextResponse.json({ success: true, configured: false });
  }

  // Путь 1: API-счёт (автоактивация по webhook).
  if (oxapayConfigured()) {
    const base = baseUrl(req);
    // Цена берётся ТОЛЬКО из серверного справочника тарифов (PLAN_BY_ID) —
    // что бы клиент ни прислал в теле запроса, на сумму это не влияет.
    const orderId = buildOrderId(session.user.id, plan);
    try {
      const payment = await createPayment({
        amountUsd: planObj.priceMonthly,
        orderId,
        description: `Vertlix ${planObj.name} — подписка на месяц`,
        callbackUrl: `${base}/api/payments/oxapay/webhook`,
        returnUrl: `${base}/payment/success`,
      });
      // Журнал платежа (PENDING) — по нему webhook сверит сумму и не даст
      // зачислить один платёж дважды. Best-effort: без БД не блокирует оплату.
      await recordPaymentCreated({
        user_id: session.user.id,
        track_id: payment.trackId,
        order_id: orderId,
        plan,
        amount: planObj.priceMonthly,
        currency: "USD",
      });
      return NextResponse.json({ success: true, configured: true, mode: "invoice", invoiceUrl: payment.payLink });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "payment error";
      // API отклонил (мерчант не одобрен и т.п.) — если есть статичная ссылка,
      // не роняем оплату, а уводим на неё.
      if (link) {
        return NextResponse.json({ success: true, configured: true, mode: "static", invoiceUrl: link });
      }
      return NextResponse.json({ success: false, configured: true, error: `OxaPay: ${msg}` }, { status: 502 });
    }
  }

  // Путь 2: только статичная ссылка.
  return NextResponse.json({ success: true, configured: true, mode: "static", invoiceUrl: link });
}
