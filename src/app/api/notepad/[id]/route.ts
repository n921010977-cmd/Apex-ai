import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing, error: fetchErr } = await db
    .from("notes")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (fetchErr || !existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Те же границы, что и на создании заметки — иначе лимит обходится
  // редактированием уже созданной записи.
  if (typeof body.content === "string" && body.content.length > 100_000) {
    return NextResponse.json({ success: false, error: "Заметка не длиннее 100000 символов" }, { status: 422 });
  }
  if (typeof body.title === "string" && body.title.length > 200) {
    return NextResponse.json({ success: false, error: "Заголовок не длиннее 200 символов" }, { status: 422 });
  }
  if (Array.isArray(body.tags) && body.tags.length > 20) {
    return NextResponse.json({ success: false, error: "Не больше 20 тегов" }, { status: 422 });
  }

  const allowed = ["title", "content", "emoji", "tags", "folder", "is_pinned", "ai_summary"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if ("content" in body && typeof body.content === "string") {
    update.word_count = body.content.trim().split(/\s+/).filter(Boolean).length;
  }

  // user_id повторяется и в самом UPDATE: владение уже проверено выше, но
  // фильтр по владельцу в запросе — то, что защищает от ошибки в будущем
  // рефакторинге и от гонки между проверкой и записью.
  const { data, error } = await db.from("notes").update(update)
    .eq("id", id).eq("user_id", session.user.id).select().single();
  if (error) return dbErrorResponse(error, "/api/notepad/[id]");

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Soft delete
  const { error } = await db
    .from("notes")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return dbErrorResponse(error, "/api/notepad/[id]");
  return NextResponse.json({ success: true });
}

