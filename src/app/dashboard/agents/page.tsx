"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft, ArrowUpRight } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, type TeamMember } from "@/lib/team";

// desc + статус-глагол на каждого агента
const META: Record<string, { desc: string; st: string }> = {
  ceo:      { desc: "Определяет стратегию, синтезирует мнения совета, строит роадмап.", st: "Анализирует" },
  cfo:      { desc: "Считает юнит-экономику, прогнозы, ROI и точку безубыточности.",    st: "Считает" },
  cmo:      { desc: "Строит маркетинг-стратегию, каналы и кампании роста.",             st: "Создаёт" },
  coo:      { desc: "Оптимизирует операции, процессы и эффективность команды.",         st: "Оптимизирует" },
  cto:      { desc: "Оценивает технологии, архитектуру и реализуемость продукта.",      st: "Проектирует" },
  analyst:  { desc: "Собирает данные, строит модели и проверяет гипотезы.",             st: "Исследует" },
  invest:   { desc: "Оценивает инвест-привлекательность и сравнимые сделки.",           st: "Оценивает" },
  risk:     { desc: "Находит риски и предлагает меры их снижения.",                     st: "Проверяет" },
  brand:    { desc: "Формирует позиционирование и бренд-нарратив.",                     st: "Формулирует" },
  growth:   { desc: "Запускает эксперименты роста и находит точки взлёта.",             st: "Экспериментирует" },
  market:   { desc: "Изучает рынок, тренды и конкурентов.",                             st: "Разведывает" },
  pr:       { desc: "Управляет коммуникациями и репутацией.",                           st: "Транслирует" },
  sales:    { desc: "Строит воронку продаж и процессы закрытия сделок.",                st: "Планирует" },
  hr:       { desc: "Отвечает за найм, культуру и структуру команды.",                  st: "Нанимает" },
  legal:    { desc: "Проверяет право, комплаенс и договоры.",                           st: "Проверяет" },
  supply:   { desc: "Оптимизирует цепочку поставок и логистику.",                       st: "Оптимизирует" },
  data:     { desc: "Анализирует данные и строит прогнозные модели.",                   st: "Моделирует" },
  product:  { desc: "Определяет продуктовую стратегию, скоуп и приоритеты.",            st: "Приоритизирует" },
  ux:       { desc: "Исследует пользователей и проверяет удобство решений.",            st: "Исследует" },
  strategy: { desc: "Даёт независимый стратегический взгляд и сценарии.",               st: "Стратегирует" },
};

const DEPTS: { key: TeamMember["dept"]; label: string }[] = [
  { key: "leadership", label: "Руководство" },
  { key: "finance",    label: "Финансы" },
  { key: "marketing",  label: "Маркетинг" },
  { key: "operations", label: "Операции" },
  { key: "tech",       label: "Технологии" },
  { key: "product",    label: "Продукт" },
];

const FALLBACK: Record<string, string> = {
  leadership: "Смотрю стратегически: сформулируйте цель на 90 дней и одну ключевую метрику. Я разложу её на инициативы и укажу самое узкое место. Полный живой анализ доступен после настройки API-ключа.",
  finance:    "По финансам: пришлите цену, себестоимость и объём — посчитаю маржу, точку безубыточности и чувствительность прибыли. Для расчёта по вашим цифрам нужен API-ключ.",
  marketing:  "По маркетингу: для старта хватит двух каналов и одного оффера. Предложу связку канал→сегмент→сообщение и метрики на 7 дней. Живые рекомендации — после настройки API-ключа.",
  operations: "По операциям: назовите процесс, который болит, — разложу на шаги, найду узкое место и что автоматизировать первым. Для детального плана подключите API-ключ.",
  tech:       "По технологиям: опишите ключевой сценарий — оценю реализуемость, риски и минимальный MVP. Живой разбор доступен после настройки API-ключа.",
  product:    "По продукту: сформулируйте боль пользователя одним предложением — проверю, решает ли её текущая фича, и предложу минимальный скоуп MVP. Живой анализ — после настройки API-ключа.",
};

type Agent = TeamMember & { desc: string; st: string };
const AGENTS: Agent[] = TEAM.map(m => ({ ...m, desc: META[m.slug]?.desc ?? m.title, st: META[m.slug]?.st ?? "Работает" }));

const EASE = [0.22, 1, 0.36, 1] as const;

export default function TeamPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("ceo");
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const agent = AGENTS.find(a => a.slug === selected)!;

  const groups = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return DEPTS.map(d => ({
      ...d,
      items: AGENTS.filter(a => a.dept === d.key && (!ql || a.name.toLowerCase().includes(ql) || a.title.toLowerCase().includes(ql) || a.role.toLowerCase().includes(ql))),
    })).filter(g => g.items.length > 0);
  }, [query]);

  const pick = useCallback((slug: string) => {
    setSelected(slug); setAnswer(""); setQ(""); setOffline(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const submit = useCallback(async () => {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — ${agent.name}, ${agent.title} в AI-команде Apex AI, работаешь на основателя бизнеса. ${agent.desc} Ответь на русском, конкретно и по делу, 4–7 предложений, без воды. Обычный текст без markdown-разметки (никаких ** и #). Если не хватает данных — задай 1–2 уточняющих вопроса в конце.`;
    try {
      await streamChat(question, persona, t => setAnswer(prev => prev + t));
    } catch {
      setOffline(true);
      const fb = FALLBACK[agent.dept] ?? FALLBACK.leadership;
      for (const ch of fb) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 7)); }
    }
    setBusy(false);
  }, [q, busy, agent]);

  return (
    <div className="tm-wrap">
      {/* Header */}
      <div className="tm-head">
        <div>
          <div className="tm-eyebrow">КОМАНДА · 20 AI-ДИРЕКТОРОВ</div>
          <h1 className="tm-title">Ваша AI-команда</h1>
        </div>
        <div className="tm-search">
          <Search size={14} strokeWidth={2} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти директора…" spellCheck={false} />
        </div>
      </div>

      <div className="tm-body">
        {/* ── LIST ── */}
        <aside className="tm-list">
          {groups.length === 0 && <div className="tm-empty">Никого не найдено</div>}
          {groups.map(g => (
            <div key={g.key} className="tm-group">
              <div className="tm-group-label">{g.label}</div>
              {g.items.map(a => {
                const on = a.slug === selected;
                return (
                  <button key={a.slug} onClick={() => pick(a.slug)} className={`tm-row${on ? " on" : ""}`}>
                    <span className="tm-avatar" style={{ color: a.c, borderColor: on ? a.c : "rgba(255,255,255,0.1)" }}>{a.ab}</span>
                    <span className="tm-row-text">
                      <span className="tm-row-name">{a.name}</span>
                      <span className="tm-row-role">{a.title}</span>
                    </span>
                    {on && <motion.span layoutId="tm-marker" className="tm-marker" style={{ background: a.c }} transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ── DETAIL ── */}
        <section className="tm-detail">
          <AnimatePresence mode="wait">
            <motion.div key={agent.slug}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE }}>
              {/* Agent header */}
              <div className="tm-d-head">
                <span className="tm-d-avatar" style={{ color: agent.c, borderColor: `${agent.c}55` }}>
                  {agent.ab}
                  <span className="tm-d-dot" style={{ background: agent.c }} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 className="tm-d-name">{agent.name}</h2>
                  <div className="tm-d-role">{agent.title} · <span style={{ color: agent.c }}>{agent.st}</span></div>
                </div>
                <Link href={`/dashboard/executives`} className="tm-d-board">
                  Совет <ArrowUpRight size={13} strokeWidth={2} />
                </Link>
              </div>

              <p className="tm-d-desc">{agent.desc}</p>

              {/* Ask console */}
              <div className="tm-ask-label">Спросить {agent.name.split(" ")[0]}</div>
              <div className="tm-ask">
                <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") void submit(); }}
                  disabled={busy} placeholder={`Например: оцени мою идею с точки зрения «${agent.title.toLowerCase()}»`} spellCheck={false} />
                <button onClick={() => void submit()} disabled={busy || !q.trim()} aria-label="Отправить"
                  style={{ background: agent.c }}>
                  {busy ? <span className="tm-dots"><i /><i /><i /></span> : <CornerDownLeft size={15} strokeWidth={2.4} />}
                </button>
              </div>

              <AnimatePresence>
                {(answer || busy) && (
                  <motion.div className="tm-answer"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}>
                    <p>{answer}{busy && <span className="tm-cursor" style={{ background: agent.c }} />}</p>
                    {offline && !busy && <div className="tm-offline">Демо-ответ — настройте ANTHROPIC_API_KEY для живого анализа</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <style jsx global>{`
        .tm-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 24px 56px; }
        .tm-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
        .tm-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 8px; }
        .tm-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0; }
        .tm-search { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; border-radius: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.4);
          transition: border-color 0.18s ease, background 0.18s ease; }
        .tm-search:focus-within { border-color: rgba(99,102,241,0.5); background: rgba(255,255,255,0.05); }
        .tm-search input { background: none; border: none; outline: none; color: #E5E7EB; font-size: 13px; width: 190px; }
        .tm-search input::placeholder { color: rgba(255,255,255,0.3); }

        .tm-body { display: grid; grid-template-columns: 300px minmax(0,1fr); gap: 28px; align-items: start; }
        .tm-list { display: flex; flex-direction: column; gap: 18px; }
        .tm-empty { font-size: 13px; color: rgba(255,255,255,0.35); padding: 8px 4px; }
        .tm-group-label { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.3); padding: 0 10px 8px; }
        .tm-row { position: relative; display: flex; align-items: center; gap: 11px; width: 100%; text-align: left;
          padding: 8px 10px; border-radius: 10px; border: none; background: transparent; cursor: pointer;
          transition: background 0.16s ease; }
        .tm-row:hover { background: rgba(255,255,255,0.03); }
        .tm-row.on { background: rgba(255,255,255,0.045); }
        .tm-row:focus-visible { outline: 2px solid rgba(99,102,241,0.6); outline-offset: -2px; }
        .tm-avatar { flex-shrink: 0; width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 800;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); transition: border-color 0.16s ease; }
        .tm-row-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .tm-row-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.88); line-height: 1.25; }
        .tm-row.on .tm-row-name { color: #fff; }
        .tm-row-role { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tm-marker { position: absolute; left: 0; top: 9px; bottom: 9px; width: 2.5px; border-radius: 2px; }

        .tm-detail { border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.018);
          box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04);
          padding: 26px 28px; min-height: 340px; }
        .tm-d-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .tm-d-avatar { position: relative; flex-shrink: 0; width: 52px; height: 52px; border-radius: 13px; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-geist-mono), monospace; font-size: 15px; font-weight: 800;
          background: rgba(255,255,255,0.025); border: 1px solid; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); }
        .tm-d-dot { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid #0a0b12; }
        .tm-d-name { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #fff; margin: 0 0 2px; }
        .tm-d-role { font-size: 13px; color: rgba(255,255,255,0.5); }
        .tm-d-board { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 12px; border-radius: 9px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); text-decoration: none;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: color 0.16s, border-color 0.16s; }
        .tm-d-board:hover { color: #fff; border-color: rgba(255,255,255,0.16); }
        .tm-d-desc { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.6); max-width: 62ch; margin: 0 0 24px;
          padding-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .tm-ask-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 9px; }
        .tm-ask { display: flex; gap: 8px; }
        .tm-ask input { flex: 1; min-width: 0; height: 44px; padding: 0 14px; border-radius: 11px; font-size: 13.5px; color: #E5E7EB;
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
        .tm-ask input::placeholder { color: rgba(255,255,255,0.3); }
        .tm-ask input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.09); }
        .tm-ask button { flex-shrink: 0; width: 44px; height: 44px; border-radius: 11px; border: none; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.15s ease, opacity 0.15s ease; }
        .tm-ask button:hover:not(:disabled) { transform: translateY(-1px); }
        .tm-ask button:active:not(:disabled) { transform: translateY(0); }
        .tm-ask button:disabled { opacity: 0.5; cursor: not-allowed; }
        .tm-dots { display: inline-flex; gap: 3px; }
        .tm-dots i { width: 4px; height: 4px; border-radius: 50%; background: #fff; animation: tm-blink 1s infinite; }
        .tm-dots i:nth-child(2) { animation-delay: 0.15s; } .tm-dots i:nth-child(3) { animation-delay: 0.3s; }
        @keyframes tm-blink { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .tm-answer { margin-top: 14px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); padding: 16px 18px; }
        .tm-answer p { font-size: 13.5px; line-height: 1.65; color: rgba(255,255,255,0.82); margin: 0; white-space: pre-wrap; }
        .tm-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: tm-caret 1s step-end infinite; }
        @keyframes tm-caret { 50% { opacity: 0; } }
        .tm-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 10px; }

        @media (max-width: 820px) {
          .tm-body { grid-template-columns: 1fr; }
          .tm-list { flex-direction: row; overflow-x: auto; gap: 12px; padding-bottom: 6px; }
          .tm-group { flex-shrink: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .tm-dots i, .tm-cursor { animation: none; } }
      `}</style>
    </div>
  );
}
