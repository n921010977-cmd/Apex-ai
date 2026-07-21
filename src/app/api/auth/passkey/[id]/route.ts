import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security-log";

// DELETE /api/auth/passkey/[id] — remove one of the user's passkeys.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ success: false, error: "Не указан passkey" }, { status: 400 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  await db.from("webauthn_credentials").delete().eq("id", id).eq("user_id", session.user.id);
  await logSecurityEvent(session.user.id, "passkey_removed");

  return NextResponse.json({ success: true });
}
