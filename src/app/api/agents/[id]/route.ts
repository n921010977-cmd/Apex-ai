import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/auth";

// Fields a client is allowed to change on an agent. Anything else in the body
// (organization_id, id, created_at, …) is ignored — no mass assignment.
const AGENT_UPDATABLE = ["name", "description", "type", "system_prompt", "model", "temperature", "max_tokens", "is_active"] as const;

// Resolve the caller's organization; every agent operation is scoped to it so a
// user can only ever touch agents in their own org (no IDOR across orgs).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callerOrgId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from("members").select("organization_id").eq("user_id", userId).maybeSingle();
  return data?.organization_id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await callerOrgId(db, user.id);
  if (!orgId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await db.from("agents").select("*").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ agent: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await callerOrgId(db, user.id);
  if (!orgId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Whitelist — copy only allowed keys that were actually provided.
  const patch: Record<string, unknown> = {};
  for (const k of AGENT_UPDATABLE) if (k in body) patch[k] = body[k];
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });

  const { data, error } = await db
    .from("agents").update(patch).eq("id", id).eq("organization_id", orgId).select().maybeSingle();
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ agent: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await callerOrgId(db, user.id);
  if (!orgId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await db.from("agents").delete().eq("id", id).eq("organization_id", orgId);
  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
