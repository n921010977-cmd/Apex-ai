import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const tag = searchParams.get("tag");
  const pinned = searchParams.get("pinned");
  const search = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("notes")
    .select("*", { count: "exact" })
    .eq("user_id", session.user.id)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (folder) query = query.eq("folder", folder);
  if (pinned === "true") query = query.eq("is_pinned", true);
  if (tag) query = query.contains("tags", [tag]);
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    content?: string;
    emoji?: string;
    tags?: string[];
    folder?: string;
    is_pinned?: boolean;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const content = body.content ?? "";
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await db.from("notes").insert({
    user_id: session.user.id,
    title: body.title?.trim() || "Без названия",
    content,
    emoji: body.emoji ?? null,
    tags: body.tags ?? [],
    folder: body.folder ?? "general",
    is_pinned: body.is_pinned ?? false,
    word_count: wordCount,
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
