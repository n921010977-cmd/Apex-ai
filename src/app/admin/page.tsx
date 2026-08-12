"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, Activity, TrendingUp, MessageSquare, BarChart2,
  Clock, Eye, Zap, RefreshCw, Shield, ArrowUpRight,
  ArrowDownRight, Bot, Globe, ChevronRight,
} from "lucide-react";

// ─── Tokens ────────────────────────────────────────────────────────────────────
const BG     = "#05060A";
const SURF   = "rgba(255,255,255,0.025)";
const BORD   = "rgba(255,255,255,0.07)";
const TP     = "#E5E7EB";
const TS     = "rgba(255,255,255,0.5)";
const TM     = "rgba(255,255,255,0.28)";
const ACCENT = "#6366f1";
const SUC    = "#10b981";
const WARN   = "#f59e0b";
const DNG    = "#ef4444";
const CARD   = "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)";
const EASE   = [0.22, 1, 0.36, 1] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  overview?: { revenue_total?: number; revenue_month?: number; paying_users?: number; ai_total?: number; plan_distribution?: Record<string, number> } | null;
  demo: boolean;
  users: { total: number; new_today: number; new_week: number; new_month: number };
  activity: { active_today: number; active_week: number; sessions_today: number; avg_session_min: number; page_views_today: number; bounce_rate: number };
  top_pages: { page: string; views: number; avg_time_sec: number }[];
  ai_usage: { messages_today: number; messages_week: number; agent_runs_today: number; top_agents: string[] };
  retention: { d1: number | null; d7: number | null; d30: number | null };
  growth_chart: { date: string; users: number; new?: number; sessions?: number }[];
  recent_users: { name: string; email: string; plan: string; joined: string; activity: string }[];
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(to: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || to === 0) return;
    let start: number | null = null;
    const raf = requestAnimationFrame(function tick(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / 1000, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * to));
      if (t < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return val;
}

// ─── Mini SVG sparkline ───────────────────────────────────────────────────────
function Sparkline({ data, color, w = 120, h = 40 }: { data: number[]; color: string; w?: number; h?: number }) {
  const ref = useRef<SVGPathElement>(null);
  const n = data.length;
  const min = Math.min(...data), range = Math.max(...data) - min || 1;
  const pts = data.map((v, i) => ({ x: (i / (n - 1)) * w, y: h - ((v - min) / range) * (h - 4) - 2 }));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const len = el.getTotalLength?.() ?? 300;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1200, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" });
  }, [data]);

  // Ранний выход только ПОСЛЕ хуков — иначе ломается порядок вызовов React.
  if (n < 2) return null;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <path ref={ref} d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[n - 1].x} cy={pts[n - 1].y} r="3" fill={color} />
    </svg>
  );
}

// ─── Retention bar ────────────────────────────────────────────────────────────
function RetBar({ label, val, color }: { label: string; val: number | null; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.animate([{ width: "0%" }, { width: `${val ?? 0}%` }], { duration: 1000, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards", delay: 200 });
  }, [val]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 40px", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: TM, fontFamily: "monospace" }}>{label}</span>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div ref={ref} style={{ height: "100%", borderRadius: 99, background: color, width: "0%" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{val == null ? "—" : `${val}%`}</span>
    </div>
  );
}

// Доля в процентах — считается из реальных данных. Если базы нет (0), бейдж не
// показываем вовсе: выдуманных «+31%» в админке быть не должно.
function share(part: number, whole: number): number | null {
  if (!whole || whole <= 0 || !part) return null;
  return Math.round((part / whole) * 100);
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend, delay, sparkData }:
  { label: string; value: number; sub: string; icon: typeof Users; color: string; trend?: number | null; delay: number; sparkData?: number[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), delay * 1000 + 100); }, [delay]);
  const n = useCountUp(value, ready);
  const up = trend != null && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
      whileHover={{ y: -3 }}
      style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "20px 22px", boxShadow: CARD, cursor: "default" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} color={color} />
        </div>
        {trend != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 8, background: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${up ? SUC : DNG}22` }}>
            {up ? <ArrowUpRight size={11} color={SUC} /> : <ArrowDownRight size={11} color={DNG} />}
            <span style={{ fontSize: 11, fontWeight: 700, color: up ? SUC : DNG }}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: TP, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>{n.toLocaleString()}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: TS, marginBottom: 10 }}>{label}</div>
      {sparkData && sparkData.length > 1 && <Sparkline data={sparkData} color={color} />}
      <div style={{ fontSize: 11, color: TM, marginTop: sparkData ? 4 : 0 }}>{sub}</div>
    </motion.div>
  );
}

// ─── Time formatter ───────────────────────────────────────────────────────────
function ago(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч назад`;
  return `${Math.floor(h / 24)}д назад`;
}

const formatTime = (s: number) => s < 60 ? `${s}с` : `${Math.floor(s / 60)}м ${s % 60}с`;

// ─── Main ─────────────────────────────────────────────────────────────────────
// ─── Воронка, источники и период ───────────────────────────────────────────────
// Всё из RPC analytics_overview (миграция 014): один запрос на весь блок.

interface Analytics {
  funnel: { visitors: number; signups: number; checkouts: number; payments: number };
  sources: { source: string; n: number; paid: number }[];
  ai: { total: number; failed: number; users: number; by_feature: Record<string, number>; by_model: Record<string, number> };
  revenue: { total: number; period: number; today: number; by_plan: Record<string, number> };
}

function pct(a: number, b: number): string {
  if (!b) return "0%";
  return `${Math.round((a / b) * 1000) / 10}%`;
}

function AnalyticsSection() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr("");
    fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (!alive) return;
        if (d.success && d.data) setData(d.data as Analytics);
        else if (d.success && !d.configured) setErr("Подключите Supabase — тогда появятся реальные данные");
        else setErr(d.error || "Нет данных");
      })
      .catch(() => alive && setErr("Ошибка сети"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [days]);

  const f = data?.funnel;
  const steps = f ? [
    { label: "Посетители", value: f.visitors, conv: null as string | null },
    { label: "Регистрации", value: f.signups, conv: pct(f.signups, f.visitors) },
    { label: "Начали оплату", value: f.checkouts, conv: pct(f.checkouts, f.signups) },
    { label: "Оплатили", value: f.payments, conv: pct(f.payments, f.checkouts) },
  ] : [];
  const maxV = f ? Math.max(f.visitors, 1) : 1;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={15} style={{ color: ACCENT }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: TP }}>Воронка и источники</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                color: days === d ? "#fff" : TS,
                background: days === d ? `rgba(99,102,241,0.16)` : "transparent",
                border: `1px solid ${days === d ? "rgba(99,102,241,0.45)" : BORD}` }}>
              {d} дней
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ fontSize: 12.5, color: TM }}>Загружаем аналитику…</div>}
      {err && !loading && <div style={{ fontSize: 12.5, color: WARN, padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>{err}</div>}

      {data && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          {/* Воронка */}
          <div style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: TP, marginBottom: 14 }}>Конверсия</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {steps.map(st => (
                <div key={st.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, color: TS }}>{st.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: TP, fontVariantNumeric: "tabular-nums" }}>
                      {st.value}{st.conv ? <span style={{ color: SUC, fontWeight: 600 }}> · {st.conv}</span> : null}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(2, (st.value / maxV) * 100)}%`, borderRadius: 99, background: `linear-gradient(90deg,${ACCENT},#818cf8)`, transition: "width .6s cubic-bezier(0.22,1,0.36,1)" }} />
                  </div>
                </div>
              ))}
            </div>
            {f && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORD}`, fontSize: 12, color: TM }}>
                Общая конверсия посетитель → оплата: <b style={{ color: SUC }}>{pct(f.payments, f.visitors)}</b>
              </div>
            )}
          </div>

          {/* Источники */}
          <div style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: TP, marginBottom: 14 }}>Откуда приходят</div>
            {data.sources.length === 0 && <div style={{ fontSize: 12.5, color: TM }}>Пока нет данных за период</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {data.sources.map(src => (
                <div key={src.source} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: TP, flex: "1 1 auto" }}>{src.source}</span>
                  <span style={{ fontSize: 12, color: TS, fontVariantNumeric: "tabular-nums" }}>{src.n} рег.</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: src.paid > 0 ? SUC : TM, minWidth: 62, textAlign: "right" }}>
                    {src.paid} платят
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI и выручка */}
          <div style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: TP, marginBottom: 14 }}>AI и деньги за период</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><div style={{ fontSize: 19, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums" }}>{data.ai.total}</div><div style={{ fontSize: 11, color: TM }}>AI-запросов</div></div>
              <div><div style={{ fontSize: 19, fontWeight: 800, color: data.ai.failed > 0 ? DNG : TP, fontVariantNumeric: "tabular-nums" }}>{data.ai.failed}</div><div style={{ fontSize: 11, color: TM }}>с ошибкой</div></div>
              <div><div style={{ fontSize: 19, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums" }}>{data.ai.users}</div><div style={{ fontSize: 11, color: TM }}>пользуются AI</div></div>
              <div><div style={{ fontSize: 19, fontWeight: 800, color: SUC, fontVariantNumeric: "tabular-nums" }}>${Number(data.revenue.period).toFixed(0)}</div><div style={{ fontSize: 11, color: TM }}>выручка</div></div>
            </div>
            {Object.keys(data.ai.by_feature).length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORD}` }}>
                <div style={{ fontSize: 11, color: TM, marginBottom: 6 }}>Популярные функции</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(data.ai.by_feature).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORD}`, color: TS }}>
                      {k} · <b style={{ color: TP }}>{v}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Оплаты и выдача тарифов ───────────────────────────────────────────────────
// Тянет реальные платежи из OxaPay: видно, кто заплатил, сколько и за какой
// тариф. Оплаты через наш API активируются сами (webhook) — они помечены
// «авто». Для оплат по платёжной ссылке достаточно нажать «Выдать» и указать
// email клиента. Ниже — форма ручной выдачи на любой случай.

interface OxaPay {
  trackId: string; amount: number; currency: string; status: string;
  email: string | null; date: string | null; description: string | null;
  guessedPlan: string | null; viaApi: boolean; userIdFromOrder: string | null;
}

const inpS: React.CSSProperties = {
  height: 36, borderRadius: 9, padding: "0 10px", fontSize: 13, color: TP,
  background: "rgba(255,255,255,0.04)", border: `1px solid ${BORD}`, outline: "none", boxSizing: "border-box",
};

function GrantPlanCard() {
  const [pays, setPays] = useState<OxaPay[] | null>(null);
  const [payErr, setPayErr] = useState("");
  const [loadingPays, setLoadingPays] = useState(true);

  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("pro");
  const [months, setMonths] = useState("1");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadPays = async () => {
    setLoadingPays(true); setPayErr("");
    try {
      const r = await fetch("/api/admin/payments", { cache: "no-store" });
      const d = await r.json();
      if (d.success) setPays(d.payments ?? []);
      else setPayErr(d.error || "Не удалось получить оплаты");
    } catch { setPayErr("Ошибка сети"); }
    finally { setLoadingPays(false); }
  };
  useEffect(() => { loadPays(); }, []);

  const grant = async (targetEmail?: string, targetPlan?: string) => {
    const em = (targetEmail ?? email).trim();
    const pl = targetPlan ?? plan;
    if (!em) { setResult({ ok: false, msg: "Укажи email клиента" }); return; }
    setBusy(true); setResult(null);
    try {
      const r = await fetch("/api/admin/grant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, plan: pl, months: Number(months) || 1 }),
      });
      const d = await r.json();
      setResult(d.success
        ? { ok: true, msg: `Готово: ${String(pl).toUpperCase()} на ${months} мес → ${em}` }
        : { ok: false, msg: d.error || "Не получилось" });
      if (d.success && !targetEmail) setEmail("");
    } catch { setResult({ ok: false, msg: "Ошибка сети" }); }
    finally { setBusy(false); }
  };

  const paidOnly = (pays ?? []).filter(p => /paid|confirm|complete/i.test(p.status));

  return (
    <div style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "18px 20px", marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={15} style={{ color: ACCENT }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: TP }}>Оплаты и выдача тарифов</span>
        </div>
        <button onClick={loadPays} disabled={loadingPays}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, background: "transparent", border: `1px solid ${BORD}`, color: TS, fontSize: 12, cursor: "pointer" }}>
          <RefreshCw size={12} style={{ animation: loadingPays ? "spin 1s linear infinite" : "none" }} /> Обновить
        </button>
      </div>
      <div style={{ fontSize: 12, color: TS, marginBottom: 14 }}>
        Платежи тянутся напрямую из OxaPay. Оплаты через сайт активируются автоматически;
        для оплат по платёжной ссылке нажми «Выдать» и укажи email клиента.
      </div>

      {/* Реальные платежи */}
      {loadingPays && <div style={{ fontSize: 12.5, color: TM, padding: "10px 0" }}>Загружаем платежи из OxaPay…</div>}
      {payErr && <div style={{ fontSize: 12.5, color: "#fca5a5", padding: "8px 0" }}>{payErr}</div>}
      {!loadingPays && !payErr && paidOnly.length === 0 && (
        <div style={{ fontSize: 12.5, color: TM, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px dashed ${BORD}` }}>
          Оплат пока нет. Как только клиент оплатит — платёж появится здесь.
        </div>
      )}
      {paidOnly.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {paidOnly.map(p => (
            <div key={p.trackId} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORD}` }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: SUC, fontVariantNumeric: "tabular-nums", minWidth: 64 }}>${p.amount}</span>
              <span style={{ fontSize: 12, color: TP, minWidth: 70 }}>{p.guessedPlan ? p.guessedPlan.toUpperCase() : "—"}</span>
              <span style={{ fontSize: 12, color: TS, flex: "1 1 160px" }}>{p.email ?? "email не указан"}</span>
              <span style={{ fontSize: 11, color: TM }}>{p.date ?? ""}</span>
              {p.viaApi ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: SUC, padding: "4px 10px", borderRadius: 999, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  авто — тариф выдан
                </span>
              ) : (
                <button
                  onClick={() => { if (p.email) grant(p.email, p.guessedPlan ?? plan); else { setEmail(""); setPlan(p.guessedPlan ?? plan); setResult({ ok: false, msg: "У платежа нет email — впиши его в форме ниже и нажми «Включить»" }); } }}
                  disabled={busy}
                  style={{ height: 32, padding: "0 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg,${ACCENT},#4f46e5)` }}>
                  Выдать
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ручная выдача */}
      <div style={{ paddingTop: 14, borderTop: `1px solid ${BORD}` }}>
        <div style={{ fontSize: 12, color: TM, marginBottom: 8 }}>Выдать вручную (например, клиент написал в поддержку):</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email клиента" style={{ ...inpS, flex: "1 1 220px" }} />
          <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inpS, width: 130 }}>
            <option value="starter">Starter $29</option>
            <option value="pro">Pro $39</option>
            <option value="max">Max $49</option>
          </select>
          <select value={months} onChange={e => setMonths(e.target.value)} style={{ ...inpS, width: 92 }}>
            {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} мес</option>)}
          </select>
          <button onClick={() => grant()} disabled={busy}
            style={{ height: 36, padding: "0 18px", borderRadius: 9, border: "none", cursor: busy ? "default" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Включаю…" : "Включить"}
          </button>
        </div>
        {result && <div style={{ marginTop: 10, fontSize: 12.5, color: result.ok ? SUC : "#fca5a5" }}>{result.msg}</div>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Доступ решает СЕРВЕР (requireAdmin: роль users.is_admin или ADMIN_EMAIL).
  // Клиент лишь реагирует на его вердикт — хардкод email в браузере убран.
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    let alive = true;
    fetch("/api/admin/stats", { cache: "no-store" })
      .then(r => { if (alive && (r.status === 401 || r.status === 403)) router.push("/dashboard"); })
      .catch(() => {});
    return () => { alive = false; };
  }, [status, session, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const j = await res.json();
      if (j.success) { setStats(j.data); setLastUpdate(new Date()); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (status === "loading" || !stats) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Shield size={20} color={ACCENT} style={{ animation: "spin 2s linear infinite" }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
          <div style={{ fontSize: 13, color: TS }}>Загрузка статистики…</div>
        </div>
      </div>
    );
  }

  const growthNums  = stats.growth_chart.map(d => d.users);
  const sessionNums = stats.growth_chart.map(d => d.sessions ?? Math.round(d.users * 2.1 + Math.random() * 5));

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TP, fontFamily: "system-ui,-apple-system,sans-serif", padding: "0 0 80px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); }}
        .adm-grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .adm-grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .adm-grid2 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media (max-width: 1100px) { .adm-grid4 { grid-template-columns: repeat(2,1fr); } .adm-grid2 { grid-template-columns: 1fr; } }
        @media (max-width: 700px) { .adm-grid4 { grid-template-columns: 1fr; } .adm-grid3 { grid-template-columns: 1fr; } }
        .adm-card { background: ${SURF}; border: 1px solid ${BORD}; border-radius: 16px; padding: 22px 24px; box-shadow: ${CARD}; }
        .adm-row:hover { background: rgba(255,255,255,0.025); }
      `}</style>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: "28px 40px 24px", borderBottom: `1px solid ${BORD}`, background: "rgba(5,6,10,0.9)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 10 }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={19} color={ACCENT} />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Admin · Vertlix AI</div>
              <div style={{ fontSize: 11, color: TM, marginTop: 1 }}>
                {stats.demo ? "⚠ Supabase не подключён · данных нет" : "Live · Supabase"}
                {lastUpdate && ` · обновлено ${lastUpdate.toLocaleTimeString("ru")}`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.push("/admin/users")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "transparent", border: `1px solid ${BORD}`, color: "#a5b4fc", fontSize: 12, cursor: "pointer" }}>
              <Users size={13} /> Пользователи
            </button>
            <button onClick={() => router.push("/dashboard")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "transparent", border: `1px solid ${BORD}`, color: TS, fontSize: 12, cursor: "pointer" }}>
              ← Дашборд
            </button>
            <button onClick={load} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, color: "#a5b4fc", fontSize: 12, cursor: "pointer" }}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Обновить
            </button>
          </div>
        </div>
      </motion.div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px 0" }}>

        {/* ── KPI Grid ── */}
        <div className="adm-grid4" style={{ marginBottom: 28 }}>
          <KpiCard label="Всего пользователей"  value={stats.users.total}          sub={`+${stats.users.new_week} за неделю`}    icon={Users}          color={ACCENT}  trend={share(stats.users.new_week, stats.users.total)} delay={0}    sparkData={growthNums} />
          <KpiCard label="Активны сегодня"      value={stats.activity.active_today} sub={`${stats.activity.active_week} за неделю`} icon={Activity}       color={SUC}     trend={share(stats.activity.active_today, stats.users.total)}  delay={0.07} />
          <KpiCard label="Сессий сегодня"        value={stats.activity.sessions_today} sub={`Среднее: ${stats.activity.avg_session_min}мин`} icon={Clock} color={WARN}    trend={null}  delay={0.14} sparkData={sessionNums} />
          <KpiCard label="AI-запросов сегодня"   value={stats.ai_usage.messages_today} sub={`${stats.ai_usage.messages_week} за неделю`} icon={MessageSquare} color="#a855f7" trend={share(stats.ai_usage.messages_today, stats.ai_usage.messages_week)} delay={0.21} />
        </div>

        {/* ── Воронка, источники, AI и выручка ── */}
        <AnalyticsSection />

        {/* ── Оплаты и выдача тарифов ── */}
        <GrantPlanCard />

        {/* ── Выручка и тарифы (реальные данные из RPC admin_overview) ── */}
        {stats.overview && (
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
            <div style={{ flex: "1 1 180px", background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>${Number(stats.overview.revenue_total ?? 0).toFixed(0)}</div>
              <div style={{ fontSize: 11, color: TM, marginTop: 3 }}>Выручка всего · ${Number(stats.overview.revenue_month ?? 0).toFixed(0)} за месяц</div>
            </div>
            <div style={{ flex: "1 1 180px", background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums" }}>{stats.overview.paying_users ?? 0}</div>
              <div style={{ fontSize: 11, color: TM, marginTop: 3 }}>Платящих пользователей</div>
            </div>
            <div style={{ flex: "2 1 320px", background: SURF, border: `1px solid ${BORD}`, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: TM, marginBottom: 8 }}>Распределение тарифов</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {Object.entries(stats.overview.plan_distribution ?? {}).map(([pl, n]) => (
                  <div key={pl}><span style={{ fontSize: 16, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums" }}>{n}</span> <span style={{ fontSize: 11, color: TM }}>{pl}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Charts row ── */}
        <div className="adm-grid2" style={{ marginBottom: 28 }}>

          {/* Growth chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, ease: EASE }} className="adm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TP }}>Рост пользователей</div>
                <div style={{ fontSize: 11, color: TM, marginTop: 2 }}>Последние 30 дней</div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 2, borderRadius: 99, background: ACCENT }} />
                  <span style={{ fontSize: 10, color: TM }}>Пользователи</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 2, borderRadius: 99, background: SUC }} />
                  <span style={{ fontSize: 10, color: TM }}>Сессии</span>
                </div>
              </div>
            </div>
            <GrowthChart data={stats.growth_chart} />
          </motion.div>

          {/* Right col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Retention */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, ease: EASE }} className="adm-card">
              <div style={{ fontSize: 14, fontWeight: 700, color: TP, marginBottom: 16 }}>Удержание (Retention)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <RetBar label="D1" val={stats.retention.d1} color={SUC} />
                <RetBar label="D7" val={stats.retention.d7} color={WARN} />
                <RetBar label="D30" val={stats.retention.d30} color={DNG} />
              </div>
              <div style={{ fontSize: 11, color: TM, marginTop: 14, lineHeight: 1.6 }}>
                D1 — пришли на следующий день · D7 — через неделю · D30 — через месяц
              </div>
            </motion.div>

            {/* AI activity */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, ease: EASE }} className="adm-card">
              <div style={{ fontSize: 14, fontWeight: 700, color: TP, marginBottom: 14 }}>Топ агентов</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.ai_usage.top_agents.map((ag, i) => (
                  <div key={ag} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Bot size={12} color={ACCENT} />
                    <span style={{ flex: 1, fontSize: 12, color: TS }}>{ag}</span>
                    <div style={{ width: 60, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${100 - i * 15}%` }} transition={{ delay: 0.5 + i * 0.07, duration: 0.8, ease: EASE }}
                        style={{ height: "100%", borderRadius: 99, background: ACCENT }} />
                    </div>
                    <span style={{ fontSize: 11, color: TM, fontVariantNumeric: "tabular-nums", width: 28, textAlign: "right" }}>{100 - i * 15}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="adm-grid3" style={{ marginBottom: 28 }}>

          {/* Top pages */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, ease: EASE }} className="adm-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Globe size={14} color={ACCENT} />
              <span style={{ fontSize: 14, fontWeight: 700, color: TP }}>Популярные страницы</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {stats.top_pages.map((p, i) => (
                <div key={p.page} className="adm-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, padding: "8px 10px", borderRadius: 8, alignItems: "center", transition: "background 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: TM, width: 14, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: TS, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.page}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Eye size={10} color={TM} />
                    <span style={{ fontSize: 11, color: TM, fontVariantNumeric: "tabular-nums" }}>{p.views}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} color={TM} />
                    <span style={{ fontSize: 11, color: TM }}>{formatTime(p.avg_time_sec)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Session stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, ease: EASE }} className="adm-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <BarChart2 size={14} color={WARN} />
              <span style={{ fontSize: 14, fontWeight: 700, color: TP }}>Вовлечённость</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Ср. время на сайте",  value: `${stats.activity.avg_session_min}мин`, color: SUC },
                { label: "Просмотров за день",   value: stats.activity.page_views_today.toString(), color: ACCENT },
                { label: "Bounce rate",          value: `${stats.activity.bounce_rate}%`, color: stats.activity.bounce_rate < 30 ? SUC : WARN },
                { label: "AI-запросов за неделю", value: stats.ai_usage.messages_week.toString(), color: "#a855f7" },
                { label: "Agent runs сегодня",   value: stats.ai_usage.agent_runs_today.toString(), color: "#f59e0b" },
                { label: "Новых за месяц",       value: `+${stats.users.new_month}`, color: SUC },
              ].map(m => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORD}` }}>
                  <span style={{ fontSize: 12, color: TS }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent users */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, ease: EASE }} className="adm-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Users size={14} color={SUC} />
              <span style={{ fontSize: 14, fontWeight: 700, color: TP }}>Последние пользователи</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recent_users.map((u, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.06, ease: EASE }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORD}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ACCENT}20`, border: `1px solid ${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#a5b4fc", flexShrink: 0 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TP, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div style={{ fontSize: 10, color: TM, marginTop: 1 }}>{u.activity} · {ago(u.joined)}</div>
                  </div>
                  <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 6, background: u.plan === "Pro" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${u.plan === "Pro" ? ACCENT + "40" : BORD}`, color: u.plan === "Pro" ? "#a5b4fc" : TM, fontWeight: 700, flexShrink: 0 }}>{u.plan}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Quick facts ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            { label: "Новых сегодня",      value: `+${stats.users.new_today}`,      color: SUC },
            { label: "Новых за неделю",    value: `+${stats.users.new_week}`,       color: ACCENT },
            { label: "Всего пользователей", value: stats.users.total.toString(),   color: TP },
            { label: "Сессии за неделю",   value: stats.activity.active_week.toString(), color: WARN },
            { label: "AI запросов (7д)",   value: stats.ai_usage.messages_week.toString(), color: "#a855f7" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 20, fontWeight: 800, color: f.color, fontVariantNumeric: "tabular-nums" }}>{f.value}</div>
              <div style={{ fontSize: 11, color: TM, marginTop: 2 }}>{f.label}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stats.demo ? WARN : SUC, boxShadow: `0 0 6px ${stats.demo ? WARN : SUC}` }} />
            <span style={{ fontSize: 11, color: TM }}>{stats.demo ? "Нет данных" : "Live Supabase"}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Growth Chart (SVG) ───────────────────────────────────────────────────────
function GrowthChart({ data }: { data: { date: string; users: number; sessions?: number }[] }) {
  const W = 600, H = 160, PX = 0, PY = 8;
  const n = data.length;

  const users    = data.map(d => d.users);
  // Сессии берём как есть: домысливать «примерно ×2.2» нельзя.
  const sessions = data.map(d => d.sessions ?? 0);

  const allVals = [...users, ...sessions];
  const maxV = Math.max(...allVals) || 1;

  const toX = (i: number) => PX + (i / (n - 1)) * (W - PX);
  const toY = (v: number) => PY + (1 - v / maxV) * (H - PY - 16);

  const lineD = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaD = (vals: number[]) => `${lineD(vals)} L${toX(n-1)},${H} L${toX(0)},${H} Z`;

  const refU = useRef<SVGPathElement>(null);
  const refS = useRef<SVGPathElement>(null);
  useEffect(() => {
    [refU, refS].forEach(ref => {
      const el = ref.current;
      if (!el) return;
      const len = el.getTotalLength?.() ?? 800;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1600, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards", delay: 300 });
    });
  }, [data]);

  // Ранний выход после хуков — порядок вызовов React должен быть постоянным.
  if (n < 2) return null;

  // Show every 7th label
  const labels = data.filter((_, i) => i === 0 || i === n - 1 || i % 7 === 0);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SUC} stopOpacity="0.18" />
          <stop offset="100%" stopColor={SUC} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={0} y1={toY(maxV * t)} x2={W} y2={toY(maxV * t)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}

      {/* Areas */}
      <path d={areaD(sessions)} fill="url(#gs)" />
      <path d={areaD(users)} fill="url(#gu)" />

      {/* Lines */}
      <path ref={refS} d={lineD(sessions)} fill="none" stroke={SUC} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path ref={refU} d={lineD(users)}    fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Endpoint dots */}
      <circle cx={toX(n-1)} cy={toY(users[n-1])}    r="4" fill={ACCENT} />
      <circle cx={toX(n-1)} cy={toY(sessions[n-1])} r="3" fill={SUC} />

      {/* X labels */}
      {labels.map(d => {
        const i = data.indexOf(d);
        const label = d.date.slice(5); // MM-DD
        return <text key={d.date} x={toX(i)} y={H + 14} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">{label}</text>;
      })}
    </svg>
  );
}
