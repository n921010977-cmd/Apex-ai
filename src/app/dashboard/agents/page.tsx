"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// Что решает каждый профессионал + что выдаёт (чёткий деловой оффер)
const PROF: Record<string, { solves: string; delivers: string; skills: string[] }> = {
  ceo:      { solves: "Не понимаете, за что хвататься и куда вести бизнес", delivers: "Стратегия и приоритеты на 90 дней", skills: ["Стратегия", "Приоритизация", "Синтез"] },
  cfo:      { solves: "Не ясно, окупится ли идея и где утекают деньги",      delivers: "Финмодель, юнит-экономика, точка безубыточности", skills: ["Финмодель", "ROI", "Runway"] },
  cmo:      { solves: "Продукт хороший, но клиенты не приходят",             delivers: "Каналы привлечения и план роста", skills: ["Каналы", "CAC/LTV", "Кампании"] },
  coo:      { solves: "Всё держится на вас, процессы хаотичны",              delivers: "Отлаженные процессы, роли и SLA", skills: ["Процессы", "SLA", "Автоматизация"] },
  cto:      { solves: "Не ясно, реально ли это построить и за сколько",      delivers: "Оценка реализуемости и план MVP", skills: ["Архитектура", "MVP", "Оценка"] },
  analyst:  { solves: "Решения принимаются на ощущениях, а не на данных",    delivers: "Проверенные гипотезы и модели", skills: ["Данные", "Гипотезы", "Модели"] },
  invest:   { solves: "Не знаете, привлекательны ли вы для инвестора",       delivers: "Оценка и инвест-логика сделки", skills: ["Оценка", "Сделки", "Due diligence"] },
  risk:     { solves: "Боитесь скрытых рисков и провала",                    delivers: "Карта рисков и меры снижения", skills: ["Риски", "Сценарии", "Стоп-лоссы"] },
  brand:    { solves: "Вас не отличают от конкурентов",                      delivers: "Позиционирование и бренд-нарратив", skills: ["Позиционирование", "Нарратив"] },
  growth:   { solves: "Рост остановился, нужны точки взлёта",                delivers: "Ростовые эксперименты и метрики", skills: ["Эксперименты", "A/B", "Воронки"] },
  market:   { solves: "Не знаете рынок, конкурентов и спрос",                delivers: "Размер рынка, конкуренты, боли клиентов", skills: ["TAM/SAM", "Разведка", "Тренды"] },
  pr:       { solves: "О вас никто не говорит",                              delivers: "План коммуникаций и репутации", skills: ["PR", "Медиа", "Репутация"] },
  sales:    { solves: "Лиды есть, а продаж мало",                            delivers: "Воронка и процесс закрытия сделок", skills: ["Воронка", "Скрипты", "Closing"] },
  hr:       { solves: "Команда не тянет, некому делать",                     delivers: "План найма и структура команды", skills: ["Найм", "Структура", "Культура"] },
  legal:    { solves: "Боитесь юридических проблем и штрафов",               delivers: "Комплаенс, договоры, снятие блокеров", skills: ["Право", "Комплаенс", "Договоры"] },
  supply:   { solves: "Логистика и поставки съедают маржу",                  delivers: "Оптимизация цепочки поставок", skills: ["Логистика", "Поставки", "Маржа"] },
  data:     { solves: "Данные есть, а толку от них нет",                     delivers: "Аналитика и прогнозные модели", skills: ["Аналитика", "Прогнозы", "Дашборды"] },
  product:  { solves: "Не ясно, что делать в продукте дальше",              delivers: "Роадмап и приоритеты фич", skills: ["Роадмап", "Приоритеты", "Скоуп"] },
  ux:       { solves: "Пользователи путаются и уходят",                      delivers: "Улучшения UX по исследованиям", skills: ["Исследования", "UX", "Юзабилити"] },
  strategy: { solves: "Нужен независимый стратегический взгляд",             delivers: "Сценарии и стратегические развилки", skills: ["Сценарии", "Развилки", "Аудит"] },
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
  leadership: "Смотрю стратегически: сформулируйте цель на 90 дней и одну ключевую метрику — я разложу её на инициативы и укажу самое узкое место. Живой анализ доступен после настройки API-ключа.",
  finance:    "По финансам: пришлите цену, себестоимость и объём — посчитаю маржу, точку безубыточности и чувствительность прибыли. Для расчёта по вашим цифрам нужен API-ключ.",
  marketing:  "По маркетингу: для старта хватит двух каналов и одного оффера — предложу связку канал→сегмент→сообщение и метрики на 7 дней. Живые рекомендации — после настройки API-ключа.",
  operations: "По операциям: назовите процесс, который болит, — разложу на шаги, найду узкое место и что автоматизировать первым. Для детального плана подключите API-ключ.",
  tech:       "По технологиям: опишите ключевой сценарий — оценю реализуемость, риски и минимальный MVP. Живой разбор — после настройки API-ключа.",
  product:    "По продукту: сформулируйте боль пользователя — проверю, решает ли её текущая фича, и предложу минимальный скоуп MVP. Живой анализ — после настройки API-ключа.",
};

type Prof = TeamMember & { solves: string; delivers: string; skills: string[] };
const PROS: Prof[] = TEAM.map(m => ({ ...m, ...(PROF[m.slug] ?? { solves: m.title, delivers: m.title, skills: [] }) }));

export default function ProfessionalsPage() {
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = openSlug ? PROS.find(p => p.slug === openSlug)! : null;

  const groups = useMemo(() => {
    const ql = query.trim().toLowerCase();
    const match = (p: Prof) => !ql || p.name.toLowerCase().includes(ql) || p.title.toLowerCase().includes(ql) || p.solves.toLowerCase().includes(ql) || p.skills.some(s => s.toLowerCase().includes(ql));
    return DEPTS.map(d => ({ ...d, items: PROS.filter(p => p.dept === d.key && match(p)) })).filter(g => g.items.length);
  }, [query]);

  return (
    <div className="pr-wrap">
      <div className="pr-head">
        <div>
          <div className="pr-eyebrow">AI-КОМАНДА · 20 ПРОФЕССИОНАЛОВ</div>
          <h1 className="pr-title">Профессионалы, которые решают ваши задачи</h1>
          <p className="pr-sub">Каждый агент — узкий специалист уровня C-level. Выберите нужного и поручите задачу — он разберёт её и выдаст конкретный результат.</p>
        </div>
        <div className="pr-search">
          <Search size={14} strokeWidth={2} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти по задаче или специалисту…" spellCheck={false} />
        </div>
      </div>

      {groups.map(g => (
        <section key={g.key} className="pr-group">
          <div className="pr-group-label">{g.label}<span>{g.items.length}</span></div>
          <div className="pr-grid">
            {g.items.map((p, i) => (
              <motion.button key={p.slug} className="pr-card" onClick={() => setOpenSlug(p.slug)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: Math.min(i * 0.03, 0.2) }}
                whileHover={{ y: -3 }}>
                <div className="pr-card-top">
                  <span className="pr-av" style={{ background: `linear-gradient(135deg,${p.g[0]},${p.g[1]})` }}>{p.ab}</span>
                  <div className="pr-card-id">
                    <span className="pr-card-name">{p.name}</span>
                    <span className="pr-card-role">{p.title}</span>
                  </div>
                </div>
                <div className="pr-solves">
                  <span className="pr-solves-label">РЕШАЕТ</span>
                  <span className="pr-solves-text">{p.solves}</span>
                </div>
                <div className="pr-delivers"><CheckCircle2 size={13} strokeWidth={2.2} style={{ color: p.c }} /><span>{p.delivers}</span></div>
                <div className="pr-card-foot">
                  <div className="pr-skills">{p.skills.slice(0, 2).map(s => <span key={s}>{s}</span>)}</div>
                  <span className="pr-cta" style={{ color: p.c }}>Поручить <ArrowRight size={12} strokeWidth={2.4} /></span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      ))}

      <AnimatePresence>
        {open && <ProfModal pro={open} onClose={() => setOpenSlug(null)} />}
      </AnimatePresence>

      <style jsx global>{`
        .pr-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; }
        .pr-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 28px; }
        .pr-eyebrow { font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(255,255,255,0.32); margin-bottom: 9px; }
        .pr-title { font-size: 27px; font-weight: 800; letter-spacing: -0.02em; color: #E5E7EB; margin: 0 0 8px; text-wrap: balance; max-width: 20ch; }
        .pr-sub { font-size: 13.5px; line-height: 1.55; color: rgba(255,255,255,0.5); max-width: 62ch; margin: 0; }
        .pr-search { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 13px; border-radius: 11px; flex-shrink: 0;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); transition: border-color .18s, background .18s; }
        .pr-search:focus-within { border-color: rgba(99,102,241,0.5); background: rgba(255,255,255,0.05); }
        .pr-search input { background: none; border: none; outline: none; color: #E5E7EB; font-size: 13px; width: 230px; }
        .pr-search input::placeholder { color: rgba(255,255,255,0.3); }

        .pr-group { margin-bottom: 26px; }
        .pr-group-label { display: flex; align-items: center; gap: 8px; font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 12px; }
        .pr-group-label span { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 16px; padding: 0 5px; border-radius: 5px; font-size: 9.5px; color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.05); }
        .pr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

        .pr-card { text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 16px;
          background: rgba(255,255,255,0.022); border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04); transition: border-color .18s, background .18s, box-shadow .18s; }
        .pr-card:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.035); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 14px 36px rgba(0,0,0,0.28); }
        .pr-card:focus-visible { outline: 2px solid rgba(99,102,241,0.6); outline-offset: 2px; }
        .pr-card-top { display: flex; align-items: center; gap: 11px; }
        .pr-av { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 13px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
        .pr-card-id { display: flex; flex-direction: column; min-width: 0; }
        .pr-card-name { font-size: 14.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
        .pr-card-role { font-size: 11.5px; color: rgba(255,255,255,0.45); }
        .pr-solves { display: flex; flex-direction: column; gap: 4px; padding: 11px 12px; border-radius: 11px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
        .pr-solves-label { font-family: var(--font-geist-mono), monospace; font-size: 8.5px; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); }
        .pr-solves-text { font-size: 12.5px; line-height: 1.45; color: rgba(255,255,255,0.75); }
        .pr-delivers { display: flex; align-items: flex-start; gap: 7px; font-size: 12px; line-height: 1.4; color: rgba(255,255,255,0.6); }
        .pr-delivers svg { flex-shrink: 0; margin-top: 1px; }
        .pr-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 4px; }
        .pr-skills { display: flex; gap: 5px; flex-wrap: wrap; }
        .pr-skills span { font-family: var(--font-geist-mono), monospace; font-size: 9px; padding: 3px 7px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
        .pr-cta { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; white-space: nowrap; }

        @media (max-width: 560px) { .pr-grid { grid-template-columns: 1fr; } .pr-search input { width: 150px; } }
      `}</style>
    </div>
  );
}

// ─── Focused professional modal with streaming task ──────────────────────────
function ProfModal({ pro, onClose }: { pro: Prof; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async () => {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — ${pro.name}, ${pro.title} в AI-команде Apex AI. Твоя специализация: ${pro.delivers}. Основатель поручил тебе задачу. Ответь как профессионал: по делу, с конкретикой и цифрами где уместно, 4–7 предложений, обычный текст без markdown. Если данных мало — задай 1–2 уточняющих вопроса в конце.`;
    try {
      await streamChat(question, persona, t => setAnswer(prev => prev + t));
    } catch {
      setOffline(true);
      const fb = FALLBACK[pro.dept] ?? FALLBACK.leadership;
      for (const ch of fb) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); }
    }
    setBusy(false);
  }, [q, busy, pro]);

  return (
    <motion.div className="pm-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="pm-card" onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.24, ease: EASE }}>
        <button className="pm-close" onClick={onClose} aria-label="Закрыть"><X size={16} strokeWidth={2.2} /></button>
        <div className="pm-head">
          <span className="pm-av" style={{ background: `linear-gradient(135deg,${pro.g[0]},${pro.g[1]})` }}>{pro.ab}</span>
          <div>
            <div className="pm-name">{pro.name}</div>
            <div className="pm-role">{pro.title}</div>
          </div>
        </div>
        <div className="pm-offer">
          <div className="pm-offer-row"><span className="pm-k">Решает</span><span className="pm-v">{pro.solves}</span></div>
          <div className="pm-offer-row"><span className="pm-k">Выдаёт</span><span className="pm-v">{pro.delivers}</span></div>
        </div>
        <div className="pm-ask-label">Поручить задачу</div>
        <div className="pm-ask">
          <input ref={inputRef} autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void submit(); }}
            disabled={busy} placeholder={`Опишите задачу для «${pro.title.toLowerCase()}»…`} spellCheck={false} />
          <button onClick={() => void submit()} disabled={busy || !q.trim()} style={{ background: `linear-gradient(135deg,${pro.g[0]},${pro.g[1]})` }} aria-label="Отправить">
            {busy ? <span className="pm-dots"><i /><i /><i /></span> : <CornerDownLeft size={15} strokeWidth={2.4} />}
          </button>
        </div>
        <AnimatePresence>
          {(answer || busy) && (
            <motion.div className="pm-answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p>{answer}{busy && <span className="pm-cursor" style={{ background: pro.c }} />}</p>
              {offline && !busy && <div className="pm-offline">Демо-ответ — настройте ANTHROPIC_API_KEY для живого анализа</div>}
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          .pm-back { position: fixed; inset: 0; z-index: 60; background: rgba(5,6,10,0.72); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; }
          .pm-card { position: relative; width: min(600px, 100%); max-height: 84vh; overflow-y: auto; border-radius: 20px; padding: 24px;
            background: #0b0d16; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
          .pm-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; transition: color .16s, border-color .16s; }
          .pm-close:hover { color: #fff; border-color: rgba(255,255,255,0.2); }
          .pm-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
          .pm-av { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 16px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
          .pm-name { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
          .pm-role { font-size: 13px; color: rgba(255,255,255,0.5); }
          .pm-offer { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-radius: 13px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 20px; }
          .pm-offer-row { display: flex; gap: 12px; }
          .pm-k { flex-shrink: 0; width: 58px; font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); padding-top: 2px; }
          .pm-v { font-size: 13px; line-height: 1.45; color: rgba(255,255,255,0.78); }
          .pm-ask-label { font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 9px; }
          .pm-ask { display: flex; gap: 8px; }
          .pm-ask input { flex: 1; min-width: 0; height: 46px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; color: #E5E7EB;
            background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.1); outline: none; transition: border-color .18s, box-shadow .18s; }
          .pm-ask input::placeholder { color: rgba(255,255,255,0.3); }
          .pm-ask input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.09); }
          .pm-ask button { flex-shrink: 0; width: 46px; height: 46px; border-radius: 12px; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); transition: transform .15s, opacity .15s; }
          .pm-ask button:hover:not(:disabled) { transform: translateY(-1px); }
          .pm-ask button:disabled { opacity: 0.5; cursor: not-allowed; }
          .pm-dots { display: inline-flex; gap: 3px; }
          .pm-dots i { width: 4px; height: 4px; border-radius: 50%; background: #fff; animation: pm-blink 1s infinite; }
          .pm-dots i:nth-child(2){animation-delay:.15s} .pm-dots i:nth-child(3){animation-delay:.3s}
          @keyframes pm-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
          .pm-answer { margin-top: 14px; border-radius: 13px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); padding: 16px 18px; }
          .pm-answer p { font-size: 13.5px; line-height: 1.65; color: rgba(255,255,255,0.82); margin: 0; white-space: pre-wrap; }
          .pm-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: pm-caret 1s step-end infinite; }
          @keyframes pm-caret { 50% { opacity: 0; } }
          .pm-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 10px; }
          @media (prefers-reduced-motion: reduce) { .pm-dots i, .pm-cursor { animation: none; } }
        `}</style>
      </motion.div>
    </motion.div>
  );
}
