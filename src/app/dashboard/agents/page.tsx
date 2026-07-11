"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, Quote, ArrowRight } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Индивидуальность каждого агента ─────────────────────────────────────────
type Char = { trait: string; approach: string; quote: string; strengths: { l: string; v: number }[] };
const CHARS: Record<string, Char> = {
  ceo:      { trait: "Визионер",       approach: "Мыслит на три хода вперёд и связывает разрозненное в одну стратегию.", quote: "Сначала — куда и зачем. Потом — как.", strengths: [{ l: "Стратегия", v: 96 }, { l: "Синтез", v: 94 }, { l: "Решительность", v: 90 }] },
  cfo:      { trait: "Скептик",        approach: "Проверяет каждую идею цифрами до последней копейки.", quote: "Покажите юнит-экономику — и я скажу, жить идее или нет.", strengths: [{ l: "Финмодель", v: 95 }, { l: "Дисциплина", v: 92 }, { l: "Прогноз", v: 88 }] },
  cmo:      { trait: "Драйвер роста",  approach: "Ищет самый дешёвый способ проверить спрос и кратно его масштабировать.", quote: "Спрос не обсуждают — его тестируют.", strengths: [{ l: "Каналы", v: 94 }, { l: "Креатив", v: 90 }, { l: "Данные", v: 87 }] },
  coo:      { trait: "Систематизатор", approach: "Превращает хаос в повторяемые процессы и SLA.", quote: "Если это нельзя повторить — это не бизнес.", strengths: [{ l: "Процессы", v: 93 }, { l: "Исполнение", v: 91 }, { l: "Порядок", v: 89 }] },
  cto:      { trait: "Прагматик",      approach: "Строит минимально достаточное решение, которое выдержит рост.", quote: "Сначала работает — потом красиво.", strengths: [{ l: "Архитектура", v: 95 }, { l: "MVP", v: 92 }, { l: "Скорость", v: 88 }] },
  analyst:  { trait: "Дотошный",       approach: "Не верит на слово — всё проверяет на данных.", quote: "Мнение — это гипотеза, пока нет данных.", strengths: [{ l: "Данные", v: 93 }, { l: "Логика", v: 91 }, { l: "Внимание", v: 90 }] },
  invest:   { trait: "Оценщик",        approach: "Смотрит на бизнес глазами инвестора и считает отдачу.", quote: "Деньги идут туда, где отдача выше риска.", strengths: [{ l: "Оценка", v: 92 }, { l: "Сделки", v: 89 }, { l: "Чутьё", v: 87 }] },
  risk:     { trait: "Страж",          approach: "Находит, что может сломаться, раньше, чем это сломается.", quote: "Лучший риск — тот, который вы увидели первым.", strengths: [{ l: "Риски", v: 92 }, { l: "Сценарии", v: 90 }, { l: "Хладнокровие", v: 88 }] },
  brand:    { trait: "Рассказчик",     approach: "Формулирует, чем вы отличаетесь и почему это важно.", quote: "Бренд — это обещание, которое вы держите.", strengths: [{ l: "Позиционирование", v: 93 }, { l: "Нарратив", v: 91 }, { l: "Вкус", v: 88 }] },
  growth:   { trait: "Экспериментатор", approach: "Гоняет десятки быстрых тестов и оставляет то, что растёт.", quote: "Один хороший эксперимент важнее ста мнений.", strengths: [{ l: "Эксперименты", v: 92 }, { l: "Скорость", v: 90 }, { l: "Аналитика", v: 87 }] },
  market:   { trait: "Разведчик",      approach: "Знает рынок, конкурентов и боли клиентов лучше их самих.", quote: "Побеждает тот, кто раньше понял клиента.", strengths: [{ l: "Разведка", v: 92 }, { l: "Тренды", v: 89 }, { l: "Инсайты", v: 88 }] },
  pr:       { trait: "Голос",          approach: "Делает так, чтобы о вас говорили нужные люди.", quote: "Репутацию строят годами и словами.", strengths: [{ l: "Медиа", v: 89 }, { l: "Репутация", v: 88 }, { l: "Связи", v: 86 }] },
  sales:    { trait: "Закрывающий",    approach: "Ведёт клиента от интереса до оплаты без потерь.", quote: "Нет закрытой сделки — нет бизнеса.", strengths: [{ l: "Воронка", v: 91 }, { l: "Переговоры", v: 90 }, { l: "Напор", v: 88 }] },
  hr:       { trait: "Наставник",      approach: "Собирает команду, которая тянет, и удерживает её.", quote: "Стратегию исполняют люди, а не слайды.", strengths: [{ l: "Найм", v: 89 }, { l: "Культура", v: 88 }, { l: "Эмпатия", v: 90 }] },
  legal:    { trait: "Защитник",       approach: "Убирает юридические мины до того, как вы на них наступите.", quote: "Договор пишут на случай, когда всё пойдёт не так.", strengths: [{ l: "Право", v: 90 }, { l: "Комплаенс", v: 89 }, { l: "Точность", v: 91 }] },
  supply:   { trait: "Логист",         approach: "Выжимает маржу из цепочки поставок и сроков.", quote: "Каждый лишний день на складе — это ваши деньги.", strengths: [{ l: "Логистика", v: 89 }, { l: "Маржа", v: 88 }, { l: "Оптимизация", v: 87 }] },
  data:     { trait: "Аналитик",       approach: "Превращает сырые данные в прогнозы, которым можно верить.", quote: "Данные не врут — врут те, кто их не смотрит.", strengths: [{ l: "Аналитика", v: 93 }, { l: "Модели", v: 91 }, { l: "Точность", v: 89 }] },
  product:  { trait: "Архитектор ценности", approach: "Отсекает лишнее и оставляет то, что решает боль пользователя.", quote: "Лучшая фича — та, которую не пришлось строить.", strengths: [{ l: "Роадмап", v: 93 }, { l: "Приоритеты", v: 92 }, { l: "Фокус", v: 90 }] },
  ux:       { trait: "Адвокат пользователя", approach: "Находит, где люди путаются, и убирает трение.", quote: "Если нужно объяснять — значит, дизайн не готов.", strengths: [{ l: "Исследования", v: 91 }, { l: "Юзабилити", v: 90 }, { l: "Эмпатия", v: 89 }] },
  strategy: { trait: "Советник",       approach: "Даёт независимый взгляд и показывает развилки, которых вы не видите.", quote: "Иногда правильный ход — не делать очевидный.", strengths: [{ l: "Сценарии", v: 94 }, { l: "Аудит", v: 91 }, { l: "Независимость", v: 92 }] },
};

type Agent = TeamMember & Char;
const AGENTS: Agent[] = TEAM.map(m => ({ ...m, ...(CHARS[m.slug] ?? { trait: "Специалист", approach: m.title, quote: "", strengths: [] }) }));

export default function TeamExplorerPage() {
  const [slug, setSlug] = useState("ceo");
  const a = AGENTS.find(x => x.slug === slug)!;
  const lead = a.reportsTo ? TEAM_BY_SLUG[a.reportsTo] : null;

  return (
    <div className="te-root">
      <div className="te-wrap">
        <div className="te-head">
          <div className="te-eyebrow">ПОЗНАКОМЬТЕСЬ С КОМАНДОЙ · 20 ХАРАКТЕРОВ</div>
          <h1 className="te-title">У каждого агента — свой характер и стиль</h1>
          <p className="te-sub">Выберите специалиста, узнайте его подход и сильные стороны — и поговорите с ним один на один.</p>
        </div>

        {/* Selector — all 20, individual colors */}
        <div className="te-rail">
          {AGENTS.map(x => (
            <button key={x.slug} className={`te-chip${x.slug === slug ? " on" : ""}`} onClick={() => setSlug(x.slug)}
              style={x.slug === slug ? { borderColor: x.c, background: `rgba(${hexToRgb(x.c)},0.1)` } : undefined}>
              <span className="te-chip-av" style={{ background: `linear-gradient(135deg,${x.g[0]},${x.g[1]})` }}>{x.ab}</span>
              <span className="te-chip-text">
                <span className="te-chip-name">{x.name.split(" ")[0]}</span>
                <span className="te-chip-role" style={{ color: x.slug === slug ? x.c : undefined }}>{x.role}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Spotlight */}
        <AnimatePresence mode="wait">
          <motion.div key={a.slug} className="te-spot"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: EASE }}
            style={{ background: `radial-gradient(120% 140% at 0% 0%, rgba(${hexToRgb(a.c)},0.14), rgba(255,255,255,0.02) 55%)`, borderColor: `rgba(${hexToRgb(a.c)},0.28)` }}>
            <div className="te-spot-glow" style={{ background: `radial-gradient(circle, rgba(${hexToRgb(a.c)},0.4), transparent 70%)` }} />

            <div className="te-spot-grid">
              {/* Identity */}
              <div className="te-identity">
                <div className="te-id-head">
                  <span className="te-id-av" style={{ background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})`, boxShadow: `0 8px 28px rgba(${hexToRgb(a.c)},0.4), inset 0 1px 0 rgba(255,255,255,0.25)` }}>{a.ab}</span>
                  <div>
                    <div className="te-id-name">{a.name}</div>
                    <div className="te-id-role">{a.title}</div>
                    <div className="te-id-tags">
                      <span className="te-trait" style={{ color: a.c, borderColor: `${a.c}55` }}>{a.trait}</span>
                      {lead && <span className="te-reports">подчиняется {lead.role}</span>}
                    </div>
                  </div>
                </div>

                <div className="te-quote" style={{ borderColor: `${a.c}33` }}>
                  <Quote size={18} style={{ color: a.c, opacity: 0.7 }} />
                  <p>{a.quote}</p>
                </div>

                <p className="te-approach">{a.approach}</p>

                <div className="te-strengths">
                  <div className="te-strengths-label">СИЛЬНЫЕ СТОРОНЫ</div>
                  {a.strengths.map((s, i) => (
                    <div key={s.l} className="te-str">
                      <div className="te-str-top"><span>{s.l}</span><span style={{ color: a.c }}>{s.v}</span></div>
                      <div className="te-str-track">
                        <motion.i initial={{ width: 0 }} animate={{ width: `${s.v}%` }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.1 }} style={{ background: `linear-gradient(90deg,${a.g[0]},${a.g[1]})` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <TalkPanel agent={a} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <TeStyles />
    </div>
  );
}

// ─── 1:1 chat ────────────────────────────────────────────────────────────────
function TalkPanel({ agent }: { agent: Agent }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async () => {
    const question = q.trim(); if (!question || busy) return;
    setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — ${agent.name}, ${agent.title} в AI-команде Apex AI. Твой характер: ${agent.trait}. Твой подход: ${agent.approach} Отвечай в этом характере — по делу, с конкретикой, 4–6 предложений, обычный текст без markdown. Если данных мало — задай 1–2 уточняющих вопроса.`;
    try { await streamChat(question, persona, t => setAnswer(prev => prev + t)); }
    catch { setOffline(true); const fb = `${agent.name}: готов взяться — опишите задачу подробнее, и я разберу её со своей стороны. Живой анализ доступен после настройки ANTHROPIC_API_KEY.`; for (const ch of fb) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); } }
    setBusy(false);
  }, [q, busy, agent]);

  return (
    <div className="te-talk">
      <div className="te-talk-label">ПОГОВОРИТЬ С {agent.name.split(" ")[0].toUpperCase()}</div>
      <div className="te-talk-ask">
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void submit(); }}
          disabled={busy} placeholder="Ваш вопрос или задача…" spellCheck={false} />
        <button onClick={() => void submit()} disabled={busy || !q.trim()} style={{ background: `linear-gradient(135deg,${agent.g[0]},${agent.g[1]})` }} aria-label="Отправить">
          {busy ? <span className="te-dots"><i /><i /><i /></span> : <CornerDownLeft size={15} strokeWidth={2.4} />}
        </button>
      </div>
      <div className="te-talk-body">
        {(answer || busy) ? (
          <p className="te-talk-answer">{answer}{busy && <span className="te-cursor" style={{ background: agent.c }} />}</p>
        ) : (
          <div className="te-talk-empty">
            <span style={{ color: agent.c }}>▸</span> Задайте вопрос — {agent.name.split(" ")[0]} ответит в своём стиле «{agent.trait.toLowerCase()}».
          </div>
        )}
        {offline && !busy && <div className="te-offline">Демо-ответ — настройте ANTHROPIC_API_KEY</div>}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function TeStyles() {
  return (
    <style jsx global>{`
      .te-root { background: #05060A; min-height: 100%; }
      .te-wrap { max-width: 1100px; margin: 0 auto; padding: 30px 24px 60px; }
      .te-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 9px; }
      .te-title { font-size: 27px; font-weight: 800; letter-spacing: -0.025em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; }
      .te-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 60ch; margin: 0 0 22px; }

      .te-rail { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 18px; scrollbar-width: thin; }
      .te-rail::-webkit-scrollbar { height: 6px; } .te-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      .te-chip { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; border-radius: 12px; cursor: pointer;
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); transition: border-color .16s, background .16s, transform .16s; }
      .te-chip:hover { transform: translateY(-2px); background: rgba(255,255,255,0.04); }
      .te-chip-av { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
      .te-chip-text { display: flex; flex-direction: column; text-align: left; }
      .te-chip-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); line-height: 1.15; }
      .te-chip-role { font-family: var(--font-geist-mono), monospace; font-size: 9px; color: rgba(255,255,255,0.4); }

      .te-spot { position: relative; border-radius: 22px; border: 1px solid; overflow: hidden; padding: 28px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05); }
      .te-spot-glow { position: absolute; top: -120px; left: -120px; width: 340px; height: 340px; pointer-events: none; opacity: 0.5; }
      .te-spot-grid { position: relative; display: grid; grid-template-columns: 1fr 340px; gap: 28px; }

      .te-id-head { display: flex; gap: 15px; margin-bottom: 18px; }
      .te-id-av { width: 60px; height: 60px; flex-shrink: 0; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 18px; font-weight: 800; }
      .te-id-name { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
      .te-id-role { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 1px; }
      .te-id-tags { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
      .te-trait { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 8px; border: 1px solid; }
      .te-reports { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(255,255,255,0.4); }
      .te-quote { display: flex; gap: 11px; padding: 14px 16px; border-radius: 14px; border: 1px solid; background: rgba(255,255,255,0.02); margin-bottom: 16px; }
      .te-quote svg { flex-shrink: 0; margin-top: 2px; }
      .te-quote p { font-size: 16px; font-weight: 600; line-height: 1.45; color: rgba(255,255,255,0.9); margin: 0; letter-spacing: -0.01em; }
      .te-approach { font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.6); margin: 0 0 20px; max-width: 54ch; }
      .te-strengths-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); margin-bottom: 12px; }
      .te-str { margin-bottom: 11px; }
      .te-str-top { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.65); margin-bottom: 5px; }
      .te-str-top span:last-child { font-family: var(--font-geist-mono), monospace; font-weight: 700; font-variant-numeric: tabular-nums; }
      .te-str-track { height: 6px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden; }
      .te-str-track i { display: block; height: 100%; border-radius: 4px; }

      .te-talk { display: flex; flex-direction: column; border-radius: 16px; background: rgba(5,6,10,0.5); border: 1px solid rgba(255,255,255,0.07); padding: 16px; }
      .te-talk-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
      .te-talk-ask { display: flex; gap: 7px; margin-bottom: 12px; }
      .te-talk-ask input { flex: 1; min-width: 0; height: 42px; padding: 0 13px; border-radius: 11px; font-size: 13px; color: #E5E7EB; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
      .te-talk-ask input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.09); }
      .te-talk-ask button { flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); transition: transform .15s, opacity .15s; }
      .te-talk-ask button:hover:not(:disabled) { transform: translateY(-1px); }
      .te-talk-ask button:disabled { opacity: 0.5; cursor: not-allowed; }
      .te-talk-body { flex: 1; min-height: 120px; }
      .te-talk-answer { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.82); margin: 0; white-space: pre-wrap; }
      .te-talk-empty { font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,0.4); }
      .te-cursor { display: inline-block; width: 7px; height: 13px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: te-caret 1s step-end infinite; }
      @keyframes te-caret { 50% { opacity: 0; } }
      .te-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 10px; }
      .te-dots { display: inline-flex; gap: 3px; } .te-dots i { width: 4px; height: 4px; border-radius: 50%; background: #fff; animation: te-blink 1s infinite; }
      .te-dots i:nth-child(2){animation-delay:.15s} .te-dots i:nth-child(3){animation-delay:.3s}
      @keyframes te-blink { 0%,100%{opacity:.3} 50%{opacity:1} }

      @media (max-width: 860px) { .te-spot-grid { grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce) { .te-cursor, .te-dots i { animation: none; } }
    `}</style>
  );
}
