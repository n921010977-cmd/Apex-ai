"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat } from "@/lib/stream-chat";
import {
  getBoardAgents, getBoardMetrics, BOARD_DEBATE, BOARD_TIMELINE, BOARD_RECS,
  type BoardAgent, type BoardMetrics,
} from "@/lib/board";

// ─── Fallback offline deep-dive / verdict text ───────────────────────────────
const OFFLINE_DEEP = (a: BoardAgent) =>
  `${a.name} (${a.role}): по задаче «${a.task}» ключевой вывод — двигаться поэтапно и проверять гипотезу дешёвым тестом до крупных вложений. Точные цифры и полный разбор появятся после настройки API-ключа (ANTHROPIC_API_KEY).`;
const OFFLINE_VERDICT =
  "Совет провёл разбор: гипотеза достойна проверки, но входим поэтапно — сначала дешёвый тест спроса, затем MVP, затем масштабирование по фактическим метрикам. Полный живой анализ доступен после подключения API-ключа.";

const KIND_META = {
  recommendation: { l: "РЕКОМЕНДАЦИЯ", c: "#818cf8" },
  alert:          { l: "ALERT",        c: "#f59e0b" },
  action:         { l: "ДЕЙСТВИЕ",     c: "#34d399" },
} as const;
const TL_META = {
  milestone: { l: "Milestones", c: "#34d399" },
  risk:      { l: "Risks",      c: "#f43f5e" },
  decision:  { l: "Decisions",  c: "#818cf8" },
} as const;

// 6 anchor positions for agent cards around the core (xl screens)
const ANCHORS = [
  { top: "1%",  left: "36%" },  // CEO — top center
  { top: "4%",  left: "63%" },  // CFO — top right
  { top: "42%", left: "0%"  },  // RESEARCH — mid left
  { top: "42%", left: "63%" },  // MARKETING — mid right
  { top: "74%", left: "18%" },  // LEGAL — bottom left
  { top: "74%", left: "55%" },  // TECH — bottom right
];

export default function BoardCorePage() {
  const [agents, setAgents]   = useState<BoardAgent[]>(() => getBoardAgents());
  const [metrics, setMetrics] = useState<BoardMetrics>(() => getBoardMetrics());
  const [debate, setDebate]   = useState(() => BOARD_DEBATE.map(d => ({ ...d, state: "" as "" | "accepted" | "rejected" })));
  const [status, setStatus]   = useState("ACTIVE // OPTIMIZING");
  const reduced = useRef(false);

  // Deep dive overlay
  const [dive, setDive] = useState<{ agent: BoardAgent; text: string; busy: boolean; offline: boolean } | null>(null);
  // Command line
  const [cmd, setCmd] = useState("");
  const [cmdOut, setCmdOut] = useState<{ text: string; busy: boolean; offline: boolean } | null>(null);

  useEffect(() => {
    reduced.current = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Live state from backend (demo-safe) + periodic refresh
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/board/state").then(r => r.json()).then(d => {
        if (!alive || !d.success) return;
        setAgents(d.data.agents); setMetrics(d.data.metrics); setStatus(d.data.status);
      }).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const runDeepDive = useCallback(async (a: BoardAgent) => {
    setDive({ agent: a, text: "", busy: true, offline: false });
    const persona = `Ты — ${a.name}, ${a.role} в совете директоров Apex AI. Твоя текущая задача: «${a.task}». Дай глубокий разбор по своей зоне ответственности на русском: 5–8 предложений, конкретика и цифры, обычный текст без markdown (никаких ** и #). Заверши 2–3 практическими шагами.`;
    try {
      await streamChat(a.task, persona, t => setDive(d => d ? { ...d, text: d.text + t } : d));
      setDive(d => d ? { ...d, busy: false } : d);
    } catch {
      const fb = OFFLINE_DEEP(a);
      for (const ch of fb) { setDive(d => d ? { ...d, text: d.text + ch, offline: true } : d); await new Promise(r => setTimeout(r, 7)); }
      setDive(d => d ? { ...d, busy: false } : d);
    }
  }, []);

  const runCommand = useCallback(async () => {
    const q = cmd.trim();
    if (!q || cmdOut?.busy) return;
    setCmd("");
    setCmdOut({ text: "", busy: true, offline: false });
    const persona = `Ты — Sophia Rivers, CEO совета директоров Apex AI. Основатель отдал команду совету: «${q}». Синтезируй ответ от лица совета на русском: что делаем, кто из директоров задействован, 2–3 конкретных шага. Максимум 6 предложений, обычный текст без markdown.`;
    try {
      await streamChat(q, persona, t => setCmdOut(o => o ? { ...o, text: o.text + t } : o));
      setCmdOut(o => o ? { ...o, busy: false } : o);
    } catch {
      for (const ch of OFFLINE_VERDICT) { setCmdOut(o => o ? { ...o, text: o.text + ch, offline: true } : o); await new Promise(r => setTimeout(r, 7)); }
      setCmdOut(o => o ? { ...o, busy: false } : o);
    }
  }, [cmd, cmdOut]);

  const paused = reduced.current;

  return (
    <div style={{ minHeight: "100vh", background: "#05060A", padding: "20px 20px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{"// АПЕКС АЙ: СОВЕТ ДИРЕКТОРОВ · РАСШИРЕННЫЙ ФУНКЦИОНАЛ"}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#E5E7EB", letterSpacing: "-0.02em", margin: 0 }}>
          AI BOARD CORE <span className="term-blink" style={{ color: "#6366f1" }}>▋</span>
        </h1>
      </div>

      <div className="bc-grid">
        {/* ── LEFT RAIL ── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Panel label="BUSINESS HEALTH & SUSTAINABILITY">
            <HealthRing value={metrics.healthIndex} />
          </Panel>
          <Panel label="REVENUE PREDICTION">
            <div style={{ fontSize: 30, fontWeight: 800, color: "#34d399", letterSpacing: "-0.02em" }}>+{metrics.revenuePrediction}%</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>вероятность роста MoM</div>
            <AreaSpark data={metrics.marketPosition} color="#34d399" />
          </Panel>
          <Panel label="MARKET POSITION">
            <BarsSpark data={metrics.marketPosition} />
          </Panel>
          <Panel label="RISK LEVEL">
            <RiskRadar data={metrics.riskRadar} />
          </Panel>
          <Panel label="SCENARIO">
            {metrics.scenarios.map(s => (
              <div key={s.l} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>
                  <span>{s.l}</span><span className="term-value">{Math.round(s.v * 100)}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.v * 100}%` }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: "100%", background: s.l === "Худший" ? "#f43f5e" : s.l === "Базовый" ? "#f59e0b" : "#34d399" }} />
                </div>
              </div>
            ))}
          </Panel>
          <Panel label="АВТО-РЕКОМЕНДАЦИИ ИИ">
            {BOARD_RECS.map(r => (
              <div key={r} style={{ display: "flex", gap: 7, fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6, lineHeight: 1.4 }}>
                <span style={{ color: "#818cf8", flexShrink: 0 }}>▸</span>{r}
              </div>
            ))}
          </Panel>
        </aside>

        {/* ── CENTER STAGE ── */}
        <section className="bc-stage">
          {/* connecting lines */}
          <svg className="bc-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {ANCHORS.map((_, i) => {
              const pts = [[48,14],[84,18],[11,54],[85,54],[27,84],[69,84]][i];
              return <line key={i} x1="50" y1="50" x2={pts[0]} y2={pts[1]} stroke="rgba(99,102,241,0.22)" strokeWidth="0.3" strokeDasharray="1 1" />;
            })}
          </svg>

          {/* APEX CORE */}
          <div className="bc-core">
            <div className="bc-core-glow" style={paused ? undefined : { animation: "bc-breathe 3.4s ease-in-out infinite" }} />
            <div className="bc-core-ring" style={paused ? undefined : { animation: "bc-spin 16s linear infinite" }} />
            <div className="bc-core-inner">
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <CoreStat l="RES" v={`${metrics.resourceUtilization}%`} />
                <CoreStat l="LAT" v={`${metrics.decisionLatency}ms`} />
                <CoreStat l="COLLAB" v={`${metrics.collaborationIndex}%`} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.02em", fontFamily: "var(--font-geist-mono), monospace" }}>APEX CORE</div>
              <div className="term-mono" style={{ fontSize: 9.5, color: "#34d399", marginTop: 4, letterSpacing: "0.08em" }}>
                SYSTEM INTELLIGENCE: <span style={{ color: "#a5b4fc" }}>{status}</span>
              </div>
            </div>
          </div>

          {/* agent cards */}
          {agents.slice(0, 6).map((a, i) => (
            <div key={a.slug} className="bc-agent" style={{ top: ANCHORS[i].top, left: ANCHORS[i].left }}>
              <AgentCard a={a} onDive={() => runDeepDive(a)} paused={paused} />
            </div>
          ))}
        </section>

        {/* ── RIGHT RAIL ── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Panel label="ИНТЕРАКТИВНОЕ ОБСУЖДЕНИЕ СОВЕТА ИИ">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {debate.map((d, i) => {
                const km = KIND_META[d.kind];
                return (
                  <div key={i} style={{ borderRadius: 12, border: `1px solid ${km.c}33`, background: "rgba(255,255,255,0.02)", padding: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span className="term-mono" style={{ fontSize: 10, fontWeight: 800, color: km.c }}>{d.role}</span>
                      <span className="term-mono" style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>{km.l}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, marginBottom: 8 }}>{d.text}</div>
                    {d.state ? (
                      <div className="term-mono" style={{ fontSize: 10, color: d.state === "accepted" ? "#34d399" : "#f43f5e" }}>
                        {d.state === "accepted" ? "✓ ПРИНЯТО К РЕАЛИЗАЦИИ" : "✕ ОТКЛОНЕНО · НА ПЕРЕСМОТР"}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setDebate(p => p.map((x, j) => j === i ? { ...x, state: "accepted" } : x))}
                          className="term-mono" style={{ flex: 1, padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 9.5, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#10b981,#059669)" }}>
                          ПРИНЯТЬ
                        </button>
                        <button onClick={() => setDebate(p => p.map((x, j) => j === i ? { ...x, state: "rejected" } : x))}
                          className="term-mono" style={{ flex: 1, padding: "6px", borderRadius: 8, cursor: "pointer", fontSize: 9.5, fontWeight: 700, color: "#fca5a5", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}>
                          ОТКЛОНИТЬ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel label="ЦЕНТР УПРАВЛЕНИЯ МИССИЯМИ">
            {["Запрос по конкуренту Y", "Симуляция стратегии Z", "Финмодель Германии"].map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{p}</span>
                <span className="term-mono" style={{ fontSize: 9, color: "#34d399", display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />Active
                </span>
              </div>
            ))}
          </Panel>

          <Panel label="КОМАНДНАЯ СТРОКА АПЕКС АЙ">
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {["Запрос по конкуренту Y", "Симуляция стратегии Z"].map(q => (
                <button key={q} onClick={() => setCmd(q)} className="term-mono"
                  style={{ flex: 1, padding: "6px 8px", borderRadius: 8, cursor: "pointer", fontSize: 9, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.3 }}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="term-mono" style={{ color: "#818cf8", fontSize: 13, alignSelf: "center" }}>{">"}</span>
              <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void runCommand(); }}
                disabled={cmdOut?.busy} placeholder="Команда совету…"
                style={{ flex: 1, minWidth: 0, height: 34, padding: "0 10px", borderRadius: 9, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", outline: "none", color: "#E5E7EB", fontSize: 12 }} />
              <button onClick={() => void runCommand()} disabled={cmdOut?.busy || !cmd.trim()} className="term-mono"
                style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", fontSize: 10, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#6366f1,#4f46e5)", cursor: cmdOut?.busy ? "wait" : "pointer", opacity: cmdOut?.busy || !cmd.trim() ? 0.55 : 1 }}>
                {cmdOut?.busy ? "…" : "▸"}
              </button>
            </div>
            {cmdOut && (
              <div style={{ marginTop: 10, borderRadius: 9, background: "rgba(5,6,10,0.6)", border: "1px solid rgba(255,255,255,0.07)", padding: "10px 12px" }}>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>
                  {cmdOut.text}{cmdOut.busy && <span className="term-blink" style={{ color: "#818cf8" }}>▋</span>}
                </p>
                {cmdOut.offline && !cmdOut.busy && (
                  <div className="term-mono" style={{ fontSize: 9, color: "rgba(251,191,36,0.8)", marginTop: 6 }}>⚠ OFFLINE — настройте API-ключ</div>
                )}
              </div>
            )}
          </Panel>
        </aside>
      </div>

      {/* ── TIMELINE ── */}
      <div style={{ marginTop: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <div>
            <div className="term-label" style={{ color: "rgba(255,255,255,0.4)" }}>{"// ДЕТАЛИЗИРОВАННАЯ ХРОНОЛОГИЯ МИССИЙ"}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Клик по событию подсвечивает связанные знания</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {Object.values(TL_META).map(m => (
              <span key={m.l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.c }} />{m.l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${BOARD_TIMELINE.length}, 1fr)`, gap: 8 }}>
          <div style={{ position: "absolute", top: 6, left: "8%", right: "8%", height: 1, background: "rgba(255,255,255,0.1)" }} />
          {BOARD_TIMELINE.map((e, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
              <span style={{ width: 13, height: 13, borderRadius: "50%", background: TL_META[e.kind].c, boxShadow: `0 0 10px ${TL_META[e.kind].c}80`, marginBottom: 8 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>{e.label}</span>
              <span className="term-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{e.t}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── DEEP DIVE OVERLAY ── */}
      <AnimatePresence>
        {dive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDive(null)}
            style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,6,10,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "min(640px, 100%)", maxHeight: "80vh", overflowY: "auto", borderRadius: 18, border: `1px solid ${dive.agent.c}44`, background: "#0B0D16", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${dive.agent.g[0]},${dive.agent.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>{dive.agent.ab}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#E5E7EB" }}>{dive.agent.name} · {dive.agent.role}</div>
                  <div className="term-mono" style={{ fontSize: 11, color: dive.agent.c }}>DEEP DIVE · {dive.agent.task}</div>
                </div>
                <button onClick={() => setDive(null)} className="term-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "5px 10px", fontSize: 11 }}>ESC ✕</button>
              </div>
              <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
                {dive.text || (dive.busy ? "" : "")}{dive.busy && <span className="term-blink" style={{ color: dive.agent.c }}>▋</span>}
              </p>
              {dive.offline && !dive.busy && (
                <div className="term-mono" style={{ fontSize: 10, color: "rgba(251,191,36,0.8)", marginTop: 12 }}>⚠ OFFLINE-РЕЖИМ: показан демо-разбор, настройте ANTHROPIC_API_KEY</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .bc-grid { display: grid; grid-template-columns: 240px minmax(0,1fr) 320px; gap: 14px; align-items: start; }
        .bc-stage { position: relative; min-height: 620px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
          background: radial-gradient(ellipse at 50% 46%, rgba(99,102,241,0.09), transparent 60%), rgba(255,255,255,0.012); overflow: hidden; }
        .bc-lines { position: absolute; inset: 0; width: 100%; height: 100%; }
        .bc-core { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 300px; height: 300px;
          display: flex; align-items: center; justify-content: center; }
        .bc-core-glow { position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle, rgba(129,140,248,0.35), rgba(99,102,241,0.12) 45%, transparent 70%); }
        .bc-core-ring { position: absolute; inset: 40px; border-radius: 50%; border: 1px dashed rgba(99,102,241,0.35); }
        .bc-core-inner { position: relative; width: 190px; height: 190px; border-radius: 50%; background: rgba(11,13,22,0.9);
          border: 1px solid rgba(129,140,248,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; box-shadow: inset 0 0 40px rgba(99,102,241,0.2); }
        .bc-agent { position: absolute; width: 216px; z-index: 2; }
        @keyframes bc-breathe { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes bc-spin { to { transform: rotate(360deg); } }
        @keyframes ait-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @media (max-width: 1280px) {
          .bc-grid { grid-template-columns: 1fr; }
          .bc-stage { min-height: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .bc-lines { display: none; }
          .bc-core { position: relative; top: auto; left: auto; transform: none; }
          .bc-agent { position: relative; top: auto !important; left: auto !important; width: 100%; max-width: 340px; }
        }
        @media (prefers-reduced-motion: reduce) { .bc-core-glow, .bc-core-ring { animation: none !important; } }
      `}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: 14 }}>
      <div className="term-label" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 10, fontSize: 9.5, letterSpacing: "0.12em" }}>{"// " + label}</div>
      {children}
    </div>
  );
}

function CoreStat({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ padding: "4px 7px", borderRadius: 7, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
      <div className="term-mono" style={{ fontSize: 7, color: "rgba(255,255,255,0.45)" }}>{l}</div>
      <div className="term-mono" style={{ fontSize: 10, fontWeight: 800, color: "#a5b4fc" }}>{v}</div>
    </div>
  );
}

function AgentCard({ a, onDive, paused }: { a: BoardAgent; onDive: () => void; paused: boolean }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${a.c}44`, background: "rgba(12,13,20,0.92)", padding: 12, boxShadow: `0 8px 28px rgba(0,0,0,0.4)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>{a.ab}</div>
          <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: a.c, border: "2px solid #0c0d14", animation: paused ? undefined : "ait-pulse 1.6s infinite" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>{a.role}</div>
          <div style={{ fontSize: 10, color: a.c }}>{a.statusLabel}</div>
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginBottom: 8, lineHeight: 1.35 }}>{a.task}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
        <span>Confidence: <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{a.confidence}%</span></span>
        <span>{a.tokensPerSec}k tok/sec</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 8 }}>
        <motion.div animate={{ width: `${a.progress}%` }} transition={{ duration: 0.8 }} style={{ height: "100%", background: `linear-gradient(90deg,${a.g[0]},${a.g[1]})` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
        <span>Задач: <span style={{ color: "rgba(255,255,255,0.7)" }}>{a.tasksCompleted}</span></span>
        <span>Качество: <span style={{ color: "#34d399" }}>{a.quality}%</span></span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 9, flexWrap: "wrap" }}>
        {a.tools.map(t => (
          <span key={t} className="term-mono" style={{ fontSize: 8, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>{t}</span>
        ))}
      </div>
      <button onClick={onDive} className="term-mono"
        style={{ width: "100%", padding: "7px", borderRadius: 9, border: `1px solid ${a.c}55`, cursor: "pointer", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: a.c, background: `${a.c}12` }}>
        DEEP DIVE · ГЛУБОКИЙ АНАЛИЗ
      </button>
    </div>
  );
}

function HealthRing({ value }: { value: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 118, height: 118, margin: "0 auto" }}>
      <svg width={118} height={118} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={59} cy={59} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <motion.circle cx={59} cy={59} r={r} fill="none" stroke="url(#hg)" strokeWidth={8} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${(value / 100) * circ} ${circ}` }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
        <defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="term-value" style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{value}%</span>
      </div>
    </div>
  );
}

function AreaSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const W = 200, H = 42;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * W, H - ((d - min) / (max - min || 1)) * (H - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs><linearGradient id={`ag-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#ag-${color})`} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth={1.6} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

function BarsSpark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
      {data.map((d, i) => (
        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(d / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
          style={{ flex: 1, borderRadius: 3, background: "linear-gradient(180deg,#818cf8,#4f46e5)", minHeight: 3 }} />
      ))}
    </div>
  );
}

function RiskRadar({ data }: { data: { l: string; v: number }[] }) {
  const S = 150, C = S / 2, R = 46;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / data.length;
    return [C + R * v * Math.cos(a), C + R * v * Math.sin(a)] as const;
  };
  const poly = data.map((d, i) => pt(i, d.v).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 150, display: "block", margin: "0 auto" }}>
      {[0.5, 1].map(f => <polygon key={f} points={data.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" />)}
      {data.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />; })}
      <motion.polygon points={poly} fill="rgba(244,63,94,0.16)" stroke="#f43f5e" strokeWidth={1.3} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ transformOrigin: "50% 50%" }} />
      {data.map((d, i) => { const [x, y] = pt(i, 1.2); return <text key={d.l} x={x} y={y + 3} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={7} fontFamily="var(--font-geist-mono), monospace">{d.l}</text>; })}
    </svg>
  );
}
