"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Target, Shield, ArrowUpRight,
  Brain, DollarSign, Cpu, Globe, Lightbulb, Activity,
  BarChart2, FileText, Rocket, AlertTriangle,
  CheckCircle, MessageSquare, ChevronRight, Plus,
} from "lucide-react";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const ACCENT     = "#6366f1";
const ACCENT_RGB = "99,102,241";
const SUCCESS    = "#10b981";
const WARNING    = "#f59e0b";
const DANGER     = "#ef4444";

interface Project {
  id: string; name: string; description: string | null;
  overall_score: number; status: string; created_at: string;
  target_revenue: string | null; ai_results: unknown[];
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_PROJECTS: Project[] = [
  { id: "demo", name: "AI-Powered Fitness App",  description: "Мобильное приложение с AI-персонализацией тренировок", overall_score: 87, status: "active", created_at: new Date(Date.now() - 7200000).toISOString(),   target_revenue: "$2.4M", ai_results: [1,2,3] },
  { id: "2",    name: "SaaS Invoice Platform",   description: "Автоматизированное выставление счетов для фрилансеров",  overall_score: 91, status: "active", created_at: new Date(Date.now() - 86400000).toISOString(), target_revenue: "$1.8M", ai_results: [1,2,3] },
];

const EXECUTIVES = [
  { role: "CEO", name: "Sophia Rivers", specialty: "Стратегия",    color: "#6366f1", rgb: "99,102,241",  confidence: 94, tasks: 12, icon: Brain,      slug: "ceo" },
  { role: "CFO", name: "Marcus Chen",   specialty: "Финансы",       color: "#3b82f6", rgb: "59,130,246",  confidence: 89, tasks: 8,  icon: DollarSign, slug: "cfo" },
  { role: "CMO", name: "Elena Torres",  specialty: "Маркетинг",     color: "#10b981", rgb: "16,185,129",  confidence: 91, tasks: 15, icon: TrendingUp, slug: "cmo" },
  { role: "COO", name: "James Wright",  specialty: "Операции",      color: "#f59e0b", rgb: "245,158,11",  confidence: 86, tasks: 10, icon: Activity,   slug: "coo" },
  { role: "CTO", name: "Park Aiden",    specialty: "Технологии",    color: "#8b5cf6", rgb: "139,92,246",  confidence: 92, tasks: 9,  icon: Cpu,        slug: "cto" },
];

const INSIGHTS = [
  { icon: TrendingUp,    color: SUCCESS, title: "Новый рыночный сегмент", desc: "B2B рынок показывает 340% рост. Потенциал: $4.2M ARR.", time: "5м назад",  delta: "+$4.2M" },
  { icon: AlertTriangle, color: DANGER,  title: "Конкурент привлёк $15M", desc: "FitAI Labs закрыла Series A. Агрессивная экспансия.", time: "20м назад", delta: "Угроза" },
  { icon: Lightbulb,     color: WARNING, title: "Повысьте цену на 23%",   desc: "Рынок недооценивает продукт. Потенциал +$680K/год.",   time: "1ч назад",  delta: "+$680K" },
  { icon: Globe,         color: SUCCESS, title: "Выход на рынок EU",       desc: "GDPR-инфраструктура готова. Германия — первый рынок.", time: "3ч назад",  delta: "+$1.8M" },
  { icon: CheckCircle,   color: ACCENT,  title: "Анализ Fitness App завершён", desc: "Итоговый AI Score: 87/100. Готов к инвестиционному раунду.", time: "5ч назад", delta: "87/100" },
];

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const f = useRef(false);
  useEffect(() => {
    if (f.current) return; f.current = true;
    const s = Date.now(), d = 1300;
    const t = () => { const p = Math.min(1, (Date.now()-s)/d); setV(Math.round((1-Math.pow(1-p,3))*to)); if(p<1) requestAnimationFrame(t); };
    requestAnimationFrame(t);
  }, [to]);
  return <>{v}{suffix}</>;
}

// ─── Mini sparkline ──────────────────────────────────────────────────────────
function Spark({ color, data }: { color: string; data: number[] }) {
  const W = 56, H = 18, n = data.length;
  const mn = Math.min(...data), mx = Math.max(...data);
  const pts = data.map((v,i) => ({ x:(i/(n-1))*W, y:H-((v-mn)/(mx-mn+0.001))*H }));
  const d = pts.map((p,i)=>i===0?`M${p.x.toFixed(1)},${p.y.toFixed(1)}`:`L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={color} fillOpacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={pts[n-1].x} cy={pts[n-1].y} r="2.5" fill={color} />
    </svg>
  );
}

const PROJ_DATA = [[55,60,68,72,79,83,87],[62,70,74,82,86,89,91]];
const EXEC_DATA: Record<string, number[]> = {
  CEO:[70,74,79,82,88,91,94], CFO:[65,68,73,78,83,87,89],
  CMO:[60,67,75,80,85,88,91], COO:[72,75,78,80,83,85,86], CTO:[68,74,80,84,87,90,92],
};

// ─── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ p, i }: { p: Project; i: number }) {
  const [hov, setHov] = useState(false);
  const sc = p.overall_score >= 85 ? SUCCESS : p.overall_score >= 75 ? WARNING : DANGER;

  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      whileHover={{ y: -4 }} transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? "0 16px 48px rgba(0,0,0,0.45)" : "0 4px 20px rgba(0,0,0,0.25)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Score strip */}
      <div style={{ height: 4, background: sc }} />

      <div style={{ padding: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: SUCCESS, background: "rgba(16,185,129,0.1)", padding: "2px 7px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.2)" }}>
                Активен
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{p.description}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: sc, lineHeight: 1, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{p.overall_score}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>AI Score</div>
          </div>
        </div>

        {/* Chart + ARR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Spark color={sc} data={PROJ_DATA[i % 2]} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: SUCCESS, letterSpacing: "-0.02em" }}>{p.target_revenue ?? "—"}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>Target ARR</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${p.overall_score}%` }} transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
            style={{ height: "100%", background: sc, borderRadius: 2 }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/projects/${p.id}`} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 36, borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff",
            background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)", textDecoration: "none",
          }}>
            <ArrowUpRight size={13} />Открыть проект
          </Link>
          <Link href="/dashboard/reports" style={{
            display: "flex", alignItems: "center", gap: 5, padding: "0 12px",
            height: 36, borderRadius: 10, fontSize: 11, fontWeight: 500,
            color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none",
          }}>
            <FileText size={11} />Отчёт
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Exec card ────────────────────────────────────────────────────────────────
function ExecCard({ exec, i }: { exec: typeof EXECUTIVES[number]; i: number }) {
  const Icon = exec.icon;
  return (
    <Link href={`/dashboard/chat?agent=${exec.slug}`} style={{ textDecoration: "none" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22,1,0.36,1], delay: i*0.06 }}
        whileHover={{ y: -5 }}
        style={{
          borderRadius: 14, padding: "14px",
          background: `rgba(${exec.rgb},0.06)`,
          border: `1px solid rgba(${exec.rgb},0.18)`,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${exec.rgb},0.18)`, border: `1px solid rgba(${exec.rgb},0.25)` }}>
              <Icon size={13} style={{ color: exec.color }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: exec.color }}>{exec.role}</span>
          </div>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: SUCCESS, display: "block", animation: "dp-pulse 2s ease-in-out infinite" }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 1 }}>{exec.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginBottom: 10 }}>{exec.specialty}</div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: exec.color, lineHeight: 1 }}>{exec.confidence}%</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>Уверенность</div>
          </div>
          <Spark color={exec.color} data={EXEC_DATA[exec.role]} />
        </div>

        <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${exec.confidence}%` }} transition={{ duration: 0.9, ease: "easeOut", delay: i*0.06 + 0.2 }}
            style={{ height: "100%", background: exec.color, borderRadius: 2 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{exec.tasks} задач</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: exec.color, display: "flex", alignItems: "center", gap: 3 }}>
            Спросить <MessageSquare size={9} />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ gridColumn: "1 / -1", padding: "48px 32px", textAlign: "center", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${ACCENT_RGB},0.1)`, border: `1px solid rgba(${ACCENT_RGB},0.2)` }}>
        <Rocket size={20} color={ACCENT} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Создайте первый проект</div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 340, margin: "0 auto 20px" }}>
        Опишите бизнес-идею — AI-команда из 20 директоров проведёт полный анализ за минуты.
      </p>
      <Link href="/dashboard/new" style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 22px",
        borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff",
        background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)", textDecoration: "none",
      }}>
        <Zap size={15} />Начать анализ
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDemo,   setIsDemo]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [insightTab, setInsightTab] = useState<"feed" | "market">("feed");

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => {
        if (d.projects?.length) { setProjects(d.projects); setIsDemo(false); }
        else                    { setProjects(DEMO_PROJECTS); setIsDemo(true); }
      })
      .catch(() => { setProjects(DEMO_PROJECTS); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";
  const firstName = session?.user?.name?.split(" ")[0] ?? "Founder";

  return (
    <div style={{ minHeight: "100%", background: "#05060A" }}>

      <style>{`
        @keyframes dp-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .dp-grid { display:grid; grid-template-columns:1fr 300px; gap:20px; }
        .dp-exec-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
        @media(max-width:1100px) {
          .dp-grid { grid-template-columns:1fr; }
          .dp-exec-grid { grid-template-columns:repeat(3,1fr); }
        }
        @media(max-width:640px) {
          .dp-exec-grid { grid-template-columns:1fr 1fr; }
          .dp-wrap { padding-left:16px!important; padding-right:16px!important; }
        }
      `}</style>

      {/* ════ COMMAND BAR ════ */}
      <div style={{ background: "#080A14", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="dp-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 24px" }}>

          {/* Greeting row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, animation: "dp-pulse 1.8s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: SUCCESS, letterSpacing: "0.1em" }}>AI СИСТЕМА АКТИВНА · 20 АГЕНТОВ</span>
              </div>
              <h1 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4 }}>
                {greeting}, {firstName}
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 0 }}>
                Apex Executive Board · Ваши AI-директора готовы к работе
              </p>
            </div>

            {/* Primary CTA */}
            <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
              <Link href="/dashboard/new" style={{
                display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px",
                borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff",
                background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 6px 20px rgba(${ACCENT_RGB},0.28)`,
                textDecoration: "none",
              }}>
                <Plus size={15} strokeWidth={2.5} />Новый анализ
              </Link>
              <Link href="/dashboard/chat" style={{
                display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px",
                borderRadius: 12, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.62)",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
              }}>
                <Brain size={14} />Спросить AI
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            {[
              { icon: Target,     label: "Возможностей",  value: 4,  suffix: "",  color: SUCCESS },
              { icon: BarChart2,  label: "AI-анализов",   value: 12, suffix: "+", color: ACCENT  },
              { icon: Shield,     label: "Активных рисков", value: 2, suffix: "",  color: DANGER  },
              { icon: TrendingUp, label: "Рост MoM",      value: 34, suffix: "%", color: WARNING },
            ].map(k => (
              <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <k.icon size={14} style={{ color: k.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: k.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    <Counter to={k.value} suffix={k.suffix} />
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 2, whiteSpace: "nowrap" }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ PROJECTS + SIDEBAR ════ */}
      <div className="dp-wrap dp-grid" style={{ maxWidth: 1280, margin: "24px auto 0", padding: "0 32px" }}>

        {/* LEFT: Projects */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Мои проекты</h2>
              {isDemo && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2, display: "block" }}>Демо-данные — создайте проект для реальных результатов</span>}
            </div>
            <Link href="/dashboard/projects" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: `rgba(${ACCENT_RGB},0.8)`, textDecoration: "none" }}>
              Все проекты <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[0,1].map(i => <div key={i} style={{ height: 260, borderRadius: 16, background: "rgba(255,255,255,0.025)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {projects.length === 0 ? <EmptyState /> : projects.slice(0,4).map((p,i) => <ProjectCard key={p.id} p={p} i={i} />)}

              {/* New project tile */}
              <Link href="/dashboard/new" style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
                minHeight: 160, borderRadius: 16, textDecoration: "none",
                border: "1px dashed rgba(255,255,255,0.08)", background: "transparent",
                transition: "border-color 0.2s, background 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(${ACCENT_RGB},0.22)`; (e.currentTarget as HTMLElement).style.background = `rgba(${ACCENT_RGB},0.04)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <Plus size={18} style={{ color: "rgba(255,255,255,0.2)" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>Новый проект</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 3 }}>AI-анализ за 2 минуты</div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Intelligence sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* AI Insights feed */}
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            {/* Tab header */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {([["feed","AI Инсайты"],["market","Рынок"]] as const).map(([id,label]) => (
                <button key={id} onClick={() => setInsightTab(id)} style={{
                  flex: 1, padding: "11px 0", fontSize: 11, fontWeight: insightTab===id ? 700 : 500,
                  color: insightTab===id ? "#fff" : "rgba(255,255,255,0.35)",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${insightTab===id ? ACCENT : "transparent"}`,
                  transition: "color 0.15s",
                }}>
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {insightTab === "feed" ? (
                <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {INSIGHTS.map((ins, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px",
                      borderBottom: i < INSIGHTS.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      cursor: "pointer",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: ins.color, flexShrink: 0 }} />
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${ins.color}12`, border: `1px solid ${ins.color}22`, flexShrink: 0 }}>
                        <ins.icon size={12} style={{ color: ins.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.82)", lineHeight: 1.3 }}>{ins.title}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: ins.color, flexShrink: 0 }}>{ins.delta}</div>
                        </div>
                        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{ins.desc}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{ins.time}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {[
                    { label: "B2B SaaS",      trend: "+18%",  pos: true,  note: "Высокий спрос" },
                    { label: "AI Fitness",    trend: "+340%", pos: true,  note: "Взрывной рост" },
                    { label: "FinTech Tools", trend: "+22%",  pos: true,  note: "Стабильно" },
                    { label: "No-code Tools", trend: "–4%",   pos: false, note: "Спад" },
                    { label: "EdTech",        trend: "+11%",  pos: true,  note: "Умеренно" },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{m.label}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>{m.note}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: m.pos ? SUCCESS : DANGER }}>{m.trend}</div>
                        <div style={{ height: 2, width: 40, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: m.pos ? SUCCESS : DANGER, width: m.pos ? "75%" : "20%", borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Top recommendation */}
          <div style={{ borderRadius: 14, padding: "16px", background: `rgba(${ACCENT_RGB},0.07)`, border: `1px solid rgba(${ACCENT_RGB},0.18)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Lightbulb size={12} style={{ color: ACCENT }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.9)` }}>Рекомендация дня</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>
              Повысьте цену на 23% — рынок недооценивает продукт
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: WARNING }}>+$680K</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Потенциал/год</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: SUCCESS }}>78%</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Вероятность</div>
              </div>
            </div>
            <Link href="/dashboard/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              height: 34, borderRadius: 9, fontSize: 11, fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)", textDecoration: "none",
            }}>
              <Zap size={11} />Применить стратегию
            </Link>
          </div>
        </div>
      </div>

      {/* ════ EXECUTIVE BOARD ════ */}
      <div className="dp-wrap" style={{ maxWidth: 1280, margin: "28px auto 40px", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Executive AI Board</h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>Нажмите на директора, чтобы задать вопрос</p>
          </div>
          <Link href="/dashboard/executives" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: `rgba(${ACCENT_RGB},0.8)`, textDecoration: "none" }}>
            Открыть совет <ChevronRight size={13} />
          </Link>
        </div>
        <div className="dp-exec-grid">
          {EXECUTIVES.map((exec, i) => <ExecCard key={exec.role} exec={exec} i={i} />)}
        </div>
      </div>

    </div>
  );
}
