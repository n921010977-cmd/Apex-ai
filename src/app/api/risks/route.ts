import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("risks")
    .select("*", { count: "exact" })
    .eq("user_id", session.user.id)
    .order("probability * impact" as string, { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    description?: string;
    category?: string;
    probability?: number;
    impact?: number;
    mitigation?: string;
    owner?: string;
    due_date?: string;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 422 });
  }

  const probability = Math.min(5, Math.max(1, body.probability ?? 3));
  const impact = Math.min(5, Math.max(1, body.impact ?? 3));

  const VALID_CATEGORIES = ["operational", "financial", "strategic", "legal", "technical", "reputational"];
  const category = VALID_CATEGORIES.includes(body.category ?? "") ? body.category : "operational";

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db.from("risks").insert({
    user_id: session.user.id,
    title: body.title.trim(),
    description: body.description ?? null,
    category,
    probability,
    impact,
    status: "active",
    mitigation: body.mitigation ?? null,
    owner: body.owner ?? null,
    due_date: body.due_date ?? null,
  }).select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
