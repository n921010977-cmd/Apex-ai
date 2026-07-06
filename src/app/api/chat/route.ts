import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/chat — list conversations
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: membership } = await db.from("members").select("organization_id").eq("user_id", userId).maybeSingle();
  if (!membership) return NextResponse.json({ conversations: [] });

  const { data, error } = await db
    .from("conversations")
    .select("id, title, status, created_at, updated_at, agent_id, agents(name)")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}

// POST /api/chat — create conversation
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

  const { data, error } = await db.from("conversations").insert({
    organization_id: orgId,
    user_id:         userId,
    agent_id:        body.agentId  ?? null,
    project_id:      body.projectId ?? null,
    title:           body.title    ?? "New Chat",
    status:          "active",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
