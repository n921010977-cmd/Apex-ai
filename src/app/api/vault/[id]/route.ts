import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/vault/[id] — update a vault item the user owns.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { title?: string; content?: string; tags?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Некорректный запрос" }, { status: 400 }); }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.content === "string") update.content = body.content.slice(0, 100000);
  if (Array.isArray(body.tags)) update.tags = body.tags.slice(0, 20);

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db.from("vault_items").update(update).eq("id", id).eq("user_id", session.user.id).select().single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE /api/vault/[id] — delete a vault item the user owns.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("vault_items").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
