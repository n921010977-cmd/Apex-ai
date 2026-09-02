import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { grantTrialDays } from "@/lib/payments/entitlement";
import { logEvent } from "@/lib/analytics/server";
import { authLimiter, rateLimitResponse, clientIp } from "@/lib/middleware/rate-limit";

// POST /api/promo/redeem — активирует промокод: Basic на 7 дней, один раз на
// аккаунт. Код один на всех (пока не нужен каталог кодов) — сравнение по
// нормализованной строке, без секретов и без обращения к внешним сервисам.

const PROMO_CODE = "VERTLIX123";
const PROMO_PLAN = "basic" as const;
const PROMO_DAYS = 7;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Please sign in" }, { status: 401 });
  }
  const userId = session.user.id;

  // Тот же лимитер, что и на входе — коды перебирать не дадим.
  const ip = clientIp(req);
  const limit = await authLimiter(`promo:${ip}:${userId}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }); }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ success: false, error: "Enter a promo code" }, { status: 400 });
  if (code !== PROMO_CODE) {
    return NextResponse.json({ success: false, error: "Invalid promo code" }, { status: 404 });
  }

  // Один код — одно применение на аккаунт (проверяем ленту событий).
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data: existing } = await db
        .from("user_events")
        .select("id")
        .eq("user_id", userId)
        .eq("event_name", "promo_redeemed")
        .limit(1)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ success: false, error: "You've already redeemed a promo code" }, { status: 409 });
      }
    } catch { /* не удалось проверить — не блокируем, ниже всё равно best-effort */ }
  }

  const granted = await grantTrialDays(userId, PROMO_PLAN, PROMO_DAYS);
  if (!granted) {
    return NextResponse.json(
      { success: false, error: "Could not activate the plan right now — please try again in a minute." },
      { status: 500 },
    );
  }
  void logEvent("promo_redeemed", userId, { code, plan: PROMO_PLAN, days: PROMO_DAYS });

  return NextResponse.json({ success: true, plan: PROMO_PLAN, days: PROMO_DAYS });
}
