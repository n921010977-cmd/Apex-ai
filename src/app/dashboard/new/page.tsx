"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Brain, DollarSign, TrendingUp, Activity, Cpu,
  CheckCircle, ChevronRight, FileText, Globe, Target,
  Lightbulb, ArrowRight, Sparkles, Shield, Users, BarChart2,
  PieChart, Briefcase, Search, Layers, Rocket, Star,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "SaaS / Software","E-commerce","Mobile App","Marketplace",
  "Agency / Services","Healthcare","FinTech","EdTech",
  "Real Estate","Restaurant / Food","Fitness / Wellness",
  "Media / Content","Manufacturing","Consulting","Other",
];
const STAGES = [
  { id: "idea",     label: "Просто идея",    desc: "Ещё не начинал",        icon: Lightbulb },
  { id: "planning", label: "Планирование",   desc: "Изучаю рынок",          icon: Target },
  { id: "building", label: "Создаю MVP",     desc: "В разработке",          icon: Cpu },
  { id: "launched", label: "Уже запущен",    desc: "Нужна стратегия роста", icon: TrendingUp },
];
const GOALS = [
  "Привлечь инвестиции","Быстрый запуск","Product-market fit",
  "Масштабировать выручку","Выйти на новый рынок","Снизить расходы",
  "Нанять команду","Exit стратегия","Улучшить unit-экономику",
  "Запустить новый продукт","Автоматизировать процессы","IPO",
];

const BIZ_MODELS = ["B2B","B2C","B2B2C","D2C","Marketplace","SaaS","Freemium","Enterprise","Franchise"];
const TEAM_SIZES = [
  { id:"solo",   label:"Только я",  desc:"Соло-основатель" },
  { id:"small",  label:"2–5",       desc:"Микрокоманда" },
  { id:"mid",    label:"6–20",      desc:"Небольшой стартап" },
  { id:"growth", label:"21–100",    desc:"Стадия роста" },
  { id:"large",  label:"100+",      desc:"Масштабная компания" },
];
const GEOS = ["Россия / СНГ","США / Канада","Европа","Азия / MENA","Латинская Америка","Глобально"];
const REVENUES = ["Ещё нет выручки","До $10k/мес","$10k–$50k/мес","$50k–$200k/мес","$200k–$1M/мес","$1M+/мес"];
const AGENTS = [
  { role: "CEO",              label: "Генеральный директор",      color: "#8b5cf6", rgb: "139,92,246",  icon: Brain,      name: "Sophia Rivers"  },
  { role: "CFO",              label: "Финансовый директор",       color: "#3b82f6", rgb: "59,130,246",  icon: DollarSign, name: "Marcus Chen"    },
  { role: "CMO",              label: "Директор по маркетингу",    color: "#10b981", rgb: "16,185,129",   icon: TrendingUp, name: "Elena Torres"   },
  { role: "COO",              label: "Операционный директор",     color: "#f59e0b", rgb: "245,158,11",   icon: Activity,   name: "James Wright"   },
  { role: "CTO",              label: "Технический директор",      color: "#a78bfa", rgb: "167,139,250", icon: Cpu,        name: "Aiden Park"     },
  { role: "Business Analyst", label: "Бизнес-аналитик",          color: "#f43f5e", rgb: "244,63,94",  icon: BarChart2,  name: "Kim Park"       },
  { role: "Sales Director",   label: "Директор по продажам",     color: "#34d399", rgb: "52,211,153",  icon: Users,      name: "Ryan Cole"      },
  { role: "Legal Advisor",    label: "Юридический советник",     color: "#94a3b8", rgb: "148,163,184", icon: Shield,     name: "Mia Larson"     },
  { role: "Growth Hacker",    label: "Директор по росту",        color: "#f97316", rgb: "249,115,22",  icon: Rocket,     name: "Alex Kim"       },
  { role: "Product Manager",  label: "Продукт-менеджер",         color: "#e879f9", rgb: "232,121,249", icon: Layers,     name: "Sara Patel"     },
  { role: "Data Scientist",   label: "Датa-сайентист",           color: "#38bdf8", rgb: "56,189,248",  icon: PieChart,   name: "Leo Zhang"      },
  { role: "HR Director",      label: "HR Директор",              color: "#fb7185", rgb: "251,113,133", icon: Star,       name: "Maya Scott"     },
  { role: "Investor Relations",label:"Инвесторские отношения",   color: "#4ade80", rgb: "74,222,128",  icon: Briefcase,  name: "Tom Evans"      },
  { role: "Market Research",  label: "Рыночный аналитик",        color: "#fbbf24", rgb: "251,191,36",  icon: Search,     name: "Nina Brown"     },
  { role: "Risk Manager",     label: "Риск-менеджер",            color: "#f43f5e", rgb: "244,63,94",   icon: Shield,     name: "Omar Hassan"    },
  { role: "Brand Strategist", label: "Бренд-стратег",            color: "#818cf8", rgb: "129,140,248", icon: Target,     name: "Chloe Martin"   },
  { role: "Supply Chain",     label: "Цепочка поставок",         color: "#2dd4bf", rgb: "45,212,191",  icon: Globe,      name: "Jake Turner"    },
  { role: "UX Researcher",    label: "UX-исследователь",         color: "#c084fc", rgb: "192,132,252", icon: Lightbulb,  name: "Zoe Carter"     },
  { role: "PR Director",      label: "PR Директор",              color: "#fdba74", rgb: "253,186,116", icon: Globe,      name: "Liam Foster"    },
  { role: "Strategy Advisor", label: "Стратегический советник",  color: "#8b5cf6", rgb: "139,92,246",  icon: Zap,        name: "Diana Wells"    },
];

const STEP_TIMELINE = [
  { id: 1, label: "Business",       desc: "Описание & идея",     icon: Brain },
  { id: 2, label: "Market",         desc: "Контекст & рынок",    icon: Globe },
  { id: 3, label: "Executive Report",desc: "Цели & параметры",   icon: FileText },
];

// ─── AI entity detection ─────────────────────────────────────────────────────

function detectEntities(text: string) {
  const t = text.toLowerCase();
  const entities: { label: string; value: string; color: string }[] = [];

  if (t.includes("saas") || t.includes("подписка") || t.includes("subscription"))
    entities.push({ label: "Модель", value: "SaaS", color: "#8b5cf6" });
  if (t.includes("b2b") || t.includes("бизнес") || t.includes("корпоратив") || t.includes("enterprise"))
    entities.push({ label: "Аудитория", value: "B2B", color: "#3b82f6" });
  if (t.includes("b2c") || t.includes("потребител") || t.includes("пользовател"))
    entities.push({ label: "Аудитория", value: "B2C", color: "#10b981" });
  if (t.includes("mobile") || t.includes("мобильн") || t.includes("приложени"))
    entities.push({ label: "Платформа", value: "Mobile", color: "#f59e0b" });
  if (t.includes("маркетплейс") || t.includes("marketplace") || t.includes("платформ"))
    entities.push({ label: "Тип", value: "Marketplace", color: "#f43f5e" });
  if (t.includes("ai") || t.includes("искусственн") || t.includes("нейро") || t.includes("machine"))
    entities.push({ label: "Технология", value: "AI/ML", color: "#a78bfa" });
  if (t.includes("fintech") || t.includes("банк") || t.includes("платёж") || t.includes("финанс"))
    entities.push({ label: "Сектор", value: "FinTech", color: "#34d399" });
  if (t.includes("конкурент") || t.includes("competitor") || t.includes("рынок"))
    entities.push({ label: "Анализ", value: "Competitive", color: "#3b82f6" });

  return entities;
}

function qualityScore(name: string, desc: string): number {
  let score = 0;
  if (name.length > 3)   score += 10;
  if (name.length > 10)  score += 5;
  const wc = desc.trim().split(/\s+/).length;
  score += Math.min(40, wc * 1.5);
  const entities = detectEntities(desc);
  score += Math.min(20, entities.length * 5);
  if (desc.includes("?") || desc.includes("клиент") || desc.includes("пробл")) score += 10;
  if (desc.length > 200) score += 10;
  if (desc.length > 400) score += 5;
  return Math.min(100, Math.round(score));
}

// ─── Live AI Agent Panel ──────────────────────────────────────────────────────

const AGENT_THOUGHTS: Record<string, string[]> = {
  CEO:                 ["Формирую стратегическое видение...", "Анализирую рыночную позицию...",  "Оцениваю конкурентов..."],
  CFO:                 ["Строю финансовую модель...",         "Прогнозирую cash flow...",         "Считаю Unit Economics..."],
  CMO:                 ["Изучаю целевую аудиторию...",        "Анализирую каналы роста...",       "Разрабатываю go-to-market..."],
  COO:                 ["Проектирую операции...",             "Оптимизирую процессы...",          "Определяю KPI..."],
  CTO:                 ["Анализирую технический стек...",     "Проектирую архитектуру...",        "Оцениваю риски..."],
  "Business Analyst":  ["Анализирую данные рынка...",        "Оцениваю потенциал...",            "Строю прогнозы..."],
  "Sales Director":    ["Строю воронку продаж...",           "Анализирую CAC/LTV...",            "Прогнозирую конверсию..."],
  "Legal Advisor":     ["Проверяю юридические риски...",     "Анализирую требования...",         "Оцениваю структуру..."],
  "Growth Hacker":     ["Ищу точки взрывного роста...",      "Тестирую growth-каналы...",        "Оптимизирую воронку..."],
  "Product Manager":   ["Анализирую пользователей...",       "Приоритизирую фичи...",            "Строю roadmap..."],
  "Data Scientist":    ["Обрабатываю массивы данных...",     "Строю предиктивные модели...",     "Валидирую гипотезы..."],
  "HR Director":       ["Проектирую org-структуру...",       "Оцениваю кадровые риски...",       "Планирую найм..."],
  "Investor Relations":["Готовлю investor pitch...",         "Анализирую cap table...",          "Оцениваю раунды..."],
  "Market Research":   ["Сканирую рыночные тренды...",       "Анализирую конкурентов...",        "Оцениваю TAM/SAM/SOM..."],
  "Risk Manager":      ["Идентифицирую риски...",            "Строю матрицу рисков...",          "Разрабатываю mitigation..."],
  "Brand Strategist":  ["Формирую brand identity...",        "Анализирую позиционирование...",   "Строю brand voice..."],
  "Supply Chain":      ["Оцениваю цепочку поставок...",      "Анализирую зависимости...",        "Оптимизирую логистику..."],
  "UX Researcher":     ["Исследую user journey...",          "Выявляю pain points...",           "Проектирую UX стратегию..."],
  "PR Director":       ["Строю PR стратегию...",             "Анализирую медиа-пространство...", "Готовлю key messages..."],
  "Strategy Advisor":  ["Синтезирую стратегии...",           "Оцениваю синергию...",             "Финализирую рекомендации..."],
};

function LiveAgentPanel({ hasText }: { hasText: boolean }) {
  const [thoughts, setThoughts] = useState<Record<string, string>>({});
  const [pulses,   setPulses]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!hasText) return;
    const intervals: ReturnType<typeof setInterval>[] = [];

    AGENTS.forEach((a, i) => {
      const msgs   = AGENT_THOUGHTS[a.role];
      let   msgIdx = 0;
      const iv = setInterval(() => {
        msgIdx = (msgIdx + 1) % msgs.length;
        setThoughts(prev => ({ ...prev, [a.role]: msgs[msgIdx] }));
        setPulses(prev => ({ ...prev, [a.role]: true }));
        setTimeout(() => setPulses(prev => ({ ...prev, [a.role]: false })), 600);
      }, 2800 + i * 300);
      intervals.push(iv);
      setThoughts(prev => ({ ...prev, [a.role]: msgs[0] }));
    });

    return () => intervals.forEach(clearInterval);
  }, [hasText]);

  return (
    <motion.div
      className="space-y-2"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.045 } } }}
    >
      {AGENTS.map((a, idx) => {
        const Icon = a.icon;
        const active = hasText;
        const pulsing = !!pulses[a.role];
        return (
          <motion.div
            key={a.role}
            variants={{
              hidden: { opacity: 0, x: 24 },
              show:   { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
            whileHover={{ x: -3, transition: { duration: 0.18 } }}
            animate={{
              borderColor: pulsing ? `rgba(${a.rgb},0.5)` : active ? `rgba(${a.rgb},0.18)` : "rgba(255,255,255,0.06)",
              boxShadow: pulsing ? `0 6px 24px rgba(${a.rgb},0.16)` : "0 1px 2px rgba(0,0,0,0.3)",
            }}
            style={{
              borderRadius: 14,
              padding:      "11px 13px",
              background:   active
                ? `linear-gradient(135deg, rgba(${a.rgb},0.09) 0%, rgba(255,255,255,0.02) 100%)`
                : "rgba(255,255,255,0.025)",
              border:       `1px solid rgba(${a.rgb},0.12)`,
              position:     "relative",
              overflow:     "hidden",
            }}
          >
            {/* left accent rail */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2.5, background: active ? `linear-gradient(180deg, ${a.color}, rgba(${a.rgb},0.2))` : "transparent" }} />

            <div className="flex items-center gap-3">
              {/* Avatar with ring + glow */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <motion.div
                  animate={pulsing ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{
                    width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(135deg, rgba(${a.rgb},0.28), rgba(${a.rgb},0.08))`,
                    border: `1px solid rgba(${a.rgb},0.35)`,
                    color: a.color,
                    boxShadow: active ? `0 0 14px rgba(${a.rgb},0.25)` : "none",
                  }}
                >
                  <Icon size={15} />
                </motion.div>
                {/* status dot */}
                <span style={{
                  position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%",
                  border: "2px solid #0a0b12",
                  background: active ? a.color : "rgba(255,255,255,0.2)",
                  boxShadow: active ? `0 0 6px rgba(${a.rgb},0.9)` : "none",
                  animation: active ? "lp-pulse 1.6s ease-in-out infinite" : "none",
                }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{a.name}</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 5, background: `rgba(${a.rgb},0.14)`, color: a.color }}>{a.role}</span>
                </div>
                <div style={{ fontSize: 10, color: active ? `rgba(${a.rgb},0.85)` : "rgba(255,255,255,0.28)", marginTop: 2, fontFamily: "ui-monospace, monospace", display: "flex", alignItems: "center", gap: 5 }}>
                  {active && (
                    <span style={{ display: "inline-flex", gap: 2 }}>
                      {[0, 1, 2].map(d => (
                        <span key={d} style={{ width: 3, height: 3, borderRadius: "50%", background: a.color, display: "inline-block", animation: `lp-typing 1.2s ease-in-out ${d * 0.15}s infinite` }} />
                      ))}
                    </span>
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {active ? (thoughts[a.role] || "Ожидает данных...") : "Ожидает брифинга..."}
                  </span>
                </div>
              </div>

              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.16)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                {String(idx + 1).padStart(2, "0")}
              </span>
            </div>

            {active && (
              <div style={{ marginTop: 9, height: 2.5, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, rgba(${a.rgb},0.4), ${a.color})` }}
                  animate={{ width: ["20%", "75%", "35%", "88%", "45%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: idx * 0.1 }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Cinematic analyzing screen ───────────────────────────────────────────────

interface AgentResult {
  role: string; title: string; summary: string; analysis: string;
  facts: string; risks: string; recommendations: string;
  confidence: string; score: number;
}

// Individual animated agent card during analysis
function AgentAnalysisCard({ agent, done, result }: {
  agent: typeof AGENTS[0];
  done: boolean;
  result?: AgentResult;
}) {
  const Icon = agent.icon;
  const thoughts = AGENT_THOUGHTS[agent.role] ?? ["Анализирует..."];
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [flash, setFlash] = useState(false);

  // Cycle thoughts while working
  useEffect(() => {
    if (done) return;
    const iv = setInterval(() => {
      setThoughtIdx(i => (i + 1) % thoughts.length);
    }, 2200 + Math.random() * 800);
    return () => clearInterval(iv);
  }, [done, thoughts.length]);

  // Flash on completion
  useEffect(() => {
    if (!done) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{
        opacity: 1,
        scale: flash ? 1.04 : 1,
        y: 0,
        background: done ? `rgba(${agent.rgb},0.07)` : "rgba(255,255,255,0.025)",
      }}
      transition={{ duration: flash ? 0.18 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "12px 13px",
        borderRadius: 14,
        border: `1px solid ${done ? `rgba(${agent.rgb},0.32)` : "rgba(255,255,255,0.06)"}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Completion flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "absolute", inset: 0, borderRadius: 14,
              background: `radial-gradient(circle at 50% 50%, rgba(${agent.rgb},0.35) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {/* Icon */}
        <motion.div
          animate={done ? { scale: [1, 1.2, 1] } : { opacity: [1, 0.5, 1] }}
          transition={done ? { duration: 0.4 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `rgba(${agent.rgb},${done ? 0.18 : 0.08})`,
            border: `1px solid rgba(${agent.rgb},${done ? 0.4 : 0.2})`,
            color: agent.color,
          }}
        >
          {done ? <CheckCircle size={13} /> : <Icon size={13} />}
        </motion.div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: done ? "#fff" : "rgba(255,255,255,0.6)", marginBottom: 2 }}>
            {agent.name}
          </div>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="score"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 10, fontWeight: 700, color: agent.color }}
              >
                ✓ Балл: {result?.score ?? "—"}
              </motion.div>
            ) : (
              <motion.div
                key={thoughtIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: 9, color: "rgba(255,255,255,0.32)",
                  fontFamily: "ui-monospace, monospace",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {thoughts[thoughtIdx]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live dot */}
        {!done && (
          <motion.span
            animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: agent.color, flexShrink: 0, boxShadow: `0 0 6px rgba(${agent.rgb},0.8)` }}
          />
        )}
      </div>

      {/* Animated progress bar at bottom */}
      <div style={{ marginTop: 8, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
        {done ? (
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, rgba(${agent.rgb},0.5), ${agent.color})` }}
          />
        ) : (
          <motion.div
            animate={{ width: ["12%", "68%", "25%", "84%", "40%", "72%"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, rgba(${agent.rgb},0.3), rgba(${agent.rgb},0.7))` }}
          />
        )}
      </div>
    </motion.div>
  );
}

function AnalyzingScreen({ doneAgents, agentResults }: { doneAgents: Set<string>; agentResults: AgentResult[] }) {
  const doneCount = doneAgents.size;
  const progress  = Math.round((doneCount / AGENTS.length) * 100);

  // Latest completed agent for live feed
  const latestDone = agentResults[agentResults.length - 1];

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 pt-10"
      style={{ background: "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(139,92,246,0.14) 0%, #040404 55%)" }}
    >
      <style>{`
        @keyframes an-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes an-spin2 { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes an-breathe { 0%,100%{box-shadow:0 0 50px rgba(139,92,246,0.45),0 0 100px rgba(139,92,246,0.18)} 50%{box-shadow:0 0 80px rgba(139,92,246,0.65),0 0 150px rgba(139,92,246,0.28)} }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        {/* Central orb */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 60%, #10b981 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "an-breathe 2.8s ease-in-out infinite",
          }}>
            <Zap size={28} color="white" />
          </div>
          {/* Ring 1 */}
          <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "1px solid rgba(139,92,246,0.35)", animation: "an-spin 4s linear infinite" }}>
            <div style={{ position: "absolute", top: -3, left: "50%", width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", transform: "translateX(-50%)", boxShadow: "0 0 8px #8b5cf6" }} />
          </div>
          {/* Ring 2 */}
          <div style={{ position: "absolute", inset: -20, borderRadius: "50%", border: "1px dashed rgba(59,130,246,0.2)", animation: "an-spin2 7s linear infinite" }}>
            <div style={{ position: "absolute", top: -3, left: "50%", width: 5, height: 5, borderRadius: "50%", background: "#3b82f6", transform: "translateX(-50%)", boxShadow: "0 0 6px #3b82f6" }} />
          </div>
          {/* Ring 3 */}
          <div style={{ position: "absolute", inset: -32, borderRadius: "50%", border: "1px solid rgba(16,185,129,0.1)", animation: "an-spin 11s linear infinite" }}>
            <div style={{ position: "absolute", top: -2.5, left: "50%", width: 4, height: 4, borderRadius: "50%", background: "#10b981", transform: "translateX(-50%)", boxShadow: "0 0 5px #10b981" }} />
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6, textAlign: "center" }}
        >
          Executive Board в работе
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" }}
        >
          20 AI-директоров анализируют проект параллельно
        </motion.p>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ width: "100%", maxWidth: 560, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Прогресс анализа</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Live latest thought */}
            <AnimatePresence mode="wait">
              {latestDone && (
                <motion.span
                  key={latestDone.role}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", fontFamily: "ui-monospace, monospace" }}
                >
                  {latestDone.role} завершил
                </motion.span>
              )}
            </AnimatePresence>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#8b5cf6", fontVariantNumeric: "tabular-nums" }}>
              {doneCount} / {AGENTS.length}
            </span>
          </div>
        </div>
        <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 5, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, borderRadius: 5, background: "linear-gradient(90deg, #8b5cf6, #3b82f6 50%, #10b981)" }}
          />
          {/* Shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
            style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
          />
        </div>
      </div>

      {/* ── AGENT GRID ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, width: "100%", maxWidth: 920 }}
      >
        {AGENTS.map((agent) => (
          <AgentAnalysisCard
            key={agent.role}
            agent={agent}
            done={doneAgents.has(agent.role)}
            result={agentResults.find(r => r.role === agent.role)}
          />
        ))}
      </motion.div>

      {/* ── COMPLETION BANNER ── */}
      <AnimatePresence>
        {doneCount === AGENTS.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              marginTop: 22, padding: "16px 28px", borderRadius: 18,
              background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.28)",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(16,185,129,0.12)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: "#10b981", marginBottom: 4 }}>Анализ завершён ✓</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Перехожу к результатам…</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewStrategyPage() {
  const router   = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState({
    name: "", description: "", industry: "", stage: "",
    bizModels: [] as string[], teamSize: "", geography: "", currentRevenue: "",
    goals: [] as string[], targetRevenue: "", timeframe: "12",
    competitors: "", usp: "", challenges: "", budget: "",
  });
  const [analyzing,    setAnalyzing]    = useState(false);
  const [doneAgents,   setDoneAgents]   = useState<Set<string>>(new Set());
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [btnHovered,   setBtnHovered]   = useState(false);

  const entities  = useMemo(() => detectEntities(form.description), [form.description]);
  const quality   = useMemo(() => qualityScore(form.name, form.description), [form.name, form.description]);
  const hasText   = form.name.length > 2 || form.description.length > 10;

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0 && form.description.trim().length > 20;
    if (step === 2) return !!form.industry && !!form.stage;
    return true;
  };

  const handleGoalToggle = (goal: string) =>
    setForm(f => ({ ...f, goals: f.goals.includes(goal) ? f.goals.filter(g => g !== goal) : [...f.goals, goal] }));

  const handleSubmit = async () => {
    setAnalyzing(true);
    setDoneAgents(new Set());
    setAgentResults([]);

    const id = `proj_${Date.now()}`;
    const collectedResults: AgentResult[] = [];
    let finalScore = 0;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.body) throw new Error("no stream");
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "agent_done") { collectedResults.push(data.result); setDoneAgents(prev => new Set([...prev, data.role])); setAgentResults([...collectedResults]); }
            if (data.type === "complete") finalScore = data.overallScore;
          } catch {}
        }
      }
    } catch {
      const fallbackScore = Math.floor(70 + Math.random() * 20);
      const fallbackTitles: Record<string, string> = {
        CEO: "Генеральный директор", CFO: "Финансовый директор", CMO: "Директор по маркетингу",
        COO: "Операционный директор", "Business Analyst": "Бизнес-аналитик",
        CTO: "Технический директор", "Sales Director": "Директор по продажам", "Legal Advisor": "Юридический советник",
      };
      for (const a of AGENTS) {
        const s = Math.floor(fallbackScore - 5 + Math.random() * 15);
        collectedResults.push({ role: a.role, title: fallbackTitles[a.role] ?? a.label, summary: `Анализ для "${form.name}".`, analysis: `Стадия "${form.stage}".`, facts: "Офлайн-режим.", risks: "Настройте API-ключ.", recommendations: "1. Настройте ANTHROPIC_API_KEY.", confidence: "низкая", score: s });
        setDoneAgents(prev => new Set([...prev, a.role]));
        setAgentResults([...collectedResults]);
        await new Promise(r => setTimeout(r, 400));
      }
      finalScore = fallbackScore;
    }

    const score = finalScore || Math.floor(70 + Math.random() * 25);
    const newProject = {
      id, name: form.name, description: form.description, industry: form.industry,
      stage: form.stage, goals: form.goals, targetRevenue: form.targetRevenue,
      timeframe: form.timeframe, score, status: "complete", date: "Только что",
      revenue: form.targetRevenue || `$${(score * 25000 / 1000).toFixed(1)}M`,
      market: `$${(score * 50).toFixed(0)}M`, growth: `+${Math.floor(10 + score / 5)}%/год`,
      aiResults: collectedResults,
    };
    const existing = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
    localStorage.setItem("apex-user-projects", JSON.stringify([newProject, ...existing]));
    fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, description: form.description, industry: form.industry, stage: form.stage, goals: form.goals, targetRevenue: form.targetRevenue, timeframe: form.timeframe, score, aiResults: newProject.aiResults, metadata: { localId: id } }) }).catch(() => {});
    router.push(`/dashboard/projects/${id}`);
  };

  if (analyzing) return <AnalyzingScreen doneAgents={doneAgents} agentResults={agentResults} />;

  const qualityColor = quality >= 70 ? "#10b981" : quality >= 40 ? "#f59e0b" : "#f43f5e";
  const qualityLabel = quality >= 70 ? "Отлично" : quality >= 40 ? "Хорошо" : "Добавьте деталей";

  return (
    <div className="min-h-full" style={{ background: "#040404" }}>
      <style>{`
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lp-typing { 0%,100%{opacity:0.25;transform:translateY(0)} 50%{opacity:1;transform:translateY(-1.5px)} }
        @keyframes np-drift  { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-55%) scale(1.08)} }
        .np-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; color:#fff; font-size:14px; outline:none; transition:border-color 0.2s, box-shadow 0.2s; -webkit-appearance:none; }
        .np-input:focus { border-color:rgba(99,102,241,0.45); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }
        .np-input::placeholder { color:rgba(255,255,255,0.2); }
        .new-content-grid { grid-template-columns: 1fr 320px; }
        @media (max-width: 1023px) { .new-content-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .new-content-grid { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>

      {/* Background */}
      <div aria-hidden style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"10%", left:"20%", width:600, height:600, background:"radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)", filter:"blur(80px)", animation:"np-drift 14s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"15%", right:"15%", width:500, height:500, background:"radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)", filter:"blur(70px)", animation:"np-drift 18s ease-in-out infinite reverse" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize:"52px 52px", maskImage:"radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)", WebkitMaskImage:"radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)" }} />
      </div>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ─── HERO ─── */}
        <div style={{ background:"linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"28px 40px 24px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div className="flex flex-wrap items-start gap-6 justify-between">

              {/* Left */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {[
                    { label:"Market Synced",         color:"#10b981", rgb:"16,185,129" },
                    { label:"Financial Models Ready", color:"#3b82f6", rgb:"59,130,246" },
                    { label:"20 AI Directors Online", color:"#8b5cf6", rgb:"139,92,246" },
                    { label:"Competitors Loaded",     color:"#f59e0b", rgb:"245,158,11" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background:`rgba(${s.rgb},0.07)`, border:`1px solid rgba(${s.rgb},0.18)`, fontSize:9, fontWeight:700, color:s.color, letterSpacing:"0.05em" }}>
                      <span style={{ width:4, height:4, borderRadius:"50%", background:s.color, boxShadow:`0 0 5px ${s.color}`, display:"inline-block", animation:"lp-pulse 2s ease-in-out infinite" }} />
                      {s.label}
                    </div>
                  ))}
                </div>

                <h1 className="term-mono" style={{ fontSize:"clamp(22px,2.8vw,32px)", fontWeight:800, color:"#fff", letterSpacing:"0.01em", marginBottom:8 }}>
                  AI BRIEFING<span style={{ color:"rgba(255,255,255,0.25)" }}>_</span>CONSOLE
                </h1>
                <p className="term-mono" style={{ fontSize:12.5, color:"rgba(255,255,255,0.4)", lineHeight:1.6, letterSpacing:"0.03em" }}>
                  // чем подробнее бриф — тем точнее анализ от 20 AI-директоров
                </p>
              </div>

              {/* Right: confidence */}
              <div className="flex items-center gap-4">
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:"#8b5cf6", lineHeight:1 }}>98%</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:4, letterSpacing:"0.1em", textTransform:"uppercase" }}>AI Confidence</div>
                </div>
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:"#10b981", lineHeight:1 }}>~2m</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:4, letterSpacing:"0.1em", textTransform:"uppercase" }}>Analysis Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── STEP TIMELINE ─── */}
        <div style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", padding:"16px 40px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", gap:8 }}>
            {STEP_TIMELINE.map((s, i) => {
              const active   = step === s.id;
              const complete = step > s.id;
              const Icon     = s.icon;
              return (
                <div key={s.id} style={{ display:"contents" }}>
                  <div className="flex items-center gap-2.5" style={{ opacity: active ? 1 : complete ? 0.8 : 0.35 }}>
                    <div style={{
                      width:32, height:32, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      background: complete ? "rgba(16,185,129,0.12)" : active ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                      border: complete ? "1px solid rgba(16,185,129,0.3)" : active ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: complete ? "#10b981" : active ? "#8b5cf6" : "rgba(255,255,255,0.3)",
                    }}>
                      {complete ? <CheckCircle size={14}/> : <Icon size={14}/>}
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color: active ? "#fff" : "rgba(255,255,255,0.55)" }}>{s.label}</div>
                      <div style={{ fontSize:9.5, color:"rgba(255,255,255,0.28)" }}>{s.desc}</div>
                    </div>
                  </div>
                  {i < STEP_TIMELINE.length - 1 && (
                    <div style={{ flex:1, height:1, borderRadius:1, background:"rgba(255,255,255,0.06)", position:"relative", overflow:"hidden" }}>
                      <motion.div animate={{ width: complete ? "100%" : "0%" }} transition={{ duration:0.5 }} style={{ position:"absolute", inset:0, background:"linear-gradient(90deg, #8b5cf6, #10b981)", borderRadius:1 }} />
                    </div>
                  )}
                </div>
              );
            })}
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.22)", marginLeft:"auto", flexShrink:0 }}>{step}/3</span>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="new-content-grid" style={{ maxWidth:1200, margin:"0 auto", padding:"32px 40px", display:"grid", gap:28, alignItems:"start" }}>

          {/* FORM COLUMN */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity:0, x:16 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-16 }}
                transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
              >

                {/* Step 1: Business */}
                {step === 1 && (
                  <div style={{ borderRadius:22, overflow:"hidden", background:"rgba(14,16,21,0.9)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", boxShadow:"0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                    <div style={{ padding:"24px 28px 0" }}>
                      <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#8b5cf6", textTransform:"uppercase", marginBottom:6 }}>Шаг 1 · Business Brief</div>
                      <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", marginBottom:20 }}>Расскажите о вашем бизнесе</h2>
                    </div>

                    <div style={{ padding:"0 28px 28px", display:"flex", flexDirection:"column", gap:20 }}>
                      {/* Name */}
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8, letterSpacing:"0.02em" }}>Название проекта</label>
                        <input
                          type="text"
                          placeholder="например: AI-Powered Fitness Platform"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="np-input"
                          style={{ height:44, padding:"0 16px" }}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", letterSpacing:"0.02em" }}>Описание бизнеса</label>
                          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{form.description.length} симв.</span>
                        </div>

                        {/* Workspace textarea */}
                        <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:`1px solid ${form.description.length > 0 ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.07)"}`, background:"rgba(255,255,255,0.025)", transition:"border-color 0.25s" }}>
                          {/* Hint bubbles */}
                          {form.description.length === 0 && (
                            <div style={{ position:"absolute", top:12, left:14, right:14, display:"flex", flexWrap:"wrap", gap:6, pointerEvents:"none", zIndex:2 }}>
                              {["Опишите проблему","Кто ваши клиенты","Как зарабатываете","Что делает продукт уникальным"].map(h => (
                                <span key={h} style={{ fontSize:10, color:"rgba(255,255,255,0.22)", background:"rgba(139,92,246,0.07)", border:"1px solid rgba(139,92,246,0.15)", borderRadius:6, padding:"3px 8px" }}>
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                          <textarea
                            ref={textareaRef}
                            placeholder=""
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={8}
                            className="np-input"
                            style={{ border:"none", borderRadius:14, padding:"14px 14px 12px", resize:"none", lineHeight:1.65, boxShadow:"none" }}
                          />
                        </div>

                        {/* AI detected entities */}
                        <AnimatePresence>
                          {entities.length > 0 && (
                            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                              <span style={{ fontSize:9.5, color:"rgba(255,255,255,0.3)", fontWeight:600, letterSpacing:"0.08em" }}>AI DETECTED:</span>
                              {entities.map((e, i) => (
                                <motion.span
                                  key={i}
                                  initial={{ scale:0.8, opacity:0 }}
                                  animate={{ scale:1, opacity:1 }}
                                  transition={{ delay: i * 0.06 }}
                                  style={{ fontSize:10, fontWeight:600, color:e.color, background:`${e.color}12`, border:`1px solid ${e.color}25`, borderRadius:6, padding:"2px 8px" }}
                                >
                                  {e.label}: {e.value}
                                </motion.span>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Quality score */}
                        {(form.name.length > 0 || form.description.length > 0) && (
                          <div style={{ marginTop:12, padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:12 }}>
                            <div style={{ flex:1 }}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>Качество описания</span>
                                <span style={{ fontSize:11, fontWeight:800, color:qualityColor }}>{quality}% — {qualityLabel}</span>
                              </div>
                              <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                                <motion.div
                                  animate={{ width:`${quality}%` }}
                                  transition={{ duration:0.5, ease:"easeOut" }}
                                  style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg, rgba(139,92,246,0.6), ${qualityColor})` }}
                                />
                              </div>
                            </div>
                            {quality < 60 && (
                              <div style={{ fontSize:10, color:"rgba(245,158,11,0.8)", maxWidth:160, lineHeight:1.4 }}>
                                Добавьте бизнес-модель и целевую аудиторию
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Market */}
                {step === 2 && (
                  <div style={{ borderRadius:22, overflow:"hidden", background:"rgba(14,16,21,0.9)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", boxShadow:"0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", padding:"24px 28px 28px" }}>
                    <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#3b82f6", textTransform:"uppercase", marginBottom:6 }}>Шаг 2 · Market Context</div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", marginBottom:24 }}>Контекст бизнеса</h2>

                    {/* Industry */}
                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Индустрия</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {INDUSTRIES.map(ind => (
                          <button key={ind} onClick={() => setForm(f => ({ ...f, industry:ind }))}
                            style={{ padding:"6px 12px", borderRadius:9, fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                              background: form.industry === ind ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.035)",
                              border:     form.industry === ind ? "1px solid rgba(59,130,246,0.45)" : "1px solid rgba(255,255,255,0.07)",
                              color:      form.industry === ind ? "#93c5fd" : "rgba(255,255,255,0.45)" }}>{ind}</button>
                        ))}
                      </div>
                    </div>

                    {/* Business Model */}
                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
                        Бизнес-модель <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>(можно несколько)</span>
                      </label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {BIZ_MODELS.map(bm => {
                          const sel = form.bizModels.includes(bm);
                          return (
                            <button key={bm} onClick={() => setForm(f => ({ ...f, bizModels: sel ? f.bizModels.filter(x=>x!==bm) : [...f.bizModels, bm] }))}
                              style={{ padding:"6px 12px", borderRadius:9, fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                                background: sel ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.035)",
                                border:     sel ? "1px solid rgba(139,92,246,0.45)" : "1px solid rgba(255,255,255,0.07)",
                                color:      sel ? "#c4b5fd" : "rgba(255,255,255,0.45)" }}>{bm}</button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage + Team size */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:22 }}>
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Текущая стадия</label>
                        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                          {STAGES.map(stage => {
                            const SIcon = stage.icon;
                            const sel   = form.stage === stage.id;
                            return (
                              <button key={stage.id} onClick={() => setForm(f => ({ ...f, stage: stage.id }))}
                                style={{ padding:"10px 14px", borderRadius:11, textAlign:"left", cursor:"pointer", transition:"all 0.2s",
                                  background: sel ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.025)",
                                  border:     sel ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                                  <SIcon size={12} style={{ color: sel ? "#818cf8" : "rgba(255,255,255,0.3)" }} />
                                  <span style={{ fontSize:11, fontWeight:700, color: sel ? "#c7d2fe" : "rgba(255,255,255,0.6)" }}>{stage.label}</span>
                                </div>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>{stage.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Размер команды</label>
                        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                          {TEAM_SIZES.map(ts => {
                            const sel = form.teamSize === ts.id;
                            return (
                              <button key={ts.id} onClick={() => setForm(f => ({ ...f, teamSize: ts.id }))}
                                style={{ padding:"10px 14px", borderRadius:11, textAlign:"left", cursor:"pointer", transition:"all 0.2s",
                                  background: sel ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.025)",
                                  border:     sel ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                  <span style={{ fontSize:11, fontWeight:700, color: sel ? "#6ee7b7" : "rgba(255,255,255,0.6)" }}>{ts.label} чел.</span>
                                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>{ts.desc}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Geography + Current Revenue */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>География / Целевой рынок</label>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {GEOS.map(g => {
                            const sel = form.geography === g;
                            return (
                              <button key={g} onClick={() => setForm(f => ({ ...f, geography: g }))}
                                style={{ padding:"8px 12px", borderRadius:9, textAlign:"left", cursor:"pointer", transition:"all 0.15s", fontSize:11,
                                  background: sel ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.025)",
                                  border:     sel ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.06)",
                                  color:      sel ? "#fcd34d" : "rgba(255,255,255,0.5)", fontWeight: sel ? 600 : 400 }}>{g}</button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>Текущая выручка</label>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {REVENUES.map(r => {
                            const sel = form.currentRevenue === r;
                            return (
                              <button key={r} onClick={() => setForm(f => ({ ...f, currentRevenue: r }))}
                                style={{ padding:"8px 12px", borderRadius:9, textAlign:"left", cursor:"pointer", transition:"all 0.15s", fontSize:11,
                                  background: sel ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.025)",
                                  border:     sel ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                  color:      sel ? "#fda4af" : "rgba(255,255,255,0.5)", fontWeight: sel ? 600 : 400 }}>{r}</button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Goals & Strategy Context */}
                {step === 3 && (
                  <div style={{ borderRadius:22, overflow:"hidden", background:"rgba(14,16,21,0.9)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", boxShadow:"0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", padding:"24px 28px 28px" }}>
                    <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#10b981", textTransform:"uppercase", marginBottom:6 }}>Шаг 3 · Executive Report</div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", marginBottom:4 }}>Цели и стратегический контекст</h2>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:24 }}>Чем больше деталей — тем точнее AI-анализ от 20 директоров</p>

                    {/* Goals */}
                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>
                        Ключевые цели <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>(можно несколько)</span>
                      </label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {GOALS.map(goal => {
                          const sel = form.goals.includes(goal);
                          return (
                            <button key={goal} onClick={() => handleGoalToggle(goal)}
                              style={{ padding:"6px 12px", borderRadius:9, fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                                background: sel ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.035)",
                                border:     sel ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.07)",
                                color:      sel ? "#10b981" : "rgba(255,255,255,0.45)" }}>
                              {goal}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revenue + timeframe */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:22 }}>
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Целевая выручка</label>
                        <input type="text" placeholder="например: $1M ARR" value={form.targetRevenue} onChange={e => setForm(f => ({ ...f, targetRevenue: e.target.value }))} className="np-input" style={{ height:42, padding:"0 14px" }} />
                      </div>
                      <div>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Таймфрейм</label>
                        <select value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} className="np-input" style={{ height:42, padding:"0 14px", appearance:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)" }}>
                          {[["3","3 месяца"],["6","6 месяцев"],["12","12 месяцев"],["24","24 месяца"],["36","36 месяцев"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Budget */}
                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                        Бюджет на развитие <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>— поможет CFO и CMO составить реалистичный план</span>
                      </label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {["До $5k","$5k–$20k","$20k–$100k","$100k–$500k","$500k–$2M","$2M+","Ищу инвестиции"].map(b => {
                          const sel = form.budget === b;
                          return (
                            <button key={b} onClick={() => setForm(f => ({ ...f, budget: sel ? "" : b }))}
                              style={{ padding:"6px 12px", borderRadius:9, fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                                background: sel ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.035)",
                                border:     sel ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.07)",
                                color:      sel ? "#f59e0b" : "rgba(255,255,255,0.45)" }}>
                              {b}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Competitors */}
                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                        Главные конкуренты <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>— кто уже решает эту задачу?</span>
                      </label>
                      <input
                        type="text"
                        placeholder="например: Notion, Airtable, Monday.com"
                        value={form.competitors}
                        onChange={e => setForm(f => ({ ...f, competitors: e.target.value }))}
                        className="np-input"
                        style={{ height:42, padding:"0 14px" }}
                      />
                    </div>

                    {/* USP */}
                    <div style={{ marginBottom:22 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                        Уникальное преимущество / USP <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>— почему клиент выберет вас?</span>
                      </label>
                      <input
                        type="text"
                        placeholder="например: Единственный продукт с AI + интеграцией в 1С"
                        value={form.usp}
                        onChange={e => setForm(f => ({ ...f, usp: e.target.value }))}
                        className="np-input"
                        style={{ height:42, padding:"0 14px" }}
                      />
                    </div>

                    {/* Challenges */}
                    <div style={{ marginBottom:24 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                        Главные проблемы / боли <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>— что мешает расти прямо сейчас?</span>
                      </label>
                      <textarea
                        placeholder="например: Высокий CAC, сложная интеграция с CRM клиентов, нехватка sales-менеджеров..."
                        value={form.challenges}
                        onChange={e => setForm(f => ({ ...f, challenges: e.target.value }))}
                        className="np-input"
                        rows={3}
                        style={{ padding:"12px 14px", resize:"vertical", minHeight:80, lineHeight:1.6 }}
                      />
                    </div>

                    {/* Summary card */}
                    <div style={{ padding:"16px 18px", borderRadius:14, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", color:"rgba(255,255,255,0.22)", textTransform:"uppercase", marginBottom:12 }}>Резюме брифинга</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                        {([
                          ["Проект",       form.name||"—"],
                          ["Индустрия",    form.industry||"—"],
                          ["Стадия",       STAGES.find(s => s.id===form.stage)?.label||"—"],
                          ["Бизнес-модель",form.bizModels.join(", ")||"—"],
                          ["Команда",      TEAM_SIZES.find(t => t.id===form.teamSize)?.label||"—"],
                          ["География",    form.geography||"—"],
                          ["Выручка сейчас",form.currentRevenue||"—"],
                          ["Цели",         form.goals.join(", ")||"—"],
                          ["Целевая выручка",form.targetRevenue||"—"],
                          ["Таймфрейм",    form.timeframe ? `${form.timeframe} мес.` : "—"],
                          ["Бюджет",       form.budget||"—"],
                          ["Конкуренты",   form.competitors||"—"],
                          ["USP",          form.usp||"—"],
                          ["Боли",         form.challenges||"—"],
                        ] as [string,string][]).map(([k,v]) => v && v !== "—" ? (
                          <div key={k} style={{ display:"flex", gap:10, fontSize:11.5 }}>
                            <span style={{ color:"rgba(255,255,255,0.28)", width:110, flexShrink:0 }}>{k}:</span>
                            <span style={{ color:"rgba(255,255,255,0.65)", wordBreak:"break-word" }}>{v}</span>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16 }}>
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                style={{ height:38, padding:"0 16px", borderRadius:10, fontSize:13, color:"rgba(255,255,255,0.35)", background:"none", border:"1px solid rgba(255,255,255,0.07)", cursor: step===1 ? "not-allowed" : "pointer", opacity: step===1 ? 0 : 1, transition:"opacity 0.2s" }}
              >
                ← Назад
              </button>

              {step < 3 ? (
                <motion.button
                  onClick={() => canNext() && setStep(s => s + 1)}
                  whileHover={{ scale: canNext() ? 1.03 : 1, y: canNext() ? -2 : 0 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    height:42, padding:"0 24px", borderRadius:12, fontSize:13, fontWeight:700, color:"#fff", cursor: canNext() ? "pointer" : "not-allowed",
                    background: canNext() ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(255,255,255,0.06)",
                    border: canNext() ? "none" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: canNext() ? "0 6px 24px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                    opacity: canNext() ? 1 : 0.45,
                    display:"flex", alignItems:"center", gap:8, transition:"background 0.3s",
                  }}
                >
                  Продолжить <ChevronRight size={14} />
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  onHoverStart={() => setBtnHovered(true)}
                  onHoverEnd={() => setBtnHovered(false)}
                  animate={{ scale: btnHovered ? 1.03 : 1, y: btnHovered ? -3 : 0 }}
                  transition={{ duration: 0.25, ease:[0.22,1,0.36,1] }}
                  style={{
                    height:50, padding:"0 32px", borderRadius:14, cursor:"pointer", border:"none",
                    background:"linear-gradient(135deg, #8b5cf6 0%, #3b82f6 60%, #10b981 100%)",
                    boxShadow: btnHovered
                      ? "0 12px 40px rgba(139,92,246,0.6), 0 0 0 1px rgba(139,92,246,0.3)"
                      : "0 8px 28px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                    display:"flex", alignItems:"center", gap:10,
                  }}
                >
                  <Zap size={16} color="white" />
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#fff", lineHeight:1.2 }}>Запустить AI-анализ</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", lineHeight:1.2 }}>Estimated time: ~2 min</div>
                  </div>
                  <ArrowRight size={15} color="rgba(255,255,255,0.7)" style={{ marginLeft:4 }} />
                </motion.button>
              )}
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="space-y-4" style={{ position:"sticky", top:24 }}>

            {/* Live AI team */}
            <div style={{ borderRadius:18, padding:"18px", background:"rgba(14,16,21,0.9)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", maxHeight:"calc(100vh - 80px)", overflowY:"auto" }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>Executive Board</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ width:6, height:6, borderRadius:"50%", background: hasText ? "#10b981" : "rgba(255,255,255,0.25)", boxShadow: hasText ? "0 0 6px rgba(16,185,129,0.8)" : "none", display:"block", animation: hasText ? "lp-pulse 2s ease-in-out infinite" : "none" }} />
                  <span style={{ fontSize:9, fontWeight:700, color: hasText ? "#10b981" : "rgba(255,255,255,0.3)" }}>{hasText ? "LIVE" : "STANDBY"}</span>
                </div>
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:14 }}>
                <span style={{ color:"#818cf8", fontWeight:700 }}>20</span> AI-директоров {hasText ? "анализируют бриф" : "готовы к работе"}
              </div>
              <LiveAgentPanel hasText={hasText} />
            </div>

            {/* AI Tips */}
            <div style={{ borderRadius:18, padding:"16px 18px", background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} style={{ color:"#6366f1" }} />
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(99,102,241,0.9)" }}>AI Tips</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { tip:"Опишите бизнес-модель", ok: form.description.includes("подписка") || form.description.includes("saas") || form.description.includes("subscription") || form.description.length > 100 },
                  { tip:"Укажите целевую аудиторию", ok: form.description.toLowerCase().includes("b2b") || form.description.toLowerCase().includes("клиент") || form.description.length > 150 },
                  { tip:"Опишите конкурентов", ok: form.description.toLowerCase().includes("конкурент") || form.description.length > 250 },
                  { tip:"Добавьте уникальность продукта", ok: form.description.length > 200 },
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div style={{ width:16, height:16, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, background: t.ok ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: t.ok ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                      {t.ok ? <CheckCircle size={9} style={{ color:"#10b981" }} /> : <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.2)" }} />}
                    </div>
                    <span style={{ fontSize:11, color: t.ok ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.38)", lineHeight:1.4, textDecoration: t.ok ? "line-through" : "none" }}>{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview recommendation */}
            {quality >= 30 && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ borderRadius:18, padding:"16px 18px", background:"rgba(16,185,129,0.04)", border:"1px solid rgba(16,185,129,0.12)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={12} style={{ color:"#10b981" }} />
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(16,185,129,0.8)" }}>Предварительный анализ</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label:"Рынок",     value: form.industry ? `${form.industry} — активный` : "Определяю...", color:"#3b82f6" },
                    { label:"Риск",      value: quality > 60 ? "Средний" : "Оцениваю...",                       color:"#f59e0b" },
                    { label:"AI Score",  value: `${quality}% качество брифа`,                                   color:"#8b5cf6" },
                    { label:"Стратегия", value: form.stage ? `Stage: ${form.stage}` : "Определяю...",          color:"#10b981" },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{r.label}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
