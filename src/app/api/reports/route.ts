import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBody, CreateReportSchema } from "@/lib/validators";
import { reportLimiter, getIdentifier, rateLimitResponse } from "@/lib/middleware/rate-limit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db.from("reports").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const identifier = getIdentifier(req, session.user.id);
  const limit = await reportLimiter(identifier);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = validateBody(CreateReportSchema, rawBody);
  if (error || !data) return NextResponse.json({ success: false, error }, { status: 422 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: report, error: dbError } = await db.from("reports").insert({
    user_id: session.user.id,
    title: data.title,
    content: data.content,
    type: data.type,
    project_id: data.projectId,
    status: "DRAFT",
    version: 1,
  }).select().single();

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true, data: report }, { status: 201 });
}
