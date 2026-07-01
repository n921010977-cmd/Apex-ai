"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Target, Shield, ChevronRight, ArrowUpRight,
  Brain, DollarSign, Users, Cpu, Globe, Lightbulb, Activity,
  BarChart2, FileText, PieChart, Rocket, Star, AlertTriangle,
  CheckCircle, Clock, ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string; name: string; description: string | null;
  overall_score: number; status: string; created_at: string;
  target_revenue: string | null; ai_results: unknown[];
}

// ─── Static demo data ─────────────────────────────────────────────────────────

const DEMO_PROJECTS: Project[] = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Мобильное приложение с AI-персонализацией тренировок", overall_score: 87, status: "active", created_at: new Date(Date.now() - 7200000).toISOString(), target_revenue: "$2.4M", ai_results: [1,2,3] },
  { id: "2",    name: "SaaS Invoice Platform",  description: "Автоматизированное выставление счетов для фрилансеров",  overall_score: 91, status: "active", created_at: new Date(Date.now() - 86400000).toISOString(), target_revenue: "$1.8M", ai_results: [1,2,3] },
];

const EXECUTIVES = [
  { role: "CEO",  name: "Sophia Rivers",  title: "Chief Strategy AI", specialty: "Стратегия & Видение",   color: "#7A5CFF", rgb: "122,92,255",  confidence: 94, tasks: 12, icon: Brain },
  { role: "CFO",  name: "Marcus Chen",    title: "Finance AI",         specialty: "Финансы & Модели",      color: "#5A8DFF", rgb: "90,141,255",  confidence: 89, tasks: 8,  icon: DollarSign },
  { role: "CMO",  name: "Elena Torres",   title: "Growth AI",          specialty: "Маркетинг & Рост",      color: "#00E7A7", rgb: "0,231,167",   confidence: 91, tasks: 15, icon: TrendingUp },
  { role: "COO",  name: "James Wright",   title: "Operations AI",      specialty: "Операции & Процессы",   color: "#FFB800", rgb: "255,184,0",   confidence: 86, tasks: 10, icon: Activity },
  { role: "CTO",  name: "Park Aiden",     title: "Technology AI",      specialty: "Технологии & Архитект.",color: "#FF5470", rgb: "255,84,112",  confidence: 92, tasks: 9,  icon: Cpu },
];

const AI_INSIGHTS = [
  { type: "opportunity", icon: TrendingUp, color: "#00E7A7", title: "Новый рыночный сегмент", desc: "Корпоративный B2B рынок показывает 340% рост спроса в вашей нише. Потенциал: $4.2M ARR.", prob: 84, impact: "Высокий", growth: "+$4.2M" },
  { type: "threat",      icon: AlertTriangle, color: "#FF5470", title: "Конкурент привлёк $15M", desc: "FitAI Labs закрыла раунд Series A. Агрессивная экспансия в вашу целевую аудиторию.", prob: 67, impact: "Средний", growth: "-12%" },
  { type: "action",      icon: Lightbulb, color: "#FFB800", title: "Повысьте цену на 23%", desc: "Анализ рынка показывает недооценку продукта. Увеличение до $49/мес не снизит конверсию.", prob: 78, impact: "Высокий", growth: "+$680K" },
  { type: "opportunity", icon: Globe, color: "#5A8DFF", title: "Выход на рынок EU", desc: "GDPR-совместимая инфраструктура готова. Германия и Нидерланды — первые целевые рынки.", prob: 71, impact: "Высокий", growth: "+$1.8M" },
];

const ACTIVITY = [
  { icon: CheckCircle, color: "#00E7A7", label: "Стратегический анализ завершён",    sub: "Fitness App · 94 балла",        time: "2м назад" },
  { icon: Globe,       color: "#5A8DFF", label: "Обнаружен новый конкурент",          sub: "FitAI Labs · $15M funding",     time: "18м назад" },
  { icon: DollarSign,  color: "#7A5CFF", label: "Финансовая модель обновлена",        sub: "Q2 прогноз пересмотрен вверх",  time: "1ч назад" },
  { icon: FileText,    color: "#FFB800", label: "Investor Report сформирован",        sub: "PDF · 48 страниц",              time: "3ч назад" },
  { icon: Brain,       color: "#FF5470", label: "Симуляция рынка завершена",          sub: "Точность 91% · 10K сценариев",  time: "5ч назад" },
];

const QUICK_ACTIONS = [
  { label: "Новая стратегия", href: "/dashboard/new",       icon: Zap,       color: "#7A5CFF", rgb: "122,92,255" },
  { label: "Финансовая модель",href: "/dashboard/new",      icon: DollarSign, color: "#5A8DFF", rgb: "90,141,255" },
  { label: "Investor Report", href: "/dashboard/reports",   icon: FileText,  color: "#00E7A7", rgb: "0,231,167"  },
  { label: "Growth Strategy", href: "/dashboard/analytics", icon: TrendingUp, color: "#FFB800", rgb: "255,184,0"  },
  { label: "Pitch Deck",      href: "/dashboard/new",       icon: Rocket,    color: "#FF5470", rgb: "255,84,112" },
  { label: "AI Чат",          href: "/dashboard/chat",      icon: Brain,     color: "#a78bfa", rgb: "167,139,250"},
];

// ─── AI Neural Visualization ──────────────────────────────────────────────────

function NeuralViz() {
  const nodes = [
    { x: 50,  y: 50,  r: 5,   color: "#7A5CFF" },
    { x: 200, y: 30,  r: 3.5, color: "#5A8DFF" },
    { x: 340, y: 70,  r: 4,   color: "#00E7A7" },
    { x: 120, y: 120, r: 3,   color: "#7A5CFF" },
    { x: 260, y: 110, r: 4.5, color: "#FFB800" },
    { x: 400, y: 140, r: 3,   color: "#5A8DFF" },
    { x: 80,  y: 180, r: 3.5, color: "#00E7A7" },
    { x: 220, y: 190, r: 3,   color: "#FF5470" },
    { x: 360, y: 200, r: 4,   color: "#7A5CFF" },
  ];
  const edges = [
    [0,1],[1,2],[0,3],[1,4],[2,4],[3,4],[4,5],[3,6],[6,7],[7,8],[4,7],[5,8],[1,3],[2,5],
  ];

  return (
    <svg viewBox="0 0 450 230" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        {nodes.map((n, i) => (
          <radialGradient key={i} id={`ng${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={n.color} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={n.color} stopOpacity="0.1"/>
          </radialGradient>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke={`url(#ng${a})`}
          strokeWidth="0.8"
          strokeOpacity="0.25"
        />
      ))}

      {/* Animated particles on edges */}
      {edges.slice(0, 7).map(([a, b], i) => (
        <circle key={`p${i}`} r="2" fill={nodes[a].color} opacity="0.8" filter="url(#glow)">
          <animateMotion
            dur={`${2.2 + i * 0.4}s`}
            repeatCount="indefinite"
            begin={`${i * 0.35}s`}
          >
            <mpath xlinkHref={`#edge${i}`}/>
          </animateMotion>
          <animate attributeName="opacity" values="0;0.9;0" dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.35}s`}/>
          <animateMotion
            dur={`${2.2 + i * 0.4}s`}
            repeatCount="indefinite"
            begin={`${i * 0.35}s`}
            path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`}
          />
        </circle>
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          {/* Outer glow ring */}
          <circle cx={n.x} cy={n.y} r={n.r * 3.5} fill={n.color} opacity="0.06">
            <animate attributeName="r" values={`${n.r*2.5};${n.r*4.5};${n.r*2.5}`} dur={`${2.5 + i*0.3}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.06;0.12;0.06" dur={`${2.5 + i*0.3}s`} repeatCount="indefinite"/>
          </circle>
          {/* Core */}
          <circle cx={n.x} cy={n.y} r={n.r} fill={`url(#ng${i})`} filter="url(#glow)">
            <animate attributeName="r" values={`${n.r};${n.r*1.3};${n.r}`} dur={`${2 + i*0.25}s`} repeatCount="indefinite"/>
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = Date.now();
    const dur   = 1400;
    const tick  = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ color, data }: { color: string; data: number[] }) {
  const W = 64, H = 20, n = data.length;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => ({ x: (i / (n-1)) * W, y: H - ((v - min) / (max - min + 0.001)) * H }));
  const d = pts.map((p, i) => i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}60)` }}/>
      <circle cx={pts[n-1].x} cy={pts[n-1].y} r="2" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}/>
    </svg>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

const PROJECT_COVERS = ["from-violet-900/60 to-blue-900/40", "from-cyan-900/60 to-emerald-900/40"];
const PROJECT_SCORES_DATA = [
  [55, 60, 68, 72, 79, 83, 87],
  [62, 70, 74, 82, 86, 89, 91],
];

function ProjectCard({ p, i }: { p: Project; i: number }) {
  const [hovered, setHovered] = useState(false);
  const scoreColor = p.overall_score >= 85 ? "#00E7A7" : p.overall_score >= 75 ? "#FFB800" : "#FF5470";

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ y: hovered ? -6 : 0, scale: hovered ? 1.01 : 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius:   20,
        overflow:       "hidden",
        background:     "#141821",
        border:         `1px solid ${hovered ? "rgba(122,92,255,0.25)" : "rgba(255,255,255,0.06)"}`,
        boxShadow:      hovered
          ? "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(122,92,255,0.1)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        transition:     "border-color 0.3s, box-shadow 0.3s",
        cursor:         "pointer",
      }}
    >
      {/* Cover */}
      <div className={`h-24 bg-gradient-to-br ${PROJECT_COVERS[i % PROJECT_COVERS.length]} relative overflow-hidden`}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(122,92,255,0.15) 0%, transparent 60%)" }} />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Rocket size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 6 }}>
            {p.status === "active" ? "● Активен" : "⏸ Пауза"}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <MiniSparkline color={scoreColor} data={PROJECT_SCORES_DATA[i % 2]} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{p.name}</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{p.description}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1, fontVariantNumeric: "tabular-nums", filter: `drop-shadow(0 0 10px ${scoreColor}60)` }}>
              {p.overall_score}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>AI Score</div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
          {[
            { label: "ARR",    value: p.target_revenue ?? "—", color: "#00E7A7" },
            { label: "Health", value: `${p.overall_score}%`,   color: "#5A8DFF" },
            { label: "Stage",  value: "Growth",                 color: "#FFB800" },
          ].map(m => (
            <div key={m.label} className="text-center p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${p.overall_score}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${scoreColor}60, ${scoreColor})`, boxShadow: `0 0 8px ${scoreColor}60` }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${p.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 font-semibold text-white transition-all hover:-translate-y-px"
            style={{ height: 30, borderRadius: 9, fontSize: 11, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", boxShadow: "0 4px 12px rgba(122,92,255,0.35)" }}
          >
            <Zap size={11} />
            Continue Strategy
          </Link>
          <Link
            href={`/dashboard/reports`}
            className="flex items-center justify-center gap-1.5 transition-all hover:bg-white/[0.08]"
            style={{ height: 30, padding: "0 12px", borderRadius: 9, fontSize: 11, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <FileText size={11} />
            Report
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Executive card ───────────────────────────────────────────────────────────

const EXEC_SPARKLINES: Record<string, number[]> = {
  CEO: [70, 74, 79, 82, 88, 91, 94],
  CFO: [65, 68, 73, 78, 83, 87, 89],
  CMO: [60, 67, 75, 80, 85, 88, 91],
  COO: [72, 75, 78, 80, 83, 85, 86],
  CTO: [68, 74, 80, 84, 87, 90, 92],
};

function ExecCard({ exec }: { exec: typeof EXECUTIVES[number] }) {
  const [hovered, setHovered] = useState(false);
  const Icon = exec.icon;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ y: hovered ? -8 : 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius:   18,
        padding:        "18px 16px",
        background:     `linear-gradient(145deg, rgba(${exec.rgb},0.1) 0%, #141821 100%)`,
        border:         `1px solid ${hovered ? `rgba(${exec.rgb},0.35)` : `rgba(${exec.rgb},0.18)`}`,
        boxShadow:      hovered ? `0 16px 48px rgba(${exec.rgb},0.15), 0 0 0 1px rgba(${exec.rgb},0.1)` : "0 4px 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        transition:     "border-color 0.3s, box-shadow 0.3s",
        cursor:         "pointer",
        position:       "relative",
        overflow:       "hidden",
      }}
    >
      {/* Top bevel */}
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, rgba(${exec.rgb},0.55), transparent)` }} />

      {/* Role badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, rgba(${exec.rgb},0.25), rgba(${exec.rgb},0.08))`,
            border: `1px solid rgba(${exec.rgb},0.3)`,
            boxShadow: `0 0 16px rgba(${exec.rgb},0.2)`,
            color: exec.color,
          }}>
            <Icon size={15} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: exec.color }}>{exec.role}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{exec.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E7A7", boxShadow: "0 0 6px rgba(0,231,167,0.8)", display: "block", animation: "xc-pulse 2s ease-in-out infinite" }} />
        </div>
      </div>

      {/* Name */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{exec.name}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginBottom: 12 }}>{exec.specialty}</div>

      {/* Confidence + sparkline */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: exec.color, lineHeight: 1, filter: `drop-shadow(0 0 8px rgba(${exec.rgb},0.5))` }}>
            {exec.confidence}%
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Уверенность AI</div>
        </div>
        <MiniSparkline color={exec.color} data={EXEC_SPARKLINES[exec.role]} />
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${exec.confidence}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, rgba(${exec.rgb},0.5), ${exec.color})` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{exec.tasks} задач активно</span>
        <div className="flex items-center gap-1" style={{ fontSize: 10, color: exec.color, cursor: "pointer" }}>
          Открыть <ArrowUpRight size={10} />
        </div>
      </div>

      <style>{`@keyframes xc-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </motion.div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"projects" | "insights">("projects");

  useEffect(() => {
    const stored = localStorage.getItem("apex-user-projects");
    const local: Project[] = stored ? JSON.parse(stored) : [];
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => {
        if (d.projects?.length) setProjects(d.projects);
        else if (local.length)  setProjects(local);
        else                    setProjects(DEMO_PROJECTS);
      })
      .catch(() => setProjects(local.length ? local : DEMO_PROJECTS))
      .finally(() => setLoading(false));
  }, []);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="min-h-full" style={{ background: "#040404", padding: "0 0 60px" }}>

      {/* ═══════════ HERO COMMAND CENTER ═══════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #080C18 0%, #040404 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Background mesh */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 60% 80% at 70% 50%, rgba(122,92,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 20% 30%, rgba(90,141,255,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 36px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "center" }}>

          {/* Left: headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* System status badge */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,231,167,0.08)", border: "1px solid rgba(0,231,167,0.18)" }}>
                <span className="size-1.5 rounded-full" style={{ background: "#00E7A7", boxShadow: "0 0 8px rgba(0,231,167,0.9)", animation: "hero-pulse 1.8s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#00E7A7", letterSpacing: "0.1em" }}>AI СИСТЕМА АКТИВНА</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(122,92,255,0.06)", border: "1px solid rgba(122,92,255,0.15)" }}>
                <Star size={10} style={{ color: "#7A5CFF" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(122,92,255,0.9)" }}>Confidence 91%</span>
              </div>
            </div>

            <h1 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 10 }}>
              {greeting},<br/>
              <span style={{ background: "linear-gradient(135deg, #7A5CFF 0%, #5A8DFF 50%, #00E7A7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Apex Executive Board
              </span>
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, marginBottom: 28, maxWidth: 480 }}>
              Ваша AI-команда директоров анализирует рынок, стратегию и финансы в реальном времени.
            </p>

            {/* KPI row */}
            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { icon: Target,    label: "Возможностей", value: 4,   suffix: "", color: "#00E7A7", rgb: "0,231,167" },
                { icon: BarChart2, label: "AI Analyses",  value: 12,  suffix: "+", color: "#5A8DFF", rgb: "90,141,255" },
                { icon: Shield,    label: "Рисков",       value: 2,   suffix: "",  color: "#FF5470", rgb: "255,84,112" },
                { icon: TrendingUp,label: "Рост MoM",     value: 34,  suffix: "%", color: "#FFB800", rgb: "255,184,0" },
              ].map(k => (
                <div key={k.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
                  style={{ background: `rgba(${k.rgb},0.06)`, border: `1px solid rgba(${k.rgb},0.15)` }}>
                  <k.icon size={14} style={{ color: k.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                      <Counter to={k.value} suffix={k.suffix} />
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1, whiteSpace: "nowrap" }}>{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/new"
                className="flex items-center gap-2 font-semibold text-white transition-all hover:-translate-y-px hover:brightness-110"
                style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 13, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", boxShadow: "0 8px 28px rgba(122,92,255,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                <Zap size={14} />
                Start New Strategy
              </Link>
              <Link href="/dashboard/chat"
                className="flex items-center gap-2 font-medium transition-all hover:bg-white/[0.08]"
                style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 13, color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Brain size={14} />
                Ask Executive Board
              </Link>
            </div>
          </motion.div>

          {/* Right: neural viz */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ height: 240, position: "relative" }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "rgba(122,92,255,0.03)", border: "1px solid rgba(122,92,255,0.1)" }} />
            <NeuralViz />
            {/* Float labels */}
            {[
              { label: "Market Analysis", x: "8%",  y: "12%", color: "#7A5CFF" },
              { label: "Finance Model",   x: "58%", y: "5%",  color: "#5A8DFF" },
              { label: "Growth Engine",   x: "72%", y: "58%", color: "#00E7A7" },
            ].map(fl => (
              <div key={fl.label} style={{ position: "absolute", left: fl.x, top: fl.y, fontSize: 9, fontWeight: 600, color: fl.color, background: `rgba(0,0,0,0.6)`, backdropFilter: "blur(8px)", padding: "3px 7px", borderRadius: 5, border: `1px solid ${fl.color}25`, whiteSpace: "nowrap" }}>
                {fl.label}
              </div>
            ))}
          </motion.div>
        </div>

        <style>{`
          @keyframes hero-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }
        `}</style>
      </div>

      {/* ═══════════ EXECUTIVE BOARD ═══════════ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px 0" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Executive AI Board</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>5 AI-директоров · Все активны</p>
          </div>
          <Link href="/dashboard/executives" className="flex items-center gap-1" style={{ fontSize: 12, color: "rgba(122,92,255,0.8)" }}>
            Открыть совет <ChevronRight size={13} />
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {EXECUTIVES.map((exec, i) => (
            <motion.div
              key={exec.role}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } } }}
            >
              <ExecCard exec={exec} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div style={{ maxWidth: 1280, margin: "36px auto 0", padding: "0 32px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

        {/* Left column */}
        <div className="space-y-6">

          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "inline-flex" }}>
            {([["projects", "Мои проекты"], ["insights", "AI Intelligence"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={tab === id
                  ? { background: "rgba(122,92,255,0.2)", color: "#c4b5fd", border: "1px solid rgba(122,92,255,0.25)" }
                  : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "projects" ? (
              <motion.div key="proj" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                {/* Project grid */}
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0,1].map(i => <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((p, i) => <ProjectCard key={p.id} p={p} i={i} />)}
                  </div>
                )}

                {/* New project slot */}
                <Link href="/dashboard/new"
                  className="mt-4 flex items-center gap-3 p-4 rounded-2xl group transition-all"
                  style={{ border: "1px dashed rgba(255,255,255,0.07)", background: "transparent" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor="rgba(122,92,255,0.3)"; el.style.background="rgba(122,92,255,0.04)"; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor="rgba(255,255,255,0.07)"; el.style.background="transparent"; }}
                >
                  <div className="size-10 rounded-xl flex items-center justify-center" style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <Zap size={16} className="text-white/20 group-hover:text-violet-400/60 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/30 group-hover:text-white/55 transition-colors">Новая стратегия</div>
                    <div className="text-xs text-white/15">Опишите идею — AI-команда проведёт полный анализ</div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                className="space-y-3">
                {AI_INSIGHTS.map((ins, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    style={{ borderRadius: 16, padding: "16px 18px", background: "#141821", border: `1px solid rgba(${ins.color === "#00E7A7" ? "0,231,167" : ins.color === "#FF5470" ? "255,84,112" : ins.color === "#FFB800" ? "255,184,0" : "90,141,255"},0.15)`, cursor: "pointer" }}
                    className="group hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ins.color}12`, border: `1px solid ${ins.color}22`, color: ins.color }}>
                        <ins.icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{ins.title}</div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{ins.desc}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div style={{ fontSize: 14, fontWeight: 800, color: ins.color }}>{ins.growth}</div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Эффект</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                            <span style={{ color: ins.color, fontWeight: 700 }}>{ins.prob}%</span> вероятность
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>·</div>
                          <div style={{ fontSize: 10, color: ins.impact === "Высокий" ? "#00E7A7" : "#FFB800", fontWeight: 600 }}>{ins.impact} импакт</div>
                          <ExternalLink size={10} className="ml-auto text-white/20 group-hover:text-violet-400/50 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div style={{ borderRadius: 18, padding: "18px", background: "#0E1015", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
              Quick Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((qa, i) => (
                <Link
                  key={i}
                  href={qa.href}
                  className="flex flex-col gap-2 p-3 rounded-xl group transition-all hover:-translate-y-0.5"
                  style={{ background: `rgba(${qa.rgb},0.06)`, border: `1px solid rgba(${qa.rgb},0.12)` }}
                >
                  <qa.icon size={15} style={{ color: qa.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>{qa.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity timeline */}
          <div style={{ borderRadius: 18, padding: "18px", background: "#0E1015", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Activity Log
              </div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 9, fontWeight: 600, color: "#00E7A7" }}>
                <span className="size-1.5 rounded-full" style={{ background: "#00E7A7", animation: "hero-pulse 2s ease-in-out infinite" }} />
                Live
              </div>
            </div>

            <div className="space-y-0">
              {ACTIVITY.map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex items-start gap-3 py-2.5 group cursor-pointer"
                  style={{ borderBottom: i < ACTIVITY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${ev.color}12`, border: `1px solid ${ev.color}20`, color: ev.color }}>
                    <ev.icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: "rgba(255,255,255,0.72)", lineHeight: 1.3 }}>{ev.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{ev.sub}</div>
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 1 }}>{ev.time}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Today's top recommendation */}
          <div style={{ borderRadius: 18, padding: "18px", background: "linear-gradient(145deg, rgba(122,92,255,0.12), rgba(90,141,255,0.06))", border: "1px solid rgba(122,92,255,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={13} style={{ color: "#7A5CFF" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(122,92,255,0.9)" }}>
                Рекомендация дня
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.5, marginBottom: 8 }}>
              Повысьте цену на 23% — рынок недооценивает продукт
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.55, marginBottom: 14 }}>
              Анализ 340 конкурентов показывает медиану $49/мес для вашего сегмента. Текущая цена оставляет $680K в год на столе.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-center">
                <div style={{ fontSize: 16, fontWeight: 800, color: "#00E7A7" }}>78%</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Вероятность</div>
              </div>
              <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />
              <div className="text-center">
                <div style={{ fontSize: 16, fontWeight: 800, color: "#FFB800" }}>+$680K</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Потенциал/год</div>
              </div>
              <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />
              <div className="text-center">
                <div style={{ fontSize: 16, fontWeight: 800, color: "#5A8DFF" }}>High</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Импакт</div>
              </div>
            </div>
            <Link href="/dashboard/new" className="flex items-center justify-center gap-2 font-semibold text-white transition-all hover:-translate-y-px"
              style={{ height: 34, borderRadius: 10, fontSize: 12, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", boxShadow: "0 4px 14px rgba(122,92,255,0.4)" }}>
              <Zap size={12} /> Применить стратегию
            </Link>
          </div>

          {/* Market pulse */}
          <div style={{ borderRadius: 18, padding: "18px", background: "#0E1015", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
              Market Pulse
            </div>
            {[
              { label: "B2B SaaS",       trend: "+18%", color: "#00E7A7" },
              { label: "AI Fitness",     trend: "+340%", color: "#7A5CFF" },
              { label: "FinTech Tools",  trend: "+22%",  color: "#5A8DFF" },
              { label: "No-code Tools",  trend: "-4%",   color: "#FF5470" },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div className="flex items-center gap-2">
                  <Globe size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{m.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.trend}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
