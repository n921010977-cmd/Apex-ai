"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Activity, MessageSquare, CreditCard, Clock, LogIn, Eye, Zap, AlertTriangle } from "lucide-react";

// ─── /admin/users/[id] — карточка пользователя ────────────────────────────────
// Профиль · активность · AI-использование · платежи · таймлайн событий.

const BG = "#05060A", SURF = "rgba(255,255,255,0.025)", BORD = "rgba(255,255,255,0.07)";
const TP = "#E5E7EB", TS = "rgba(255,255,255,0.5)", TM = "rgba(255,255,255,0.28)";
const ACCENT = "#7C3AED";

interface Detail {
  profile: { email: string; name: string | null; plan: string | null; plan_expires_at: string | null; created_at: string; last_login_at: string | null; is_admin: boolean };
  activity: { sessions_total: number; avg_session_min: number; last_login_at: string | null };
  ai: { total: number; today: number; week: number; month: number; ok: number; errors: number };
  payments: { count: number; revenue: number; last: { plan: string; amount: number; status: string; created_at: string } | null; history: { track_id: string; plan: string; amount: number; currency: string; status: string; created_at: string }[] };
  timeline: { ts: string; kind: string; label: string }[];
}

const fmtDT = (s: string | null) => s ? new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const TL_ICON: Record<string, typeof LogIn> = { session: LogIn, view: Eye, ai: Zap, ai_error: AlertTriangle };
const TL_COLOR: Record<string, string> = { session: "#34d399", view: "#a5b4fc", ai: "#c7d2fe", ai_error: "#f87171" };

function Card({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${BORD}`, background: SURF, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={15} style={{ color: "#a5b4fc" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: TP }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: tone ?? TP, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11, color: TM, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(j => { if (j.success) setD(j); else setErr(j.error || "Ошибка"); })
      .catch(() => setErr("Ошибка сети"));
  }, [id]);

  if (err) return <div style={{ minHeight: "100dvh", background: BG, color: TS, display: "flex", alignItems: "center", justifyContent: "center" }}>{err}</div>;
  if (!d) return <div style={{ minHeight: "100dvh", background: BG, color: TM, display: "flex", alignItems: "center", justifyContent: "center" }}>Загружаем…</div>;

  const p = d.profile;
  return (
    <div style={{ minHeight: "100dvh", background: BG, color: TP }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 40px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <a href="/admin/users" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TS, textDecoration: "none", marginBottom: 14 }}>
            <ArrowLeft size={13} /> Все пользователи
          </a>

          {/* Профиль */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: `linear-gradient(135deg,${ACCENT},#6D28D9)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
              {(p.name || p.email || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                {p.name || p.email}{p.is_admin && <span style={{ marginLeft: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 999, padding: "3px 9px", verticalAlign: "middle" }}>ADMIN</span>}
              </h1>
              <div style={{ fontSize: 12.5, color: TM }}>{p.email} · регистрация {fmtDT(p.created_at)} · тариф <b style={{ color: "#c7d2fe" }}>{p.plan ?? "none"}</b>{p.plan_expires_at ? ` до ${fmtDT(p.plan_expires_at)}` : ""}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 14 }}>
            <Card title="Активность" icon={Activity}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Stat label="сессий" value={d.activity.sessions_total} />
                <Stat label="средняя сессия" value={`${d.activity.avg_session_min}м`} />
                <Stat label="последний вход" value={fmtDT(d.activity.last_login_at)} />
              </div>
            </Card>
            <Card title="AI-использование" icon={MessageSquare}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <Stat label="всего" value={d.ai.total} />
                <Stat label="сегодня" value={d.ai.today} />
                <Stat label="7 дней" value={d.ai.week} />
                <Stat label="месяц" value={d.ai.month} />
                <Stat label="успешных" value={d.ai.ok} tone="#34d399" />
                <Stat label="ошибок" value={d.ai.errors} tone={d.ai.errors > 0 ? "#f87171" : undefined} />
              </div>
            </Card>
            <Card title="Платежи" icon={CreditCard}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: d.payments.history.length ? 12 : 0 }}>
                <Stat label="платежей" value={d.payments.count} />
                <Stat label="выручка" value={`$${Number(d.payments.revenue).toFixed(0)}`} tone="#34d399" />
              </div>
              {d.payments.history.slice(0, 5).map((pay, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderTop: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ color: TS }}>{fmtDT(pay.created_at)} · {pay.plan}</span>
                  <span style={{ fontWeight: 700, color: pay.status === "PAID" ? "#34d399" : pay.status === "PENDING" ? "#fbbf24" : "#f87171" }}>${pay.amount} · {pay.status}</span>
                </div>
              ))}
              {d.payments.history.length === 0 && <div style={{ fontSize: 12, color: TM }}>Платежей пока нет</div>}
            </Card>
          </div>

          {/* Таймлайн */}
          <Card title="Хронология активности" icon={Clock}>
            {d.timeline.length === 0 && <div style={{ fontSize: 12.5, color: TM }}>Событий пока нет — появятся после визитов и AI-запросов.</div>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {d.timeline.map((ev, i) => {
                const Icon = TL_ICON[ev.kind] ?? Eye;
                return (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderTop: i ? `1px solid rgba(255,255,255,0.035)` : "none", alignItems: "center" }}>
                    <span style={{ fontSize: 11.5, color: TM, width: 110, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmtDT(ev.ts)}</span>
                    <Icon size={13} style={{ color: TL_COLOR[ev.kind] ?? TS, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{ev.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
