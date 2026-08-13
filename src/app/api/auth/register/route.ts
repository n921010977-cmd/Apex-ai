import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { logEvent, saveAcquisition } from "@/lib/analytics/server";
import { makeReferralCode } from "@/lib/analytics/growth";
import { createClient } from "@/lib/supabase/server";
import { authLimiter, rateLimitResponse, clientIp } from "@/lib/middleware/rate-limit";
import { validatePasswordStrength } from "@/lib/password";
import { signVerifyToken } from "@/lib/verify-token";
import { sendEmail, verificationEmailHtml } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = await authLimiter(`register:${ip}`);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    let body: { name?: string; email?: string; password?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 }); }
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
    }
    const weak = validatePasswordStrength(password);
    if (weak) return NextResponse.json({ error: weak }, { status: 400 });

    // Форма заполнена корректно и отправлена — шаг воронки перед регистрацией.
    // Пишем анонимно: пользователя ещё не существует, email в аналитику не идёт.
    void logEvent("signup_started", null, {});

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

    const { data: created, error } = await db.from("users").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: "FREE",
      tier: "FREE",
      max_reports_per_month: 3,
      reports_generated_month: 0,
    }).select("id").maybeSingle();

    if (error) {
      console.error("[register]", error);
      return NextResponse.json({ error: "Ошибка сервера, попробуйте ещё раз" }, { status: 500 });
    }

    // Аналитика: событие регистрации + источник первого касания из cookie.
    if (created?.id) {
      const acqRaw = (await cookies()).get("vertlix_acq")?.value;
      let acq: Record<string, string> = {};
      if (acqRaw) { try { acq = JSON.parse(decodeURIComponent(acqRaw)); } catch { /* игнор */ } }
      void saveAcquisition(created.id, acq);
      void logEvent("signup", created.id, { source: acq.utm_source ?? "direct", landing: acq.landing_page ?? null });
      // Приветственное событие — задел под письмо, когда подключим рассылку.
      void logEvent("welcome", created.id, {});

      // Реферальная связка: собственный код пользователя + код пригласившего
      // (кладётся в ту же cookie первого касания при заходе по /?ref=CODE).
      const ref = typeof acq.ref === "string" ? acq.ref.slice(0, 16).toUpperCase() : null;
      try {
        await db.from("users").update({
          referral_code: makeReferralCode(created.id),
          referred_by: ref,
        }).eq("id", created.id);
      } catch { /* колонок ещё нет — миграция 016 не применена */ }
    }

    // Send an email-verification link (best-effort — never block signup on it).
    // Without RESEND_API_KEY the link is logged server-side instead of sent.
    try {
      const addr = email.trim().toLowerCase();
      const token = signVerifyToken(addr);
      const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
      const link = `${base}/verify-email?token=${encodeURIComponent(token)}`;
      await sendEmail({ to: addr, subject: "Подтвердите email · Vertlix AI", html: verificationEmailHtml(link) });
    } catch (e) {
      console.error("[register] verification email", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
