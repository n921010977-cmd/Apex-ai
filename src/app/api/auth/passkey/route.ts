import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/auth/passkey — list the current user's registered passkeys.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data } = await db
    .from("webauthn_credentials")
    .select("id, device_label, transports, created_at, last_used_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ success: true, passkeys: data ?? [] });
}
