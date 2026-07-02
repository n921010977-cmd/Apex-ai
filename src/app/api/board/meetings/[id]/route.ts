import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: meeting, error } = await db
    .from("board_meetings")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !meeting) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const [{ data: speeches }, { data: votes }, { data: decisions }] = await Promise.all([
    db.from("board_speeches").select("*").eq("meeting_id", id).order("created_at"),
    db.from("board_votes").select("*").eq("meeting_id", id).order("created_at"),
    db.from("board_decisions").select("*").eq("meeting_id", id).order("created_at"),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      ...meeting,
      speeches: speeches ?? [],
      votes: votes ?? [],
      decisions: decisions ?? [],
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("board_meetings")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
