import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSubscription } from "@/lib/payments/entitlement";
import { PLAN_BY_ID } from "@/lib/plans";

// GET /api/subscription/status — подписка ТЕКУЩЕГО пользователя.
// user_id берётся только из серверной сессии: передать чужой нельзя.

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getSubscription(session.user.id);
  return NextResponse.json({
    success: true,
    plan: sub.plan ?? "none",
    planName: sub.plan ? PLAN_BY_ID[sub.plan].name : null,
    status: sub.status,
    expiresAt: sub.expiresAt,
    active: sub.status === "active" && Boolean(sub.plan),
  });
}
