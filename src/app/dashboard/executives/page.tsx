"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import {
  CornerDownLeft, X, Crown, Zap, Search, ChevronDown, Check,
  MessageSquare, MessagesSquare, LayoutGrid, List,
  Briefcase, Megaphone, Settings2, Cpu, BarChart2, TrendingUp,
  ShieldAlert, Palette, Rocket, Globe, Radio, Phone, Users,
  Scale, Truck, Database, Package, MousePointer2, GitBranch,
  type LucideIcon,
} from "lucide-react";

// Role icon per director slug (the redesigned agent iconography)
const EXEC_ICON: Record<string, LucideIcon> = {
  ceo: Crown, cfo: Briefcase, cmo: Megaphone, coo: Settings2, cto: Cpu,
  analyst: BarChart2, invest: TrendingUp, risk: ShieldAlert, brand: Palette,
  growth: Rocket, market: Globe, pr: Radio, sales: Phone, hr: Users,
  legal: Scale, supply: Truck, data: Database, product: Package,
  ux: MousePointer2, strategy: GitBranch,
};
import { streamChat } from "@/lib/stream-chat";
import { saveAsk } from "@/lib/ask-history";
import { TEAM, TEAM_BY_SLUG, C_LEVEL, reportsOf, type TeamMember } from "@/lib/team";
import { markVisit } from "@/components/dashboard/EngagementPanel";
import { track, EVENTS } from "@/lib/analytics/events";

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  for (let i = 0; i < 12; i++) { v += ((h >> i) % 7) - 2 + i * 0.5; out.push(Math.max(8, Math.min(96, v))); h = (h * 1103515245 + 12345) & 0x7fffffff; }
  return out;
}

type AgentFull = TeamMember & { specialty: string; confidence: number };
const rich = (slug: string): AgentFull => ({
  ...TEAM_BY_SLUG[slug],
  ...(CHAR[slug] ?? { specialty: TEAM_BY_SLUG[slug]?.title ?? slug, confidence: 90 }),
});

const TOTALS = (() => {
  let done = 0, success = 0, working = 0;
  for (const m of TEAM) { const mt = metrics(m.slug); done += mt.done; success += mt.success; if (mt.working) working++; }
  return { done, avgSuccess: Math.round(success / TEAM.length), working };
})();

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExecutiveCouncilPage() {
  const router  = useRouter();
  const reduce  = useReducedMotion();
  const [ask,   setAsk]   = useState<AgentFull | null>(null);
  const [tick,  setTick]  = useState(0);
  const [view,  setView]  = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [roleFilter,      setRoleFilter]      = useState("Все роли");
  const [statusFilter,    setStatusFilter]    = useState("Все статусы");
  const [expertiseFilter, setExpertiseFilter] = useState("Экспертиза");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
  // The board = only director-titled members (excl. the CEO chairman shown above);
  // analysts/specialists live in AI Agents, not the boardroom.
  const allAgents: AgentFull[] = useMemo(() => {
    return TEAM
      .filter(m => m.slug !== "ceo" && /директор/i.test(TEAM_BY_SLUG[m.slug]?.title ?? ""))
      .map(m => rich(m.slug));
  }, []);

  const visibleAgents = useMemo(() => {
    return allAgents.filter(a => {
      if (query) {
        const q = query.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.specialty.toLowerCase().includes(q) && !a.role.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "Все статусы") {
        const isActive = metrics(a.slug).working;
        if (statusFilter === "Активные" && !isActive) return false;
        if (statusFilter === "Ожидание" && isActive) return false;
      }
      return true;
    });
  }, [allAgents, query, statusFilter]);

  const ceoMt = metrics(ceo.slug);

  return (
    <div style={{ background: BG, minHeight: "100%", position: "relative" }}>
      {/* Ambient */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 1000, height: 340, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08), transparent 70%)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 80px", position: "relative" }}>

        {/* ── Page header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, marginBottom: 28, flexWrap: "wrap" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: "clamp(20px,2.4vw,28px)", fontWeight: 800, color: TP,
                  letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>
                  Executive Council
                </h1>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
                  borderRadius: 999, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981",
                    animation: "ec-pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em" }}>
                    {TOTALS.working} АГЕНТОВ · ONLINE
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: TS, margin: 0 }}>
                {TEAM.length} AI-директоров готовы к работе — прямой доступ, метрики, живые задачи
              </p>
            </div>
          </div>

          {/* Right: filters + view */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", color: TM, pointerEvents: "none" }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Поиск агента…"
                style={{ height: 36, width: 180, paddingLeft: 30, paddingRight: 12, borderRadius: 10,
                  background: SURF, border: `1px solid ${BORD}`, color: TP, fontSize: 12,
                  outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.45)"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = BORD; }} />
            </div>

            {/* Filter dropdowns */}
            {[
              { key: "role",      label: roleFilter,      options: ["Все роли", "C-Level", "Специалист"] },
              { key: "status",    label: statusFilter,    options: ["Все статусы", "Активные", "Ожидание"] },
              { key: "expertise", label: expertiseFilter, options: ["Экспертиза", "Финансы", "Маркетинг", "Технологии", "Операции", "Продукт"] },
            ].map(({ key, label, options }) => (
              <div key={key} style={{ position: "relative" }}>
                <button onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                  style={{ height: 36, padding: "0 12px", borderRadius: 10, border: `1px solid ${BORD}`,
                    background: SURF, color: TS, fontSize: 12, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                    whiteSpace: "nowrap" }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = BORD_H; e.currentTarget.style.color = TP; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor = BORD;   e.currentTarget.style.color = TS; }}>
                  {label}
                  <ChevronDown size={11} style={{ opacity: 0.5, transition: "transform 0.15s",
                    transform: openDropdown === key ? "rotate(180deg)" : "none" }} />
                </button>
                <AnimatePresence>
                  {openDropdown === key && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.13 }}
                      style={{ position: "absolute", top: 42, left: 0, zIndex: 30, minWidth: 160,
                        background: "#0a0c15", border: `1px solid ${BORD_H}`, borderRadius: 12,
                        boxShadow: "0 16px 48px rgba(0,0,0,0.55)", overflow: "hidden" }}>
                      {options.map(opt => (
                        <button key={opt} onClick={() => {
                          if (key === "role")      setRoleFilter(opt);
                          if (key === "status")    setStatusFilter(opt);
                          if (key === "expertise") setExpertiseFilter(opt);
                          setOpenDropdown(null);
                        }}
                          style={{ width: "100%", padding: "9px 14px", border: "none", textAlign: "left",
                            background: label === opt ? "rgba(99,102,241,0.12)" : "transparent",
                            color: label === opt ? "#a5b4fc" : TS, fontSize: 12.5,
                            fontWeight: label === opt ? 600 : 400, cursor: "pointer", transition: "background 0.12s" }}
                          onMouseOver={e => { if (label !== opt) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseOut={e  => { if (label !== opt) e.currentTarget.style.background = "transparent"; }}>
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* View toggle */}
            <div style={{ display: "flex", border: `1px solid ${BORD}`, borderRadius: 10, overflow: "hidden" }}>
              {(["grid", "list"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: view === v ? "rgba(99,102,241,0.18)" : "transparent",
                    color: view === v ? "#a5b4fc" : TM }}>
                  {v === "grid" ? <LayoutGrid size={13} /> : <List size={13} />}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Council deliberation (зал заседаний) ── */}
        <CouncilSession />

        {/* ── CEO hero card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: EASE }}
          style={{ marginBottom: 20 }}>
          <CeoHero a={ceo} mt={ceoMt} tick={tick} reduce={!!reduce}
            onAsk={() => setAsk(ceo)} onMeet={() => goMeet("ceo")} totalAgents={TEAM.length - 1} />
        </motion.div>

        {/* ── Agents grid / list ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.16, duration: 0.4 }}>

          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: TM }}>
              СОВЕТ ДИРЕКТОРОВ · {visibleAgents.length + 1}
            </span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BORD}, transparent)` }} />
          </div>

          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div key="grid"
                initial="hidden" animate="show" exit={{ opacity: 0 }}
                variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                {visibleAgents.map((a) => (
                  <BoardMemberCard key={a.slug} a={a} tick={tick} reduce={!!reduce}
                    onAsk={() => setAsk(a)} onMeet={() => goMeet(a.slug)} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="list"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {visibleAgents.map((a, i) => (
                  <AgentListRow key={a.slug} a={a} tick={tick} delay={i * 0.025}
                    onAsk={() => setAsk(a)} onMeet={() => goMeet(a.slug)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {visibleAgents.length === 0 && (
            <div style={{ padding: "64px 0", textAlign: "center", color: TM, fontSize: 13 }}>
              Ничего не найдено — попробуйте другой запрос
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>{ask && <AskModal agent={ask} onClose={() => setAsk(null)} />}</AnimatePresence>

      {/* Close dropdowns */}
      {openDropdown && (
        <div onClick={() => setOpenDropdown(null)}
          style={{ position: "fixed", inset: 0, zIndex: 20 }} />
      )}

      <style>{`
        @keyframes ec-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.25;transform:scale(0.5)} }
        @keyframes ec-think { 0%,100%{opacity:.2;transform:translateY(0)} 50%{opacity:1;transform:translateY(-2px)} }
        @media (prefers-reduced-motion:reduce) { * { animation-duration:0.01ms!important; transition-duration:0.01ms!important } }
        ::placeholder { color: ${TM}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:2px; }
      `}</style>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({ color, data, w = 80, h = 32 }: { color: string; data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i): [number, number] => [
    (i / (data.length - 1)) * w,
    h - ((d - min) / (max - min || 1)) * (h - 4) - 2,
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const fill = `${line} L${w},${h} L0,${h} Z`;
  const gid  = `sp-${color.replace(/[^a-z0-9]/gi, "")}${w}`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={fill} fill={`url(#${gid})`}
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 0.6 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }} />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.5} fill={color} />
    </svg>
  );
}

// ── Confidence arc ────────────────────────────────────────────────────────────
function ConfArc({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const c = size / 2;
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
        transition={{ duration: 1.3, ease: EASE }}
        transform={`rotate(-90 ${c} ${c})`} />
      <text x={c} y={c + 4} textAnchor="middle" fontSize={size > 50 ? 12 : 10} fontWeight={800} fill={color}
        style={{ fontVariantNumeric: "tabular-nums", fontFamily: "inherit" }}>
        {value}%
      </text>
    </svg>
  );
}

// ── Live activity ─────────────────────────────────────────────────────────────
function LiveAct({ slug, tick, working, color }: { slug: string; tick: number; working: boolean; color: string }) {
  const list = ACT[slug] ?? ["Работает над задачей"];
  const text = working ? list[tick % list.length] : "В ожидании задачи";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, minHeight: 18 }}>
      {working
        ? <span style={{ display: "inline-flex", gap: 2.5, flexShrink: 0, marginTop: 4 }}>
            {[0,1,2].map(d => (
              <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: color,
                animation: `ec-think 1.2s ease-in-out ${d * 0.18}s infinite` }} />
            ))}
          </span>
        : <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.18)",
            flexShrink: 0, marginTop: 4 }} />}
      <AnimatePresence mode="wait">
        <motion.span key={text}
          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ fontSize: 11.5, lineHeight: 1.5, color: working ? TS : TM }}>
          {working && <span style={{ color, fontWeight: 700, marginRight: 3 }}>сейчас:</span>}
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ working }: { working: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 8, fontSize: 9, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.1em",
      background: working ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${working ? "rgba(16,185,129,0.28)" : BORD}`,
      color: working ? "#10b981" : TM, flexShrink: 0 }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
        background: working ? "#10b981" : "rgba(255,255,255,0.2)",
        animation: working ? "ec-pulse 2s ease-in-out infinite" : "none" }} />
      {working ? "ACTIVE" : "IDLE"}
    </div>
  );
}

// ── Council deliberation (зал заседаний) ──────────────────────────────────────
const BOARD_SLUGS = ["ceo", "cfo", "cmo", "coo", "cto"] as const;
const EXAMPLE_QS = [
  "Стоит ли поднять цену на 20%?",
  "Выходить ли на рынок США в этом квартале?",
  "Нанять сейлза или вложить в маркетинг?",
];

type Phase = "idle" | "deliberating" | "verdict" | "done";
type Stance = "for" | "against" | "caution";

const STANCE_META: Record<Stance, { label: string; c: string }> = {
  for:     { label: "ЗА",        c: "#10b981" },
  against: { label: "ПРОТИВ",    c: "#ef4444" },
  caution: { label: "ОСТОРОЖНО", c: "#f59e0b" },
};
// Fallback stances when the API is unavailable (matches the FB texts' tone).
const FB_STANCE: Record<string, Stance> = { ceo: "for", cfo: "caution", cmo: "for", coo: "caution", cto: "caution" };

// Directors are told to open with a [ЗА]/[ПРОТИВ]/[ОСТОРОЖНО] tag; strip it for display.
function parseStance(t: string): { stance: Stance | null; clean: string } {
  const m = t.match(/^\s*\[?\s*(ЗА|ПРОТИВ|ОСТОРОЖНО)\s*\]?[:.\s—–-]*/i);
  if (!m) return { stance: null, clean: t.replace(/\*\*/g, "") };
  const w = m[1].toUpperCase();
  return { stance: w === "ЗА" ? "for" : w === "ПРОТИВ" ? "against" : "caution", clean: t.slice(m[0].length).replace(/\*\*/g, "") };
}

function CouncilSession() {
  const reduce = useReducedMotion();
  const [q, setQ]             = useState("");
  const [followQ, setFollowQ] = useState("");
  const [phase, setPhase]     = useState<Phase>("idle");
  const [asked, setAsked]     = useState("");
  const [speeches, setSpeeches] = useState<Record<string, string>>({});
  const [stances, setStances]   = useState<Record<string, Stance>>({});
  const [current, setCurrent]   = useState<string | null>(null);
  const [spoken, setSpoken]     = useState<string[]>([]);
  const [verdict, setVerdict]   = useState("");
  const prevCtx = useRef("");
  const feedRef = useRef<HTMLDivElement>(null);

  const busy = phase === "deliberating" || phase === "verdict";
  const answered = spoken.length;

  // Keep the protocol feed pinned to the latest speech.
  useEffect(() => {
    if (busy && feedRef.current) feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [speeches, verdict, busy, reduce]);

  const convene = useCallback(async (override?: string, isFollowUp = false) => {
    const question = (override ?? q).trim();
    if (!question || phase === "deliberating" || phase === "verdict") return;
    setQ(question);
    setAsked(question);
    setSpeeches({});
    setStances({});
    setSpoken([]);
    setFollowQ("");
    setVerdict("");
    setPhase("deliberating");
    track(EVENTS.COUNCIL_CONVENED, { follow_up: isFollowUp, directors: BOARD_SLUGS.length });

    // Directors speak in turn, like a real boardroom: each sees what was
    // already said and reacts to it, then casts a stance.
    const results: { slug: string; role: string; name: string; text: string; stance: Stance; color: string }[] = [];
    for (const slug of BOARD_SLUGS) {
      const a = rich(slug);
      setCurrent(slug);
      const heard = results.length
        ? `\n\nУже выступили:\n${results.map(r => `${r.role} [${STANCE_META[r.stance].label}]: ${r.text.slice(0, 220)}`).join("\n")}\nМожешь согласиться или возразить коллегам — по делу.`
        : "";
      const ctx = isFollowUp && prevCtx.current ? `\n\nКонтекст прошлого решения совета: ${prevCtx.current.slice(0, 400)}` : "";
      const persona = `Ты — ${a.name}, ${a.title} (${a.role}) на заседании совета директоров Vertlix. Твоя экспертиза: ${a.specialty}. Начни ответ ровно с одной метки твоей позиции: [ЗА], [ПРОТИВ] или [ОСТОРОЖНО]. Затем 2–3 коротких предложения строго со своей профессиональной позиции, конкретно, без вводных и без markdown.`;
      let raw = "";
      try {
        raw = await streamChat(`${question}${ctx}${heard}`, persona, t => setSpeeches(p => ({ ...p, [slug]: (p[slug] || "") + t })));
      } catch {
        const fb = `[${STANCE_META[FB_STANCE[slug] ?? "caution"].label}] ` + ((slug in FB ? FB[slug as keyof typeof FB] : undefined)
          ?? `Со стороны ${a.role}: нужен более узкий контекст. Базово — проверяем гипотезу дешёвым тестом и решаем по данным.`);
        for (const ch of fb) { raw += ch; setSpeeches(p => ({ ...p, [slug]: (p[slug] || "") + ch })); await new Promise(r => setTimeout(r, 5)); }
      }
      const { stance, clean } = parseStance(raw);
      const st: Stance = stance ?? FB_STANCE[slug] ?? "caution";
      setStances(p => ({ ...p, [slug]: st }));
      setSpoken(p => [...p, slug]);
      results.push({ slug, role: a.role, name: a.name, text: clean, stance: st, color: a.c });
    }
    setCurrent(null);

    // Chair counts the votes and synthesises the collective verdict.
    setPhase("verdict");
    const tally = results.reduce((acc, r) => { acc[r.stance] = (acc[r.stance] ?? 0) + 1; return acc; }, {} as Record<Stance, number>);
    const tallyStr = (Object.keys(STANCE_META) as Stance[]).filter(s => tally[s]).map(s => `${STANCE_META[s].label}: ${tally[s]}`).join(", ");
    const synthPersona = "Ты — председатель совета директоров Vertlix. Синтезируй дебаты в единый вердикт: чёткое решение с опорой на голосование, 1–2 ключевых риска и конкретный следующий шаг. 3–5 деловых предложений, без markdown.";
    const synthMsg = `Вопрос основателя: "${question}"\n\nГолосование: ${tallyStr}\n\nВыступления:\n` +
      results.map(r => `${r.role} [${STANCE_META[r.stance].label}]: ${r.text}`).join("\n\n") + "\n\nДай итоговый вердикт совета.";
    let verdictFull = "";
    try {
      verdictFull = await streamChat(synthMsg, synthPersona, t => setVerdict(prev => prev + t));
    } catch {
      const fb = "Вердикт совета: двигаться, но управляемо. Сначала дешёвый тест гипотезы с чётким критерием успеха и пересмотром через 30 дней. Главный риск — расфокус: держите один сегмент и одну метрику.";
      for (const ch of fb) { verdictFull += ch; setVerdict(prev => prev + ch); await new Promise(r => setTimeout(r, 5)); }
    }
    prevCtx.current = `Вопрос: ${question}. Вердикт: ${verdictFull}`;
    track(EVENTS.COUNCIL_VERDICT, { votes: { for: tally.for ?? 0, against: tally.against ?? 0, caution: tally.caution ?? 0 } });
    setPhase("done");
    // Persist the whole board deliberation to the История page.
    saveAsk({ id: `council-${Date.now()}`, kind: "council", question, date: Date.now(),
      responses: results.map(r => ({ role: `${r.role} · ${STANCE_META[r.stance].label}`, name: r.name, text: r.text, color: r.color })), verdict: verdictFull });
  }, [q, phase]);

  const reset = () => { setPhase("idle"); setAsked(""); setSpeeches({}); setStances({}); setSpoken([]); setCurrent(null); setVerdict(""); setFollowQ(""); prevCtx.current = ""; };

  const tallyChips = (Object.keys(STANCE_META) as Stance[])
    .map(s => ({ s, n: Object.values(stances).filter(v => v === s).length }))
    .filter(x => x.n > 0);

  // Arriving from a strategy page with ?ask=… → prefill and auto-convene the board.
  useEffect(() => {
    const ask = new URLSearchParams(window.location.search).get("ask");
    if (!ask) return;
    setQ(ask);
    const t = setTimeout(() => convene(ask), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{ marginBottom: 20, borderRadius: 22, overflow: "hidden", position: "relative",
        border: "1px solid rgba(99,102,241,0.22)", background: "linear-gradient(160deg, rgba(99,102,241,0.06), rgba(255,255,255,0.02) 60%)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)" }} />

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 6px 18px rgba(99,102,241,0.4)" }}>
          <MessagesSquare size={19} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: TP, letterSpacing: "-0.02em" }}>Зал заседаний совета</div>
          <div style={{ fontSize: 12.5, color: TS, marginTop: 2 }}>Задайте один вопрос — все 5 директоров совещаются и дают вердикт</div>
        </div>
        {phase !== "idle" && (
          <button onClick={reset} disabled={busy}
            style={{ height: 34, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: busy ? "default" : "pointer",
              background: SURF, border: `1px solid ${BORD}`, color: busy ? TM : TS, opacity: busy ? 0.5 : 1 }}>
            Новый вопрос
          </button>
        )}
      </div>

      {/* Input (idle only) */}
      {phase === "idle" && (
        <div style={{ padding: "0 24px 22px" }}>
          {/* Board line-up — the council waiting */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex" }}>
              {BOARD_SLUGS.map((slug, i) => {
                const a = rich(slug);
                const Icon = EXEC_ICON[slug] ?? Crown;
                return (
                  <motion.div key={slug} title={`${a.name} · ${a.role}`}
                    initial={{ opacity: 0, scale: 0.5, x: -8 }} animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 + i * 0.07 }}
                    whileHover={{ y: -4, zIndex: 10 }}
                    style={{ width: 38, height: 38, borderRadius: 12, marginLeft: i ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(140deg, ${a.g[0]}, ${a.g[1]})`, color: "#fff",
                      border: "2px solid #0a0c15", boxShadow: `0 4px 14px ${a.c}44`, position: "relative", zIndex: 5 - i, cursor: "default" }}>
                    <Icon size={16} strokeWidth={1.9} />
                  </motion.div>
                );
              })}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: TP }}>Совет в сборе · 5 директоров</div>
              <div style={{ fontSize: 11, color: TM }}>Готовы совещаться над вашим вопросом</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <textarea value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) convene(); }}
              placeholder="Например: стоит ли привлекать раунд сейчас или расти на выручке?"
              rows={2}
              style={{ flex: 1, minWidth: 260, resize: "none", padding: "12px 14px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.5,
                background: "rgba(255,255,255,0.035)", border: `1px solid ${BORD}`, color: TP, outline: "none", fontFamily: "inherit" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
            <button onClick={() => convene()} disabled={!q.trim()}
              style={{ height: 46, padding: "0 22px", borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: q.trim() ? "pointer" : "default",
                border: "none", color: "#fff", whiteSpace: "nowrap",
                background: q.trim() ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.06)",
                boxShadow: q.trim() ? "0 6px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)" : "none",
                display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={15} /> Созвать совет
            </button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
            {EXAMPLE_QS.map(ex => (
              <button key={ex} onClick={() => convene(ex)}
                style={{ fontSize: 11.5, padding: "5px 11px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${BORD}`, color: TS }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = TP; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = BORD; e.currentTarget.style.color = TS; }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meeting in session — agenda, table, protocol */}
      {phase !== "idle" && (
        <div style={{ padding: "0 24px 22px" }}>
          {/* Agenda bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 16, borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: `1px solid ${BORD}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: TM, marginBottom: 3 }}>ПОВЕСТКА ЗАСЕДАНИЯ</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: TP }}>{asked}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <svg width={26} height={26} viewBox="0 0 26 26" style={{ transform: "rotate(-90deg)" }}>
                <circle cx={13} cy={13} r={10} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
                <motion.circle cx={13} cy={13} r={10} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round"
                  animate={{ strokeDasharray: `${(answered / 5) * 62.8} 62.8` }} transition={{ duration: 0.5, ease: EASE }} />
              </svg>
              <span style={{ fontFamily: MONO, fontSize: 11, color: TM }}>{answered}/5</span>
            </div>
          </div>

          {/* The table: who has the floor */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            {BOARD_SLUGS.map(slug => {
              const a = rich(slug);
              const Icon = EXEC_ICON[slug] ?? Crown;
              const speaking = current === slug;
              const st = stances[slug];
              const waiting = !speaking && !st;
              return (
                <div key={slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 62 }}>
                  <div style={{ position: "relative", width: 44, height: 44 }}>
                    {speaking && !reduce && (
                      <motion.span aria-hidden animate={{ rotate: 360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                        style={{ position: "absolute", inset: -4, borderRadius: 15,
                          background: `conic-gradient(from 0deg, transparent, ${a.c}, transparent 60%)`,
                          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))" }} />
                    )}
                    <motion.div
                      animate={{ scale: speaking && !reduce ? [1, 1.07, 1] : 1, opacity: waiting ? 0.38 : 1 }}
                      transition={speaking && !reduce ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                      style={{ width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `linear-gradient(140deg, ${a.g[0]}, ${a.g[1]})`, color: "#fff",
                        boxShadow: speaking ? `0 6px 20px ${a.c}55` : `0 4px 14px ${a.c}30` }}>
                      <Icon size={18} strokeWidth={1.9} />
                    </motion.div>
                    {st && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}
                        style={{ position: "absolute", right: -4, bottom: -4, width: 16, height: 16, borderRadius: "50%",
                          background: STANCE_META[st].c, border: "2px solid #0a0c15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {st === "for" ? <Check size={9} color="#052e22" strokeWidth={3.5} /> : st === "against" ? <X size={9} color="#3d0a0a" strokeWidth={3.5} /> : <span style={{ width: 6, height: 2, borderRadius: 1, background: "#3d2a00" }} />}
                      </motion.span>
                    )}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", color: speaking ? a.c : waiting ? TM : TS }}>{a.role}</span>
                </div>
              );
            })}
          </div>

          {/* Protocol — the meeting transcript, speeches land in order */}
          <div ref={feedRef} style={{ maxHeight: 420, overflowY: "auto", borderRadius: 16, border: `1px solid ${BORD}`,
            background: "rgba(255,255,255,0.015)", padding: "4px 0" }}>
            <div style={{ padding: "10px 16px 6px", fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: TM }}>
              ПРОТОКОЛ ЗАСЕДАНИЯ
            </div>
            <AnimatePresence>
              {BOARD_SLUGS.filter(s => speeches[s] !== undefined).map(slug => {
                const a = rich(slug);
                const Icon = EXEC_ICON[slug] ?? Crown;
                const speaking = current === slug;
                const st = stances[slug];
                const { stance: liveStance, clean } = parseStance(speeches[slug] || "");
                const shownStance = st ?? liveStance;
                return (
                  <motion.div key={slug}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    style={{ display: "flex", gap: 12, padding: "12px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      background: speaking ? `linear-gradient(90deg, ${a.c}0a, transparent 55%)` : "transparent",
                      transition: "background 0.4s" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(140deg, ${a.g[0]}, ${a.g[1]})`, color: "#fff", boxShadow: `0 3px 10px ${a.c}35` }}>
                      <Icon size={15} strokeWidth={1.9} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: TP }}>{a.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: a.c }}>{a.role}</span>
                        {shownStance && (
                          <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 800, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 6,
                              color: STANCE_META[shownStance].c, background: `${STANCE_META[shownStance].c}18`, border: `1px solid ${STANCE_META[shownStance].c}40` }}>
                            {STANCE_META[shownStance].label}
                          </motion.span>
                        )}
                        {speaking && !clean && (
                          <span style={{ display: "flex", gap: 3 }}>
                            {[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: a.c, animation: `ec-think 1s ease-in-out ${i * 0.15}s infinite` }} />)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.65, color: clean ? "rgba(255,255,255,0.78)" : TM, margin: 0 }}>
                        {clean}
                        {speaking && <span style={{ display: "inline-block", width: 2, height: 13, background: a.c, marginLeft: 2, verticalAlign: "middle", animation: "ec-pulse 1s step-end infinite" }} />}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Verdict inside the protocol — chair closes the meeting */}
            <AnimatePresence>
              {(phase === "verdict" || phase === "done") && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  style={{ margin: "10px 12px 8px", borderRadius: 14, padding: 16, position: "relative", overflow: "hidden",
                    background: "linear-gradient(150deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04) 70%)",
                    border: "1px solid rgba(99,102,241,0.35)",
                    boxShadow: "0 12px 34px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                  <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.9), transparent)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
                      style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                        background: "linear-gradient(135deg,#fbbf24,#d97706)", boxShadow: "0 4px 12px rgba(245,158,11,0.5)" }}>
                      <Crown size={13} color="#3a2a00" strokeWidth={2.4} />
                    </motion.span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", color: "#a5b4fc", textTransform: "uppercase" }}>
                      Вердикт совета
                    </span>
                    {/* Vote tally */}
                    <span style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                      {tallyChips.map(({ s, n }) => (
                        <span key={s} style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 6,
                          color: STANCE_META[s].c, background: `${STANCE_META[s].c}16`, border: `1px solid ${STANCE_META[s].c}38` }}>
                          {n} {STANCE_META[s].label}
                        </span>
                      ))}
                    </span>
                    {phase === "verdict" && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: TM }}>
                        <span style={{ display: "flex", gap: 2 }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#a5b4fc", animation: `ec-think 1s ease-in-out ${i * 0.15}s infinite` }} />)}</span>
                        синтезирую
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.86)", margin: 0 }}>
                    {verdict.replace(/\*\*/g, "")}
                    {phase === "verdict" && <span style={{ display: "inline-block", width: 2, height: 15, background: "#a5b4fc", marginLeft: 2, verticalAlign: "middle", animation: "ec-pulse 1s step-end infinite" }} />}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Follow-up — continue the meeting with a clarifying question */}
          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
              style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <input value={followQ} onChange={e => setFollowQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && followQ.trim()) convene(followQ, true); }}
                placeholder="Уточнить у совета… (совет помнит своё прошлое решение)"
                style={{ flex: 1, height: 42, padding: "0 14px", borderRadius: 12, fontSize: 13,
                  background: "rgba(255,255,255,0.035)", border: `1px solid ${BORD}`, color: TP, outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = BORD)} />
              <button onClick={() => followQ.trim() && convene(followQ, true)} disabled={!followQ.trim()}
                style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: followQ.trim() ? "pointer" : "default",
                  border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 7,
                  background: followQ.trim() ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255,255,255,0.06)",
                  boxShadow: followQ.trim() ? "0 6px 18px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.16)" : "none" }}>
                <CornerDownLeft size={14} /> Спросить
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── CEO hero card ─────────────────────────────────────────────────────────────
function CeoHero({ a, mt, tick, reduce, onAsk, onMeet, totalAgents }: {
  a: AgentFull; mt: ReturnType<typeof metrics>; tick: number; reduce: boolean;
  onAsk: () => void; onMeet: () => void; totalAgents: number;
}) {
  const [hov, setHov] = useState(false);
  const sd = sparkData(a.slug);

  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -2 : 0 }} transition={{ duration: 0.28, ease: EASE }}
      style={{ position: "relative", overflow: "hidden", borderRadius: 20, cursor: "pointer",
        background: `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(255,255,255,0.02) 60%, rgba(99,102,241,0.06) 100%)`,
        border: `1px solid ${hov ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.2)"}`,
        boxShadow: hov
          ? "0 24px 64px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "border-color 0.25s, box-shadow 0.25s" }}
      onClick={onAsk}>

      {/* Top shimmer */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.4) 30%, rgba(99,102,241,0.5) 65%, transparent)" }} />
      {/* Background orb */}
      <div aria-hidden style={{ position: "absolute", top: -80, left: -60, width: 400, height: 400,
        borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 65%)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 0, alignItems: "stretch" }}>

        {/* Left: avatar + identity */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <motion.div
                animate={reduce ? undefined : { y: [0, -5, 0] }}
                transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 76, height: 76, borderRadius: 22, display: "flex", alignItems: "center",
                  justifyContent: "center", background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`,
                  color: "#fff", fontSize: 22, fontWeight: 800, fontFamily: MONO,
                  boxShadow: `0 16px 48px ${a.c}55, inset 0 2px 0 rgba(255,255,255,0.25)` }}>
                {a.ab}
              </motion.div>
              {/* Crown */}
              <div style={{ position: "absolute", top: -10, right: -10, width: 26, height: 26,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg,#fbbf24,#d97706)", border: "2px solid #05060A",
                boxShadow: "0 4px 12px rgba(245,158,11,0.55)", color: "#0b0800" }}>
                <Crown size={11} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: TP, letterSpacing: "-0.02em" }}>{a.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  padding: "2px 8px", borderRadius: 6, color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,0.32)", background: "rgba(251,191,36,0.08)" }}>ЛИДЕР</span>
              </div>
              <div style={{ fontSize: 12, color: TS, marginBottom: 8 }}>{a.title} · {a.specialty}</div>
              <StatusBadge working />
            </div>
          </div>

          {/* Live activity */}
          <LiveAct slug={a.slug} tick={tick} working color={a.c} />

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            {[
              { v: `${totalAgents}`, l: "агентов" },
              { v: `${mt.success}%`, l: "успех" },
              { v: `${mt.done}`,     l: "задач" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 16, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: TM, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: sparkline */}
        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", justifyContent: "center",
          borderLeft: `1px solid ${BORD}`, borderRight: `1px solid ${BORD}` }}>
          <div style={{ fontSize: 10, color: TM, marginBottom: 10, fontFamily: MONO, letterSpacing: "0.1em" }}>
            ПРОИЗВОДИТЕЛЬНОСТЬ · 30Д
          </div>
          <Spark color={a.c} data={sd} w={280} h={64} />
        </div>

        {/* Right: conf arc + actions */}
        <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "space-between", minWidth: 180 }}>

          <ConfArc value={a.confidence} color={a.c} size={72} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <button onClick={e => { e.stopPropagation(); onAsk(); }}
              style={{ height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", color: "#fff", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                boxShadow: "0 4px 16px rgba(99,102,241,0.42), inset 0 1px 0 rgba(255,255,255,0.18)",
                transition: "all 0.18s" }}
              onMouseOver={e => { e.currentTarget.style.filter = "brightness(1.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={e  => { e.currentTarget.style.filter = "brightness(1)";   e.currentTarget.style.transform = "translateY(0)"; }}>
              <MessageSquare size={12} /> Спросить
            </button>
            <button onClick={e => { e.stopPropagation(); onMeet(); }}
              style={{ height: 38, borderRadius: 10, fontSize: 11, fontWeight: 700,
                cursor: "pointer", color: a.c, background: `${a.c}12`, border: `1px solid ${a.c}35`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.18s" }}
              onMouseOver={e => { e.currentTarget.style.background = `${a.c}22`; }}
              onMouseOut={e  => { e.currentTarget.style.background = `${a.c}12`; }}>
              <MessagesSquare size={11} /> Совещание · {totalAgents}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Board member card (boardroom aesthetic) ──────────────────────────────────
function BoardMemberCard({ a, tick, reduce, onAsk, onMeet }: {
  a: AgentFull; tick: number; reduce: boolean; onAsk: () => void; onMeet: () => void;
}) {
  const mt = metrics(a.slug);
  const [hov, setHov] = useState(false);
  const Icon = EXEC_ICON[a.slug] ?? Crown;
  const R = 25, CIRC = 2 * Math.PI * R;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }}
      transition={{ type: "spring", stiffness: 230, damping: 22 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      animate={{ y: hov ? -5 : 0 }}
      style={{ borderRadius: 18, overflow: "hidden", position: "relative", cursor: "pointer",
        background: hov ? `linear-gradient(160deg, ${a.c}12, rgba(255,255,255,0.02) 65%)` : "rgba(255,255,255,0.022)",
        border: `1px solid ${hov ? a.c + "50" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? `0 22px 54px rgba(0,0,0,0.4), 0 0 0 1px ${a.c}18, inset 0 1px 0 rgba(255,255,255,0.05)` : "0 2px 10px rgba(0,0,0,0.28)",
        transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s" }}
      onClick={onAsk}>

      {/* boardroom nameplate strip */}
      <div aria-hidden style={{ height: 3, background: `linear-gradient(90deg, ${a.g[0]}, ${a.g[1]})` }} />
      {hov && !reduce && (
        <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, borderRadius: "50%", pointerEvents: "none",
            background: `radial-gradient(circle, ${a.c}18, transparent 70%)` }} />
      )}

      <div style={{ padding: "16px 16px 14px" }}>
        {/* header: avatar w/ workload ring + identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 12 }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <svg width={56} height={56} viewBox="0 0 56 56" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={28} cy={28} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
              <motion.circle cx={28} cy={28} r={R} fill="none" stroke={a.c} strokeWidth={2.5} strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${CIRC}` }} whileInView={{ strokeDasharray: `${(mt.load / 100) * CIRC} ${CIRC}` }} viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.2 }} style={{ filter: `drop-shadow(0 0 4px ${a.c}80)` }} />
            </svg>
            <motion.div animate={mt.working && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }} transition={mt.working && !reduce ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
              style={{ position: "absolute", inset: 8, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(140deg, ${a.g[0]}, ${a.g[1]})`, color: "#fff", boxShadow: `0 4px 14px ${a.c}44` }}>
              <Icon size={18} strokeWidth={1.9} />
            </motion.div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: TP, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
            <div style={{ fontSize: 11.5, color: a.c, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
          </div>
          <StatusBadge working={mt.working} />
        </div>

        {/* live activity */}
        <div style={{ marginBottom: 12 }}>
          <LiveAct slug={a.slug} tick={tick} working={mt.working} color={a.c} />
        </div>

        {/* workload — how much they work */}
        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORD}` }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: TM, textTransform: "uppercase" }}>Загрузка</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums" }}>{mt.load}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${mt.load}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE, delay: 0.25 }}
              style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${a.g[0]}, ${a.g[1]})` }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 9 }}>
            {[{ v: mt.done, l: "задач" }, { v: `${mt.success}%`, l: "успех" }, { v: `${mt.streak}д`, l: "серия" }].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: TP, fontVariantNumeric: "tabular-nums" }}>{m.v}</span>
                <span style={{ fontSize: 9, color: TM }}>{m.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* actions — write to this director */}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={e => { e.stopPropagation(); onAsk(); }}
            style={{ flex: 1, height: 36, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff",
              background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: `0 4px 14px ${a.c}3a, inset 0 1px 0 rgba(255,255,255,0.2)` }}>
            <MessageSquare size={12} /> Написать
          </button>
          <button onClick={e => { e.stopPropagation(); onMeet(); }}
            style={{ padding: "0 13px", height: 36, borderRadius: 10, fontSize: 11.5, fontWeight: 700, cursor: "pointer", color: a.c,
              background: `${a.c}12`, border: `1px solid ${a.c}35`, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap" }}>
            <MessagesSquare size={11} /> Совет
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Agent list row ────────────────────────────────────────────────────────────
function AgentListRow({ a, tick, delay, onAsk, onMeet }: {
  a: AgentFull; tick: number; delay: number; onAsk: () => void; onMeet: () => void;
}) {
  const mt = metrics(a.slug);
  const sd = sparkData(a.slug);
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, ease: EASE, delay }}
      onClick={onAsk}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 12,
        cursor: "pointer", background: hov ? `${a.c}0c` : "transparent",
        border: `1px solid ${hov ? `${a.c}38` : "transparent"}`,
        transition: "all 0.18s" }}>

      {/* Avatar — role icon + status ring */}
      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
        {mt.working && (
          <motion.span aria-hidden animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.14, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay }}
            style={{ position: "absolute", inset: -2.5, borderRadius: 13, border: `1.5px solid ${a.c}`, pointerEvents: "none" }} />
        )}
        <motion.div animate={{ scale: hov ? 1.06 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(140deg, ${a.g[0]}, ${a.g[1]})`, color: "#fff", boxShadow: `0 4px 12px ${a.c}30` }}>
          {(() => { const I = EXEC_ICON[a.slug] ?? Crown; return <I size={17} strokeWidth={1.9} />; })()}
        </motion.div>
      </div>

      {/* Name + specialty */}
      <div style={{ minWidth: 180 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: hov ? TP : "rgba(229,231,235,0.85)", letterSpacing: "-0.01em" }}>{a.name}</div>
        <div style={{ fontSize: 11, color: a.c, fontWeight: 600 }}>{a.role}</div>
      </div>

      {/* Activity */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <LiveAct slug={a.slug} tick={tick} working={mt.working} color={a.c} />
      </div>

      {/* Sparkline */}
      <div style={{ flexShrink: 0 }}>
        <Spark color={a.c} data={sd} w={80} h={28} />
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
        {[
          { v: mt.done,            l: "задач" },
          { v: `${mt.success}%`,   l: "успех" },
          { v: `${a.confidence}%`, l: "конф" },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: "right", minWidth: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: a.c, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
            <div style={{ fontSize: 9, color: TM }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Status + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <StatusBadge working={mt.working} />
        <AnimatePresence>
          {hov && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.14 }}
              onClick={e => { e.stopPropagation(); onAsk(); }}
              style={{ height: 32, padding: "0 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: "pointer", color: "#fff",
                background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none",
                display: "flex", alignItems: "center", gap: 5,
                boxShadow: "0 3px 12px rgba(99,102,241,0.38)" }}>
              <MessageSquare size={10} /> Спросить
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {hov && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.14, delay: 0.04 }}
              onClick={e => { e.stopPropagation(); onMeet(); }}
              style={{ height: 32, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: "pointer", color: a.c, background: `${a.c}12`, border: `1px solid ${a.c}35`,
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <MessagesSquare size={10} /> Совещание
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
  const mt = metrics(agent.slug);

  const submit = useCallback(async () => {
    const question = q.trim(); if (!question || busy) return;
    setBusy(true); setAnswer("");
    const persona = `Ты — ${agent.name}, ${agent.title}, специализация: ${agent.specialty}. Ответь как топ-менеджер: конкретно, 4–6 предложений. Без markdown.`;
    let full = "";
    try {
      full = await streamChat(question, persona, t => setAnswer(prev => prev + t));
    } catch {
      const fb = (agent.slug in FB ? FB[agent.slug as keyof typeof FB] : undefined)
        ?? "Готов помочь — опишите задачу подробнее. Живой анализ доступен после настройки ANTHROPIC_API_KEY.";
      for (const ch of fb) { full += ch; setAnswer(prev => prev + ch); await new Promise(r => setTimeout(r, 6)); }
    }
    setBusy(false);
    // Persist the Q&A so it shows up on the История page.
    saveAsk({ id: `ask-${Date.now()}`, kind: "agent", question, date: Date.now(),
      agentSlug: agent.slug, agentName: agent.name, agentRole: agent.role, color: agent.c, answer: full });
  }, [q, busy, agent]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,6,10,0.8)",
        backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.25, ease: EASE }}
        style={{ position: "relative", width: "min(620px,100%)", maxHeight: "86vh", overflowY: "auto",
          borderRadius: 22, padding: 28, background: "#0a0c15",
          border: `1px solid ${agent.c}2e`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px ${agent.c}14` }}>

        {/* Accent top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "22px 22px 0 0",
          background: `linear-gradient(90deg, transparent, ${agent.c}80, transparent)` }} />

        {/* Close */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: SURF, border: `1px solid ${BORD}`, color: TS, cursor: "pointer", transition: "all 0.15s" }}
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
            <div style={{ fontSize: 12, color: TS, marginTop: 2 }}>{agent.title} · {agent.specialty}</div>
          </div>
          <ConfArc value={agent.confidence} color={agent.c} size={52} />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { v: mt.done,             l: "Задач" },
            { v: `${mt.success}%`,    l: "Успех" },
            { v: `${mt.streak} дней`, l: "Серия" },
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
                    animation: `ec-think 1s ease-in-out ${d*0.15}s infinite` }} />)}
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
                {busy && (
                  <span style={{ display: "inline-flex", gap: 3, marginLeft: 4 }}>
                    {[0,1,2].map(d => <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: agent.c,
                      animation: `ec-think 1.1s ease-in-out ${d*0.16}s infinite` }} />)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "rgba(229,231,235,0.85)",
                margin: 0, whiteSpace: "pre-wrap" }}>
                {answer}
                {busy && <span style={{ animation: "ec-caret 0.8s step-end infinite", borderRight: `2px solid ${agent.c}`, marginLeft: 2 }}>&nbsp;</span>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
