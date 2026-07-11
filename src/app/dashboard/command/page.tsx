"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, Sparkles, Radio, Check, Loader2 } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { CEO, DEPARTMENTS, TOTAL_EMPLOYEES, routeDepartments, type Department } from "@/lib/corp";

const EASE = [0.22, 1, 0.36, 1] as const;
const byId = Object.fromEntries(DEPARTMENTS.map(d => [d.id, d])) as Record<string, Department>;

const EXAMPLES = ["Создай SaaS для ресторанов", "Хочу заработать $1M за год", "Запусти бренд органического чая"];

type Phase = "idle" | "planning" | "working" | "synthesizing" | "done";
type DState = { status: "idle" | "active" | "done"; progress: number; agentIdx: number; thought: string };
type LogItem = { id: number; dept: string; name: string; text: string; c: string };

const FB_PLAN = "Разбиваю цель на план. 1) Стратегия: горизонты 30/60/90 и ключевая метрика. 2) Финансы: юнит-экономика и точка безубыточности. 3) Маркетинг и продажи: первый тест спроса. 4) Продукт: минимальный MVP. 5) Сборка результата и следующие шаги. Подключаю профильные отделы. (Демо — настройте ANTHROPIC_API_KEY.)";
const FB_RESULT = "Итог корпорации: цель достижима поэтапно. 1) За неделю — дешёвый тест спроса с жёстким лимитом бюджета. 2) При метриках выше порога — MVP за 2–3 недели. 3) Через 30 дней — пересмотр по фактическим цифрам. Полный живой синтез доступен после подключения ANTHROPIC_API_KEY.";

// ring positions for 8 department nodes
const R = 38;
const POS = DEPARTMENTS.map((_, i) => {
  const a = (-90 + i * (360 / DEPARTMENTS.length)) * (Math.PI / 180);
  return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
});

export default function CommandCenterPage() {
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState("");
  const [result, setResult] = useState("");
  const [offline, setOffline] = useState(false);
  const [routed, setRouted] = useState<string[]>([]);
  const [depts, setDepts] = useState<Record<string, DState>>({});
  const [log, setLog] = useState<LogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const logId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const busy = phase !== "idle" && phase !== "done";

  const runDept = useCallback((id: string): Promise<void> => new Promise(resolve => {
    const d = byId[id];
    setDepts(p => ({ ...p, [id]: { status: "active", progress: 0, agentIdx: 0, thought: d.thoughts[0] } }));
    let prog = 0, ti = 0;
    const pInt = setInterval(() => {
      prog = Math.min(100, prog + 3 + Math.random() * 4);
      setDepts(p => ({ ...p, [id]: { ...p[id], progress: prog } }));
      if (prog >= 100) {
        clearInterval(pInt); clearInterval(thInt);
        setDepts(p => ({ ...p, [id]: { ...p[id], status: "done", progress: 100 } }));
        resolve();
      }
    }, 130);
    const thInt = setInterval(() => {
      ti = (ti + 1) % d.thoughts.length;
      const ai = ti % d.agents.length;
      const agent = d.agents[ai];
      setDepts(p => ({ ...p, [id]: { ...p[id], thought: d.thoughts[ti], agentIdx: ai } }));
      setLog(l => [{ id: logId.current++, dept: id, name: agent.name, text: d.thoughts[ti], c: d.color }, ...l].slice(0, 40));
    }, 850);
    timers.current.push(pInt, thInt);
  }), []);

  const run = useCallback(async (g: string) => {
    setPhase("planning"); setPlan(""); setResult(""); setOffline(false); setLog([]); setSelected(null);
    const ids = routeDepartments(g);
    setRouted(ids);
    setDepts(Object.fromEntries(ids.map(id => [id, { status: "idle", progress: 0, agentIdx: 0, thought: "" } as DState])));

    // 1) CEO plan
    let off = false;
    const planPersona = `Ты — Sophia Rivers, AI CEO цифровой корпорации Apex. Основатель поставил цель: «${g}». Дай короткий план на русском: что делаем и какие отделы задействуем, 4–5 пунктов, обычный текст без markdown-звёздочек.`;
    try { await streamChat(g, planPersona, t => setPlan(p => p + t)); }
    catch { off = true; for (const ch of FB_PLAN) { setPlan(p => p + ch); await new Promise(r => setTimeout(r, 5)); } }

    // 2) departments work (parallel with staggered start)
    setPhase("working");
    await new Promise(r => setTimeout(r, 500));
    await Promise.all(ids.map((id, i) => new Promise<void>(res => setTimeout(() => runDept(id).then(res), i * 320))));

    // 3) CEO synthesis
    setPhase("synthesizing");
    const delivered = ids.map(id => `${byId[id].name}: ${byId[id].deliverable}`).join("; ");
    const resPersona = `Ты — Sophia Rivers, AI CEO Apex. Цель: «${g}». Отделы отчитались: ${delivered}. Сведи в единый итог для основателя на русском: короткий вывод и 3 конкретных следующих шага по пунктам (1., 2., 3.). Максимум 7 предложений, без markdown-звёздочек.`;
    try { await streamChat(g, resPersona, t => setResult(p => p + t)); }
    catch { off = true; for (const ch of FB_RESULT) { setResult(p => p + ch); await new Promise(r => setTimeout(r, 5)); } }
    setOffline(off);
    setPhase("done");
  }, [runDept]);

  const submit = useCallback(() => {
    const g = goal.trim(); if (!g || busy) return;
    setGoal(""); void run(g);
  }, [goal, busy, run]);

  const reset = useCallback(() => {
    timers.current.forEach(clearInterval); timers.current = [];
    setPhase("idle"); setPlan(""); setResult(""); setDepts({}); setLog([]); setRouted([]); setSelected(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const activeCount = routed.filter(id => depts[id]?.status === "active").length;
  const doneCount = routed.filter(id => depts[id]?.status === "done").length;

  return (
    <div className="cc-root">
      <div className="cc-wrap">
        {/* Header */}
        <div className="cc-header">
          <div className="cc-brand">
            <span className="cc-brand-mark"><Radio size={15} strokeWidth={2.2} /></span>
            <div>
              <div className="cc-brand-name">Командный центр</div>
              <div className="cc-brand-sub">Цифровая корпорация · {DEPARTMENTS.length} отделов · {TOTAL_EMPLOYEES} AI-сотрудников</div>
            </div>
          </div>
          <div className="cc-status">
            <span className="cc-status-dot" style={{ background: phase === "idle" ? "#64748b" : "#10b981" }} />
            <span>{phase === "idle" ? "STANDBY" : phase === "done" ? "ЗАВЕРШЕНО" : "РАБОТАЕТ"}</span>
          </div>
        </div>

        {/* Goal input */}
        <div className="cc-goal">
          <Sparkles size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
          <input ref={inputRef} value={goal} onChange={e => setGoal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
            disabled={busy} placeholder="Поставьте цель — цифровая корпорация её выполнит…" spellCheck={false} />
          <button onClick={submit} disabled={busy || !goal.trim()}>
            {busy ? <span className="cc-dots"><i /><i /><i /></span> : <><span>Запустить</span><CornerDownLeft size={14} strokeWidth={2.4} /></>}
          </button>
        </div>
        {phase === "idle" && (
          <div className="cc-examples">
            {EXAMPLES.map(e => <button key={e} onClick={() => { setGoal(e); requestAnimationFrame(() => inputRef.current?.focus()); }}>{e}</button>)}
          </div>
        )}

        {/* Main grid */}
        <div className="cc-grid">
          {/* Org map */}
          <div className="cc-map-panel">
            <div className="cc-panel-label">КАРТА КОРПОРАЦИИ</div>
            <OrgMap routed={routed} depts={depts} phase={phase} selected={selected} onSelect={setSelected} />
            {phase !== "idle" && (
              <div className="cc-map-stats">
                <span><b style={{ color: "#818cf8" }}>{routed.length}</b> отделов задействовано</span>
                <span><b style={{ color: "#f59e0b" }}>{activeCount}</b> в работе</span>
                <span><b style={{ color: "#10b981" }}>{doneCount}</b> готово</span>
              </div>
            )}
          </div>

          {/* CEO console */}
          <div className="cc-console">
            <div className="cc-panel-label">AI CEO · {CEO.name}</div>
            <div className="cc-ceo">
              <span className="cc-ceo-av" style={{ background: `linear-gradient(135deg,${CEO.g[0]},${CEO.g[1]})` }}>{CEO.ab}</span>
              <div>
                <div className="cc-ceo-name">{CEO.name}</div>
                <div className="cc-ceo-phase">{phase === "idle" ? "Ожидает цель" : phase === "planning" ? "Строит план…" : phase === "working" ? "Контролирует отделы…" : phase === "synthesizing" ? "Собирает итог…" : "Готово"}</div>
              </div>
            </div>

            {plan && (
              <div className="cc-block">
                <div className="cc-block-label">ПЛАН CEO</div>
                <p>{plan}{phase === "planning" && <span className="cc-cursor" />}</p>
              </div>
            )}

            {result && (
              <motion.div className="cc-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="cc-result-label"><Sparkles size={12} strokeWidth={2.4} />ИТОГ КОРПОРАЦИИ</div>
                <p>{result}{phase === "synthesizing" && <span className="cc-cursor" />}</p>
                {offline && phase === "done" && <div className="cc-offline">Демо — настройте ANTHROPIC_API_KEY для живого синтеза</div>}
                {phase === "done" && <button className="cc-new" onClick={reset}>Новая цель</button>}
              </motion.div>
            )}

            {phase === "idle" && (
              <div className="cc-hint">Опишите цель — <b style={{ color: "#a5b4fc" }}>{CEO.name}</b> разложит её на план, распределит по отделам и соберёт готовый результат. Вы наблюдаете весь процесс в реальном времени.</div>
            )}
          </div>
        </div>

        {/* Working departments */}
        <AnimatePresence>
          {routed.length > 0 && (
            <motion.div className="cc-depts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {routed.map(id => {
                const d = byId[id]; const st = depts[id];
                if (!st) return null;
                return (
                  <motion.div key={id} className="cc-dept" layout
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}
                    style={{ borderColor: st.status === "active" ? `${d.color}66` : "rgba(255,255,255,0.07)" }}>
                    <div className="cc-dept-head">
                      <span className="cc-dept-ic" style={{ background: `linear-gradient(135deg,${d.g[0]},${d.g[1]})` }}>{d.short}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cc-dept-name">{d.name}</div>
                        <div className="cc-dept-state" style={{ color: st.status === "done" ? "#10b981" : st.status === "active" ? d.color : "rgba(255,255,255,0.4)" }}>
                          {st.status === "done" ? <><Check size={10} strokeWidth={3} />{d.deliverable}</> : st.status === "active" ? <><Loader2 size={10} className="cc-spin" />{d.agents[st.agentIdx].name} · {st.thought}</> : "в очереди"}
                        </div>
                      </div>
                      <span className="cc-dept-pct" style={{ color: d.color }}>{Math.round(st.progress)}%</span>
                    </div>
                    <div className="cc-dept-track"><i style={{ width: `${st.progress}%`, background: `linear-gradient(90deg,${d.g[0]},${d.g[1]})` }} /></div>
                    <div className="cc-dept-agents">
                      {d.agents.map((a, i) => (
                        <span key={i} className="cc-agent" title={`${a.name} · ${a.role}`}
                          style={{ background: `linear-gradient(135deg,${d.g[0]},${d.g[1]})`, opacity: st.status === "active" && i === st.agentIdx ? 1 : st.status === "done" ? 0.85 : 0.4, outline: st.status === "active" && i === st.agentIdx ? `2px solid ${d.color}` : "none" }}>{a.ab}</span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Think-aloud log */}
        {log.length > 0 && (
          <div className="cc-logpanel">
            <div className="cc-panel-label">AI ДУМАЕТ ВСЛУХ · ЖИВОЙ ПОТОК</div>
            <div className="cc-log">
              <AnimatePresence initial={false}>
                {log.slice(0, 8).map(e => (
                  <motion.div key={e.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="cc-log-row">
                    <span className="cc-log-dot" style={{ background: e.c }} />
                    <span className="cc-log-name" style={{ color: e.c }}>{e.name}</span>
                    <span className="cc-log-text">{e.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <CcStyles />
    </div>
  );
}

// ─── Org map ─────────────────────────────────────────────────────────────────
function OrgMap({ routed, depts, phase, selected, onSelect }: { routed: string[]; depts: Record<string, DState>; phase: Phase; selected: string | null; onSelect: (id: string | null) => void }) {
  const sel = selected ? byId[selected] : null;
  return (
    <div className="cc-map">
      <svg viewBox="0 0 100 100" className="cc-map-svg">
        <defs>
          <radialGradient id="cc-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.9" /><stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" /><stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* links */}
        {DEPARTMENTS.map((d, i) => {
          const on = routed.includes(d.id);
          const st = depts[d.id];
          const active = st?.status === "active";
          const p = POS[i];
          return (
            <g key={d.id}>
              <line x1="50" y1="50" x2={p.x} y2={p.y} stroke={on ? d.color : "rgba(255,255,255,0.06)"} strokeWidth={active ? 0.6 : 0.3} strokeOpacity={on ? (active ? 0.8 : 0.35) : 0.5} strokeDasharray="1.5 1.5" style={active ? { animation: "cc-flow 1s linear infinite" } : undefined} />
              {active && <circle r="1" fill={d.color}><animateMotion dur="1.4s" repeatCount="indefinite" path={`M50,50 L${p.x},${p.y}`} /></circle>}
            </g>
          );
        })}
        {/* CEO core */}
        <circle cx="50" cy="50" r="16" fill="url(#cc-core)" style={phase !== "idle" ? { animation: "cc-breathe 3s ease-in-out infinite" } : undefined} />
        <circle cx="50" cy="50" r="8.5" fill="#0b0d16" stroke="rgba(129,140,248,0.5)" strokeWidth="0.5" />
      </svg>
      {/* CEO label */}
      <div className="cc-node cc-node-ceo" style={{ left: "50%", top: "50%" }}>
        <span className="cc-node-av cc-ceo-node" style={{ background: `linear-gradient(135deg,${CEO.g[0]},${CEO.g[1]})` }}>{CEO.ab}</span>
        <span className="cc-node-label">CEO</span>
      </div>
      {/* department nodes */}
      {DEPARTMENTS.map((d, i) => {
        const on = routed.includes(d.id);
        const st = depts[d.id];
        const p = POS[i];
        const circ = 2 * Math.PI * 13;
        return (
          <button key={d.id} className={`cc-node${on ? " on" : ""}${selected === d.id ? " sel" : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => onSelect(selected === d.id ? null : d.id)}>
            <span className="cc-node-ring">
              <svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                <circle cx="15" cy="15" r="13" fill="none" stroke={d.color} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${((st?.progress ?? 0) / 100) * circ} ${circ}`} transform="rotate(-90 15 15)" style={{ transition: "stroke-dasharray 0.2s" }} />
              </svg>
              <span className="cc-node-av" style={{ background: on ? `linear-gradient(135deg,${d.g[0]},${d.g[1]})` : "rgba(255,255,255,0.06)", color: on ? "#fff" : "rgba(255,255,255,0.4)" }}>{d.short}</span>
            </span>
            <span className="cc-node-label">{d.name}</span>
          </button>
        );
      })}
      {/* selected dept detail */}
      <AnimatePresence>
        {sel && (
          <motion.div className="cc-map-detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="cc-map-detail-head" style={{ color: sel.color }}>{sel.name}</div>
            <div className="cc-map-detail-agents">
              {sel.agents.map((a, i) => <span key={i} className="cc-md-agent"><span className="cc-md-av" style={{ background: `linear-gradient(135deg,${sel.g[0]},${sel.g[1]})` }}>{a.ab}</span>{a.name} · {a.role}</span>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CcStyles() {
  return (
    <style jsx global>{`
      .cc-root { background: radial-gradient(1200px 600px at 50% -10%, rgba(99,102,241,0.08), transparent 60%), #05060A; min-height: 100%; }
      .cc-wrap { max-width: 1200px; margin: 0 auto; padding: 24px 24px 60px; }
      .cc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
      .cc-brand { display: flex; align-items: center; gap: 12px; }
      .cc-brand-mark { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
      .cc-brand-name { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; }
      .cc-brand-sub { font-size: 11.5px; color: rgba(255,255,255,0.42); margin-top: 1px; }
      .cc-status { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.6); padding: 7px 12px; border-radius: 9px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
      .cc-status-dot { width: 6px; height: 6px; border-radius: 50%; animation: cc-pulse 2s infinite; }

      .cc-goal { display: flex; align-items: center; gap: 10px; padding: 0 16px; height: 56px; border-radius: 15px; background: rgba(255,255,255,0.04); border: 1px solid rgba(99,102,241,0.28); box-shadow: 0 0 0 4px rgba(99,102,241,0.06), 0 12px 40px rgba(0,0,0,0.3); transition: border-color .18s, box-shadow .18s; }
      .cc-goal:focus-within { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 4px rgba(99,102,241,0.12), 0 12px 40px rgba(0,0,0,0.3); }
      .cc-goal input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: #E5E7EB; font-size: 15.5px; }
      .cc-goal input::placeholder { color: rgba(255,255,255,0.3); }
      .cc-goal button { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 18px; border-radius: 11px; border: none; cursor: pointer; font-size: 13.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .cc-goal button:hover:not(:disabled) { transform: translateY(-1px); }
      .cc-goal button:disabled { opacity: 0.6; cursor: not-allowed; }
      .cc-dots { display: inline-flex; gap: 4px; } .cc-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: cc-blink 1s infinite; }
      .cc-dots i:nth-child(2){animation-delay:.15s} .cc-dots i:nth-child(3){animation-delay:.3s}
      .cc-examples { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
      .cc-examples button { padding: 8px 14px; border-radius: 10px; cursor: pointer; font-size: 12.5px; color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: background .16s, transform .16s; }
      .cc-examples button:hover { background: rgba(255,255,255,0.06); transform: translateY(-1px); }

      .cc-grid { display: grid; grid-template-columns: minmax(0,1fr) 380px; gap: 14px; margin-top: 18px; align-items: start; }
      .cc-panel-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
      .cc-map-panel, .cc-console { border-radius: 18px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.015); padding: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }

      .cc-map { position: relative; aspect-ratio: 1.35; width: 100%; }
      .cc-map-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
      .cc-node { position: absolute; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; z-index: 2; }
      .cc-node-ceo { z-index: 3; cursor: default; }
      .cc-node-ring { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
      .cc-node-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; }
      .cc-node-av { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 800; color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
      .cc-ceo-node { width: 46px; height: 46px; border-radius: 13px; font-size: 13px; box-shadow: 0 0 24px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.25); }
      .cc-node-label { font-size: 8.5px; color: rgba(255,255,255,0.5); white-space: nowrap; }
      .cc-node.on .cc-node-label { color: rgba(255,255,255,0.75); }
      .cc-node:hover:not(.cc-node-ceo) .cc-node-av { transform: translateY(-1px); }
      .cc-node.sel .cc-node-label { color: #fff; }
      .cc-map-detail { position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 14px; border-radius: 12px; background: rgba(5,6,10,0.9); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); }
      .cc-map-detail-head { font-size: 12.5px; font-weight: 700; margin-bottom: 8px; }
      .cc-map-detail-agents { display: flex; flex-direction: column; gap: 6px; }
      .cc-md-agent { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: rgba(255,255,255,0.7); }
      .cc-md-av { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 8px; font-weight: 800; color: #fff; }
      .cc-map-stats { display: flex; gap: 16px; justify-content: center; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.5); }
      .cc-map-stats b { font-variant-numeric: tabular-nums; }

      .cc-ceo { display: flex; align-items: center; gap: 11px; margin-bottom: 14px; }
      .cc-ceo-av { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 13px; font-weight: 800; color: #fff; box-shadow: 0 0 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.25); }
      .cc-ceo-name { font-size: 15px; font-weight: 800; color: #fff; }
      .cc-ceo-phase { font-size: 11.5px; color: #a5b4fc; }
      .cc-block { border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 12px 14px; margin-bottom: 12px; }
      .cc-block-label { font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
      .cc-block p, .cc-result p { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.8); margin: 0; white-space: pre-wrap; }
      .cc-result { border-radius: 14px; background: linear-gradient(180deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02)); border: 1px solid rgba(99,102,241,0.3); padding: 14px 16px; }
      .cc-result-label { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 8px; }
      .cc-cursor { display: inline-block; width: 6px; height: 13px; margin-left: 2px; border-radius: 1px; background: #818cf8; vertical-align: text-bottom; animation: cc-caret 1s step-end infinite; }
      .cc-offline { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; color: rgba(251,191,36,0.8); margin-top: 10px; }
      .cc-new { margin-top: 14px; height: 36px; padding: 0 16px; border-radius: 10px; cursor: pointer; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); transition: color .16s, border-color .16s; }
      .cc-new:hover { color: #fff; border-color: rgba(255,255,255,0.2); }
      .cc-hint { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.5); }

      .cc-depts { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-top: 16px; }
      .cc-dept { border-radius: 14px; border: 1px solid; background: rgba(255,255,255,0.018); padding: 13px 15px; transition: border-color .3s; }
      .cc-dept-head { display: flex; align-items: center; gap: 11px; margin-bottom: 10px; }
      .cc-dept-ic { width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.22); }
      .cc-dept-name { font-size: 13.5px; font-weight: 700; color: #fff; }
      .cc-dept-state { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; margin-top: 2px; line-height: 1.3; }
      .cc-dept-pct { font-family: var(--font-geist-mono), monospace; font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; flex-shrink: 0; }
      .cc-dept-track { height: 4px; border-radius: 3px; background: rgba(255,255,255,0.07); overflow: hidden; margin-bottom: 11px; }
      .cc-dept-track i { display: block; height: 100%; border-radius: 3px; transition: width 0.2s ease; }
      .cc-dept-agents { display: flex; gap: 5px; }
      .cc-agent { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: var(--font-geist-mono), monospace; font-size: 8px; font-weight: 800; color: #fff; transition: opacity .2s, outline .2s; outline-offset: 1px; }
      .cc-spin { animation: cc-rot 0.9s linear infinite; }

      .cc-logpanel { margin-top: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.012); padding: 14px 16px; }
      .cc-log { display: flex; flex-direction: column; gap: 7px; }
      .cc-log-row { display: flex; align-items: center; gap: 10px; }
      .cc-log-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .cc-log-name { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; font-weight: 700; flex-shrink: 0; min-width: 108px; }
      .cc-log-text { font-size: 12px; color: rgba(255,255,255,0.62); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      @keyframes cc-flow { to { stroke-dashoffset: -6; } }
      @keyframes cc-breathe { 0%,100%{opacity:.7} 50%{opacity:1} }
      @keyframes cc-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes cc-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
      @keyframes cc-caret { 50% { opacity: 0; } }
      @keyframes cc-rot { to { transform: rotate(360deg); } }

      @media (max-width: 980px) { .cc-grid { grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce) { .cc-status-dot, .cc-dots i, .cc-cursor, .cc-spin, [style*="cc-flow"], [style*="cc-breathe"] { animation: none !important; } }
    `}</style>
  );
}
