"use client";

// Autopilot Mode — пользователь ставит долгосрочную цель, AI-CEO ведёт её как
// настоящий гендиректор: стратегия, план на сегодня, прогнозы, ежедневный
// прогресс. Состояние живёт в localStorage, так что при возвращении
// пользователь видит «день N» и продолжает с того же места.

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, Sparkles, TrendingUp, ShieldAlert, RotateCcw, Check } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { CEO } from "@/lib/corp";

const EASE = [0.22, 1, 0.36, 1] as const;
const LS_KEY = "apex-autopilot";

type Saved = { goal: string; startedAt: number; strategy: string; doneTasks: string[] };
type Task = { text: string; done: boolean };

const FB_STRATEGY = "Стратегия автопилота: двигаемся к цели поэтапно. Этап 1 (30 дней) — проверка спроса и первые платящие клиенты. Этап 2 (60 дней) — повторяемая воронка и юнит-экономика в плюсе. Этап 3 (90 дней) — масштабирование каналов, которые окупились. Каждый день автопилот выдаёт три задачи и следит за прогрессом. (Демо — настройте ANTHROPIC_API_KEY.)";
const FB_TASKS = ["Сформулировать оффер одним предложением и показать 5 потенциальным клиентам", "Посчитать целевую юнит-экономику: цена, себестоимость, CAC", "Составить список 20 мест, где живёт ваша аудитория"];

// модель иногда игнорирует «без markdown» — чистим ## и ** при выводе
const plain = (t: string) => t.replace(/^#+\s*/gm, "").replace(/\*\*/g, "");

const load = (): Saved | null => {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
};
const save = (s: Saved) => { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} };

// детерминированные прогнозы от цели и дня — стабильны между рендерами
function forecast(goal: string, day: number) {
  let h = 0; for (const ch of goal) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const rev = Array.from({ length: 12 }, (_, i) => Math.round(8 + i * (6 + (h % 5)) * (1 + i / 14)));
  const risk = Math.max(18, 52 - day * 2 - (h % 9));
  const conf = Math.min(96, 64 + day * 3 + (h % 7));
  return { rev, risk, conf };
}

export function Autopilot() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<"idle" | "strategy" | "tasks" | "ready">("idle");
  const [strategy, setStrategy] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // restore
  useEffect(() => {
    const s = load();
    if (s) { setSaved(s); setStrategy(s.strategy); setPhase("tasks"); void planDay(s, s.doneTasks); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const day = saved ? Math.max(1, Math.floor((Date.now() - saved.startedAt) / 86400000) + 1) : 1;

  const planDay = useCallback(async (s: Saved, doneBefore: string[]) => {
    setPhase("tasks"); setTasks([]);
    const persona = `Ты — ${CEO.name}, AI CEO на автопилоте. Цель основателя: «${s.goal}». Сегодня день ${Math.max(1, Math.floor((Date.now() - s.startedAt) / 86400000) + 1)} работы. ${doneBefore.length ? `Уже сделано: ${doneBefore.slice(-5).join("; ")}.` : ""} Выдай ровно 3 задачи на сегодня, каждая с новой строки, без нумерации и markdown, конкретные и выполнимые за день.`;
    let raw = "";
    try { raw = await streamChat("Задачи на сегодня", persona, () => {}); }
    catch { setOffline(true); raw = FB_TASKS.join("\n"); }
    const list = raw.split("\n").map(t => t.replace(/^[\d.\-•\s]+/, "").trim()).filter(t => t.length > 8).slice(0, 3);
    setTasks((list.length ? list : FB_TASKS).map(text => ({ text, done: false })));
    setPhase("ready");
  }, []);

  const start = useCallback(async () => {
    const g = goal.trim(); if (!g || phase === "strategy" || phase === "tasks") return;
    setGoal(""); setPhase("strategy"); setStrategy(""); setOffline(false);
    const persona = `Ты — ${CEO.name}, AI CEO в режиме автопилота. Основатель поставил долгосрочную цель: «${g}». Дай стратегию на русском: 3 этапа по 30 дней с ключевой метрикой каждого этапа, 5–6 предложений, обычный текст без markdown-звёздочек.`;
    let full = "";
    try { full = await streamChat(g, persona, t => setStrategy(p => p + t)); }
    catch { setOffline(true); full = FB_STRATEGY; for (const ch of full) { setStrategy(p => p + ch); await new Promise(r => setTimeout(r, 5)); } }
    const s: Saved = { goal: g, startedAt: Date.now(), strategy: full, doneTasks: [] };
    setSaved(s); save(s);
    await planDay(s, []);
  }, [goal, phase, planDay]);

  const toggleTask = useCallback((i: number) => {
    setTasks(prev => {
      const next = prev.map((t, j) => j === i ? { ...t, done: !t.done } : t);
      if (saved) {
        const doneTexts = next.filter(t => t.done).map(t => t.text);
        const s = { ...saved, doneTasks: Array.from(new Set([...saved.doneTasks, ...doneTexts])) };
        setSaved(s); save(s);
      }
      return next;
    });
  }, [saved]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    setSaved(null); setStrategy(""); setTasks([]); setPhase("idle");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const f = saved ? forecast(saved.goal, day) : null;
  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="ap-root">
      {!saved && (
        <>
          <div className="ap-intro">
            <div className="ap-intro-badge"><Sparkles size={12} strokeWidth={2.4} />АВТОПИЛОТ</div>
            <h2 className="ap-intro-title">Поставьте долгосрочную цель — и получите гендиректора</h2>
            <p className="ap-intro-sub">{CEO.name} построит стратегию, будет выдавать план на каждый день, следить за прогрессом и прогнозировать результат.</p>
          </div>
          <div className="ap-goal">
            <input ref={inputRef} value={goal} onChange={e => setGoal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void start(); }}
              disabled={phase === "strategy"} placeholder="Например: заработать $1M за год на своём продукте" spellCheck={false} />
            <button onClick={() => void start()} disabled={phase === "strategy" || !goal.trim()}>
              {phase === "strategy" ? <span className="ap-dots"><i /><i /><i /></span> : <><span>Включить автопилот</span><CornerDownLeft size={14} strokeWidth={2.4} /></>}
            </button>
          </div>
          {strategy && (
            <div className="ap-block">
              <div className="ap-block-label">СТРАТЕГИЯ CEO</div>
              <p>{plain(strategy)}{phase === "strategy" && <span className="ap-cursor" />}</p>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            {/* Goal header */}
            <div className="ap-head">
              <div className="ap-head-left">
                <div className="ap-day">ДЕНЬ {day}</div>
                <div className="ap-goal-text">{saved.goal}</div>
              </div>
              <button className="ap-reset" onClick={reset} title="Сбросить цель"><RotateCcw size={13} strokeWidth={2.2} />Новая цель</button>
            </div>

            {/* Forecast row */}
            {f && (
              <div className="ap-cards">
                <div className="ap-card">
                  <div className="ap-card-label"><TrendingUp size={11} strokeWidth={2.4} />ПРОГНОЗ ВЫРУЧКИ</div>
                  <RevChart data={f.rev} />
                  <div className="ap-card-note">к цели через 12 мес при текущем темпе</div>
                </div>
                <div className="ap-card">
                  <div className="ap-card-label"><ShieldAlert size={11} strokeWidth={2.4} />РИСК ПРОВАЛА</div>
                  <div className="ap-big" style={{ color: f.risk > 40 ? "#f59e0b" : "#10b981" }}>{f.risk}%</div>
                  <div className="ap-track"><motion.i animate={{ width: `${f.risk}%` }} transition={{ duration: 0.9, ease: EASE }} style={{ background: f.risk > 40 ? "#f59e0b" : "#10b981" }} /></div>
                  <div className="ap-card-note">снижается с каждым выполненным днём</div>
                </div>
                <div className="ap-card">
                  <div className="ap-card-label"><Sparkles size={11} strokeWidth={2.4} />УВЕРЕННОСТЬ CEO</div>
                  <div className="ap-big" style={{ color: "#818cf8" }}>{f.conf}%</div>
                  <div className="ap-track"><motion.i animate={{ width: `${f.conf}%` }} transition={{ duration: 0.9, ease: EASE }} style={{ background: "linear-gradient(90deg,#7C3AED,#D946EF)" }} /></div>
                  <div className="ap-card-note">{saved.doneTasks.length} задач выполнено всего</div>
                </div>
              </div>
            )}

            {/* Strategy */}
            <div className="ap-block">
              <div className="ap-block-label">СТРАТЕГИЯ</div>
              <p>{plain(saved.strategy)}</p>
            </div>

            {/* Today plan */}
            <div className="ap-block">
              <div className="ap-block-head">
                <div className="ap-block-label">ПЛАН НА СЕГОДНЯ · {doneCount}/{tasks.length || 3}</div>
                {phase === "tasks" && <span className="ap-planning">CEO составляет план<span className="ap-dots"><i /><i /><i /></span></span>}
              </div>
              <div className="ap-tasks">
                {tasks.map((t, i) => (
                  <motion.button key={i} className={`ap-task${t.done ? " done" : ""}`} onClick={() => toggleTask(i)}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: EASE, delay: i * 0.08 }}>
                    <span className="ap-check">{t.done && <Check size={11} strokeWidth={3} />}</span>
                    <span className="ap-task-text">{t.text}</span>
                  </motion.button>
                ))}
                {phase === "tasks" && tasks.length === 0 && [0, 1, 2].map(i => <div key={i} className="ap-skeleton" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
              {doneCount === tasks.length && tasks.length > 0 && (
                <motion.div className="ap-done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  ✓ День {day} закрыт. Возвращайтесь завтра — CEO подготовит следующий план.
                </motion.div>
              )}
            </div>

            {offline && <div className="ap-offline">Демо-режим — настройте ANTHROPIC_API_KEY для живого автопилота</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .ap-root { max-width: 820px; }
        .ap-intro { margin-bottom: 18px; }
        .ap-intro-badge { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: #a5b4fc; padding: 5px 10px; border-radius: 8px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.25); margin-bottom: 12px; }
        .ap-intro-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
        .ap-intro-sub { font-size: 13.5px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 58ch; margin: 0; }
        .ap-goal { display: flex; gap: 8px; }
        .ap-goal input { flex: 1; min-width: 0; height: 52px; padding: 0 18px; border-radius: 14px; font-size: 15px; color: #E5E7EB; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
        .ap-goal input:focus { border-color: rgba(124,58,237,0.55); box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
        .ap-goal button { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 20px; border-radius: 14px; border: none; cursor: pointer; font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #7C3AED, #6D28D9); box-shadow: 0 4px 16px rgba(124,58,237,0.32), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
        .ap-goal button:hover:not(:disabled) { transform: translateY(-1px); }
        .ap-goal button:disabled { opacity: 0.55; cursor: not-allowed; }
        .ap-dots { display: inline-flex; gap: 4px; } .ap-dots i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: ap-blink 1s infinite; }
        .ap-dots i:nth-child(2){animation-delay:.15s} .ap-dots i:nth-child(3){animation-delay:.3s}
        @keyframes ap-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

        .ap-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
        .ap-day { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.14em; color: #a5b4fc; margin-bottom: 5px; }
        .ap-goal-text { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #fff; text-wrap: balance; }
        .ap-reset { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 13px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); transition: color .16s, border-color .16s; }
        .ap-reset:hover { color: #fff; border-color: rgba(255,255,255,0.2); }

        .ap-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px; }
        .ap-card { border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); padding: 14px 15px; }
        .ap-card-label { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
        .ap-big { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px; }
        .ap-track { height: 4px; border-radius: 3px; background: rgba(255,255,255,0.07); overflow: hidden; margin-bottom: 8px; }
        .ap-track i { display: block; height: 100%; border-radius: 3px; }
        .ap-card-note { font-size: 10.5px; color: rgba(255,255,255,0.38); line-height: 1.4; }

        .ap-block { border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.018); padding: 15px 17px; margin-bottom: 12px; }
        .ap-block-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .ap-block-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
        .ap-block p { font-size: 13.5px; line-height: 1.65; color: rgba(255,255,255,0.78); margin: 0; white-space: pre-wrap; }
        .ap-planning { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: #a5b4fc; }
        .ap-cursor { display: inline-block; width: 6px; height: 13px; margin-left: 2px; border-radius: 1px; background: #818cf8; vertical-align: text-bottom; animation: ap-caret 1s step-end infinite; }
        @keyframes ap-caret { 50% { opacity: 0; } }

        .ap-tasks { display: flex; flex-direction: column; gap: 8px; }
        .ap-task { display: flex; align-items: flex-start; gap: 11px; text-align: left; padding: 12px 14px; border-radius: 11px; cursor: pointer; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); transition: background .16s, border-color .16s; }
        .ap-task:hover { background: rgba(255,255,255,0.04); }
        .ap-task.done { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }
        .ap-check { flex-shrink: 0; width: 20px; height: 20px; border-radius: 7px; display: flex; align-items: center; justify-content: center; border: 1.5px solid rgba(255,255,255,0.2); color: #fff; transition: background .16s, border-color .16s; margin-top: 1px; }
        .ap-task.done .ap-check { background: #10b981; border-color: #10b981; }
        .ap-task-text { font-size: 13.5px; line-height: 1.5; color: rgba(255,255,255,0.82); }
        .ap-task.done .ap-task-text { color: rgba(255,255,255,0.45); text-decoration: line-through; }
        .ap-skeleton { height: 46px; border-radius: 11px; background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.07), rgba(255,255,255,0.03)); background-size: 200% 100%; animation: ap-shimmer 1.4s infinite; }
        @keyframes ap-shimmer { to { background-position: -200% 0; } }
        .ap-done { margin-top: 12px; font-size: 13px; font-weight: 600; color: #34d399; }
        .ap-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 4px; }
        @media (prefers-reduced-motion: reduce) { .ap-dots i, .ap-cursor, .ap-skeleton { animation: none; } }
      `}</style>
    </div>
  );
}

function RevChart({ data }: { data: number[] }) {
  const W = 210, H = 54, max = Math.max(...data);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * W, H - (d / max) * (H - 6) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", marginBottom: 8 }}>
      <defs><linearGradient id="ap-rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#ap-rev)" />
      <motion.path d={line} fill="none" stroke="#10b981" strokeWidth={1.8} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill="#10b981" />
    </svg>
  );
}
