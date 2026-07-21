import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { getRpID, getRpOrigin } from "@/lib/webauthn";
import { logSecurityEvent } from "@/lib/security-log";

// POST /api/auth/passkey/register/verify  { response, label? }
// Verifies the attestation from the browser and stores the new passkey.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: { response?: any; label?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 }); }
  if (!body.response) return NextResponse.json({ success: false, error: "Нет данных аутентификатора" }, { status: 400 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: ch } = await db.from("webauthn_challenges")
    .select("id, challenge").eq("user_id", session.user.id).eq("kind", "register")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!ch?.challenge) return NextResponse.json({ success: false, error: "Сессия регистрации истекла" }, { status: 400 });

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: ch.challenge,
      expectedOrigin: getRpOrigin(),
      expectedRPID: getRpID(),
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Проверка не пройдена" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ success: false, error: "Passkey не подтверждён" }, { status: 400 });
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
  const idB64 = isoBase64URL.fromBuffer(credentialID);

  await db.from("webauthn_credentials").insert({
    id: idB64,
    user_id: session.user.id,
    public_key: isoBase64URL.fromBuffer(credentialPublicKey),
    counter,
    transports: body.response?.response?.transports ?? [],
    device_label: body.label ?? null,
  });
  await db.from("webauthn_challenges").delete().eq("id", ch.id);
  await logSecurityEvent(session.user.id, "passkey_added");

  return NextResponse.json({ success: true });
}
