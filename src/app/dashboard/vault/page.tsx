"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Command, Bot, ListChecks, CalendarClock, Wrench,
  Filter, BarChart3, PlusSquare, Database,
} from "lucide-react";

// ─── Типы и палитра узлов ──────────────────────────────────────────────────────
type NodeType = "agent" | "topic" | "memory" | "doc" | "artifact" | "config";

const TYPE_STYLE: Record<NodeType, { dot: string; glow: string; ring: string; chipBg: string; chipText: string; label: string }> = {
  agent:    { dot: "bg-violet-400",  glow: "shadow-[0_0_18px_rgba(167,139,250,0.55)]", ring: "ring-violet-300",  chipBg: "bg-violet-500/10 border-violet-400/30",  chipText: "text-violet-300", label: "AGENT" },
  topic:    { dot: "bg-cyan-400",    glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]",   ring: "ring-cyan-300",    chipBg: "bg-cyan-500/10 border-cyan-400/30",      chipText: "text-cyan-300",   label: "TOPIC_HUB" },
  memory:   { dot: "bg-amber-400",   glow: "shadow-[0_0_13px_rgba(251,191,36,0.5)]",   ring: "ring-amber-300",   chipBg: "bg-amber-500/10 border-amber-400/30",    chipText: "text-amber-300",  label: "MEMORY" },
  doc:      { dot: "bg-blue-400",    glow: "shadow-[0_0_13px_rgba(96,165,250,0.5)]",   ring: "ring-blue-300",    chipBg: "bg-blue-500/10 border-blue-400/30",      chipText: "text-blue-300",   label: "VAULT_DOC" },
  artifact: { dot: "bg-emerald-400", glow: "shadow-[0_0_13px_rgba(52,211,153,0.5)]",   ring: "ring-emerald-300", chipBg: "bg-emerald-500/10 border-emerald-400/30",chipText: "text-emerald-300",label: "ARTIFACT" },
  config:   { dot: "bg-slate-400",   glow: "shadow-[0_0_10px_rgba(148,163,184,0.4)]",  ring: "ring-slate-300",   chipBg: "bg-slate-500/10 border-slate-400/30",    chipText: "text-slate-300",  label: "CONFIG" },
};

interface VaultNode {
  id: string;
  label: string;
  title: string;          // крупный заголовок в инспекторе
  type: NodeType;
  x: number;              // позиция в % контейнера
  y: number;
  size: number;           // px
  desc: string;
  scope: "LOCAL" | "GLOBAL";
  bytes: string;
  rels: string[];         // relationship-чипы
}

// ─── Данные графа ─────────────────────────────────────────────────────────────
const NODES: VaultNode[] = [
  // агенты
  { id: "ceo",        label: "CEO / Orchestrator", title: "CEO / Orchestrator", type: "agent", x: 48, y: 42, size: 30, scope: "GLOBAL", bytes: "0 BYTES", desc: "Routes work, maintains system context, and coordinates specialist agents.", rels: ["SPECIALIST-AGENT", "ORCHESTRATES", "CONTEXTS", "OWNS_CONTEXT", "OWNS_CONTEXT"] },
  { id: "researcher", label: "Researcher",         title: "Researcher",         type: "agent", x: 64, y: 28, size: 24, scope: "GLOBAL", bytes: "0 BYTES", desc: "Gathers market, competitor and customer intelligence; feeds the research base.", rels: ["INTEL_GATHERER", "WRITES_MEMORY", "OWNS_CONTEXT"] },
  { id: "cmo",        label: "CMO",                title: "CMO / Market Voice", type: "agent", x: 34, y: 56, size: 24, scope: "GLOBAL", bytes: "0 BYTES", desc: "Shapes brand narrative, positioning and the content engine.", rels: ["MARKET_INSIGHTS", "PUBLISHES", "OWNS_CONTEXT"] },
  { id: "sales",      label: "Sales Rep",          title: "Sales Rep / Revenue Ops", type: "agent", x: 58, y: 63, size: 24, scope: "GLOBAL", bytes: "0 BYTES", desc: "Owns the lead pipeline, qualification and closing motions.", rels: ["REVENUE_OPS", "READS_PIPELINE", "OWNS_CONTEXT"] },
  { id: "dev",        label: "Dev",                title: "Dev / Build System", type: "agent", x: 27, y: 32, size: 22, scope: "GLOBAL", bytes: "0 BYTES", desc: "Designs architecture and ships the product; consumes config nodes.", rels: ["BUILD_SYSTEM", "READS_CONFIG", "OWNS_CONTEXT"] },
  { id: "data",       label: "Data Analyst",       title: "Data Analyst / Signal Layer", type: "agent", x: 71, y: 50, size: 22, scope: "GLOBAL", bytes: "0 BYTES", desc: "Builds metrics, forecasts and watches signals across the company.", rels: ["SIGNAL_LAYER", "AGGREGATES", "OWNS_CONTEXT"] },
  // топик-хабы
  { id: "t_pipeline", label: "Lead Pipeline",   title: "Lead Pipeline Hub",   type: "topic", x: 19, y: 47, size: 18, scope: "GLOBAL", bytes: "12 KB", desc: "Topic hub grouping pipeline memories, docs and lead artifacts.", rels: ["TOPIC_HUB", "GROUPS", "SHARED_CONTEXT"] },
  { id: "t_content",  label: "Content Engine",  title: "Content Engine Hub",  type: "topic", x: 78, y: 34, size: 18, scope: "GLOBAL", bytes: "9 KB",  desc: "Topic hub for the content system: prompts, drafts and analytics.", rels: ["TOPIC_HUB", "GROUPS", "SHARED_CONTEXT"] },
  { id: "t_research", label: "Research Base",   title: "Research Base Hub",   type: "topic", x: 41, y: 19, size: 18, scope: "GLOBAL", bytes: "15 KB", desc: "Topic hub aggregating research memories and market docs.", rels: ["TOPIC_HUB", "GROUPS", "SHARED_CONTEXT"] },
  { id: "t_ops",      label: "Ops Config",      title: "Ops Config Hub",      type: "topic", x: 66, y: 76, size: 16, scope: "GLOBAL", bytes: "6 KB",  desc: "Topic hub for operational configuration and system nodes.", rels: ["TOPIC_HUB", "GROUPS", "SYSTEM"] },
  // память
  { id: "m1", label: "Latest Dry Run",        title: "Latest Dry Run",        type: "memory", x: 30, y: 70, size: 13, scope: "LOCAL",  bytes: "3.2 KB", desc: "Working memory of the latest pipeline dry run and its outcome.", rels: ["MEMORY_RECORD", "RECALLED_BY", "LOCAL"] },
  { id: "m2", label: "Stage 4 Looping Prompt",title: "Stage 4 Looping Prompt",type: "memory", x: 52, y: 16, size: 13, scope: "LOCAL",  bytes: "2.1 KB", desc: "Recalled prompt state for the stage-4 research loop.", rels: ["MEMORY_RECORD", "RECALLED_BY", "LOCAL"] },
  { id: "m3", label: "Qualified Leads",       title: "Qualified Leads",       type: "memory", x: 74, y: 61, size: 13, scope: "GLOBAL", bytes: "5.4 KB", desc: "Shared memory of currently qualified leads and scoring notes.", rels: ["MEMORY_RECORD", "SHARED", "SCORED"] },
  { id: "m4", label: "Meta Memory",           title: "Meta Memory",           type: "memory", x: 15, y: 28, size: 13, scope: "GLOBAL", bytes: "1.8 KB", desc: "System-level meta memory: what the company already knows.", rels: ["MEMORY_RECORD", "META", "GLOBAL"] },
  { id: "m5", label: "Daily HQ Sync",         title: "Daily HQ Sync",         type: "memory", x: 45, y: 79, size: 13, scope: "LOCAL",  bytes: "2.7 KB", desc: "Memory snapshot of the last daily sync between agents.", rels: ["MEMORY_RECORD", "SNAPSHOT", "LOCAL"] },
  { id: "m6", label: "Session State",         title: "Session State",         type: "memory", x: 86, y: 46, size: 13, scope: "LOCAL",  bytes: "0.9 KB", desc: "Volatile session state recalled by the orchestrator.", rels: ["MEMORY_RECORD", "RECALLED_BY", "LOCAL"] },
  // документы
  { id: "d1", label: "Weekly Pipeline Brief", title: "Weekly Pipeline Brief", type: "doc", x: 21, y: 60, size: 13, scope: "GLOBAL", bytes: "18 KB", desc: "Vault doc: weekly pipeline brief referenced by Sales and CEO.", rels: ["VAULT_DOC", "REFERENCED_BY", "INDEXED"] },
  { id: "d2", label: "Content Intelligence",  title: "Content Intelligence DB", type: "doc", x: 56, y: 34, size: 13, scope: "GLOBAL", bytes: "42 KB", desc: "Indexed database of content performance and topic intelligence.", rels: ["VAULT_DOC", "INDEXED", "QUERIED_BY"] },
  { id: "d3", label: "Market Map",            title: "Market Map",            type: "doc", x: 69, y: 18, size: 13, scope: "GLOBAL", bytes: "11 KB", desc: "Research doc mapping segments, competitors and openings.", rels: ["VAULT_DOC", "REFERENCED_BY", "RESEARCH"] },
  { id: "d4", label: "ICP Definition",        title: "ICP Definition",        type: "doc", x: 38, y: 45, size: 13, scope: "GLOBAL", bytes: "6 KB",  desc: "Canonical definition of the ideal customer profile.", rels: ["VAULT_DOC", "CANONICAL", "REFERENCED_BY"] },
  { id: "d5", label: "Playbook Base",         title: "Playbook Base Spec",    type: "doc", x: 81, y: 68, size: 13, scope: "GLOBAL", bytes: "24 KB", desc: "Operational playbook spec consumed by Ops and Sales.", rels: ["VAULT_DOC", "SPEC", "REFERENCED_BY"] },
  // артефакты
  { id: "a1", label: "Forecast v3",       title: "Forecast v3",       type: "artifact", x: 14, y: 71, size: 12, scope: "LOCAL",  bytes: "7.5 KB", desc: "Data artifact: revenue forecast produced by the Data Analyst.", rels: ["DATA_ARTIFACT", "PRODUCED_BY", "VERSIONED"] },
  { id: "a2", label: "Funnel Snapshot",   title: "Funnel Snapshot",   type: "artifact", x: 61, y: 47, size: 12, scope: "LOCAL",  bytes: "4.1 KB", desc: "Snapshot of the current funnel conversion by stage.", rels: ["DATA_ARTIFACT", "SNAPSHOT", "VERSIONED"] },
  { id: "a3", label: "Lead Scoring Model",title: "Lead Scoring Model",type: "artifact", x: 47, y: 58, size: 12, scope: "GLOBAL", bytes: "9.8 KB", desc: "Scoring model artifact used to qualify pipeline leads.", rels: ["DATA_ARTIFACT", "MODEL", "PRODUCED_BY"] },
  { id: "a4", label: "Cohort Export",     title: "Cohort Export",     type: "artifact", x: 73, y: 27, size: 12, scope: "LOCAL",  bytes: "13 KB",  desc: "Exported cohort analysis consumed by the Content Engine.", rels: ["DATA_ARTIFACT", "EXPORT", "CONSUMED_BY"] },
  // конфиги
  { id: "c1", label: "Router Rules", title: "Router Rules", type: "config", x: 36, y: 80, size: 11, scope: "GLOBAL", bytes: "1.2 KB", desc: "Config node: routing rules the orchestrator reads at dispatch.", rels: ["CONFIG_NODE", "READ_BY", "SYSTEM"] },
  { id: "c2", label: "Vault Keys",   title: "Vault Keys",   type: "config", x: 88, y: 57, size: 11, scope: "GLOBAL", bytes: "0.4 KB", desc: "Access keys and scopes for the knowledge vault.", rels: ["CONFIG_NODE", "SECURED", "SYSTEM"] },
  { id: "c3", label: "Cron Jobs",    title: "Cron Jobs",    type: "config", x: 24, y: 17, size: 11, scope: "GLOBAL", bytes: "0.8 KB", desc: "Scheduled jobs configuration for background syncs.", rels: ["CONFIG_NODE", "SCHEDULED", "SYSTEM"] },
];

const EDGES: [string, string][] = [
  // агенты → CEO
  ["researcher", "ceo"], ["cmo", "ceo"], ["sales", "ceo"], ["dev", "ceo"], ["data", "ceo"],
  // агенты → хабы
  ["t_pipeline", "sales"], ["t_pipeline", "cmo"], ["t_content", "cmo"], ["t_content", "researcher"],
  ["t_research", "researcher"], ["t_research", "data"], ["t_ops", "dev"], ["t_ops", "ceo"],
  // память
  ["m1", "t_pipeline"], ["m1", "sales"], ["m2", "t_research"], ["m2", "researcher"],
  ["m3", "sales"], ["m3", "data"], ["m4", "ceo"], ["m4", "t_research"],
  ["m5", "ceo"], ["m5", "t_ops"], ["m6", "ceo"], ["m6", "data"],
  // документы
  ["d1", "t_pipeline"], ["d1", "ceo"], ["d2", "t_content"], ["d2", "data"],
  ["d3", "t_research"], ["d3", "researcher"], ["d4", "cmo"], ["d4", "t_pipeline"],
  ["d5", "t_ops"], ["d5", "sales"],
  // артефакты
  ["a1", "data"], ["a1", "t_pipeline"], ["a2", "data"], ["a2", "sales"],
  ["a3", "sales"], ["a3", "t_pipeline"], ["a4", "t_content"], ["a4", "data"],
  // конфиги
  ["c1", "ceo"], ["c1", "t_ops"], ["c2", "t_ops"], ["c3", "dev"], ["c3", "t_ops"],
  // перекрёстные связи
  ["d2", "cmo"], ["m3", "d1"], ["a3", "m3"], ["d4", "researcher"], ["m2", "d3"],
];

const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
const LINKS_OF: Record<string, number> = {};
EDGES.forEach(([a, b]) => { LINKS_OF[a] = (LINKS_OF[a] || 0) + 1; LINKS_OF[b] = (LINKS_OF[b] || 0) + 1; });

// ─── Левое меню ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "command",   label: "Command Center",    icon: Command },
  { id: "agents",    label: "Agents",            icon: Bot },
  { id: "tasks",     label: "Tasks",             icon: ListChecks },
  { id: "schedule",  label: "Schedule",          icon: CalendarClock },
  { id: "tools",     label: "Tools",             icon: Wrench },
  { id: "pipeline",  label: "Lead Pipeline",     icon: Filter },
  { id: "analytics", label: "Content Analytics", icon: BarChart3 },
  { id: "content",   label: "Content",           icon: PlusSquare },
  { id: "vault",     label: "Knowledge Vault",   icon: Database },
];

type AgentStatus = "working" | "waiting" | "idle";
const AGENT_LIST: { id: string; name: string; layer: string; status: AgentStatus }[] = [
  { id: "ceo",        name: "CEO",          layer: "COMMAND LAYER",   status: "working" },
  { id: "researcher", name: "Researcher",   layer: "INTEL GATHERER",  status: "waiting" },
  { id: "cmo",        name: "CMO",          layer: "MARKET INSIGHTS", status: "waiting" },
  { id: "sales",      name: "Sales Rep",    layer: "REVENUE OPS",     status: "working" },
  { id: "dev",        name: "Dev",          layer: "BUILD SYSTEM",    status: "idle" },
  { id: "data",       name: "Data Analyst", layer: "SIGNAL LAYER",    status: "idle" },
];

const STATUS_STYLE: Record<AgentStatus, { dot: string; text: string; label: string }> = {
  working: { dot: "bg-emerald-400", text: "text-emerald-400", label: "working" },
  waiting: { dot: "bg-amber-400",   text: "text-amber-400",   label: "waiting" },
  idle:    { dot: "bg-slate-500",   text: "text-slate-400",   label: "idle" },
};

// ─── Страница ─────────────────────────────────────────────────────────────────
export default function KnowledgeVaultPage() {
  const [activeTab, setActiveTab] = useState("vault");
  const [selectedNode, setSelectedNode] = useState<string>("ceo");
  const reduce = useReducedMotion();

  const node = NODE_BY_ID[selectedNode] ?? NODE_BY_ID.ceo;
  const style = TYPE_STYLE[node.type];

  // связи выбранного узла — для подсветки рёбер
  const activeEdges = useMemo(() => {
    const s = new Set<number>();
    EDGES.forEach((e, i) => { if (e[0] === selectedNode || e[1] === selectedNode) s.add(i); });
    return s;
  }, [selectedNode]);

  return (
    <div className="h-screen w-full flex bg-slate-950 text-slate-300 overflow-hidden">

      {/* ═══ Left Sidebar ═══ */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-950/80 backdrop-blur">
        {/* бренд */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 text-left">
          <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-blue-400/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_18px_rgba(59,130,246,0.25)]">
            <Database size={17} className="text-blue-300" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[15px] font-bold text-slate-100 tracking-tight truncate">Apex Agentic OS</div>
            <div className="text-[9px] font-mono tracking-[0.18em] text-slate-500 uppercase">Agentic Growth Operations</div>
          </div>
        </div>

        {/* SidebarNav */}
        <nav className="px-3 py-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
                  active
                    ? "bg-blue-900/20 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 border border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AgentList */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 mt-2">
          <div className="px-2 pb-2 text-left text-[10px] font-mono font-semibold tracking-[0.2em] text-blue-400/80 uppercase">Agents</div>
          <div className="flex flex-col gap-1.5">
            {AGENT_LIST.map(a => {
              const st = STATUS_STYLE[a.status];
              const selected = selectedNode === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedNode(a.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors backdrop-blur ${
                    selected
                      ? "border-violet-400/40 bg-violet-500/[0.08]"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                  }`}
                >
                  <span className="min-w-0 text-left">
                    <span className="block text-[13px] font-semibold text-slate-100 truncate">{a.name}</span>
                    <span className="block text-[9px] font-mono tracking-[0.14em] text-slate-500 uppercase truncate">{a.layer}</span>
                  </span>
                  <span className={`flex items-center gap-1.5 flex-shrink-0 px-2 py-0.5 rounded-md border border-slate-700/60 bg-slate-900/60 text-[10px] font-mono ${st.text}`}>
                    <span className={`size-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ═══ Main Canvas ═══ */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* заголовок */}
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-4 text-left">
          <div className="min-w-0 text-left">
            <h1 className="text-[21px] font-bold text-slate-100 tracking-tight text-left">Colored memory/database topology</h1>
            <p className="text-[13px] text-slate-500 mt-0.5 text-left">Agents, memories, vault docs, data artifacts, config nodes, and topic hubs.</p>
          </div>
          <div className="flex-shrink-0 px-3.5 py-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-300 text-[12px] font-mono">
            {NODES.length} nodes · {EDGES.length} edges
          </div>
        </div>

        {/* граф */}
        <div className="flex-1 relative mx-5 mb-5 rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur overflow-hidden">
          {/* лёгкая внутренняя подсветка сцены */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_55%_at_50%_45%,rgba(59,130,246,0.06),transparent_70%)]" />

          {/* SVG-рёбра */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {EDGES.map((e, i) => {
              const a = NODE_BY_ID[e[0]], b = NODE_BY_ID[e[1]];
              if (!a || !b) return null;
              const hot = activeEdges.has(i);
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={hot ? "rgba(129,140,248,0.55)" : "rgba(148,163,184,0.10)"}
                  strokeWidth={hot ? 1.6 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* узлы */}
          {NODES.map((n, i) => {
            const ts = TYPE_STYLE[n.type];
            const isSel = n.id === selectedNode;
            return (
              <motion.button
                key={n.id}
                onClick={() => setSelectedNode(n.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-start group"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.02, 0.5), ease: [0.22, 1, 0.36, 1] }}
                title={n.label}
              >
                <motion.span
                  className={`block rounded-full ${ts.dot} ${ts.glow} ${isSel ? `ring-2 ring-offset-2 ring-offset-slate-950 ${ts.ring}` : ""}`}
                  style={{ width: n.size, height: n.size }}
                  animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                  transition={reduce ? undefined : { duration: 2.4 + (i % 5) * 0.5, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.3 }}
                />
                <span className={`mt-1.5 text-[9px] font-mono whitespace-nowrap text-left transition-colors ${
                  isSel ? "text-slate-100" : n.type === "agent" ? "text-slate-300" : "text-slate-500 group-hover:text-slate-300"
                }`}>
                  {n.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* ═══ Right Inspector ═══ */}
      <aside className="w-96 flex-shrink-0 border-l border-slate-800 bg-slate-950/80 backdrop-blur overflow-y-auto">
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 text-left"
        >
          {/* чипы типа */}
          <div className="flex items-center justify-start gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono font-semibold tracking-wide ${style.chipBg} ${style.chipText}`}>
              <span className={`size-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/50 text-slate-300 text-[10px] font-mono font-semibold tracking-wide">
              {node.id.toUpperCase().replace(/^T_/, "")}
            </span>
          </div>

          {/* заголовок */}
          <h2 className="mt-4 text-[24px] leading-tight font-bold text-slate-100 tracking-tight text-left">{node.title}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-400 text-left">{node.desc}</p>

          {/* метрики grid-cols-2 */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { k: "AGENT", v: node.type === "agent" ? "AGENT" : style.label },
              { k: "SCOPE", v: node.scope },
              { k: "SIZE",  v: node.bytes },
              { k: "LINKS", v: `${LINKS_OF[node.id] ?? 0} LINKS` },
            ].map(m => (
              <div key={m.k} className="px-3.5 py-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur text-left">
                <div className="text-[9px] font-mono tracking-[0.18em] text-slate-500 uppercase text-left">{m.k}</div>
                <div className="mt-1 text-[12.5px] font-mono font-semibold text-blue-300 text-left">{m.v}</div>
              </div>
            ))}
          </div>

          {/* relationship-чипы */}
          <div className="mt-5 flex flex-wrap justify-start gap-2">
            {node.rels.map((r, i) => (
              <span key={`${r}-${i}`} className="px-2.5 py-1.5 rounded-lg border border-slate-700/70 bg-slate-800/40 text-slate-300 text-[10px] font-mono tracking-wide">
                {r}
              </span>
            ))}
          </div>

          {/* связанные узлы */}
          <div className="mt-7 text-left">
            <div className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase text-left">Connected nodes</div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {EDGES.filter(e => e[0] === node.id || e[1] === node.id).slice(0, 8).map((e, i) => {
                const other = NODE_BY_ID[e[0] === node.id ? e[1] : e[0]];
                if (!other) return null;
                const ots = TYPE_STYLE[other.type];
                return (
                  <button
                    key={`${other.id}-${i}`}
                    onClick={() => setSelectedNode(other.id)}
                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <span className={`size-2 rounded-full flex-shrink-0 ${ots.dot}`} />
                    <span className="text-[12px] text-slate-300 truncate">{other.label}</span>
                    <span className="ml-auto text-[9px] font-mono text-slate-600 uppercase flex-shrink-0">{ots.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </aside>
    </div>
  );
}
