import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createClient } from "@/lib/supabase/server";
import { getRpID } from "@/lib/webauthn";

// POST /api/auth/passkey/auth/options  { email }
// Public — starts a passkey login. Returns request options scoped to the
// account's registered passkeys and stashes the challenge for the signIn step.
export async function POST(req: Request) {
  let body: { email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 }); }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ success: false, error: "Укажите email" }, { status: 400 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: user } = await db.from("users").select("id").eq("email", email).maybeSingle();
  const creds = user
    ? (await db.from("webauthn_credentials").select("id, transports").eq("user_id", user.id)).data ?? []
    : [];

  if (creds.length === 0) {
    return NextResponse.json({ success: false, error: "У этого аккаунта нет passkey" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpID(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allowCredentials: creds.map((c: any) => ({ id: isoBase64URL.toBuffer(c.id), type: "public-key" as const, transports: c.transports })),
    userVerification: "preferred",
  });

  await db.from("webauthn_challenges").insert({ email, challenge: options.challenge, kind: "authenticate" });

  return NextResponse.json({ success: true, options });
}
