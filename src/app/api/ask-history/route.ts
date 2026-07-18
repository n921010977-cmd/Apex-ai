import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/ask-history — list the user's saved dialogues (newest first)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("ask_history")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Map DB rows back to the client AskEntry shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data ?? []).map((r: any) => ({
    id: r.client_id,
    kind: r.kind,
    question: r.question,
    date: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    agentSlug: r.agent_slug ?? undefined,
    agentName: r.agent_name ?? undefined,
    agentRole: r.agent_role ?? undefined,
    color: r.color ?? undefined,
    answer: r.answer ?? undefined,
    responses: r.responses ?? undefined,
    verdict: r.verdict ?? undefined,
  }));

  return NextResponse.json({ success: true, data: items });
}

// POST /api/ask-history — upsert one entry (idempotent on client_id)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.question) return NextResponse.json({ success: false, error: "Invalid entry" }, { status: 400 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from("ask_history")
    .upsert({
      user_id: session.user.id,
      client_id: String(body.id),
      kind: body.kind === "council" ? "council" : "agent",
      question: String(body.question).slice(0, 4000),
      agent_slug: body.agentSlug ?? null,
      agent_name: body.agentName ?? null,
      agent_role: body.agentRole ?? null,
      color: body.color ?? null,
      answer: body.answer ?? null,
      responses: body.responses ?? null,
      verdict: body.verdict ?? null,
      created_at: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    }, { onConflict: "user_id,client_id" });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
