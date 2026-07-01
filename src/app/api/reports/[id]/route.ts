import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch report + sections in one go
  const { data: report, error } = await db
    .from("reports")
    .select(`
      id, title, type, status, gen_status, overall_score, total_pages, summary, created_at, updated_at, project_id,
      report_sections ( id, type, title, content, score, status, sort_order )
    `)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !report) {
    return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
  }

  // Sort sections by sort_order
  if (Array.isArray(report.report_sections)) {
    report.report_sections.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
    );
  }

  return NextResponse.json({ success: true, data: report });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
