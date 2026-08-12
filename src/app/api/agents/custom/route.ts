import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse } from "@/lib/errors";

// GET /api/agents/custom — the signed-in user's custom / cloned agents.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Demo mode — no database. The page falls back to localStorage.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true, agents: [] });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data } = await db
    .from("custom_agents")
    .select("data")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = (data ?? []).map((r: any) => r.data).filter(Boolean);
  return NextResponse.json({ success: true, agents });
}

// POST /api/agents/custom — create or update a custom agent (upsert by its id).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: { agent?: any };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
  const agent = body.agent;
  if (!agent?.id || !agent?.name) return NextResponse.json({ success: false, error: "Некорректный агент" }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ success: true });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("custom_agents").upsert(
    { id: String(agent.id), user_id: session.user.id, data: agent, updated_at: new Date().toISOString() },
    { onConflict: "user_id,id" },
  );
  if (error) return dbErrorResponse(error, "/api/agents/custom");

  return NextResponse.json({ success: true });
}
