import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { RP_NAME, getRpID } from "@/lib/webauthn";

// POST /api/auth/passkey/register/options
// Returns WebAuthn creation options for enrolling a new passkey, and stashes
// the challenge server-side for the matching /verify call.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db.from("webauthn_credentials").select("id, transports").eq("user_id", session.user.id);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpID(),
    userID: session.user.id,
    userName: session.user.email,
    userDisplayName: session.user.name ?? session.user.email,
    attestationType: "none",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    excludeCredentials: (existing ?? []).map((c: any) => ({ id: isoBase64URL.toBuffer(c.id), type: "public-key" as const, transports: c.transports })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });

  await db.from("webauthn_challenges").insert({ user_id: session.user.id, challenge: options.challenge, kind: "register" });

  return NextResponse.json({ success: true, options });
}
