"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "IDLE" | "THINKING" | "ANALYZING" | "WRITING" | "COMPLETED" | "ERROR";

interface AgentState {
  role:        string;
  name:        string;
  task:        string;
  color:       string;
  rgb:         string;
  status:      AgentStatus;
  progress:    number;
  currentLog:  string;
  logs:        string[];
}

interface Project {
  id:             string;
  name:           string;
  description:    string | null;
  overall_score:  number;
  status:         string;
  created_at:     string;
  target_revenue: string | null;
  ai_results:     unknown[];
}

// ─── Static data ──────────────────────────────────────────────────────────────

const DEMO_PROJECTS: Project[] = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Мобильное приложение с AI-персонализацией тренировок", overall_score: 87, status: "active", created_at: new Date(Date.now() - 2 * 3600000).toISOString(), target_revenue: "$2.4M", ai_results: [1,2,3] },
  { id: "2",    name: "SaaS Invoice Platform",  description: "Автоматизированное выставление счетов для фрилансеров",  overall_score: 91, status: "active", created_at: new Date(Date.now() - 86400000).toISOString(),   target_revenue: "$1.8M", ai_results: [1,2,3] },
];

const AGENT_LOG_SEQUENCES: Record<string, string[]> = {
  CEO: [
    "Читаю бизнес-бриф команды...",
    "Анализирую конкурентную среду...",
    "Формирую стратегическое видение...",
    "Оцениваю рыночную позицию...",
    "Синтезирую данные от команды...",
    "Составляю executive summary...",
    "Финализирую стратегию роста...",
  ],
  CFO: [
    "Строю финансовую модель...",
    "Рассчитываю точку безубыточности...",
    "Анализирую Unit Economics...",
    "Прогнозирую денежные потоки...",
    "Оцениваю инвестиционные риски...",
    "Формирую P&L на 3 года...",
    "Документирую финансовые KPI...",
  ],
  CMO: [
    "Изучаю целевую аудиторию...",
    "Анализирую конкурентный маркетинг...",
    "Разрабатываю go-to-market план...",
    "Формирую контент-стратегию...",
    "Рассчитываю маркетинговый бюджет...",
    "Определяю каналы привлечения...",
    "Оформляю brand positioning...",
  ],
  COO: [
    "Проектирую операционную структуру...",
    "Оптимизирую бизнес-процессы...",
    "Определяю операционные KPI...",
    "Строю org chart команды...",
    "Планирую масштабирование...",
    "Документирую SOP процедуры...",
    "Формирую execution roadmap...",
  ],
  CTO: [
    "Анализирую технический стек...",
    "Оцениваю архитектурные риски...",
    "Проектирую MVP roadmap...",
    "Выбираю инфраструктурные решения...",
    "Оцениваю tech debt и сроки...",
    "Формирую tech spec документ...",
    "Финализирую dev timeline...",
  ],
};

const INITIAL_AGENTS: AgentState[] = [
  { role: "CEO", name: "София Ривз",   task: "Стратегическое видение",   color: "#8b5cf6", rgb: "139,92,246",  status: "IDLE", progress: 0, currentLog: "Ожидаю брифинга...", logs: [] },
  { role: "CFO", name: "Маркус Чен",   task: "Финансовый анализ",         color: "#06b6d4", rgb: "6,182,212",   status: "IDLE", progress: 0, currentLog: "Ожидаю брифинга...", logs: [] },
  { role: "CMO", name: "Елена Торрес", task: "Маркетинговая стратегия",   color: "#10b981", rgb: "16,185,129",  status: "IDLE", progress: 0, currentLog: "Ожидаю брифинга...", logs: [] },
  { role: "COO", name: "Джеймс Райт", task: "Операционный план",          color: "#f59e0b", rgb: "245,158,11",  status: "IDLE", progress: 0, currentLog: "Ожидаю брифинга...", logs: [] },
  { role: "CTO", name: "Парк Айден",   task: "Технологический стек",      color: "#ec4899", rgb: "236,72,153",  status: "IDLE", progress: 0, currentLog: "Ожидаю брифинга...", logs: [] },
];

const STATUS_META: Record<AgentStatus, { label: string; dotColor: string; pulse: boolean }> = {
  IDLE:      { label: "Ожидание",  dotColor: "rgba(255,255,255,0.2)",  pulse: false },
  THINKING:  { label: "Думает",    dotColor: "#a78bfa",                pulse: true  },
  ANALYZING: { label: "Анализ",    dotColor: "#06b6d4",                pulse: true  },
  WRITING:   { label: "Пишет",     dotColor: "#60a5fa",                pulse: true  },
  COMPLETED: { label: "Готово",    dotColor: "#34d399",                pulse: false },
  ERROR:     { label: "Ошибка",    dotColor: "#f87171",                pulse: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Только что";
  if (h < 24) return `${h}ч назад`;
  if (d === 1) return "Вчера";
  return `${d}д назад`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

const SPARKLINE = [30, 38, 45, 42, 55, 60, 58, 70, 75, 82, 88, 95];
function Sparkline() {
  const W = 80, H = 28, n = SPARKLINE.length;
  const min = Math.min(...SPARKLINE), max = Math.max(...SPARKLINE);
  const pts = SPARKLINE.map((v, i) => ({ x: (i / (n - 1)) * W, y: H - ((v - min) / (max - min)) * H }));
  const line = pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1], mx = (prev.x + p.x) / 2;
    return `C ${mx.toFixed(1)} ${prev.y.toFixed(1)} ${mx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");
  const area = `${line} L ${pts[n-1].x} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
      <defs>
        <linearGradient id="spFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spFill)"/>
      <path d={line} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px rgba(52,211,153,0.7))" }}/>
      <circle cx={pts[n-1].x} cy={pts[n-1].y} r="2.5" fill="#34d399" style={{ filter: "drop-shadow(0 0 4px #34d399)" }}/>
    </svg>
  );
}

// ─── Agent Log Drawer ─────────────────────────────────────────────────────────

function AgentLogDrawer({ agent, onClose }: { agent: AgentState; onClose: () => void }) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agent.logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position:       "absolute",
        bottom:         "calc(100% + 8px)",
        left:           0,
        right:          0,
        zIndex:         50,
        borderRadius:   16,
        overflow:       "hidden",
        background:     `linear-gradient(145deg, rgba(${agent.rgb},0.1) 0%, rgba(8,8,14,0.96) 100%)`,
        border:         `1px solid rgba(${agent.rgb},0.3)`,
        boxShadow:      `0 0 40px rgba(${agent.rgb},0.15), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)`,
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px 8px",
        borderBottom: `1px solid rgba(${agent.rgb},0.15)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: STATUS_META[agent.status].dotColor,
            boxShadow: `0 0 8px ${STATUS_META[agent.status].dotColor}`,
            animation: STATUS_META[agent.status].pulse ? "agent-pulse 1.4s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: `rgba(${agent.rgb},0.9)` }}>
            {agent.role} — Лог активности
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2, lineHeight: 1 }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
          </svg>
        </button>
      </div>

      {/* Logs */}
      <div ref={logRef} style={{ maxHeight: 140, overflowY: "auto", padding: "10px 14px", fontFamily: "ui-monospace, 'Cascadia Code', monospace" }}>
        {agent.logs.length === 0 ? (
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)" }}>Ожидание команды...</span>
        ) : agent.logs.map((log, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
            <span style={{ fontSize: 9, color: `rgba(${agent.rgb},0.45)`, flexShrink: 0, marginTop: 1.5, letterSpacing: "0.05em" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{
              fontSize: 10.5,
              color: i === agent.logs.length - 1 ? `rgba(${agent.rgb},0.85)` : "rgba(255,255,255,0.35)",
              lineHeight: 1.5,
            }}>
              {log}
            </span>
            {i === agent.logs.length - 1 && agent.status !== "COMPLETED" && (
              <span style={{ display: "inline-flex", gap: 2, marginLeft: 2, alignSelf: "center" }}>
                {[0,1,2].map(d => (
                  <span key={d} style={{
                    display: "inline-block", width: 3, height: 3, borderRadius: "50%",
                    background: `rgba(${agent.rgb},0.6)`,
                    animation: `agent-dot 1.1s ease-in-out infinite`,
                    animationDelay: `${d * 0.18}s`,
                  }} />
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  isExpanded,
  onToggle,
}: {
  agent:      AgentState;
  isExpanded: boolean;
  onToggle:   () => void;
}) {
  const meta = STATUS_META[agent.status];

  return (
    <div style={{ position: "relative" }}>
      <AnimatePresence>{isExpanded && <AgentLogDrawer agent={agent} onClose={onToggle} />}</AnimatePresence>

      <motion.div
        onClick={onToggle}
        whileHover={{ x: 2, transition: { duration: 0.15 } }}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          padding:        "9px 10px",
          borderRadius:   14,
          cursor:         "pointer",
          background:     isExpanded ? `rgba(${agent.rgb},0.08)` : "transparent",
          border:         `1px solid ${isExpanded ? `rgba(${agent.rgb},0.2)` : "transparent"}`,
          transition:     "background 0.2s, border-color 0.2s",
          position:       "relative",
          overflow:       "hidden",
        }}
      >
        {/* Active glow bar on left edge */}
        {agent.status !== "IDLE" && (
          <div style={{
            position:   "absolute",
            left:       0,
            top:        "15%",
            bottom:     "15%",
            width:      2.5,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${agent.color}, rgba(${agent.rgb},0.3))`,
            boxShadow:  `0 0 8px rgba(${agent.rgb},0.7)`,
          }} />
        )}

        {/* Avatar */}
        <div style={{
          flexShrink:     0,
          width:          34,
          height:         34,
          borderRadius:   10,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       10,
          fontWeight:     700,
          color:          agent.color,
          background:     `rgba(${agent.rgb},0.12)`,
          border:         `1px solid rgba(${agent.rgb},${agent.status !== "IDLE" ? "0.35" : "0.18"})`,
          boxShadow:      agent.status !== "IDLE" ? `0 0 12px rgba(${agent.rgb},0.3)` : "none",
          transition:     "box-shadow 0.3s, border-color 0.3s",
        }}>
          {agent.role[0]}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1 }}>
              {agent.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize:     9,
                fontWeight:   600,
                letterSpacing: "0.05em",
                color:        agent.status === "IDLE" ? "rgba(255,255,255,0.2)" : agent.color,
                textTransform: "uppercase",
              }}>
                {meta.label}
              </span>
              <div style={{
                width:     6,
                height:    6,
                borderRadius: "50%",
                background: meta.dotColor,
                boxShadow:  meta.pulse ? `0 0 6px ${meta.dotColor}` : "none",
                animation:  meta.pulse ? "agent-pulse 1.4s ease-in-out infinite" : "none",
                flexShrink: 0,
              }} />
            </div>
          </div>

          {/* Current log message */}
          <div style={{
            fontSize:   9.5,
            color:      agent.status !== "IDLE" ? `rgba(${agent.rgb},0.6)` : "rgba(255,255,255,0.2)",
            marginBottom: agent.status !== "IDLE" ? 6 : 0,
            whiteSpace: "nowrap",
            overflow:   "hidden",
            textOverflow: "ellipsis",
            fontFamily: agent.status !== "IDLE" ? "ui-monospace, 'Cascadia Code', monospace" : "inherit",
            transition: "color 0.3s",
          }}>
            {agent.currentLog}
          </div>

          {/* Progress bar */}
          {agent.status !== "IDLE" && (
            <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, rgba(${agent.rgb},0.6), ${agent.color})` }}
                animate={{ width: `${agent.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          )}

          {/* Completed checkmark */}
          {agent.status === "COMPLETED" && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <div style={{ height: 2, background: `linear-gradient(90deg, rgba(${agent.rgb},0.5), #34d399)`, borderRadius: 2, flex: 1 }} />
              <svg viewBox="0 0 12 12" fill="none" stroke="#34d399" strokeWidth="2" width="10" height="10" style={{ filter: "drop-shadow(0 0 3px #34d399)" }}>
                <polyline points="2,6 5,9 10,3"/>
              </svg>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Command Button ───────────────────────────────────────────────────────────

type BriefState = "IDLE" | "STARTING" | "RUNNING" | "DONE";

function CommandButton({ briefState, onClick }: { briefState: BriefState; onClick: () => void }) {
  const isDisabled = briefState === "STARTING" || briefState === "RUNNING";
  const isDone     = briefState === "DONE";

  return (
    <motion.button
      onClick={!isDisabled && !isDone ? onClick : undefined}
      disabled={isDisabled}
      whileHover={!isDisabled && !isDone ? { y: -1, transition: { duration: 0.15 } } : {}}
      whileTap={!isDisabled && !isDone ? { scale: 0.98 } : {}}
      style={{
        width:          "100%",
        height:         38,
        borderRadius:   12,
        border:         "none",
        cursor:         isDisabled ? "not-allowed" : isDone ? "default" : "pointer",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            7,
        fontSize:       12,
        fontWeight:     600,
        color:          "#fff",
        background:     isDone
          ? "linear-gradient(135deg, #059669, #34d399)"
          : "linear-gradient(135deg, #7c3aed, #3b82f6)",
        boxShadow:      isDone
          ? "0 6px 20px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "0 6px 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        opacity:        isDisabled ? 0.75 : 1,
        transition:     "background 0.4s, box-shadow 0.4s, opacity 0.2s",
      }}
    >
      {briefState === "IDLE" && (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Брифовать команду
        </>
      )}
      {briefState === "STARTING" && (
        <>
          <span style={{ display: "flex", gap: 3 }}>
            {[0,1,2].map(d => (
              <span key={d} style={{
                display: "inline-block", width: 4, height: 4, borderRadius: "50%",
                background: "rgba(255,255,255,0.7)",
                animation: "agent-dot 1.1s ease-in-out infinite",
                animationDelay: `${d * 0.16}s`,
              }} />
            ))}
          </span>
          Планирование...
        </>
      )}
      {briefState === "RUNNING" && (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"
            style={{ animation: "spin 1.4s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Анализ в процессе...
        </>
      )}
      {briefState === "DONE" && (
        <>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13"
            style={{ filter: "drop-shadow(0 0 4px rgba(52,211,153,0.8))" }}>
            <polyline points="2,8 6,12 14,4"/>
          </svg>
          Анализ завершён
        </>
      )}
    </motion.button>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } }),
};

export default function DashboardPage() {
  const [projects,    setProjects]    = useState<Project[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [agents,      setAgents]      = useState<AgentState[]>(INITIAL_AGENTS);
  const [briefState,  setBriefState]  = useState<BriefState>("IDLE");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // Load projects
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

  // Agent simulation engine
  const runAgentSimulation = useCallback((roleIndex: number) => {
    const role       = INITIAL_AGENTS[roleIndex].role;
    const messages   = AGENT_LOG_SEQUENCES[role];
    let   msgIdx     = 0;
    let   progress   = 0;

    const TOTAL_DURATION = 18000 + roleIndex * 2500; // ms per agent
    const TICK_MS        = 300;
    const PROGRESS_STEP  = (100 / (TOTAL_DURATION / TICK_MS));

    const updateStatus = (prog: number): AgentStatus => {
      if (prog >= 100) return "COMPLETED";
      if (prog >= 70)  return "WRITING";
      if (prog >= 15)  return "ANALYZING";
      return "THINKING";
    };

    const tick = setInterval(() => {
      progress = Math.min(100, progress + PROGRESS_STEP);

      // Advance log message
      const targetMsgIdx = Math.floor((progress / 100) * (messages.length - 1));
      if (targetMsgIdx > msgIdx) {
        msgIdx = targetMsgIdx;
      }

      const currentMsg = messages[Math.min(msgIdx, messages.length - 1)];
      const newStatus  = updateStatus(progress);

      setAgents(prev => prev.map((a, i) => {
        if (i !== roleIndex) return a;
        const isNewMsg = currentMsg !== a.currentLog;
        return {
          ...a,
          status:     newStatus,
          progress:   Math.round(progress),
          currentLog: newStatus === "COMPLETED" ? "Отчёт сформирован ✓" : currentMsg,
          logs:       isNewMsg && newStatus !== "COMPLETED"
            ? [...a.logs, currentMsg].slice(-20)
            : newStatus === "COMPLETED" && a.status !== "COMPLETED"
              ? [...a.logs, "Отчёт сформирован ✓"]
              : a.logs,
        };
      }));

      if (progress >= 100) {
        clearInterval(tick);
        // Check if all done
        setAgents(prev => {
          const allDone = prev.every(a => a.status === "COMPLETED");
          if (allDone) setBriefState("DONE");
          return prev;
        });
      }
    }, TICK_MS);

    intervalsRef.current.push(tick);
  }, []);

  const handleBriefTeam = useCallback(() => {
    if (briefState !== "IDLE") return;

    // Clear any existing intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Reset agents
    setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: "IDLE", progress: 0, logs: [], currentLog: "Получаю задачу..." })));
    setBriefState("STARTING");

    setTimeout(() => {
      setBriefState("RUNNING");
      // Start agents with staggered delay
      INITIAL_AGENTS.forEach((_, i) => {
        setTimeout(() => runAgentSimulation(i), i * 1200);
      });
    }, 900);
  }, [briefState, runAgentSimulation]);

  useEffect(() => {
    return () => { intervalsRef.current.forEach(clearInterval); };
  }, []);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";
  const avgScore = projects.length ? Math.round(projects.reduce((a, p) => a + p.overall_score, 0) / projects.length) : 0;

  const completedCount = agents.filter(a => a.status === "COMPLETED").length;
  const runningCount   = agents.filter(a => a.status !== "IDLE" && a.status !== "COMPLETED").length;

  const STAT_CARDS = [
    {
      label: "Проектов", value: loading ? "…" : projects.length.toString(),
      sub: "всего", color: "#7c3aed", glow: "rgba(124,58,237,0.4)", positive: true,
      icon: <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="6" width="16" height="11" rx="2"/><path d="M2 9h16"/><path d="M6 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/></svg>,
      extra: null,
    },
    {
      label: "Средний балл", value: avgScore ? avgScore.toString() : null,
      sub: avgScore >= 80 ? "отлично" : avgScore >= 60 ? "хорошо" : "в работе",
      color: "#f59e0b", glow: "rgba(245,158,11,0.4)", positive: avgScore >= 75,
      icon: <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4"><polygon points="10 2 12.6 7.3 18.5 8.1 14.3 12.2 15.2 18.1 10 15.3 4.8 18.1 5.7 12.2 1.5 8.1 7.4 7.3"/></svg>,
      extra: null,
    },
    {
      label: "Отчётов",
      value: loading ? "…" : `${projects.filter(p => (p.ai_results as unknown[])?.length > 0).length} / 3`,
      sub: "2 остались", color: "#3b82f6", glow: "rgba(59,130,246,0.4)", positive: false,
      icon: <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="15" y1="17" x2="15" y2="8"/><line x1="10" y1="17" x2="10" y2="3"/><line x1="5" y1="17" x2="5" y2="11"/></svg>,
      extra: null,
    },
    {
      label: "Прогноз выручки", value: "$4.2M", sub: "по всем проектам",
      color: "#10b981", glow: "rgba(16,185,129,0.4)", positive: true,
      icon: <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4"><polyline points="2 12 5 8 8 10 12 5 18 8" strokeLinecap="round" strokeLinejoin="round"/><line x1="2" y1="17" x2="18" y2="17" strokeLinecap="round"/></svg>,
      extra: <Sparkline />,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <style>{`
        @keyframes agent-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.45; transform:scale(0.6); } }
        @keyframes agent-dot   { 0%,100% { opacity:0.3; transform:translateY(0); } 50% { opacity:1; transform:translateY(-2px); } }
        @keyframes spin        { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <motion.div
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">{greeting}, основатель</h1>
          <p className="text-sm text-white/35">
            {briefState === "RUNNING"
              ? `Работает ${runningCount} агентов · ${completedCount}/5 завершили`
              : briefState === "DONE"
              ? "Все агенты завершили анализ · Отчёт готов"
              : "Ваш исполнительный совет готов к работе."}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            boxShadow: "0 8px 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая стратегия
        </Link>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STAT_CARDS.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" custom={i}>
            <div
              className="relative rounded-2xl overflow-hidden p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(10,10,14,0.88) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 6px 28px rgba(0,0,0,0.25)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}50, transparent)` }} />
              <div className="flex items-start justify-between mb-3">
                <div className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}28`, color: s.color }}>
                  {s.icon}
                </div>
                {s.extra && <div className="flex-shrink-0 mt-1">{s.extra}</div>}
              </div>
              {s.value !== null ? (
                <div className="text-xl font-bold font-mono mb-0.5" style={{ color: s.color, textShadow: `0 0 20px ${s.glow}` }}>{s.value}</div>
              ) : (
                <div className="flex items-center gap-1.5 mb-0.5 h-7">
                  <span className="text-[11px] text-white/35">Вычисляется</span>
                  <span className="flex gap-0.5">{[0,1,2].map(d => <span key={d} className="size-1 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: `${d*150}ms` }}/>)}</span>
                </div>
              )}
              <div className="text-[11px] text-white/35 mb-1">{s.label}</div>
              <div className={`text-[10px] ${s.positive ? "text-emerald-400/80" : "text-white/25"}`}>{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Projects */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-white/80">Последние проекты</h2>
            <Link href="/dashboard/projects" className="text-xs text-violet-400/70 hover:text-violet-300 transition-colors">Все проекты →</Link>
          </div>

          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse"/>
            ))
          ) : (
            projects.slice(0, 5).map((p, i) => {
              const scoreColor = p.overall_score >= 85 ? "#34d399" : p.overall_score >= 75 ? "#f59e0b" : "#f87171";
              return (
                <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="show" custom={i + 4}>
                  <Link href={`/dashboard/projects/${p.id}`}>
                    <div
                      className="relative rounded-2xl overflow-hidden p-4 cursor-pointer group transition-all duration-200 hover:scale-[1.01] hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(10,10,14,0.85) 100%)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px group-hover:opacity-100 opacity-0 transition-opacity"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)" }}/>
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                          <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-white truncate">{p.name}</span>
                            <Badge variant={p.status === "active" ? "success" : "warning"} dot>
                              {p.status === "active" ? "Завершён" : "В работе"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-white/35 mb-2.5 truncate">{p.description ?? "Нет описания"}</p>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${p.overall_score}%`, background: `linear-gradient(90deg, ${scoreColor}aa, ${scoreColor})`, boxShadow: `0 0 8px ${scoreColor}80` }}/>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-bold font-mono" style={{ color: scoreColor }}>{p.overall_score}</div>
                          <div className="text-[10px] text-white/25 mt-0.5">{p.target_revenue ?? "—"}</div>
                          <div className="text-[9px] text-white/20 mt-0.5">{timeAgo(p.created_at)}</div>
                        </div>
                        <svg className="size-3.5 text-white/15 group-hover:text-violet-400/40 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8}>
            <Link href="/dashboard/new">
              <div
                className="flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
                style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "transparent" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(124,58,237,0.3)"; el.style.background = "rgba(124,58,237,0.04)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.background = "transparent"; }}
              >
                <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-dashed transition-all duration-200"
                  style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                  <svg className="size-4 text-white/20 group-hover:text-violet-400/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white/30 group-hover:text-white/55 transition-colors">Новая стратегия</div>
                  <div className="text-[11px] text-white/15">Опишите бизнес-идею и получите AI-анализ</div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* ── Right: Live Command Panel ── */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Executive Board */}
          <div
            className="relative rounded-2xl overflow-visible p-4"
            style={{
              background: "linear-gradient(145deg, rgba(124,58,237,0.08) 0%, rgba(10,10,14,0.94) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.45), transparent)" }}/>

            {/* Panel header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-white/80">Исполнительный совет</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {briefState === "RUNNING" && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#a78bfa", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {completedCount}/5
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[9px] font-medium"
                  style={{ color: briefState === "DONE" ? "#34d399" : briefState === "RUNNING" ? "#a78bfa" : "#34d399" }}>
                  <span className="size-1.5 rounded-full"
                    style={{
                      background: briefState === "DONE" ? "#34d399" : briefState === "RUNNING" ? "#a78bfa" : "#34d399",
                      boxShadow: `0 0 6px ${briefState === "RUNNING" ? "rgba(167,139,250,0.8)" : "rgba(52,211,153,0.8)"}`,
                      animation: briefState === "RUNNING" ? "agent-pulse 1.4s ease-in-out infinite" : "none",
                    }}/>
                  {briefState === "DONE" ? "Анализ готов" : briefState === "RUNNING" ? "В работе" : "Готов к работе"}
                </span>
              </div>
            </div>

            {/* Agent cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
              {agents.map((agent, i) => (
                <AgentCard
                  key={agent.role}
                  agent={agent}
                  isExpanded={expandedIdx === i}
                  onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                />
              ))}
            </div>

            {/* Command button */}
            <CommandButton briefState={briefState} onClick={handleBriefTeam} />

            {/* Hint */}
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 }}>
              {briefState === "IDLE"
                ? "Нажми на карточку агента, чтобы открыть лог"
                : briefState === "DONE"
                ? "Нажмите на агента, чтобы посмотреть лог работы"
                : "Нажми на агента, чтобы следить за его прогрессом"}
            </p>
          </div>

          {/* Pro plan banner */}
          <div
            className="relative rounded-2xl overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.08) 100%)",
              border: "1px solid rgba(124,58,237,0.2)",
              backdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(124,58,237,0.18), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.55), transparent)" }}/>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#a78bfa" }}>Pro Plan</div>
            <p className="text-[11.5px] text-white/50 mb-3 leading-relaxed">Безлимитные отчёты, расширенный финансовый анализ и PDF экспорт.</p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold font-mono text-white">$49</span>
              <span className="text-xs text-white/30">/мес</span>
            </div>
            <Link href="/dashboard/settings"
              className="w-full h-8 text-[11px] font-semibold text-white rounded-xl inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
              Перейти на Pro
            </Link>
          </div>

          {/* Quick actions */}
          <div
            className="relative rounded-2xl overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,14,0.88) 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">Быстрые действия</div>
            <div className="space-y-0.5">
              {[
                { label: "Новый анализ", href: "/dashboard/new",       icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v5.5l2.5 2.5"/><circle cx="8" cy="8" r="6"/></svg> },
                { label: "Все проекты",  href: "/dashboard/projects",  icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="5" width="14" height="9" rx="1.5"/><path d="M1 8h14"/><path d="M5 5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V5"/></svg> },
                { label: "Аналитика",    href: "/dashboard/analytics", icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="2 11 5 7 8 9 11 5 14 7"/></svg> },
                { label: "Настройки",    href: "/dashboard/settings",  icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"/></svg> },
              ].map(action => (
                <Link key={action.href} href={action.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-white/45 hover:text-white/75 hover:bg-white/[0.04] transition-all">
                  <span className="text-white/30">{action.icon}</span>
                  {action.label}
                  <svg className="size-3 ml-auto text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
