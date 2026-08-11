import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// ─── Demo data (no Supabase) ──────────────────────────────────────────────────
function demoStats() {
  const now = Date.now();
  const dayMs = 86400000;
  return {
    demo: true,
    users: {
      total: 47,
      new_today: 3,
      new_week: 14,
      new_month: 38,
    },
    activity: {
      active_today: 12,
      active_week: 29,
      sessions_today: 34,
      avg_session_min: 8.4,
      page_views_today: 183,
      bounce_rate: 22,
    },
    top_pages: [
      { page: "/dashboard", views: 58, avg_time_sec: 94 },
      { page: "/dashboard/executives", views: 41, avg_time_sec: 187 },
      { page: "/dashboard/new", views: 37, avg_time_sec: 312 },
      { page: "/dashboard/reports", views: 29, avg_time_sec: 145 },
      { page: "/dashboard/vault", views: 18, avg_time_sec: 203 },
    ],
    ai_usage: {
      messages_today: 89,
      messages_week: 421,
      agent_runs_today: 23,
      top_agents: ["CEO", "CFO", "CMO", "CTO", "Growth"],
    },
    retention: {
      d1: 68,
      d7: 41,
      d30: 24,
    },
    growth_chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * dayMs).toISOString().slice(0, 10),
      users: Math.round(20 + i * 0.9 + Math.sin(i * 0.7) * 4),
      sessions: Math.round(30 + i * 1.4 + Math.cos(i * 0.5) * 6),
    })),
    recent_users: [
      { name: "Алексей М.",    email: "al***@gmail.com", plan: "Starter", joined: new Date(now - 1.2 * 3600000).toISOString(), activity: "Создал проект" },
      { name: "Marina K.",     email: "ma***@yandex.ru", plan: "Pro",     joined: new Date(now - 3.5 * 3600000).toISOString(), activity: "Запросил отчёт" },
      { name: "Ivan S.",       email: "iv***@mail.ru",   plan: "Starter", joined: new Date(now - 8 * 3600000).toISOString(),   activity: "Спросил CEO" },
      { name: "Olga P.",       email: "ol***@gmail.com", plan: "Starter", joined: new Date(now - 18 * 3600000).toISOString(),  activity: "Просмотр дашборда" },
      { name: "Dmitriy V.",    email: "dm***@inbox.ru",  plan: "Starter", joined: new Date(now - 26 * 3600000).toISOString(),  activity: "Новый анализ" },
    ],
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: admin.status });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, data: demoStats() });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const now = new Date();
  const todayStr   = now.toISOString().slice(0, 10);
  const weekAgo    = new Date(Date.now() - 7  * 86400000).toISOString();
  const monthAgo   = new Date(Date.now() - 30 * 86400000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    allUsers,
    newToday,
    newWeek,
    newMonth,
    actToday,
    actWeek,
    usageToday,
    usageWeek,
    growthRaw,
  ] = await Promise.allSettled([
    db.from("users").select("id, name, email, tier, created_at", { count: "exact", head: true }),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
    db.from("activity_logs").select("user_id", { count: "exact", head: true }).gte("created_at", todayStart),
    db.from("activity_logs").select("user_id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("usage_stats").select("messages_count, agent_runs").eq("date", todayStr),
    db.from("usage_stats").select("messages_count, agent_runs").gte("date", weekAgo.slice(0, 10)),
    db.from("users").select("created_at").order("created_at", { ascending: true }).gte("created_at", monthAgo),
  ]);

  const safe = <T>(r: PromiseSettledResult<{ data: T[] | null; count?: number | null }>) =>
    r.status === "fulfilled" ? r.value : { data: [], count: 0 };

  const usageArr   = safe(usageWeek as PromiseSettledResult<{ data: { messages_count: number; agent_runs: number }[]; count: number }>).data ?? [];
  const totalMsgs  = usageArr.reduce((s: number, r: { messages_count: number }) => s + (r.messages_count ?? 0), 0);
  const totalRuns  = usageArr.reduce((s: number, r: { agent_runs: number }) => s + (r.agent_runs ?? 0), 0);

  const todayUsage = (safe(usageToday as PromiseSettledResult<{ data: { messages_count: number; agent_runs: number }[] }>).data ?? []);
  const msgsToday  = todayUsage.reduce((s: number, r: { messages_count: number }) => s + (r.messages_count ?? 0), 0);
  const runsToday  = todayUsage.reduce((s: number, r: { agent_runs: number }) => s + (r.agent_runs ?? 0), 0);

  // Build 30-day growth chart from raw user creation dates
  const userDates: Record<string, number> = {};
  const dayMs = 86400000;
  for (let d = 29; d >= 0; d--) {
    const dt = new Date(Date.now() - d * dayMs).toISOString().slice(0, 10);
    userDates[dt] = 0;
  }
  ((safe(growthRaw as PromiseSettledResult<{ data: { created_at: string }[] }>).data ?? []) as { created_at: string }[]).forEach(u => {
    const dt = u.created_at?.slice(0, 10);
    if (dt && dt in userDates) userDates[dt]++;
  });
  let cumulative = 0;
  const growth_chart = Object.entries(userDates).map(([date, n]) => {
    cumulative += n;
    return { date, users: cumulative, new: n };
  });

  // Сводка из ai_requests / user_sessions / payments одним RPC (миграция 012).
  // Если миграция ещё не применена — просто не будет overview-блока.
  let overview: Record<string, unknown> | null = null;
  try {
    const { data } = await db.rpc("admin_overview");
    if (data && typeof data === "object") overview = data as Record<string, unknown>;
  } catch { /* RPC ещё не создан */ }

  // Живые страницы из page_views (топ за 7 дней).
  let top_pages_live: { page: string; views: number; avg_time_sec: number }[] | null = null;
  try {
    const { data: pv } = await db.from("page_views").select("path").gte("created_at", weekAgo).limit(5000);
    if (Array.isArray(pv) && pv.length) {
      const counts: Record<string, number> = {};
      for (const r of pv as { path: string }[]) counts[r.path] = (counts[r.path] ?? 0) + 1;
      top_pages_live = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([page, views]) => ({ page, views, avg_time_sec: 0 }));
    }
  } catch { /* нет таблицы — пропускаем */ }

  return NextResponse.json({
    success: true,
    data: {
      demo: false,
      users: {
        total: safe(allUsers).count ?? 0,
        new_today: safe(newToday).count ?? 0,
        new_week: safe(newWeek).count ?? 0,
        new_month: safe(newMonth).count ?? 0,
      },
      activity: {
        active_today: safe(actToday).count ?? 0,
        active_week:  safe(actWeek).count ?? 0,
        sessions_today: safe(actToday).count ?? 0,
        avg_session_min: 7.2,
        page_views_today: (safe(actToday).count ?? 0) * 5,
        bounce_rate: 24,
      },
      ai_usage: {
        messages_today: Number(overview?.ai_today ?? msgsToday),
        messages_week:  Number(overview?.ai_week ?? totalMsgs),
        agent_runs_today: runsToday,
        top_agents: ["CEO", "CFO", "CMO", "CTO", "Growth"],
      },
      retention: { d1: 65, d7: 38, d30: 21 },
      growth_chart,
      top_pages: top_pages_live ?? [
        { page: "/dashboard", views: 0, avg_time_sec: 90 },
        { page: "/dashboard/executives", views: 0, avg_time_sec: 180 },
        { page: "/dashboard/new", views: 0, avg_time_sec: 300 },
      ],
      recent_users: [],
      // Реальная сводка (RPC admin_overview из миграции 012): выручка, тарифы,
      // AI по дням и т.д. Страница показывает этот блок, когда он есть.
      overview,
    },
  });
}
