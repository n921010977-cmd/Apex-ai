import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { generateTwoFactorSetup, encryptSecret } from "@/lib/two-factor";
import { dbErrorResponse } from "@/lib/errors";

// POST /api/auth/2fa/setup — generate a new TOTP secret + QR code.
// Stores the encrypted secret but does NOT enable 2FA yet — that only
// happens after /api/auth/2fa/verify confirms the user's authenticator app
// actually produces valid codes for it.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let setup;
  try {
    setup = await generateTwoFactorSetup(session.user.email);
  } catch {
    return NextResponse.json({ success: false, error: "Не удалось сгенерировать 2FA" }, { status: 500 });
  }

  let secretEnc: string;
  try {
    secretEnc = encryptSecret(setup.secret);
  } catch {
    return NextResponse.json({ success: false, error: "2FA временно недоступна: не настроено шифрование на сервере" }, { status: 503 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("user_settings").upsert(
    { user_id: session.user.id, two_fa_secret_enc: secretEnc, two_fa: false, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) return dbErrorResponse(error, "/api/auth/2fa/setup");

  return NextResponse.json({ success: true, qrDataUrl: setup.qrDataUrl, secret: setup.secret });
}
