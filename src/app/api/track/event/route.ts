import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logEvent, type ProductEvent } from "@/lib/analytics/server";
import { apiLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";

// POST /api/track/event { event, metadata } — события интерфейса.
// Разрешён строгий белый список: клиент не может записать произвольное событие
// и не может подставить чужой user_id (он берётся из серверной сессии).

const ALLOWED: ProductEvent[] = ["upgrade_clicked", "upgrade_started", "pricing_view"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

  const limit = await apiLimiter(getIdentifier(req, session.user.id));
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: { event?: string; metadata?: Record<string, unknown> } = {};
  try { body = await req.json(); } catch { /* пустое тело — ниже отвергнем */ }

  const event = body.event as ProductEvent;
  if (!ALLOWED.includes(event)) {
    return NextResponse.json({ success: false, error: "Unknown event" }, { status: 400 });
  }

  // Метаданные обрезаем: в аналитику не должны попадать тексты и персональные данные.
  const meta: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body.metadata ?? {}).slice(0, 8)) {
    if (typeof v === "string") meta[k] = v.slice(0, 60);
    else if (typeof v === "number" || typeof v === "boolean") meta[k] = v;
  }

  await logEvent(event, session.user.id, meta);
  return NextResponse.json({ success: true });
}
