"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { CornerDownLeft, X, Crown, Trophy, TrendingUp, Flame, MessageSquare, MessagesSquare, Users } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Профили: специализация и уверенность ─────────────────────────────────────
const CHAR: Record<string, { specialty: string; confidence: number }> = {
  ceo:      { specialty: "Стратегия & Видение",       confidence: 96 },
  cfo:      { specialty: "Финансы & Модели",          confidence: 93 },
  cmo:      { specialty: "Маркетинг & Рост",          confidence: 94 },
  coo:      { specialty: "Операции & Процессы",       confidence: 92 },
  cto:      { specialty: "Технологии & Архитектура",  confidence: 95 },
  analyst:  { specialty: "Данные & Гипотезы",         confidence: 91 },
  invest:   { specialty: "Инвестиции & Оценка",       confidence: 92 },
  risk:     { specialty: "Риски & Защита",            confidence: 90 },
  brand:    { specialty: "Бренд & Позиционирование",  confidence: 92 },
  growth:   { specialty: "Рост & Эксперименты",       confidence: 91 },
  market:   { specialty: "Рынок & Разведка",          confidence: 91 },
  pr:       { specialty: "PR & Репутация",            confidence: 88 },
  sales:    { specialty: "Продажи & Воронка",         confidence: 90 },
  hr:       { specialty: "Найм & Команда",            confidence: 87 },
  legal:    { specialty: "Право & Комплаенс",         confidence: 88 },
  supply:   { specialty: "Логистика & Поставки",      confidence: 89 },
  data:     { specialty: "Аналитика & Прогнозы",      confidence: 92 },
  product:  { specialty: "Продукт & Роадмап",         confidence: 93 },
  ux:       { specialty: "UX & Исследования",         confidence: 90 },
  strategy: { specialty: "Сценарии & Развилки",       confidence: 94 },
};

// чем агент занят прямо сейчас (ротация)
const ACT: Record<string, string[]> = {
  ceo:      ["Синтезирует отчёты отделов", "Расставляет приоритеты недели", "Готовит стратегическую сессию"],
  cfo:      ["Пересчитывает юнит-экономику", "Сводит P&L за месяц", "Проверяет прогноз выручки"],
  cmo:      ["Оценивает конверсию каналов", "Планирует запуск кампании", "Смотрит когорты за неделю"],
  coo:      ["Оптимизирует онбординг", "Обновляет SLA поддержки", "Разбирает узкое место"],
  cto:      ["Ревьюит архитектуру MVP", "Оценивает стоимость фичи", "Планирует спринт"],
  analyst:  ["Проверяет гипотезу на данных", "Строит модель спроса", "Готовит недельный отчёт"],
  invest:   ["Считает оценку раунда", "Сравнивает мультипликаторы", "Готовит инвест-меморандум"],
  risk:     ["Сканирует риски запуска", "Обновляет карту рисков", "Стресс-тестирует финмодель"],
  brand:    ["Шлифует позиционирование", "Проверяет тон коммуникации", "Собирает бренд-гайд"],
  growth:   ["Запускает A/B-тест", "Анализирует воронку активации", "Ищет новую петлю роста"],
  market:   ["Мониторит конкурентов", "Разбирает тренды ниши", "Собирает инсайты клиентов"],
  pr:       ["Готовит питч для медиа", "Обновляет пресс-кит", "Мониторит упоминания"],
  sales:    ["Прогревает пайплайн", "Разбирает возражения", "Обновляет скрипт продаж"],
  hr:       ["Собирает профиль роли", "Планирует найм квартала", "Улучшает онбординг"],
  legal:    ["Проверяет договор", "Сверяет комплаенс", "Обновляет шаблоны NDA"],
  supply:   ["Оптимизирует поставки", "Считает маржу цепочки", "Сокращает сроки логистики"],
  data:     ["Тренирует прогнозную модель", "Чистит данные воронки", "Настраивает дашборд KPI"],
  product:  ["Приоритизирует бэклог", "Пишет спецификацию фичи", "Анализирует фидбек"],
  ux:       ["Проводит юзабилити-тест", "Разбирает путь пользователя", "Прототипирует онбординг"],
  strategy: ["Моделирует сценарии", "Готовит развилки решения", "Аудитит стратегию квартала"],
};

const FB: Record<string, string> = {
  cfo: "С финансовой стороны: считаю юнит-экономику. Если LTV/CAC ниже 3 — сначала чиним экономику. Предлагаю пилот с лимитом бюджета и пересмотром через 30 дней.",
  cmo: "С точки зрения роста: спрос проверяем дешёвым тестом — лендинг и два канала, решение по данным конверсии.",
  cto: "Технически реализуемо: закладываю 2–3 недели на MVP, начинаем с самого узкого сценария.",
  coo: "По операциям: до запуска нужны владелец процесса, SLA и чек-лист.",
};

// детерминированные метрики успеха
function hashOf(s: string): number { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
function metrics(slug: string) {
  const h = hashOf(slug);
  return {
    done: 24 + (h % 76),                    // задач закрыто за месяц
    success: 88 + (h % 11),                 // % успешных
    streak: 3 + (h % 12),                   // дней серия без сбоев
    working: h % 10 < 7,                    // сейчас в работе
    load: 35 + (h % 58),                    // загрузка %
  };
}

function spark(seed: string): number[] {
  let h = hashOf(seed) % 1000;
  const out: number[] = []; let v = 30 + (h % 20);
  for (let i = 0; i < 9; i++) { v += ((h >> i) % 7) - 2 + i; out.push(Math.max(8, Math.min(96, v))); }
  return out;
}

type AgentFull = TeamMember & { specialty: string; confidence: number };
const byslug = (slug: string): AgentFull => ({ ...TEAM_BY_SLUG[slug], ...(CHAR[slug] ?? { specialty: TEAM_BY_SLUG[slug].title, confidence: 90 }) });

const TOTALS = (() => {
  let done = 0, success = 0, working = 0;
  for (const m of TEAM) { const mt = metrics(m.slug); done += mt.done; success += mt.success; if (mt.working) working++; }
  return { done, success: success / TEAM.length, working };
})();

// ─── Страница ─────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const router = useRouter();
  const [ask, setAsk] = useState<AgentFull | null>(null);
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();

  // совещание: директор со своими агентами, CEO — со всеми 20
  const goMeeting = useCallback((slug: string) => {
    router.push(`/dashboard/chat/local-${Date.now()}?agent=${slug}`);
  }, [router]);

  // ротация «чем занят сейчас»
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick(x => x + 1), 3600);
    return () => clearInterval(t);
  }, [reduce]);

  const ceo = byslug("ceo");
  const dirs = C_LEVEL.filter(m => m.slug !== "ceo");

  return (
    <div className="eb-root">
      <div className="eb-ambient" aria-hidden />

      <div className="eb-wrap">
        {/* Заголовок + живые KPI */}
        <div className="eb-head">
          <div className="eb-live"><span className="eb-live-dot" />СОВЕТ РАБОТАЕТ · LIVE</div>
          <h1 className="eb-title">Исполнительный совет</h1>
          <p className="eb-sub">Все {TEAM.length} агентов вашей AI-компании: кто главный, чем каждый занят прямо сейчас и какие у команды успехи.</p>
        </div>

        <div className="eb-kpis">
          <Kpi label="Агентов в совете" value={TEAM.length} color="#818cf8" />
          <Kpi label="Работают сейчас" value={TOTALS.working} color="#10b981" />
          <Kpi label="Задач закрыто · месяц" value={TOTALS.done} color="#f59e0b" />
          <Kpi label="Успешность" value={Math.round(TOTALS.success * 10) / 10} suffix="%" color="#0ea5e9" />
        </div>

        {/* ── ГЛАВНЫЙ ── */}
        <SectionLabel icon={<Crown size={12} />} text="ГЛАВНЫЙ · РУКОВОДИТ ВСЕМ СОВЕТОМ" />
        <CeoCard a={ceo} tick={tick} onAsk={() => setAsk(ceo)} onMeet={() => goMeeting("ceo")} reduce={!!reduce} />

        {/* ── ОТДЕЛЫ ── */}
        {dirs.map((d, di) => {
          const director = byslug(d.slug);
          const team = reportsOf(d.slug).filter(m => m.tier === "specialist").map(m => byslug(m.slug));
          return (
            <div key={d.slug} className="eb-dept">
              <SectionLabel
                icon={<Users size={12} />}
                text={`ОТДЕЛ ${director.role} · ${director.title.toUpperCase()} · ${team.length + 1} ЧЕЛ.`}
                color={director.c}
              />
              <div className="eb-dept-grid">
                <DirectorCard a={director} teamCount={team.length} tick={tick} delay={di * 0.05} onAsk={() => setAsk(director)} onMeet={() => goMeeting(director.slug)} reduce={!!reduce} />
                {team.map((a, i) => (
                  <AgentCard key={a.slug} a={a} lead={director} tick={tick} delay={di * 0.05 + (i + 1) * 0.06} onAsk={() => setAsk(a)} reduce={!!reduce} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>{ask && <AskModal agent={ask} onClose={() => setAsk(null)} />}</AnimatePresence>
      <EbStyles />
    </div>
  );
}

// ─── KPI со счётчиком ─────────────────────────────────────────────────────────
function Kpi({ label, value, suffix = "", color }: { label: string; value: number; suffix?: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now(); const dur = 1200;
    const step = (ts: number) => {
      const p = Math.min(1, (ts - t0) / dur);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3)) * 10) / 10);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return (
    <motion.div ref={ref} className="eb-kpi" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
      <div className="eb-kpi-v" style={{ color }}>{Number.isInteger(value) ? Math.round(v) : v.toFixed(1)}{suffix}</div>
      <div className="eb-kpi-l">{label}</div>
    </motion.div>
  );
}

function SectionLabel({ icon, text, color }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <motion.div className="eb-sect" initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, ease: EASE }}>
      <span className="eb-sect-icon" style={color ? { color, borderColor: `${color}44`, background: `${color}12` } : undefined}>{icon}</span>
      <span className="eb-sect-text" style={color ? { color } : undefined}>{text}</span>
      <span className="eb-sect-line" />
    </motion.div>
  );
}

// живая строка «чем занят»
function Activity({ slug, tick, working, color }: { slug: string; tick: number; working: boolean; color: string }) {
  const list = ACT[slug] ?? ["Работает над задачей"];
  const text = working ? list[tick % list.length] : "Ожидает задачу";
  return (
    <div className="eb-activity">
      <span className={`eb-act-dot${working ? " on" : ""}`} style={working ? { background: color, boxShadow: `0 0 8px ${color}` } : undefined} />
      <AnimatePresence mode="wait">
        <motion.span key={text} className="eb-act-text" style={{ color: working ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.32)" }}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>
          {working ? "сейчас: " : ""}{text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Карточка главного ────────────────────────────────────────────────────────
function CeoCard({ a, tick, onAsk, onMeet, reduce }: { a: AgentFull; tick: number; onAsk: () => void; onMeet: () => void; reduce: boolean }) {
  const mt = metrics(a.slug);
  return (
    <motion.div className="eb-ceo" onClick={onAsk} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") onAsk(); }}
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
      whileHover={{ y: -4 }}>
      <div className="eb-ceo-glow" aria-hidden />
      <div className="eb-ceo-left">
        <motion.span className="eb-ceo-av" style={{ background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})` }}
          animate={reduce ? undefined : { y: [0, -4, 0] }} transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
          {a.ab}
          <span className="eb-crown"><Crown size={11} strokeWidth={2.5} /></span>
        </motion.span>
      </div>
      <div className="eb-ceo-mid">
        <div className="eb-ceo-name">{a.name} <span className="eb-badge-main">ГЛАВНЫЙ</span></div>
        <div className="eb-ceo-role">{a.title} · {a.specialty}</div>
        <Activity slug={a.slug} tick={tick} working color={a.c} />
        <div className="eb-ach">
          <span className="eb-ach-chip"><Trophy size={10} /> {mt.done} задач закрыто</span>
          <span className="eb-ach-chip"><TrendingUp size={10} /> {mt.success}% успешных</span>
          <span className="eb-ach-chip"><Flame size={10} /> серия {mt.streak} дней</span>
        </div>
        <button className="eb-meet eb-meet-main" onClick={e => { e.stopPropagation(); onMeet(); }}>
          <MessagesSquare size={12} /> Совещание со всеми {TEAM.length - 1} агентами
        </button>
      </div>
      <div className="eb-ceo-right">
        <div className="eb-conf" style={{ color: a.c }}>{a.confidence}%</div>
        <div className="eb-conf-l">Уверенность AI</div>
        <Sparkline color={a.c} data={spark(a.slug)} />
        <span className="eb-ask-cta" style={{ color: a.c }}>Спросить <MessageSquare size={11} /></span>
      </div>
    </motion.div>
  );
}

// ─── Карточка директора ───────────────────────────────────────────────────────
function DirectorCard({ a, teamCount, tick, delay, onAsk, onMeet, reduce }: { a: AgentFull; teamCount: number; tick: number; delay: number; onAsk: () => void; onMeet: () => void; reduce: boolean }) {
  const mt = metrics(a.slug);
  return (
    <motion.div className="eb-card eb-card-dir" onClick={onAsk} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") onAsk(); }}
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      whileHover={{ y: -5 }}
      style={{ background: `linear-gradient(150deg, ${a.c}14, rgba(255,255,255,0.02) 62%)`, borderColor: `${a.c}3d` }}>
      <div className="eb-card-top">
        <motion.span className="eb-card-av eb-card-av-lg" style={{ background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})` }}
          animate={reduce ? undefined : { y: [0, -3, 0] }} transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut", delay }}>
          {a.ab}
        </motion.span>
        <div className="eb-card-id">
          <span className="eb-card-name">{a.name}</span>
          <span className="eb-card-role" style={{ color: a.c }}>{a.role} · директор</span>
          <span className="eb-card-title">{a.title}</span>
        </div>
        <span className="eb-badge-dir" style={{ color: a.c, borderColor: `${a.c}55` }}>ДИРЕКТОР</span>
      </div>

      <Activity slug={a.slug} tick={tick} working={mt.working} color={a.c} />

      <div className="eb-ach">
        <span className="eb-ach-chip"><Trophy size={10} /> {mt.done} задач</span>
        <span className="eb-ach-chip"><TrendingUp size={10} /> {mt.success}%</span>
        <span className="eb-ach-chip"><Users size={10} /> команда {teamCount}</span>
      </div>

      <div className="eb-loadrow">
        <span className="eb-load-l">Загрузка отдела</span>
        <span className="eb-load-v" style={{ color: a.c }}>{mt.load}%</span>
      </div>
      <div className="eb-track">
        <motion.i initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE, delay: delay + 0.2 }} style={{ background: `linear-gradient(90deg,${a.g[0]},${a.g[1]})` }} />
      </div>

      <div className="eb-card-foot">
        <Sparkline color={a.c} data={spark(a.slug)} />
        <span className="eb-ask-cta" style={{ color: a.c }}>Спросить <MessageSquare size={10} /></span>
      </div>

      <button className="eb-meet" onClick={e => { e.stopPropagation(); onMeet(); }}
        style={{ color: a.c, borderColor: `${a.c}55`, background: `${a.c}14` }}>
        <MessagesSquare size={12} /> Совещание с командой · {teamCount} агента
      </button>
    </motion.div>
  );
}

// ─── Карточка специалиста ─────────────────────────────────────────────────────
function AgentCard({ a, lead, tick, delay, onAsk, reduce }: { a: AgentFull; lead: AgentFull; tick: number; delay: number; onAsk: () => void; reduce: boolean }) {
  const mt = metrics(a.slug);
  return (
    <motion.button className="eb-card" onClick={onAsk}
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      whileHover={{ y: -5 }}
      style={{ background: `linear-gradient(150deg, ${a.c}0d, rgba(255,255,255,0.025) 62%)`, borderColor: `${a.c}26` }}>
      <div className="eb-card-top">
        <motion.span className="eb-card-av" style={{ background: `linear-gradient(135deg,${a.g[0]},${a.g[1]})` }}
          animate={reduce || !mt.working ? undefined : { y: [0, -2.5, 0] }} transition={reduce ? undefined : { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay }}>
          {a.ab}
        </motion.span>
        <div className="eb-card-id">
          <span className="eb-card-name">{a.name}</span>
          <span className="eb-card-title">{a.title}</span>
        </div>
        <span className="eb-reports" style={{ color: lead.c, borderColor: `${lead.c}44` }} title={`Подчиняется ${lead.name}`}>→ {lead.role}</span>
      </div>

      <Activity slug={a.slug} tick={tick} working={mt.working} color={a.c} />

      <div className="eb-mini-metrics">
        <span><b style={{ color: a.c }}>{mt.done}</b> задач</span>
        <span><b style={{ color: a.c }}>{mt.success}%</b> успех</span>
        <span><b style={{ color: a.c }}>{a.confidence}%</b> AI</span>
      </div>

      <div className="eb-track eb-track-sm">
        <motion.i initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE, delay: delay + 0.15 }} style={{ background: a.c }} />
      </div>
    </motion.button>
  );
}

function Sparkline({ color, data }: { color: string; data: number[] }) {
  const W = 64, H = 24, max = Math.max(...data), min = Math.min(...data);
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

// ─── Модалка «спросить лично» ─────────────────────────────────────────────────
function AskModal({ agent, onClose }: { agent: AgentFull; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const mt = metrics(agent.slug);

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
          <div><span style={{ color: agent.c }}>{mt.done}</span><small>Задач закрыто</small></div>
          <div><span style={{ color: agent.c }}>{mt.success}%</span><small>Успешность</small></div>
          <div><span style={{ color: agent.c }}>{agent.confidence}%</span><small>Уверенность</small></div>
        </div>
        <div className="am-ask">
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void submit(); }}
            disabled={busy} placeholder={`Спросить ${agent.name.split(" ")[0]}…`} spellCheck={false} />
          <button onClick={() => void submit()} disabled={busy || !q.trim()} style={{ background: `linear-gradient(135deg,${agent.g[0]},${agent.g[1]})` }} aria-label="Отправить">
            {busy ? <span className="eb-dots"><i /><i /><i /></span> : <CornerDownLeft size={15} strokeWidth={2.4} />}
          </button>
        </div>
        <AnimatePresence>
          {(answer || busy) && (
            <motion.div className="am-answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p>{answer}{busy && <span className="eb-cursor" style={{ background: agent.c }} />}</p>
              {offline && !busy && <div className="eb-offline">Демо-ответ — настройте ANTHROPIC_API_KEY</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function EbStyles() {
  return (
    <style jsx global>{`
      .eb-root { position: relative; background: #05060A; min-height: 100%; overflow: hidden; }
      .eb-ambient { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: min(900px, 100%); height: 480px; pointer-events: none;
        background: radial-gradient(50% 55% at 50% 0%, rgba(99,102,241,0.12), transparent 70%); }

      .eb-wrap { position: relative; max-width: 1160px; margin: 0 auto; padding: 40px 24px 72px; }

      .eb-head { text-align: center; margin-bottom: 22px; }
      .eb-live { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-geist-mono), monospace; font-size: 10px; letter-spacing: 0.16em;
        color: rgba(52,211,153,0.9); background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.2); border-radius: 999px; padding: 6px 14px; margin-bottom: 16px; }
      .eb-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: eb-pulse 2s ease-in-out infinite; }
      @keyframes eb-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      .eb-title { font-size: clamp(28px, 4vw, 38px); font-weight: 800; letter-spacing: -0.03em; color: #F3F4F6; margin: 0 0 10px; text-wrap: balance; }
      .eb-sub { font-size: 14.5px; line-height: 1.6; color: rgba(255,255,255,0.5); max-width: 60ch; margin: 0 auto; }

      .eb-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 36px; }
      .eb-kpi { padding: 16px 18px; border-radius: 16px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04); }
      .eb-kpi-v { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
      .eb-kpi-l { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 3px; }

      .eb-sect { display: flex; align-items: center; gap: 10px; margin: 34px 0 14px; }
      .eb-sect-icon { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 8px;
        color: #a5b4fc; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); flex-shrink: 0; }
      .eb-sect-text { font-family: var(--font-geist-mono), monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: rgba(255,255,255,0.45); white-space: nowrap; }
      .eb-sect-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent); }

      /* главный */
      .eb-ceo { position: relative; overflow: hidden; display: flex; align-items: center; gap: 22px; width: 100%; text-align: left; cursor: pointer;
        padding: 24px 26px; border-radius: 22px; border: 1px solid rgba(99,102,241,0.35);
        background: linear-gradient(150deg, rgba(99,102,241,0.13), rgba(255,255,255,0.02) 60%);
        box-shadow: 0 20px 60px rgba(99,102,241,0.12), 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07); transition: border-color .25s; }
      .eb-ceo:hover { border-color: rgba(99,102,241,0.55); }
      .eb-ceo-glow { position: absolute; top: -70px; left: -40px; width: 260px; height: 260px; pointer-events: none;
        background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%); }
      .eb-ceo-av { position: relative; display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; border-radius: 24px;
        color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 25px; font-weight: 800; flex-shrink: 0;
        box-shadow: 0 16px 44px rgba(99,102,241,0.4), inset 0 2px 0 rgba(255,255,255,0.25); }
      .eb-crown { position: absolute; top: -9px; right: -9px; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        color: #0b0800; background: linear-gradient(135deg, #fbbf24, #d97706); border: 2px solid #05060A; box-shadow: 0 4px 12px rgba(245,158,11,0.4); }
      .eb-ceo-mid { flex: 1; min-width: 0; }
      .eb-ceo-name { display: flex; align-items: center; gap: 10px; font-size: 21px; font-weight: 800; letter-spacing: -0.02em; color: #fff; flex-wrap: wrap; }
      .eb-badge-main { font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 800; letter-spacing: 0.14em; padding: 3px 9px; border-radius: 7px;
        color: #fbbf24; border: 1px solid rgba(251,191,36,0.4); background: rgba(251,191,36,0.08); }
      .eb-ceo-role { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 3px; }
      .eb-ceo-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
      .eb-conf { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .eb-conf-l { font-size: 9.5px; color: rgba(255,255,255,0.35); margin-bottom: 4px; }
      .eb-ask-cta { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; margin-top: 6px; }

      /* активность */
      .eb-activity { display: flex; align-items: center; gap: 8px; margin-top: 10px; min-height: 18px; }
      .eb-act-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); flex-shrink: 0; }
      .eb-act-dot.on { animation: eb-pulse 1.6s ease-in-out infinite; }
      .eb-act-text { font-size: 12px; line-height: 1.4; }

      /* достижения */
      .eb-ach { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 12px; }
      .eb-ach-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 4px 9px; }
      .eb-ach-chip svg { color: #f59e0b; flex-shrink: 0; }

      /* отделы */
      .eb-dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(255px, 1fr)); gap: 14px; }

      .eb-card { display: flex; flex-direction: column; text-align: left; cursor: pointer; border-radius: 18px; padding: 17px 17px 15px; border: 1px solid;
        box-shadow: 0 8px 30px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.045); transition: border-color .25s, box-shadow .25s; }
      .eb-card:hover { box-shadow: 0 16px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06); }
      .eb-card:focus-visible { outline: 2px solid rgba(99,102,241,0.6); outline-offset: 2px; }
      .eb-card-dir { grid-column: 1 / -1; }
      @media (min-width: 860px) { .eb-card-dir { grid-column: span 2; } }

      .eb-card-top { display: flex; align-items: flex-start; gap: 11px; }
      .eb-card-av { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        color: #fff; font-family: var(--font-geist-mono), monospace; font-size: 12.5px; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.24), 0 6px 18px rgba(0,0,0,0.35); }
      .eb-card-av-lg { width: 50px; height: 50px; border-radius: 15px; font-size: 15px; }
      .eb-card-id { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
      .eb-card-name { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
      .eb-card-role { font-family: var(--font-geist-mono), monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
      .eb-card-title { font-size: 11px; color: rgba(255,255,255,0.42); }
      .eb-badge-dir { font-family: var(--font-geist-mono), monospace; font-size: 8.5px; font-weight: 800; letter-spacing: 0.12em; padding: 3px 8px; border-radius: 6px; border: 1px solid; background: rgba(255,255,255,0.02); flex-shrink: 0; }
      .eb-reports { font-family: var(--font-geist-mono), monospace; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; border: 1px solid; background: rgba(255,255,255,0.02); flex-shrink: 0; }

      .eb-mini-metrics { display: flex; gap: 12px; margin-top: 12px; font-size: 10.5px; color: rgba(255,255,255,0.42); }
      .eb-mini-metrics b { font-weight: 800; font-variant-numeric: tabular-nums; }

      .eb-loadrow { display: flex; justify-content: space-between; align-items: baseline; margin-top: 14px; }
      .eb-load-l { font-size: 10px; color: rgba(255,255,255,0.35); }
      .eb-load-v { font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .eb-track { height: 4px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; margin-top: 6px; }
      .eb-track-sm { height: 3px; margin-top: 10px; }
      .eb-track i { display: block; height: 100%; border-radius: 3px; }

      .eb-card-foot { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 14px; }

      /* кнопка совещания */
      .eb-meet { display: inline-flex; align-items: center; justify-content: center; gap: 7px; margin-top: 14px; height: 38px; padding: 0 14px;
        border-radius: 11px; border: 1px solid; cursor: pointer; font-size: 12px; font-weight: 700; width: 100%;
        transition: transform .15s, filter .15s; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
      .eb-meet:hover { transform: translateY(-1px); filter: brightness(1.15); }
      .eb-meet-main { width: auto; margin-top: 14px; color: #fff; border: none;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        box-shadow: 0 4px 16px rgba(99,102,241,0.32), inset 0 1px 0 rgba(255,255,255,0.18); }

      .eb-dots { display: inline-flex; gap: 4px; } .eb-dots i { width: 5px; height: 5px; border-radius: 50%; background: #fff; animation: eb-blink 1s infinite; }
      .eb-dots i:nth-child(2){animation-delay:.15s} .eb-dots i:nth-child(3){animation-delay:.3s}
      @keyframes eb-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
      .eb-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; border-radius: 1px; vertical-align: text-bottom; animation: eb-caret 1s step-end infinite; }
      @keyframes eb-caret { 50% { opacity: 0; } }
      .eb-offline { font-family: var(--font-geist-mono), monospace; font-size: 10px; color: rgba(251,191,36,0.8); margin-top: 10px; }

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

      @media (max-width: 640px) {
        .eb-ceo { flex-direction: column; align-items: flex-start; gap: 14px; }
        .eb-ceo-right { flex-direction: row; align-items: center; gap: 12px; width: 100%; justify-content: space-between; }
      }
      @media (prefers-reduced-motion: reduce) { .eb-live-dot, .eb-act-dot.on, .eb-dots i, .eb-cursor { animation: none; } }
    `}</style>
  );
}
