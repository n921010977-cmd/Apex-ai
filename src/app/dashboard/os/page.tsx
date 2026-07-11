"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Code2, Palette, Search, UserCheck, Image as ImageIcon, FileText, BarChart3,
  Check, X, Pencil, Play, RotateCcw, Cpu,
} from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM_BY_SLUG } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Topology agents ─────────────────────────────────────────────────────────
const NODES = [
  { slug: "ceo",    label: "CEO",       tokens: 263, x: 50, y: 16 },
  { slug: "market", label: "Research",  tokens: 237, x: 20, y: 42 },
  { slug: "cmo",    label: "Marketing", tokens: 253, x: 80, y: 42 },
  { slug: "legal",  label: "Legal",     tokens: 168, x: 32, y: 82 },
  { slug: "cto",    label: "Tech",      tokens: 201, x: 72, y: 82 },
];

// ─── Skills library ──────────────────────────────────────────────────────────
const SKILLS = [
  { id: "scraper",  name: "Data Scraper",     icon: Database,  cost: 1 },
  { id: "codegen",  name: "Code Generator",   icon: Code2,     cost: 2 },
  { id: "tailwind", name: "Tailwind Builder", icon: Palette,   cost: 1 },
  { id: "search",   name: "Web Search",       icon: Search,    cost: 1 },
  { id: "human",    name: "Human Checkpoint", icon: UserCheck, cost: 0 },
  { id: "image",    name: "Image Analyzer",   icon: ImageIcon, cost: 2 },
  { id: "pdf",      name: "PDF Reader",       icon: FileText,  cost: 1 },
  { id: "chart",    name: "Chart Builder",    icon: BarChart3, cost: 1 },
];

const ENGINES = ["Claude Opus 4.8", "Claude Sonnet 5", "Claude Haiku 4.5"];

const MOOD = ["#3f4a2f", "#6b7a4a", "#8a9a5b", "#c9d1a8", "#e8e4d0", "#4a5a3a", "#9caa6e", "#d4dab0"];

const TIMELINE = [
  { t: "10:21", label: "Mission created" },
  { t: "10:23", label: "Competitors analyzed" },
  { t: "10:24", label: "Financial forecast" },
  { t: "10:25", label: "Marketing strategy" },
  { t: "10:26", label: "CEO approved" },
];

const CONTEXT = [
  { slug: "ceo",    label: "Стратегия",  progress: 100 },
  { slug: "market", label: "Разведка",   progress: 86 },
  { slug: "cmo",    label: "Маркетинг",  progress: 64 },
  { slug: "cto",    label: "Технологии", progress: 42 },
];

export default function ApexOSPage() {
  const [selected, setSelected] = useState("cmo");
  const [engine, setEngine] = useState(ENGINES[1]);
  const [temp, setTemp] = useState(25);
  const [ctxLimit, setCtxLimit] = useState(100);
  const [sysPrompt, setSysPrompt] = useState(
    "Проанализируй бриф, свяжи инсайты по бренду и рынку, дай короткие практические рекомендации по позиционированию и лендингу."
  );
  const [added, setAdded] = useState<string[]>(["scraper", "tailwind"]);
  const [checkpoint, setCheckpoint] = useState<"pending" | "approved" | "rejected">("pending");
  const [ttStep, setTtStep] = useState(TIMELINE.length - 1);

  // Live agent run (real backend)
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [offline, setOffline] = useState(false);

  const agent = TEAM_BY_SLUG[selected];

  const toggleSkill = useCallback((id: string) => {
    setAdded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }, []);

  const runAgent = useCallback(async () => {
    if (running) return;
    setRunning(true); setOutput(""); setOffline(false);
    const skillNames = SKILLS.filter(s => added.includes(s.id)).map(s => s.name).join(", ") || "без инструментов";
    const persona = `${sysPrompt}\n\nТы — ${agent.name}, ${agent.title}. Движок: ${engine}, temperature ${(temp / 100).toFixed(2)}. Доступные навыки: ${skillNames}. Миссия: «Auc Tea — бренд и лендинг». Ответь на русском, 4–6 предложений, обычный текст без markdown.`;
    try {
      await streamChat("Дай следующий шаг по миссии Auc Tea.", persona, t => setOutput(prev => prev + t));
    } catch {
      setOffline(true);
      const fb = `[${agent.name}] По миссии Auc Tea: закрепляю позиционирование «премиальный органический чай», собираю мудборд в природной палитре и черновик лендинга с фокусом на историю бренда. Следующий шаг — утвердить бюджет и запустить A/B заголовка. Живой вывод появится после настройки ANTHROPIC_API_KEY.`;
      for (const ch of fb) { setOutput(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); }
    }
    setRunning(false);
  }, [running, sysPrompt, agent, engine, temp, added]);

  return (
    <div className="os-root">
      {/* Header */}
      <header className="os-header">
        <div className="os-brand">
          <span className="os-brand-mark"><Cpu size={16} strokeWidth={2.2} /></span>
          <span className="os-brand-name">Apex OS</span>
          <span className="os-brand-sub">агент-оркестрация</span>
        </div>
        <div className="os-metrics">
          <Metric label="Cost / mission" value="$1.42" />
          <Metric label="Tokens used" value="2.1M / 4M" bar={52} />
          <Metric label="API latency" value="45ms" dot="#10b981" />
        </div>
      </header>

      <div className="os-grid">
        {/* ── LEFT ── */}
        <aside className="os-col os-left">
          {/* Topology */}
          <Panel title="ACTIVE TOPOGRAPHY" sub="Agents · technical, data-driven" badge="40%">
            <Topology selected={selected} onSelect={setSelected} />
          </Panel>

          {/* Skills */}
          <Panel title="SKILLS LIBRARY">
            <div className="os-skill-head">
              <select value={engine} onChange={e => setEngine(e.target.value)} className="os-select">
                {ENGINES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="os-skill-hint">Кликните, чтобы подключить навык к агенту</div>
            <div className="os-skills">
              {SKILLS.map(s => {
                const on = added.includes(s.id);
                const Icon = s.icon;
                return (
                  <button key={s.id} className={`os-skill${on ? " on" : ""}`} onClick={() => toggleSkill(s.id)}>
                    <span className="os-skill-ic"><Icon size={13} strokeWidth={2} /></span>
                    <span className="os-skill-text">
                      <span className="os-skill-name">{s.name}</span>
                      <span className="os-skill-cost">{s.cost === 0 ? "human" : `${s.cost} tok/op`}</span>
                    </span>
                    <span className="os-skill-add">{on ? <Check size={13} strokeWidth={2.5} /> : "+"}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </aside>

        {/* ── CENTER ── */}
        <section className="os-col os-center">
          <Panel title="ХОЛСТ ДЕЙСТВИЙ" sub="Mission: Auc Tea — бренд и лендинг" live>
            <div className="os-canvas">
              {/* Mood board */}
              <Artifact title="Visual mood board">
                <div className="os-mood">{MOOD.map((c, i) => <span key={i} style={{ background: c }} />)}</div>
              </Artifact>

              {/* Bottle renders */}
              <Artifact title="3D bottle renders">
                <div className="os-bottles">
                  {["#8a9a5b", "#c9d1a8", "#6b7a4a"].map((c, i) => (
                    <svg key={i} viewBox="0 0 40 90" className="os-bottle">
                      <path d="M15 6 h10 v10 q6 4 6 14 v40 q0 8 -8 8 h-6 q-8 0 -8 -8 v-40 q0 -10 6 -14 z" fill={c} opacity={0.9} />
                      <rect x="15" y="4" width="10" height="5" rx="1.5" fill={c} />
                      <rect x="12" y="44" width="16" height="16" rx="2" fill="rgba(255,255,255,0.14)" />
                    </svg>
                  ))}
                </div>
              </Artifact>

              {/* Checkpoint */}
              <Artifact title="Checkpoint" accent="#f59e0b">
                <AnimatePresence mode="wait">
                  {checkpoint === "pending" ? (
                    <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="os-cp-label">Ожидает одобрения</div>
                      <div className="os-cp-title">AUC TEA — БЮДЖЕТ КАМПАНИИ</div>
                      <div className="os-cp-actions">
                        <button className="os-cp-approve" onClick={() => setCheckpoint("approved")}><Check size={12} strokeWidth={2.6} />Approve</button>
                        <button className="os-cp-reject" onClick={() => setCheckpoint("rejected")}><X size={12} strokeWidth={2.6} />Reject</button>
                        <button className="os-cp-edit"><Pencil size={12} strokeWidth={2.2} />Edit</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="r" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="os-cp-result" style={{ color: checkpoint === "approved" ? "#10b981" : "#f43f5e" }}>
                      {checkpoint === "approved" ? "✓ Бюджет утверждён — миссия продолжается" : "✕ Отклонено — на пересмотр"}
                      <button className="os-cp-undo" onClick={() => setCheckpoint("pending")}>↺ вернуть</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Artifact>

              {/* Landing draft */}
              <Artifact title="Landing page draft" wide>
                <div className="os-landing">
                  <div className="os-landing-bar"><i /><i /><i /><span>auctea.com — live preview</span></div>
                  <div className="os-landing-body">
                    <div className="os-landing-hero">
                      <div className="os-landing-h1" /><div className="os-landing-h2" />
                      <div className="os-landing-cta" />
                    </div>
                    <div className="os-landing-bottle">
                      <svg viewBox="0 0 40 90"><path d="M15 6 h10 v10 q6 4 6 14 v40 q0 8 -8 8 h-6 q-8 0 -8 -8 v-40 q0 -10 6 -14 z" fill="#8a9a5b" /></svg>
                    </div>
                  </div>
                </div>
              </Artifact>
            </div>

            {/* Company context */}
            <div className="os-context">
              <div className="os-context-label">КОНТЕКСТ КОМПАНИИ · micro-results</div>
              <div className="os-context-grid">
                {CONTEXT.map(c => {
                  const m = TEAM_BY_SLUG[c.slug];
                  return (
                    <div key={c.slug} className="os-ctx">
                      <div className="os-ctx-head">
                        <span className="os-ctx-av" style={{ color: m.c, borderColor: `${m.c}44` }}>{m.ab}</span>
                        <span className="os-ctx-name">{c.label}</span>
                        <span className="os-ctx-pct" style={{ color: m.c }}>{c.progress}%</span>
                      </div>
                      <div className="os-ctx-track"><motion.i animate={{ width: `${c.progress}%` }} transition={{ duration: 1, ease: EASE }} style={{ background: m.c }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </section>

        {/* ── RIGHT ── */}
        <aside className="os-col os-right">
          <Panel title="ИНСПЕКТОР АГЕНТА">
            <div className="os-insp-head">
              <span className="os-insp-av" style={{ color: agent.c, borderColor: `${agent.c}55` }}>{agent.ab}</span>
              <div>
                <div className="os-insp-name">{agent.name}</div>
                <div className="os-insp-role">{agent.title}</div>
              </div>
            </div>

            <Field label="Engine">
              <select value={engine} onChange={e => setEngine(e.target.value)} className="os-select full">
                {ENGINES.map(e => <option key={e}>{e}</option>)}
              </select>
            </Field>

            <Field label="Temperature" value={`${(temp / 100).toFixed(2)}`}>
              <input type="range" min={0} max={100} value={temp} onChange={e => setTemp(+e.target.value)} className="os-range" style={{ accentColor: agent.c }} />
            </Field>

            <Field label="System prompt">
              <textarea value={sysPrompt} onChange={e => setSysPrompt(e.target.value)} className="os-textarea" rows={4} spellCheck={false} />
            </Field>

            <Field label="Context limit" value={`${ctxLimit}%`}>
              <input type="range" min={10} max={100} value={ctxLimit} onChange={e => setCtxLimit(+e.target.value)} className="os-range" style={{ accentColor: agent.c }} />
            </Field>

            <button className="os-run" onClick={runAgent} disabled={running} style={{ background: `linear-gradient(135deg,${agent.g[0]},${agent.g[1]})` }}>
              {running ? <span className="os-dots"><i /><i /><i /></span> : <><Play size={13} strokeWidth={2.6} />Запустить агента</>}
            </button>

            <AnimatePresence>
              {(output || running) && (
                <motion.div className="os-output" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p>{output}{running && <span className="os-cursor" style={{ background: agent.c }} />}</p>
                  {offline && !running && <div className="os-offline">Демо-вывод — настройте ANTHROPIC_API_KEY</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          {/* Time travel */}
          <Panel title="TIME-TRAVEL DEBUGGING" sub="Переиграть симуляцию миссии">
            <div className="os-tt-event">
              <span className="os-tt-time">{TIMELINE[ttStep].t}</span>
              <span className="os-tt-label">{TIMELINE[ttStep].label}</span>
            </div>
            <input type="range" min={0} max={TIMELINE.length - 1} value={ttStep} onChange={e => setTtStep(+e.target.value)} className="os-range full" style={{ accentColor: "#818cf8" }} />
            <div className="os-tt-ticks">
              {TIMELINE.map((e, i) => (
                <button key={i} className={`os-tt-tick${i === ttStep ? " on" : ""}`} onClick={() => setTtStep(i)} title={`${e.t} · ${e.label}`} />
              ))}
            </div>
            <button className="os-tt-replay" onClick={() => setTtStep(0)}><RotateCcw size={12} strokeWidth={2.2} />Переиграть с начала</button>
          </Panel>
        </aside>
      </div>

      <OsStyles />
    </div>
  );
}

// ─── Topology (node graph) ───────────────────────────────────────────────────
function Topology({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
  return (
    <div className="os-topo">
      <svg viewBox="0 0 100 100" className="os-topo-svg" preserveAspectRatio="none">
        <defs>
          <radialGradient id="os-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </radialGradient>
        </defs>
        {NODES.map(n => {
          const on = n.slug === selected;
          const d = `M${n.x},${n.y} Q50,50 50,50`;
          return (
            <g key={n.slug}>
              <path d={d} stroke={on ? TEAM_BY_SLUG[n.slug].c : "rgba(129,140,248,0.25)"} strokeWidth={on ? 0.7 : 0.4} fill="none" strokeDasharray="1.4 1.4" style={{ animation: "os-flow 1.2s linear infinite" }} />
            </g>
          );
        })}
      </svg>
      {/* core */}
      <div className="os-topo-core">
        <div className="os-topo-glow" />
        <div className="os-topo-core-in">APEX<br />CORE</div>
      </div>
      {/* nodes */}
      {NODES.map(n => {
        const m = TEAM_BY_SLUG[n.slug];
        const on = n.slug === selected;
        return (
          <button key={n.slug} className={`os-node${on ? " on" : ""}`} style={{ left: `${n.x}%`, top: `${n.y}%` }} onClick={() => onSelect(n.slug)}>
            <span className="os-node-av" style={{ color: m.c, borderColor: on ? m.c : `${m.c}44`, boxShadow: on ? `0 0 0 3px ${m.c}22` : "none" }}>{m.ab}</span>
            <span className="os-node-label">{n.label}</span>
            <span className="os-node-tok">{n.tokens} tok</span>
          </button>
        );
      })}
      <div className="os-topo-tag os-topo-tag-l">TECHNICAL<br />LINKS</div>
      <div className="os-topo-tag os-topo-tag-r">KNOWLEDGE<br />FLOW</div>
    </div>
  );
}

// ─── Small components ────────────────────────────────────────────────────────
function Panel({ title, sub, badge, live, children }: { title: string; sub?: string; badge?: string; live?: boolean; children: React.ReactNode }) {
  return (
    <div className="os-panel">
      <div className="os-panel-head">
        <div>
          <div className="os-panel-title">{title}</div>
          {sub && <div className="os-panel-sub">{sub}</div>}
        </div>
        {badge && <span className="os-panel-badge">{badge}</span>}
        {live && <span className="os-live"><span />Live</span>}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, bar, dot }: { label: string; value: string; bar?: number; dot?: string }) {
  return (
    <div className="os-metric">
      <div className="os-metric-label">{label}</div>
      <div className="os-metric-value">{dot && <span className="os-metric-dot" style={{ background: dot }} />}{value}</div>
      {bar != null && <div className="os-metric-bar"><i style={{ width: `${bar}%` }} /></div>}
    </div>
  );
}

function Artifact({ title, children, accent, wide }: { title: string; children: React.ReactNode; accent?: string; wide?: boolean }) {
  return (
    <div className={`os-artifact${wide ? " wide" : ""}`} style={accent ? { borderColor: `${accent}44` } : undefined}>
      <div className="os-artifact-title" style={accent ? { color: accent } : undefined}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="os-field">
      <div className="os-field-head">
        <span className="os-field-label">{label}</span>
        {value && <span className="os-field-value">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function OsStyles() {
  return (
    <style jsx global>{`
      .os-root { padding: 16px 18px 28px; }
      .os-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
      .os-brand { display: flex; align-items: center; gap: 10px; }
      .os-brand-mark { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff;
        background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2); }
      .os-brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; }
      .os-brand-sub { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); text-transform: uppercase; }
      .os-metrics { display: flex; gap: 10px; }
      .os-metric { min-width: 118px; padding: 8px 13px; border-radius: 11px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); }
      .os-metric-label { font-family: var(--font-geist-mono), monospace; font-size: 8.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); text-transform: uppercase; }
      .os-metric-value { display: flex; align-items: center; gap: 5px; font-size: 15px; font-weight: 800; color: #E5E7EB; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; margin-top: 2px; }
      .os-metric-dot { width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }
      .os-metric-bar { margin-top: 6px; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.08); overflow: hidden; }
      .os-metric-bar i { display: block; height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); }

      .os-grid { display: grid; grid-template-columns: 296px minmax(0,1fr) 320px; gap: 14px; align-items: start; }
      .os-col { display: flex; flex-direction: column; gap: 14px; }

      .os-panel { border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.018);
        box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.2); padding: 14px; }
      .os-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
      .os-panel-title { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.12em; color: rgba(255,255,255,0.55); font-weight: 600; }
      .os-panel-sub { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 3px; }
      .os-panel-badge { font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 800; color: #a5b4fc; }
      .os-live { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; color: #34d399; }
      .os-live span { width: 5px; height: 5px; border-radius: 50%; background: #34d399; animation: os-pulse 1.6s infinite; }

      /* Topology */
      .os-topo { position: relative; height: 300px; border-radius: 12px; overflow: hidden;
        background: radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08), transparent 62%); }
      .os-topo-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
      .os-topo-core { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
      .os-topo-glow { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(129,140,248,0.4), rgba(99,102,241,0.12) 45%, transparent 70%); animation: os-breathe 3.4s ease-in-out infinite; }
      .os-topo-core-in { position: relative; width: 68px; height: 68px; border-radius: 50%; background: rgba(11,13,22,0.9); border: 1px solid rgba(129,140,248,0.45);
        display: flex; align-items: center; justify-content: center; text-align: center; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; color: #c7d2fe; line-height: 1.2;
        box-shadow: inset 0 0 24px rgba(99,102,241,0.25); }
      .os-node { position: absolute; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; z-index: 2; }
      .os-node-av { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 800;
        background: rgba(11,13,22,0.85); border: 1px solid; transition: box-shadow 0.18s ease, transform 0.18s ease; }
      .os-node:hover .os-node-av { transform: translateY(-2px); }
      .os-node-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.7); }
      .os-node.on .os-node-label { color: #fff; }
      .os-node-tok { font-family: var(--font-geist-mono), monospace; font-size: 8px; color: rgba(255,255,255,0.35); }
      .os-topo-tag { position: absolute; font-family: var(--font-geist-mono), monospace; font-size: 8px; letter-spacing: 0.1em; color: rgba(255,255,255,0.25); line-height: 1.3; }
      .os-topo-tag-l { left: 6px; top: 30%; } .os-topo-tag-r { right: 6px; top: 24%; text-align: right; }

      /* Skills */
      .os-skill-head { margin-bottom: 8px; }
      .os-select { width: 100%; height: 34px; padding: 0 10px; border-radius: 9px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09);
        color: #E5E7EB; font-size: 12px; outline: none; cursor: pointer; }
      .os-select.full { width: 100%; }
      .os-select:focus { border-color: rgba(99,102,241,0.5); }
      .os-skill-hint { font-size: 10.5px; color: rgba(255,255,255,0.35); margin-bottom: 9px; }
      .os-skills { display: flex; flex-direction: column; gap: 6px; }
      .os-skill { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; cursor: pointer; text-align: left;
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); transition: background 0.16s, border-color 0.16s, transform 0.16s; }
      .os-skill:hover { background: rgba(255,255,255,0.04); transform: translateX(2px); }
      .os-skill.on { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.07); }
      .os-skill-ic { width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
      .os-skill.on .os-skill-ic { color: #a5b4fc; border-color: rgba(99,102,241,0.35); }
      .os-skill-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .os-skill-name { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.85); }
      .os-skill-cost { font-family: var(--font-geist-mono), monospace; font-size: 9px; color: rgba(255,255,255,0.35); }
      .os-skill-add { width: 20px; height: 20px; flex-shrink: 0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
        color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); }
      .os-skill.on .os-skill-add { color: #fff; background: #6366f1; }

      /* Canvas */
      .os-canvas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .os-artifact { border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.015); padding: 11px; }
      .os-artifact.wide { grid-column: span 2; }
      .os-artifact-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.55); margin-bottom: 9px; }
      .os-mood { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
      .os-mood span { aspect-ratio: 1; border-radius: 5px; }
      .os-bottles { display: flex; align-items: flex-end; justify-content: center; gap: 12px; padding: 4px 0; }
      .os-bottle { height: 74px; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.4)); }
      .os-cp-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.08em; color: #fbbf24; }
      .os-cp-title { font-size: 12.5px; font-weight: 700; color: #fff; margin: 3px 0 10px; }
      .os-cp-actions { display: flex; gap: 6px; }
      .os-cp-actions button { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 11px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700; border: none; }
      .os-cp-approve { color: #fff; background: linear-gradient(135deg, #10b981, #059669); }
      .os-cp-reject { color: #fca5a5; background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.3) !important; }
      .os-cp-edit { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1) !important; }
      .os-cp-result { display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 600; padding: 8px 0; }
      .os-cp-undo { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer; }
      .os-landing { border-radius: 9px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
      .os-landing-bar { display: flex; align-items: center; gap: 5px; padding: 6px 9px; background: rgba(255,255,255,0.04); }
      .os-landing-bar i { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.2); }
      .os-landing-bar span { margin-left: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9px; color: rgba(255,255,255,0.4); }
      .os-landing-body { display: flex; gap: 14px; padding: 16px; background: linear-gradient(135deg, rgba(138,154,91,0.12), rgba(11,13,22,0.4)); }
      .os-landing-hero { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
      .os-landing-h1 { height: 12px; width: 80%; border-radius: 3px; background: rgba(255,255,255,0.55); }
      .os-landing-h2 { height: 8px; width: 60%; border-radius: 3px; background: rgba(255,255,255,0.25); }
      .os-landing-cta { height: 24px; width: 90px; border-radius: 7px; background: #8a9a5b; margin-top: 4px; }
      .os-landing-bottle svg { height: 70px; }

      /* Context */
      .os-context { margin-top: 12px; }
      .os-context-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 10px; }
      .os-context-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .os-ctx { padding: 10px 11px; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
      .os-ctx-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .os-ctx-av { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 800; background: rgba(255,255,255,0.02); border: 1px solid; }
      .os-ctx-name { flex: 1; font-size: 11.5px; color: rgba(255,255,255,0.7); }
      .os-ctx-pct { font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .os-ctx-track { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.07); overflow: hidden; }
      .os-ctx-track i { display: block; height: 100%; border-radius: 2px; }

      /* Inspector */
      .os-insp-head { display: flex; align-items: center; gap: 11px; margin-bottom: 16px; }
      .os-insp-av { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 13px; font-weight: 800;
        background: rgba(255,255,255,0.025); border: 1px solid; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
      .os-insp-name { font-size: 14.5px; font-weight: 700; color: #fff; }
      .os-insp-role { font-size: 11.5px; color: rgba(255,255,255,0.45); }
      .os-field { margin-bottom: 14px; }
      .os-field-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
      .os-field-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.06em; color: rgba(255,255,255,0.5); }
      .os-field-value { font-family: var(--font-geist-mono), monospace; font-size: 11px; color: #a5b4fc; font-variant-numeric: tabular-nums; }
      .os-range { width: 100%; height: 4px; cursor: pointer; }
      .os-range.full { margin: 6px 0; }
      .os-textarea { width: 100%; resize: vertical; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09);
        color: rgba(255,255,255,0.8); font-size: 12px; line-height: 1.5; outline: none; font-family: inherit; }
      .os-textarea:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
      .os-run { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border-radius: 11px; border: none; cursor: pointer;
        color: #fff; font-size: 13px; font-weight: 700; box-shadow: inset 0 1px 0 rgba(255,255,255,0.18); transition: transform 0.15s ease, opacity 0.15s; margin-top: 4px; }
      .os-run:hover:not(:disabled) { transform: translateY(-1px); }
      .os-run:disabled { opacity: 0.6; cursor: wait; }
      .os-output { margin-top: 12px; border-radius: 11px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); padding: 13px 14px; }
      .os-output p { font-size: 12.5px; line-height: 1.6; color: rgba(255,255,255,0.8); margin: 0; white-space: pre-wrap; }
      .os-cursor { display: inline-block; width: 6px; height: 13px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: os-caret 1s step-end infinite; }
      .os-offline { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; color: rgba(251,191,36,0.8); margin-top: 8px; }
      .os-dots { display: inline-flex; gap: 4px; }
      .os-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: os-blink 1s infinite; }
      .os-dots i:nth-child(2){animation-delay:.15s} .os-dots i:nth-child(3){animation-delay:.3s}

      /* Time travel */
      .os-tt-event { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
      .os-tt-time { font-family: var(--font-geist-mono), monospace; font-size: 12px; font-weight: 700; color: #a5b4fc; }
      .os-tt-label { font-size: 12.5px; color: rgba(255,255,255,0.75); }
      .os-tt-ticks { display: flex; justify-content: space-between; margin: 8px 2px 12px; }
      .os-tt-tick { width: 12px; height: 12px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); background: transparent; cursor: pointer; padding: 0; transition: border-color 0.16s, background 0.16s; }
      .os-tt-tick.on { border-color: #818cf8; background: #818cf8; box-shadow: 0 0 8px rgba(129,140,248,0.6); }
      .os-tt-replay { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 13px; border-radius: 9px; cursor: pointer; font-size: 12px; font-weight: 600;
        color: rgba(255,255,255,0.72); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); transition: color .16s, border-color .16s; }
      .os-tt-replay:hover { color: #fff; border-color: rgba(255,255,255,0.18); }

      @keyframes os-flow { to { stroke-dashoffset: -14; } }
      @keyframes os-breathe { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
      @keyframes os-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
      @keyframes os-caret { 50% { opacity: 0; } }
      @keyframes os-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

      @media (max-width: 1280px) { .os-grid { grid-template-columns: 1fr; } }
      @media (max-width: 640px) { .os-canvas { grid-template-columns: 1fr; } .os-artifact.wide { grid-column: span 1; } .os-metrics { width: 100%; } }
      @media (prefers-reduced-motion: reduce) { .os-topo-glow, .os-live span, .os-dots i, .os-cursor, [style*="os-flow"] { animation: none !important; } }
    `}</style>
  );
}
