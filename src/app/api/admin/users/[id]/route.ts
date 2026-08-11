import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// GET /api/admin/users/[id] — карточка пользователя: профиль, активность,
// AI-использование (COUNT'ы, не выгрузка таблицы), платежи и таймлайн событий.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: admin.status });

  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, error: "База не настроена" }, { status: 503 });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const dayStart  = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const weekAgo   = new Date(Date.now() - 7 * 864e5).toISOString();
  const monthAgo  = new Date(Date.now() - 30 * 864e5).toISOString();
  const cnt = (q: Promise<{ count: number | null }>) => q.then(r => r.count ?? 0, () => 0);

  const [profile, reqTotal, reqToday, req7d, req30d, reqOk, reqErr, sessions, payments, aiRecent, viewsRecent, sessRecent] = await Promise.all([
    db.from("users").select("id, email, name, plan, plan_expires_at, created_at, last_login_at, last_ai_request_at, ai_requests_count, is_admin").eq("id", id).maybeSingle().then((r: { data: unknown }) => r.data, () => null),
    cnt(db.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", id)),
    cnt(db.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", dayStart)),
    cnt(db.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", weekAgo)),
    cnt(db.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", monthAgo)),
    cnt(db.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", id).eq("status", "ok")),
    cnt(db.from("ai_requests").select("id", { count: "exact", head: true }).eq("user_id", id).eq("status", "error")),
    db.from("user_sessions").select("started_at, last_activity_at, device_type, browser, os", { count: "exact" }).eq("user_id", id).order("started_at", { ascending: false }).limit(50).then((r: { data: unknown[]; count: number }) => r, () => ({ data: [], count: 0 })),
    db.from("payments").select("track_id, plan, amount, currency, status, provider, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50).then((r: { data: unknown[] }) => r.data ?? [], () => []),
    db.from("ai_requests").select("created_at, feature, status, model, response_time_ms").eq("user_id", id).order("created_at", { ascending: false }).limit(25).then((r: { data: unknown[] }) => r.data ?? [], () => []),
    db.from("page_views").select("created_at, path").eq("user_id", id).order("created_at", { ascending: false }).limit(25).then((r: { data: unknown[] }) => r.data ?? [], () => []),
    db.from("user_sessions").select("started_at").eq("user_id", id).order("started_at", { ascending: false }).limit(10).then((r: { data: unknown[] }) => r.data ?? [], () => []),
  ]);

  if (!profile) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });

  // Средняя длительность сессии — по последним 50 (не грузим всю историю).
  type Sess = { started_at: string; last_activity_at: string };
  const sess = (sessions.data ?? []) as Sess[];
  const durations = sess.map(s => Math.max(0, +new Date(s.last_activity_at) - +new Date(s.started_at)));
  const avgSessionMin = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000 * 10) / 10 : 0;

  // Таймлайн: смешиваем события и сортируем по времени.
  type Ev = { ts: string; kind: string; label: string };
  const timeline: Ev[] = [
    ...(sessRecent as { started_at: string }[]).map(s => ({ ts: s.started_at, kind: "session", label: "Вошёл на сайт" })),
    ...(viewsRecent as { created_at: string; path: string }[]).map(v => ({ ts: v.created_at, kind: "view", label: `Открыл ${v.path}` })),
    ...(aiRecent as { created_at: string; feature: string; status: string }[]).map(a => ({
      ts: a.created_at, kind: a.status === "error" ? "ai_error" : "ai",
      label: a.status === "error" ? `AI-запрос (${a.feature}) — ошибка` : `AI-запрос (${a.feature})`,
    })),
  ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 40);

  const paid = (payments as { amount: number; status: string }[]).filter(p => p.status === "PAID");

  return NextResponse.json({
    success: true,
    profile,
    activity: {
      sessions_total: sessions.count ?? sess.length,
      avg_session_min: avgSessionMin,
      last_login_at: (profile as { last_login_at?: string }).last_login_at ?? null,
      devices: sess.slice(0, 5).map(s => s),
    },
    ai: { total: reqTotal, today: reqToday, week: req7d, month: req30d, ok: reqOk, errors: reqErr, recent: aiRecent },
    payments: {
      count: paid.length,
      revenue: paid.reduce((s, p) => s + Number(p.amount || 0), 0),
      last: payments[0] ?? null,
      history: payments,
    },
    timeline,
  });
}
