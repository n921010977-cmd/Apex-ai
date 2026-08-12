import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const verdict = searchParams.get("verdict");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Join decisions with meetings to scope to user
  let query = db
    .from("board_decisions")
    .select(`
      *,
      board_meetings!inner(id, title, user_id, created_at, completed_at)
    `, { count: "exact" })
    .eq("board_meetings.user_id", session.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (verdict) query = query.eq("verdict", verdict);

  const { data, error, count } = await query;
  if (error) return dbErrorResponse(error, "/api/board/decisions");

  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
}
