"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, Check, Loader2, ArrowUpRight, MessageSquare, X } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Характеристики агентов (для карточек в стиле дашборда) ───────────────────
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

// детерминированный «восходящий» спарклайн на агента
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
  cfo: "С финансовой стороны: считаю юнит-экономику. Если LTV/CAC ниже 3 — сначала чиним экономику. Предлагаю пилот с жёстким лимитом бюджета и точкой пересмотра через 30 дней.",
  cmo: "С точки зрения роста: спрос проверяем дешёвым тестом — лендинг плюс два канала, решение по данным конверсии. Выше бенчмарка — масштабируем.",
  cto: "Технически реализуемо, но закладываю 2–3 недели на MVP. Начинаем с самого узкого сценария, который проверяет гипотезу.",
  coo: "По операциям: до запуска нужны владелец процесса, SLA и чек-лист. Иначе рост превратится в хаос поддержки.",
  legal: "По праву: блокеров для запуска нет при поэтапном входе. Фиксируем договорную базу и стоп-лосс заранее.",
};
const FB_SOLUTION = "Решение совета: гипотеза достойна проверки, но входим поэтапно. Шаг 1 — дешёвый тест спроса за 7–14 дней. Шаг 2 — при метриках выше порога собираем MVP. Шаг 3 — пересмотр через 30 дней. Живой анализ доступен после подключения ANTHROPIC_API_KEY.";

type Contribution = { slug: string; text: string; done: boolean };
type Session = { q: string; team: string[]; phase: "work" | "solution" | "done"; current?: string; contribs: Contribution[]; solution: string; offline: boolean };

export default function BoardPage() {
  const [q, setQ] = useState("");
  const [s, setS] = useState<Session | null>(null);
  const [ask, setAsk] = useState<AgentFull | null>(null);
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
      const persona = `Ты — ${m.name}, ${m.title} в совете директоров Apex AI. Основатель принёс задачу. ${prev ? `Коллеги уже высказались:\n${prev}\n\nДополни или аргументированно поспорь.` : ""} Дай профессиональный разбор из своей зоны: 3–4 предложения, конкретика и цифры, обычный текст без markdown.`;
      let text = "";
      if (!offline) { try { text = await streamChat(question, persona, appendLast); } catch { offline = true; } }
      if (offline) { text = FB[slug] ?? FB.cfo; for (const ch of text) { appendLast(ch); await new Promise(r => setTimeout(r, 6)); } }
      opinions.push({ slug, text });
      setS(p => { if (!p) return p; const c = [...p.contribs]; c[c.length - 1] = { ...c[c.length - 1], done: true }; return { ...p, contribs: c, offline }; });
      await new Promise(r => setTimeout(r, 200));
    }
    setS(p => p && ({ ...p, phase: "solution", current: "ceo" }));
    const ceoPersona = `Ты — Sophia Rivers, CEO совета Apex AI. Профессионалы разобрали задачу:\n${opinions.map(o => `${TEAM_BY_SLUG[o.slug].name}: ${o.text}`).join("\n\n")}\n\nСведи в единое решение: короткий вывод и 3 конкретных шага по пунктам (1., 2., 3.). Максимум 7 предложений, без markdown-звёздочек.`;
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
    <div className="ex-root">
      <div className="ex-wrap">
        <div className="ex-head">
          <div className="ex-eyebrow">СОВЕТ ДИРЕКТОРОВ · 20 AI-АГЕНТОВ</div>
          <h1 className="ex-title">Опишите задачу — совет её решит</h1>
          <p className="ex-sub">Профильные директора разберут вашу ситуацию каждый со своей стороны и соберут единое решение с конкретными шагами.</p>
        </div>

        <div className="ex-ask">
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
            disabled={busy} placeholder="Например: стоит ли запускать вторую линейку продукта?" spellCheck={false} />
          <button onClick={submit} disabled={busy || !q.trim()}>
            {busy ? <span className="ex-dots"><i /><i /><i /></span> : <><span>Собрать совет</span><CornerDownLeft size={14} strokeWidth={2.4} /></>}
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

        {/* Solve session */}
        <AnimatePresence>
          {s && (
            <motion.div className="ex-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="ex-q">{s.q}</div>
              <div className="ex-team">
                <span className="ex-team-label">Над задачей работают</span>
                <div className="ex-team-list">
                  {s.team.map(slug => {
                    const m = TEAM_BY_SLUG[slug];
                    const contrib = s.contribs.find(c => c.slug === slug);
                    const state = contrib?.done ? "done" : s.current === slug ? "work" : contrib ? "done" : "wait";
                    return (
                      <div key={slug} className="ex-member">
                        <span className="ex-member-av" style={{ background: `linear-gradient(135deg,${m.g[0]},${m.g[1]})` }}>{m.ab}</span>
                        <span className="ex-member-info">
                          <span className="ex-member-name">{m.name}</span>
                          <span className="ex-member-state" style={{ color: state === "done" ? "#10b981" : state === "work" ? m.c : "rgba(255,255,255,0.35)" }}>
                            {state === "done" ? <><Check size={10} strokeWidth={3} />готово</> : state === "work" ? <><Loader2 size={10} className="ex-spin" />анализирует…</> : "в очереди"}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="ex-contribs">
                {s.contribs.map((c, i) => {
                  const m = TEAM_BY_SLUG[c.slug];
                  return (
                    <motion.div key={i} className="ex-contrib" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: EASE }}>
                      <div className="ex-contrib-side" style={{ background: `linear-gradient(180deg,${m.c}, transparent)` }} />
                      <div className="ex-contrib-body">
                        <div className="ex-contrib-head">
                          <span className="ex-contrib-av" style={{ background: `linear-gradient(135deg,${m.g[0]},${m.g[1]})` }}>{m.ab}</span>
                          <span className="ex-contrib-name">{m.name}</span>
                          <span className="ex-contrib-role">{m.title}</span>
                        </div>
                        <p className="ex-contrib-text">{c.text}{!c.done && <span className="ex-cursor" style={{ background: m.c }} />}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {(s.phase === "solution" || s.phase === "done") && (
                <motion.div className="ex-solution" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                  <div className="ex-solution-head">
                    <span className="ex-solution-av" style={{ background: `linear-gradient(135deg,${ceo.g[0]},${ceo.g[1]})` }}>{ceo.ab}</span>
                    <div><div className="ex-solution-title">Решение совета</div><div className="ex-solution-by">Синтез · {ceo.name}, CEO</div></div>
                  </div>
                  <p className="ex-solution-text">{s.solution}{s.phase === "solution" && <span className="ex-cursor" style={{ background: ceo.c }} />}</p>
                  {s.offline && s.phase === "done" && <div className="ex-offline">Демо-режим — настройте ANTHROPIC_API_KEY</div>}
                  {s.phase === "done" && <button className="ex-new" onClick={() => { setS(null); requestAnimationFrame(() => inputRef.current?.focus()); }}>Новая задача</button>}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Org structure — who works under which director */}
        <div className="ex-roster-head">
          <h2 className="ex-roster-title">Кто на кого работает</h2>
          <span className="ex-roster-count">Структура совета · нажмите на любого, чтобы спросить</span>
        </div>

        {C_LEVEL.map(lead => {
          const director = AGENTS.find(a => a.slug === lead.slug)!;
          const team = reportsOf(lead.slug).filter(m => m.tier === "specialist").map(m => AGENTS.find(a => a.slug === m.slug)!);
          const directReports = lead.slug === "ceo" ? C_LEVEL.filter(c => c.slug !== "ceo") : [];
          return (
            <div key={lead.slug} className="ex-dept">
              <motion.button className="ex-lead" onClick={() => setAsk(director)}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, ease: EASE }}
                whileHover={{ y: -3 }}
                style={{ background: `linear-gradient(135deg, rgba(${hexToRgb(director.c)},0.14), rgba(255,255,255,0.03))`, borderColor: `rgba(${hexToRgb(director.c)},0.3)` }}>
                <span className="ex-lead-av" style={{ background: `linear-gradient(135deg,${director.g[0]},${director.g[1]})` }}>{director.ab}</span>
                <div className="ex-lead-id">
                  <div className="ex-lead-name">{director.name} <span className="ex-lead-role" style={{ color: director.c }}>{director.role}</span></div>
                  <div className="ex-lead-title">{director.title}</div>
                </div>
                <div className="ex-lead-meta">
                  <div className="ex-lead-conf" style={{ color: director.c }}>{director.confidence}%</div>
                  <div className="ex-lead-sub">{lead.slug === "ceo" ? "руководит всем советом" : `${team.length} в команде`}</div>
                </div>
              </motion.button>

              {directReports.length > 0 && (
                <div className="ex-directs">
                  <span className="ex-directs-label">Прямые подчинённые</span>
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

// ─── Agent card (dashboard style) ────────────────────────────────────────────
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
      .ex-root { background: #05060A; min-height: 100%; }
      .ex-wrap { max-width: 1160px; margin: 0 auto; padding: 32px 24px 60px; }
      .ex-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 9px; }
      .ex-title { font-size: 29px; font-weight: 800; letter-spacing: -0.025em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
      .ex-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 60ch; margin: 0 0 22px; }

      .ex-ask { display: flex; gap: 8px; max-width: 760px; }
      .ex-ask input { flex: 1; min-width: 0; height: 52px; padding: 0 18px; border-radius: 14px; font-size: 15px; color: #E5E7EB;
        background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
      .ex-ask input::placeholder { color: rgba(255,255,255,0.3); }
      .ex-ask input:focus { border-color: rgba(99,102,241,0.55); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
      .ex-ask button { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 22px; border-radius: 14px; border: none; cursor: pointer;
        font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5);
        box-shadow: 0 4px 16px rgba(99,102,241,0.32), inset 0 1px 0 rgba(255,255,255,0.18); transition: transform .15s, opacity .15s; }
      .ex-ask button:hover:not(:disabled) { transform: translateY(-1px); }
      .ex-ask button:disabled { opacity: 0.55; cursor: not-allowed; }
      .ex-dots { display: inline-flex; gap: 4px; } .ex-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: ex-blink 1s infinite; }
      .ex-dots i:nth-child(2){animation-delay:.15s} .ex-dots i:nth-child(3){animation-delay:.3s}
      @keyframes ex-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

      .ex-examples { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
      .ex-examples button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 11px; cursor: pointer;
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.65); font-size: 13px; transition: background .16s, border-color .16s, transform .16s; }
      .ex-examples button:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.13); transform: translateY(-1px); }
      .ex-examples svg { color: rgba(255,255,255,0.3); }

      .ex-session { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; max-width: 820px; }
      .ex-q { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
      .ex-team { padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
      .ex-team-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); }
      .ex-team-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 11px; }
      .ex-member { display: flex; align-items: center; gap: 9px; padding: 8px 12px 8px 8px; border-radius: 11px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
      .ex-member-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
      .ex-member-info { display: flex; flex-direction: column; }
      .ex-member-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); line-height: 1.2; }
      .ex-member-state { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-geist-mono), monospace; font-size: 9.5px; margin-top: 1px; }
      .ex-spin { animation: ex-rot 0.9s linear infinite; } @keyframes ex-rot { to { transform: rotate(360deg); } }
      .ex-contribs { display: flex; flex-direction: column; gap: 12px; }
      .ex-contrib { display: flex; border-radius: 14px; overflow: hidden; background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.07); }
      .ex-contrib-side { width: 3px; flex-shrink: 0; }
      .ex-contrib-body { flex: 1; min-width: 0; padding: 14px 16px; }
      .ex-contrib-head { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
      .ex-contrib-av { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
      .ex-contrib-name { font-size: 13.5px; font-weight: 700; color: #fff; }
      .ex-contrib-role { font-size: 11.5px; color: rgba(255,255,255,0.42); }
      .ex-contrib-text { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.78); margin: 0; white-space: pre-wrap; }
      .ex-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: ex-caret 1s step-end infinite; }
      @keyframes ex-caret { 50% { opacity: 0; } }
      .ex-solution { border-radius: 16px; border: 1px solid rgba(99,102,241,0.3); background: linear-gradient(180deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02)); padding: 18px 20px; box-shadow: 0 12px 40px rgba(99,102,241,0.08); }
      .ex-solution-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .ex-solution-av { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 13px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.22); }
      .ex-solution-title { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
      .ex-solution-by { font-size: 11.5px; color: rgba(255,255,255,0.45); }
      .ex-solution-text { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.85); margin: 0; white-space: pre-wrap; }
      .ex-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 12px; }
      .ex-new { margin-top: 16px; height: 38px; padding: 0 18px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); transition: color .16s, border-color .16s; }
      .ex-new:hover { color: #fff; border-color: rgba(255,255,255,0.2); }

      /* Roster grid — dashboard-style cards */
      .ex-roster-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 44px 0 18px; }
      .ex-roster-title { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0; }
      .ex-roster-count { font-size: 12px; color: rgba(255,255,255,0.4); }

      /* Department / director group */
      .ex-dept { margin-bottom: 26px; padding-left: 14px; border-left: 1px solid rgba(255,255,255,0.06); }
      .ex-lead { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; cursor: pointer; padding: 13px 16px; border-radius: 14px; border: 1px solid; margin-bottom: 12px;
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

      /* Ask modal */
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

      @media (max-width: 560px) { .ex-ask { flex-wrap: wrap; } .ex-ask button { width: 100%; } }
      @media (prefers-reduced-motion: reduce) { .ex-dots i, .ex-cursor, .ex-spin, .ex-card-dot { animation: none; } }
    `}</style>
  );
}
