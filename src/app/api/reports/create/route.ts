import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBody, GenerateReportSchema } from "@/lib/validators";
import { generateReport } from "@/lib/agents/report-orchestrator";

// Plan limits: how many reports per month each tier can generate
const REPORT_LIMITS: Record<string, number> = {
  FREE:       3,
  PRO:        20,
  BUSINESS:   100,
  ENTERPRISE: Infinity,
  ADMIN:      Infinity,
  FOUNDER:    Infinity,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = validateBody(GenerateReportSchema, rawBody);
  if (error || !data) {
    return NextResponse.json({ success: false, error }, { status: 422 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // ── 1. Fetch user + check/reset monthly limit ──────────────────────────────
  const { data: user, error: userErr } = await db
    .from("users")
    .select("id, role, reports_this_month, reports_reset_at")
    .eq("id", session.user.id)
    .single();

  if (userErr || !user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const limit = REPORT_LIMITS[user.role as string] ?? REPORT_LIMITS.FREE;

  // Reset counter if a new calendar month has started
  const now = new Date();
  const resetAt = user.reports_reset_at ? new Date(user.reports_reset_at) : null;
  const needsReset = !resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear();

  const currentCount = needsReset ? 0 : (user.reports_this_month ?? 0);

  if (currentCount >= limit) {
    return NextResponse.json(
      {
        success: false,
        error: "Monthly report limit reached",
        code: "LIMIT_REACHED",
        used: currentCount,
        limit,
      },
      { status: 403 },
    );
  }

  // ── 2. Fetch project data for context ─────────────────────────────────────
  const { data: project, error: projErr } = await db
    .from("projects")
    .select("id, name, description, industry, stage, goals, timeframe, target_revenue")
    .eq("id", data.projectId)
    .eq("user_id", session.user.id)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  // ── 3. Create Report record (PROCESSING status) ───────────────────────────
  const reportTitle = data.title ?? `${project.name} — ${data.type === "EXECUTIVE" ? "Полный отчёт" : "Стратегический отчёт"}`;

  const { data: report, error: reportErr } = await db
    .from("reports")
    .insert({
      user_id: session.user.id,
      project_id: data.projectId,
      title: reportTitle,
      type: data.type,
      content: "",
      status: "DRAFT",
      gen_status: "PROCESSING",
      total_pages: 0,
      overall_score: null,
      summary: null,
    })
    .select("id, title, gen_status, created_at")
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ success: false, error: reportErr?.message ?? "DB error" }, { status: 500 });
  }

  // ── 4. Increment usage counter ────────────────────────────────────────────
  await db.from("users").update({
    reports_this_month: currentCount + 1,
    ...(needsReset ? { reports_reset_at: now.toISOString() } : {}),
  }).eq("id", session.user.id);

  // ── 5. Kick off async generation (fire-and-forget) ────────────────────────
  // In production use BullMQ / Edge Queue; here we use a non-blocking async call.
  generateReport({
    reportId: report.id,
    projectId: data.projectId,
    project: {
      name: project.name,
      description: project.description ?? "",
      industry: project.industry ?? "General",
      stage: project.stage ?? "IDEA",
      goals: project.goals ?? [],
      timeframe: project.timeframe ?? "12 месяцев",
      targetRevenue: project.target_revenue ?? "",
    },
    userId: session.user.id,
  }).catch((err: unknown) => {
    console.error("[report-generate] background error:", err);
    // Mark as FAILED — best effort
    db.from("reports").update({ gen_status: "FAILED" }).eq("id", report.id).catch(() => {});
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: report.id,
        title: report.title,
        status: "PROCESSING",
        createdAt: report.created_at,
        used: currentCount + 1,
        limit,
      },
    },
    { status: 201 },
  );
}
