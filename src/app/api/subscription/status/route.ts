import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSubscription } from "@/lib/server/access";
import { peekUsage } from "@/lib/middleware/usage-limit";
import { PLAN_BY_ID, limitsFor } from "@/lib/plans";

// GET /api/subscription/status — подписка и расход квот ТЕКУЩЕГО пользователя.
// user_id берётся только из серверной сессии: передать чужой нельзя. Никаких
// приватных полей (email, платёжные данные) в ответе нет.

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getUserSubscription(session.user.id);
  const plan = sub.plan;

  // Основная квота (AI-сообщения) — её видит счётчик в интерфейсе.
  const main = await peekUsage(session.user.id, plan, "aiMessages");
  const [pitchDecks, strategies, boardMeetings, weeklyFocus] = await Promise.all([
    peekUsage(session.user.id, plan, "pitchDecks"),
    peekUsage(session.user.id, plan, "strategies"),
    peekUsage(session.user.id, plan, "boardMeetings"),
    peekUsage(session.user.id, plan, "weeklyFocus"),
  ]);

  return NextResponse.json({
    success: true,
    plan,
    planName: plan === "none" ? "Free" : PLAN_BY_ID[plan].name,
    status: sub.status,
    expiresAt: sub.expiresAt,
    active: plan !== "none",
    usage: main.used,
    limit: main.limit,
    remaining: main.remaining,
    resetAt: main.resetAt,
    limits: limitsFor(plan),
    quotas: { aiMessages: main, pitchDecks, strategies, boardMeetings, weeklyFocus },
  });
}
