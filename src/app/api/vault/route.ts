import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { safeSearchTerm } from "@/lib/search-filter";

// GET /api/vault — list the signed-in user's custom vault items.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  let query = db.from("vault_items").select("*").eq("user_id", session.user.id).order("updated_at", { ascending: false }).limit(limit);
  if (type && type !== "all") query = query.eq("type", type);
  const safeQ = safeSearchTerm(q);
  if (safeQ) query = query.or(`title.ilike.%${safeQ}%,content.ilike.%${safeQ}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

// POST /api/vault — create a vault item.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; content?: string; type?: string; tags?: string[]; source?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 }); }
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ success: false, error: "Заголовок обязателен" }, { status: 400 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db.from("vault_items").insert({
    user_id: session.user.id,
    title,
    content: (body.content ?? "").slice(0, 100000),
    type: ["doc", "note", "memory", "project", "report"].includes(body.type ?? "") ? body.type : "doc",
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
    source: body.source ?? "Добавлено вручную",
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
