import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

// GET /api/agents — list org's agents
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", userId).maybeSingle();
  if (!membership) return NextResponse.json({ agents: [] });

  const { data, error } = await db
    .from("agents")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (error) return dbErrorResponse(error, "/api/agents");
  return NextResponse.json({ agents: data });
}

// POST /api/agents — create agent
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const body = await req.json();

  let orgId: string;
  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", userId).maybeSingle();
  if (membership) {
    orgId = membership.organization_id;
  } else {
    const { data: user } = await db.from("users").select("email").eq("id", userId).maybeSingle();
    const { data: org } = await db.from("organizations").insert({ name: `${user?.email ?? userId}'s Workspace`, owner_id: userId, plan: "free" }).select().single();
    orgId = org.id;
    await db.from("members").insert({ user_id: userId, organization_id: orgId, role: "owner" });
  }

  const { data, error } = await db.from("agents").insert({
    organization_id: orgId,
    name:            body.name,
    description:     body.description  ?? null,
    type:            body.type         ?? "assistant",
    system_prompt:   body.system_prompt ?? "You are a helpful AI assistant.",
    model:           body.model        ?? "claude-haiku-4-5-20251001",
    temperature:     body.temperature  ?? 0.7,
    max_tokens:      body.max_tokens   ?? 2000,
    is_active:       true,
  }).select().single();

  if (error) return dbErrorResponse(error, "/api/agents");
  return NextResponse.json({ agent: data });
}
