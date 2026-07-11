"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, ArrowUpRight } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM_BY_SLUG } from "@/lib/team";
import { getBoardMetrics, BOARD_TIMELINE } from "@/lib/board";

const EASE = [0.22, 1, 0.36, 1] as const;

// Совет = ключевые директора, участвующие в дебатах
const BOARD = ["ceo", "cfo", "cmo", "cto", "coo", "legal"].map(s => TEAM_BY_SLUG[s]);

const EXAMPLES = [
  "Стоит ли поднимать цены на 20%?",
  "Выходить ли на рынок Германии?",
  "Нанимать ли 5 человек в продажи сейчас?",
];

// маршрутизация вопроса к 3 профильным директорам
function pickDebaters(q: string): string[] {
  const s = q.toLowerCase();
  const picks = new Set<string>();
  if (/(финанс|деньг|бюджет|цен|стоимост|инвест|прибыл|выручк|окупа|runway)/.test(s)) picks.add("cfo");
  if (/(маркет|клиент|прода|рост|реклам|бренд|канал|конверси|аудитор)/.test(s)) picks.add("cmo");
  if (/(продукт|технолог|разработ|ai|ии|фич|интеграц|платформ|данн)/.test(s)) picks.add("cto");
  if (/(команд|найм|сотрудник|процесс|операц|масштаб)/.test(s)) picks.add("coo");
  if (/(риск|юрид|право|договор|комплаенс|регул)/.test(s)) picks.add("legal");
  const arr = Array.from(picks).slice(0, 3);
  for (const d of ["cfo", "cmo", "cto"]) if (arr.length < 3 && !arr.includes(d)) arr.push(d);
  return arr;
}

const FB: Record<string, string> = {
  cfo: "ПРОТИВ поспешности. Считаем юнит-экономику: если LTV/CAC ниже 3 — идея съест кэш быстрее, чем даст выручку. Предлагаю пилот с жёстким лимитом бюджета и точкой пересмотра через 30 дней.",
  cmo: "ЗА, но с фокусом. Спрос проверяем дешёвым тестом: лендинг + 2 канала, решение по данным конверсии. Выше бенчмарка — масштабируем.",
  cto: "РИСКОВАННО без прототипа. Технически реализуемо, но закладываю 2–3 недели на MVP. Начинаем с самого узкого сценария, проверяющего гипотезу.",
  coo: "ЗА при готовых процессах. Нужны владелец, SLA и чек-лист. Иначе рост превратится в хаос поддержки.",
  legal: "Проверяю риски: юридических блокеров для запуска нет при поэтапном входе. Стоп-лосс по резерву обязателен.",
};
const FB_VERDICT = "Вердикт совета: гипотеза достойна проверки, но входим поэтапно. Шаг 1 — дешёвый тест спроса за 7–14 дней с жёстким лимитом бюджета. Шаг 2 — если метрики выше порога, собираем минимальный MVP. Шаг 3 — пересмотр через 30 дней по фактическим цифрам. Полный анализ — после подключения ANTHROPIC_API_KEY.";

type Msg = { slug: string; text: string; done: boolean };
type Session = { q: string; phase: "route" | "debate" | "verdict" | "done"; debaters: string[]; current?: string; msgs: Msg[]; verdict: string; offline: boolean };

const stance = (t: string): { l: string; c: string } | null => {
  const w = t.trimStart().slice(0, 12).toUpperCase();
  if (w.startsWith("ЗА")) return { l: "ЗА", c: "#10b981" };
  if (w.startsWith("ПРОТИВ")) return { l: "ПРОТИВ", c: "#f43f5e" };
  if (w.startsWith("РИСК")) return { l: "РИСК", c: "#f59e0b" };
  return null;
};

export default function BoardPage() {
  const [q, setQ] = useState("");
  const [s, setS] = useState<Session | null>(null);
  const [metrics] = useState(() => getBoardMetrics());
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = s !== null && s.phase !== "done";

  useEffect(() => { inputRef.current?.focus(); }, []);

  const appendLast = useCallback((t: string) => setS(p => {
    if (!p || !p.msgs.length) return p;
    const msgs = [...p.msgs]; msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: msgs[msgs.length - 1].text + t };
    return { ...p, msgs };
  }), []);

  const run = useCallback(async (question: string) => {
    const debaters = pickDebaters(question);
    setS({ q: question, phase: "route", debaters, msgs: [], verdict: "", offline: false });
    await new Promise(r => setTimeout(r, 900));
    const opinions: { slug: string; text: string }[] = [];
    let offline = false;

    for (const slug of debaters) {
      const m = TEAM_BY_SLUG[slug];
      setS(p => p && ({ ...p, phase: "debate", current: slug, msgs: [...p.msgs, { slug, text: "", done: false }] }));
      const prev = opinions.map(o => `${TEAM_BY_SLUG[o.slug].name} (${TEAM_BY_SLUG[o.slug].title}): ${o.text}`).join("\n\n");
      const persona = `Ты — ${m.name}, ${m.title} в совете директоров Apex AI. Основатель спросил совет. ${prev ? `Мнения коллег до тебя:\n${prev}\n\nМожешь согласиться или аргументированно поспорить — это дебаты.` : "Ты выступаешь первым."} Ответь на русском, максимум 4 предложения. Начни с позиции одним словом заглавными (ЗА / ПРОТИВ / РИСКОВАННО), затем аргументы из твоей зоны. Конкретика, без markdown.`;
      let text = "";
      if (!offline) { try { text = await streamChat(question, persona, appendLast); } catch { offline = true; } }
      if (offline) { text = FB[slug] ?? FB.cfo; for (const ch of text) { appendLast(ch); await new Promise(r => setTimeout(r, 7)); } }
      opinions.push({ slug, text });
      setS(p => { if (!p) return p; const msgs = [...p.msgs]; msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], done: true }; return { ...p, msgs, offline }; });
      await new Promise(r => setTimeout(r, 250));
    }

    setS(p => p && ({ ...p, phase: "verdict", current: "ceo" }));
    const ceoPersona = `Ты — Sophia Rivers, CEO совета Apex AI. Совет провёл дебаты:\n${opinions.map(o => `${TEAM_BY_SLUG[o.slug].name}: ${o.text}`).join("\n\n")}\n\nВынеси финальный вердикт на русском: взвесь споры, прими однозначное решение и дай 2–3 конкретных шага. Максимум 6 предложений, без markdown.`;
    if (!offline) { try { await streamChat(question, ceoPersona, t => setS(p => p && ({ ...p, verdict: p.verdict + t }))); } catch { offline = true; } }
    if (offline) { for (const ch of FB_VERDICT) { setS(p => p && ({ ...p, verdict: p.verdict + ch })); await new Promise(r => setTimeout(r, 7)); } }
    setS(p => p && ({ ...p, phase: "done", current: undefined, offline }));
  }, [appendLast]);

  const submit = useCallback(() => {
    const question = q.trim();
    if (!question || busy) return;
    setQ(""); void run(question);
  }, [q, busy, run]);

  const ceo = TEAM_BY_SLUG.ceo;

  return (
    <div className="bd-wrap">
      <div className="bd-head">
        <div>
          <div className="bd-eyebrow">СОВЕТ ДИРЕКТОРОВ · КОЛЛЕКТИВНЫЙ ИНТЕЛЛЕКТ</div>
          <h1 className="bd-title">Спросите совет</h1>
          <p className="bd-sub">CEO направит вопрос профильным директорам. Они обсудят его между собой и вынесут общий вердикт.</p>
        </div>
      </div>

      <div className="bd-body">
        {/* ── SESSION ── */}
        <section className="bd-session">
          {/* Ask */}
          <div className="bd-ask">
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submit(); }}
              disabled={busy} placeholder="Задайте стратегический вопрос…" spellCheck={false} />
            <button onClick={submit} disabled={busy || !q.trim()} aria-label="Спросить совет">
              {busy ? <span className="bd-dots"><i /><i /><i /></span> : <><span>Спросить</span><CornerDownLeft size={14} strokeWidth={2.4} /></>}
            </button>
          </div>

          {!s && (
            <div className="bd-empty">
              <div className="bd-empty-label">ПРИМЕРЫ</div>
              {EXAMPLES.map(e => (
                <button key={e} className="bd-example" onClick={() => { setQ(e); requestAnimationFrame(() => inputRef.current?.focus()); }}>
                  <span>{e}</span><ArrowUpRight size={13} strokeWidth={2} />
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {s && (
              <motion.div className="bd-thread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <div className="bd-q">{s.q}</div>

                <div className="bd-route">
                  <span className="bd-route-label">{s.phase === "route" ? "CEO распределяет вопрос" : "В обсуждении"}</span>
                  <div className="bd-route-chips">
                    {s.debaters.map(d => {
                      const m = TEAM_BY_SLUG[d];
                      return <span key={d} className="bd-chip" style={{ color: m.c, borderColor: `${m.c}44` }}>{m.role}</span>;
                    })}
                  </div>
                </div>

                {s.msgs.map((msg, i) => {
                  const m = TEAM_BY_SLUG[msg.slug];
                  const st = stance(msg.text);
                  return (
                    <motion.div key={i} className="bd-msg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE }}>
                      <span className="bd-msg-avatar" style={{ color: m.c, borderColor: `${m.c}44` }}>{m.ab}</span>
                      <div className="bd-msg-body">
                        <div className="bd-msg-head">
                          <span className="bd-msg-name">{m.name}</span>
                          <span className="bd-msg-role">{m.title}</span>
                          {st && <span className="bd-stance" style={{ color: st.c, borderColor: `${st.c}55` }}>{st.l}</span>}
                        </div>
                        <p className="bd-msg-text">{msg.text}{!msg.done && <span className="bd-cursor" style={{ background: m.c }} />}</p>
                      </div>
                    </motion.div>
                  );
                })}

                {(s.phase === "verdict" || s.phase === "done") && (
                  <motion.div className="bd-verdict" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE }}>
                    <div className="bd-verdict-head">
                      <span className="bd-msg-avatar" style={{ color: ceo.c, borderColor: `${ceo.c}55` }}>{ceo.ab}</span>
                      <div>
                        <div className="bd-msg-name">Вердикт · {ceo.name}</div>
                        <div className="bd-msg-role">CEO · синтез совета</div>
                      </div>
                    </div>
                    <p className="bd-msg-text">{s.verdict}{s.phase === "verdict" && <span className="bd-cursor" style={{ background: ceo.c }} />}</p>
                    {s.offline && s.phase === "done" && <div className="bd-offline">Демо-режим — настройте ANTHROPIC_API_KEY для живого анализа</div>}
                    {s.phase === "done" && (
                      <button className="bd-reset" onClick={() => { setS(null); requestAnimationFrame(() => inputRef.current?.focus()); }}>Новый вопрос</button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── RAIL ── */}
        <aside className="bd-rail">
          <div className="bd-card">
            <div className="bd-card-label">СОСТАВ СОВЕТА</div>
            {BOARD.map(m => {
              const active = s?.debaters.includes(m.slug);
              const speaking = s?.current === m.slug;
              return (
                <div key={m.slug} className="bd-member" style={{ opacity: s && !active ? 0.4 : 1 }}>
                  <span className="bd-member-avatar" style={{ color: m.c, borderColor: speaking ? m.c : `${m.c}33` }}>{m.ab}</span>
                  <div className="bd-member-text">
                    <span className="bd-member-name">{m.name}</span>
                    <span className="bd-member-role">{m.role}</span>
                  </div>
                  {speaking && <span className="bd-speaking" style={{ background: m.c }} />}
                </div>
              );
            })}
          </div>

          <div className="bd-card">
            <div className="bd-card-label">БИЗНЕС-КОНТЕКСТ</div>
            <div className="bd-stats">
              <Stat v={`${metrics.healthIndex}%`} l="Health Index" accent="#818cf8" />
              <Stat v={`+${metrics.revenuePrediction}%`} l="Revenue MoM" accent="#10b981" />
              <Stat v={`${metrics.collaborationIndex}%`} l="Collaboration" accent="#818cf8" />
              <Stat v={`${metrics.decisionLatency}ms`} l="Decision latency" accent="#64748b" />
            </div>
          </div>

          <div className="bd-card">
            <div className="bd-card-label">ПОСЛЕДНИЕ РЕШЕНИЯ</div>
            {BOARD_TIMELINE.slice().reverse().map((e, i) => (
              <div key={i} className="bd-tl">
                <span className="bd-tl-dot" style={{ background: e.kind === "decision" ? "#818cf8" : e.kind === "risk" ? "#f43f5e" : "#10b981" }} />
                <span className="bd-tl-label">{e.label}</span>
                <span className="bd-tl-time">{e.t}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .bd-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 24px 56px; }
        .bd-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 8px; }
        .bd-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 6px; text-wrap: balance; }
        .bd-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 58ch; margin: 0 0 24px; }
        .bd-body { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 28px; align-items: start; }

        .bd-ask { display: flex; gap: 8px; }
        .bd-ask input { flex: 1; min-width: 0; height: 50px; padding: 0 16px; border-radius: 13px; font-size: 15px; color: #E5E7EB;
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
        .bd-ask input::placeholder { color: rgba(255,255,255,0.3); }
        .bd-ask input:focus { border-color: rgba(99,102,241,0.55); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .bd-ask button { flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; height: 50px; padding: 0 20px; border-radius: 13px; border: none; cursor: pointer;
          font-size: 13.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 4px 14px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform 0.15s ease, opacity 0.15s ease; }
        .bd-ask button:hover:not(:disabled) { transform: translateY(-1px); }
        .bd-ask button:active:not(:disabled) { transform: translateY(0); }
        .bd-ask button:disabled { opacity: 0.55; cursor: not-allowed; }
        .bd-dots { display: inline-flex; gap: 4px; }
        .bd-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: bd-blink 1s infinite; }
        .bd-dots i:nth-child(2){animation-delay:.15s} .bd-dots i:nth-child(3){animation-delay:.3s}
        @keyframes bd-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

        .bd-empty { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
        .bd-empty-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.3); margin-bottom: 2px; }
        .bd-example { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 16px; border-radius: 12px; cursor: pointer;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.72); font-size: 13.5px; text-align: left;
          transition: background 0.16s, border-color 0.16s, transform 0.16s; }
        .bd-example:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.13); transform: translateX(2px); }
        .bd-example svg { color: rgba(255,255,255,0.3); flex-shrink: 0; }

        .bd-thread { margin-top: 22px; display: flex; flex-direction: column; gap: 16px; }
        .bd-q { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
        .bd-route { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-bottom: 4px; }
        .bd-route-label { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); }
        .bd-route-chips { display: flex; gap: 6px; }
        .bd-chip { font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 7px; border: 1px solid; background: rgba(255,255,255,0.02); }

        .bd-msg { display: flex; gap: 12px; }
        .bd-msg-avatar { flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-geist-mono), monospace; font-size: 12px; font-weight: 800;
          background: rgba(255,255,255,0.025); border: 1px solid; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
        .bd-msg-body { flex: 1; min-width: 0; }
        .bd-msg-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .bd-msg-name { font-size: 13.5px; font-weight: 700; color: #fff; }
        .bd-msg-role { font-size: 11.5px; color: rgba(255,255,255,0.4); }
        .bd-stance { margin-left: auto; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 6px; border: 1px solid; }
        .bd-msg-text { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.78); margin: 0; white-space: pre-wrap; }
        .bd-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: bd-caret 1s step-end infinite; }
        @keyframes bd-caret { 50% { opacity: 0; } }

        .bd-verdict { margin-top: 4px; border-radius: 14px; border: 1px solid rgba(99,102,241,0.28); background: rgba(99,102,241,0.05); padding: 16px 18px; }
        .bd-verdict-head { display: flex; align-items: center; gap: 11px; margin-bottom: 10px; }
        .bd-reset { margin-top: 14px; height: 36px; padding: 0 16px; border-radius: 10px; cursor: pointer; font-size: 12.5px; font-weight: 600;
          color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); transition: color .16s, border-color .16s; }
        .bd-reset:hover { color: #fff; border-color: rgba(255,255,255,0.18); }
        .bd-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 10px; }

        .bd-rail { display: flex; flex-direction: column; gap: 14px; }
        .bd-card { border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.018); padding: 14px; }
        .bd-card-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); margin-bottom: 12px; }
        .bd-member { display: flex; align-items: center; gap: 10px; padding: 6px 0; transition: opacity 0.25s ease; }
        .bd-member-avatar { flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.02); border: 1px solid; transition: border-color 0.2s ease; }
        .bd-member-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .bd-member-name { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.85); line-height: 1.2; }
        .bd-member-role { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; color: rgba(255,255,255,0.4); }
        .bd-speaking { width: 6px; height: 6px; border-radius: 50%; animation: bd-pulse 1.4s infinite; }
        @keyframes bd-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }

        .bd-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .bd-stat { padding: 11px 12px; border-radius: 11px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
        .bd-stat-v { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
        .bd-stat-l { font-size: 10.5px; color: rgba(255,255,255,0.42); margin-top: 2px; }

        .bd-tl { display: flex; align-items: center; gap: 9px; padding: 5px 0; }
        .bd-tl-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .bd-tl-label { flex: 1; font-size: 12px; color: rgba(255,255,255,0.65); }
        .bd-tl-time { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(255,255,255,0.3); font-variant-numeric: tabular-nums; }

        @media (max-width: 900px) { .bd-body { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { .bd-dots i, .bd-cursor, .bd-speaking { animation: none; } }
      `}</style>
    </div>
  );
}

function Stat({ v, l, accent }: { v: string; l: string; accent: string }) {
  return (
    <div className="bd-stat">
      <div className="bd-stat-v" style={{ color: accent }}>{v}</div>
      <div className="bd-stat-l">{l}</div>
    </div>
  );
}
