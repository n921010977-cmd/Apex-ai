import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { logSecurityEvent } from "@/lib/security-log";
import { createClient } from "@/lib/supabase/server";
import { verifyTotpCode } from "@/lib/two-factor";
import { authLimiter, rateLimitResponse, clientIp } from "@/lib/middleware/rate-limit";
import { dbErrorResponse } from "@/lib/errors";

// POST /api/auth/2fa/disable  { password?, code? }
// Requires re-authentication (current password OR a valid 6-digit TOTP code)
// before turning 2FA off — otherwise a hijacked session could silently
// downgrade account security.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const limit = await authLimiter(`2fa-disable:${session.user.id}:${clientIp(req)}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: { password?: string; code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 }); }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let reauthenticated = false;

  if (body.code) {
    const { data: row } = await db.from("user_settings").select("two_fa_secret_enc").eq("user_id", session.user.id).maybeSingle();
    if (row?.two_fa_secret_enc && await verifyTotpCode(row.two_fa_secret_enc, body.code)) reauthenticated = true;
  }
  if (!reauthenticated && body.password) {
    const { data: user } = await db.from("users").select("password_hash").eq("id", session.user.id).maybeSingle();
    if (user?.password_hash && await bcrypt.compare(body.password, user.password_hash)) reauthenticated = true;
  }

  if (!reauthenticated) {
    return NextResponse.json({ success: false, error: "Введите текущий пароль или код 2FA для подтверждения" }, { status: 400 });
  }

  const { error } = await db.from("user_settings").update({
    two_fa: false, two_fa_secret_enc: null, two_fa_backup_codes: [], two_fa_verified_at: null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", session.user.id);
  if (error) return dbErrorResponse(error, "/api/auth/2fa/disable");

  await logSecurityEvent(session.user.id, "2fa_disabled");
  return NextResponse.json({ success: true });
}
