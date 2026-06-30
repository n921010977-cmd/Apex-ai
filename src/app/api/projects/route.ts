import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects — list user's projects
export async function GET() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data });
}

// POST /api/projects — create project
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Get or create personal organization for user
  let orgId: string;
  const { data: membership } = await db
    .from("members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (membership) {
    orgId = membership.organization_id;
  } else {
    const { data: org } = await db
      .from("organizations")
      .insert({ name: `${user.email}'s Workspace`, owner_id: user.id, plan: "free" })
      .select()
      .single();
    orgId = org.id;
    await db.from("members").insert({ user_id: user.id, organization_id: orgId, role: "owner" });
  }

  const { data, error } = await db
    .from("projects")
    .insert({
      organization_id: orgId,
      user_id: user.id,
      name: body.name,
      description: body.description,
      industry: body.industry,
      stage: body.stage,
      goals: body.goals ?? [],
      target_revenue: body.targetRevenue,
      timeframe: body.timeframe ?? "12",
      overall_score: body.score ?? 0,
      status: "active",
      ai_results: body.aiResults ?? [],
      metadata: body.metadata ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("activity_logs").insert({
    organization_id: orgId,
    user_id: user.id,
    type: "project_create",
    data: { project_id: data.id, name: body.name },
  });

  return NextResponse.json({ project: data });
}
