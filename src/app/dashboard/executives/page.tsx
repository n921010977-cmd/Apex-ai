"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import {
  CornerDownLeft, X, Crown, Trophy, TrendingUp, Flame,
  MessageSquare, MessagesSquare, Users, Search, Zap,
  Activity, BarChart2, CheckCircle, Star,
} from "lucide-react";
import { streamChat } from "@/lib/stream-chat";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Профили агентов ──────────────────────────────────────────────────────────
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

const DEPT_LABELS: Record<string, string> = {
  leadership: "Leadership",
  finance:    "Finance",
  marketing:  "Marketing",
  operations: "Operations",
  tech:       "Technology",
  product:    "Product",
};

const FB: Record<string, string> = {
  cfo: "С финансовой стороны: считаю юнит-экономику. Если LTV/CAC ниже 3 — сначала чиним экономику. Пилот с лимитом бюджета и пересмотром через 30 дней.",
  cmo: "С точки зрения роста: спрос проверяем дешёвым тестом — лендинг и два канала, решение по данным конверсии.",
  cto: "Технически реализуемо: закладываю 2–3 недели на MVP, начинаем с самого узкого сценария.",
  coo: "По операциям: до запуска нужны владелец процесса, SLA и чек-лист.",
};

function hashOf(s: string): number {
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h);
}
function metrics(slug: string) {
  const h = hashOf(slug);
  return { done: 24 + (h % 76), success: 88 + (h % 11), streak: 3 + (h % 12), working: h % 10 < 7, load: 35 + (h % 58) };
}
function spark(seed: string): number[] {
  let h = hashOf(seed) % 1000;
  const out: number[] = []; let v = 30 + (h % 20);
  for (let i = 0; i < 9; i++) { v += ((h >> i) % 7) - 2 + i; out.push(Math.max(8, Math.min(96, v))); }
  return out;
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
  const router = useRouter();
  const [ask,    setAsk]    = useState<AgentFull | null>(null);
  const [tick,   setTick]   = useState(0);
  const [search, setSearch] = useState("");
  const [dept,   setDept]   = useState<string>("all");
  const reduce = useReducedMotion();

  const goMeeting = useCallback((slug: string) => {
    router.push(`/dashboard/chat/local-${Date.now()}?agent=${slug}`);
  }, [router]);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick(x => x + 1), 3600);
    return () => clearInterval(t);
  }, [reduce]);

  const ceo  = byslug("ceo");
  const dirs  = C_LEVEL.filter(m => m.slug !== "ceo");

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
    <div style={{ background: "#05060A", minHeight: "100%", position: "relative", overflow: "hidden" }}>

      {/* Ambient */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 1000, height: 600, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.11), transparent 70%)" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px 80px", position: "relative" }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 13px", borderRadius: 999,
              background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", animation: "ep-pulse 1.8s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.14em" }}>СОВЕТ РАБОТАЕТ · LIVE</span>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Исполнительный совет
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 560 }}>
            {TEAM.length} AI-агентов вашей компании — кто чем занят прямо сейчас, метрики и прямой доступ к каждому директору.
          </p>
        </motion.div>

        {/* ── KPI bar ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 36 }}>
          {[
            { icon: Users,     label: "Агентов в совете",    value: TEAM.length,               suffix: "",  color: "#818cf8" },
            { icon: Activity,  label: "Работают сейчас",      value: TOTALS.working,            suffix: "",  color: "#10b981" },
            { icon: CheckCircle,label:"Задач закрыто · месяц",value: TOTALS.done,               suffix: "",  color: "#f59e0b" },
            { icon: Star,      label: "Средняя успешность",   value: Math.round(TOTALS.success),suffix: "%", color: "#0ea5e9" },
          ].map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.05} />)}
        </motion.div>

        {/* ── CEO Card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
          style={{ marginBottom: 40 }}>
          <SectionDivider icon={<Crown size={11} />} label="ГЛАВНЫЙ ДИРЕКТОР" />
          <CeoCard a={ceo} tick={tick} onAsk={() => setAsk(ceo)} onMeet={() => goMeeting("ceo")} reduce={!!reduce} />
        </motion.div>

        {/* ── Search + Filter ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск агентов…"
              style={{ width: "100%", height: 40, paddingLeft: 36, paddingRight: 14, borderRadius: 11,
                background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)",
                color: "#E5E7EB", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.09)"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          {/* Dept filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {depts.map(d => (
              <button key={d} onClick={() => setDept(d)}
                style={{ height: 34, padding: "0 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                  ...(dept === d
                    ? { background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" }
                    : { background: "rgba(255,255,255,0.035)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" })
                }}>
                {d === "all" ? "Все отделы" : DEPT_LABELS[d] ?? d}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Departments ── */}
        <AnimatePresence mode="wait">
          <motion.div key={dept + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {filteredDirs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                Агенты не найдены
              </div>
            ) : filteredDirs.map((d, di) => {
              const director = byslug(d.slug);
              const team = reportsOf(d.slug).filter(m => m.tier === "specialist").map(m => byslug(m.slug))
                .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.specialty.toLowerCase().includes(search.toLowerCase()) || director.name.toLowerCase().includes(search.toLowerCase()));

              if (dept !== "all" && team.length === 0 && !director.name.toLowerCase().includes(search.toLowerCase())) return null;

              return (
                <motion.div key={d.slug} style={{ marginBottom: 40 }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE, delay: di * 0.06 }}>

                  <SectionDivider
                    icon={<Users size={11} />}
                    label={`ОТДЕЛ ${director.role} · ${team.length + 1} УЧАСТНИКОВ`}
                    color={director.c}
                  />

                  {/* Director row */}
                  <DirectorCard
                    a={director} teamCount={team.length} tick={tick} delay={di * 0.04}
                    onAsk={() => setAsk(director)} onMeet={() => goMeeting(director.slug)} reduce={!!reduce}
                  />

                  {/* Specialist grid */}
                  {team.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
                      {team.map((a, i) => (
                        <AgentCard key={a.slug} a={a} lead={director} tick={tick} delay={di * 0.04 + (i + 1) * 0.05} onAsk={() => setAsk(a)} reduce={!!reduce} />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>{ask && <AskModal agent={ask} onClose={() => setAsk(null)} />}</AnimatePresence>

      <style>{`
        @keyframes ep-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.6)} }
        @keyframes ep-think { 0%,100%{opacity:.25;transform:translateY(0)} 50%{opacity:1;transform:translateY(-2.5px)} }
        @keyframes ep-caret { 50%{opacity:0} }
        @media (max-width: 700px) { }
        @media (prefers-reduced-motion:reduce) { [style*="animation"] { animation: none !important; } }
        ::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ icon, label, color = "rgba(99,102,241,0.8)" }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 7,
        color, background: `${color}18`, border: `1px solid ${color}44`, flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.15em", color: "rgba(255,255,255,0.38)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }} />
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, suffix, color, delay }: {
  icon: React.ElementType; label: string; value: number; suffix: string; color: string; delay: number;
}) {
  const ref  = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let raf = 0; const t0 = performance.now(); const dur = 1200;
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
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      style={{ padding: "18px 20px", borderRadius: 16, cursor: "default", transition: "all 0.22s",
        background: hov ? `${color}0f` : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? `${color}40` : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}18` : "0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        transform: hov ? "translateY(-3px)" : "translateY(0)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}18`, border: `1px solid ${color}30`, transition: "transform 0.22s", transform: hov ? "scale(1.1)" : "scale(1)" }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {v}{suffix}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 5 }}>{label}</div>
    </motion.div>
  );
}

// ─── CEO Card ─────────────────────────────────────────────────────────────────
function CeoCard({ a, tick, onAsk, onMeet, reduce }: { a: AgentFull; tick: number; onAsk: () => void; onMeet: () => void; reduce: boolean }) {
  const mt = metrics(a.slug);
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -4 : 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{ position: "relative", overflow: "hidden", borderRadius: 22, cursor: "pointer",
        background: `linear-gradient(145deg, rgba(99,102,241,0.14), rgba(255,255,255,0.025) 65%)`,
        border: `1px solid ${hov ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.28)"}`,
        boxShadow: hov
          ? "0 28px 72px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 16px 48px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: "border-color 0.25s, box-shadow 0.25s" }}
      onClick={onAsk}
    >
      {/* Glow orb */}
      <div aria-hidden style={{ position: "absolute", top: -60, left: -40, width: 280, height: 280, pointerEvents: "none",
        background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)", borderRadius: "50%" }} />
      {/* Gold shimmer top border */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5) 30%, rgba(99,102,241,0.6) 60%, transparent)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "28px 30px", flexWrap: "wrap" }}>

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <motion.div
            animate={reduce ? undefined : { y: [0, -5, 0] }}
            transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 88, height: 88, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
              color: "#fff", fontSize: 26, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace",
              boxShadow: "0 16px 44px rgba(99,102,241,0.45), inset 0 2px 0 rgba(255,255,255,0.25)" }}>
            {a.ab}
          </motion.div>
          {/* Crown */}
          <div style={{ position: "absolute", top: -10, right: -10, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#fbbf24,#d97706)", border: "2px solid #05060A",
            boxShadow: "0 4px 14px rgba(245,158,11,0.5)", color: "#0b0800" }}>
            <Crown size={12} strokeWidth={2.5} />
          </div>
        </div>

        {/* Center info */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{a.name}</span>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
              padding: "3px 9px", borderRadius: 7, color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.08)" }}>
              ГЛАВНЫЙ
            </span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>{a.title} · {a.specialty}</div>
          <LiveActivity slug={a.slug} tick={tick} working color={a.c} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {[
              { icon: Trophy,    label: `${mt.done} задач закрыто` },
              { icon: TrendingUp,label: `${mt.success}% успешных` },
              { icon: Flame,     label: `Серия ${mt.streak} дней` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600,
                color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 9, padding: "5px 10px" }}>
                <Icon size={10} style={{ color: "#f59e0b", flexShrink: 0 }} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: confidence + actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: a.c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{a.confidence}%</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Уверенность AI</div>
          </div>
          <Sparkline color={a.c} data={spark(a.slug)} />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={e => { e.stopPropagation(); onAsk(); }}
              style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                color: a.c, background: `${a.c}14`, border: `1px solid ${a.c}44`,
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.18s" }}
              onMouseOver={e => { e.currentTarget.style.background = `${a.c}22`; }}
              onMouseOut={e  => { e.currentTarget.style.background = `${a.c}14`; }}>
              <MessageSquare size={11} /> Спросить
            </button>
            <button onClick={e => { e.stopPropagation(); onMeet(); }}
              style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                color: "#fff", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                transition: "all 0.18s" }}
              onMouseOver={e => { e.currentTarget.style.filter = "brightness(1.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={e  => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <MessagesSquare size={11} /> Совещание · все {TEAM.length - 1} агентов
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Director card ────────────────────────────────────────────────────────────
function DirectorCard({ a, teamCount, tick, delay, onAsk, onMeet, reduce }: {
  a: AgentFull; teamCount: number; tick: number; delay: number; onAsk: () => void; onMeet: () => void; reduce: boolean;
}) {
  const mt = metrics(a.slug);
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -4 : 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      onClick={onAsk}
      style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 20, padding: "20px 24px", borderRadius: 18, cursor: "pointer",
        background: hov ? `linear-gradient(145deg, ${a.c}18, rgba(255,255,255,0.04) 65%)` : `linear-gradient(145deg, ${a.c}0e, rgba(255,255,255,0.025) 65%)`,
        border: `1px solid ${hov ? `${a.c}55` : `${a.c}30`}`,
        boxShadow: hov ? `0 16px 44px rgba(0,0,0,0.3), 0 0 0 1px ${a.c}18, inset 0 1px 0 rgba(255,255,255,0.07)` : "0 8px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "all 0.25s", flexWrap: "wrap" }}>
      {/* Glow */}
      {hov && <div aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", pointerEvents: "none",
        background: `radial-gradient(circle, ${a.c}22, transparent 70%)` }} />}

      {/* Avatar */}
      <motion.div
        animate={reduce ? undefined : { y: [0, -3, 0] }}
        transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
        style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
          color: "#fff", fontSize: 16, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace",
          boxShadow: `0 8px 24px ${a.c}44, inset 0 1px 0 rgba(255,255,255,0.25)` }}>
        {a.ab}
      </motion.div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{a.name}</span>
          <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 8.5, fontWeight: 800, letterSpacing: "0.12em",
            padding: "2px 8px", borderRadius: 6, color: a.c, border: `1px solid ${a.c}55`, background: `${a.c}12` }}>ДИРЕКТОР</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>{a.title} · {a.specialty}</div>
        <LiveActivity slug={a.slug} tick={tick} working={mt.working} color={a.c} />
        <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          <span><b style={{ color: a.c, fontVariantNumeric: "tabular-nums" }}>{mt.done}</b> задач</span>
          <span><b style={{ color: a.c }}>{mt.success}%</b> успех</span>
          <span><b style={{ color: a.c }}>{teamCount}</b> в команде</span>
        </div>
      </div>

      {/* Load bar + actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", flexShrink: 0, minWidth: 180 }}>
        <div style={{ width: "100%", textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Загрузка</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums" }}>{mt.load}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }}
              transition={{ duration: 1.1, ease: EASE, delay: delay + 0.2 }}
              style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${a.g[0]}, ${a.g[1]})` }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={e => { e.stopPropagation(); onAsk(); }}
            style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
              color: a.c, background: `${a.c}12`, border: `1px solid ${a.c}44`,
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.16s" }}
            onMouseOver={e => { e.currentTarget.style.background = `${a.c}20`; }}
            onMouseOut={e  => { e.currentTarget.style.background = `${a.c}12`; }}>
            <MessageSquare size={10} /> Спросить
          </button>
          <button onClick={e => { e.stopPropagation(); onMeet(); }}
            style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
              color: "#fff", background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`, border: "none",
              display: "flex", alignItems: "center", gap: 5,
              boxShadow: `0 3px 12px ${a.c}40, inset 0 1px 0 rgba(255,255,255,0.18)`,
              transition: "all 0.16s" }}
            onMouseOver={e => { e.currentTarget.style.filter = "brightness(1.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e  => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            <MessagesSquare size={10} /> Совещание · {teamCount}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Specialist card ──────────────────────────────────────────────────────────
function AgentCard({ a, lead, tick, delay, onAsk, reduce }: {
  a: AgentFull; lead: AgentFull; tick: number; delay: number; onAsk: () => void; reduce: boolean;
}) {
  const mt  = metrics(a.slug);
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -5 : 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      onClick={onAsk}
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }}
      style={{ padding: "16px", borderRadius: 16, cursor: "pointer",
        background: hov ? `${a.c}0d` : `${a.c}08`,
        border: `1px solid ${hov ? `${a.c}45` : `${a.c}22`}`,
        boxShadow: hov ? `0 12px 36px rgba(0,0,0,0.28), 0 0 0 1px ${a.c}15, inset 0 1px 0 rgba(255,255,255,0.06)` : "0 4px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "all 0.22s", position: "relative", overflow: "hidden" }}>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <motion.div
          animate={reduce || !mt.working ? undefined : { y: [0, -2.5, 0] }}
          transition={reduce ? undefined : { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay }}
          style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
            color: "#fff", fontSize: 12, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace",
            boxShadow: `0 6px 18px ${a.c}40, inset 0 1px 0 rgba(255,255,255,0.24)` }}>
          {a.ab}
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", marginBottom: 1 }}>{a.name}</div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: a.c, letterSpacing: "0.06em" }}>{a.role}</div>
        </div>
        {/* Reports-to badge */}
        <div style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700,
          color: lead.c, border: `1px solid ${lead.c}44`, background: `${lead.c}12`, fontFamily: "var(--font-geist-mono), monospace",
          letterSpacing: "0.08em" }}>
          → {lead.role}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{a.specialty}</div>
      <LiveActivity slug={a.slug} tick={tick} working={mt.working} color={a.c} />

      {/* Metrics */}
      <div style={{ display: "flex", gap: 0, marginTop: 12, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { v: mt.done,        l: "задач" },
          { v: `${mt.success}%`, l: "успех" },
          { v: `${a.confidence}%`, l: "AI" },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, padding: "8px 0", textAlign: "center",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            background: "rgba(255,255,255,0.015)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Load bar */}
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE, delay: delay + 0.1 }}
            style={{ height: "100%", borderRadius: 2, background: a.c }} />
        </div>
      </div>

      {/* Hover CTA */}
      <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 11, fontWeight: 700, color: a.c }}>
            <MessageSquare size={11} /> Спросить {a.name.split(" ")[0]}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Live activity strip ──────────────────────────────────────────────────────
function LiveActivity({ slug, tick, working, color }: { slug: string; tick: number; working: boolean; color: string }) {
  const list = ACT[slug] ?? ["Работает над задачей"];
  const text = working ? list[tick % list.length] : "Ожидает задачу";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, minHeight: 16 }}>
      {working ? (
        <span style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}>
          {[0,1,2].map(d => (
            <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: color, animation: `ep-think 1.2s ease-in-out ${d * 0.18}s infinite` }} />
          ))}
        </span>
      ) : (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      )}
      <AnimatePresence mode="wait">
        <motion.span key={text} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.28, ease: EASE }}
          style={{ fontSize: 11.5, color: working ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.28)", lineHeight: 1.4 }}>
          {working && <span style={{ color, fontWeight: 700, marginRight: 4 }}>сейчас:</span>}
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ color, data }: { color: string; data: number[] }) {
  const W = 72, H = 26, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * W, H - ((d - min) / (max - min || 1)) * (H - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const fill = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={fill} fill={`url(#sg-${color.replace("#","")})`}
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }} />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.5} fill={color} />
    </svg>
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
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,6,10,0.75)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: "min(600px, 100%)", maxHeight: "84vh", overflowY: "auto",
          borderRadius: 22, padding: 28, background: "#0a0c15",
          border: `1px solid ${agent.c}35`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px ${agent.c}20` }}>

        {/* Top color bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "22px 22px 0 0",
          background: `linear-gradient(90deg, transparent, ${agent.c}80, transparent)` }} />

        {/* Close */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", cursor: "pointer",
            transition: "all 0.16s" }}
          onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
          onMouseOut={e  => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
          <X size={15} strokeWidth={2.2} />
        </button>

        {/* Agent header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${agent.g[0]}, ${agent.g[1]})`,
            color: "#fff", fontSize: 17, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace",
            boxShadow: `0 8px 24px ${agent.c}44, inset 0 1px 0 rgba(255,255,255,0.25)`, flexShrink: 0 }}>
            {agent.ab}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{agent.name}</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{agent.title} · {agent.specialty}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { v: mt.done,          l: "Задач закрыто" },
            { v: `${mt.success}%`, l: "Успешность" },
            { v: `${agent.confidence}%`, l: "Уверенность AI" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: agent.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 8, marginBottom: answer || busy ? 0 : undefined }}>
          <input
            autoFocus value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void submit(); }}
            disabled={busy}
            placeholder={`Спросить ${agent.name.split(" ")[0]}…`}
            style={{ flex: 1, minWidth: 0, height: 48, padding: "0 16px", borderRadius: 13, fontSize: 14, color: "#E5E7EB",
              background: "rgba(255,255,255,0.035)", border: `1px solid rgba(255,255,255,0.1)`, outline: "none",
              transition: "border-color 0.18s, box-shadow 0.18s" }}
            onFocus={e => { e.currentTarget.style.borderColor = `${agent.c}66`; e.currentTarget.style.boxShadow = `0 0 0 3px ${agent.c}18`; }}
            onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <button onClick={() => void submit()} disabled={busy || !q.trim()}
            style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 13, border: "none", cursor: busy || !q.trim() ? "not-allowed" : "pointer",
              background: `linear-gradient(135deg, ${agent.g[0]}, ${agent.g[1]})`, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${agent.c}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
              opacity: busy || !q.trim() ? 0.5 : 1, transition: "all 0.16s" }}>
            {busy
              ? <span style={{ display: "inline-flex", gap: 3 }}>
                  {[0,1,2].map(d => <span key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", animation: `ep-think 1s ease-in-out ${d*0.15}s infinite` }} />)}
                </span>
              : <CornerDownLeft size={16} strokeWidth={2.4} />}
          </button>
        </div>

        {/* Answer */}
        <AnimatePresence>
          {(answer || busy) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
              style={{ marginTop: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${agent.c}22`, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: `${agent.c}18`, border: `1px solid ${agent.c}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={10} style={{ color: agent.c }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: agent.c, letterSpacing: "0.1em" }}>{agent.name.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.68, color: "rgba(255,255,255,0.82)", margin: 0, whiteSpace: "pre-wrap" }}>
                {answer}
                {busy && <span style={{ display: "inline-block", width: 7, height: 14, marginLeft: 2, borderRadius: 1, background: agent.c, verticalAlign: "text-bottom", animation: "ep-caret 1s step-end infinite" }} />}
              </p>
              {offline && !busy && (
                <div style={{ marginTop: 10, fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "rgba(251,191,36,0.75)" }}>
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
