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
  "Нанять команду","Exit стратегия",
];
const AGENTS = [
  { role: "CEO",              label: "Генеральный директор",      color: "#7A5CFF", rgb: "122,92,255",  icon: Brain,      name: "Sophia Rivers"  },
  { role: "CFO",              label: "Финансовый директор",       color: "#5A8DFF", rgb: "90,141,255",  icon: DollarSign, name: "Marcus Chen"    },
  { role: "CMO",              label: "Директор по маркетингу",    color: "#00E7A7", rgb: "0,231,167",   icon: TrendingUp, name: "Elena Torres"   },
  { role: "COO",              label: "Операционный директор",     color: "#FFB800", rgb: "255,184,0",   icon: Activity,   name: "James Wright"   },
  { role: "CTO",              label: "Технический директор",      color: "#a78bfa", rgb: "167,139,250", icon: Cpu,        name: "Aiden Park"     },
  { role: "Business Analyst", label: "Бизнес-аналитик",          color: "#FF5470", rgb: "255,84,112",  icon: BarChart2,  name: "Kim Park"       },
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
  { role: "Strategy Advisor", label: "Стратегический советник",  color: "#7A5CFF", rgb: "122,92,255",  icon: Zap,        name: "Diana Wells"    },
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
    entities.push({ label: "Модель", value: "SaaS", color: "#7A5CFF" });
  if (t.includes("b2b") || t.includes("бизнес") || t.includes("корпоратив") || t.includes("enterprise"))
    entities.push({ label: "Аудитория", value: "B2B", color: "#5A8DFF" });
  if (t.includes("b2c") || t.includes("потребител") || t.includes("пользовател"))
    entities.push({ label: "Аудитория", value: "B2C", color: "#00E7A7" });
  if (t.includes("mobile") || t.includes("мобильн") || t.includes("приложени"))
    entities.push({ label: "Платформа", value: "Mobile", color: "#FFB800" });
  if (t.includes("маркетплейс") || t.includes("marketplace") || t.includes("платформ"))
    entities.push({ label: "Тип", value: "Marketplace", color: "#FF5470" });
  if (t.includes("ai") || t.includes("искусственн") || t.includes("нейро") || t.includes("machine"))
    entities.push({ label: "Технология", value: "AI/ML", color: "#a78bfa" });
  if (t.includes("fintech") || t.includes("банк") || t.includes("платёж") || t.includes("финанс"))
    entities.push({ label: "Сектор", value: "FinTech", color: "#34d399" });
  if (t.includes("конкурент") || t.includes("competitor") || t.includes("рынок"))
    entities.push({ label: "Анализ", value: "Competitive", color: "#5A8DFF" });

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
    <div className="space-y-1.5">
      {AGENTS.map((a) => {
        const Icon = a.icon;
        const active = hasText;
        return (
          <motion.div
            key={a.role}
            animate={{ borderColor: pulses[a.role] ? `rgba(${a.rgb},0.4)` : `rgba(${a.rgb},0.12)` }}
            style={{
              borderRadius: 14,
              padding:      "10px 12px",
              background:   `rgba(${a.rgb},0.04)`,
              border:       `1px solid rgba(${a.rgb},0.12)`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div style={{
                width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: `rgba(${a.rgb},0.12)`, border: `1px solid rgba(${a.rgb},0.22)`, color: a.color,
              }}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{a.name}</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", marginTop: 1, fontFamily: "ui-monospace, monospace" }}>
                  {active ? (thoughts[a.role] || "Ожидает данных...") : "Ожидает брифинга..."}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 9, color: active ? a.color : "rgba(255,255,255,0.18)", fontWeight: 600 }}>
                  {active ? a.role : "—"}
                </span>
                <span
                  style={{
                    width: 6, height: 6, borderRadius: "50%", display: "block",
                    background: active ? a.color : "rgba(255,255,255,0.12)",
                    boxShadow:  active ? `0 0 6px rgba(${a.rgb},0.8)` : "none",
                    animation:  active ? "lp-pulse 1.6s ease-in-out infinite" : "none",
                  }}
                />
              </div>
            </div>
            {active && (
              <div style={{ marginTop: 7, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, rgba(${a.rgb},0.4), ${a.color})` }}
                  animate={{ width: ["20%", "75%", "35%", "88%", "45%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Cinematic analyzing screen ───────────────────────────────────────────────

interface AgentResult {
  role: string; title: string; summary: string; analysis: string;
  facts: string; risks: string; recommendations: string;
  confidence: string; score: number;
}

function AnalyzingScreen({ doneAgents, agentResults }: { doneAgents: Set<string>; agentResults: AgentResult[] }) {
  const doneCount = doneAgents.size;
  const progress  = Math.round((doneCount / AGENTS.length) * 100);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(122,92,255,0.12) 0%, #040404 60%)" }}
    >
      <style>{`@keyframes an-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes an-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

      {/* Central orb */}
      <div className="relative mb-10">
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #7A5CFF, #5A8DFF)", boxShadow: "0 0 60px rgba(122,92,255,0.5), 0 0 120px rgba(122,92,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={32} color="white" />
        </div>
        <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "1px solid rgba(122,92,255,0.3)", animation: "an-spin 4s linear infinite" }} />
        <div style={{ position: "absolute", inset: -22, borderRadius: "50%", border: "1px dashed rgba(90,141,255,0.15)", animation: "an-spin 8s linear infinite reverse" }} />
      </div>

      <div className="text-center mb-8">
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Executive Board в работе
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)" }}>
          20 AI-директоров анализируют проект параллельно
        </p>
      </div>

      {/* Progress */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 32 }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Прогресс анализа</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7A5CFF" }}>{doneCount} / {AGENTS.length} агентов</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #7A5CFF, #5A8DFF, #00E7A7)" }}
          />
        </div>
      </div>

      {/* Agent grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, width: "100%", maxWidth: 860 }}>
        {AGENTS.map((agent) => {
          const done   = doneAgents.has(agent.role);
          const result = agentResults.find(r => r.role === agent.role);
          const Icon   = agent.icon;
          return (
            <motion.div
              key={agent.role}
              animate={{ borderColor: done ? `rgba(${agent.rgb},0.35)` : `rgba(255,255,255,0.06)` }}
              style={{
                padding:    "12px 14px",
                borderRadius: 14,
                background: done ? `rgba(${agent.rgb},0.06)` : "rgba(255,255,255,0.025)",
                border:     `1px solid rgba(255,255,255,0.06)`,
                transition: "background 0.4s",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${agent.rgb},0.1)`, border: `1px solid rgba(${agent.rgb},0.2)`, color: agent.color, flexShrink: 0 }}>
                  {done
                    ? <CheckCircle size={13} />
                    : <Icon size={13} style={{ animation: "an-pulse 1.4s ease-in-out infinite" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{agent.name}</div>
                  <div style={{ fontSize: 10, marginTop: 1 }}>
                    {done
                      ? <span style={{ color: agent.color, fontWeight: 700 }}>Балл: {result?.score ?? "—"}</span>
                      : <span style={{ color: "rgba(255,255,255,0.28)", fontFamily: "ui-monospace, monospace" }}>Анализирует…</span>
                    }
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {doneCount === AGENTS.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginTop: 24, padding: "16px 24px", borderRadius: 16, background: "rgba(0,231,167,0.08)", border: "1px solid rgba(0,231,167,0.25)", textAlign: "center" }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#00E7A7", marginBottom: 4 }}>Анализ завершён ✓</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Перехожу к результатам…</div>
        </motion.div>
      )}
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
    goals: [] as string[], targetRevenue: "", timeframe: "12",
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

  const qualityColor = quality >= 70 ? "#00E7A7" : quality >= 40 ? "#FFB800" : "#FF5470";
  const qualityLabel = quality >= 70 ? "Отлично" : quality >= 40 ? "Хорошо" : "Добавьте деталей";

  return (
    <div className="min-h-full" style={{ background: "#040404" }}>
      <style>{`
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes np-drift  { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-55%) scale(1.08)} }
        .np-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; color:#fff; font-size:14px; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .np-input:focus { border-color:rgba(122,92,255,0.45); box-shadow:0 0 0 3px rgba(122,92,255,0.08); }
        .np-input::placeholder { color:rgba(255,255,255,0.2); }
      `}</style>

      {/* Background */}
      <div aria-hidden style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"10%", left:"20%", width:600, height:600, background:"radial-gradient(circle, rgba(122,92,255,0.08) 0%, transparent 65%)", filter:"blur(80px)", animation:"np-drift 14s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"15%", right:"15%", width:500, height:500, background:"radial-gradient(circle, rgba(90,141,255,0.06) 0%, transparent 65%)", filter:"blur(70px)", animation:"np-drift 18s ease-in-out infinite reverse" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize:"52px 52px", maskImage:"radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)", WebkitMaskImage:"radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)" }} />
      </div>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ─── HERO ─── */}
        <div style={{ background:"linear-gradient(180deg, rgba(122,92,255,0.06) 0%, transparent 100%)", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"28px 40px 24px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div className="flex flex-wrap items-start gap-6 justify-between">

              {/* Left */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {[
                    { label:"Market Synced",         color:"#00E7A7", rgb:"0,231,167" },
                    { label:"Financial Models Ready", color:"#5A8DFF", rgb:"90,141,255" },
                    { label:"20 AI Directors Online", color:"#7A5CFF", rgb:"122,92,255" },
                    { label:"Competitors Loaded",     color:"#FFB800", rgb:"255,184,0" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background:`rgba(${s.rgb},0.07)`, border:`1px solid rgba(${s.rgb},0.18)`, fontSize:9, fontWeight:700, color:s.color, letterSpacing:"0.05em" }}>
                      <span style={{ width:4, height:4, borderRadius:"50%", background:s.color, boxShadow:`0 0 5px ${s.color}`, display:"inline-block", animation:"lp-pulse 2s ease-in-out infinite" }} />
                      {s.label}
                    </div>
                  ))}
                </div>

                <h1 style={{ fontSize:"clamp(22px,2.8vw,34px)", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:8 }}>
                  AI Briefing{" "}
                  <span style={{ background:"linear-gradient(135deg, #7A5CFF, #5A8DFF, #00E7A7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    Command Center
                  </span>
                </h1>
                <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", lineHeight:1.6 }}>
                  Чем подробнее бриф — тем точнее анализ от 8 AI-директоров.
                </p>
              </div>

              {/* Right: confidence */}
              <div className="flex items-center gap-4">
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background:"rgba(122,92,255,0.08)", border:"1px solid rgba(122,92,255,0.2)" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:"#7A5CFF", lineHeight:1 }}>98%</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:4, letterSpacing:"0.1em", textTransform:"uppercase" }}>AI Confidence</div>
                </div>
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background:"rgba(0,231,167,0.06)", border:"1px solid rgba(0,231,167,0.15)" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:"#00E7A7", lineHeight:1 }}>~2m</div>
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
                      background: complete ? "rgba(0,231,167,0.12)" : active ? "rgba(122,92,255,0.18)" : "rgba(255,255,255,0.04)",
                      border: complete ? "1px solid rgba(0,231,167,0.3)" : active ? "1px solid rgba(122,92,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: complete ? "#00E7A7" : active ? "#7A5CFF" : "rgba(255,255,255,0.3)",
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
                      <motion.div animate={{ width: complete ? "100%" : "0%" }} transition={{ duration:0.5 }} style={{ position:"absolute", inset:0, background:"linear-gradient(90deg, #7A5CFF, #00E7A7)", borderRadius:1 }} />
                    </div>
                  )}
                </div>
              );
            })}
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.22)", marginLeft:"auto", flexShrink:0 }}>{step}/3</span>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 40px", display:"grid", gridTemplateColumns:"1fr 320px", gap:28, alignItems:"start" }}>

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
                      <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#7A5CFF", textTransform:"uppercase", marginBottom:6 }}>Шаг 1 · Business Brief</div>
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
                        <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:`1px solid ${form.description.length > 0 ? "rgba(122,92,255,0.35)" : "rgba(255,255,255,0.07)"}`, background:"rgba(255,255,255,0.025)", transition:"border-color 0.25s" }}>
                          {/* Hint bubbles */}
                          {form.description.length === 0 && (
                            <div style={{ position:"absolute", top:12, left:14, right:14, display:"flex", flexWrap:"wrap", gap:6, pointerEvents:"none", zIndex:2 }}>
                              {["Опишите проблему","Кто ваши клиенты","Как зарабатываете","Что делает продукт уникальным"].map(h => (
                                <span key={h} style={{ fontSize:10, color:"rgba(255,255,255,0.22)", background:"rgba(122,92,255,0.07)", border:"1px solid rgba(122,92,255,0.15)", borderRadius:6, padding:"3px 8px" }}>
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
                                  style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg, rgba(122,92,255,0.6), ${qualityColor})` }}
                                />
                              </div>
                            </div>
                            {quality < 60 && (
                              <div style={{ fontSize:10, color:"rgba(255,184,0,0.8)", maxWidth:160, lineHeight:1.4 }}>
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
                    <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#5A8DFF", textTransform:"uppercase", marginBottom:6 }}>Шаг 2 · Market Context</div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", marginBottom:24 }}>Контекст бизнеса</h2>

                    {/* Industry */}
                    <div style={{ marginBottom:24 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>Индустрия</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {INDUSTRIES.map(ind => (
                          <button
                            key={ind}
                            onClick={() => setForm(f => ({ ...f, industry:ind }))}
                            style={{
                              padding:"6px 12px", borderRadius:9, fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                              background: form.industry === ind ? "rgba(122,92,255,0.2)" : "rgba(255,255,255,0.035)",
                              border:     form.industry === ind ? "1px solid rgba(122,92,255,0.5)" : "1px solid rgba(255,255,255,0.07)",
                              color:      form.industry === ind ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                            }}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stage */}
                    <div>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>Текущая стадия</label>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {STAGES.map(stage => {
                          const SIcon = stage.icon;
                          const sel   = form.stage === stage.id;
                          return (
                            <button
                              key={stage.id}
                              onClick={() => setForm(f => ({ ...f, stage: stage.id }))}
                              style={{
                                padding:"14px 16px", borderRadius:14, textAlign:"left", cursor:"pointer", transition:"all 0.2s",
                                background: sel ? "rgba(122,92,255,0.1)" : "rgba(255,255,255,0.025)",
                                border:     sel ? "1px solid rgba(122,92,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <SIcon size={13} style={{ color: sel ? "#7A5CFF" : "rgba(255,255,255,0.3)" }} />
                                <span style={{ fontSize:12, fontWeight:700, color: sel ? "#c4b5fd" : "rgba(255,255,255,0.62)" }}>{stage.label}</span>
                              </div>
                              <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)" }}>{stage.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Goals */}
                {step === 3 && (
                  <div style={{ borderRadius:22, overflow:"hidden", background:"rgba(14,16,21,0.9)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", boxShadow:"0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)", padding:"24px 28px 28px" }}>
                    <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", color:"#00E7A7", textTransform:"uppercase", marginBottom:6 }}>Шаг 3 · Executive Report</div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", marginBottom:24 }}>Цели и параметры</h2>

                    {/* Goals */}
                    <div style={{ marginBottom:24 }}>
                      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>
                        Ключевые цели <span style={{ color:"rgba(255,255,255,0.22)", fontWeight:400 }}>(можно несколько)</span>
                      </label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                        {GOALS.map(goal => {
                          const sel = form.goals.includes(goal);
                          return (
                            <button key={goal} onClick={() => handleGoalToggle(goal)}
                              style={{ padding:"6px 12px", borderRadius:9, fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.15s",
                                background: sel ? "rgba(0,231,167,0.12)" : "rgba(255,255,255,0.035)",
                                border:     sel ? "1px solid rgba(0,231,167,0.3)" : "1px solid rgba(255,255,255,0.07)",
                                color:      sel ? "#00E7A7" : "rgba(255,255,255,0.45)" }}>
                              {goal}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revenue + timeframe */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
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

                    {/* Summary card */}
                    <div style={{ padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", color:"rgba(255,255,255,0.22)", textTransform:"uppercase", marginBottom:10 }}>Резюме брифинга</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {[["Проект", form.name||"—"], ["Индустрия", form.industry||"—"], ["Стадия", STAGES.find(s => s.id===form.stage)?.label||"—"], ["Цели", form.goals.join(", ")||"—"]].map(([k,v]) => (
                          <div key={k} style={{ display:"flex", gap:10, fontSize:12 }}>
                            <span style={{ color:"rgba(255,255,255,0.28)", width:72, flexShrink:0 }}>{k}:</span>
                            <span style={{ color:"rgba(255,255,255,0.65)" }}>{v}</span>
                          </div>
                        ))}
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
                    background: canNext() ? "linear-gradient(135deg, #7A5CFF, #5A8DFF)" : "rgba(255,255,255,0.06)",
                    border: canNext() ? "none" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: canNext() ? "0 6px 24px rgba(122,92,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
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
                    background:"linear-gradient(135deg, #7A5CFF 0%, #5A8DFF 60%, #00E7A7 100%)",
                    boxShadow: btnHovered
                      ? "0 12px 40px rgba(122,92,255,0.6), 0 0 0 1px rgba(122,92,255,0.3)"
                      : "0 8px 28px rgba(122,92,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
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
            <div style={{ borderRadius:18, padding:"18px", background:"rgba(14,16,21,0.9)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)" }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>Executive Board</span>
                <div className="flex items-center gap-1.5">
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#00E7A7", boxShadow:"0 0 6px rgba(0,231,167,0.8)", display:"block", animation:"lp-pulse 2s ease-in-out infinite" }} />
                  <span style={{ fontSize:9, fontWeight:700, color:"#00E7A7" }}>LIVE</span>
                </div>
              </div>
              <LiveAgentPanel hasText={hasText} />
            </div>

            {/* AI Tips */}
            <div style={{ borderRadius:18, padding:"16px 18px", background:"rgba(122,92,255,0.06)", border:"1px solid rgba(122,92,255,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} style={{ color:"#7A5CFF" }} />
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(122,92,255,0.9)" }}>AI Tips</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { tip:"Опишите бизнес-модель", ok: form.description.includes("подписка") || form.description.includes("saas") || form.description.includes("subscription") || form.description.length > 100 },
                  { tip:"Укажите целевую аудиторию", ok: form.description.toLowerCase().includes("b2b") || form.description.toLowerCase().includes("клиент") || form.description.length > 150 },
                  { tip:"Опишите конкурентов", ok: form.description.toLowerCase().includes("конкурент") || form.description.length > 250 },
                  { tip:"Добавьте уникальность продукта", ok: form.description.length > 200 },
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div style={{ width:16, height:16, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, background: t.ok ? "rgba(0,231,167,0.15)" : "rgba(255,255,255,0.05)", border: t.ok ? "1px solid rgba(0,231,167,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                      {t.ok ? <CheckCircle size={9} style={{ color:"#00E7A7" }} /> : <div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,0.2)" }} />}
                    </div>
                    <span style={{ fontSize:11, color: t.ok ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.38)", lineHeight:1.4, textDecoration: t.ok ? "line-through" : "none" }}>{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview recommendation */}
            {quality >= 30 && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ borderRadius:18, padding:"16px 18px", background:"rgba(0,231,167,0.04)", border:"1px solid rgba(0,231,167,0.12)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={12} style={{ color:"#00E7A7" }} />
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(0,231,167,0.8)" }}>Предварительный анализ</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label:"Рынок",     value: form.industry ? `${form.industry} — активный` : "Определяю...", color:"#5A8DFF" },
                    { label:"Риск",      value: quality > 60 ? "Средний" : "Оцениваю...",                       color:"#FFB800" },
                    { label:"AI Score",  value: `${quality}% качество брифа`,                                   color:"#7A5CFF" },
                    { label:"Стратегия", value: form.stage ? `Stage: ${form.stage}` : "Определяю...",          color:"#00E7A7" },
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
