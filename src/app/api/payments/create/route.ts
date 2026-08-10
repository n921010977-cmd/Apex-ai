import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";
import { createPayment, buildOrderId, oxapayConfigured } from "@/lib/payments/oxapay";

// POST /api/payments/create — создаёт крипто-счёт (OxaPay) и возвращает ссылку
// на оплату. Если OxaPay не настроен (нет ключа) — отвечаем configured:false, и
// фронт откатывается на демо-активацию (без реальной оплаты).

function baseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host");
  return host ? `https://${host}` : "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!oxapayConfigured()) {
    // Оплата не настроена — фронт включит демо-режим.
    return NextResponse.json({ success: true, configured: false });
  }

  let body: { plan?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }

  const plan = body.plan as PlanId;
  const planObj = plan && PLAN_BY_ID[plan];
  if (!planObj) return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 422 });

  const base = baseUrl(req);
  try {
    const payment = await createPayment({
      amountUsd: planObj.priceMonthly,
      orderId: buildOrderId(session.user.id, plan),
      description: `Vertlix ${planObj.name} — подписка на месяц`,
      callbackUrl: `${base}/api/payments/webhook`,
      returnUrl: `${base}/dashboard/billing?paid=1`,
    });
    return NextResponse.json({ success: true, configured: true, invoiceUrl: payment.payLink });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "payment error";
    // configured:true — оплата настроена, но шлюз отклонил счёт. Фронт покажет
    // причину (чаще всего: мерчант не одобрен или ключ из «Сервиса выплат»).
    return NextResponse.json({ success: false, configured: true, error: `OxaPay: ${msg}` }, { status: 502 });
  }
}
