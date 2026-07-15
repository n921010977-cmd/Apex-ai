"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import {
  CornerDownLeft, X, Crown, Zap, Search, SlidersHorizontal,
  MessageSquare, MessagesSquare, LayoutGrid, List,
  TrendingUp, Trophy, Flame, ChevronDown,
} from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";
import { markVisit } from "@/components/dashboard/EngagementPanel";

// ── Design tokens (identical to dashboard) ────────────────────────────────────
const EASE   = [0.22, 1, 0.36, 1] as const;
const BG     = "#05060A";
const SURF   = "rgba(255,255,255,0.025)";
const BORD   = "rgba(255,255,255,0.07)";
const BORD_H = "rgba(255,255,255,0.13)";
const TP     = "#E5E7EB";
const TS     = "rgba(255,255,255,0.5)";
const TM     = "rgba(255,255,255,0.3)";
const MONO   = "var(--font-geist-mono), ui-monospace, monospace";
const ACCENT = "#6366f1";

// ── Agent data ────────────────────────────────────────────────────────────────
const CHAR: Record<string, { specialty: string; confidence: number }> = {
  ceo:      { specialty: "Стратегия & Видение",        confidence: 96 },
  cfo:      { specialty: "Финансы & Модели",           confidence: 93 },
  cmo:      { specialty: "Маркетинг & Рост",           confidence: 94 },
  coo:      { specialty: "Операции & Процессы",        confidence: 92 },
  cto:      { specialty: "Технологии & Архитектура",   confidence: 95 },
  analyst:  { specialty: "Данные & Гипотезы",          confidence: 91 },
  invest:   { specialty: "Инвестиции & Оценка",        confidence: 92 },
  risk:     { specialty: "Риски & Защита",             confidence: 90 },
  brand:    { specialty: "Бренд & Позиционирование",   confidence: 92 },
  growth:   { specialty: "Рост & Эксперименты",        confidence: 91 },
  market:   { specialty: "Рынок & Разведка",           confidence: 91 },
  pr:       { specialty: "PR & Репутация",             confidence: 88 },
  sales:    { specialty: "Продажи & Воронка",          confidence: 90 },
  hr:       { specialty: "Найм & Команда",             confidence: 87 },
  legal:    { specialty: "Право & Комплаенс",          confidence: 88 },
  supply:   { specialty: "Логистика & Поставки",       confidence: 89 },
  data:     { specialty: "Аналитика & Прогнозы",       confidence: 92 },
  product:  { specialty: "Продукт & Роадмап",          confidence: 93 },
  ux:       { specialty: "UX & Исследования",          confidence: 90 },
  strategy: { specialty: "Сценарии & Развилки",        confidence: 94 },
};

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
  cfo: "С финансовой стороны: считаю юнит-экономику. LTV/CAC ниже 3 — сначала чиним экономику. Пилот с лимитом бюджета и пересмотром через 30 дней.",
  cmo: "С точки зрения роста: спрос проверяем дешёвым тестом — лендинг и два канала, решение по данным конверсии.",
  cto: "Технически реализуемо: 2–3 недели на MVP, начинаем с самого узкого сценария.",
  coo: "По операциям: до запуска нужны владелец процесса, SLA и чек-лист.",
};

const DEPT_META: Record<string, { label: string; color: string }> = {
  all:        { label: "Все",         color: ACCENT },
  leadership: { label: "Leadership",  color: "#6366f1" },
  finance:    { label: "Finance",     color: "#3b82f6" },
  marketing:  { label: "Marketing",   color: "#10b981" },
  operations: { label: "Operations",  color: "#f59e0b" },
  tech:       { label: "Technology",  color: "#a855f7" },
  product:    { label: "Product",     color: "#fb923c" },
};

type SortKey = "confidence" | "tasks" | "success" | "name";
const SORT_LABELS: Record<SortKey, string> = {
  confidence: "Уверенность", tasks: "Задачи", success: "Успех", name: "Имя",
};

function hashOf(s: string): number {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h);
}
function metrics(slug: string) {
  const h = hashOf(slug);
  return { done: 24 + (h % 76), success: 88 + (h % 11), streak: 3 + (h % 12), working: h % 10 < 7, load: 35 + (h % 58) };
}
function sparkData(seed: string): number[] {
  let h = hashOf(seed) % 1000;
  const out: number[] = []; let v = 30 + (h % 20);
  for (let i = 0; i < 10; i++) { v += ((h >> i) % 7) - 2 + i * 0.5; out.push(Math.max(8, Math.min(96, v))); h = (h * 1103515245 + 12345) & 0x7fffffff; }
  return out;
}

type AgentFull = TeamMember & { specialty: string; confidence: number };
const rich = (slug: string): AgentFull => ({
  ...TEAM_BY_SLUG[slug],
  ...(CHAR[slug] ?? { specialty: TEAM_BY_SLUG[slug].title, confidence: 90 }),
});

const TOTALS = (() => {
  let done = 0, success = 0, working = 0;
  for (const m of TEAM) { const mt = metrics(m.slug); done += mt.done; success += mt.success; if (mt.working) working++; }
  return { done, avgSuccess: Math.round(success / TEAM.length), working };
})();

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const router  = useRouter();
  const reduce  = useReducedMotion();
  const [ask,   setAsk]   = useState<AgentFull | null>(null);
  const [tick,  setTick]  = useState(0);
  const [tab,   setTab]   = useState("all");
  const [query, setQuery] = useState("");
  const [sort,  setSort]  = useState<SortKey>("confidence");
  const [view,  setView]  = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen] = useState(false);

  const goMeet = useCallback((slug: string) => {
    router.push(`/dashboard/chat/local-${Date.now()}?agent=${slug}`);
  }, [router]);

  useEffect(() => { markVisit("executives"); }, []);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick(x => x + 1), 3600);
    return () => clearInterval(t);
  }, [reduce]);

  const ceo  = rich("ceo");
  const dirs = C_LEVEL.filter(m => m.slug !== "ceo").map(m => rich(m.slug));
  const tabs = ["all", ...Array.from(new Set(dirs.map(d => d.dept)))];

  // Filter + sort specialists for the active tab
  const visibleDirs = useMemo(() => (
    tab === "all" ? dirs : dirs.filter(d => d.dept === tab)
  ), [tab, dirs]);

  const allSpecialists = useMemo((): AgentFull[] => {
    const slugs = tab === "all"
      ? TEAM.filter(m => m.tier === "specialist").map(m => m.slug)
      : reportsOf(visibleDirs[0]?.slug ?? "").filter(m => m.tier === "specialist").map(m => m.slug);
    const agents = slugs.map(rich).filter(a => {
      if (!query) return true;
      const q = query.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    });
    return agents.sort((a, b) => {
      if (sort === "name")       return a.name.localeCompare(b.name);
      if (sort === "tasks")      return metrics(b.slug).done - metrics(a.slug).done;
      if (sort === "success")    return metrics(b.slug).success - metrics(a.slug).success;
      return b.confidence - a.confidence;
    });
  }, [tab, visibleDirs, query, sort]);

  return (
    <div style={{ background: BG, minHeight: "100%", position: "relative" }}>
      {/* Ambient */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 900, height: 400, pointerEvents: "none",
        background: "radial-gradient(ellipse 55% 40% at 50% 0%, rgba(99,102,241,0.09), transparent 70%)" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px 80px", position: "relative" }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px",
              borderRadius: 999, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)",
              marginBottom: 12 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981",
                animation: "ap-pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.14em" }}>
                {TOTALS.working} АКТИВНЫХ · LIVE
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 800, color: TP,
              letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 6 }}>
              AI Агенты
            </h1>
            <p style={{ fontSize: 14, color: TS, lineHeight: 1.6, maxWidth: 480 }}>
              {TEAM.length} агентов вашей команды — прямой доступ, метрики и живые задачи.
            </p>
          </div>
          <motion.button
            whileHover={{ y: -1 }} whileTap={{ y: 0 }}
            onClick={() => goMeet("ceo")}
            style={{ height: 44, padding: "0 20px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff",
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
              boxShadow: "0 6px 20px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.16)" }}>
            <MessagesSquare size={14} />
            Совещание совета
          </motion.button>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 32,
            borderRadius: 14, overflow: "hidden", border: `1px solid ${BORD}` }}>
          {[
            { label: "Всего агентов",     val: TEAM.length,          suffix: "",  note: "в совете" },
            { label: "Работают сейчас",   val: TOTALS.working,       suffix: "",  note: `из ${TEAM.length}` },
            { label: "Задач за месяц",    val: TOTALS.done,          suffix: "",  note: "выполнено" },
            { label: "Средняя точность",  val: TOTALS.avgSuccess,    suffix: "%", note: "AI уверенность" },
          ].map((s, i) => <StatCell key={s.label} {...s} delay={i * 0.06} />)}
        </motion.div>

        {/* ── CEO hero ── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: EASE }} style={{ marginBottom: 32 }}>
          <CeoHero a={ceo} tick={tick} reduce={!!reduce}
            onAsk={() => setAsk(ceo)} onMeet={() => goMeet("ceo")} />
        </motion.div>

        {/* ── Department tabs ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24,
            borderBottom: `1px solid ${BORD}` }}>
          {tabs.map(t => {
            const meta = DEPT_META[t] ?? { label: t, color: ACCENT };
            const count = t === "all" ? TEAM.length - 1
              : TEAM.filter(m => m.dept === t && m.slug !== "ceo").length;
            const active = tab === t;
            return (
              <button key={t} onClick={() => { setTab(t); setQuery(""); }}
                style={{ position: "relative", height: 40, padding: "0 16px", border: "none",
                  background: "transparent", cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 6, fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? TP : TS, transition: "color 0.18s" }}>
                {active && (
                  <motion.div layoutId="tab-indicator"
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                      background: meta.color, borderRadius: 2 }} />
                )}
                {meta.label}
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  padding: "1px 6px", borderRadius: 6,
                  background: active ? `${meta.color}18` : "rgba(255,255,255,0.04)",
                  color: active ? meta.color : TM, border: `1px solid ${active ? `${meta.color}30` : BORD}` }}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Directors grid ── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: EASE }}>

            {visibleDirs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 12, marginBottom: 32 }}>
                {visibleDirs.map((d, i) => (
                  <DirectorCard key={d.slug} a={d} tick={tick} reduce={!!reduce} delay={i * 0.07}
                    onAsk={() => setAsk(d)} onMeet={() => goMeet(d.slug)} />
                ))}
              </div>
            )}

            {/* ── Specialists section ── */}
            <div style={{ marginTop: 8 }}>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: TM }}>
                  СПЕЦИАЛИСТЫ · {allSpecialists.length}
                </div>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BORD}, transparent)` }} />

                {/* Search */}
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 11, top: "50%",
                    transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Поиск…"
                    style={{ height: 34, width: 180, paddingLeft: 32, paddingRight: 12, borderRadius: 10,
                      background: SURF, border: `1px solid ${BORD}`, color: TP, fontSize: 12,
                      outline: "none", transition: "border-color 0.15s" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = BORD; }} />
                </div>

                {/* Sort */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => setSortOpen(o => !o)}
                    style={{ height: 34, padding: "0 12px", borderRadius: 10, border: `1px solid ${BORD}`,
                      background: SURF, color: TS, fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = BORD_H; e.currentTarget.style.color = TP; }}
                    onMouseOut={e  => { e.currentTarget.style.borderColor = BORD; e.currentTarget.style.color = TS; }}>
                    <SlidersHorizontal size={12} />
                    {SORT_LABELS[sort]}
                    <ChevronDown size={11} style={{ opacity: 0.5 }} />
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.14 }}
                        style={{ position: "absolute", top: 40, right: 0, zIndex: 20, minWidth: 160,
                          background: "#0e101a", border: `1px solid ${BORD_H}`, borderRadius: 12,
                          boxShadow: "0 16px 48px rgba(0,0,0,0.5)", overflow: "hidden" }}>
                        {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                          <button key={k} onClick={() => { setSort(k); setSortOpen(false); }}
                            style={{ width: "100%", padding: "10px 14px", border: "none", textAlign: "left",
                              background: sort === k ? "rgba(99,102,241,0.12)" : "transparent",
                              color: sort === k ? "#a5b4fc" : TS, fontSize: 13, cursor: "pointer",
                              fontWeight: sort === k ? 600 : 400, transition: "background 0.12s",
                              display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            onMouseOver={e => { if (sort !== k) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                            onMouseOut={e  => { if (sort !== k) e.currentTarget.style.background = "transparent"; }}>
                            {SORT_LABELS[k]}
                            {sort === k && <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View toggle */}
                <div style={{ display: "flex", border: `1px solid ${BORD}`, borderRadius: 10, overflow: "hidden" }}>
                  {(["grid", "list"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none", cursor: "pointer", transition: "all 0.15s",
                        background: view === v ? "rgba(99,102,241,0.18)" : "transparent",
                        color: view === v ? "#a5b4fc" : TM }}>
                      {v === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialist grid / list */}
              {allSpecialists.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: TM, fontSize: 13 }}>
                  Ничего не найдено
                </div>
              ) : view === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {allSpecialists.map((a, i) => (
                    <AgentGridCard key={a.slug} a={a} tick={tick} reduce={!!reduce} delay={i * 0.04}
                      onAsk={() => setAsk(a)} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {allSpecialists.map((a, i) => (
                    <AgentListRow key={a.slug} a={a} tick={tick} delay={i * 0.03} onAsk={() => setAsk(a)} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>{ask && <AskModal agent={ask} onClose={() => setAsk(null)} />}</AnimatePresence>

      {/* Close sort dropdown on outside click */}
      {sortOpen && <div onClick={() => setSortOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />}

      <style>{`
        @keyframes ap-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.25;transform:scale(0.5)} }
        @keyframes ap-think { 0%,100%{opacity:.2;transform:translateY(0)} 50%{opacity:1;transform:translateY(-2px)} }
        @keyframes ap-caret { 50%{opacity:0} }
        @media (prefers-reduced-motion:reduce) { * { animation-duration:0.01ms!important; transition-duration:0.01ms!important } }
        ::placeholder { color: ${TM}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:2px; }
      `}</style>
    </div>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ label, val, suffix, note, delay }: {
  label: string; val: number; suffix: string; note: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now(); const dur = 1000;
    const step = (ts: number) => {
      const p = Math.min(1, (ts - t0) / dur);
      setV(Math.round(val * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, val]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      style={{ padding: "20px 22px", background: SURF,
        borderRight: `1px solid ${BORD}` }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: TP, letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{v}{suffix}</div>
      <div style={{ fontSize: 12, color: TS, marginTop: 5 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TM, marginTop: 3 }}>{note}</div>
    </motion.div>
  );
}

// ── Confidence arc ────────────────────────────────────────────────────────────
function ConfArc({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const r   = (size - 7) / 2;
  const c   = size / 2;
  const circ = 2 * Math.PI * r;
  const target = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        whileInView={{ strokeDashoffset: target }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
        transform={`rotate(-90 ${c} ${c})`} />
      <text x={c} y={c + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}
        style={{ fontVariantNumeric: "tabular-nums", fontFamily: "inherit" }}>
        {value}%
      </text>
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({ color, data, w = 80, h = 28 }: { color: string; data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i): [number, number] => [
    (i / (data.length - 1)) * w,
    h - ((d - min) / (max - min || 1)) * (h - 4) - 2,
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const fill = `${line} L${w},${h} L0,${h} Z`;
  const gid  = `sp-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={fill} fill={`url(#${gid})`}
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.7 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }} />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.5} fill={color} />
    </svg>
  );
}

// ── Live activity text ────────────────────────────────────────────────────────
function LiveAct({ slug, tick, working, color }: { slug: string; tick: number; working: boolean; color: string }) {
  const list = ACT[slug] ?? ["Работает над задачей"];
  const text = working ? list[tick % list.length] : "В ожидании задачи";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {working
        ? <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
            {[0,1,2].map(d => (
              <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: color,
                animation: `ap-think 1.2s ease-in-out ${d * 0.18}s infinite` }} />
            ))}
          </span>
        : <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
      <AnimatePresence mode="wait">
        <motion.span key={text}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: EASE }}
          style={{ fontSize: 11.5, lineHeight: 1.4,
            color: working ? TS : TM }}>
          {working && <span style={{ color, fontWeight: 600, marginRight: 4 }}>сейчас:</span>}
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── CEO hero card ──────────────────────────────────────────────────────────────
function CeoHero({ a, tick, onAsk, onMeet, reduce }: {
  a: AgentFull; tick: number; onAsk: () => void; onMeet: () => void; reduce: boolean;
}) {
  const mt  = metrics(a.slug);
  const [hov, setHov] = useState(false);

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -3 : 0 }} transition={{ duration: 0.28, ease: EASE }}
      style={{ position: "relative", overflow: "hidden", borderRadius: 22, cursor: "pointer",
        background: "linear-gradient(150deg, rgba(99,102,241,0.13), rgba(255,255,255,0.025) 60%)",
        border: `1px solid ${hov ? "rgba(99,102,241,0.42)" : "rgba(99,102,241,0.22)"}`,
        boxShadow: hov
          ? "0 20px 60px rgba(99,102,241,0.16), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "border-color 0.25s, box-shadow 0.25s" }}
      onClick={onAsk}>

      {/* Top shimmer line */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5) 30%, rgba(99,102,241,0.55) 65%, transparent)" }} />
      {/* Ambient orb */}
      <div aria-hidden style={{ position: "absolute", top: -60, left: -40, width: 300, height: 300,
        borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "28px 32px", flexWrap: "wrap" }}>

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <motion.div
            animate={reduce ? undefined : { y: [0, -5, 0] }}
            transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 88, height: 88, borderRadius: 26, display: "flex", alignItems: "center",
              justifyContent: "center", background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
              color: "#fff", fontSize: 24, fontWeight: 800, fontFamily: MONO,
              boxShadow: "0 16px 44px rgba(99,102,241,0.42), inset 0 2px 0 rgba(255,255,255,0.25)" }}>
            {a.ab}
          </motion.div>
          <div style={{ position: "absolute", top: -10, right: -10, width: 28, height: 28,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#fbbf24,#d97706)", border: "2px solid #05060A",
            boxShadow: "0 4px 14px rgba(245,158,11,0.5)", color: "#0b0800" }}>
            <Crown size={12} strokeWidth={2.5} />
          </div>
        </div>

        {/* Info block */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: TP, letterSpacing: "-0.02em" }}>{a.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
              padding: "3px 9px", borderRadius: 7, color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.32)", background: "rgba(251,191,36,0.08)" }}>CHIEF</span>
          </div>
          <div style={{ fontSize: 13, color: TS, marginBottom: 14 }}>{a.title} · {a.specialty}</div>
          <LiveAct slug={a.slug} tick={tick} working color={a.c} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {[
              { icon: Trophy,     label: `${mt.done} задач` },
              { icon: TrendingUp, label: `${mt.success}% успех` },
              { icon: Flame,      label: `${mt.streak} дней` },
            ].map(({ icon: Icon, label }) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
                fontWeight: 600, color: TS, background: "rgba(255,255,255,0.04)",
                border: `1px solid ${BORD}`, borderRadius: 8, padding: "4px 10px" }}>
                <Icon size={10} style={{ color: "#f59e0b" }} />{label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: confidence arc + sparkline + actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: TM, marginBottom: 4 }}>Производительность</div>
              <Spark color={a.c} data={sparkData(a.slug)} />
            </div>
            <ConfArc value={a.confidence} color={a.c} size={60} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={e => { e.stopPropagation(); onAsk(); }}
              style={{ height: 38, padding: "0 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", color: a.c, background: `${a.c}14`,
                border: `1px solid ${a.c}40`, display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.18s" }}
              onMouseOver={e => { e.currentTarget.style.background = `${a.c}22`; }}
              onMouseOut={e  => { e.currentTarget.style.background = `${a.c}14`; }}>
              <MessageSquare size={12} /> Спросить
            </button>
            <button onClick={e => { e.stopPropagation(); onMeet(); }}
              style={{ height: 38, padding: "0 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", color: "#fff",
                background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 4px 16px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
                transition: "all 0.18s" }}
              onMouseOver={e => { e.currentTarget.style.filter = "brightness(1.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={e  => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <MessagesSquare size={12} /> Совещание · {TEAM.length - 1}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Director card ──────────────────────────────────────────────────────────────
function DirectorCard({ a, tick, delay, reduce, onAsk, onMeet }: {
  a: AgentFull; tick: number; delay: number; reduce: boolean;
  onAsk: () => void; onMeet: () => void;
}) {
  const mt  = metrics(a.slug);
  const team = reportsOf(a.slug).filter(m => m.tier === "specialist");
  const [hov, setHov] = useState(false);

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -4 : 0 }} transition={{ duration: 0.26, ease: EASE }}
      onClick={onAsk}
      style={{ padding: "22px 22px", borderRadius: 18, cursor: "pointer", position: "relative", overflow: "hidden",
        background: hov ? `linear-gradient(145deg, ${a.c}14, rgba(255,255,255,0.035) 65%)` : `linear-gradient(145deg, ${a.c}0c, rgba(255,255,255,0.025) 65%)`,
        border: `1px solid ${hov ? `${a.c}48` : `${a.c}24`}`,
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)` : "0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "all 0.24s" }}>

      {hov && <div aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160,
        borderRadius: "50%", pointerEvents: "none",
        background: `radial-gradient(circle, ${a.c}20, transparent 70%)` }} />}

      {/* Top row: avatar + name + conf arc */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div
            animate={reduce ? undefined : { y: [0, -3, 0] }}
            transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
            style={{ width: 52, height: 52, borderRadius: 15, flexShrink: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
              color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: MONO,
              boxShadow: `0 8px 24px ${a.c}40, inset 0 1px 0 rgba(255,255,255,0.25)` }}>
            {a.ab}
          </motion.div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: TP }}>{a.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em",
                padding: "2px 7px", borderRadius: 6, color: a.c,
                border: `1px solid ${a.c}45`, background: `${a.c}10` }}>{a.role}</span>
            </div>
            <div style={{ fontSize: 12, color: TS }}>{a.specialty}</div>
          </div>
        </div>
        <ConfArc value={a.confidence} color={a.c} size={50} />
      </div>

      {/* Live activity */}
      <div style={{ marginBottom: 14 }}>
        <LiveAct slug={a.slug} tick={tick} working={mt.working} color={a.c} />
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden",
        border: `1px solid ${BORD}`, marginBottom: 12 }}>
        {[
          { v: mt.done,          l: "задач" },
          { v: `${mt.success}%`, l: "успех" },
          { v: `${team.length}`, l: "в команде" },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, padding: "8px 0", textAlign: "center",
            borderRight: i < 2 ? `1px solid ${BORD}` : "none",
            background: "rgba(255,255,255,0.015)" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
            <div style={{ fontSize: 9, color: TM, marginTop: 1 }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Load bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: TM }}>Загрузка</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: a.c, fontVariantNumeric: "tabular-nums" }}>{mt.load}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }}
            transition={{ duration: 1.1, ease: EASE, delay: delay + 0.2 }}
            style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${a.g[0]}, ${a.g[1]})` }} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 7 }}>
        <button onClick={e => { e.stopPropagation(); onAsk(); }}
          style={{ flex: 1, height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
            color: a.c, background: `${a.c}12`, border: `1px solid ${a.c}3a`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.16s" }}
          onMouseOver={e => { e.currentTarget.style.background = `${a.c}22`; }}
          onMouseOut={e  => { e.currentTarget.style.background = `${a.c}12`; }}>
          <MessageSquare size={11} /> Спросить
        </button>
        <button onClick={e => { e.stopPropagation(); onMeet(); }}
          style={{ flex: 1, height: 34, borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
            color: "#fff", background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: `0 3px 12px ${a.c}38, inset 0 1px 0 rgba(255,255,255,0.18)`, transition: "all 0.16s" }}
          onMouseOver={e => { e.currentTarget.style.filter = "brightness(1.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseOut={e  => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
          <MessagesSquare size={11} /> Совещание · {team.length}
        </button>
      </div>
    </motion.div>
  );
}

// ── Specialist grid card ──────────────────────────────────────────────────────
function AgentGridCard({ a, tick, delay, reduce, onAsk }: {
  a: AgentFull; tick: number; delay: number; reduce: boolean; onAsk: () => void;
}) {
  const mt  = metrics(a.slug);
  const [hov, setHov] = useState(false);

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -5 : 0 }} transition={{ duration: 0.22, ease: EASE }}
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      onClick={onAsk}
      style={{ padding: "16px", borderRadius: 16, cursor: "pointer", position: "relative", overflow: "hidden",
        background: hov ? `${a.c}0e` : `${a.c}08`,
        border: `1px solid ${hov ? `${a.c}45` : `${a.c}1e`}`,
        boxShadow: hov ? `0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)` : "0 2px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "all 0.2s" }}>

      {/* Top: avatar + name + arc */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={reduce || !mt.working ? undefined : { y: [0, -2.5, 0] }}
            transition={reduce ? undefined : { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay }}
            style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
              color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: MONO,
              boxShadow: `0 5px 16px ${a.c}38, inset 0 1px 0 rgba(255,255,255,0.24)` }}>
            {a.ab}
          </motion.div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TP, letterSpacing: "-0.01em" }}>{a.name}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: a.c, letterSpacing: "0.05em" }}>{a.role}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 7,
          background: mt.working ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${mt.working ? "rgba(16,185,129,0.3)" : BORD}` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%",
            background: mt.working ? "#10b981" : "rgba(255,255,255,0.2)",
            animation: mt.working ? "ap-pulse 2s ease-in-out infinite" : "none" }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: mt.working ? "#10b981" : TM,
            fontFamily: MONO, letterSpacing: "0.08em" }}>
            {mt.working ? "ACTIVE" : "IDLE"}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: TS, marginBottom: 10, lineHeight: 1.4 }}>{a.specialty}</div>
      <div style={{ marginBottom: 12 }}>
        <LiveAct slug={a.slug} tick={tick} working={mt.working} color={a.c} />
      </div>

      {/* 3-metric row */}
      <div style={{ display: "flex", gap: 0, borderRadius: 9, overflow: "hidden", border: `1px solid ${BORD}`, marginBottom: 10 }}>
        {[
          { v: mt.done,             l: "задач" },
          { v: `${mt.success}%`,    l: "успех" },
          { v: `${a.confidence}%`,  l: "conf" },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, padding: "7px 0", textAlign: "center",
            borderRight: i < 2 ? `1px solid ${BORD}` : "none",
            background: "rgba(255,255,255,0.012)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
            <div style={{ fontSize: 8.5, color: TM, marginTop: 1 }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Thin progress bar */}
      <div style={{ height: 2, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE, delay: delay + 0.1 }}
          style={{ height: "100%", borderRadius: 2, background: a.c }} />
      </div>

      {/* Hover CTA */}
      <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 5, fontSize: 11, fontWeight: 700, color: a.c }}>
            <MessageSquare size={11} /> Спросить {a.name.split(" ")[0]}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Specialist list row ───────────────────────────────────────────────────────
function AgentListRow({ a, tick, delay, onAsk }: {
  a: AgentFull; tick: number; delay: number; onAsk: () => void;
}) {
  const mt  = metrics(a.slug);
  const [hov, setHov] = useState(false);

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, ease: EASE, delay }}
      onClick={onAsk}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 12,
        cursor: "pointer", background: hov ? `${a.c}0c` : "transparent",
        border: `1px solid ${hov ? `${a.c}38` : "transparent"}`,
        transition: "all 0.18s" }}>

      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
        color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: MONO,
        boxShadow: `0 4px 12px ${a.c}30` }}>
        {a.ab}
      </div>

      {/* Name */}
      <div style={{ minWidth: 160 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: hov ? TP : "rgba(229,231,235,0.85)" }}>{a.name}</div>
        <div style={{ fontSize: 11, color: a.c, fontWeight: 600 }}>{a.role} · {a.specialty}</div>
      </div>

      {/* Activity */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <LiveAct slug={a.slug} tick={tick} working={mt.working} color={a.c} />
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
        {[
          { v: mt.done,             l: "задач" },
          { v: `${mt.success}%`,    l: "успех" },
          { v: `${a.confidence}%`,  l: "conf" },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: "right", minWidth: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: a.c, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
            <div style={{ fontSize: 9, color: TM }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Status + ask */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7,
          fontSize: 9, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.08em",
          background: mt.working ? "rgba(16,185,129,0.1)" : SURF,
          border: `1px solid ${mt.working ? "rgba(16,185,129,0.28)" : BORD}`,
          color: mt.working ? "#10b981" : TM }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
            background: mt.working ? "#10b981" : "rgba(255,255,255,0.2)" }} />
          {mt.working ? "ACTIVE" : "IDLE"}
        </span>
        <AnimatePresence>
          {hov && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }}
              onClick={e => { e.stopPropagation(); onAsk(); }}
              style={{ height: 30, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: "pointer", color: a.c, background: `${a.c}14`,
                border: `1px solid ${a.c}40`, display: "flex", alignItems: "center", gap: 5 }}>
              <MessageSquare size={10} /> Спросить
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Ask modal ─────────────────────────────────────────────────────────────────
function AskModal({ agent, onClose }: { agent: AgentFull; onClose: () => void }) {
  const [q,       setQ]       = useState("");
  const [answer,  setAnswer]  = useState("");
  const [busy,    setBusy]    = useState(false);
  const [offline, setOffline] = useState(false);
  const mt = metrics(agent.slug);

  const submit = useCallback(async () => {
    const question = q.trim(); if (!question || busy) return;
    setBusy(true); setAnswer(""); setOffline(false);
    const persona = `Ты — ${agent.name}, ${agent.title} в совете директоров Apex AI, специализация: ${agent.specialty}. Ответь как топ-менеджер: по делу, с конкретикой, 4–6 предложений. Без markdown.`;
    try {
      await streamChat(question, persona, t => setAnswer(prev => prev + t));
    } catch {
      setOffline(true);
      const fb = (agent.slug in FB ? FB[agent.slug] : undefined)
        ?? "Готов помочь — опишите задачу подробнее. Живой анализ доступен после настройки ANTHROPIC_API_KEY.";
      for (const ch of fb) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); }
    }
    setBusy(false);
  }, [q, busy, agent]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,6,10,0.78)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.24, ease: EASE }}
        style={{ position: "relative", width: "min(620px,100%)", maxHeight: "86vh", overflowY: "auto",
          borderRadius: 22, padding: 28, background: "#0a0c15",
          border: `1px solid ${agent.c}2e`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px ${agent.c}16` }}>

        {/* Accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "22px 22px 0 0",
          background: `linear-gradient(90deg, transparent, ${agent.c}80, transparent)` }} />

        {/* Close */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: SURF, border: `1px solid ${BORD}`, color: TS, cursor: "pointer", transition: "all 0.16s" }}
          onMouseOver={e => { e.currentTarget.style.color = TP; e.currentTarget.style.borderColor = BORD_H; }}
          onMouseOut={e  => { e.currentTarget.style.color = TS; e.currentTarget.style.borderColor = BORD; }}>
          <X size={15} strokeWidth={2.2} />
        </button>

        {/* Agent header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${agent.g[0]}, ${agent.g[1]})`,
            color: "#fff", fontSize: 17, fontWeight: 800, fontFamily: MONO,
            boxShadow: `0 8px 24px ${agent.c}44, inset 0 1px 0 rgba(255,255,255,0.25)` }}>
            {agent.ab}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: TP, letterSpacing: "-0.02em" }}>{agent.name}</div>
            <div style={{ fontSize: 12.5, color: TS, marginTop: 2 }}>{agent.title} · {agent.specialty}</div>
          </div>
          <ConfArc value={agent.confidence} color={agent.c} size={52} />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 22 }}>
          {[
            { v: mt.done,              l: "Задач закрыто" },
            { v: `${mt.success}%`,     l: "Успешность" },
            { v: `${mt.streak} дней`,  l: "Серия" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: SURF, border: `1px solid ${BORD}` }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: agent.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
              <div style={{ fontSize: 10, color: TM, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 8 }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void submit(); }}
            disabled={busy}
            placeholder={`Спросить ${agent.name.split(" ")[0]}…`}
            style={{ flex: 1, minWidth: 0, height: 48, padding: "0 16px", borderRadius: 13, fontSize: 14,
              color: TP, background: "rgba(255,255,255,0.035)", border: `1px solid ${BORD}`,
              outline: "none", transition: "border-color 0.18s, box-shadow 0.18s" }}
            onFocus={e => { e.currentTarget.style.borderColor = `${agent.c}60`; e.currentTarget.style.boxShadow = `0 0 0 3px ${agent.c}16`; }}
            onBlur={e  => { e.currentTarget.style.borderColor = BORD; e.currentTarget.style.boxShadow = "none"; }} />
          <button onClick={() => void submit()} disabled={busy || !q.trim()}
            style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 13, border: "none",
              cursor: busy || !q.trim() ? "not-allowed" : "pointer",
              background: `linear-gradient(135deg, ${agent.g[0]}, ${agent.g[1]})`, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${agent.c}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
              opacity: busy || !q.trim() ? 0.5 : 1, transition: "opacity 0.16s" }}>
            {busy
              ? <span style={{ display: "inline-flex", gap: 3 }}>
                  {[0,1,2].map(d => <span key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff",
                    animation: `ap-think 1s ease-in-out ${d*0.15}s infinite` }} />)}
                </span>
              : <CornerDownLeft size={16} strokeWidth={2.4} />}
          </button>
        </div>

        {/* Answer */}
        <AnimatePresence>
          {(answer || busy) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
              style={{ marginTop: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)",
                border: `1px solid ${agent.c}20`, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: `${agent.c}18`,
                  border: `1px solid ${agent.c}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={10} style={{ color: agent.c }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: agent.c,
                  letterSpacing: "0.1em", fontFamily: MONO }}>{agent.name.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(229,231,235,0.85)",
                margin: 0, whiteSpace: "pre-wrap" }}>
                {answer}
                {busy && <span style={{ display: "inline-block", width: 7, height: 14, marginLeft: 2,
                  borderRadius: 1, background: agent.c, verticalAlign: "text-bottom",
                  animation: "ap-caret 1s step-end infinite" }} />}
              </p>
              {offline && !busy && (
                <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 10, color: "rgba(251,191,36,0.65)" }}>
                  Демо-ответ · настройте ANTHROPIC_API_KEY для живого AI
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
