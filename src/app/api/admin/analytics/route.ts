import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// GET /api/admin/analytics?days=7|30|90
// Воронка, источники, AI-использование, выручка и ряды для графиков — одним
// RPC analytics_overview (миграция 014), без десятков запросов из UI.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: admin.status });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, configured: false, data: null });
  }

  const daysRaw = Number(req.nextUrl.searchParams.get("days"));
  const days = [7, 30, 90].includes(daysRaw) ? daysRaw : 30;

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("analytics_overview", { p_days: days });
    if (error) {
      // Миграция ещё не применена — сообщаем честно, без деталей БД наружу.
      console.error("[admin/analytics]", error.message);
      return NextResponse.json({ success: false, error: "Аналитика недоступна: выполните миграцию 014" }, { status: 503 });
    }
    return NextResponse.json({ success: true, configured: true, days, data });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка запроса" }, { status: 500 });
  }
}
