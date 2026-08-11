import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// GET /api/admin/users — таблица пользователей для админки.
// Данные из view admin_user_stats (агрегаты считает Postgres, не мы в цикле).
// ?search= &plan= &active=7d &sort=created_at|last_visit|requests_total|revenue
// &order=asc|desc &page=1 &limit=25

const SORTS = new Set(["created_at", "last_visit", "requests_total", "revenue", "sessions_count", "email"]);

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: admin.status });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, demo: true, rows: [], total: 0 });
  }

  const q = req.nextUrl.searchParams;
  const search = (q.get("search") ?? "").trim().slice(0, 100);
  const plan   = (q.get("plan") ?? "").trim();
  const active = q.get("active") ?? "";
  const sort   = SORTS.has(q.get("sort") ?? "") ? q.get("sort")! : "created_at";
  const order  = q.get("order") === "asc";
  const page   = Math.max(1, Number(q.get("page")) || 1);
  const limit  = Math.min(100, Math.max(1, Number(q.get("limit")) || 25));

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db.from("admin_user_stats").select("*", { count: "exact" });
  if (search) {
    // PostgREST-инъекции: экранируем спецсимволы шаблона.
    const safe = search.replace(/[%_,().]/g, " ");
    query = query.or(`email.ilike.%${safe}%,name.ilike.%${safe}%`);
  }
  if (plan && ["starter", "pro", "max", "none"].includes(plan)) query = query.eq("plan", plan);
  if (active === "7d")  query = query.gte("last_visit", new Date(Date.now() - 7 * 864e5).toISOString());
  if (active === "30d") query = query.gte("last_visit", new Date(Date.now() - 30 * 864e5).toISOString());

  const { data, count, error } = await query
    .order(sort, { ascending: order, nullsFirst: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return NextResponse.json({ success: false, error: "Ошибка запроса" }, { status: 500 });
  return NextResponse.json({ success: true, rows: data ?? [], total: count ?? 0, page, limit });
}
