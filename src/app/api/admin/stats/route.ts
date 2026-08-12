import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// ─── Нет Supabase → честные нули ──────────────────────────────────────────────
// Никаких выдуманных цифр: если хранилище не подключено, админка показывает
// пустую статистику и предупреждение, а не правдоподобный вымысел.
function emptyStats() {
  const now = Date.now();
  const dayMs = 86400000;
  return {
    demo: true,
    users: { total: 0, new_today: 0, new_week: 0, new_month: 0 },
    activity: {
      active_today: 0, active_week: 0, sessions_today: 0,
      avg_session_min: 0, page_views_today: 0, bounce_rate: 0,
    },
    top_pages: [] as { page: string; views: number; avg_time_sec: number }[],
    ai_usage: { messages_today: 0, messages_week: 0, agent_runs_today: 0, top_agents: [] as string[] },
    retention: { d1: 0, d7: 0, d30: 0 },
    growth_chart: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * dayMs).toISOString().slice(0, 10),
      users: 0,
      sessions: 0,
    })),
    recent_users: [] as { name: string; email: string; plan: string; joined: string; activity: string }[],
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: admin.status });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, data: emptyStats() });
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

  // Реальное удержание и вовлечённость (RPC из миграции 014). Пока миграция не
  // применена — оставляем нули, но НИКОГДА не подставляем правдоподобные цифры.
  let retention: { d1: number | null; d7: number | null; d30: number | null } = { d1: null, d7: null, d30: null };
  try {
    const { data } = await db.rpc("retention_rates");
    if (data && typeof data === "object") retention = { d1: data.d1 ?? null, d7: data.d7 ?? null, d30: data.d30 ?? null };
  } catch { /* нет RPC — покажем «—» */ }

  let engagement: Record<string, number> = {};
  try {
    const { data } = await db.rpc("engagement_stats");
    if (data && typeof data === "object") engagement = data as Record<string, number>;
  } catch { /* нет RPC */ }

  // Топ функций AI — из реальных запросов, а не фиксированный список агентов.
  let top_agents: string[] = [];
  try {
    const { data: ai } = await db.from("ai_requests").select("feature").gte("created_at", weekAgo).limit(5000);
    if (Array.isArray(ai) && ai.length) {
      const c: Record<string, number> = {};
      for (const r of ai as { feature: string }[]) c[r.feature] = (c[r.feature] ?? 0) + 1;
      top_agents = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f]) => f);
    }
  } catch { /* нет таблицы */ }

  // Последние регистрации — реальные пользователи, email маскируем.
  let recent_users: { name: string; email: string; plan: string; joined: string; activity: string }[] = [];
  try {
    const { data: ru } = await db.from("users")
      .select("name, email, plan, created_at, last_login_at")
      .order("created_at", { ascending: false }).limit(8);
    if (Array.isArray(ru)) {
      recent_users = (ru as { name?: string; email?: string; plan?: string; created_at: string; last_login_at?: string }[])
        .map(u => ({
          name: u.name || "—",
          email: (u.email ?? "").replace(/^(.{2}).*(@.*)$/, "$1***$2"),
          plan: u.plan && u.plan !== "none" ? u.plan : "free",
          joined: u.created_at,
          activity: u.last_login_at ? `Вход ${new Date(u.last_login_at).toLocaleDateString("ru")}` : "—",
        }));
    }
  } catch { /* нет таблицы */ }

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
        sessions_today: Number(engagement.sessions_today ?? 0),
        avg_session_min: Number(engagement.avg_session_min ?? 0),
        page_views_today: Number(engagement.page_views_today ?? 0),
        bounce_rate: Number(engagement.bounce_rate ?? 0),
      },
      ai_usage: {
        messages_today: Number(overview?.ai_today ?? msgsToday),
        messages_week:  Number(overview?.ai_week ?? totalMsgs),
        agent_runs_today: runsToday,
        top_agents,
      },
      retention,
      growth_chart,
      top_pages: top_pages_live ?? [],
      recent_users,
      // Реальная сводка (RPC admin_overview из миграции 012): выручка, тарифы,
      // AI по дням и т.д. Страница показывает этот блок, когда он есть.
      overview,
    },
  });
}
