"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CornerDownLeft, Check, ArrowUpRight, MessageSquare, X } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Характеристики агентов ───────────────────────────────────────────────────
const CHAR: Record<string, { specialty: string; confidence: number; tasks: number }> = {
  ceo:      { specialty: "Стратегия & Видение",       confidence: 96, tasks: 12 },
  cfo:      { specialty: "Финансы & Модели",          confidence: 93, tasks: 8 },
  cmo:      { specialty: "Маркетинг & Рост",          confidence: 94, tasks: 15 },
  coo:      { specialty: "Операции & Процессы",       confidence: 92, tasks: 10 },
  cto:      { specialty: "Технологии & Архитектура",  confidence: 95, tasks: 9 },
  analyst:  { specialty: "Данные & Гипотезы",         confidence: 91, tasks: 7 },
  invest:   { specialty: "Инвестиции & Оценка",       confidence: 92, tasks: 6 },
  risk:     { specialty: "Риски & Защита",            confidence: 90, tasks: 8 },
  brand:    { specialty: "Бренд & Позиционирование",  confidence: 92, tasks: 9 },
  growth:   { specialty: "Рост & Эксперименты",       confidence: 91, tasks: 11 },
  market:   { specialty: "Рынок & Разведка",          confidence: 91, tasks: 10 },
  pr:       { specialty: "PR & Репутация",            confidence: 88, tasks: 6 },
  sales:    { specialty: "Продажи & Воронка",         confidence: 90, tasks: 12 },
  hr:       { specialty: "Найм & Команда",            confidence: 87, tasks: 7 },
  legal:    { specialty: "Право & Комплаенс",         confidence: 88, tasks: 5 },
  supply:   { specialty: "Логистика & Поставки",      confidence: 89, tasks: 6 },
  data:     { specialty: "Аналитика & Прогнозы",      confidence: 92, tasks: 8 },
  product:  { specialty: "Продукт & Роадмап",         confidence: 93, tasks: 9 },
  ux:       { specialty: "UX & Исследования",         confidence: 90, tasks: 7 },
  strategy: { specialty: "Сценарии & Развилки",       confidence: 94, tasks: 6 },
};

function spark(seed: string): number[] {
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  const out: number[] = []; let v = 30 + (h % 20);
  for (let i = 0; i < 9; i++) { v += ((h >> i) % 7) - 2 + i; out.push(Math.max(8, Math.min(96, v))); }
  return out;
}

type AgentFull = TeamMember & { specialty: string; confidence: number; tasks: number };
const AGENTS: AgentFull[] = TEAM.map(m => ({ ...m, ...(CHAR[m.slug] ?? { specialty: m.title, confidence: 90, tasks: 8 }) }));

const EXAMPLES = [
  "Стоит ли поднимать цены на 20%?",
  "Выходить ли на рынок Германии в этом году?",
  "Как найти первые 100 платящих клиентов?",
];

const FB: Record<string, string> = {
  cfo: "Отдел финансов посчитал: юнит-экономика выдерживает. Если LTV/CAC ниже 3 — сначала чиним экономику. Предлагаем пилот с жёстким лимитом бюджета и точкой пересмотра через 30 дней.",
  cmo: "Маркетинг проверил спрос: тестируем дешёвым лендингом и двумя каналами, решение по данным конверсии. Выше бенчмарка — масштабируем.",
  coo: "Операционный блок готов: до запуска нужны владелец процесса, SLA и чек-лист. Иначе рост превратится в хаос поддержки.",
  cto: "Технически реализуемо: команда закладывает 2–3 недели на MVP. Начинаем с самого узкого сценария, который проверяет гипотезу.",
};
const FB_SOLUTION = "Решение совета: гипотеза достойна проверки, но входим поэтапно. Шаг 1 — дешёвый тест спроса за 7–14 дней. Шаг 2 — при метриках выше порога собираем MVP. Шаг 3 — пересмотр через 30 дней. Живой анализ доступен после подключения ANTHROPIC_API_KEY.";

// ─── Оргкарта: CEO → 4 директора → их агенты ──────────────────────────────────
const DIRS = ["cfo", "cmo", "coo", "cto"] as const;

const POS: Record<string, { x: number; y: number }> = {
  ceo: { x: 50, y: 12 },
  cfo: { x: 16, y: 46 },
  cmo: { x: 39, y: 46 },
  coo: { x: 61, y: 46 },
  cto: { x: 84, y: 46 },
};

// позиции специалистов — веером под своим директором
const SPEC_POS: Record<string, { x: number; y: number }> = (() => {
  const out: Record<string, { x: number; y: number }> = {};
  for (const d of DIRS) {
    const specs = reportsOf(d).filter(m => m.tier === "specialist");
    const gap = specs.length > 3 ? 7.4 : 8.6;
    const start = POS[d].x - ((specs.length - 1) * gap) / 2;
    specs.forEach((s, i) => { out[s.slug] = { x: start + i * gap, y: 84 }; });
  }
  return out;
})();

type Stage = "delegate" | "team" | "speak";
type Contribution = { slug: string; text: string; done: boolean };
type Session = { q: string; team: string[]; phase: "work" | "solution" | "done"; current?: string; stage?: Stage; contribs: Contribution[]; solution: string; offline: boolean };

export default function BoardPage() {
  const [q, setQ] = useState("");
  const [s, setS] = useState<Session | null>(null);
  const [ask, setAsk] = useState<AgentFull | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const busy = s !== null && s.phase !== "done";

  useEffect(() => { inputRef.current?.focus(); }, []);

  const appendLast = useCallback((t: string) => setS(p => {
    if (!p || !p.contribs.length) return p;
    const c = [...p.contribs]; c[c.length - 1] = { ...c[c.length - 1], text: c[c.length - 1].text + t };
    return { ...p, contribs: c };
  }), []);

  const run = useCallback(async (question: string) => {
    const team = [...DIRS];
    setS({ q: question, team, phase: "work", contribs: [], solution: "", offline: false });
    await new Promise(r => setTimeout(r, 600));
    const opinions: { slug: string; text: string }[] = [];
    let offline = false;

    for (const slug of team) {
      const m = TEAM_BY_SLUG[slug];
      const specs = reportsOf(slug).filter(x => x.tier === "specialist");

      // 1) главный передаёт задачу директору
      setS(p => p && ({ ...p, current: slug, stage: "delegate" }));
      await new Promise(r => setTimeout(r, 850));

      // 2) директор раздаёт работу своим агентам — они работают
      setS(p => p && ({ ...p, stage: "team" }));
      await new Promise(r => setTimeout(r, 1900));

      // 3) директор докладывает консолидированную позицию отдела
      setS(p => p && ({ ...p, stage: "speak", contribs: [...p.contribs, { slug, text: "", done: false }] }));
      const prev = opinions.map(o => `${TEAM_BY_SLUG[o.slug].name}: ${o.text}`).join("\n\n");
      const persona = `Ты — ${m.name}, ${m.title} в совете Apex AI. CEO поручил твоему отделу разобрать вопрос основателя. Ты уже обсудил его со своей командой (${specs.map(x => `${x.name} — ${x.title}`).join(", ")}). ${prev ? `Другие отделы доложили:\n${prev}\n\nДополни новым углом или аргументированно поспорь.` : ""} Доложи консолидированную позицию отдела: 3–4 предложения, конкретика и цифры, можно сослаться на кого-то из команды по имени. Обычный текст без markdown.`;
      let text = "";
      if (!offline) { try { text = await streamChat(question, persona, appendLast); } catch { offline = true; } }
      if (offline) { text = FB[slug] ?? FB.cfo; for (const ch of text) { appendLast(ch); await new Promise(r => setTimeout(r, 6)); } }
      opinions.push({ slug, text });
      setS(p => { if (!p) return p; const c = [...p.contribs]; c[c.length - 1] = { ...c[c.length - 1], done: true }; return { ...p, contribs: c, offline }; });
      await new Promise(r => setTimeout(r, 250));
    }

    // 4) главный сводит доклады отделов в решение
    setS(p => p && ({ ...p, phase: "solution", current: "ceo", stage: undefined }));
    const ceoPersona = `Ты — Sophia Rivers, CEO совета Apex AI. Четыре отдела доложили по вопросу основателя:\n${opinions.map(o => `${TEAM_BY_SLUG[o.slug].name} (${TEAM_BY_SLUG[o.slug].title}): ${o.text}`).join("\n\n")}\n\nСведи в единое решение: короткий вывод и 3 конкретных шага по пунктам (1., 2., 3.). Максимум 7 предложений, без markdown-звёздочек.`;
    if (!offline) { try { await streamChat(question, ceoPersona, t => setS(p => p && ({ ...p, solution: p.solution + t }))); } catch { offline = true; } }
    if (offline) { for (const ch of FB_SOLUTION) { setS(p => p && ({ ...p, solution: p.solution + ch })); await new Promise(r => setTimeout(r, 6)); } }
    setS(p => p && ({ ...p, phase: "done", current: undefined, stage: undefined, offline }));
  }, [appendLast]);

  const submit = useCallback(() => {
    const question = q.trim(); if (!question || busy) return;
    setQ(""); void run(question);
  }, [q, busy, run]);

  const ceo = TEAM_BY_SLUG.ceo;
  const currentSpecs = useMemo(
    () => (s?.current && s.current !== "ceo" ? reportsOf(s.current).filter(x => x.tier === "specialist") : []),
    [s?.current],
  );

  return (
    <div className="ex-root">
      <div className="ex-ambient" aria-hidden />

      <div className="ex-wrap">
        <div className="ex-hall-head">
          <div className="ex-live">
            <span className="ex-live-dot" />
            СОВЕТ В СБОРЕ · 1 ГЛАВНЫЙ · 4 ДИРЕКТОРА · 14 АГЕНТОВ
          </div>
          <h1 className="ex-title">Исполнительный совет</h1>
          <p className="ex-sub">Главный раздаёт работу директорам, директора — своим агентам. Смотрите, как задача расходится по компании, и получите решение.</p>
        </div>

        {/* ── Оргкарта делегирования ── */}
        <div className="ex-org">
          {/* соединительные линии */}
          <svg className="ex-org-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {DIRS.map(d => {
              const hot = s?.current === d;
              return (
                <line key={`ceo-${d}`} x1={POS.ceo.x} y1={POS.ceo.y + 6} x2={POS[d].x} y2={POS[d].y - 6}
                  stroke={hot ? "rgba(129,140,248,0.55)" : "rgba(148,163,184,0.13)"} strokeWidth={hot ? 1.6 : 1} vectorEffect="non-scaling-stroke" />
              );
            })}
            {DIRS.flatMap(d =>
              reportsOf(d).filter(x => x.tier === "specialist").map(sp => {
                const hot = s?.current === d && s?.stage === "team";
                return (
                  <line key={`${d}-${sp.slug}`} x1={POS[d].x} y1={POS[d].y + 7} x2={SPEC_POS[sp.slug].x} y2={SPEC_POS[sp.slug].y - 5}
                    stroke={hot ? `${TEAM_BY_SLUG[d].c}88` : "rgba(148,163,184,0.09)"} strokeWidth={hot ? 1.4 : 1} vectorEffect="non-scaling-stroke" />
                );
              })
            )}
          </svg>

          {/* пакет задачи: главный → директор */}
          <AnimatePresence>
            {!reduce && s?.stage === "delegate" && s.current && (
              <motion.span
                key={`pkt-${s.current}`}
                className="ex-packet"
                style={{ background: TEAM_BY_SLUG[s.current].c, boxShadow: `0 0 12px ${TEAM_BY_SLUG[s.current].c}` }}
                initial={{ left: `${POS.ceo.x}%`, top: `${POS.ceo.y + 4}%`, opacity: 0 }}
                animate={{ left: `${POS[s.current].x}%`, top: `${POS[s.current].y - 4}%`, opacity: [0, 1, 1, 0.8] }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.8, ease: EASE }}
              />
            )}
          </AnimatePresence>

          {/* пакеты: директор → агенты (пинги по кругу, пока команда работает) */}
          {!reduce && s?.stage === "team" && s.current && currentSpecs.map((sp, i) => (
            <motion.span
              key={`ping-${sp.slug}`}
              className="ex-packet ex-packet-sm"
              style={{ background: sp.c, boxShadow: `0 0 9px ${sp.c}` }}
              initial={{ left: `${POS[s.current!].x}%`, top: `${POS[s.current!].y + 5}%`, opacity: 0 }}
              animate={{
                left: [`${POS[s.current!].x}%`, `${SPEC_POS[sp.slug].x}%`],
                top: [`${POS[s.current!].y + 5}%`, `${SPEC_POS[sp.slug].y - 3}%`],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
            />
          ))}

          {/* ГЛАВНЫЙ */}
          <OrgNode
            member={ceo}
            pos={POS.ceo}
            size={58}
            label={ceo.name}
            sub={busy ? (s?.phase === "solution" ? "сводит решение…" : s?.stage === "delegate" ? "передаёт задачу…" : "координирует") : "Главный · CEO"}
            speaking={s?.phase === "solution"}
            floatDelay={0}
            reduce={!!reduce}
            onClick={() => setAsk(AGENTS.find(a => a.slug === "ceo")!)}
          />

          {/* ДИРЕКТОРА */}
          {DIRS.map((d, i) => {
            const m = TEAM_BY_SLUG[d];
            const isCur = s?.current === d;
            const done = s?.contribs.some(c => c.slug === d && c.done);
            const sub = isCur
              ? s?.stage === "delegate" ? "принимает задачу…" : s?.stage === "team" ? "раздаёт работу…" : "докладывает…"
              : done ? "доложил" : m.role;
            return (
              <OrgNode
                key={d}
                member={m}
                pos={POS[d]}
                size={46}
                label={m.name.split(" ")[0]}
                sub={sub}
                speaking={isCur && s?.stage === "speak"}
                working={isCur && s?.stage === "team"}
                done={!!done && !isCur}
                dim={busy && !isCur && !done && s?.phase === "work"}
                floatDelay={0.4 + i * 0.25}
                reduce={!!reduce}
                onClick={() => setAsk(AGENTS.find(a => a.slug === d)!)}
              />
            );
          })}

          {/* АГЕНТЫ */}
          {DIRS.flatMap(d =>
            reportsOf(d).filter(x => x.tier === "specialist").map((sp, i) => {
              const workingNow = s?.current === d && s?.stage === "team";
              return (
                <OrgSpec
                  key={sp.slug}
                  member={sp}
                  pos={SPEC_POS[sp.slug]}
                  working={!!workingNow}
                  dim={busy && !workingNow}
                  floatDelay={1 + i * 0.17}
                  reduce={!!reduce}
                  onClick={() => setAsk(AGENTS.find(a => a.slug === sp.slug)!)}
                />
              );
            })
          )}
        </div>

        {/* трибуна */}
        <div className="ex-podium">
          <div className="ex-ask">
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
              disabled={busy} placeholder="Опишите задачу — главный распределит её по отделам…" spellCheck={false} />
            <button onClick={submit} disabled={busy || !q.trim()}>
              {busy ? <span className="ex-dots"><i /><i /><i /></span> : <><span>Раздать работу</span><CornerDownLeft size={14} strokeWidth={2.4} /></>}
            </button>
          </div>
          {!s && (
            <div className="ex-examples">
              {EXAMPLES.map(e => (
                <button key={e} onClick={() => { setQ(e); requestAnimationFrame(() => inputRef.current?.focus()); }}>
                  <span>{e}</span><ArrowUpRight size={13} strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Стенограмма ── */}
        <AnimatePresence>
          {s && (
            <motion.div className="ex-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <div className="ex-agenda">
                <span className="ex-agenda-label">Повестка</span>
                <span className="ex-agenda-q">{s.q}</span>
              </div>

              <div className="ex-transcript">
                <div className="ex-transcript-head">
                  <span className="ex-transcript-title">Доклады отделов</span>
                  {busy && <span className="ex-transcript-live"><span className="ex-live-dot" />идёт работа</span>}
                </div>

                <div className="ex-rail">
                  {s.contribs.map((c, i) => {
                    const m = TEAM_BY_SLUG[c.slug];
                    const specs = reportsOf(c.slug).filter(x => x.tier === "specialist");
                    return (
                      <motion.div key={i} className="ex-entry" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                        <div className="ex-entry-marker">
                          <span className="ex-entry-dot" style={{ background: m.c, boxShadow: `0 0 10px ${m.c}66` }} />
                          {(i < s.contribs.length - 1 || s.phase !== "work") && <span className="ex-entry-line" />}
                        </div>
                        <div className="ex-entry-body">
                          <div className="ex-entry-head">
                            <span className="ex-entry-av" style={{ background: `linear-gradient(135deg,${m.g[0]},${m.g[1]})` }}>{m.ab}</span>
                            <span className="ex-entry-name">{m.name}</span>
                            <span className="ex-entry-role">{m.title}</span>
                            <span className="ex-entry-team">
                              {specs.map(sp => (
                                <span key={sp.slug} className="ex-entry-team-av" style={{ background: sp.c }} title={`${sp.name} — ${sp.title}`}>{sp.ab}</span>
                              ))}
                            </span>
                          </div>
                          <p className="ex-entry-text">{c.text}{!c.done && <span className="ex-cursor" style={{ background: m.c }} />}</p>
                        </div>
                      </motion.div>
                    );
                  })}

                  {(s.phase === "solution" || s.phase === "done") && (
                    <motion.div className="ex-entry" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: EASE }}>
                      <div className="ex-entry-marker">
                        <span className="ex-entry-dot ex-entry-dot-final" />
                      </div>
                      <div className="ex-protocol">
                        <div className="ex-protocol-top">
                          <div className="ex-protocol-titles">
                            <span className="ex-protocol-kicker">ПРОТОКОЛ ЗАСЕДАНИЯ</span>
                            <span className="ex-protocol-title">Решение совета</span>
                          </div>
                          <span className="ex-seal" aria-hidden>
                            <svg viewBox="0 0 44 44">
                              <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(129,140,248,0.5)" strokeWidth="1.2" strokeDasharray="2.5 3" />
                              <circle cx="22" cy="22" r="14" fill="none" stroke="rgba(129,140,248,0.35)" strokeWidth="1" />
                              <path d="M22 13l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="rgba(129,140,248,0.65)" />
                            </svg>
                          </span>
                        </div>
                        <p className="ex-protocol-text">{s.solution}{s.phase === "solution" && <span className="ex-cursor" style={{ background: ceo.c }} />}</p>
                        {s.phase === "done" && (
                          <div className="ex-protocol-sign">
                            <span className="ex-sign-av" style={{ background: `linear-gradient(135deg,${ceo.g[0]},${ceo.g[1]})` }}>{ceo.ab}</span>
                            <span className="ex-sign-txt"><b>{ceo.name}</b> · CEO, председатель совета</span>
                            {s.offline && <span className="ex-offline">демо-режим · настройте ANTHROPIC_API_KEY</span>}
                          </div>
                        )}
                        {s.phase === "done" && (
                          <button className="ex-new" onClick={() => { setS(null); requestAnimationFrame(() => inputRef.current?.focus()); }}>
                            Новая задача
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Состав совета ── */}
        <div className="ex-roster-head">
          <h2 className="ex-roster-title">Состав совета</h2>
          <span className="ex-roster-count">1 главный · 4 директора · 14 агентов · нажмите, чтобы спросить лично</span>
        </div>

        {C_LEVEL.map(lead => {
          const director = AGENTS.find(a => a.slug === lead.slug)!;
          const team = reportsOf(lead.slug).filter(m => m.tier === "specialist").map(m => AGENTS.find(a => a.slug === m.slug)!);
          const directReports = lead.slug === "ceo" ? C_LEVEL.filter(c => c.slug !== "ceo") : [];
          return (
            <div key={lead.slug} className="ex-dept" style={{ borderLeftColor: `${director.c}33` }}>
              <motion.button className="ex-lead" onClick={() => setAsk(director)}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, ease: EASE }}
                whileHover={{ y: -3 }}
                style={{ background: `linear-gradient(135deg, rgba(${hexToRgb(director.c)},0.13), rgba(255,255,255,0.02) 65%)`, borderColor: `rgba(${hexToRgb(director.c)},0.28)` }}>
                <span className="ex-lead-av" style={{ background: `linear-gradient(135deg,${director.g[0]},${director.g[1]})` }}>{director.ab}</span>
                <div className="ex-lead-id">
                  <div className="ex-lead-name">{director.name} <span className="ex-lead-role" style={{ color: director.c }}>{director.role}</span></div>
                  <div className="ex-lead-title">{director.title}</div>
                </div>
                <div className="ex-lead-meta">
                  <div className="ex-lead-conf" style={{ color: director.c }}>{director.confidence}%</div>
                  <div className="ex-lead-sub">{lead.slug === "ceo" ? "главный · раздаёт работу" : `${team.length} агента в отделе`}</div>
                </div>
              </motion.button>

              {directReports.length > 0 && (
                <div className="ex-directs">
                  <span className="ex-directs-label">Директора в подчинении</span>
                  {directReports.map(c => (
                    <span key={c.slug} className="ex-direct-chip" style={{ color: c.c, borderColor: `${c.c}44` }}>{c.role}</span>
                  ))}
                </div>
              )}

              {team.length > 0 && (
                <div className="ex-grid">
                  {team.map((a, i) => (
                    <AgentCard key={a.slug} a={a} index={i} lead={director} onClick={() => setAsk(a)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>{ask && <AskModal agent={ask} onClose={() => setAsk(null)} />}</AnimatePresence>
      <ExStyles />
    </div>
  );
}

// ─── Узел оргкарты: главный / директор ────────────────────────────────────────
function OrgNode({ member, pos, size, label, sub, speaking, working, done, dim, floatDelay, reduce, onClick }: {
  member: TeamMember; pos: { x: number; y: number }; size: number; label: string; sub: string;
  speaking?: boolean; working?: boolean; done?: boolean; dim?: boolean; floatDelay: number; reduce: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      className="ex-node"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: dim ? 0.35 : 1, y: reduce ? 0 : [0, -4, 0] }}
      transition={{
        opacity: { duration: 0.3 },
        y: reduce ? undefined : { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
      }}
      onClick={onClick}
      title={`${member.name} — ${member.title}`}
    >
      <span className="ex-node-av" style={{
        width: size, height: size, fontSize: size * 0.28, borderRadius: size * 0.29,
        background: `linear-gradient(135deg,${member.g[0]},${member.g[1]})`,
        boxShadow: speaking || working
          ? `0 0 0 2px ${member.c}, 0 0 26px ${member.c}66, inset 0 1px 0 rgba(255,255,255,0.25)`
          : `0 6px 22px rgba(0,0,0,0.5), 0 0 14px ${member.c}22, inset 0 1px 0 rgba(255,255,255,0.22)`,
      }}>
        {member.ab}
        {(speaking || working) && !reduce && (
          <motion.span className="ex-node-ring" style={{ borderColor: member.c, borderRadius: size * 0.36 }}
            animate={{ scale: [1, 1.4], opacity: [0.7, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }} />
        )}
        {done && <span className="ex-node-check"><Check size={9} strokeWidth={3.5} /></span>}
      </span>
      <span className="ex-node-name">{label}</span>
      <span className="ex-node-sub" style={{ color: speaking || working ? member.c : undefined }}>{sub}</span>
    </motion.button>
  );
}

// ─── Узел оргкарты: агент-специалист ─────────────────────────────────────────
function OrgSpec({ member, pos, working, dim, floatDelay, reduce, onClick }: {
  member: TeamMember; pos: { x: number; y: number }; working: boolean; dim?: boolean; floatDelay: number; reduce: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      className="ex-node ex-node-spec"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: dim ? 0.28 : 1,
        y: reduce ? 0 : [0, -3, 0],
        scale: working && !reduce ? [1, 1.14, 1] : 1,
      }}
      transition={{
        opacity: { duration: 0.3 },
        y: reduce ? undefined : { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
        scale: working && !reduce ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 },
      }}
      onClick={onClick}
      title={`${member.name} — ${member.title}`}
    >
      <span className="ex-spec-av" style={{
        background: `linear-gradient(135deg,${member.g[0]},${member.g[1]})`,
        boxShadow: working
          ? `0 0 0 1.5px ${member.c}, 0 0 16px ${member.c}77, inset 0 1px 0 rgba(255,255,255,0.2)`
          : `0 4px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)`,
      }}>
        {member.ab}
      </span>
      {working && <span className="ex-spec-work" style={{ color: member.c }}>работает…</span>}
    </motion.button>
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────
function AgentCard({ a, index, lead, onClick }: { a: AgentFull; index: number; lead?: TeamMember; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: EASE, delay: Math.min(index * 0.03, 0.3) }}
      animate={{ y: hovered ? -6 : 0 }}
      className="ex-card"
      style={{
        background: `linear-gradient(145deg, rgba(${hexToRgb(a.c)},0.09) 0%, rgba(255,255,255,0.03) 100%)`,
        border: `1px solid rgba(${hexToRgb(a.c)},${hovered ? 0.4 : 0.18})`,
      }}>
      <div className="ex-card-top">
        <span className="ex-card-av" style={{ background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})` }}>{a.ab}</span>
        <div className="ex-card-id">
          <span className="ex-card-role" style={{ color: a.c }}>{a.role}</span>
          <span className="ex-card-title">{a.title}</span>
        </div>
        {lead ? <span className="ex-card-reports" style={{ color: lead.c, borderColor: `${lead.c}44` }} title={`Подчиняется ${lead.name}`}>→ {lead.role}</span> : <span className="ex-card-dot" />}
      </div>
      <div className="ex-card-name">{a.name}</div>
      <div className="ex-card-spec">{a.specialty}</div>
      <div className="ex-card-metrics">
        <div>
          <div className="ex-card-conf" style={{ color: a.c }}>{a.confidence}%</div>
          <div className="ex-card-conf-l">Уверенность AI</div>
        </div>
        <Sparkline color={a.c} data={spark(a.slug)} />
      </div>
      <div className="ex-card-track">
        <motion.i initial={{ width: 0 }} whileInView={{ width: `${a.confidence}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} style={{ background: a.c }} />
      </div>
      <div className="ex-card-foot">
        <span className="ex-card-tasks">{a.tasks} задач активно</span>
        <span className="ex-card-cta" style={{ color: a.c }}>Спросить <MessageSquare size={10} /></span>
      </div>
    </motion.button>
  );
}

function Sparkline({ color, data }: { color: string; data: number[] }) {
  const W = 64, H = 26, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * W, H - ((d - min) / (max - min || 1)) * (H - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <motion.path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
    </svg>
  );
}

// ─── Per-agent ask modal ─────────────────────────────────────────────────────
function AskModal({ agent, onClose }: { agent: AgentFull; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const submit = useCallback(async () => {
    const question = q.trim(); if (!question || busy) return;
    setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — ${agent.name}, ${agent.title} в совете директоров Apex AI, специализация: ${agent.specialty}. Ответь как профессионал: по делу, с конкретикой, 4–6 предложений, обычный текст без markdown. Если данных мало — задай 1–2 уточняющих вопроса.`;
    try { await streamChat(question, persona, t => setAnswer(prev => prev + t)); }
    catch { setOffline(true); const fb = FB[agent.slug] ?? "Готов помочь — опишите задачу подробнее. Живой анализ доступен после настройки ANTHROPIC_API_KEY."; for (const ch of fb) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); } }
    setBusy(false);
  }, [q, busy, agent]);

  return (
    <motion.div className="am-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="am-card" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.24, ease: EASE }}>
        <button className="am-close" onClick={onClose} aria-label="Закрыть"><X size={16} strokeWidth={2.2} /></button>
        <div className="am-head">
          <span className="am-av" style={{ background: `linear-gradient(135deg,${agent.g[0]},${agent.g[1]})` }}>{agent.ab}</span>
          <div>
            <div className="am-name">{agent.name}</div>
            <div className="am-role">{agent.title} · {agent.specialty}</div>
          </div>
        </div>
        <div className="am-stats">
          <div><span style={{ color: agent.c }}>{agent.confidence}%</span><small>Уверенность</small></div>
          <div><span style={{ color: agent.c }}>{agent.tasks}</span><small>Задач активно</small></div>
        </div>
        <div className="am-ask">
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void submit(); }}
            disabled={busy} placeholder={`Спросить ${agent.name.split(" ")[0]}…`} spellCheck={false} />
          <button onClick={() => void submit()} disabled={busy || !q.trim()} style={{ background: `linear-gradient(135deg,${agent.g[0]},${agent.g[1]})` }} aria-label="Отправить">
            {busy ? <span className="ex-dots"><i /><i /><i /></span> : <CornerDownLeft size={15} strokeWidth={2.4} />}
          </button>
        </div>
        <AnimatePresence>
          {(answer || busy) && (
            <motion.div className="am-answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p>{answer}{busy && <span className="ex-cursor" style={{ background: agent.c }} />}</p>
              {offline && !busy && <div className="ex-offline">Демо-ответ — настройте ANTHROPIC_API_KEY</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function ExStyles() {
  return (
    <style jsx global>{`
      .ex-root { position: relative; background: #05060A; min-height: 100%; overflow: hidden; }

      .ex-ambient { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: min(900px, 100%); height: 560px; pointer-events: none;
        background:
          radial-gradient(52% 60% at 50% 0%, rgba(99,102,241,0.13), transparent 70%),
          radial-gradient(30% 34% at 50% 6%, rgba(129,140,248,0.10), transparent 75%);
      }

      .ex-wrap { position: relative; max-width: 1160px; margin: 0 auto; padding: 40px 24px 60px; }

      .ex-hall-head { text-align: center; margin-bottom: 10px; }
      .ex-live { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.14em;
        color: rgba(52,211,153,0.9); background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.2); border-radius: 999px; padding: 6px 14px; margin-bottom: 16px; }
      .ex-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: ex-pulse 2s ease-in-out infinite; }
      .ex-title { font-size: clamp(28px, 4vw, 38px); font-weight: 800; letter-spacing: -0.03em; color: #F3F4F6; margin: 0 0 10px; text-wrap: balance; }
      .ex-sub { font-size: 14.5px; line-height: 1.6; color: rgba(255,255,255,0.5); max-width: 58ch; margin: 0 auto; }

      /* ── оргкарта делегирования ── */
      .ex-org { position: relative; max-width: 860px; height: 350px; margin: 18px auto 4px; }
      .ex-org-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
      .ex-packet { position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; pointer-events: none; z-index: 3; }
      .ex-packet-sm { width: 6px; height: 6px; margin: -3px 0 0 -3px; }

      .ex-node { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 4px;
        background: none; border: none; cursor: pointer; padding: 4px; z-index: 2; }
      .ex-node-av { position: relative; display: flex; align-items: center; justify-content: center; color: #fff;
        font-family: var(--font-geist-mono), monospace; font-weight: 800; transition: box-shadow .3s; }
      .ex-node-ring { position: absolute; inset: -5px; border: 1.5px solid; pointer-events: none; }
      .ex-node-check { position: absolute; right: -5px; top: -5px; width: 16px; height: 16px; border-radius: 50%;
        background: #10b981; border: 2px solid #05060A; color: #fff; display: flex; align-items: center; justify-content: center; }
      .ex-node-name { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.88); letter-spacing: -0.01em; white-space: nowrap; }
      .ex-node-sub { font-family: var(--font-geist-mono), monospace; font-size: 8.5px; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); white-space: nowrap; }

      .ex-node-spec { gap: 3px; }
      .ex-spec-av { width: 27px; height: 27px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff;
        font-family: var(--font-geist-mono), monospace; font-size: 8.5px; font-weight: 800; transition: box-shadow .3s; }
      .ex-spec-work { font-family: var(--font-geist-mono), monospace; font-size: 8px; letter-spacing: 0.06em; white-space: nowrap; }

      /* трибуна */
      .ex-podium { max-width: 720px; margin: 10px auto 0; }
      .ex-ask { display: flex; gap: 8px; }
      .ex-ask input { flex: 1; min-width: 0; height: 54px; padding: 0 20px; border-radius: 16px; font-size: 15px; color: #E5E7EB;
        background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s;
        box-shadow: 0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05); }
      .ex-ask input::placeholder { color: rgba(255,255,255,0.3); }
      .ex-ask input:focus { border-color: rgba(99,102,241,0.55); box-shadow: 0 0 0 4px rgba(99,102,241,0.1), 0 10px 40px rgba(0,0,0,0.35); }
      .ex-ask button { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; height: 54px; padding: 0 22px; border-radius: 16px; border: none; cursor: pointer;
        font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5);
        box-shadow: 0 4px 18px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .ex-ask button:hover:not(:disabled) { transform: translateY(-1px); }
      .ex-ask button:disabled { opacity: 0.55; cursor: not-allowed; }
      .ex-dots { display: inline-flex; gap: 4px; } .ex-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: ex-blink 1s infinite; }
      .ex-dots i:nth-child(2){animation-delay:.15s} .ex-dots i:nth-child(3){animation-delay:.3s}
      @keyframes ex-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

      .ex-examples { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
      .ex-examples button { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 999px; cursor: pointer;
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); font-size: 12.5px; transition: background .16s, border-color .16s, transform .16s; }
      .ex-examples button:hover { background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
      .ex-examples svg { color: rgba(255,255,255,0.3); }

      /* стенограмма */
      .ex-session { max-width: 820px; margin: 30px auto 0; }
      .ex-agenda { display: flex; flex-direction: column; gap: 5px; padding: 16px 20px; border-radius: 16px;
        background: linear-gradient(135deg, rgba(99,102,241,0.07), rgba(255,255,255,0.015)); border: 1px solid rgba(99,102,241,0.2); margin-bottom: 20px; }
      .ex-agenda-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.16em; color: rgba(129,140,248,0.8); }
      .ex-agenda-q { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.01em; line-height: 1.4; }

      .ex-transcript-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .ex-transcript-title { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.16em; color: rgba(255,255,255,0.4); text-transform: uppercase; }
      .ex-transcript-live { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.08em; color: rgba(52,211,153,0.85); }

      .ex-rail { display: flex; flex-direction: column; }
      .ex-entry { display: flex; gap: 14px; }
      .ex-entry-marker { display: flex; flex-direction: column; align-items: center; width: 14px; flex-shrink: 0; padding-top: 14px; }
      .ex-entry-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      .ex-entry-dot-final { width: 11px; height: 11px; background: #818cf8; box-shadow: 0 0 14px rgba(129,140,248,0.7); }
      .ex-entry-line { width: 1px; flex: 1; background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)); margin-top: 6px; }
      .ex-entry-body { flex: 1; min-width: 0; padding: 10px 0 22px; }
      .ex-entry-head { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; flex-wrap: wrap; }
      .ex-entry-av { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
      .ex-entry-name { font-size: 13.5px; font-weight: 700; color: #fff; }
      .ex-entry-role { font-size: 11.5px; color: rgba(255,255,255,0.42); }
      .ex-entry-team { margin-left: auto; display: inline-flex; }
      .ex-entry-team-av { width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
        color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 6px; font-weight: 800; border: 1.5px solid #05060A; margin-left: -4px; }
      .ex-entry-text { font-size: 13.5px; line-height: 1.65; color: rgba(255,255,255,0.78); margin: 0; white-space: pre-wrap; }
      .ex-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: ex-caret 1s step-end infinite; }
      @keyframes ex-caret { 50% { opacity: 0; } }

      /* протокол */
      .ex-protocol { flex: 1; min-width: 0; margin-bottom: 8px; border-radius: 18px; border: 1px solid rgba(99,102,241,0.32); padding: 20px 22px;
        background: linear-gradient(160deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02) 70%);
        box-shadow: 0 16px 50px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.06); }
      .ex-protocol-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .ex-protocol-titles { display: flex; flex-direction: column; gap: 3px; }
      .ex-protocol-kicker { font-family: var(--font-geist-mono), monospace; font-size: 9px; letter-spacing: 0.2em; color: rgba(129,140,248,0.75); }
      .ex-protocol-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.015em; }
      .ex-seal { width: 44px; height: 44px; flex-shrink: 0; opacity: 0.9; animation: ex-seal-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both; }
      .ex-seal svg { width: 100%; height: 100%; }
      @keyframes ex-seal-in { from { transform: scale(1.6) rotate(-14deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 0.9; } }
      .ex-protocol-text { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.86); margin: 0; white-space: pre-wrap; }
      .ex-protocol-sign { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.12); flex-wrap: wrap; }
      .ex-sign-av { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.22); }
      .ex-sign-txt { font-size: 12px; color: rgba(255,255,255,0.55); } .ex-sign-txt b { color: rgba(255,255,255,0.9); font-weight: 700; }
      .ex-offline { margin-left: auto; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; color: rgba(251,191,36,0.8); }
      .ex-new { margin-top: 16px; height: 38px; padding: 0 18px; border-radius: 11px; cursor: pointer; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.13); transition: color .16s, border-color .16s; }
      .ex-new:hover { color: #fff; border-color: rgba(255,255,255,0.22); }

      /* состав совета */
      .ex-roster-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 52px 0 18px; flex-wrap: wrap; }
      .ex-roster-title { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0; }
      .ex-roster-count { font-size: 12px; color: rgba(255,255,255,0.38); }

      .ex-dept { margin-bottom: 26px; padding-left: 14px; border-left: 1px solid; }
      .ex-lead { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; cursor: pointer; padding: 13px 16px; border-radius: 15px; border: 1px solid; margin-bottom: 12px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05); transition: border-color .2s; }
      .ex-lead-av { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 14px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
      .ex-lead-id { flex: 1; min-width: 0; }
      .ex-lead-name { font-size: 15.5px; font-weight: 800; color: #fff; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; }
      .ex-lead-role { font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,0.06); }
      .ex-lead-title { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 2px; }
      .ex-lead-meta { text-align: right; flex-shrink: 0; }
      .ex-lead-conf { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .ex-lead-sub { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 1px; }
      .ex-directs { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin: 0 0 14px 4px; }
      .ex-directs-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); }
      .ex-direct-chip { font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 7px; border: 1px solid; background: rgba(255,255,255,0.02); }
      .ex-card-reports { font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; border: 1px solid; flex-shrink: 0; }
      .ex-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
      .ex-card { text-align: left; cursor: pointer; border-radius: 16px; padding: 18px 16px; position: relative; overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045); transition: border-color .3s, box-shadow .3s; }
      .ex-card:focus-visible { outline: 2px solid rgba(99,102,241,0.6); outline-offset: 2px; }
      .ex-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
      .ex-card-av { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 12px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
      .ex-card-id { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ex-card-role { font-size: 9.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
      .ex-card-title { font-size: 10.5px; color: rgba(255,255,255,0.4); }
      .ex-card-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; animation: ex-pulse 2s ease-in-out infinite; }
      @keyframes ex-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      .ex-card-name { font-size: 14.5px; font-weight: 700; color: #fff; margin-bottom: 2px; }
      .ex-card-spec { font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 14px; }
      .ex-card-metrics { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 10px; }
      .ex-card-conf { font-size: 22px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
      .ex-card-conf-l { font-size: 9px; color: rgba(255,255,255,0.3); margin-top: 3px; }
      .ex-card-track { height: 2px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; margin-bottom: 12px; }
      .ex-card-track i { display: block; height: 100%; border-radius: 2px; }
      .ex-card-foot { display: flex; align-items: center; justify-content: space-between; }
      .ex-card-tasks { font-size: 10px; color: rgba(255,255,255,0.28); }
      .ex-card-cta { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; }

      /* модалка */
      .am-back { position: fixed; inset: 0; z-index: 60; background: rgba(5,6,10,0.72); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; }
      .am-card { position: relative; width: min(580px, 100%); max-height: 84vh; overflow-y: auto; border-radius: 20px; padding: 24px; background: #0b0d16; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
      .am-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; transition: color .16s, border-color .16s; }
      .am-close:hover { color: #fff; border-color: rgba(255,255,255,0.2); }
      .am-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
      .am-av { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 16px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
      .am-name { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
      .am-role { font-size: 12.5px; color: rgba(255,255,255,0.5); }
      .am-stats { display: flex; gap: 10px; margin-bottom: 18px; }
      .am-stats div { flex: 1; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
      .am-stats span { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .am-stats small { display: block; font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }
      .am-ask { display: flex; gap: 8px; }
      .am-ask input { flex: 1; min-width: 0; height: 46px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; color: #E5E7EB; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
      .am-ask input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.09); }
      .am-ask button { flex-shrink: 0; width: 46px; height: 46px; border-radius: 12px; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); transition: transform .15s, opacity .15s; }
      .am-ask button:hover:not(:disabled) { transform: translateY(-1px); }
      .am-ask button:disabled { opacity: 0.5; cursor: not-allowed; }
      .am-answer { margin-top: 14px; border-radius: 13px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); padding: 16px 18px; }
      .am-answer p { font-size: 13.5px; line-height: 1.65; color: rgba(255,255,255,0.82); margin: 0; white-space: pre-wrap; }

      @media (max-width: 720px) {
        .ex-org { height: 300px; }
        .ex-node-name { font-size: 10px; }
        .ex-node-sub { display: none; }
        .ex-spec-av { width: 21px; height: 21px; font-size: 7px; border-radius: 7px; }
        .ex-ask { flex-wrap: wrap; } .ex-ask button { width: 100%; }
        .ex-entry-team { display: none; }
      }
      @media (prefers-reduced-motion: reduce) { .ex-dots i, .ex-cursor, .ex-live-dot, .ex-card-dot, .ex-seal { animation: none; } }
    `}</style>
  );
}
