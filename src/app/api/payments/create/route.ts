import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";
import { createInvoice, buildOrderId, nowpaymentsConfigured } from "@/lib/payments/nowpayments";

// POST /api/payments/create — создаёт крипто-счёт и возвращает ссылку на оплату.
// Если NOWPayments не настроен (нет ключа) — отвечаем configured:false, и фронт
// откатывается на демо-активацию (без реальной оплаты).

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

  if (!nowpaymentsConfigured()) {
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
    const invoice = await createInvoice({
      amountUsd: planObj.priceMonthly,
      orderId: buildOrderId(session.user.id, plan),
      description: `Vertlix ${planObj.name} — подписка на месяц`,
      ipnUrl: `${base}/api/payments/webhook`,
      successUrl: `${base}/dashboard/billing?paid=1`,
      cancelUrl: `${base}/dashboard/billing?canceled=1`,
    });
    return NextResponse.json({ success: true, configured: true, invoiceUrl: invoice.invoice_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "payment error";
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
