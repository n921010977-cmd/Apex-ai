import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signResetToken } from "@/lib/reset-token";
import { authLimiter, rateLimitResponse, clientIp } from "@/lib/middleware/rate-limit";

// POST /api/auth/forgot-password  { email }
// Always returns a generic success (no account enumeration). If the account
// exists, emails a reset link — via Resend when configured, otherwise the link
// is logged server-side (dev). Plug RESEND_API_KEY to send real mail.
export async function POST(req: Request) {
  const generic = NextResponse.json({ ok: true });
  try {
    const ip = clientIp(req);
    const limit = await authLimiter(`forgot:${ip}`);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    const addr = email.trim().toLowerCase();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return generic;

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: user } = await db.from("users").select("id, email").eq("email", addr).maybeSingle();
    if (!user) return generic; // don't reveal whether the account exists

    const token = signResetToken(addr);
    const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Vertlix AI <onboarding@resend.dev>",
          to: addr,
          subject: "Сброс пароля · Vertlix AI",
          html: `<p>Вы запросили сброс пароля в Vertlix AI.</p><p><a href="${link}">Установить новый пароль</a></p><p>Ссылка действует 1 час. Если это были не вы — просто проигнорируйте письмо.</p>`,
        }),
      }).catch((e) => console.error("[forgot-password] resend", e));
    } else {
      console.log(`[forgot-password] reset link for ${addr}: ${link}`);
    }

    return generic;
  } catch (err) {
    console.error("[forgot-password]", err);
    return generic; // still generic — never leak
  }
}
