import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBody, CreateTaskSchema, PaginationSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pagination = PaginationSchema.parse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
    search: searchParams.get("search"),
    sortOrder: searchParams.get("sortOrder") ?? "desc",
  });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const userId = session.user.id!;

  const { page, limit } = pagination;
  let query = db.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (pagination.search) query = query.ilike("title", `%${pagination.search}%`);

  const { data, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const { count } = await db.from("tasks").select("id", { count: "exact" }).eq("user_id", userId);
  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = validateBody(CreateTaskSchema, rawBody);
  if (error || !data) return NextResponse.json({ success: false, error }, { status: 422 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: task, error: dbError } = await db.from("tasks").insert({
    user_id: session.user.id,
    title: data.title,
    description: data.description,
    priority: data.priority,
    due_date: data.dueDate,
    project_id: data.projectId,
    status: "TODO",
  }).select().single();

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true, data: task }, { status: 201 });
}
