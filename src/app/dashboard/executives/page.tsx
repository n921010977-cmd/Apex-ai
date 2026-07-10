"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// ─── Hierarchy data ───────────────────────────────────────────────────────────
type Node = { id: string; ab: string; name: string; role: string; dept: string; score: number; c: string; g: [string, string]; parent?: string };

const CEO: Node = { id: "ceo", ab: "CEO", name: "CEO Стратег", role: "Стратегическое лидерство", dept: "leadership", score: 96, c: "#818cf8", g: ["#6366f1", "#4f46e5"] };

const CHIEFS: Node[] = [
  { id: "cfo", ab: "CFO", name: "CFO Финансы",    role: "Финансовая стратегия",   dept: "finance",    score: 93, c: "#60a5fa", g: ["#3b82f6", "#2563eb"], parent: "ceo" },
  { id: "cmo", ab: "CMO", name: "CMO Маркетинг",  role: "Рост и маркетинг",       dept: "marketing",  score: 94, c: "#34d399", g: ["#10b981", "#059669"], parent: "ceo" },
  { id: "coo", ab: "COO", name: "COO Операции",   role: "Операционное превосходство", dept: "operations", score: 92, c: "#fbbf24", g: ["#f59e0b", "#d97706"], parent: "ceo" },
  { id: "cto", ab: "CTO", name: "CTO Технологии", role: "Технологии и инновации", dept: "tech",       score: 95, c: "#c084fc", g: ["#a855f7", "#9333ea"], parent: "ceo" },
];

const SPECIALISTS: Node[] = [
  { id: "fp",  ab: "FP", name: "Financial Planner",   role: "Планирование и бюджет", dept: "finance",    score: 91, c: "#60a5fa", g: ["#3b82f6", "#2563eb"], parent: "cfo" },
  { id: "ra",  ab: "RA", name: "Risk Analyst",        role: "Управление рисками",    dept: "finance",    score: 90, c: "#60a5fa", g: ["#3b82f6", "#2563eb"], parent: "cfo" },
  { id: "ia",  ab: "IA", name: "Invest Analyst",      role: "Инвест-оценка",         dept: "finance",    score: 92, c: "#60a5fa", g: ["#3b82f6", "#2563eb"], parent: "cfo" },
  { id: "bs",  ab: "BS", name: "Brand Strategist",    role: "Бренд и позиционирование", dept: "marketing", score: 92, c: "#34d399", g: ["#10b981", "#059669"], parent: "cmo" },
  { id: "gh",  ab: "GH", name: "Growth Hacker",       role: "Growth-маркетинг",      dept: "marketing",  score: 91, c: "#34d399", g: ["#10b981", "#059669"], parent: "cmo" },
  { id: "mr",  ab: "MR", name: "Market Researcher",   role: "Рыночная разведка",     dept: "marketing",  score: 91, c: "#34d399", g: ["#10b981", "#059669"], parent: "cmo" },
  { id: "po",  ab: "PO", name: "Process Optimizer",   role: "Оптимизация процессов", dept: "operations", score: 90, c: "#fbbf24", g: ["#f59e0b", "#d97706"], parent: "coo" },
  { id: "hr",  ab: "HR", name: "HR Manager",          role: "Персонал и культура",   dept: "operations", score: 87, c: "#fbbf24", g: ["#f59e0b", "#d97706"], parent: "coo" },
  { id: "la",  ab: "LA", name: "Legal Advisor",       role: "Право и комплаенс",     dept: "operations", score: 88, c: "#fbbf24", g: ["#f59e0b", "#d97706"], parent: "coo" },
  { id: "ar",  ab: "AR", name: "AI Researcher",       role: "AI и инновации",        dept: "tech",       score: 93, c: "#c084fc", g: ["#a855f7", "#9333ea"], parent: "cto" },
  { id: "da",  ab: "DA", name: "Data Architect",      role: "Данные и аналитика",    dept: "tech",       score: 92, c: "#c084fc", g: ["#a855f7", "#9333ea"], parent: "cto" },
  { id: "pm",  ab: "PM", name: "Product Manager",     role: "Продуктовая стратегия", dept: "tech",       score: 93, c: "#c084fc", g: ["#a855f7", "#9333ea"], parent: "cto" },
];

const ALL = [CEO, ...CHIEFS, ...SPECIALISTS];

const FILTERS = [
  { id: "all",        l: "Все агенты" },
  { id: "leadership", l: "Руководство" },
  { id: "finance",    l: "Финансы" },
  { id: "marketing",  l: "Маркетинг" },
  { id: "operations", l: "Операции" },
  { id: "tech",       l: "Технологии" },
];

const ACTIVITY = [
  { c: "#34d399", t: "Market Researcher", s: "Анализирует тренды рынка",    time: "2м" },
  { c: "#60a5fa", t: "CFO Финансы",       s: "Обновляет финмодель",         time: "5м" },
  { c: "#c084fc", t: "AI Researcher",     s: "Тренирует новую модель",      time: "8м" },
  { c: "#fbbf24", t: "Sales Strategist",  s: "Оптимизирует воронку продаж", time: "12м" },
  { c: "#f472b6", t: "Product Manager",   s: "Ревью роадмапа",              time: "15м" },
];

const INSIGHTS = [
  { i: "✓", c: "#34d399", t: "Сильная производительность", s: "Все департаменты выполняют цели" },
  { i: "◈", c: "#818cf8", t: "Высокая коллаборация",        s: "Отличная синергия между командами" },
  { i: "✦", c: "#c084fc", t: "Лидер инноваций",             s: "3 новые инициативы запущены" },
  { i: "▲", c: "#fbbf24", t: "Рост эффективности",          s: "+12% улучшение за эту неделю" },
];

// ─── Layout ───────────────────────────────────────────────────────────────────
const W = 1320, H = 640;
const POS: Record<string, { x: number; y: number }> = { ceo: { x: W / 2, y: 70 } };
CHIEFS.forEach((n, i) => { POS[n.id] = { x: 200 + i * ((W - 400) / 3), y: 280 }; });
SPECIALISTS.forEach((n, i) => { POS[n.id] = { x: 90 + i * ((W - 180) / 11), y: 510 }; });

const CARD_W2 = 224, CARD_H2 = 74;
const CARD_W3 = 128, CARD_H3 = 118;

function useCountUp(to: number, dur = 1200) {
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

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
};

export default function ExecutiveBoardPage() {
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<string | null>("ceo");
  const [zoom, setZoom] = useState(1);
  const eff = useCountUp(94, 1400);
  const r = 44, circ = 2 * Math.PI * r;

  const dim = (n: Node) => filter !== "all" && n.dept !== filter && n.id !== "ceo";
  const selNode = ALL.find(n => n.id === sel) ?? null;

  const STATS = [
    { v: "20", l: "AI-агентов", s: "активны", c: "#818cf8" },
    { v: "86", l: "Средний балл", s: "+12 за неделю", c: "#60a5fa" },
    { v: "38", l: "Проектов", s: "в работе", c: "#34d399" },
  ];

  return (
    <div style={{ padding: "22px 24px 48px", maxWidth: 1560, margin: "0 auto" }}>
      <style>{`
        @keyframes exb-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes exb-dash { to { stroke-dashoffset: -16; } }
        .exb-canvas::-webkit-scrollbar{height:8px}
        .exb-canvas::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:4px}
      `}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            AI Executive Board <span style={{ color: "#818cf8", fontSize: 18 }}>✦</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>Ваша AI-команда лидеров работает в идеальной координации</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {STATS.map(s => (
            <div key={s.l} style={{ ...card, padding: "12px 18px", minWidth: 108 }}>
              <div className="term-value" style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginTop: 5 }}>{s.l}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{s.s}</div>
            </div>
          ))}
          <div style={{ padding: "12px 18px", borderRadius: 16, minWidth: 128, background: "linear-gradient(135deg, rgba(99,102,241,.25), rgba(79,70,229,.1))", border: "1px solid rgba(99,102,241,.4)" }}>
            <div className="term-value" style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>94%</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", marginTop: 5 }}>Эффективность</div>
            <div style={{ fontSize: 9, color: "#a5b4fc", marginTop: 1 }}>Отлично</div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: filter === f.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
            border: filter === f.id ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
            color: filter === f.id ? "#a5b4fc" : "rgba(255,255,255,0.45)", transition: "all .15s",
          }}>{f.l}</button>
        ))}
        <Link href="/dashboard/new" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 16px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }}>
          <Plus size={13} /> Новая стратегия
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px]" style={{ gap: 16 }}>
        {/* ── Tree canvas ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ ...card, overflow: "hidden", position: "relative" }}>
          <div className="exb-canvas" style={{ overflowX: "auto", overflowY: "hidden" }}>
            <div style={{ width: W, height: H, position: "relative", transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform .2s" }}>
              {/* edges */}
              <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {[...CHIEFS, ...SPECIALISTS].map(n => {
                  const p = POS[n.parent!], q = POS[n.id];
                  const pc = ALL.find(a => a.id === n.parent)!;
                  const y1 = p.y + (n.parent === "ceo" ? CARD_H2 / 2 + 6 : CARD_H2 / 2);
                  const y2 = q.y - (n.parent === "ceo" ? CARD_H2 / 2 : CARD_H3 / 2);
                  const my = (y1 + y2) / 2;
                  const active = sel === n.id || sel === n.parent;
                  const dimmed = dim(n);
                  return (
                    <path key={n.id}
                      d={`M${p.x},${y1} C${p.x},${my} ${q.x},${my} ${q.x},${y2}`}
                      fill="none"
                      stroke={dimmed ? "rgba(255,255,255,0.04)" : active ? pc.c : `${pc.c}44`}
                      strokeWidth={active ? 1.8 : 1.2}
                      strokeDasharray={active ? "6 5" : "none"}
                      style={active ? { animation: "exb-dash .8s linear infinite" } : { transition: "stroke .25s" }} />
                  );
                })}
              </svg>

              {/* CEO card */}
              {(() => {
                const p = POS.ceo; const active = sel === "ceo";
                return (
                  <button onClick={() => setSel("ceo")} style={{
                    position: "absolute", left: p.x - CARD_W2 / 2, top: p.y - CARD_H2 / 2 - 6, width: CARD_W2, height: CARD_H2 + 12,
                    borderRadius: 16, cursor: "pointer", textAlign: "left",
                    background: active ? "rgba(99,102,241,.12)" : "rgba(255,255,255,.03)",
                    border: active ? "1.5px solid #818cf8" : "1px solid rgba(99,102,241,.4)",
                    boxShadow: active ? "0 0 34px rgba(99,102,241,.35)" : "0 4px 20px rgba(0,0,0,.35)",
                    display: "flex", alignItems: "center", gap: 11, padding: "0 13px", transition: "all .2s", zIndex: 3,
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(99,102,241,.5)" }}>
                      <span className="term-mono" style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>CEO</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="term-mono" style={{ fontSize: 8, letterSpacing: ".1em", color: "#a5b4fc", marginBottom: 2 }}>CEO</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{CEO.name}</div>
                      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.4)" }}>{CEO.role}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div className="term-value" style={{ fontSize: 16, fontWeight: 800, color: "#a5b4fc" }}>{CEO.score}</div>
                      <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.3)" }}>Score</div>
                    </div>
                    <span className="term-blink" style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
                  </button>
                );
              })()}

              {/* Chief cards */}
              {CHIEFS.map(n => {
                const p = POS[n.id]; const active = sel === n.id; const dimmed = dim(n);
                return (
                  <button key={n.id} onClick={() => setSel(n.id)} style={{
                    position: "absolute", left: p.x - CARD_W2 / 2, top: p.y - CARD_H2 / 2, width: CARD_W2, height: CARD_H2,
                    borderRadius: 14, cursor: "pointer", textAlign: "left",
                    opacity: dimmed ? 0.25 : 1,
                    background: active ? `${n.c}18` : "rgba(255,255,255,.03)",
                    border: active ? `1.5px solid ${n.c}` : `1px solid ${n.c}50`,
                    boxShadow: active ? `0 0 28px ${n.c}40` : "0 3px 14px rgba(0,0,0,.3)",
                    display: "flex", alignItems: "center", gap: 10, padding: "0 12px", transition: "all .2s", zIndex: 2,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: `linear-gradient(135deg,${n.g[0]},${n.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 5px 14px ${n.g[0]}55` }}>
                      <span className="term-mono" style={{ fontSize: 10.5, fontWeight: 800, color: "#fff" }}>{n.ab}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="term-mono" style={{ fontSize: 7.5, letterSpacing: ".1em", color: n.c, marginBottom: 2 }}>{n.ab}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.name}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.role}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div className="term-value" style={{ fontSize: 15, fontWeight: 800, color: n.c }}>{n.score}</div>
                      <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.3)" }}>Score</div>
                    </div>
                    <span style={{ position: "absolute", top: 7, right: 7, width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "exb-pulse 2s infinite" }} />
                  </button>
                );
              })}

              {/* Specialist cards */}
              {SPECIALISTS.map(n => {
                const p = POS[n.id]; const active = sel === n.id; const dimmed = dim(n);
                return (
                  <button key={n.id} onClick={() => setSel(n.id)} style={{
                    position: "absolute", left: p.x - CARD_W3 / 2, top: p.y - CARD_H3 / 2, width: CARD_W3, height: CARD_H3,
                    borderRadius: 13, cursor: "pointer",
                    opacity: dimmed ? 0.22 : 1,
                    background: active ? `${n.c}15` : "rgba(255,255,255,.025)",
                    border: active ? `1.5px solid ${n.c}` : "1px solid rgba(255,255,255,.09)",
                    boxShadow: active ? `0 0 22px ${n.c}40` : "0 2px 10px rgba(0,0,0,.3)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px",
                    transition: "all .2s", zIndex: 2,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${n.g[0]},${n.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${n.g[0]}50` }}>
                      <span className="term-mono" style={{ fontSize: 9.5, fontWeight: 800, color: "#fff" }}>{n.ab}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.25 }}>{n.name}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.38)", textAlign: "center", lineHeight: 1.3 }}>{n.role}</div>
                    <div className="term-value" style={{ fontSize: 12, fontWeight: 800, color: n.c }}>{n.score}<span style={{ fontSize: 7, color: "rgba(255,255,255,.3)", fontWeight: 500 }}> Score</span></div>
                    <span style={{ position: "absolute", top: 6, right: 6, width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, padding: 6, borderRadius: 12, background: "rgba(10,11,18,.85)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(12px)" }}>
            <button onClick={() => setZoom(z => Math.min(1.4, z + 0.1))} aria-label="Приблизить" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomIn size={14} /></button>
            <button onClick={() => setZoom(z => Math.max(0.55, z - 0.1))} aria-label="Отдалить" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomOut size={14} /></button>
            <button onClick={() => setZoom(1)} aria-label="Сбросить масштаб" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Maximize2 size={13} /></button>
          </div>
        </motion.div>

        {/* ── Right rail ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Performance */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Эффективность команды</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
                <svg width={104} height={104} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
                  <motion.circle cx={52} cy={52} r={r} fill="none" stroke="#818cf8" strokeWidth={7} strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${0.94 * circ} ${circ}` }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="term-value" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{eff}%</span>
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,.35)", letterSpacing: ".06em" }}>ОБЩАЯ</span>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Стратегия", 96, "#818cf8"], ["Исполнение", 92, "#34d399"], ["Коллаборация", 95, "#60a5fa"], ["Инновации", 93, "#c084fc"]].map(([l, v, c]) => (
                  <div key={l as string}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>{l}</span>
                      <span className="term-value" style={{ fontSize: 10, fontWeight: 700, color: c as string }}>{v}%</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1, delay: 0.4 }} style={{ height: "100%", borderRadius: 2, background: c as string }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Selected agent / Activity */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Активность агентов</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.c, marginTop: 4, flexShrink: 0, boxShadow: `0 0 6px ${a.c}80` }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{a.t}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,.38)" }}>{a.s}</span>
                  </span>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,.25)" }}>{a.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Insights */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Инсайты команды</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {INSIGHTS.map(x => (
                <div key={x.t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, background: `${x.c}15`, border: `1px solid ${x.c}40`, color: x.c }}>{x.i}</span>
                  <span>
                    <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{x.t}</span>
                    <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,.38)", marginTop: 1 }}>{x.s}</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Recommendation + selected chat */}
          <AnimatePresence mode="wait">
            <motion.div key={sel ?? "none"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ borderRadius: 16, padding: 16, background: "linear-gradient(135deg, rgba(99,102,241,.14), rgba(79,70,229,.05))", border: "1px solid rgba(99,102,241,.3)" }}>
              <div className="term-mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#a5b4fc", marginBottom: 8 }}>// AI РЕКОМЕНДАЦИЯ</div>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", lineHeight: 1.55, margin: "0 0 12px" }}>
                {selNode ? `${selNode.name}: рассмотрите усиление направления «${selNode.role.toLowerCase()}» — текущий тренд позитивный.` : "Выберите агента на схеме, чтобы получить рекомендацию."}
              </p>
              {selNode && (
                <Link href={`/chat?agent=${encodeURIComponent(selNode.name)}`} className="term-mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textDecoration: "none", textTransform: "uppercase" }}>
                  ▸ Обсудить с {selNode.ab}
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
