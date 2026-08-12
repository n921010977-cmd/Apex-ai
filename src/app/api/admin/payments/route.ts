import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { listPayments, oxapayConfigured } from "@/lib/payments/oxapay";
import { PLANS } from "@/lib/plans";

// GET /api/admin/payments — реальные оплаты из OxaPay для админки.
// Показывает, кто заплатил и за какой тариф (по сумме), чтобы выдать доступ
// в один клик. Ключ используется только на сервере и наружу не отдаётся.

export const dynamic = "force-dynamic";

/** По сумме понимаем, какой тариф оплачен (допуск 3% на курс/комиссию). */
function planByAmount(amount: number): string | null {
  const hit = PLANS.find(p => Math.abs(p.priceMonthly - amount) <= p.priceMonthly * 0.03);
  return hit?.id ?? null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: admin.status });

  if (!oxapayConfigured()) {
    return NextResponse.json({ success: true, configured: false, payments: [] });
  }

  try {
    const raw = await listPayments(30);
    const payments = raw.map(p => ({
      trackId: p.trackId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      email: p.email ?? null,
      date: p.date ?? null,
      description: p.description ?? null,
      // Кому и что выдавать: тариф по сумме; если оплата шла через наш API,
      // в order_id уже зашит userId — тогда тариф выдан автоматически.
      guessedPlan: planByAmount(p.amount),
      viaApi: Boolean(p.orderId && p.orderId.includes("::")),
      userIdFromOrder: p.orderId?.includes("::") ? p.orderId.split("::")[0] : null,
    }));
    return NextResponse.json({ success: true, configured: true, payments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OxaPay error";
    return NextResponse.json({ success: false, configured: true, error: msg }, { status: 502 });
  }
}
