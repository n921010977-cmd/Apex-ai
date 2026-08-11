import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackPing } from "@/lib/analytics/server";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";

// POST /api/track/ping { path } — пинг активности из клиента.
// Создаёт/продлевает сессию (окно 30 мин) и пишет page_view. user_id берётся
// ТОЛЬКО из сессии — накрутить чужую статистику из браузера нельзя.

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

  const limit = await apiLimiter(getIdentifier(req, session.user.id));
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let path = "";
  try { path = String((await req.json())?.path ?? ""); } catch { /* пинг без пути допустим */ }
  if (!path.startsWith("/")) path = "";

  await trackPing(session.user.id, path, req.headers.get("user-agent") ?? "");
  return NextResponse.json({ success: true });
}
