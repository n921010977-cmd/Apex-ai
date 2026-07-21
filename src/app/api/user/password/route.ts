import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { logSecurityEvent } from "@/lib/security-log";
import { createClient } from "@/lib/supabase/server";
import { authLimiter, rateLimitResponse } from "@/lib/middleware/rate-limit";

// POST /api/user/password  { currentPassword?, newPassword }
// Changes the signed-in user's password. If the account has an existing
// password, currentPassword must match. OAuth-only accounts (no password yet)
// can set one without a current password.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const limit = await authLimiter(`pwchange:${session.user.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: { currentPassword?: string; newPassword?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }

  const newPassword = body.newPassword ?? "";
  if (newPassword.length < 6) return NextResponse.json({ success: false, error: "Новый пароль минимум 6 символов" }, { status: 400 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: user, error: readErr } = await db
    .from("users").select("id, password_hash").eq("id", session.user.id).maybeSingle();
  if (readErr || !user) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });

  // If a password already exists, require and verify the current one.
  if (user.password_hash) {
    const ok = body.currentPassword ? await bcrypt.compare(body.currentPassword, user.password_hash) : false;
    if (!ok) return NextResponse.json({ success: false, error: "Текущий пароль неверный" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  const { error } = await db.from("users").update({ password_hash }).eq("id", session.user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await logSecurityEvent(session.user.id, "password_changed");
  return NextResponse.json({ success: true });
}
