import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/security/log — the signed-in user's security events, newest first.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("activity_logs")
    .select("id, type, data, created_at")
    .eq("user_id", session.user.id)
    .like("type", "security.%")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}
