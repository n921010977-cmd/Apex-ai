import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { setEntitlement } from "@/lib/payments/entitlement";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

const VALID_PLANS = new Set(["starter", "pro", "max"]);

// POST /api/admin/grant — админ выдаёт тариф пользователю вручную.
// Нужен для оплат по статичной платёжной ссылке OxaPay: в них нет userId,
// поэтому после оплаты клиент называет свой email, а админ включает тариф.
// { email?: string, userId?: string, plan: "starter"|"pro"|"max", months?: number }

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: admin.status });

  let body: { email?: string; userId?: string; plan?: string; months?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }

  const plan = body.plan ?? "";
  if (!VALID_PLANS.has(plan)) return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 422 });
  const months = Math.min(12, Math.max(1, Number(body.months) || 1));

  // Определяем userId: напрямую или по email через базу.
  let userId = body.userId?.trim() || "";
  const email = body.email?.trim().toLowerCase() || "";

  if (!userId && email) {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Без базы поиск по email недоступен — укажи userId (виден в /api/user у клиента)" },
        { status: 422 },
      );
    }
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data } = await db.from("users").select("id").eq("email", email).maybeSingle();
      if (!data?.id) return NextResponse.json({ success: false, error: `Пользователь ${email} не найден` }, { status: 404 });
      userId = data.id;
    } catch {
      return NextResponse.json({ success: false, error: "Ошибка поиска пользователя" }, { status: 500 });
    }
  }

  if (!userId) return NextResponse.json({ success: false, error: "Укажи email или userId" }, { status: 422 });

  await setEntitlement(userId, plan as PlanId, months);
  return NextResponse.json({ success: true, userId, plan, months });
}
