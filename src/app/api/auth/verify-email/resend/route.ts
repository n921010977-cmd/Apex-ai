import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signVerifyToken } from "@/lib/verify-token";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { authLimiter, rateLimitResponse, clientIp } from "@/lib/middleware/rate-limit";

// POST /api/auth/verify-email/resend  { email }
// Re-sends a verification link. Always returns a generic success so it can't be
// used to enumerate accounts; rate-limited per IP.
export async function POST(req: Request) {
  const generic = NextResponse.json({ ok: true });
  try {
    const ip = clientIp(req);
    const limit = await authLimiter(`verify-resend:${ip}`);
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    const addr = email.trim().toLowerCase();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return generic;

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: user } = await db.from("users").select("id, email_verified").eq("email", addr).maybeSingle();
    if (!user || user.email_verified) return generic; // already verified or no such account — stay generic

    const token = signVerifyToken(addr);
    const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const link = `${base}/verify-email?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: addr, subject: "Подтвердите email · Vertlix AI", html: verificationEmailHtml(link) });

    return generic;
  } catch (err) {
    console.error("[verify-email/resend]", err);
    return generic;
  }
}
