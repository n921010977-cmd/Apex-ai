import { NextRequest, NextResponse } from "next/server";
import { verifyIpnSignature, parseOrderId } from "@/lib/payments/nowpayments";
import { setEntitlement } from "@/lib/payments/entitlement";
import type { PlanId } from "@/lib/plans";

// POST /api/payments/webhook — IPN от NOWPayments.
// Приходит сервер-сервер. Проверяем подпись, и при успешной оплате включаем
// тариф пользователю на месяц (серверный entitlement-стор).

const PAID = new Set(["finished", "confirmed"]);
const VALID_PLANS = new Set(["starter", "pro", "max"]);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-nowpayments-sig");

  if (!verifyIpnSignature(raw, sig)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: { payment_status?: string; order_id?: string };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ success: false }, { status: 400 }); }

  // Реагируем только на завершённую оплату; остальные статусы просто подтверждаем.
  if (payload.payment_status && PAID.has(payload.payment_status) && payload.order_id) {
    const parsed = parseOrderId(payload.order_id);
    if (parsed && VALID_PLANS.has(parsed.plan)) {
      await setEntitlement(parsed.userId, parsed.plan as PlanId, 1);
    }
  }

  // Всегда 200 на валидную подпись — иначе NOWPayments будет ретраить.
  return NextResponse.json({ success: true });
}
