import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, demo: true, data: [], total: 0, unread_count: 0 });
  }

  const { searchParams } = new URL(req.url);
  const unread_only = searchParams.get("unread") === "true";
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unread_only) query = query.eq("is_read", false);
  if (type) query = query.eq("type", type);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Also return unread count
  const { count: unreadCount } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("is_read", false);

  return NextResponse.json({
    success: true,
    data: data ?? [],
    total: count ?? 0,
    unread_count: unreadCount ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: { ids?: string[]; all?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (body.all) {
    // Mark all as read
    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, updated: "all" });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids array required" }, { status: 422 });
  }

  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .in("id", body.ids)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: body.ids.length });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const read_only = searchParams.get("read_only") === "true";

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db.from("notifications").delete().eq("user_id", session.user.id);
  if (read_only) query = query.eq("is_read", true);

  const { error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
