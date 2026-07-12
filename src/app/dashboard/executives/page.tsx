"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CornerDownLeft } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Монолог CEO о проекте и команде ──────────────────────────────────────────
const INTRO = `Здравствуйте. Я — Sophia Rivers, CEO вашей AI-компании Apex.

Apex — это не ещё один чат-бот. Это целая цифровая компания, которую вы наняли одним кликом: стратегия, финансы, маркетинг, операции и технологии — всё под одной крышей и работает на вашу цель.

Как мы устроены. Я принимаю вашу задачу и распределяю её по четырём отделам. Marcus Chen (CFO) считает деньги: юнит-экономику, прогнозы и риски. Elena Torres (CMO) отвечает за рост: спрос, каналы, бренд. James Wright (COO) превращает планы в процессы, которые не разваливаются. Aiden Park (CTO) решает, что и как строить технически. У каждого из них — своя команда специалистов, всего нас двадцать.

Что вы получаете. Вы описываете задачу словами — мы возвращаем решение: с цифрами, шагами и ответственными. Стратегию — в Командном центре, разбор любого вопроса — в чате с любым из нас, заметки и знания — в вашем «мозге» проекта.

Спросите меня о чём угодно — я на связи.`;

const SUGGESTIONS = [
  "Что умеет Apex?",
  "Кто в команде и за что отвечает?",
  "С чего мне начать?",
];

const CEO_FALLBACK = "Коротко: Apex — ваша AI-компания. Опишите цель — я распределю работу по отделам и верну решение с шагами. Живой диалог включится после настройки ANTHROPIC_API_KEY.";

export default function CeoPage() {
  const ceo = TEAM_BY_SLUG.ceo;
  const reduce = useReducedMotion();

  // печатаем монолог
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    if (reduce) { setTyped(INTRO); setTyping(false); return; }
    let i = 0; let alive = true;
    const tick = () => {
      if (!alive) return;
      i = Math.min(i + 3, INTRO.length);
      setTyped(INTRO.slice(0, i));
      if (i < INTRO.length) setTimeout(tick, 12); else setTyping(false);
    };
    const t = setTimeout(tick, 600);
    return () => { alive = false; clearTimeout(t); };
  }, [reduce]);

  // вопрос к CEO
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async () => {
    const question = q.trim(); if (!question || busy) return;
    setQ(""); setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — Sophia Rivers, CEO AI-компании Apex. Команда: CFO Marcus Chen (финансы), CMO Elena Torres (маркетинг и рост), COO James Wright (операции), CTO Aiden Park (технологии), у каждого своя команда специалистов — всего 20 агентов. Apex решает бизнес-задачи основателя: стратегия, финансы, рост, процессы, продукт. Отвечай как CEO — тепло, уверенно, по делу, 4–7 предложений, обычный текст без markdown. Если спрашивают о команде — называй людей по именам и зонам ответственности.`;
    try { await streamChat(question, persona, t => setAnswer(prev => prev + t)); }
    catch { setOffline(true); for (const ch of CEO_FALLBACK) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); } }
    setBusy(false);
    inputRef.current?.focus();
  }, [q, busy]);

  const specialists = TEAM.filter(m => m.tier === "specialist").length;

  return (
    <div className="ceo-root">
      <div className="ceo-ambient" aria-hidden />

      <div className="ceo-wrap">
        {/* Большой CEO */}
        <motion.div className="ceo-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <div className="ceo-av-wrap">
            <motion.span className="ceo-av" style={{ background: `linear-gradient(135deg,${ceo.g[0]},${ceo.g[1]})` }}
              animate={reduce ? undefined : { y: [0, -6, 0] }} transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              {ceo.ab}
            </motion.span>
            {!reduce && <motion.span className="ceo-av-ring" animate={{ scale: [1, 1.18], opacity: [0.45, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }} />}
            <span className="ceo-status"><span className="ceo-status-dot" />онлайн</span>
          </div>
          <h1 className="ceo-name">{ceo.name}</h1>
          <div className="ceo-role">CEO · руководит вашей AI-компанией</div>
        </motion.div>

        {/* Монолог */}
        <motion.div className="ceo-speech" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}>
          <p className="ceo-speech-text">{typed}{typing && <span className="ceo-caret" />}</p>
        </motion.div>

        {/* Команда — кратко, как часть рассказа */}
        <motion.div className="ceo-team" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}>
          <div className="ceo-team-label">МОЯ КОМАНДА</div>
          <div className="ceo-team-row">
            {C_LEVEL.filter(m => m.slug !== "ceo").map((m, i) => {
              const n = reportsOf(m.slug).filter(x => x.tier === "specialist").length;
              return (
                <motion.div key={m.slug} className="ceo-mate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.5 + i * 0.08 }}>
                  <span className="ceo-mate-av" style={{ background: `linear-gradient(135deg,${m.g[0]},${m.g[1]})` }}>{m.ab}</span>
                  <span className="ceo-mate-name">{m.name}</span>
                  <span className="ceo-mate-role" style={{ color: m.c }}>{m.role} · {m.title}</span>
                  <span className="ceo-mate-n">+{n} специалиста в команде</span>
                </motion.div>
              );
            })}
          </div>
          <div className="ceo-team-total">Всего в Apex — {TEAM.length} AI-сотрудников: я, 4 директора и {specialists} специалистов.</div>
        </motion.div>

        {/* Спросить CEO */}
        <motion.div className="ceo-ask-block" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}>
          <div className="ceo-ask">
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void submit(); }}
              disabled={busy} placeholder="Спросите меня о проекте, команде или вашей задаче…" spellCheck={false} />
            <button onClick={() => void submit()} disabled={busy || !q.trim()} aria-label="Отправить">
              {busy ? <span className="ceo-dots"><i /><i /><i /></span> : <CornerDownLeft size={15} strokeWidth={2.4} />}
            </button>
          </div>
          {!answer && !busy && (
            <div className="ceo-suggests">
              {SUGGESTIONS.map(sg => (
                <button key={sg} onClick={() => { setQ(sg); requestAnimationFrame(() => inputRef.current?.focus()); }}>{sg}</button>
              ))}
            </div>
          )}
          <AnimatePresence>
            {(answer || busy) && (
              <motion.div className="ceo-answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <div className="ceo-answer-head">
                  <span className="ceo-answer-av" style={{ background: `linear-gradient(135deg,${ceo.g[0]},${ceo.g[1]})` }}>{ceo.ab}</span>
                  <span>{ceo.name}</span>
                </div>
                <p>{answer}{busy && <span className="ceo-caret" />}</p>
                {offline && !busy && <div className="ceo-offline">демо-ответ · настройте ANTHROPIC_API_KEY</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <CeoStyles />
    </div>
  );
}

function CeoStyles() {
  return (
    <style jsx global>{`
      .ceo-root { position: relative; background: #05060A; min-height: 100%; overflow: hidden; }
      .ceo-ambient { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: min(820px, 100%); height: 520px; pointer-events: none;
        background:
          radial-gradient(50% 55% at 50% 0%, rgba(99,102,241,0.14), transparent 70%),
          radial-gradient(28% 30% at 50% 8%, rgba(129,140,248,0.10), transparent 75%);
      }

      .ceo-wrap { position: relative; max-width: 720px; margin: 0 auto; padding: 56px 24px 80px; }

      /* герой */
      .ceo-hero { display: flex; flex-direction: column; align-items: center; text-align: center; }
      .ceo-av-wrap { position: relative; margin-bottom: 20px; }
      .ceo-av { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; width: 128px; height: 128px; border-radius: 36px;
        color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 38px; font-weight: 800;
        box-shadow: 0 24px 70px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.08), inset 0 2px 0 rgba(255,255,255,0.25); }
      .ceo-av-ring { position: absolute; inset: -8px; border-radius: 42px; border: 1.5px solid rgba(129,140,248,0.7); pointer-events: none; }
      .ceo-status { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); z-index: 2; display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(52,211,153,0.95);
        background: #0A0F0D; border: 1px solid rgba(16,185,129,0.35); border-radius: 999px; padding: 4px 11px; white-space: nowrap; }
      .ceo-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: ceo-pulse 2s ease-in-out infinite; }
      @keyframes ceo-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      .ceo-name { font-size: clamp(30px, 4.5vw, 42px); font-weight: 800; letter-spacing: -0.03em; color: #F3F4F6; margin: 0 0 8px; }
      .ceo-role { font-size: 14.5px; color: rgba(255,255,255,0.5); }

      /* монолог */
      .ceo-speech { margin-top: 30px; border-radius: 22px; border: 1px solid rgba(255,255,255,0.08); padding: 28px 30px;
        background: linear-gradient(165deg, rgba(99,102,241,0.06), rgba(255,255,255,0.015) 60%);
        box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05); }
      .ceo-speech-text { font-size: 15.5px; line-height: 1.85; color: rgba(255,255,255,0.82); margin: 0; white-space: pre-wrap; min-height: 120px; }
      .ceo-caret { display: inline-block; width: 8px; height: 16px; margin-left: 3px; border-radius: 1px; background: #818cf8; vertical-align: text-bottom; animation: ceo-caret 1s step-end infinite; }
      @keyframes ceo-caret { 50% { opacity: 0; } }

      /* команда */
      .ceo-team { margin-top: 26px; }
      .ceo-team-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.2em; color: rgba(255,255,255,0.35); margin-bottom: 14px; }
      .ceo-team-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
      .ceo-mate { display: flex; flex-direction: column; gap: 3px; padding: 15px 16px; border-radius: 16px;
        background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04); }
      .ceo-mate-av { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff;
        font-family: var(--font-geist-mono), monospace; font-size: 12px; font-weight: 800; margin-bottom: 8px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.22); }
      .ceo-mate-name { font-size: 13.5px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: -0.01em; }
      .ceo-mate-role { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.05em; }
      .ceo-mate-n { font-size: 10.5px; color: rgba(255,255,255,0.35); margin-top: 4px; }
      .ceo-team-total { margin-top: 14px; font-size: 12.5px; color: rgba(255,255,255,0.42); }

      /* спросить CEO */
      .ceo-ask-block { margin-top: 30px; }
      .ceo-ask { display: flex; gap: 8px; }
      .ceo-ask input { flex: 1; min-width: 0; height: 52px; padding: 0 18px; border-radius: 15px; font-size: 14.5px; color: #E5E7EB;
        background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
      .ceo-ask input::placeholder { color: rgba(255,255,255,0.3); }
      .ceo-ask input:focus { border-color: rgba(99,102,241,0.55); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
      .ceo-ask button { flex-shrink: 0; width: 52px; height: 52px; border-radius: 15px; border: none; cursor: pointer; color: #fff;
        display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #6366f1, #4f46e5);
        box-shadow: 0 4px 16px rgba(99,102,241,0.32), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .ceo-ask button:hover:not(:disabled) { transform: translateY(-1px); }
      .ceo-ask button:disabled { opacity: 0.5; cursor: not-allowed; }
      .ceo-dots { display: inline-flex; gap: 4px; } .ceo-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: ceo-blink 1s infinite; }
      .ceo-dots i:nth-child(2){animation-delay:.15s} .ceo-dots i:nth-child(3){animation-delay:.3s}
      @keyframes ceo-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

      .ceo-suggests { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
      .ceo-suggests button { padding: 9px 14px; border-radius: 999px; cursor: pointer; font-size: 12.5px; color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); transition: background .16s, border-color .16s, transform .16s; }
      .ceo-suggests button:hover { background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }

      .ceo-answer { margin-top: 14px; border-radius: 16px; border: 1px solid rgba(99,102,241,0.25); padding: 18px 20px;
        background: linear-gradient(160deg, rgba(99,102,241,0.07), rgba(255,255,255,0.015) 70%); }
      .ceo-answer-head { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.85); }
      .ceo-answer-av { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff;
        font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
      .ceo-answer p { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.82); margin: 0; white-space: pre-wrap; }
      .ceo-offline { margin-top: 10px; font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); }

      @media (max-width: 560px) {
        .ceo-wrap { padding-top: 40px; }
        .ceo-av { width: 104px; height: 104px; border-radius: 30px; font-size: 31px; }
        .ceo-speech { padding: 22px 20px; }
        .ceo-speech-text { font-size: 14.5px; }
      }
      @media (prefers-reduced-motion: reduce) { .ceo-caret, .ceo-dots i, .ceo-status-dot { animation: none; } }
    `}</style>
  );
}
