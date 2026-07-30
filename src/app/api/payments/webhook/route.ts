import { NextRequest, NextResponse } from "next/server";
import { verifyCallbackSignature, parseOrderId } from "@/lib/payments/oxapay";
import { setEntitlement } from "@/lib/payments/entitlement";
import type { PlanId } from "@/lib/plans";

// POST /api/payments/webhook — callback от OxaPay.
// Приходит сервер-сервер. Проверяем подпись (заголовок HMAC), и при успешной
// оплате включаем тариф пользователю на месяц (серверный entitlement-стор).

const PAID = new Set(["Paid", "Confirmed", "Complete"]);
const VALID_PLANS = new Set(["starter", "pro", "max"]);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("HMAC") ?? req.headers.get("hmac");

  if (!verifyCallbackSignature(raw, sig)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: { status?: string; orderId?: string };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ success: false }, { status: 400 }); }

  // Реагируем только на завершённую оплату; остальные статусы просто подтверждаем.
  if (payload.status && PAID.has(payload.status) && payload.orderId) {
    const parsed = parseOrderId(payload.orderId);
    if (parsed && VALID_PLANS.has(parsed.plan)) {
      await setEntitlement(parsed.userId, parsed.plan as PlanId, 1);
    }
  }

  // Всегда 200 на валидную подпись — иначе OxaPay будет ретраить.
  return NextResponse.json({ success: true });
}
