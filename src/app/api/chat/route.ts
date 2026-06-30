import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chat — list conversations
export async function GET() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ conversations: [] });

  const { data, error } = await db
    .from("conversations")
    .select("id, title, status, created_at, updated_at, agent_id, agents(name)")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}

// POST /api/chat — create conversation
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

  const { data, error } = await db.from("conversations").insert({
    organization_id: orgId,
    user_id: user.id,
    agent_id: body.agentId ?? null,
    project_id: body.projectId ?? null,
    title: body.title ?? "New Chat",
    status: "active",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
