import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

// DELETE /api/ask-history/[id] — remove one entry by its client id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from("ask_history")
    .delete()
    .eq("user_id", session.user.id)
    .eq("client_id", id);

  if (error) return dbErrorResponse(error, "/api/ask-history/[id]");
  return NextResponse.json({ success: true });
}
