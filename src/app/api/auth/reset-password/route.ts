import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { verifyResetToken } from "@/lib/reset-token";
import { authLimiter, rateLimitResponse, clientIp } from "@/lib/middleware/rate-limit";

// POST /api/auth/reset-password  { token, password }
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = await authLimiter(`reset:${ip}`);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    let body: { token?: string; password?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 }); }
    const { token, password } = body;
    if (!token || !password) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });

    const email = verifyResetToken(token);
    if (!email) return NextResponse.json({ error: "Ссылка недействительна или истекла" }, { status: 400 });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true, demo: true });

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const password_hash = await bcrypt.hash(password, 12);
    const { error } = await db.from("users").update({ password_hash }).eq("email", email);
    if (error) {
      console.error("[reset-password]", error);
      return NextResponse.json({ error: "Ошибка сервера, попробуйте ещё раз" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
