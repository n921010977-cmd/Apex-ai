"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Link2, Calendar, ArrowRight, Sparkles, X } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Фазы пути: SaaS-идея → MVP ───────────────────────────────────────────────
type Phase = { id: string; name: string; short: string; desc: string; color: string; progress: number };

const PHASES: Phase[] = [
  { id: "spark",      name: "Искра",        short: "01", desc: "Первая SaaS-идея и гипотеза о боли",         color: "#8b5cf6", progress: 100 },
  { id: "research",   name: "Исследование", short: "02", desc: "Рынок, конкуренты, инсайты клиентов",        color: "#6366f1", progress: 100 },
  { id: "validation", name: "Валидация",    short: "03", desc: "Проверка гипотезы на реальных людях",        color: "#3b82f6", progress: 100 },
  { id: "concept",    name: "Концепт",      short: "04", desc: "Ядро продукта и уникальная механика",        color: "#0ea5e9", progress: 100 },
  { id: "design",     name: "Дизайн",       short: "05", desc: "UX-поток и визуальная система",              color: "#10b981", progress: 90 },
  { id: "mvp",        name: "MVP",          short: "06", desc: "Что реально отгружено в первую версию",       color: "#f59e0b", progress: 65 },
];

// ─── Записанные идеи (эволюция мышления проекта) ──────────────────────────────
type Idea = { id: string; phase: string; title: string; note: string; tags: string[]; date: string; links: string[]; };

const IDEAS: Idea[] = [
  // Искра
  { id: "i1", phase: "spark", title: "Нанять не ассистента, а компанию", note: "Что если вместо одного AI-ассистента фаундер получает целую цифровую корпорацию — CEO и 30 сотрудников по отделам?", tags: ["видение", "insight"], date: "12 янв", links: ["i8", "i11"] },
  { id: "i2", phase: "spark", title: "Founder хочет команду, а не инструмент", note: "Люди платят не за 'ещё один чат-бот'. Они хотят ощущение, что за них работает команда C-level.", tags: ["позиционирование"], date: "12 янв", links: ["i5"] },
  { id: "i3", phase: "spark", title: "Метафора «цифровой корпорации»", note: "Продукт должен ощущаться как вход в живую компанию будущего, а не как список ботов.", tags: ["метафора", "wow"], date: "14 янв", links: ["i12"] },

  // Исследование
  { id: "i4", phase: "research", title: "Карта конкурентов", note: "ChatGPT, Notion AI, Devin, Lindy. Все дают ОДНОГО агента. Никто не продаёт 'компанию' целиком — это наш разрыв.", tags: ["конкуренты", "gap"], date: "18 янв", links: ["i2"] },
  { id: "i5", phase: "research", title: "Боль: один агент ≠ команда", note: "Соло-фаундеру нужны 5+ ролей одновременно: стратег, финансист, маркетолог. Переключать промпты — мучение.", tags: ["боль", "JTBD"], date: "20 янв", links: ["i2", "i7"] },
  { id: "i6", phase: "research", title: "Тренд: multi-agent оркестрация", note: "Рынок движется к системам, где агенты общаются между собой. Мы должны показать это визуально и красиво.", tags: ["тренд", "тех"], date: "22 янв", links: ["i9"] },

  // Валидация
  { id: "i7", phase: "validation", title: "ICP: соло-фаундеры и малые команды", note: "Люди, которые строят бизнес в одиночку и не могут позволить настоящий штат. Готовы платить за 'команду в кармане'.", tags: ["ICP"], date: "26 янв", links: ["i5"] },
  { id: "i8", phase: "validation", title: "Гипотеза ценности подтверждена", note: "В интервью 8/10 сказали: 'команда' звучит ценнее, чем 'ассистент'. Слово 'компания' продаёт.", tags: ["валидация", "insight"], date: "28 янв", links: ["i1"] },

  // Концепт
  { id: "i9", phase: "concept", title: "AI CEO оркестрирует отделы", note: "Центральный CEO принимает цель, разбивает на задачи и распределяет по отделам в реальном времени. Это ядро.", tags: [" core", "механика"], date: "2 фев", links: ["i6", "i11"] },
  { id: "i10", phase: "concept", title: "Autopilot-режим", note: "Фаундер задаёт цель — CEO ведёт её как настоящий руководитель: стратегия, задачи по дням, прогноз.", tags: ["фича", "wow"], date: "4 фев", links: ["i9"] },
  { id: "i11", phase: "concept", title: "30+ агентов с характерами", note: "Каждый сотрудник — не карточка, а личность: свой стиль, мотто, сильные стороны, цвет.", tags: ["агенты"], date: "6 фев", links: ["i1", "i9"] },

  // Дизайн
  { id: "i12", phase: "design", title: "Дизайн-система: enterprise dark", note: "Эталон — Linear, Vercel, OpenAI. Приглушённый индиго, hairline-рамки, никакого неона. Интерфейс исчезает — остаётся информация.", tags: ["design-system"], date: "10 фев", links: ["i3"] },
  { id: "i13", phase: "design", title: "Живая org-карта отделов", note: "SVG-карта: CEO в центре, отделы по кругу, анимированные линии передачи задач. Ощущение живой компании.", tags: ["UX", "motion"], date: "12 фев", links: ["i9"] },

  // MVP
  { id: "i14", phase: "mvp", title: "Command Center с оркестрацией", note: "Отгружено: CEO планирует → отделы работают параллельно → синтез результата. Стриминг через Claude.", tags: ["shipped"], date: "18 фев", links: ["i9", "i10"] },
  { id: "i15", phase: "mvp", title: "20 агентов онлайн", note: "Agent Studio: полный ростер по отделам, запуск, чат 1-на-1, реальный бэкенд.", tags: ["shipped"], date: "20 фев", links: ["i11"] },
];

const IDEAS_BY_ID = Object.fromEntries(IDEAS.map(i => [i.id, i]));

export default function BrainPage() {
  const [activePhase, setActivePhase] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openIdea, setOpenIdea] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IDEAS.filter(i => {
      const okPhase = activePhase === "all" || i.phase === activePhase;
      const okQuery = !q || i.title.toLowerCase().includes(q) || i.note.toLowerCase().includes(q) || i.tags.some(t => t.includes(q));
      return okPhase && okQuery;
    });
  }, [activePhase, query]);

  const totalLinks = IDEAS.reduce((n, i) => n + i.links.length, 0);
  const mvpProgress = Math.round(PHASES.reduce((n, p) => n + p.progress, 0) / PHASES.length);
  const idea = openIdea ? IDEAS_BY_ID[openIdea] : null;
  const ideaPhase = idea ? PHASES.find(p => p.id === idea.phase)! : null;

  return (
    <div className="brain-root">
      <div className="brain-wrap">
        {/* Header */}
        <header className="brain-head">
          <div className="brain-eyebrow">
            <Brain size={13} strokeWidth={2} /> ВТОРОЙ МОЗГ · SAAS → MVP
          </div>
          <h1 className="brain-title">Мозг проекта</h1>
          <p className="brain-sub">Здесь записан путь мышления Apex — от первой SaaS-идеи до отгруженного MVP. Каждая мысль связана с теми, из которых выросла.</p>

          <div className="brain-stats">
            <div className="brain-stat"><span className="brain-stat-v">{IDEAS.length}</span><span className="brain-stat-l">идей записано</span></div>
            <div className="brain-stat"><span className="brain-stat-v">{PHASES.length}</span><span className="brain-stat-l">этапов пути</span></div>
            <div className="brain-stat"><span className="brain-stat-v">{totalLinks}</span><span className="brain-stat-l">связей</span></div>
            <div className="brain-stat"><span className="brain-stat-v" style={{ color: "#f59e0b" }}>{mvpProgress}%</span><span className="brain-stat-l">к MVP</span></div>
          </div>
        </header>

        {/* Journey rail */}
        <section className="brain-journey">
          <div className="brain-journey-track">
            <div className="brain-journey-line"><motion.div className="brain-journey-fill" initial={{ width: 0 }} animate={{ width: `${mvpProgress}%` }} transition={{ duration: 1.4, ease: EASE }} /></div>
            {PHASES.map((p, i) => {
              const active = activePhase === p.id;
              return (
                <button key={p.id} className={`brain-node${active ? " on" : ""}`} onClick={() => setActivePhase(active ? "all" : p.id)}
                  style={active ? { borderColor: p.color, background: `${p.color}1a` } : undefined}>
                  <motion.span className="brain-node-dot" style={{ background: p.color }}
                    animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 1.8, repeat: active ? Infinity : 0 }} />
                  <span className="brain-node-text">
                    <span className="brain-node-short" style={{ color: p.color }}>{p.short}</span>
                    <span className="brain-node-name">{p.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Controls */}
        <div className="brain-controls">
          <div className="brain-search">
            <Search size={15} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Искать идею, мысль, тег…" spellCheck={false} />
            {query && <button onClick={() => setQuery("")} aria-label="Очистить"><X size={14} /></button>}
          </div>
          <div className="brain-active-phase">
            {activePhase === "all"
              ? <span>Все этапы · {filtered.length} идей</span>
              : <button className="brain-clear-phase" onClick={() => setActivePhase("all")}>
                  {PHASES.find(p => p.id === activePhase)?.name} · {filtered.length} <X size={12} />
                </button>}
          </div>
        </div>

        {/* Ideas grid */}
        <div className="brain-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((it, i) => {
              const ph = PHASES.find(p => p.id === it.phase)!;
              return (
                <motion.button key={it.id} layout className="brain-card" onClick={() => setOpenIdea(it.id)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: EASE, delay: Math.min(i * 0.03, 0.24) }}
                  whileHover={{ y: -4 }}
                  style={{ borderColor: `${ph.color}22` }}>
                  <div className="brain-card-top">
                    <span className="brain-card-badge" style={{ background: `${ph.color}1f`, color: ph.color }}>{ph.short} · {ph.name}</span>
                    <span className="brain-card-date"><Calendar size={11} /> {it.date}</span>
                  </div>
                  <h3 className="brain-card-title">{it.title}</h3>
                  <p className="brain-card-note">{it.note}</p>
                  <div className="brain-card-foot">
                    <div className="brain-card-tags">
                      {it.tags.map(t => <span key={t} className="brain-tag">#{t}</span>)}
                    </div>
                    {it.links.length > 0 && (
                      <span className="brain-card-links" style={{ color: ph.color }}><Link2 size={11} /> {it.links.length}</span>
                    )}
                  </div>
                  <span className="brain-card-spine" style={{ background: ph.color }} />
                </motion.button>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="brain-empty">
              <Sparkles size={22} />
              <p>Здесь пока пусто. Смени этап или запрос.</p>
            </div>
          )}
        </div>
      </div>

      {/* Idea detail */}
      <AnimatePresence>
        {idea && ideaPhase && (
          <motion.div className="brain-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenIdea(null)}>
            <motion.div className="brain-modal" onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ borderColor: `${ideaPhase.color}33` }}>
              <button className="brain-modal-x" onClick={() => setOpenIdea(null)} aria-label="Закрыть"><X size={18} /></button>
              <div className="brain-modal-badge" style={{ background: `${ideaPhase.color}1f`, color: ideaPhase.color }}>
                {ideaPhase.short} · {ideaPhase.name}
              </div>
              <h2 className="brain-modal-title">{idea.title}</h2>
              <p className="brain-modal-note">{idea.note}</p>
              <div className="brain-modal-tags">{idea.tags.map(t => <span key={t} className="brain-tag">#{t}</span>)}</div>

              {idea.links.length > 0 && (
                <div className="brain-modal-links">
                  <div className="brain-modal-links-label"><Link2 size={13} /> Связанные идеи</div>
                  {idea.links.map(lid => {
                    const li = IDEAS_BY_ID[lid]; if (!li) return null;
                    const lp = PHASES.find(p => p.id === li.phase)!;
                    return (
                      <button key={lid} className="brain-link-row" onClick={() => setOpenIdea(lid)}>
                        <span className="brain-link-dot" style={{ background: lp.color }} />
                        <span className="brain-link-title">{li.title}</span>
                        <ArrowRight size={13} />
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BrainStyles />
    </div>
  );
}

function BrainStyles() {
  return (
    <style jsx global>{`
      .brain-root { background: #05060A; min-height: 100%; }
      .brain-wrap { max-width: 1120px; margin: 0 auto; padding: 36px 24px 72px; }

      .brain-head { margin-bottom: 28px; }
      .brain-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.14em; color: rgba(129,140,248,0.85); margin-bottom: 12px; }
      .brain-title { font-size: 34px; font-weight: 800; letter-spacing: -0.03em; color: #E5E7EB; margin: 0 0 10px; }
      .brain-sub { font-size: 14.5px; line-height: 1.65; color: rgba(255,255,255,0.52); max-width: 68ch; margin: 0 0 22px; }

      .brain-stats { display: flex; flex-wrap: wrap; gap: 10px; }
      .brain-stat { display: flex; flex-direction: column; gap: 2px; padding: 12px 18px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); min-width: 108px; }
      .brain-stat-v { font-size: 22px; font-weight: 800; color: #E5E7EB; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .brain-stat-l { font-size: 11px; color: rgba(255,255,255,0.42); }

      .brain-journey { margin-bottom: 28px; padding: 22px 20px; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
      .brain-journey-track { position: relative; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
      .brain-journey-line { position: absolute; top: 14px; left: 6%; right: 6%; height: 2px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
      .brain-journey-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #6366f1, #3b82f6, #0ea5e9, #10b981, #f59e0b); border-radius: 2px; }
      .brain-node { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 4px 6px 8px; border-radius: 12px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: background .18s, border-color .18s; }
      .brain-node:hover { background: rgba(255,255,255,0.03); }
      .brain-node-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px #05060A, 0 0 12px currentColor; }
      .brain-node-text { display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .brain-node-short { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; }
      .brain-node-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.72); }

      .brain-controls { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
      .brain-search { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 14px; border-radius: 12px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); transition: border-color .16s; }
      .brain-search:focus-within { border-color: rgba(99,102,241,0.5); }
      .brain-search svg { color: rgba(255,255,255,0.4); flex-shrink: 0; }
      .brain-search input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: #E5E7EB; font-size: 13.5px; }
      .brain-search input::placeholder { color: rgba(255,255,255,0.3); }
      .brain-search button { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; padding: 2px; }
      .brain-active-phase { font-size: 12.5px; color: rgba(255,255,255,0.45); }
      .brain-clear-phase { display: inline-flex; align-items: center; gap: 6px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; border-radius: 9px; padding: 6px 10px; font-size: 12px; cursor: pointer; }

      .brain-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
      .brain-card { position: relative; overflow: hidden; text-align: left; display: flex; flex-direction: column; gap: 10px; padding: 16px 16px 14px 19px; border-radius: 16px; background: rgba(255,255,255,0.028); border: 1px solid rgba(255,255,255,0.07); cursor: pointer; transition: border-color .2s, background .2s, box-shadow .2s; box-shadow: 0 1px 2px rgba(0,0,0,0.3); }
      .brain-card:hover { background: rgba(255,255,255,0.05); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 14px 40px rgba(0,0,0,0.3); }
      .brain-card-spine { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; opacity: 0.85; }
      .brain-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .brain-card-badge { font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 7px; letter-spacing: 0.03em; }
      .brain-card-date { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(255,255,255,0.35); }
      .brain-card-title { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #E5E7EB; margin: 0; line-height: 1.35; }
      .brain-card-note { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.58); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .brain-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
      .brain-card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
      .brain-tag { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); border-radius: 6px; padding: 2px 6px; }
      .brain-card-links { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; flex-shrink: 0; }

      .brain-empty { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 0; color: rgba(255,255,255,0.35); }
      .brain-empty p { font-size: 13px; margin: 0; }

      .brain-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); }
      .brain-modal { position: relative; width: 100%; max-width: 560px; max-height: 86vh; overflow-y: auto; padding: 30px; border-radius: 24px; background: linear-gradient(135deg, rgba(12,13,20,0.98), rgba(5,6,10,0.99)); border: 1px solid; box-shadow: 0 30px 90px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05); }
      .brain-modal-x { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; transition: all .18s; }
      .brain-modal-x:hover { background: rgba(255,255,255,0.12); color: #fff; }
      .brain-modal-badge { display: inline-flex; font-family: var(--font-geist-mono), monospace; font-size: 11px; font-weight: 700; padding: 5px 11px; border-radius: 8px; margin-bottom: 16px; }
      .brain-modal-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #fff; margin: 0 0 14px; line-height: 1.25; }
      .brain-modal-note { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.75); margin: 0 0 18px; }
      .brain-modal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
      .brain-modal-links-label { display: flex; align-items: center; gap: 7px; font-family: var(--font-geist-mono), monospace; font-size: 10.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 10px; }
      .brain-link-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; border-radius: 11px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; margin-bottom: 7px; transition: background .16s, border-color .16s; text-align: left; }
      .brain-link-row:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
      .brain-link-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .brain-link-title { flex: 1; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.82); }
      .brain-link-row svg { color: rgba(255,255,255,0.3); flex-shrink: 0; }

      @media (max-width: 720px) {
        .brain-journey-track { grid-template-columns: repeat(3, 1fr); row-gap: 16px; }
        .brain-journey-line { display: none; }
        .brain-title { font-size: 27px; }
      }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
    `}</style>
  );
}
