import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// GET /api/admin/growth?days=7|30|90 — воронка и деньги за период.
// Всё считает Postgres (RPC growth_metrics / cohort_metrics из миграции 016).
// Где данных не хватает для честного расчёта — приходит null, и интерфейс
// показывает «—» вместо придуманного числа.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: admin.status });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, configured: false, data: null });
  }

  const days = [7, 30, 90].includes(Number(req.nextUrl.searchParams.get("days")))
    ? Number(req.nextUrl.searchParams.get("days")) : 30;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data, error }, cohorts] = await Promise.all([
    db.rpc("growth_metrics", { p_days: days }),
    db.rpc("cohort_metrics", { p_months: 6 }).then((r: { data: unknown }) => r.data).catch(() => null),
  ]);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Метрики роста недоступны — выполните миграцию 016 в Supabase." },
      { status: 503 },
    );
  }

  return NextResponse.json({ success: true, configured: true, days, data, cohorts: cohorts ?? [] });
}
