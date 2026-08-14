import { NextRequest, NextResponse } from "next/server";
import { notifyExpiring } from "@/lib/notifications";
import { logEvent } from "@/lib/analytics/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

// ─── Ежедневная задача (Vercel Cron, см. vercel.json) ─────────────────────────
// 1. Напоминает о продлении тем, у кого подписка заканчивается в ближайшие
//    3 дня. Повторно не пишет: перед отправкой проверяется, не было ли события
//    subscription_expiring за последние 3 дня.
// 2. Помечает истёкшие подписки (status=expired) и пишет событие
//    subscription_expired — для метрик оттока.
//
// Доступ: Vercel Cron шлёт заголовок Authorization: Bearer <CRON_SECRET>.
// Без корректного секрета — 401; наружу маршрут ничего не раскрывает.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, skipped: "no_db" });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const now = Date.now();
  let reminded = 0, expired = 0;

  // ── 1. Напоминания о продлении (осталось ≤ 3 дней) ──────────────────────
  try {
    const { data: subs } = await db
      .from("subscriptions")
      .select("user_id, plan, expires_at")
      .eq("status", "active")
      .gte("expires_at", new Date(now).toISOString())
      .lte("expires_at", new Date(now + 3 * 864e5).toISOString())
      .limit(500);

    for (const sub of subs ?? []) {
      // Уже напоминали за последние 3 дня — молчим.
      const { data: recent } = await db
        .from("user_events")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("event_name", "subscription_expiring")
        .gte("created_at", new Date(now - 3 * 864e5).toISOString())
        .limit(1)
        .maybeSingle();
      if (recent) continue;

      const { data: u } = await db.from("users").select("email").eq("id", sub.user_id).maybeSingle();
      const email = u?.email;
      if (typeof email !== "string" || !email.includes("@") || email.endsWith("@vertlix.local")) continue;

      const daysLeft = Math.max(1, Math.ceil((new Date(sub.expires_at).getTime() - now) / 864e5));
      await notifyExpiring(sub.user_id, email, sub.plan, daysLeft, sub.expires_at);
      reminded++;
    }
  } catch (e) {
    log.error({ event: "cron_error", endpoint: "/api/cron/daily", message: e instanceof Error ? e.message : String(e) });
  }

  // ── 2. Истёкшие подписки → status=expired + событие оттока ─────────────
  try {
    const { data: gone } = await db
      .from("subscriptions")
      .select("user_id, plan")
      .eq("status", "active")
      .lt("expires_at", new Date(now).toISOString())
      .limit(500);

    for (const sub of gone ?? []) {
      await db.from("subscriptions").update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("user_id", sub.user_id).eq("status", "active");
      void logEvent("subscription_expired", sub.user_id, { plan: sub.plan });
      expired++;
    }
  } catch (e) {
    log.error({ event: "cron_error", endpoint: "/api/cron/daily", message: e instanceof Error ? e.message : String(e) });
  }

  log.info({ event: "cron_daily", reminded, expired });
  return NextResponse.json({ success: true, reminded, expired });
}
