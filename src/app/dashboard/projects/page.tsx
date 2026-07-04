"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, DollarSign, TrendingUp, Activity, BarChart2, Shield,
  Zap, FileText, MessageSquare, ExternalLink, Download, ArrowUpRight,
  Star, AlertTriangle, CheckCircle, Clock, Users, Globe, Target,
  ChevronRight, Search, SlidersHorizontal, LayoutGrid, List,
  Sparkles, Cpu, PieChart, Layers,
} from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: string;
  score: number;
  growthScore: number;
  riskScore: number;
  status: string;
  executives: number;
  date: string;
  revenue: string;
  revenueRaw: number;
  market: string;
  tam: string;
  growth: string;
  burnRate: string;
  confidence: number;
  color: string;
  rgb: string;
  sparkline: number[];
  opportunities: number;
  insights: string[];
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "demo",
    name: "AI-Powered Fitness Platform",
    description: "Мобильное приложение с персонализированными планами тренировок и питания на основе AI-алгоритмов",
    industry: "Mobile App · SaaS",
    stage: "Growth",
    score: 87,
    growthScore: 92,
    riskScore: 24,
    status: "complete",
    executives: 20,
    date: "2 часа назад",
    revenue: "$2.4M",
    revenueRaw: 2400000,
    market: "$4.2B",
    tam: "$18B",
    growth: "+24%/год",
    burnRate: "$45K/мес",
    confidence: 94,
    color: "#7A5CFF",
    rgb: "122,92,255",
    sparkline: [42, 58, 51, 67, 73, 69, 82, 87],
    opportunities: 4,
    insights: ["Высокий потенциал масштабирования", "Рекомендован выход на EU"],
  },
  {
    id: "2",
    name: "SaaS Invoice Platform",
    description: "Автоматизированное выставление счетов и управление платежами для фрилансеров и агентств",
    industry: "SaaS · FinTech",
    stage: "Scale",
    score: 91,
    growthScore: 88,
    riskScore: 18,
    status: "complete",
    executives: 20,
    date: "Вчера",
    revenue: "$1.8M",
    revenueRaw: 1800000,
    market: "$2.1B",
    tam: "$9B",
    growth: "+18%/год",
    burnRate: "$28K/мес",
    confidence: 97,
    color: "#00E7A7",
    rgb: "0,231,167",
    sparkline: [55, 62, 58, 71, 79, 85, 89, 91],
    opportunities: 3,
    insights: ["Готов к Series A", "Высокая unit-экономика"],
  },
  {
    id: "3",
    name: "Local Restaurant Chain",
    description: "Стратегия расширения для регионального ресторанного бренда в сегменте fast-casual",
    industry: "Restaurant · Food",
    stage: "Validation",
    score: 72,
    growthScore: 65,
    riskScore: 41,
    status: "in_progress",
    executives: 20,
    date: "В процессе",
    revenue: "Считается…",
    revenueRaw: 0,
    market: "$890M",
    tam: "$3.2B",
    growth: "+9%/год",
    burnRate: "—",
    confidence: 71,
    color: "#FFB800",
    rgb: "255,184,0",
    sparkline: [60, 55, 63, 58, 68, 65, 70, 72],
    opportunities: 2,
    insights: ["Требует доработки стратегии", "Обнаружены 2 риска"],
  },
];

const FEED_EVENTS = [
  { agent: "Sophia Rivers", role: "CEO", icon: Brain, color: "#7A5CFF", rgb: "122,92,255", action: "обновила стратегию масштабирования", project: "AI Fitness Platform", time: "3м" },
  { agent: "Marcus Chen",   role: "CFO", icon: DollarSign, color: "#5A8DFF", rgb: "90,141,255", action: "пересчитал финансовую модель",  project: "SaaS Invoice Platform", time: "11м" },
  { agent: "Elena Torres",  role: "CMO", icon: TrendingUp, color: "#00E7A7", rgb: "0,231,167", action: "обнаружила новый рыночный сегмент", project: "AI Fitness Platform", time: "28м" },
  { agent: "James Wright",  role: "COO", icon: Activity, color: "#FFB800", rgb: "255,184,0", action: "выявил операционный риск", project: "Restaurant Chain", time: "1ч" },
  { agent: "Sara Patel",    role: "PM",  icon: Layers, color: "#e879f9", rgb: "232,121,249", action: "составила product roadmap", project: "SaaS Invoice Platform", time: "2ч" },
];

const PORTFOLIO_INSIGHTS = [
  { type: "scale",   icon: Rocket, color: "#00E7A7", rgb: "0,231,167",  title: "Готов к масштабированию", desc: "SaaS Invoice Platform показывает unit-экономику +340%. Рекомендуется Series A.",   impact: "Высокий", prob: 92, gain: "+$3.2M" },
  { type: "risk",    icon: AlertTriangle, color: "#FF5470", rgb: "255,84,112", title: "Риск для Restaurant Chain", desc: "Высокий операционный риск в цепочке поставок. Требует корректировки стратегии.", impact: "Средний", prob: 67, gain: "−12%" },
  { type: "opport",  icon: Globe, color: "#5A8DFF", rgb: "90,141,255",  title: "Выход на EU рынок",         desc: "AI Fitness Platform готова к европейской экспансии. Германия — первый таргет.",   impact: "Высокий", prob: 78, gain: "+$1.8M" },
  { type: "update",  icon: Zap, color: "#FFB800", rgb: "255,184,0",    title: "Обновить стратегию",         desc: "Restaurant Chain: последний AI-анализ был 7 дней назад. Рекомендован реанализ.",   impact: "Низкий",  prob: 55, gain: "+8%" },
];

// ─── SVG Sparkline ────────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 36, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) {
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const span = max - min || 1;
  const pts  = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * height;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${height} ${polyline} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#","")})`}/>
      <polyline points={polyline} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    let start = 0;
    const step = to / 40;
    const iv = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(iv); }
      else setVal(Math.floor(start));
    }, 18);
    return () => clearInterval(iv);
  }, [to]);
  return <>{prefix}{val}{suffix}</>;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

// ─── Micro bar ────────────────────────────────────────────────────────────────

function MicroBar({ value, color, label, max = 100 }: { value: number; color: string; label: string; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Validation: { bg: "rgba(255,184,0,0.08)",  text: "#FFB800", border: "rgba(255,184,0,0.2)"  },
  Growth:     { bg: "rgba(122,92,255,0.08)", text: "#7A5CFF", border: "rgba(122,92,255,0.2)" },
  Scale:      { bg: "rgba(0,231,167,0.08)",  text: "#00E7A7", border: "rgba(0,231,167,0.2)"  },
  Mature:     { bg: "rgba(90,141,255,0.08)", text: "#5A8DFF", border: "rgba(90,141,255,0.2)" },
};

function scoreColor(s: number) {
  if (s >= 85) return "#00E7A7";
  if (s >= 70) return "#FFB800";
  return "#FF5470";
}

function ProjectCard({ project, compact }: { project: Project; compact?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const stage = STAGE_COLORS[project.stage] ?? STAGE_COLORS.Growth;
  const sc = scoreColor(project.score);

  if (compact) {
    return (
      <Link href={`/dashboard/projects/${project.id}`}>
        <motion.div
          whileHover={{ y: -2 }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            background: hovered ? `rgba(${project.rgb},0.05)` : "rgba(255,255,255,0.025)",
            border: `1px solid ${hovered ? `rgba(${project.rgb},0.25)` : "rgba(255,255,255,0.06)"}`,
            transition: "background 0.25s, border-color 0.25s",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `rgba(${project.rgb},0.12)`, border: `1px solid rgba(${project.rgb},0.22)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Brain size={16} style={{ color: project.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{project.industry} · {project.date}</div>
          </div>
          <Sparkline data={project.sparkline} color={project.color} width={60} height={28} />
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: sc, lineHeight: 1 }}>{project.score}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>AI Score</div>
          </div>
          <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: stage.bg, color: stage.text, border: `1px solid ${stage.border}`, flexShrink: 0 }}>{project.stage}</span>
          <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        borderRadius: 20,
        background: `rgba(${project.rgb},0.03)`,
        border: `1px solid ${hovered ? `rgba(${project.rgb},0.3)` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? `0 20px 60px rgba(${project.rgb},0.12), 0 0 0 1px rgba(${project.rgb},0.12)` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top glow accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${project.rgb},0.6), transparent)`, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }} />

      {/* Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, rgba(${project.rgb},0.2), rgba(${project.rgb},0.06))`, border: `1px solid rgba(${project.rgb},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px rgba(${project.rgb},0.2)` }}>
              <Brain size={18} style={{ color: project.color }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 3 }}>{project.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: stage.bg, color: stage.text, border: `1px solid ${stage.border}` }}>{project.stage}</span>
                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 600, background: project.status === "complete" ? "rgba(0,231,167,0.08)" : "rgba(255,184,0,0.08)", color: project.status === "complete" ? "#00E7A7" : "#FFB800", border: `1px solid ${project.status === "complete" ? "rgba(0,231,167,0.2)" : "rgba(255,184,0,0.2)"}` }}>
                  {project.status === "complete" ? "● Завершён" : "● Анализ"}
                </span>
              </div>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ScoreRing score={project.score} color={sc} size={52} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: sc, lineHeight: 1 }}>{project.score}</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>AI</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 0 }}>{project.description}</p>
      </div>

      {/* Metrics */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Прогноз</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#00E7A7" }}>{project.revenue}</div>
            <div style={{ fontSize: 9, color: "rgba(0,231,167,0.6)", marginTop: 1 }}>{project.growth}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Рынок (SAM)</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>{project.market}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>TAM {project.tam}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Агенты</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>{project.executives}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>AI директоров</div>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <MicroBar value={project.growthScore} color="#5A8DFF" label="Growth" />
          <MicroBar value={project.riskScore} color={project.riskScore > 35 ? "#FF5470" : "#00E7A7"} label="Risk" />
        </div>
      </div>

      {/* Sparkline + confidence */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Score Dynamics</div>
          <Sparkline data={project.sparkline} color={project.color} width={120} height={32} />
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confidence</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: project.color, lineHeight: 1 }}>{project.confidence}%</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>AI уверенность</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Link href={`/dashboard/projects/${project.id}`}
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: `rgba(${project.rgb},0.1)`, border: `1px solid rgba(${project.rgb},0.22)`, fontSize: 10, fontWeight: 600, color: project.color, textDecoration: "none", flexShrink: 0 }}
        >
          <ArrowUpRight size={10} /> Открыть
        </Link>
        <Link href="/dashboard/reports"
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", flexShrink: 0 }}
        >
          <FileText size={10} /> Отчёт
        </Link>
        <Link href="/dashboard/chat"
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", flexShrink: 0 }}
        >
          <MessageSquare size={10} /> AI Чат
        </Link>
        <button
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}
        >
          <Download size={10} /> PDF
        </button>
      </div>
    </motion.div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ insight, delay }: { insight: typeof PORTFOLIO_INSIGHTS[0]; delay: number }) {
  const Icon = insight.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: `rgba(${insight.rgb},0.04)`,
        border: `1px solid rgba(${insight.rgb},0.14)`,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(${insight.rgb},0.12)`, border: `1px solid rgba(${insight.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={12} style={{ color: insight.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.82)", marginBottom: 3 }}>{insight.title}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.5, marginBottom: 6 }}>{insight.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: insight.color }}>{insight.gain}</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Вероятность {insight.prob}%</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: `rgba(${insight.rgb},0.1)`, color: insight.color }}>{insight.impact}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Feed event ───────────────────────────────────────────────────────────────

function FeedEvent({ ev, idx }: { ev: typeof FEED_EVENTS[0]; idx: number }) {
  const Icon = ev.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1, duration: 0.35 }}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div style={{ width: 26, height: 26, borderRadius: 7, background: `rgba(${ev.rgb},0.1)`, border: `1px solid rgba(${ev.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={11} style={{ color: ev.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: ev.color }}>{ev.agent}</span>
          {" "}<span style={{ color: "rgba(255,255,255,0.35)" }}>{ev.action}</span>
        </div>
        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>{ev.project} · {ev.time} назад</div>
      </div>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, boxShadow: `0 0 5px ${ev.color}`, flexShrink: 0, marginTop: 4 }} />
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

import { Rocket } from "lucide-react";

const VIEW_MODES = [
  { id: "cards", icon: LayoutGrid, label: "Карточки" },
  { id: "list",  icon: List,       label: "Список" },
] as const;

const FILTER_TABS = ["Все", "Завершённые", "В работе"] as const;
const SORT_OPTIONS = ["AI Score ↓", "AI Score ↑", "Выручка", "Рост", "Дата"] as const;

export default function ProjectsPage() {
  const [filter, setFilter]   = useState<string>("Все");
  const [view, setView]       = useState<"cards" | "list">("cards");
  const [search, setSearch]   = useState("");
  const [sort, setSort]       = useState<string>("AI Score ↓");
  const [showFilters, setShowFilters] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Project[] = stored.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        industry: p.industry || "Бизнес",
        stage: p.stage || "Growth",
        score: Number(p.score) || 78,
        growthScore: Math.round((Number(p.score) || 78) * 0.95),
        riskScore: Math.round(100 - (Number(p.score) || 78) * 0.7),
        status: "complete",
        executives: 20,
        date: p.date || "Только что",
        revenue: p.revenue || "—",
        revenueRaw: 0,
        market: p.market || "—",
        tam: "—",
        growth: p.growth || "—",
        burnRate: "—",
        confidence: Number(p.score) || 78,
        color: "#7A5CFF",
        rgb: "122,92,255",
        sparkline: [50, 55, 60, 58, 65, 70, 75, Number(p.score) || 78],
        opportunities: 2,
        insights: [],
      }));
      setUserProjects(mapped);
    } catch {}
  }, []);

  const ALL_PROJECTS = [...userProjects, ...DEFAULT_PROJECTS];

  const filtered = ALL_PROJECTS
    .filter(p => {
      if (filter === "Завершённые") return p.status === "complete";
      if (filter === "В работе")    return p.status === "in_progress";
      return true;
    })
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.industry.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "AI Score ↓") return b.score - a.score;
      if (sort === "AI Score ↑") return a.score - b.score;
      if (sort === "Выручка")    return b.revenueRaw - a.revenueRaw;
      if (sort === "Рост")       return b.growthScore - a.growthScore;
      return 0;
    });

  const totalRevenue   = ALL_PROJECTS.reduce((s, p) => s + p.revenueRaw, 0);
  const avgScore       = Math.round(ALL_PROJECTS.reduce((s, p) => s + p.score, 0) / ALL_PROJECTS.length);
  const totalOpps      = ALL_PROJECTS.reduce((s, p) => s + p.opportunities, 0);
  const completedCount = ALL_PROJECTS.filter(p => p.status === "complete").length;
  const healthScore    = Math.round((completedCount / ALL_PROJECTS.length) * 100);
  const bestProject    = [...ALL_PROJECTS].sort((a, b) => b.score - a.score)[0];
  const riskProject    = [...ALL_PROJECTS].sort((a, b) => b.riskScore - a.riskScore)[0];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,92,255,0.06) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "5%",  width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,231,167,0.04) 0%, transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "28px 28px 40px" }}>

        {/* AI Summary Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24, padding: "12px 18px", borderRadius: 14, background: "rgba(122,92,255,0.06)", border: "1px solid rgba(122,92,255,0.16)", display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(122,92,255,0.4)" }}>
            <Sparkles size={13} color="white" />
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", flex: 1 }}>
            <span style={{ color: "#7A5CFF", fontWeight: 700 }}>AI Portfolio Summary: </span>
            Ваш портфель демонстрирует высокий потенциал роста. Обнаружено <span style={{ color: "#00E7A7", fontWeight: 600 }}>{totalOpps} возможностей масштабирования</span>, 1 потенциальный риск. Рекомендуется обновить стратегию для <span style={{ color: "#FFB800", fontWeight: 600 }}>Local Restaurant Chain</span>.
          </p>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>20 агентов · обновлено сейчас</span>
        </motion.div>

        {/* Hero header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 6 }}>
              Portfolio Intelligence
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>AI Executive Board управляет {ALL_PROJECTS.length} стратегиями</p>
          </div>
          <Link
            href="/dashboard/new"
            style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 12, background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none", boxShadow: "0 4px 20px rgba(122,92,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)", flexShrink: 0 }}
          >
            <Zap size={14} />
            Новая стратегия
          </Link>
        </div>

        {/* KPI row */}
        <div className="kpi-grid" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Проектов",      value: ALL_PROJECTS.length, suffix: "", prefix: "",  color: "#7A5CFF", rgb: "122,92,255", icon: Layers,     sub: `+${userProjects.length} новых` },
            { label: "Прогноз",       value: Math.round(totalRevenue / 100000) / 10, suffix: "M", prefix: "$", color: "#00E7A7", rgb: "0,231,167",  icon: DollarSign, sub: "+24% vs Q1" },
            { label: "Avg AI Score",  value: avgScore, suffix: "", prefix: "",  color: "#5A8DFF", rgb: "90,141,255", icon: Star,        sub: "Топ 8% рынка" },
            { label: "Возможности",   value: totalOpps, suffix: "", prefix: "",  color: "#FFB800", rgb: "255,184,0",  icon: Target,      sub: "AI обнаружил" },
            { label: "Здоровье",      value: healthScore, suffix: "%", prefix: "",  color: "#00E7A7", rgb: "0,231,167",  icon: Activity,    sub: "Портфель" },
            { label: "Завершено",     value: completedCount, suffix: `/${ALL_PROJECTS.length}`, prefix: "",  color: "#a78bfa", rgb: "167,139,250", icon: CheckCircle, sub: "Стратегий" },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ padding: "14px 14px 12px", borderRadius: 16, background: `rgba(${kpi.rgb},0.05)`, border: `1px solid rgba(${kpi.rgb},0.12)`, position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, rgba(${kpi.rgb},0.1) 0%, transparent 70%)`, transform: "translate(20px, -20px)" }} />
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `rgba(${kpi.rgb},0.12)`, border: `1px solid rgba(${kpi.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon size={12} style={{ color: kpi.color }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1, marginBottom: 3 }}>
                  <Counter to={typeof kpi.value === "number" ? kpi.value : 0} suffix={kpi.suffix} prefix={kpi.prefix} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{kpi.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{kpi.sub}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Main layout */}
        <div className="proj-main-grid" style={{ display: "grid", gap: 20, alignItems: "start" }}>

          {/* Left: projects */}
          <div>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", pointerEvents: "none" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск проектов, отраслей…"
                  style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "rgba(255,255,255,0.65)", outline: "none" }}
                />
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 2, padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                {FILTER_TABS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: filter === f ? "rgba(122,92,255,0.2)" : "transparent", color: filter === f ? "#a78bfa" : "rgba(255,255,255,0.35)", border: filter === f ? "1px solid rgba(122,92,255,0.2)" : "1px solid transparent", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{ height: 34, padding: "0 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.5)", outline: "none", cursor: "pointer" }}
              >
                {SORT_OPTIONS.map(o => <option key={o} value={o} style={{ background: "#0e0e14" }}>{o}</option>)}
              </select>

              {/* View toggle */}
              <div style={{ display: "flex", gap: 2, padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                {VIEW_MODES.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setView(m.id)}
                      style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: view === m.id ? "rgba(122,92,255,0.2)" : "transparent", color: view === m.id ? "#a78bfa" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}
                    >
                      <Icon size={13} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Projects */}
            <AnimatePresence mode="wait">
              {view === "cards" ? (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}
                >
                  {filtered.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <ProjectCard project={p} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {filtered.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <ProjectCard project={p} compact />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div style={{ padding: "48px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                Нет проектов в этой категории
              </div>
            )}
          </div>

          {/* Right: Intelligence panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Portfolio metrics */}
            <div style={{ padding: "18px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Portfolio Intelligence</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Лучший AI Score", value: `${bestProject?.score} — ${bestProject?.name.split(" ")[0]}`, color: "#00E7A7" },
                  { label: "Самый быстрый рост", value: "SaaS Invoice +18%/год",  color: "#5A8DFF" },
                  { label: "Высокий риск", value: `${riskProject?.name.split(" ")[0]} · ${riskProject?.riskScore}pts`, color: "#FF5470" },
                  { label: "Общий прогноз",  value: `$${(totalRevenue / 1e6).toFixed(1)}M ARR`, color: "#7A5CFF" },
                  { label: "AI возможности", value: `${totalOpps} обнаружено`, color: "#FFB800" },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.32)" }}>{m.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Insights */}
            <div style={{ padding: "18px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Portfolio Insights</div>
              {PORTFOLIO_INSIGHTS.map((ins, i) => (
                <InsightCard key={ins.title} insight={ins} delay={i * 0.1} />
              ))}
            </div>

            {/* Live Executive Feed */}
            <div style={{ padding: "18px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Live Executive Feed</div>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E7A7", boxShadow: "0 0 6px rgba(0,231,167,0.8)", animation: "pf-pulse 2s ease-in-out infinite", display: "inline-block" }} />
              </div>
              {FEED_EVENTS.map((ev, i) => (
                <FeedEvent key={i} ev={ev} idx={i} />
              ))}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes pf-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .kpi-grid { grid-template-columns: repeat(6, 1fr); }
        .proj-main-grid { grid-template-columns: 1fr 300px; }
        @media (max-width: 1100px) {
          .proj-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
