import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { dbErrorResponse } from "@/lib/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("projects").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Whitelist updatable fields — never let the client set user_id, organization_id,
  // id or created_at via a raw body (mass assignment).
  const PROJECT_UPDATABLE = ["name", "description", "industry", "stage", "goals", "target_revenue", "timeframe", "overall_score", "status", "ai_results", "metadata"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of PROJECT_UPDATABLE) if (k in body) patch[k] = body[k];
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });

  const { data, error } = await db
    .from("projects").update(patch).eq("id", id).eq("user_id", user.id).select().maybeSingle();

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await db.from("projects").delete().eq("id", id).eq("user_id", user.id);
  if (error) return dbErrorResponse(error, "/api/projects/[id]");
  return NextResponse.json({ success: true });
}
