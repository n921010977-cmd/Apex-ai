import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/agents — list org's agents
export async function GET() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get org ID from membership
  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ agents: [] });

  const { data, error } = await db
    .from("agents")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data });
}

// POST /api/agents — create agent
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Get or create org
  let orgId: string;
  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", user.id).maybeSingle();
  if (membership) {
    orgId = membership.organization_id;
  } else {
    const { data: org } = await db.from("organizations").insert({ name: `${user.email}'s Workspace`, owner_id: user.id, plan: "free" }).select().single();
    orgId = org.id;
    await db.from("members").insert({ user_id: user.id, organization_id: orgId, role: "owner" });
  }

  const { data, error } = await db.from("agents").insert({
    organization_id: orgId,
    name: body.name,
    description: body.description ?? null,
    type: body.type ?? "assistant",
    system_prompt: body.system_prompt ?? "You are a helpful AI assistant.",
    model: body.model ?? "claude-haiku-4-5-20251001",
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 2000,
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}
