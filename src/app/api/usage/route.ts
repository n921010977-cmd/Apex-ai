import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { peekUsage } from "@/lib/middleware/usage-limit";
import { getServerPlan } from "@/lib/server/plan";
import { getSubscription } from "@/lib/payments/entitlement";

// GET /api/usage — текущее использование месячных квот пользователя.
// Питает индикатор в сайдбаре: сколько сообщений/питч-деков и т.д. потрачено.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getServerPlan(session.user.id);
  const [aiMessages, pitchDecks, strategies, boardMeetings, weeklyFocus, subscription] = await Promise.all([
    peekUsage(session.user.id, plan, "aiMessages"),
    peekUsage(session.user.id, plan, "pitchDecks"),
    peekUsage(session.user.id, plan, "strategies"),
    peekUsage(session.user.id, plan, "boardMeetings"),
    peekUsage(session.user.id, plan, "weeklyFocus"),
    getSubscription(session.user.id),
  ]);

  return NextResponse.json({
    success: true,
    plan,
    expiresAt: subscription.expiresAt,
    usage: { aiMessages, pitchDecks, strategies, boardMeetings, weeklyFocus },
  });
}
