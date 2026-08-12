"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Search, ChevronLeft, ChevronRight, ArrowLeft, ArrowUpDown } from "lucide-react";

// ─── /admin/users — таблица пользователей ─────────────────────────────────────
// Данные из /api/admin/users (view admin_user_stats). Поиск, фильтры по тарифу
// и активности, сортировка, пагинация. Доступ проверяет сервер (requireAdmin).

const BG = "#05060A", SURF = "rgba(255,255,255,0.025)", BORD = "rgba(255,255,255,0.07)";
const TP = "#E5E7EB", TS = "rgba(255,255,255,0.5)", TM = "rgba(255,255,255,0.28)";
const ACCENT = "#6366f1";

interface Row {
  user_id: string; email: string; name: string | null; plan: string;
  created_at: string; last_visit: string | null;
  requests_total: number; requests_today: number; sessions_count: number; revenue: number;
  usage_month?: number; limit_month?: number | null; remaining_month?: number | null;
  sub_status?: string; expires_at?: string | null;
}

const PLAN_COLORS: Record<string, string> = { none: TM, starter: "#a5b4fc", pro: "#34d399", max: "#fbbf24" };

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [demo, setDemo] = useState(false);

  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [active, setActive] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, plan, active, sort, order, page: String(page), limit: String(limit) });
    try {
      const r = await fetch(`/api/admin/users?${q}`);
      if (r.status === 401 || r.status === 403) { setForbidden(true); return; }
      const d = await r.json();
      if (d.success) { setRows(d.rows); setTotal(d.total); setDemo(!!d.demo); }
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [search, plan, active, sort, order, page]);

  useEffect(() => { const t = setTimeout(load, search ? 350 : 0); return () => clearTimeout(t); }, [load, search]);

  const toggleSort = (col: string) => {
    if (sort === col) setOrder(o => (o === "asc" ? "desc" : "asc"));
    else { setSort(col); setOrder("desc"); }
    setPage(1);
  };

  const pages = Math.max(1, Math.ceil(total / limit));

  if (forbidden) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, color: TP, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Доступ только для администратора</div>
          <a href="/dashboard" style={{ color: "#a5b4fc", fontSize: 14 }}>← В дашборд</a>
        </div>
      </div>
    );
  }

  const th = (label: string, col?: string): React.ReactNode => (
    <th onClick={col ? () => toggleSort(col) : undefined}
      style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: sort === col ? "#c7d2fe" : TM, cursor: col ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}>
      {label}{col && <ArrowUpDown size={10} style={{ marginLeft: 5, opacity: sort === col ? 1 : 0.35, display: "inline" }} />}
    </th>
  );

  const selStyle: React.CSSProperties = { height: 38, borderRadius: 9, padding: "0 10px", fontSize: 13, color: TP, background: "rgba(255,255,255,0.035)", border: `1px solid ${BORD}`, outline: "none" };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: TP }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 40px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <a href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TS, textDecoration: "none", marginBottom: 14 }}>
            <ArrowLeft size={13} /> Аналитика
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={19} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Пользователи</h1>
              <div style={{ fontSize: 12, color: TM }}>{total} всего{demo ? " · демо-режим (нет Supabase)" : ""}</div>
            </div>
          </div>

          {/* Фильтры */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ position: "relative", flex: "1 1 260px" }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: 12, color: TM }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Поиск по email или имени…"
                style={{ ...selStyle, width: "100%", paddingLeft: 32, boxSizing: "border-box" }} />
            </div>
            <select value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }} style={selStyle}>
              <option value="">Все тарифы</option>
              <option value="none">Без тарифа</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="max">Max</option>
            </select>
            <select value={active} onChange={e => { setActive(e.target.value); setPage(1); }} style={selStyle}>
              <option value="">Любая активность</option>
              <option value="7d">Активны за 7 дней</option>
              <option value="30d">Активны за 30 дней</option>
            </select>
          </div>

          {/* Таблица */}
          <div style={{ borderRadius: 16, border: `1px solid ${BORD}`, background: SURF, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead><tr style={{ borderBottom: `1px solid ${BORD}` }}>
                  {th("Пользователь", "email")}{th("Тариф")}{th("Статус")}{th("Расход за месяц", "usage_month")}{th("Остаток")}{th("Действует до", "expires_at")}{th("Запросы", "requests_total")}{th("Сессии", "sessions_count")}{th("Последний визит", "last_visit")}{th("Выручка", "revenue")}{th("Регистрация", "created_at")}
                </tr></thead>
                <tbody>
                  {loading && rows.length === 0 && (
                    <tr><td colSpan={11} style={{ padding: 28, textAlign: "center", color: TM, fontSize: 13 }}>Загружаем…</td></tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr><td colSpan={11} style={{ padding: 28, textAlign: "center", color: TM, fontSize: 13 }}>
                      {demo ? "Подключи Supabase и выполни миграции — здесь появятся реальные пользователи." : "Никого не найдено."}
                    </td></tr>
                  )}
                  {rows.map(r => (
                    <tr key={r.user_id} onClick={() => router.push(`/admin/users/${r.user_id}`)}
                      style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: TP }}>{r.name || "—"}</div>
                        <div style={{ fontSize: 11.5, color: TM }}>{r.email}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: PLAN_COLORS[r.plan] ?? TS, padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORD}` }}>{r.plan}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: r.sub_status === "active" ? "#34d399" : r.sub_status === "expired" ? "#f59e0b" : TM }}>
                          {r.sub_status === "active" ? "активна" : r.sub_status === "expired" ? "истекла" : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        {r.usage_month ?? 0} / {r.limit_month === null ? "∞" : r.limit_month ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: r.remaining_month === 0 ? "#f59e0b" : TS }}>
                        {r.remaining_month === null ? "∞" : r.remaining_month ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12.5, color: TS }}>{fmtDate(r.expires_at ?? null)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{r.requests_total}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{r.sessions_count}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12.5, color: TS }}>{fmtDate(r.last_visit)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: r.revenue > 0 ? "#34d399" : TM }}>${Number(r.revenue).toFixed(0)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12.5, color: TS }}>{fmtDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пагинация */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 12, color: TM }}>стр. {page} из {pages}</span>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...selStyle, width: 38, cursor: page > 1 ? "pointer" : "default", opacity: page > 1 ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={15} /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ ...selStyle, width: 38, cursor: page < pages ? "pointer" : "default", opacity: page < pages ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={15} /></button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
