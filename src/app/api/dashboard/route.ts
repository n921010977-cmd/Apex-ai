import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const EMPTY_DASHBOARD = {
  kpis: {
    projects: { total: 0, active: 0, completed: 0 },
    tasks: { total: 0, todo: 0, in_progress: 0, done: 0 },
    ai_usage: { messages_30d: 0, tokens_30d: 0 },
    strategies: { total: 0, generated: 0, drafts: 0 },
    risks: { total: 0, active: 0, critical: 0, mitigated: 0 },
    board_meetings: { total: 0, completed: 0 },
    notes: { total: 0, recent_7d: 0, total_words: 0 },
    notifications: { unread: 0 },
  },
  recent: { projects: [], strategies: [] },
};

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Demo mode (no Supabase): return an empty-but-valid payload instead of crashing.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, demo: true, data: EMPTY_DASHBOARD });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const userId = session.user.id!;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    projectsRes,
    messagesRes,
    tasksRes,
    strategiesRes,
    risksRes,
    notesRes,
    meetingsRes,
    notificationsRes,
    recentProjectsRes,
    recentStrategiesRes,
  ] = await Promise.allSettled([
    db.from("projects").select("id, status, title, updated_at").eq("user_id", userId),
    db.from("messages").select("id, tokens_used, created_at").eq("user_id", userId).gte("created_at", thirtyDaysAgo),
    db.from("tasks").select("id, status, title, updated_at").eq("user_id", userId),
    db.from("strategies").select("id, status, title, updated_at").eq("user_id", userId),
    db.from("risks").select("id, status, probability, impact").eq("user_id", userId),
    db.from("notes").select("id, word_count, updated_at").eq("user_id", userId).eq("is_deleted", false),
    db.from("board_meetings").select("id, status, title, completed_at").eq("user_id", userId),
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false),
    db.from("projects").select("id, title, status, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5),
    db.from("strategies").select("id, title, status, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5),
  ]);

  const safe = <T>(r: PromiseSettledResult<{ data: T[] | null }>): T[] =>
    r.status === "fulfilled" ? r.value.data ?? [] : [];

  const projects = safe<{ id: string; status: string; title: string; updated_at: string }>(projectsRes as PromiseSettledResult<{ data: { id: string; status: string; title: string; updated_at: string }[] | null }>);
  const messages = safe<{ id: string; tokens_used: number; created_at: string }>(messagesRes as PromiseSettledResult<{ data: { id: string; tokens_used: number; created_at: string }[] | null }>);
  const tasks = safe<{ id: string; status: string; title: string; updated_at: string }>(tasksRes as PromiseSettledResult<{ data: { id: string; status: string; title: string; updated_at: string }[] | null }>);
  const strategies = safe<{ id: string; status: string; title: string; updated_at: string }>(strategiesRes as PromiseSettledResult<{ data: { id: string; status: string; title: string; updated_at: string }[] | null }>);
  const risks = safe<{ id: string; status: string; probability: number; impact: number }>(risksRes as PromiseSettledResult<{ data: { id: string; status: string; probability: number; impact: number }[] | null }>);
  const notes = safe<{ id: string; word_count: number; updated_at: string }>(notesRes as PromiseSettledResult<{ data: { id: string; word_count: number; updated_at: string }[] | null }>);
  const meetings = safe<{ id: string; status: string; title: string; completed_at: string }>(meetingsRes as PromiseSettledResult<{ data: { id: string; status: string; title: string; completed_at: string }[] | null }>);

  const unreadNotifications =
    notificationsRes.status === "fulfilled"
      ? (notificationsRes.value as { count: number | null }).count ?? 0
      : 0;

  const recentProjects = safe<{ id: string; title: string; status: string; updated_at: string }>(recentProjectsRes as PromiseSettledResult<{ data: { id: string; title: string; status: string; updated_at: string }[] | null }>);
  const recentStrategies = safe<{ id: string; title: string; status: string; updated_at: string }>(recentStrategiesRes as PromiseSettledResult<{ data: { id: string; title: string; status: string; updated_at: string }[] | null }>);

  const totalTokens = messages.reduce((s, m) => s + (m.tokens_used ?? 0), 0);
  const activeRisks = risks.filter(r => r.status === "active");
  const criticalRisks = activeRisks.filter(r => r.probability * r.impact >= 16);
  const recentNotes = notes.filter(n => n.updated_at >= sevenDaysAgo);

  return NextResponse.json({
    success: true,
    data: {
      kpis: {
        projects: {
          total: projects.length,
          active: projects.filter(p => p.status === "ACTIVE").length,
          completed: projects.filter(p => p.status === "COMPLETED").length,
        },
        tasks: {
          total: tasks.length,
          todo: tasks.filter(t => t.status === "TODO").length,
          in_progress: tasks.filter(t => t.status === "IN_PROGRESS").length,
          done: tasks.filter(t => t.status === "DONE").length,
        },
        ai_usage: {
          messages_30d: messages.length,
          tokens_30d: totalTokens,
        },
        strategies: {
          total: strategies.length,
          generated: strategies.filter(s => s.status === "generated" || s.status === "published").length,
          drafts: strategies.filter(s => s.status === "draft").length,
        },
        risks: {
          total: risks.length,
          active: activeRisks.length,
          critical: criticalRisks.length,
          mitigated: risks.filter(r => r.status === "mitigated").length,
        },
        board_meetings: {
          total: meetings.length,
          completed: meetings.filter(m => m.status === "completed").length,
        },
        notes: {
          total: notes.length,
          recent_7d: recentNotes.length,
          total_words: notes.reduce((s, n) => s + (n.word_count ?? 0), 0),
        },
        notifications: {
          unread: unreadNotifications,
        },
      },
      recent: {
        projects: recentProjects,
        strategies: recentStrategies,
      },
    },
  });
}
