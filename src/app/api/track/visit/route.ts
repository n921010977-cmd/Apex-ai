import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { logEvent } from "@/lib/analytics/server";
import { apiLimiter, clientIp, rateLimitResponse } from "@/lib/middleware/rate-limit";

// POST /api/track/visit — верх воронки: анонимный визит с меткой источника.
// Личность посетителя не сохраняем: только псевдоним (хеш IP+UA) для подсчёта
// уникальных, чтобы конверсия «посетители → регистрации» считалась честно.

export async function POST(req: NextRequest) {
  const limit = await apiLimiter(`visit:${clientIp(req)}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let path = "";
  try { path = String((await req.json())?.path ?? ""); } catch { /* без пути тоже ок */ }
  if (!path.startsWith("/")) path = "/";

  // Псевдоним посетителя: необратимый хеш, персональные данные не хранятся.
  const anonId = crypto
    .createHash("sha256")
    .update(`${clientIp(req)}|${req.headers.get("user-agent") ?? ""}|${process.env.NEXTAUTH_SECRET ?? "salt"}`)
    .digest("hex")
    .slice(0, 32);

  const acqRaw = (await cookies()).get("vertlix_acq")?.value;
  let source = "direct";
  try {
    if (acqRaw) {
      const a = JSON.parse(decodeURIComponent(acqRaw)) as { utm_source?: string; referrer?: string };
      source = a.utm_source || (a.referrer ? new URL(a.referrer).hostname : "direct");
    }
  } catch { /* остаётся direct */ }

  void logEvent("visit", null, { anon_id: anonId, path: path.slice(0, 200), source });
  return NextResponse.json({ success: true });
}
