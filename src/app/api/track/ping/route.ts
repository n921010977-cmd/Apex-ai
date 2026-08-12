import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackPing, saveAcquisition, logEvent } from "@/lib/analytics/server";
import { cookies } from "next/headers";
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

  // Переносим источник первого касания из cookie в профиль (однократно —
  // saveAcquisition не перезаписывает уже сохранённый источник).
  const acqRaw = (await cookies()).get("vertlix_acq")?.value;
  if (acqRaw) {
    try { void saveAcquisition(session.user.id, JSON.parse(decodeURIComponent(acqRaw))); } catch { /* игнор */ }
  }

  // Просмотр страницы тарифов — шаг воронки перед оплатой.
  if (path.includes("/billing") || path === "/pricing") {
    void logEvent("pricing_view", session.user.id, { path });
  }

  return NextResponse.json({ success: true });
}
