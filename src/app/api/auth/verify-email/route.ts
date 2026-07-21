import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyVerifyToken } from "@/lib/verify-token";

// POST /api/auth/verify-email  { token }
// Confirms an email address from a signed verification link. Stateless: the
// token itself proves ownership, so we just stamp email_verified on the row.
export async function POST(req: Request) {
  let body: { token?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 }); }

  const token = body.token?.trim();
  if (!token) return NextResponse.json({ success: false, error: "Отсутствует токен" }, { status: 400 });

  const email = verifyVerifyToken(token);
  if (!email) return NextResponse.json({ success: false, error: "Ссылка недействительна или истекла" }, { status: 400 });

  // Demo mode — no database. Treat a well-formed token as confirmation.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ success: true, email });
  }

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    // Best-effort: the email_verified column may not exist in every deployment.
    await db.from("users").update({ email_verified: new Date().toISOString() }).eq("email", email).then(
      () => {}, () => {},
    );
  } catch {
    // Verification link was valid — don't fail the user over a DB hiccup.
  }

  return NextResponse.json({ success: true, email });
}
