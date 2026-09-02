"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const RGB = "124,58,237";

// ─── Org data: hub (CEO) + two orbit rings ────────────────────────────────────
type Agent = {
  id: string; abbr: string; role: string; color: string;
  ring: 1 | 2;
  input: string;      // что получает
  analyzes: string;   // что анализирует
  output: string;     // что отдаёт и кому
};

const CEO = {
  id: "ceo", abbr: "CEO", role: "Chief Executive Officer", color: "#818cf8",
  input: "Findings of all 19 agents, including conflicting positions",
  analyzes: "Cross-department conflicts, priorities, risk vs. upside",
  output: "One strategy with a decision, conditions and a 90-day plan — for you",
};

const AGENTS: Agent[] = [
  // ── inner ring: C-suite ──
  { id: "cfo",  abbr: "CFO",  role: "Chief Financial Officer",    color: "#3b82f6", ring: 1, input: "Prices, costs, market data from the Analyst", analyzes: "Unit economics, LTV/CAC, break-even point, burn", output: "Financial model and budget limits → CEO" },
  { id: "cmo",  abbr: "CMO",  role: "Chief Marketing Officer", color: "#10b981", ring: 1, input: "Segments and competitors from the Analyst, limits from CFO", analyzes: "Acquisition channels, positioning, CAC per channel", output: "GTM strategy and CAC plan → CEO" },
  { id: "coo",  abbr: "COO",  role: "Chief Operating Officer",  color: "#f59e0b", ring: 1, input: "CEO strategy, CFO constraints", analyzes: "Processes, hiring, operational bottlenecks", output: "30/90-day launch roadmap → CEO, HR" },
  { id: "cto",  abbr: "CTO",  role: "Chief Technology Officer",   color: "#d946ef", ring: 1, input: "Product requirements from CPO", analyzes: "Stack, architecture, timeline and build cost", output: "Tech plan and MVP estimate → CEO, VP Eng" },
  { id: "cpo",  abbr: "CPO",  role: "Chief Product Officer",   color: "#a78bfa", ring: 1, input: "User pains from UX, market data", analyzes: "Feature priorities, product-market fit, retention", output: "Product roadmap → CTO, CEO" },
  { id: "ba",   abbr: "BA",   role: "Business Analyst",        color: "#f97316", ring: 1, input: "Your idea and market description", analyzes: "TAM/SAM/SOM, competitors, trends, niches", output: "Market data → CFO, CMO, CEO" },
  { id: "law",  abbr: "LAW",  role: "Legal Advisor",   color: "#94a3b8", ring: 1, input: "Business model and operating geography", analyzes: "Structure, IP, regulatory requirements", output: "Legal risks and requirements → CEO, CISO" },
  // ── outer ring ──
  { id: "sale", abbr: "SD",   role: "Sales Director",   color: "#34d399", ring: 2, input: "Funnel and segments from CMO", analyzes: "Deal cycle, pricing, scripts", output: "Sales plan → CEO" },
  { id: "grw",  abbr: "GRW",  role: "Growth Hacker",           color: "#fb923c", ring: 2, input: "Funnel from CMO, product metrics", analyzes: "Growth levers, viral loops, A/B hypotheses", output: "Growth experiments → CMO" },
  { id: "ciso", abbr: "SEC",  role: "Chief Security Officer", color: "#ef4444", ring: 2, input: "Architecture from CTO, legal requirements", analyzes: "Threats, data protection, compliance", output: "Security requirements → CTO" },
  { id: "hr",   abbr: "HR",   role: "HR Director",  color: "#f472b6", ring: 2, input: "Hiring plan from COO", analyzes: "Roles, compensation, culture", output: "Org structure and hiring plan → COO" },
  { id: "cdo",  abbr: "CDO",  role: "Chief Data Officer",     color: "#06b6d4", ring: 2, input: "Product and funnel metrics", analyzes: "North Star, analytics, ML opportunities", output: "Data strategy → CPO, CEO" },
  { id: "vpe",  abbr: "VPE",  role: "VP of Engineering",           color: "#84cc16", ring: 2, input: "Tech plan from CTO", analyzes: "Team, dev processes, timelines", output: "Sprint plan → CTO" },
  { id: "ir",   abbr: "IR",   role: "Investor Relations",     color: "#a855f7", ring: 2, input: "Financial model from CFO, CEO strategy", analyzes: "Investment appeal, multiples", output: "Pitch structure → CEO" },
  { id: "brd",  abbr: "BRD",  role: "Brand Strategist",          color: "#e879f9", ring: 2, input: "Positioning from CMO", analyzes: "Identity, tone of voice, differentiation", output: "Brand platform → CMO" },
  { id: "cs",   abbr: "CS",   role: "Customer Success",       color: "#4ade80", ring: 2, input: "Product and segments", analyzes: "Onboarding, churn triggers, NPS", output: "Retention plan → CPO, CMO" },
  { id: "ds",   abbr: "DS",   role: "Data Scientist",         color: "#22d3ee", ring: 2, input: "Raw data and metrics from CDO", analyzes: "Forecasts, segmentation, LTV models", output: "Models and forecasts → CDO, CFO" },
  { id: "inv",  abbr: "INV",  role: "Investment Analyst",        color: "#fde68a", ring: 2, input: "Financial model, comparable deals", analyzes: "ROI, valuation, exit scenarios", output: "Investment assessment → IR, CEO" },
  { id: "str",  abbr: "STR",  role: "Strategy Consultant",    color: "#c4b5fd", ring: 2, input: "The full market and product picture", analyzes: "Moat, blue ocean, growth horizons", output: "Long-term strategy → CEO" },
];

// ─── Layout math ──────────────────────────────────────────────────────────────
const W = 860, H = 600, CX = W / 2, CY = H / 2 - 10;
const R1 = 140, R2 = 240;

function pos(a: Agent, idx: number, ringItems: Agent[]) {
  const n = ringItems.length;
  const start = a.ring === 1 ? -90 : -90 + 180 / n; // offset outer ring
  const angle = ((start + (360 / n) * idx) * Math.PI) / 180;
  const r = a.ring === 1 ? R1 : R2;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

const ring1 = AGENTS.filter(a => a.ring === 1);
const ring2 = AGENTS.filter(a => a.ring === 2);
const POS: Record<string, { x: number; y: number }> = {};
ring1.forEach((a, i) => { POS[a.id] = pos(a, i, ring1); });
ring2.forEach((a, i) => { POS[a.id] = pos(a, i, ring2); });
POS["ceo"] = { x: CX, y: CY };

// ── Data-flow edges: agent → agent, and only the last hop reaches the CEO ──
const EDGES: [string, string][] = [
  // спецы внешнего кольца → профильные топы
  ["grw", "cmo"], ["brd", "cmo"], ["cs", "cmo"],
  ["sale", "cmo"],
  ["ds", "cdo"], ["cdo", "cpo"],
  ["ciso", "cto"], ["vpe", "cto"],
  ["hr", "coo"],
  ["inv", "ir"],
  ["ds", "cfo"],
  // аналитик питает финансы и маркетинг
  ["ba", "cfo"], ["ba", "cmo"],
  // продукт → технологии
  ["cpo", "cto"], ["cs", "cpo"],
  ["law", "ciso"],
  // финальный хоп — только топы заносят результат CEO
  ["cfo", "ceo"], ["cmo", "ceo"], ["coo", "ceo"], ["cto", "ceo"],
  ["cpo", "ceo"], ["law", "ceo"], ["ir", "ceo"], ["str", "ceo"], ["ba", "ceo"],
];

const outOf = (id: string) => EDGES.filter(([f]) => f === id);

// ─── Section ──────────────────────────────────────────────────────────────────
export function ExecutivesSection() {
  const [sel, setSel] = useState<string>("cfo");
  const selected = sel === "ceo" ? { ...CEO } : AGENTS.find(a => a.id === sel)!;

  return (
    <section id="executives" style={{ position: "relative", padding: "96px 24px 100px", overflow: "hidden" }}>
      <style>{`
        @keyframes org-dash { to { stroke-dashoffset: -14; } }
        @keyframes org-pulse { 0%,100%{opacity:0.55} 50%{opacity:1} }
      `}</style>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 70% 55% at 50% 45%, rgba(${RGB},0.05), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 36 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 22, border: `1px solid rgba(${RGB},0.25)`, background: `rgba(${RGB},0.05)` }}>
            <span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#7C3AED" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(165,180,252,0.9)" }}>// орг-структура · 20 агентов</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Not a list. An organization
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
            Click any agent to see what they receive, what they analyze and who they hand results to.
          </p>
        </motion.div>

        {/* ── Org canvas + dossier panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
          style={{ gap: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(9,10,16,0.75)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}
        >
          {/* Canvas */}
          <div style={{ overflowX: "auto", overflowY: "hidden" }}>
            <div style={{ width: W, height: H, position: "relative", margin: "0 auto" }}>
              {/* orbit guides + agent-to-agent data-flow edges */}
              <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <circle cx={CX} cy={CY} r={R1} fill="none" stroke="rgba(255,255,255,0.045)" strokeDasharray="2 6" />
                <circle cx={CX} cy={CY} r={R2} fill="none" stroke="rgba(255,255,255,0.035)" strokeDasharray="2 6" />

                {/* base mesh — every real data route, faint */}
                {EDGES.map(([f, t]) => {
                  const a = POS[f], b = POS[t];
                  return <line key={`${f}-${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={`rgba(${RGB},0.08)`} strokeWidth={1} />;
                })}

                {/* active chain: selected agent → its targets → CEO (last hop) */}
                {sel !== "ceo" && (() => {
                  const selAgent = AGENTS.find(a => a.id === sel)!;
                  const hop1 = outOf(sel);
                  const hop2: [string, string][] = hop1
                    .filter(([, t]) => t !== "ceo")
                    .map(([, t]) => [t, "ceo"] as [string, string]);
                  const draw = (edges: [string, string][], color: string, dur: string, delay = 0) =>
                    edges.map(([f, t], i) => {
                      const a = POS[f], b = POS[t];
                      return (
                        <g key={`hl-${f}-${t}`}>
                          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                            stroke={color} strokeWidth={1.6} strokeDasharray="5 5"
                            style={{ animation: "org-dash 0.7s linear infinite" }} />
                          <circle r="3" fill={color}>
                            <animateMotion dur={dur} begin={`${delay + i * 0.15}s`} repeatCount="indefinite"
                              path={`M${a.x},${a.y} L${b.x},${b.y}`} />
                          </circle>
                        </g>
                      );
                    });
                  return (
                    <>
                      {draw(hop1, selAgent.color, "1.2s")}
                      {draw(hop2, "#818cf8", "1.2s", 0.6)}
                    </>
                  );
                })()}

                {/* CEO selected: all last-hop routes light up inbound */}
                {sel === "ceo" && EDGES.filter(([, t]) => t === "ceo").map(([f], i) => {
                  const a = POS[f];
                  return (
                    <g key={`ceo-${f}`}>
                      <line x1={a.x} y1={a.y} x2={CX} y2={CY} stroke={`rgba(${RGB},0.5)`} strokeWidth={1.4}
                        strokeDasharray="5 5" style={{ animation: "org-dash 0.7s linear infinite" }} />
                      <circle r="2.6" fill="#818cf8">
                        <animateMotion dur="1.6s" begin={`${i * 0.12}s`} repeatCount="indefinite"
                          path={`M${a.x},${a.y} L${CX},${CY}`} />
                      </circle>
                    </g>
                  );
                })}
              </svg>

              {/* CEO hub */}
              <button onClick={() => setSel("ceo")} aria-label="CEO"
                style={{
                  position: "absolute", left: CX - 42, top: CY - 42, width: 84, height: 84,
                  borderRadius: 24, cursor: "pointer",
                  background: sel === "ceo" ? "linear-gradient(135deg,#7C3AED,#6D28D9)" : "rgba(124,58,237,0.14)",
                  border: `1.5px solid rgba(${RGB},${sel === "ceo" ? 0.9 : 0.45})`,
                  boxShadow: sel === "ceo" ? `0 0 40px rgba(${RGB},0.45)` : `0 0 24px rgba(${RGB},0.18)`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  transition: "all 0.25s", zIndex: 5, animation: "org-pulse 3.5s ease-in-out infinite",
                }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="term-mono" style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>CEO</span>
              </button>

              {/* Agents */}
              {AGENTS.map(a => {
                const p = POS[a.id];
                const active = sel === a.id;
                const size = a.ring === 1 ? 52 : 44;
                return (
                  <button key={a.id} onClick={() => setSel(a.id)} aria-label={a.role} title={a.role}
                    style={{
                      position: "absolute", left: p.x - size / 2, top: p.y - size / 2,
                      width: size, height: size, borderRadius: a.ring === 1 ? 15 : 13, cursor: "pointer",
                      background: active ? `${a.color}26` : "rgba(255,255,255,0.035)",
                      border: `1.5px solid ${active ? a.color : `${a.color}55`}`,
                      boxShadow: active ? `0 0 24px ${a.color}55` : "0 2px 10px rgba(0,0,0,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.22s", zIndex: 4,
                      transform: active ? "scale(1.12)" : "scale(1)",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.transform = "scale(1.08)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.transform = "scale(1)"; }}>
                    <span className="term-mono" style={{ fontSize: a.ring === 1 ? 11 : 9.5, fontWeight: 800, color: active ? a.color : "rgba(255,255,255,0.75)", letterSpacing: "0.04em" }}>
                      {a.abbr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Dossier panel ── */}
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", display: "flex", flexDirection: "column" }}>
            <div className="term-mono" style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              // досье агента
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={sel}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ padding: "20px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${selected.color}1c`, border: `1.5px solid ${selected.color}66` }}>
                    <span className="term-mono" style={{ fontSize: 12, fontWeight: 800, color: selected.color }}>{"abbr" in selected ? (selected as Agent).abbr : "CEO"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{selected.role}</div>
                    <div className="term-mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "#34d399", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <span className="term-blink" style={{ width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} />ONLINE
                    </div>
                  </div>
                </div>

                {[
                  { k: "RECEIVES", v: selected.input, icon: "↓" },
                  { k: "ANALYZES", v: selected.analyzes, icon: "◈" },
                  { k: "HANDS OFF", v: selected.output, icon: "↗" },
                ].map(row => (
                  <div key={row.k}>
                    <div className="term-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: `${selected.color}cc`, marginBottom: 6 }}>
                      {row.icon} {row.k}
                    </div>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.6, margin: 0, paddingLeft: 12, borderLeft: `2px solid ${selected.color}40` }}>
                      {row.v}
                    </p>
                  </div>
                ))}

                <div style={{ marginTop: "auto" }}>
                  <Link href={`/chat?agent=${encodeURIComponent(selected.role)}`} className="term-mono"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      height: 42, borderRadius: 11, textDecoration: "none",
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      background: `linear-gradient(135deg, #7C3AED, #6D28D9)`, color: "#fff",
                      boxShadow: `0 5px 18px rgba(${RGB},0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}>
                    ▸ Talk to this agent
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
