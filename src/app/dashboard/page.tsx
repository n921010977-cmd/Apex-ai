"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FolderOpen, FileText, Lightbulb, TrendingUp,
  Zap, Search, Target, Calculator, Rocket, Shield,
  ChevronRight, Settings2,
} from "lucide-react";

// ─── Demo data (replaced by API when Supabase is live) ────────────────────────
const KPIS = [
  { label: "Активные проекты",  value: 7,   delta: "+2 за неделю",  icon: FolderOpen, spark: null as number[] | null },
  { label: "Отчётов создано",   value: 24,  delta: "+8 за неделю",  icon: FileText,   spark: null },
  { label: "Бизнес-инсайтов",   value: 132, delta: "+18 за неделю", icon: Lightbulb,  spark: null },
  { label: "Growth Score",      value: 87,  delta: "↑ 12%",         icon: TrendingUp, spark: [42, 48, 45, 56, 52, 61, 58, 70, 66, 78, 74, 87] },
];

const TEAM = [
  { role: "CEO / Стратег",       ab: "CEO", color: "#818cf8", g: ["#6366f1", "#4f46e5"], desc: "Определяет стратегию, оценивает возможности и задаёт направление." },
  { role: "CMO / Маркетинг",     ab: "CMO", color: "#34d399", g: ["#10b981", "#059669"], desc: "Находит рычаги роста: бренд, позиционирование, генерация спроса." },
  { role: "CFO / Финансы",       ab: "CFO", color: "#60a5fa", g: ["#3b82f6", "#2563eb"], desc: "Финансовые модели, прогнозы, unit-экономика и стратегия фандрайза." },
  { role: "Аналитик",            ab: "BA",  color: "#fbbf24", g: ["#f59e0b", "#d97706"], desc: "Исследование рынка, конкурентная разведка и анализ трендов." },
  { role: "Data Analyst",        ab: "DA",  color: "#22d3ee", g: ["#06b6d4", "#0891b2"], desc: "Превращает данные в инсайты, дашборды и рекомендации." },
  { role: "Продажи",             ab: "SD",  color: "#fb923c", g: ["#f97316", "#ea580c"], desc: "Воронка, цены, скрипты и стратегия закрытия сделок." },
  { role: "COO / Операции",      ab: "COO", color: "#f472b6", g: ["#ec4899", "#db2777"], desc: "Процессы, роадмап запуска и операционная эффективность." },
  { role: "CTO / Технологии",    ab: "CTO", color: "#c084fc", g: ["#a855f7", "#9333ea"], desc: "Стек, архитектура и реалистичные сроки MVP." },
];

const QUICK = [
  { label: "Новый анализ",     icon: Zap,        href: "/dashboard/new" },
  { label: "Анализ рынка",     icon: Search,     href: "/dashboard/new" },
  { label: "Скан конкурентов", icon: Target,     href: "/dashboard/new" },
  { label: "Финмодель",        icon: Calculator, href: "/dashboard/new" },
  { label: "GTM-план",         icon: Rocket,     href: "/dashboard/new" },
  { label: "Оценка рисков",    icon: Shield,     href: "/dashboard/new" },
];

const ACTIVITY = [
  { icon: "📊", t: "E-commerce Expansion Strategy", s: "Отчёт готов · 2ч назад" },
  { icon: "💰", t: "SaaS Pricing Optimization",     s: "Анализ завершён · 5ч назад" },
  { icon: "🎯", t: "Competitor Benchmarking",        s: "Данные обновлены · 1д назад" },
  { icon: "📣", t: "Marketing Campaign Analysis",    s: "Инсайты готовы · 2д назад" },
];

const TASKS = [
  { agent: "CEO",          color: "#818cf8", task: "Оценка рыночной возможности",    st: "done" },
  { agent: "Аналитик",     color: "#fbbf24", task: "Анализ конкурентного ландшафта", st: "done" },
  { agent: "CMO",          color: "#34d399", task: "Сегменты и позиционирование",    st: "progress" },
  { agent: "CFO",          color: "#60a5fa", task: "Финансовые прогнозы и ROI",      st: "progress" },
  { agent: "Data Analyst", color: "#22d3ee", task: "Моделирование данных",           st: "pending" },
];

const SYS = [
  { k: "AI-агенты",   v: "Онлайн",  c: "#34d399" },
  { k: "База знаний", v: "Синхр.",  c: "#34d399" },
  { k: "Пайплайн",    v: "Активен", c: "#34d399" },
  { k: "Интеграции",  v: "Скоро",   c: "#fbbf24" },
];

// ─── Small pieces ─────────────────────────────────────────────────────────────
function Sparkline({ pts, color }: { pts: number[]; color: string }) {
  const W = 110, H = 34;
  const max = Math.max(...pts), min = Math.min(...pts);
  const x = (i: number) => (i / (pts.length - 1)) * (W - 4) + 2;
  const y = (v: number) => H - 4 - ((v - min) / (max - min)) * (H - 8);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <path d={`${d} L${x(pts.length - 1)},${H} L2,${H} Z`} fill={`${color}14`} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }} />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r={3} fill={color} />
    </svg>
  );
}

function useCountUp(to: number, dur = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return v;
}

function HealthRing({ pct }: { pct: number }) {
  const r = 44, c = 2 * Math.PI * r;
  const n = useCountUp(pct, 1400);
  return (
    <div style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
      <svg width={112} height={112} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
        <motion.circle cx={56} cy={56} r={r} fill="none" stroke="#6366f1" strokeWidth={7} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }} animate={{ strokeDasharray: `${(pct / 100) * c} ${c}` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="term-value" style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{n}%</span>
        <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)", marginTop: 3, letterSpacing: "0.08em" }}>ЗДОРОВЬЕ</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] ?? "Founder";
  const [clock, setClock] = useState("--:--:--");
  const [selTeam, setSelTeam] = useState(0);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("ru-RU")), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const doneCount = TASKS.filter(t => t.st === "done").length;

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
  };

  return (
    <div style={{ padding: "22px 24px 48px", maxWidth: 1440, margin: "0 auto" }}>
      <style>{`
        @keyframes dash-orb { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.06);opacity:1} }
        @keyframes dash-dot { 0%,100%{opacity:.25} 50%{opacity:1} }
        .team-scroll::-webkit-scrollbar{height:6px}
        .team-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:3px}
      `}</style>

      {/* ── Greeting row ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>
            {greet}, {name}! <span style={{ fontSize: 22 }}>👋</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>
            Ваша AI-команда готова двигать бизнес вперёд.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="term-blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "#34d399" }}>SYSTEM OPERATIONAL</span>
          </div>
          <div className="term-mono" style={{ height: 34, padding: "0 13px", borderRadius: 10, display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
            {clock}
          </div>
        </div>
      </motion.div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 16 }}>
        {KPIS.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              style={{ ...card, padding: "18px 18px 16px", display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>{k.label}</div>
                <div className="term-value" style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: "#34d399", marginTop: 8 }}>{k.delta}</div>
              </div>
              {k.spark
                ? <div style={{ alignSelf: "flex-end" }}><Sparkline pts={k.spark} color="#818cf8" /></div>
                : <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={19} style={{ color: "#818cf8" }} />
                  </div>}
            </motion.div>
          );
        })}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]" style={{ gap: 16 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* AI TEAM */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="term-mono" style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)" }}>// AI-КОМАНДА</div>
              <Link href="/dashboard/executives" style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                <Settings2 size={12} /> Настроить команду
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 14px" }}>Элитная команда AI-специалистов работает вместе</p>

            <div ref={teamRef} className="team-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
              {TEAM.map((a, i) => {
                const active = selTeam === i;
                return (
                  <button key={a.role} onClick={() => setSelTeam(i)}
                    style={{
                      flex: "0 0 168px", textAlign: "left", cursor: "pointer",
                      borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.02)",
                      border: active ? `1.5px solid ${a.color}` : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: active ? `0 0 24px ${a.color}30` : "none",
                      transition: "border-color .2s, box-shadow .2s",
                    }}>
                    {/* avatar tile */}
                    <div style={{ position: "relative", height: 96, borderRadius: 10, marginBottom: 10, overflow: "hidden", background: `linear-gradient(160deg, ${a.g[0]}33, #0b0c14 70%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 22px ${a.g[0]}55, inset 0 1px 0 rgba(255,255,255,.3)` }}>
                        <span className="term-mono" style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{a.ab}</span>
                      </div>
                      <span className="term-mono" style={{ position: "absolute", top: 7, right: 7, fontSize: 8, letterSpacing: ".08em", padding: "2px 7px", borderRadius: 6, background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.35)", color: "#34d399" }}>ACTIVE</span>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{a.role}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.45, height: 44, overflow: "hidden" }}>{a.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="term-mono" style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)", letterSpacing: ".06em" }}>CLAUDE</span>
                      <span style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                        {[5, 8, 6, 10, 7].map((h, j) => <span key={j} style={{ width: 3, height: h, borderRadius: 1, background: a.color, opacity: .7, animation: `dash-dot 1.6s ${j * .18}s infinite` }} />)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ACTIVE TASKS */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} style={{ ...card, padding: 20 }}>
            <div className="term-mono" style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>// АКТИВНЫЕ ЗАДАЧИ</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 14px" }}>Прогресс вашей AI-команды в реальном времени</p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]" style={{ gap: 14 }}>
              {/* task list */}
              <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>E-commerce Expansion Strategy</span>
                  <span className="term-mono" style={{ fontSize: 9.5, padding: "3px 9px", borderRadius: 6, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc", letterSpacing: ".08em" }}>В РАБОТЕ</span>
                </div>
                {TASKS.map((t, i) => (
                  <motion.div key={t.task}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < TASKS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: t.st === "done" ? "#34d399" : t.st === "progress" ? t.color : "rgba(255,255,255,.2)", animation: t.st === "progress" ? "dash-dot 1.4s infinite" : "none" }} />
                    <span className="term-mono" style={{ fontSize: 10, color: t.color, width: 86, flexShrink: 0 }}>{t.agent}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1 }}>{t.task}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: t.st === "done" ? "#34d399" : t.st === "progress" ? "#a5b4fc" : "rgba(255,255,255,.3)" }}>
                      {t.st === "done" ? "Готово" : t.st === "progress" ? "В работе" : "Ожидает"}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* collaborating orb */}
              <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,.08), rgba(255,255,255,.01) 70%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "18px 14px", textAlign: "center" }}>
                <div style={{ position: "relative", width: 84, height: 84, marginBottom: 12 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, rgba(165,180,252,.9), rgba(99,102,241,.5) 45%, rgba(30,27,75,.9) 75%)", boxShadow: "0 0 40px rgba(99,102,241,.4)", animation: "dash-orb 3.2s ease-in-out infinite" }} />
                  {[...Array(8)].map((_, i) => (
                    <span key={i} style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "#c7d2fe", left: `${18 + (i * 37) % 60}%`, top: `${12 + (i * 23) % 66}%`, animation: `dash-dot ${1.2 + (i % 3) * .4}s ${i * .2}s infinite` }} />
                  ))}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 3 }}>AI-команда работает…</div>
                <div className="term-mono" style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 12 }}>{doneCount}/{TASKS.length} задач · ~18 мин</div>
                <Link href="/dashboard/projects/demo" style={{ height: 34, padding: "0 16px", borderRadius: 9, display: "flex", alignItems: "center", fontSize: 11.5, fontWeight: 700, color: "#fff", textDecoration: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }}>
                  Смотреть прогресс
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* System overview */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ ...card, padding: 18 }}>
            <div className="term-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>// СОСТОЯНИЕ СИСТЕМЫ</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <HealthRing pct={98} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                {SYS.map(s => (
                  <div key={s.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.c }} />{s.k}
                    </span>
                    <span className="term-mono" style={{ fontSize: 10, color: s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.28 }} style={{ ...card, padding: 18 }}>
            <div className="term-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>// БЫСТРЫЕ ДЕЙСТВИЯ</div>
            <div className="grid grid-cols-2" style={{ gap: 8 }}>
              {QUICK.map(q => {
                const Icon = q.icon;
                return (
                  <Link key={q.label} href={q.href}
                    style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 11px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.72)", textDecoration: "none", transition: "background .15s,border-color .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.18)"; }}>
                    <Icon size={13} style={{ color: "#818cf8", flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.36 }} style={{ ...card, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span className="term-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)" }}>// ПОСЛЕДНЯЯ АКТИВНОСТЬ</span>
              <Link href="/dashboard/reports" style={{ fontSize: 10.5, color: "#818cf8", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>Все <ChevronRight size={11} /></Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 8px", borderRadius: 9, transition: "background .15s", cursor: "default" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>{a.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.t}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.32)", marginTop: 1 }}>{a.s}</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Apex Memory banner */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.44 }}
            style={{ borderRadius: 16, padding: 18, background: "linear-gradient(135deg, rgba(99,102,241,.16), rgba(79,70,229,.06))", border: "1px solid rgba(99,102,241,.3)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -18, bottom: -18, width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,.35), transparent 70%)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>Apex Memory</span>
              <span className="term-mono" style={{ fontSize: 8.5, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.55)", letterSpacing: ".1em" }}>СКОРО</span>
            </div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)", lineHeight: 1.55, margin: 0, maxWidth: 230 }}>
              Apex запомнит ваш бизнес, цели и решения — и поможет строить на том, что важно.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
