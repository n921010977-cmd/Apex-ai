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
    description: "Mobile app with personalized workout and nutrition plans powered by AI algorithms",
    industry: "Mobile App · SaaS",
    stage: "Growth",
    score: 87,
    growthScore: 92,
    riskScore: 24,
    status: "complete",
    executives: 20,
    date: "2 hours ago",
    revenue: "$2.4M",
    revenueRaw: 2400000,
    market: "$4.2B",
    tam: "$18B",
    growth: "+24%/yr",
    burnRate: "$45K/mo",
    confidence: 94,
    color: "#D946EF",
    rgb: "217,70,239",
    sparkline: [42, 58, 51, 67, 73, 69, 82, 87],
    opportunities: 4,
    insights: ["High scaling potential", "EU expansion recommended"],
  },
  {
    id: "2",
    name: "SaaS Invoice Platform",
    description: "Automated invoicing and payment management for freelancers and agencies",
    industry: "SaaS · FinTech",
    stage: "Scale",
    score: 91,
    growthScore: 88,
    riskScore: 18,
    status: "complete",
    executives: 20,
    date: "Yesterday",
    revenue: "$1.8M",
    revenueRaw: 1800000,
    market: "$2.1B",
    tam: "$9B",
    growth: "+18%/yr",
    burnRate: "$28K/mo",
    confidence: 97,
    color: "#10b981",
    rgb: "16,185,129",
    sparkline: [55, 62, 58, 71, 79, 85, 89, 91],
    opportunities: 3,
    insights: ["Ready for Series A", "Strong unit economics"],
  },
  {
    id: "3",
    name: "Local Restaurant Chain",
    description: "Expansion strategy for a regional fast-casual restaurant brand",
    industry: "Restaurant · Food",
    stage: "Validation",
    score: 72,
    growthScore: 65,
    riskScore: 41,
    status: "in_progress",
    executives: 20,
    date: "In progress",
    revenue: "Calculating…",
    revenueRaw: 0,
    market: "$890M",
    tam: "$3.2B",
    growth: "+9%/yr",
    burnRate: "—",
    confidence: 71,
    color: "#f59e0b",
    rgb: "245,158,11",
    sparkline: [60, 55, 63, 58, 68, 65, 70, 72],
    opportunities: 2,
    insights: ["Strategy needs refinement", "2 risks detected"],
  },
];

const FEED_EVENTS = [
  { agent: "Sophia Rivers", role: "CEO", icon: Brain, color: "#D946EF", rgb: "217,70,239", action: "updated the scaling strategy", project: "AI Fitness Platform", time: "3m" },
  { agent: "Marcus Chen",   role: "CFO", icon: DollarSign, color: "#3b82f6", rgb: "59,130,246", action: "recalculated the financial model",  project: "SaaS Invoice Platform", time: "11m" },
  { agent: "Elena Torres",  role: "CMO", icon: TrendingUp, color: "#10b981", rgb: "16,185,129", action: "discovered a new market segment", project: "AI Fitness Platform", time: "28m" },
  { agent: "James Wright",  role: "COO", icon: Activity, color: "#f59e0b", rgb: "245,158,11", action: "identified an operational risk", project: "Restaurant Chain", time: "1h" },
  { agent: "Sara Patel",    role: "PM",  icon: Layers, color: "#e879f9", rgb: "232,121,249", action: "drafted the product roadmap", project: "SaaS Invoice Platform", time: "2h" },
];

const PORTFOLIO_INSIGHTS = [
  { type: "scale",   icon: Rocket, color: "#10b981", rgb: "16,185,129",  title: "Ready to scale", desc: "SaaS Invoice Platform shows unit economics of +340%. Series A is recommended.",   impact: "High", prob: 92, gain: "+$3.2M" },
  { type: "risk",    icon: AlertTriangle, color: "#f43f5e", rgb: "244,63,94", title: "Risk for Restaurant Chain", desc: "High operational risk in the supply chain. Strategy adjustment needed.", impact: "Medium", prob: 67, gain: "−12%" },
  { type: "opport",  icon: Globe, color: "#3b82f6", rgb: "59,130,246",  title: "EU market entry",         desc: "AI Fitness Platform is ready for European expansion. Germany is the first target.",   impact: "High", prob: 78, gain: "+$1.8M" },
  { type: "update",  icon: Zap, color: "#f59e0b", rgb: "245,158,11",    title: "Refresh strategy",         desc: "Restaurant Chain: the last AI analysis was 7 days ago. A re-analysis is recommended.",   impact: "Low",  prob: 55, gain: "+8%" },
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
  Validation: { bg: "rgba(245,158,11,0.08)",  text: "#f59e0b", border: "rgba(245,158,11,0.2)"  },
  Growth:     { bg: "rgba(217,70,239,0.08)", text: "#D946EF", border: "rgba(217,70,239,0.2)" },
  Scale:      { bg: "rgba(16,185,129,0.08)",  text: "#10b981", border: "rgba(16,185,129,0.2)"  },
  Mature:     { bg: "rgba(59,130,246,0.08)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" },
};

function scoreColor(s: number) {
  if (s >= 85) return "#10b981";
  if (s >= 70) return "#f59e0b";
  return "#f43f5e";
}

// живые действия совета — крутятся в карточке
const EXEC_LIVE: { who: string; act: string; ago: string }[] = [
  { who: "CFO", act: "recalculated unit economics",   ago: "3m ago" },
  { who: "CMO", act: "updated the channel plan",        ago: "7m ago" },
  { who: "CEO", act: "revised priorities",      ago: "12m ago" },
  { who: "CTO", act: "estimated MVP cost",         ago: "18m ago" },
  { who: "COO", act: "reworked the process",         ago: "24m ago" },
];

function ProjectCard({ project, compact }: { project: Project; compact?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [liveIdx, setLiveIdx] = useState(0);
  const stage = STAGE_COLORS[project.stage] ?? STAGE_COLORS.Growth;
  const sc = scoreColor(project.score);
  const analyzing = project.status !== "complete";

  // ротация последнего действия совета (у каждой карточки свой ритм)
  useEffect(() => {
    const hash = project.id.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
    const t = setInterval(() => setLiveIdx(i => (i + 1) % EXEC_LIVE.length), 4200 + (hash % 5) * 400);
    return () => clearInterval(t);
  }, [project.id]);

  const live = EXEC_LIVE[(liveIdx + project.id.length) % EXEC_LIVE.length];

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
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, rgba(${project.rgb},0.22), rgba(${project.rgb},0.06))`, border: `1px solid rgba(${project.rgb},0.28)`, display: "flex", alignItems: "center", justifyContent: "center", color: project.color, fontSize: 11.5, fontWeight: 800, letterSpacing: "-0.02em", boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)` }}>
              {project.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <span style={{ position: "absolute", right: -1, bottom: -1, width: 8, height: 8, borderRadius: "50%",
              background: analyzing ? "#f59e0b" : "#10b981", border: "2px solid #0a0c15",
              boxShadow: `0 0 5px ${analyzing ? "#f59e0b" : "#10b981"}`,
              animation: "pc-pulse 1.8s ease-in-out infinite" }} />
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
      {/* Сканирующая полоса — только когда идёт анализ */}
      {analyzing && (
        <motion.div aria-hidden
          initial={{ x: "-40%" }} animate={{ x: "140%" }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: 0, bottom: 0, width: "35%", pointerEvents: "none",
            background: `linear-gradient(90deg, transparent, rgba(${project.rgb},0.06) 45%, rgba(${project.rgb},0.11) 50%, rgba(${project.rgb},0.06) 55%, transparent)` }} />
      )}

      {/* Header */}
      <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {/* Аватар проекта — уникальные инициалы вместо мозга у всех */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, rgba(${project.rgb},0.28), rgba(${project.rgb},0.08))`, border: `1px solid rgba(${project.rgb},0.32)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 18px rgba(${project.rgb},0.22), inset 0 1px 0 rgba(255,255,255,0.12)`, color: project.color, fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {project.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              {/* живой статус-точка */}
              <span style={{ position: "absolute", right: -2, bottom: -2, width: 10, height: 10, borderRadius: "50%",
                background: analyzing ? "#f59e0b" : "#10b981", border: "2px solid #0a0c15",
                boxShadow: `0 0 8px ${analyzing ? "#f59e0b" : "#10b981"}`,
                animation: "pc-pulse 1.8s ease-in-out infinite" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "rgba(255,255,255,0.94)", marginBottom: 4, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: stage.bg, color: stage.text, border: `1px solid ${stage.border}` }}>{project.stage}</span>
                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 600, background: analyzing ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)", color: analyzing ? "#f59e0b" : "#10b981", border: `1px solid ${analyzing ? "rgba(245,158,11,0.22)" : "rgba(16,185,129,0.22)"}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: analyzing ? "#f59e0b" : "#10b981", boxShadow: `0 0 5px ${analyzing ? "#f59e0b" : "#10b981"}` }} />
                  {analyzing ? "Analyzing" : "Complete"}
                </span>
                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.32)" }}>
                  {project.date}
                </span>
              </div>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ScoreRing score={project.score} color={sc} size={52} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: sc, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{project.score}</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 1, letterSpacing: "0.1em" }}>AI</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, margin: "0 0 12px" }}>{project.description}</p>

        {/* Живая строка: последнее действие совета */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
          background: `linear-gradient(90deg, rgba(${project.rgb},0.06), rgba(${project.rgb},0.015))`,
          border: `1px solid rgba(${project.rgb},0.14)` }}>
          <span style={{ display: "inline-flex", gap: 2, flexShrink: 0 }}>
            {[0, 1, 2].map(d => (
              <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: project.color, animation: `pc-think 1.2s ease-in-out ${d * 0.18}s infinite` }} />
            ))}
          </span>
          <AnimatePresence mode="wait">
            <motion.span key={live.who + live.act}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.28 }}
              style={{ flex: 1, minWidth: 0, fontSize: 11, color: "rgba(255,255,255,0.62)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <b style={{ color: project.color, fontWeight: 800 }}>{live.who}</b> {live.act}
            </motion.span>
          </AnimatePresence>
          <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", flexShrink: 0 }}>{live.ago}</span>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Forecast</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{project.revenue}</div>
            <div style={{ fontSize: 9, color: "rgba(16,185,129,0.6)", marginTop: 1 }}>{project.growth}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Market (SAM)</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>{project.market}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>TAM {project.tam}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Agents</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>{project.executives}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>AI executives</div>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <MicroBar value={project.growthScore} color="#3b82f6" label="Growth" />
          <MicroBar value={project.riskScore} color={project.riskScore > 35 ? "#f43f5e" : "#10b981"} label="Risk" />
        </div>
      </div>

      {/* Sparkline + confidence — единая AI-панель */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "stretch", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Score · trend</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 700, color: project.color, fontVariantNumeric: "tabular-nums" }}>
              <TrendingUp size={9} strokeWidth={2.5} />
              +{Math.max(0, project.sparkline[project.sparkline.length - 1] - project.sparkline[0])}
            </span>
          </div>
          <div style={{ padding: "2px 0" }}>
            <Sparkline data={project.sparkline} color={project.color} width={160} height={36} />
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
        <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 82 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confidence</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: project.color, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{project.confidence}%</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 3 }}>AI confidence</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Link href={`/dashboard/projects/${project.id}`}
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: `rgba(${project.rgb},0.1)`, border: `1px solid rgba(${project.rgb},0.22)`, fontSize: 10, fontWeight: 600, color: project.color, textDecoration: "none", flexShrink: 0 }}
        >
          <ArrowUpRight size={10} /> Open
        </Link>
        <Link href="/dashboard/reports"
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", flexShrink: 0 }}
        >
          <FileText size={10} /> Report
        </Link>
        <Link href="/dashboard/chat"
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textDecoration: "none", flexShrink: 0 }}
        >
          <MessageSquare size={10} /> AI Chat
        </Link>
        <button
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}
        >
          <Download size={10} /> PDF
        </button>
      </div>

      <style>{`
        @keyframes pc-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(0.75);opacity:0.55} }
        @keyframes pc-think { 0%,100%{opacity:0.25;transform:translateY(0)} 50%{opacity:1;transform:translateY(-2px)} }
      `}</style>
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
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Probability {insight.prob}%</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: `rgba(${insight.rgb},0.1)`, color: insight.color }}>{insight.impact}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Feed event ───────────────────────────────────────────────────────────────

// Feed hook: новые события «прибывают» каждые ~8 секунд
function useLiveFeed() {
  const [items, setItems] = useState(FEED_EVENTS.map((e, i) => ({ ...e, key: `f-${i}` })));
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      const src = FEED_EVENTS[n % FEED_EVENTS.length]; n++;
      setItems(prev => [{ ...src, time: "now", key: `f-live-${Date.now()}` },
        ...prev.slice(0, 5).map(p => p.time === "now" ? { ...p, time: "1m" } : p)]);
    }, 8000);
    return () => clearInterval(t);
  }, []);
  return items;
}

function LiveFeedBlock() {
  const items = useLiveFeed();
  return (
    <div style={{ padding: "18px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
      {/* лёгкое свечение сверху */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Live Executive Feed</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "#10b981" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.8)", animation: "pf-pulse 1.8s ease-in-out infinite" }} />
          LIVE
        </span>
      </div>
      <AnimatePresence initial={false}>
        {items.map((ev, i) => (
          <motion.div key={ev.key} layout
            initial={{ opacity: 0, x: 14, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: -14, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}>
            <FeedEvent ev={ev} idx={i} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

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
        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>{ev.project} · {ev.time} ago</div>
      </div>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, boxShadow: `0 0 5px ${ev.color}`, flexShrink: 0, marginTop: 4 }} />
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

import { Rocket } from "lucide-react";

const VIEW_MODES = [
  { id: "cards", icon: LayoutGrid, label: "Cards" },
  { id: "list",  icon: List,       label: "List" },
] as const;

const FILTER_TABS = ["All", "Completed", "In progress"] as const;
const SORT_OPTIONS = ["AI Score ↓", "AI Score ↑", "Revenue", "Growth", "Date"] as const;

export default function ProjectsPage() {
  const [filter, setFilter]   = useState<string>("All");
  const [view, setView]       = useState<"cards" | "list">("cards");
  const [search, setSearch]   = useState("");
  const [sort, setSort]       = useState<string>("AI Score ↓");
  const [showFilters, setShowFilters] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalize = (p: any): Project => {
      const score = Number(p.score ?? p.overall_score) || 78;
      return {
        id: p.id,
        name: p.name ?? p.title ?? "Untitled",
        description: p.description || "",
        industry: p.industry || "Business",
        stage: p.stage || "Growth",
        score,
        growthScore: Math.round(score * 0.95),
        riskScore: Math.round(100 - score * 0.7),
        status: "complete",
        executives: 20,
        date: p.date || (p.created_at ? new Date(p.created_at).toLocaleDateString("en-US") : "Just now"),
        revenue: p.revenue || p.target_revenue || "—",
        revenueRaw: 0,
        market: p.market || "—",
        tam: "—",
        growth: p.growth || "—",
        burnRate: "—",
        confidence: score,
        color: "#D946EF",
        rgb: "217,70,239",
        sparkline: [50, 55, 60, 58, 65, 70, 75, score],
        opportunities: 2,
        insights: [],
      };
    };

    // Local cache first for instant paint
    try {
      const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
      if (Array.isArray(stored) && stored.length) setUserProjects(stored.map(normalize));
    } catch {}

    // Then reconcile with the server. A non-empty server list is the source of
    // truth; an empty response must NOT clobber local-only projects (created
    // while offline or before the server write landed).
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.projects) && d.projects.length) {
          setUserProjects(d.projects.map(normalize));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Real projects win. Only fall back to labelled examples when the user has none.
  const hasReal = userProjects.length > 0;
  const isDemo = !hasReal;
  const ALL_PROJECTS = hasReal ? userProjects : DEFAULT_PROJECTS;

  const filtered = ALL_PROJECTS
    .filter(p => {
      if (filter === "Completed") return p.status === "complete";
      if (filter === "In progress")    return p.status === "in_progress";
      return true;
    })
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.industry.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "AI Score ↓") return b.score - a.score;
      if (sort === "AI Score ↑") return a.score - b.score;
      if (sort === "Revenue")    return b.revenueRaw - a.revenueRaw;
      if (sort === "Growth")       return b.growthScore - a.growthScore;
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
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,70,239,0.06) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "5%",  width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "28px 28px 40px" }}>

        {/* AI Summary Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24, padding: "12px 18px", borderRadius: 14, background: "rgba(217,70,239,0.06)", border: "1px solid rgba(217,70,239,0.16)", display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #D946EF, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(217,70,239,0.4)" }}>
            <Sparkles size={13} color="white" />
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", flex: 1 }}>
            <span style={{ color: "#D946EF", fontWeight: 700 }}>AI Portfolio Summary: </span>
            Your portfolio is showing strong growth potential. Found <span style={{ color: "#10b981", fontWeight: 600 }}>{totalOpps} scaling opportunities</span>, 1 potential risk. A strategy refresh is recommended for <span style={{ color: "#f59e0b", fontWeight: 600 }}>Local Restaurant Chain</span>.
          </p>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>20 agents · updated just now</span>
        </motion.div>

        {/* Hero header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(124,58,237,0.75)", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}>Portfolio</div>
            <h1 style={{ fontSize: "clamp(22px,2.6vw,30px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 8 }}>
              My projects
            </h1>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", boxShadow: "0 0 6px rgba(124,58,237,0.7)" }} />{ALL_PROJECTS.length} strategies tracked
            </p>
          </div>
          <Link
            href="/dashboard/new"
            style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 18px", borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)", flexShrink: 0 }}
          >
            <Zap size={14} />
            New strategy
          </Link>
        </div>

        {/* KPI row */}
        <div className="kpi-grid" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Projects",      value: ALL_PROJECTS.length, suffix: "", prefix: "",  color: "#D946EF", rgb: "217,70,239", icon: Layers,     sub: `+${userProjects.length} new` },
            { label: "Forecast",       value: Math.round(totalRevenue / 100000) / 10, suffix: "M", prefix: "$", color: "#10b981", rgb: "16,185,129",  icon: DollarSign, sub: "+24% vs Q1" },
            { label: "Avg AI Score",  value: avgScore, suffix: "", prefix: "",  color: "#3b82f6", rgb: "59,130,246", icon: Star,        sub: "Top 8% of market" },
            { label: "Opportunities",   value: totalOpps, suffix: "", prefix: "",  color: "#f59e0b", rgb: "245,158,11",  icon: Target,      sub: "AI detected" },
            { label: "Health",      value: healthScore, suffix: "%", prefix: "",  color: "#10b981", rgb: "16,185,129",  icon: Activity,    sub: "Portfolio" },
            { label: "Completed",     value: completedCount, suffix: `/${ALL_PROJECTS.length}`, prefix: "",  color: "#a78bfa", rgb: "167,139,250", icon: CheckCircle, sub: "Strategies" },
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
                  placeholder="Search projects, industries…"
                  style={{ width: "100%", height: 34, paddingLeft: 30, paddingRight: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "rgba(255,255,255,0.65)", outline: "none" }}
                />
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 2, padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                {FILTER_TABS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: filter === f ? "rgba(217,70,239,0.2)" : "transparent", color: filter === f ? "#a78bfa" : "rgba(255,255,255,0.35)", border: filter === f ? "1px solid rgba(217,70,239,0.2)" : "1px solid transparent", cursor: "pointer", transition: "all 0.2s" }}
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
                      style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: view === m.id ? "rgba(217,70,239,0.2)" : "transparent", color: view === m.id ? "#a78bfa" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}
                    >
                      <Icon size={13} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Example / empty-state banner — only when the user has no real projects */}
            {loaded && isDemo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", marginBottom: 14, borderRadius: 14,
                  background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.22)" }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a5b4fc", background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>Example</span>
                <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                  These are demo projects. Run your own analysis and your strategies will appear here.
                </span>
                <Link href="/dashboard/new" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 15px", borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: 12.5, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(124,58,237,0.32)" }}>
                  Create strategy
                </Link>
              </motion.div>
            )}

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
                No projects in this category
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
                  { label: "Best AI Score", value: `${bestProject?.score} — ${bestProject?.name.split(" ")[0]}`, color: "#10b981" },
                  { label: "Fastest growth", value: "SaaS Invoice +18%/yr",  color: "#3b82f6" },
                  { label: "Highest risk", value: `${riskProject?.name.split(" ")[0]} · ${riskProject?.riskScore}pts`, color: "#f43f5e" },
                  { label: "Total forecast",  value: `$${(totalRevenue / 1e6).toFixed(1)}M ARR`, color: "#D946EF" },
                  { label: "AI opportunities", value: `${totalOpps} detected`, color: "#f59e0b" },
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
            <LiveFeedBlock />

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
