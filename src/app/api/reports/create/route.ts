/**
 * POST /api/reports/create
 *
 * Protected endpoint to initiate the generation of a 100-page AI business report.
 *
 * Flow:
 *  1. Authenticate user (JWT session)
 *  2. Fetch user from DB, reset monthly counter if needed
 *  3. Enforce tier-based limits (FREE: 3, PRO: 20, MAX: 100 reports/month)
 *  4. Validate request body
 *  5. Fetch project data for AI context
 *  6. Create Report record with genStatus=PROCESSING
 *  7. Launch async AI pipeline (fire-and-forget, non-blocking)
 *  8. Return 202 Accepted with { reportId } so the client can begin polling
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBody, GenerateReportSchema } from "@/lib/validators";
import { startAiOrchestrator } from "@/lib/ai/orchestrator";

// ─── Per-tier report limits ───────────────────────────────────────────────────

const TIER_LIMITS: Record<string, number> = {
  FREE:       3,
  PRO:        20,
  MAX:        100,
  // Legacy role-based limits as fallback
  BUSINESS:   100,
  ENTERPRISE: Infinity,
  ADMIN:      Infinity,
  FOUNDER:    Infinity,
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — please sign in", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // ── 2. Validate request body ───────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { data: body, error: validErr } = validateBody(GenerateReportSchema, raw);
  if (validErr || !body) {
    return NextResponse.json({ success: false, error: validErr }, { status: 422 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // ── 3. Fetch user + check/reset monthly limit ──────────────────────────
  const { data: user, error: userErr } = await db
    .from("users")
    .select("id, role, tier, reports_generated_month, max_reports_per_month, limit_reset_date")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    return NextResponse.json(
      { success: false, error: "User record not found" },
      { status: 404 },
    );
  }

  const now = new Date();

  // Reset monthly counter if the reset date has passed
  const resetDate = user.limit_reset_date ? new Date(user.limit_reset_date) : null;
  const needsReset = !resetDate || now >= resetDate;

  let currentCount: number = needsReset ? 0 : (user.reports_generated_month ?? 0);

  if (needsReset) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await db
      .from("users")
      .update({
        reports_generated_month: 0,
        limit_reset_date:        nextReset.toISOString(),
      })
      .eq("id", userId);
  }

  // Resolve limit: tier takes priority, then role, then DB value
  const tierKey = (user.tier ?? user.role ?? "FREE") as string;
  const limit   = TIER_LIMITS[tierKey] ?? (user.max_reports_per_month ?? 3);

  if (currentCount >= limit) {
    return NextResponse.json(
      {
        success: false,
        error:   "Достигнут месячный лимит отчётов. Обновите тариф для создания новых.",
        code:    "LIMIT_REACHED",
        payload: {
          used:    currentCount,
          limit,
          tier:    tierKey,
          resetAt: resetDate?.toISOString() ?? null,
        },
      },
      { status: 403 },
    );
  }

  // ── 4. Fetch project data for AI context ───────────────────────────────
  const { data: project, error: projErr } = await db
    .from("projects")
    .select("id, name, description, industry, stage, goals, timeframe, target_revenue, analysis")
    .eq("id", body.projectId)
    .eq("user_id", userId)
    .single();

  if (projErr || !project) {
    return NextResponse.json(
      { success: false, error: "Project not found or access denied" },
      { status: 404 },
    );
  }

  // ── 5. Create Report record with PROCESSING status ─────────────────────
  const reportTitle =
    body.title ??
    `${project.name} — ${body.type === "EXECUTIVE" ? "Полный стратегический отчёт" : "Бизнес-анализ"}`;

  const { data: report, error: reportErr } = await db
    .from("reports")
    .insert({
      user_id:      userId,
      project_id:   body.projectId,
      title:        reportTitle,
      type:         body.type ?? "EXECUTIVE",
      content:      "",
      status:       "DRAFT",
      gen_status:   "PROCESSING",
      overall_score: null,
      total_pages:  0,
      summary:      null,
      metadata:     JSON.stringify({
        startedAt:    now.toISOString(),
        projectName:  project.name,
        tier:         tierKey,
      }),
    })
    .select("id, title, gen_status, created_at")
    .single();

  if (reportErr || !report) {
    console.error("[reports/create] DB insert error:", reportErr);
    return NextResponse.json(
      { success: false, error: "Failed to create report record" },
      { status: 500 },
    );
  }

  // ── 6. Increment usage counter immediately ─────────────────────────────
  await db
    .from("users")
    .update({ reports_generated_month: currentCount + 1 })
    .eq("id", userId);

  // ── 7. Launch async AI pipeline — non-blocking fire-and-forget ─────────
  //
  // We deliberately do NOT await this. The response is returned to the client
  // immediately (202 Accepted) while the pipeline runs in the background.
  // The client polls GET /api/reports/{id} to track progress.
  //
  // In a production environment with Vercel, replace this with a queue:
  //   - Vercel: `@vercel/functions` background task or Upstash QStash
  //   - Self-hosted: BullMQ + Redis
  //   - Any provider: an async webhook to a long-running Node process
  //
  startAiOrchestrator(report.id, body.projectId, {
    name:          project.name,
    description:   project.description ?? "",
    industry:      project.industry    ?? "Общий",
    stage:         project.stage       ?? "IDEA",
    goals:         Array.isArray(project.goals) ? project.goals : [],
    timeframe:     project.timeframe   ?? "12 месяцев",
    targetRevenue: project.target_revenue ?? "",
    analysis:      project.analysis   ?? null,
  }).catch((err: unknown) => {
    // Best-effort: mark report as FAILED if the background process crashes
    console.error("[orchestrator] Fatal error:", err);
    db.from("reports")
      .update({ gen_status: "FAILED", metadata: JSON.stringify({ error: String(err) }) })
      .eq("id", report.id)
      .then(() => {})
      .catch(() => {});
  });

  // ── 8. Return 202 Accepted ─────────────────────────────────────────────
  return NextResponse.json(
    {
      success: true,
      data: {
        reportId:  report.id,
        title:     report.title,
        status:    "PROCESSING",
        createdAt: report.created_at,
        limits: {
          used:    currentCount + 1,
          total:   limit,
          tier:    tierKey,
        },
      },
    },
    { status: 202 },
  );
}
