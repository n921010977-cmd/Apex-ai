"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { CornerDownLeft, X, Crown, Zap, Search } from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;
const MONO = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

// ─── Data ─────────────────────────────────────────────────────────────────────
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
  cfo: "С финансовой стороны: считаю юнит-экономику. Если LTV/CAC ниже 3 — сначала чиним экономику. Пилот с лимитом бюджета и пересмотром через 30 дней.",
  cmo: "С точки зрения роста: спрос проверяем дешёвым тестом — лендинг и два канала, решение по данным конверсии.",
  cto: "Технически реализуемо: закладываю 2–3 недели на MVP, начинаем с самого узкого сценария.",
  coo: "По операциям: до запуска нужны владелец процесса, SLA и чек-лист.",
};

const DEPT_LABELS: Record<string, string> = {
  leadership: "LEADERSHIP",
  finance:    "FINANCE",
  marketing:  "MARKETING",
  operations: "OPERATIONS",
  tech:       "TECHNOLOGY",
  product:    "PRODUCT",
};

function hashOf(s: string): number {
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h);
}
function metrics(slug: string) {
  const h = hashOf(slug);
  return { done: 24 + (h % 76), success: 88 + (h % 11), streak: 3 + (h % 12), working: h % 10 < 7, load: 35 + (h % 58) };
}
function pid(slug: string): string {
  return "0x" + hashOf(slug).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
}
function loadBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

type AgentFull = TeamMember & { specialty: string; confidence: number };
const byslug = (slug: string): AgentFull => ({
  ...TEAM_BY_SLUG[slug],
  ...(CHAR[slug] ?? { specialty: TEAM_BY_SLUG[slug].title, confidence: 90 }),
});

const TOTALS = (() => {
  let done = 0, success = 0, working = 0;
  for (const m of TEAM) { const mt = metrics(m.slug); done += mt.done; success += mt.success; if (mt.working) working++; }
  return { done, success: success / TEAM.length, working };
})();

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const router   = useRouter();
  const [ask,    setAsk]    = useState<AgentFull | null>(null);
  const [tick,   setTick]   = useState(0);
  const [search, setSearch] = useState("");
  const [dept,   setDept]   = useState<string>("all");
  const [booted, setBooted] = useState(false);
  const reduce = useReducedMotion();

  const goMeeting = useCallback((slug: string) => {
    router.push(`/dashboard/chat/local-${Date.now()}?agent=${slug}`);
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick(x => x + 1), 3600);
    return () => clearInterval(t);
  }, [reduce]);

  const ceo  = byslug("ceo");
  const dirs = C_LEVEL.filter(m => m.slug !== "ceo");
  const depts = ["all", ...Array.from(new Set(dirs.map(d => d.dept)))];

  const filteredDirs = dirs.filter(d => {
    if (dept !== "all" && d.dept !== dept) return false;
    if (search) {
      const q = search.toLowerCase();
      const a = byslug(d.slug);
      return a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ background: "#020507", minHeight: "100%", fontFamily: MONO, position: "relative", overflow: "hidden" }}>

      {/* Scanline overlay */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Subtle scanline sweep */}
      <div aria-hidden style={{
        position: "fixed", left: 0, right: 0, height: 3, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent)",
        animation: "term-scan 8s linear infinite",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 2 }}>

        {/* ── Terminal header ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 32 }}>
          <div style={{ color: "rgba(16,185,129,0.5)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 8 }}>
            apex@board:~$ ps aux --filter=agents --all
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 700, color: "#10b981", letterSpacing: "0.04em", margin: 0, lineHeight: 1 }}>
              APEX EXECUTIVE BOARD
            </h1>
            <span style={{ fontSize: 12, color: "rgba(16,185,129,0.5)" }}>v2.0 · {TEAM.length} процессов</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#10b981", padding: "3px 10px",
              border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)", letterSpacing: "0.12em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "term-blink 1.4s ease-in-out infinite" }} />
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "rgba(16,185,129,0.35)" }}>
            {`USER=apex  UPTIME=99.97%  THREADS=${TEAM.length}  ACTIVE=${TOTALS.working}  IDLE=${TEAM.length - TOTALS.working}`}
          </div>
        </motion.div>

        {/* ── KPI row ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 32,
            border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.08)" }}>
          {[
            { label: "TOTAL_AGENTS",   value: TEAM.length,               suffix: "" },
            { label: "ACTIVE_NOW",     value: TOTALS.working,            suffix: "" },
            { label: "TASKS_MONTH",    value: TOTALS.done,               suffix: "" },
            { label: "AVG_SUCCESS",    value: Math.round(TOTALS.success),suffix: "%" },
          ].map((k, i) => <KpiCell key={k.label} {...k} delay={i * 0.06} />)}
        </motion.div>

        {/* ── CEO panel ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
          style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "rgba(16,185,129,0.45)", letterSpacing: "0.12em", marginBottom: 8 }}>
            {`// ── [ROOT] CHIEF EXECUTIVE OFFICER ─────────────────────────────`}
          </div>
          <CeoRow a={ceo} tick={tick} onAsk={() => setAsk(ceo)} onMeet={() => goMeeting("ceo")} reduce={!!reduce} booted={booted} />
        </motion.div>

        {/* ── Search + Filter ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
          style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: "rgba(16,185,129,0.45)", marginBottom: 8 }}>
            apex@board:~$ grep -i <span style={{ color: "#10b981" }}>&quot;{search || "..."}&quot;</span> agents.db --dept=<span style={{ color: "#10b981" }}>{dept}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(16,185,129,0.5)", fontSize: 12, pointerEvents: "none" }}>$</span>
              <Search size={12} style={{ position: "absolute", left: 26, top: "50%", transform: "translateY(-50%)", color: "rgba(16,185,129,0.4)", pointerEvents: "none" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="поиск агентов…"
                style={{ width: "100%", height: 38, paddingLeft: 44, paddingRight: 14,
                  background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)",
                  color: "#a7f3d0", fontSize: 12, outline: "none", fontFamily: MONO, boxSizing: "border-box",
                  transition: "border-color 0.15s" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.55)"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; }}
              />
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {depts.map(d => (
                <button key={d} onClick={() => setDept(d)}
                  style={{ height: 34, padding: "0 12px", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: MONO, letterSpacing: "0.1em",
                    transition: "all 0.15s",
                    ...(dept === d
                      ? { background: "rgba(16,185,129,0.18)", color: "#10b981", border: "1px solid rgba(16,185,129,0.45)" }
                      : { background: "transparent", color: "rgba(16,185,129,0.4)", border: "1px solid rgba(16,185,129,0.15)" })
                  }}>
                  [{d === "all" ? "ALL" : (DEPT_LABELS[d] ?? d.toUpperCase())}]
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Director + agent sections ── */}
        <AnimatePresence mode="wait">
          <motion.div key={dept + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {filteredDirs.length === 0 ? (
              <div style={{ padding: "40px 0", color: "rgba(16,185,129,0.35)", fontSize: 12, letterSpacing: "0.08em" }}>
                grep: no matches found
              </div>
            ) : filteredDirs.map((d, di) => {
              const director = byslug(d.slug);
              const team = reportsOf(d.slug).filter(m => m.tier === "specialist").map(m => byslug(m.slug))
                .filter(a => !search
                  || a.name.toLowerCase().includes(search.toLowerCase())
                  || a.specialty.toLowerCase().includes(search.toLowerCase())
                  || director.name.toLowerCase().includes(search.toLowerCase()));

              if (dept !== "all" && team.length === 0 && !director.name.toLowerCase().includes(search.toLowerCase())) return null;

              return (
                <motion.div key={d.slug} style={{ marginBottom: 32 }}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: di * 0.07 }}>

                  {/* Department header line */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, fontSize: 10, color: "rgba(16,185,129,0.45)", letterSpacing: "0.12em" }}>
                    <span>{`// ── [DEPT] ${DEPT_LABELS[director.dept] ?? director.dept.toUpperCase()} · ${team.length + 1} AGENTS`}</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(16,185,129,0.12)" }} />
                  </div>

                  {/* Director row */}
                  <DirectorRow a={director} teamCount={team.length} tick={tick} delay={di * 0.05}
                    onAsk={() => setAsk(director)} onMeet={() => goMeeting(director.slug)} reduce={!!reduce} />

                  {/* Agents table */}
                  {team.length > 0 && (
                    <div style={{ marginTop: 4, border: "1px solid rgba(16,185,129,0.1)", borderTop: "none" }}>
                      {/* Table header */}
                      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 200px 60px 60px 60px 80px",
                        padding: "6px 16px", background: "rgba(16,185,129,0.04)",
                        borderBottom: "1px solid rgba(16,185,129,0.1)",
                        fontSize: 9, color: "rgba(16,185,129,0.4)", letterSpacing: "0.12em" }}>
                        <span>PID</span>
                        <span>NAME / SPECIALTY</span>
                        <span>STATUS</span>
                        <span style={{ textAlign: "right" }}>TASKS</span>
                        <span style={{ textAlign: "right" }}>SUCC%</span>
                        <span style={{ textAlign: "right" }}>CONF%</span>
                        <span style={{ textAlign: "right" }}>CMD</span>
                      </div>
                      {team.map((a, i) => (
                        <AgentRow key={a.slug} a={a} tick={tick} delay={di * 0.05 + i * 0.04}
                          onAsk={() => setAsk(a)} isLast={i === team.length - 1} />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div style={{ marginTop: 40, fontSize: 10, color: "rgba(16,185,129,0.25)", letterSpacing: "0.1em" }}>
          apex@board:~$ █
        </div>
      </div>

      <AnimatePresence>{ask && <AskModal agent={ask} onClose={() => setAsk(null)} />}</AnimatePresence>

      <style>{`
        @keyframes term-scan { from { top: -4px; } to { top: 100vh; } }
        @keyframes term-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes term-think { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes term-caret { 50%{opacity:0} }
        @media (prefers-reduced-motion:reduce) { * { animation-duration: 0.01ms !important; } }
        ::placeholder { color: rgba(16,185,129,0.25); font-family: ${MONO}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.2); }
      `}</style>
    </div>
  );
}

// ─── KPI cell ─────────────────────────────────────────────────────────────────
function KpiCell({ label, value, suffix, delay }: { label: string; value: number; suffix: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now(); const dur = 1000;
    const step = (ts: number) => {
      const p = Math.min(1, (ts - t0) / dur);
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.div ref={ref}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay }}
      style={{ padding: "16px 20px", cursor: "default", transition: "background 0.18s",
        background: hov ? "rgba(16,185,129,0.1)" : "transparent",
        borderRight: "1px solid rgba(16,185,129,0.15)" }}>
      <div style={{ fontSize: 9, color: "rgba(16,185,129,0.45)", letterSpacing: "0.14em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {v}{suffix}
      </div>
    </motion.div>
  );
}

// ─── CEO row ──────────────────────────────────────────────────────────────────
function CeoRow({ a, tick, onAsk, onMeet, reduce, booted }: {
  a: AgentFull; tick: number; onAsk: () => void; onMeet: () => void; reduce: boolean; booted: boolean;
}) {
  const mt = metrics(a.slug);
  const [hov, setHov] = useState(false);
  const act = (ACT[a.slug] ?? ["Работает над задачей"])[tick % 3];

  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onAsk}
      style={{ position: "relative", cursor: "pointer", overflow: "hidden",
        border: "1px solid rgba(16,185,129,0.3)",
        background: hov ? "rgba(16,185,129,0.07)" : "rgba(16,185,129,0.03)",
        transition: "background 0.18s, border-color 0.18s",
        ...(hov ? { borderColor: "rgba(16,185,129,0.55)" } : {}) }}>

      {/* Top accent bar */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6) 40%, rgba(251,191,36,0.4) 70%, transparent)" }} />

      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px",
        borderBottom: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.04)" }}>
        <span style={{ fontSize: 9, color: "rgba(16,185,129,0.5)", letterSpacing: "0.14em" }}>PID:{pid(a.slug)}</span>
        <span style={{ fontSize: 9, color: "#fbbf24", letterSpacing: "0.12em" }}>USER:ROOT</span>
        <span style={{ fontSize: 9, color: "rgba(16,185,129,0.5)" }}>DEPT:LEADERSHIP</span>
        <div style={{ flex: 1 }} />
        <Crown size={10} style={{ color: "#fbbf24" }} />
        <span style={{ fontSize: 9, color: "#fbbf24", letterSpacing: "0.1em" }}>CHIEF EXECUTIVE</span>
      </div>

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 16px", flexWrap: "wrap" }}>

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <motion.div
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid rgba(251,191,36,0.5)", background: "rgba(16,185,129,0.08)",
              fontSize: 18, fontWeight: 800, color: "#10b981", letterSpacing: "0.04em",
              boxShadow: "0 0 24px rgba(16,185,129,0.15), inset 0 0 12px rgba(16,185,129,0.05)" }}>
            {a.ab}
          </motion.div>
          {/* Status dot */}
          <span style={{ position: "absolute", bottom: 2, right: 2, width: 8, height: 8, borderRadius: "50%",
            background: "#10b981", border: "2px solid #020507", animation: "term-blink 2s ease-in-out infinite" }} />
        </div>

        {/* Core info */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#a7f3d0", letterSpacing: "0.02em", marginBottom: 3 }}>{a.name}</div>
          <div style={{ fontSize: 11, color: "rgba(16,185,129,0.55)", marginBottom: 10 }}>{a.specialty}</div>

          {/* Live status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ display: "inline-flex", gap: 3 }}>
              {[0,1,2].map(d => (
                <span key={d} style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "#10b981",
                  animation: `term-think 1.1s ease-in-out ${d * 0.2}s infinite` }} />
              ))}
            </span>
            <AnimatePresence mode="wait">
              <motion.span key={act}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.22 }}
                style={{ fontSize: 11, color: "rgba(16,185,129,0.75)" }}>
                {`> ${act}`}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Metrics row */}
          <div style={{ display: "flex", gap: 20, fontSize: 11, color: "rgba(16,185,129,0.5)", fontVariantNumeric: "tabular-nums" }}>
            <span>TASKS:<b style={{ color: "#10b981" }}>{mt.done}</b></span>
            <span>SUCCESS:<b style={{ color: "#10b981" }}>{mt.success}%</b></span>
            <span>STREAK:<b style={{ color: "#10b981" }}>{mt.streak}d</b></span>
            <span>CONF:<b style={{ color: "#fbbf24" }}>{a.confidence}%</b></span>
          </div>
        </div>

        {/* Load + actions */}
        <div style={{ flexShrink: 0, minWidth: 220 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: "rgba(16,185,129,0.4)", letterSpacing: "0.1em", marginBottom: 4 }}>
              CPU_LOAD  {mt.load}%
            </div>
            <div style={{ fontSize: 11, color: "#10b981", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
              [{loadBar(mt.load)}] {mt.load}%
            </div>
          </div>

          {/* Boot sequence text */}
          {booted && (
            <div style={{ fontSize: 9, color: "rgba(16,185,129,0.3)", marginBottom: 14, lineHeight: 1.7 }}>
              <div>STATUS: [<span style={{ color: "#10b981" }}>ACTIVE</span>]</div>
              <div>UPTIME: 99.97% · SLA: GUARANTEED</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={e => { e.stopPropagation(); onAsk(); }}
              style={{ height: 34, padding: "0 14px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: MONO, letterSpacing: "0.1em",
                color: "#10b981", background: "transparent", border: "1px solid rgba(16,185,129,0.4)",
                transition: "all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(16,185,129,0.12)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.7)"; }}
              onMouseOut={e  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}>
              [ASK]
            </button>
            <button onClick={e => { e.stopPropagation(); onMeet(); }}
              style={{ height: 34, padding: "0 14px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: MONO, letterSpacing: "0.1em",
                color: "#020507", background: "#10b981", border: "1px solid #10b981",
                transition: "all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.background = "#34d399"; e.currentTarget.style.borderColor = "#34d399"; }}
              onMouseOut={e  => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.borderColor = "#10b981"; }}>
              [MEETING · ALL {TEAM.length - 1}]
            </button>
          </div>
        </div>
      </div>

      {/* Bottom border accent */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)" }} />
    </motion.div>
  );
}

// ─── Director row ─────────────────────────────────────────────────────────────
function DirectorRow({ a, teamCount, tick, delay, onAsk, onMeet, reduce }: {
  a: AgentFull; teamCount: number; tick: number; delay: number; onAsk: () => void; onMeet: () => void; reduce: boolean;
}) {
  const mt = metrics(a.slug);
  const [hov, setHov] = useState(false);
  const act = (ACT[a.slug] ?? ["Работает над задачей"])[tick % 3];

  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onAsk}
      initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, ease: EASE, delay }}
      style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer",
        border: "1px solid rgba(16,185,129,0.18)",
        background: hov ? "rgba(16,185,129,0.07)" : "rgba(16,185,129,0.025)",
        transition: "background 0.18s, border-color 0.18s",
        ...(hov ? { borderColor: "rgba(16,185,129,0.4)" } : {}),
        flexWrap: "wrap" }}>

      {/* Left accent bar with color */}
      <div style={{ width: 3, alignSelf: "stretch", background: a.c, flexShrink: 0, minHeight: 72 }} />

      {/* Avatar cell */}
      <div style={{ padding: "14px 16px", borderRight: "1px solid rgba(16,185,129,0.1)", flexShrink: 0 }}>
        <motion.div
          animate={reduce ? undefined : { y: [0, -2, 0] }}
          transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
          style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${a.c}60`, background: `${a.c}12`,
            fontSize: 13, fontWeight: 700, color: a.c, letterSpacing: "0.04em" }}>
          {a.ab}
        </motion.div>
      </div>

      {/* Name + activity */}
      <div style={{ flex: 1, padding: "14px 16px", minWidth: 200, borderRight: "1px solid rgba(16,185,129,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e5e7eb", letterSpacing: "0.02em" }}>{a.name}</span>
          <span style={{ fontSize: 8, color: a.c, border: `1px solid ${a.c}44`, padding: "1px 6px", letterSpacing: "0.1em" }}>DIR</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(16,185,129,0.5)", marginBottom: 8 }}>{a.specialty}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex", gap: 3 }}>
            {mt.working ? [0,1,2].map(d => (
              <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: "#10b981",
                animation: `term-think 1.1s ease-in-out ${d * 0.18}s infinite` }} />
            )) : <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>○</span>}
          </span>
          <AnimatePresence mode="wait">
            <motion.span key={act}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: 10, color: "rgba(16,185,129,0.6)" }}>
              {`> ${act}`}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Metrics cells */}
      {[
        { k: "PID",    v: pid(a.slug) },
        { k: "TASKS",  v: String(mt.done) },
        { k: "SUCC",   v: `${mt.success}%` },
        { k: "TEAM",   v: String(teamCount) },
      ].map(({ k, v }) => (
        <div key={k} style={{ padding: "14px 16px", borderRight: "1px solid rgba(16,185,129,0.08)", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "rgba(16,185,129,0.4)", letterSpacing: "0.12em", marginBottom: 4 }}>{k}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>{v}</div>
        </div>
      ))}

      {/* Load */}
      <div style={{ padding: "14px 16px", flexShrink: 0, minWidth: 140, borderRight: "1px solid rgba(16,185,129,0.08)" }}>
        <div style={{ fontSize: 9, color: "rgba(16,185,129,0.4)", letterSpacing: "0.12em", marginBottom: 6 }}>CPU_LOAD</div>
        <div style={{ fontSize: 9, color: "#10b981", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          [{loadBar(mt.load).slice(0, 8)}] {mt.load}%
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={e => { e.stopPropagation(); onAsk(); }}
          style={{ height: 30, padding: "0 10px", fontSize: 9, fontWeight: 700, cursor: "pointer",
            fontFamily: MONO, letterSpacing: "0.1em",
            color: "#10b981", background: "transparent", border: "1px solid rgba(16,185,129,0.35)",
            transition: "all 0.14s" }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; }}
          onMouseOut={e  => { e.currentTarget.style.background = "transparent"; }}>
          [ASK]
        </button>
        <button onClick={e => { e.stopPropagation(); onMeet(); }}
          style={{ height: 30, padding: "0 10px", fontSize: 9, fontWeight: 700, cursor: "pointer",
            fontFamily: MONO, letterSpacing: "0.1em",
            color: "#020507", background: a.c, border: `1px solid ${a.c}`,
            transition: "all 0.14s" }}
          onMouseOver={e => { e.currentTarget.style.opacity = "0.8"; }}
          onMouseOut={e  => { e.currentTarget.style.opacity = "1"; }}>
          [MTG·{teamCount}]
        </button>
      </div>
    </motion.div>
  );
}

// ─── Agent table row ──────────────────────────────────────────────────────────
function AgentRow({ a, tick, delay, onAsk, isLast }: {
  a: AgentFull; tick: number; delay: number; onAsk: () => void; isLast: boolean;
}) {
  const mt = metrics(a.slug);
  const [hov, setHov] = useState(false);
  const act = (ACT[a.slug] ?? ["Обрабатывает задачу"])[tick % 3];

  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onAsk}
      initial={{ opacity: 0, x: -4 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, ease: EASE, delay }}
      style={{ display: "grid", gridTemplateColumns: "80px 1fr 200px 60px 60px 60px 80px",
        alignItems: "center", padding: "9px 16px", cursor: "pointer",
        borderBottom: isLast ? "none" : "1px solid rgba(16,185,129,0.07)",
        background: hov ? "rgba(16,185,129,0.05)" : "transparent",
        transition: "background 0.14s" }}>

      {/* PID */}
      <span style={{ fontSize: 9, color: "rgba(16,185,129,0.35)", fontVariantNumeric: "tabular-nums" }}>{pid(a.slug)}</span>

      {/* Name */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: hov ? "#a7f3d0" : "#e5e7eb", marginBottom: 1, transition: "color 0.14s" }}>{a.name}</div>
        <div style={{ fontSize: 9, color: "rgba(16,185,129,0.4)", letterSpacing: "0.06em" }}>{a.role}</div>
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {mt.working
          ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", flexShrink: 0, animation: "term-blink 2s ease-in-out infinite" }} />
          : <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />}
        <AnimatePresence mode="wait">
          <motion.span key={act}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ fontSize: 9, color: mt.working ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.25)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {mt.working ? act : "idle"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Metrics */}
      <span style={{ fontSize: 11, color: "#10b981", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{mt.done}</span>
      <span style={{ fontSize: 11, color: "#10b981", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{mt.success}</span>
      <span style={{ fontSize: 11, color: a.c, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{a.confidence}</span>

      {/* CMD */}
      <div style={{ textAlign: "right" }}>
        <button onClick={e => { e.stopPropagation(); onAsk(); }}
          style={{ height: 24, padding: "0 8px", fontSize: 9, fontWeight: 700, cursor: "pointer",
            fontFamily: MONO, letterSpacing: "0.08em",
            color: "#10b981", background: "transparent", border: "1px solid rgba(16,185,129,0.3)",
            transition: "all 0.12s" }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"; }}
          onMouseOut={e  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; }}>
          [ASK]
        </button>
      </div>
    </motion.div>
  );
}

// ─── Ask modal ────────────────────────────────────────────────────────────────
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
      const fb = FB[agent.slug] ?? "Готов помочь — опишите задачу подробнее. Живой анализ доступен после настройки ANTHROPIC_API_KEY.";
      for (const ch of fb) { setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); }
    }
    setBusy(false);
  }, [q, busy, agent]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(2,5,7,0.88)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: MONO }}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.22, ease: EASE }}
        style={{ position: "relative", width: "min(580px, 100%)", maxHeight: "86vh", overflowY: "auto",
          background: "#030609", border: "1px solid rgba(16,185,129,0.35)",
          boxShadow: "0 0 0 1px rgba(16,185,129,0.08), 0 32px 80px rgba(0,0,0,0.7)" }}>

        {/* Title bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          borderBottom: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.04)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "term-blink 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, color: "rgba(16,185,129,0.6)", letterSpacing: "0.12em", flex: 1 }}>
            apex@board:~$ exec --agent={agent.slug} --mode=interactive
          </span>
          <button onClick={onClose}
            style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1px solid rgba(16,185,129,0.2)", color: "rgba(16,185,129,0.5)", cursor: "pointer",
              transition: "all 0.14s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"; e.currentTarget.style.color = "#10b981"; }}
            onMouseOut={e  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.2)"; e.currentTarget.style.color = "rgba(16,185,129,0.5)"; }}>
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: "20px 20px 24px" }}>

          {/* Agent header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
            padding: "14px 16px", border: `1px solid ${agent.c}30`, background: `${agent.c}08` }}>
            <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${agent.c}55`, background: `${agent.c}12`,
              fontSize: 14, fontWeight: 700, color: agent.c, flexShrink: 0 }}>
              {agent.ab}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#a7f3d0", letterSpacing: "0.04em", marginBottom: 2 }}>{agent.name}</div>
              <div style={{ fontSize: 10, color: "rgba(16,185,129,0.5)" }}>{agent.specialty}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "rgba(16,185,129,0.4)", marginBottom: 2 }}>CONF</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: agent.c, fontVariantNumeric: "tabular-nums" }}>{agent.confidence}%</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, border: "1px solid rgba(16,185,129,0.15)" }}>
            {[
              { k: "TASKS_DONE", v: String(mt.done) },
              { k: "SUCCESS_RT", v: `${mt.success}%` },
              { k: "AI_CONF",    v: `${agent.confidence}%` },
            ].map(({ k, v }, i) => (
              <div key={k} style={{ flex: 1, padding: "10px 14px", textAlign: "center",
                borderRight: i < 2 ? "1px solid rgba(16,185,129,0.1)" : "none" }}>
                <div style={{ fontSize: 8, color: "rgba(16,185,129,0.4)", letterSpacing: "0.14em", marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ marginBottom: 4, fontSize: 10, color: "rgba(16,185,129,0.4)" }}>
            {`> input.query`}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
            <input
              autoFocus value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void submit(); }}
              disabled={busy}
              placeholder={`Спросить ${agent.name.split(" ")[0]}…`}
              style={{ flex: 1, minWidth: 0, height: 44, padding: "0 14px",
                background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.25)",
                color: "#a7f3d0", fontSize: 13, outline: "none", fontFamily: MONO,
                transition: "border-color 0.15s" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; }}
            />
            <button onClick={() => void submit()} disabled={busy || !q.trim()}
              style={{ flexShrink: 0, width: 44, height: 44, border: "none", cursor: busy || !q.trim() ? "not-allowed" : "pointer",
                background: busy || !q.trim() ? "rgba(16,185,129,0.2)" : "#10b981", color: "#020507",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: MONO, fontWeight: 700, fontSize: 12, transition: "all 0.15s" }}>
              {busy
                ? <span style={{ display: "inline-flex", gap: 3 }}>
                    {[0,1,2].map(d => <span key={d} style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "#10b981", animation: `term-think 1s ease-in-out ${d*0.15}s infinite` }} />)}
                  </span>
                : <CornerDownLeft size={15} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Answer */}
          <AnimatePresence>
            {(answer || busy) && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ marginTop: 16, padding: "16px", border: `1px solid ${agent.c}25`,
                  background: "rgba(16,185,129,0.02)" }}>
                <div style={{ fontSize: 9, color: "rgba(16,185,129,0.45)", letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={9} style={{ color: "#10b981" }} />
                  {agent.name.toUpperCase()} · OUTPUT STREAM
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.75, color: "rgba(167,243,208,0.85)", margin: 0, whiteSpace: "pre-wrap" }}>
                  {answer}
                  {busy && <span style={{ display: "inline-block", width: 6, height: 13, marginLeft: 2,
                    background: "#10b981", verticalAlign: "text-bottom", animation: "term-caret 1s step-end infinite" }} />}
                </p>
                {offline && !busy && (
                  <div style={{ marginTop: 10, fontSize: 9, color: "rgba(251,191,36,0.6)", letterSpacing: "0.1em" }}>
                    [DEMO] · set ANTHROPIC_API_KEY для живого AI
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
