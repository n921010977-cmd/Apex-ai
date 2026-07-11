"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, Check, Loader2, ArrowUpRight } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM_BY_SLUG } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

const BOARD = ["ceo", "cfo", "cmo", "cto", "coo", "legal"].map(s => TEAM_BY_SLUG[s]);
const EXAMPLES = [
  "Стоит ли поднимать цены на 20%?",
  "Выходить ли на рынок Германии в этом году?",
  "Как найти первые 100 платящих клиентов?",
];

// какие профессионалы берут задачу
function assign(q: string): string[] {
  const s = q.toLowerCase();
  const picks = new Set<string>();
  if (/(финанс|деньг|бюджет|цен|стоимост|инвест|прибыл|выручк|окупа|runway|маржа)/.test(s)) picks.add("cfo");
  if (/(маркет|клиент|прода|рост|реклам|бренд|канал|конверси|аудитор|привлеч)/.test(s)) picks.add("cmo");
  if (/(продукт|технолог|разработ|ai|ии|фич|интеграц|платформ|данн|mvp)/.test(s)) picks.add("cto");
  if (/(команд|найм|сотрудник|процесс|операц|масштаб|логист)/.test(s)) picks.add("coo");
  if (/(риск|юрид|право|договор|комплаенс|регул|лиценз)/.test(s)) picks.add("legal");
  const arr = Array.from(picks).slice(0, 3);
  for (const d of ["cfo", "cmo", "cto"]) if (arr.length < 3 && !arr.includes(d)) arr.push(d);
  return arr;
}

const FB: Record<string, string> = {
  cfo: "С финансовой стороны: считаю юнит-экономику. Если LTV/CAC ниже 3 — сначала чиним экономику, иначе рост только ускорит потерю денег. Предлагаю пилот с жёстким лимитом бюджета и точкой пересмотра через 30 дней.",
  cmo: "С точки зрения роста: спрос проверяем дешёвым тестом — лендинг плюс два канала, решение принимаем по данным конверсии. Выше бенчмарка — масштабируем, ниже — меняем оффер.",
  cto: "Технически: реализуемо, но закладываю 2–3 недели на MVP и интеграции. Начинаем с самого узкого сценария, который проверяет гипотезу — остальное не строим до подтверждённого спроса.",
  coo: "По операциям: до запуска нужны владелец процесса, SLA и чек-лист. Иначе рост превратится в хаос поддержки и убьёт качество.",
  legal: "По праву: юридических блокеров для запуска нет при поэтапном входе. Фиксируем договорную базу и стоп-лосс по резерву заранее.",
};
const FB_SOLUTION = "Решение совета: гипотеза достойна проверки, но входим поэтапно. Шаг 1 — дешёвый тест спроса за 7–14 дней с жёстким лимитом бюджета. Шаг 2 — если метрики выше порога, собираем минимальный MVP. Шаг 3 — пересмотр через 30 дней по фактическим цифрам. Живой анализ доступен после подключения ANTHROPIC_API_KEY.";

type Contribution = { slug: string; text: string; done: boolean };
type Session = { q: string; team: string[]; phase: "work" | "solution" | "done"; current?: string; contribs: Contribution[]; solution: string; offline: boolean };

export default function BoardPage() {
  const [q, setQ] = useState("");
  const [s, setS] = useState<Session | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = s !== null && s.phase !== "done";

  useEffect(() => { inputRef.current?.focus(); }, []);

  const appendLast = useCallback((t: string) => setS(p => {
    if (!p || !p.contribs.length) return p;
    const c = [...p.contribs]; c[c.length - 1] = { ...c[c.length - 1], text: c[c.length - 1].text + t };
    return { ...p, contribs: c };
  }), []);

  const run = useCallback(async (question: string) => {
    const team = assign(question);
    setS({ q: question, team, phase: "work", contribs: [], solution: "", offline: false });
    await new Promise(r => setTimeout(r, 700));
    const opinions: { slug: string; text: string }[] = [];
    let offline = false;

    for (const slug of team) {
      const m = TEAM_BY_SLUG[slug];
      setS(p => p && ({ ...p, current: slug, contribs: [...p.contribs, { slug, text: "", done: false }] }));
      const prev = opinions.map(o => `${TEAM_BY_SLUG[o.slug].name}: ${o.text}`).join("\n\n");
      const persona = `Ты — ${m.name}, ${m.title} в совете директоров Apex AI. Основатель принёс задачу. ${prev ? `Коллеги уже высказались:\n${prev}\n\nДополни или аргументированно поспорь.` : ""} Дай профессиональный разбор строго из своей зоны ответственности: 3–4 предложения, конкретика и цифры, обычный текст без markdown.`;
      let text = "";
      if (!offline) { try { text = await streamChat(question, persona, appendLast); } catch { offline = true; } }
      if (offline) { text = FB[slug] ?? FB.cfo; for (const ch of text) { appendLast(ch); await new Promise(r => setTimeout(r, 6)); } }
      opinions.push({ slug, text });
      setS(p => { if (!p) return p; const c = [...p.contribs]; c[c.length - 1] = { ...c[c.length - 1], done: true }; return { ...p, contribs: c, offline }; });
      await new Promise(r => setTimeout(r, 200));
    }

    setS(p => p && ({ ...p, phase: "solution", current: "ceo" }));
    const ceoPersona = `Ты — Sophia Rivers, CEO совета Apex AI. Профессионалы разобрали задачу:\n${opinions.map(o => `${TEAM_BY_SLUG[o.slug].name}: ${o.text}`).join("\n\n")}\n\nСведи в единое решение для основателя на русском: короткий вывод и 3 конкретных следующих шага по пунктам (1., 2., 3.). Максимум 7 предложений, обычный текст без markdown-звёздочек.`;
    if (!offline) { try { await streamChat(question, ceoPersona, t => setS(p => p && ({ ...p, solution: p.solution + t }))); } catch { offline = true; } }
    if (offline) { for (const ch of FB_SOLUTION) { setS(p => p && ({ ...p, solution: p.solution + ch })); await new Promise(r => setTimeout(r, 6)); } }
    setS(p => p && ({ ...p, phase: "done", current: undefined, offline }));
  }, [appendLast]);

  const submit = useCallback(() => {
    const question = q.trim(); if (!question || busy) return;
    setQ(""); void run(question);
  }, [q, busy, run]);

  const ceo = TEAM_BY_SLUG.ceo;

  return (
    <div className="sv-wrap">
      <div className="sv-head">
        <div className="sv-eyebrow">СОВЕТ ДИРЕКТОРОВ · РЕШЕНИЕ ПОД КЛЮЧ</div>
        <h1 className="sv-title">Опишите задачу — совет её решит</h1>
        <p className="sv-sub">Профильные директора разберут вашу ситуацию каждый со своей стороны и соберут единое решение с конкретными шагами.</p>
      </div>

      <div className="sv-ask">
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
          disabled={busy} placeholder="Например: стоит ли запускать вторую линейку продукта?" spellCheck={false} />
        <button onClick={submit} disabled={busy || !q.trim()}>
          {busy ? <span className="sv-dots"><i /><i /><i /></span> : <><span>Собрать совет</span><CornerDownLeft size={14} strokeWidth={2.4} /></>}
        </button>
      </div>

      {!s && (
        <div className="sv-examples">
          {EXAMPLES.map(e => (
            <button key={e} onClick={() => { setQ(e); requestAnimationFrame(() => inputRef.current?.focus()); }}>
              <span>{e}</span><ArrowUpRight size={13} strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {s && (
          <motion.div className="sv-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="sv-q">{s.q}</div>

            {/* Assigned team */}
            <div className="sv-team">
              <span className="sv-team-label">Над задачей работают</span>
              <div className="sv-team-list">
                {s.team.map(slug => {
                  const m = TEAM_BY_SLUG[slug];
                  const contrib = s.contribs.find(c => c.slug === slug);
                  const state = contrib?.done ? "done" : s.current === slug ? "work" : contrib ? "done" : "wait";
                  return (
                    <div key={slug} className="sv-member" title={m.name}>
                      <span className="sv-member-av" style={{ background: `linear-gradient(135deg,${m.g[0]},${m.g[1]})` }}>{m.ab}</span>
                      <span className="sv-member-info">
                        <span className="sv-member-name">{m.name}</span>
                        <span className="sv-member-state" style={{ color: state === "done" ? "#34d399" : state === "work" ? m.c : "rgba(255,255,255,0.35)" }}>
                          {state === "done" ? <><Check size={10} strokeWidth={3} />готово</> : state === "work" ? <><Loader2 size={10} className="sv-spin" />анализирует…</> : "в очереди"}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contributions */}
            <div className="sv-contribs">
              {s.contribs.map((c, i) => {
                const m = TEAM_BY_SLUG[c.slug];
                return (
                  <motion.div key={i} className="sv-contrib" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: EASE }}>
                    <div className="sv-contrib-side" style={{ background: `linear-gradient(180deg,${m.c}, transparent)` }} />
                    <div className="sv-contrib-body">
                      <div className="sv-contrib-head">
                        <span className="sv-contrib-av" style={{ background: `linear-gradient(135deg,${m.g[0]},${m.g[1]})` }}>{m.ab}</span>
                        <span className="sv-contrib-name">{m.name}</span>
                        <span className="sv-contrib-role">{m.title}</span>
                      </div>
                      <p className="sv-contrib-text">{c.text}{!c.done && <span className="sv-cursor" style={{ background: m.c }} />}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Solution */}
            {(s.phase === "solution" || s.phase === "done") && (
              <motion.div className="sv-solution" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                <div className="sv-solution-head">
                  <span className="sv-solution-av" style={{ background: `linear-gradient(135deg,${ceo.g[0]},${ceo.g[1]})` }}>{ceo.ab}</span>
                  <div>
                    <div className="sv-solution-title">Решение совета</div>
                    <div className="sv-solution-by">Синтез · {ceo.name}, CEO</div>
                  </div>
                </div>
                <p className="sv-solution-text">{s.solution}{s.phase === "solution" && <span className="sv-cursor" style={{ background: ceo.c }} />}</p>
                {s.offline && s.phase === "done" && <div className="sv-offline">Демо-режим — настройте ANTHROPIC_API_KEY для живого анализа</div>}
                {s.phase === "done" && <button className="sv-new" onClick={() => { setS(null); requestAnimationFrame(() => inputRef.current?.focus()); }}>Новая задача</button>}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .sv-wrap { max-width: 860px; margin: 0 auto; padding: 32px 24px 60px; }
        .sv-head { margin-bottom: 22px; }
        .sv-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 9px; }
        .sv-title { font-size: 29px; font-weight: 800; letter-spacing: -0.025em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
        .sv-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 60ch; margin: 0; }

        .sv-ask { display: flex; gap: 8px; }
        .sv-ask input { flex: 1; min-width: 0; height: 52px; padding: 0 18px; border-radius: 14px; font-size: 15px; color: #E5E7EB;
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
        .sv-ask input::placeholder { color: rgba(255,255,255,0.3); }
        .sv-ask input:focus { border-color: rgba(99,102,241,0.55); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .sv-ask button { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 22px; border-radius: 14px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 4px 16px rgba(99,102,241,0.32), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
        .sv-ask button:hover:not(:disabled) { transform: translateY(-1px); }
        .sv-ask button:disabled { opacity: 0.55; cursor: not-allowed; }
        .sv-dots { display: inline-flex; gap: 4px; } .sv-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: sv-blink 1s infinite; }
        .sv-dots i:nth-child(2){animation-delay:.15s} .sv-dots i:nth-child(3){animation-delay:.3s}
        @keyframes sv-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

        .sv-examples { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
        .sv-examples button { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 16px; border-radius: 12px; cursor: pointer;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.72); font-size: 13.5px; text-align: left; transition: background .16s, border-color .16s, transform .16s; }
        .sv-examples button:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.13); transform: translateX(2px); }
        .sv-examples svg { color: rgba(255,255,255,0.3); flex-shrink: 0; }

        .sv-session { margin-top: 24px; display: flex; flex-direction: column; gap: 18px; }
        .sv-q { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }

        .sv-team { padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
        .sv-team-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); }
        .sv-team-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 11px; }
        .sv-member { display: flex; align-items: center; gap: 9px; padding: 8px 12px 8px 8px; border-radius: 11px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
        .sv-member-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
        .sv-member-info { display: flex; flex-direction: column; }
        .sv-member-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); line-height: 1.2; }
        .sv-member-state { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; margin-top: 1px; }
        .sv-spin { animation: sv-rot 0.9s linear infinite; }
        @keyframes sv-rot { to { transform: rotate(360deg); } }

        .sv-contribs { display: flex; flex-direction: column; gap: 12px; }
        .sv-contrib { display: flex; border-radius: 14px; overflow: hidden; background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.07); }
        .sv-contrib-side { width: 3px; flex-shrink: 0; }
        .sv-contrib-body { flex: 1; min-width: 0; padding: 14px 16px; }
        .sv-contrib-head { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
        .sv-contrib-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
        .sv-contrib-name { font-size: 13.5px; font-weight: 700; color: #fff; }
        .sv-contrib-role { font-size: 11.5px; color: rgba(255,255,255,0.42); }
        .sv-contrib-text { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.78); margin: 0; white-space: pre-wrap; }
        .sv-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: sv-caret 1s step-end infinite; }
        @keyframes sv-caret { 50% { opacity: 0; } }

        .sv-solution { border-radius: 16px; border: 1px solid rgba(99,102,241,0.3); background: linear-gradient(180deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02)); padding: 18px 20px; box-shadow: 0 12px 40px rgba(99,102,241,0.08); }
        .sv-solution-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .sv-solution-av { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 13px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.22); }
        .sv-solution-title { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
        .sv-solution-by { font-size: 11.5px; color: rgba(255,255,255,0.45); }
        .sv-solution-text { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.85); margin: 0; white-space: pre-wrap; }
        .sv-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 12px; }
        .sv-new { margin-top: 16px; height: 38px; padding: 0 18px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); transition: color .16s, border-color .16s; }
        .sv-new:hover { color: #fff; border-color: rgba(255,255,255,0.2); }

        @media (prefers-reduced-motion: reduce) { .sv-dots i, .sv-cursor, .sv-spin { animation: none; } }
      `}</style>
    </div>
  );
}
