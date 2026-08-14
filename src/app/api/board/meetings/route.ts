import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";
import { MAX_QUESTION_LEN, QUESTION_TOO_LONG } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("board_meetings")
    .select("*", { count: "exact" })
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return dbErrorResponse(error, "/api/board/meetings");

  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; agenda?: unknown[]; context?: Record<string, unknown> };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 422 });
  }
  // Вопрос совету — тоже вопрос к AI: общий потолок 1000 символов.
  if (body.title.trim().length > MAX_QUESTION_LEN) {
    return NextResponse.json({ success: false, error: QUESTION_TOO_LONG, code: "QUESTION_TOO_LONG" }, { status: 422 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db.from("board_meetings").insert({
    user_id: session.user.id,
    title: body.title.trim(),
    agenda: body.agenda ?? [],
    context: body.context ?? {},
    status: "pending",
  }).select().single();

  if (error) return dbErrorResponse(error, "/api/board/meetings");
  return NextResponse.json({ success: true, data }, { status: 201 });
}
