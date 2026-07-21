import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { authLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const limit = await authLimiter(`register:${ip}`);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    let body: { name?: string; email?: string; password?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 }); }
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
    }

    // Demo mode — no Supabase configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Email уже зарегистрирован" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { error } = await db.from("users").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: "FREE",
      tier: "FREE",
      max_reports_per_month: 3,
      reports_generated_month: 0,
    });

    if (error) {
      console.error("[register]", error);
      return NextResponse.json({ error: "Ошибка сервера, попробуйте ещё раз" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
