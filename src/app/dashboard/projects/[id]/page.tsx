"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Card, CardContent } from "@/components/ui/Card";

const PROJECTS_DATA: Record<string, {
  name: string;
  subtitle: string;
  score: number;
  status: string;
  scores: { label: string; value: number }[];
  summary: string;
  financials: { label: string; value: string }[];
  market: { label: string; value: string }[];
  risks: { level: string; title: string; desc: string }[];
}> = {
  demo: {
    name: "AI-Powered Fitness Platform",
    subtitle: "SaaS · Mobile App · 8 AI Executives",
    score: 87,
    status: "Завершён",
    scores: [
      { label: "Рыночный потенциал", value: 91 },
      { label: "Финансовая устойчивость", value: 83 },
      { label: "Реализуемость", value: 87 },
      { label: "Конкурентное преимущество", value: 79 },
    ],
    summary: "AI-Powered Fitness Platform — высокопотенциальный продукт в быстрорастущем рынке персональных тренировок ($4.2B). Сильная дифференциация через AI-персонализацию. Рекомендуется B2C модель с freemium воронкой и монетизацией через Premium подписку ($19.99/мес).",
    financials: [
      { label: "Прогноз выручки (год 1)", value: "$240K" },
      { label: "Прогноз выручки (год 3)", value: "$2.4M" },
      { label: "Точка безубыточности", value: "18 месяцев" },
      { label: "LTV пользователя", value: "$180" },
      { label: "CAC", value: "$22" },
      { label: "LTV/CAC", value: "8.2x" },
    ],
    market: [
      { label: "Общий рынок (TAM)", value: "$4.2B" },
      { label: "Достижимый рынок (SAM)", value: "$840M" },
      { label: "Целевой рынок (SOM)", value: "$42M" },
      { label: "Рост рынка", value: "+24%/год" },
    ],
    risks: [
      { level: "high", title: "Высокая конкуренция", desc: "MyFitnessPal, Noom, Peloton — крупные игроки с большими бюджетами" },
      { level: "medium", title: "Стоимость привлечения", desc: "CAC может вырасти при масштабировании платных каналов" },
      { level: "low", title: "Технический риск", desc: "AI модели требуют постоянного обучения и данных" },
    ],
  },
  "2": {
    name: "SaaS Invoice Platform",
    subtitle: "SaaS · FinTech · 8 AI Executives",
    score: 91,
    status: "Завершён",
    scores: [
      { label: "Рыночный потенциал", value: 94 },
      { label: "Финансовая устойчивость", value: 90 },
      { label: "Реализуемость", value: 88 },
      { label: "Конкурентное преимущество", value: 85 },
    ],
    summary: "SaaS Invoice Platform решает реальную боль 59M фрилансеров в США. Высокая retention (78%) в категории, предсказуемый MRR. Рекомендуется запуск с фокусом на дизайн-агентства и IT-консультантов как первичный ICP.",
    financials: [
      { label: "Прогноз выручки (год 1)", value: "$180K" },
      { label: "Прогноз выручки (год 3)", value: "$1.8M" },
      { label: "Точка безубыточности", value: "12 месяцев" },
      { label: "LTV пользователя", value: "$540" },
      { label: "CAC", value: "$48" },
      { label: "LTV/CAC", value: "11.2x" },
    ],
    market: [
      { label: "Общий рынок (TAM)", value: "$2.1B" },
      { label: "Достижимый рынок (SAM)", value: "$420M" },
      { label: "Целевой рынок (SOM)", value: "$21M" },
      { label: "Рост рынка", value: "+18%/год" },
    ],
    risks: [
      { level: "medium", title: "FreshBooks / QuickBooks", desc: "Доминирующие игроки с высокой узнаваемостью бренда" },
      { level: "low", title: "Интеграции", desc: "Нужны интеграции с банками и платёжными системами" },
      { level: "low", title: "Регуляторные требования", desc: "Разные требования к счетам в разных странах" },
    ],
  },
  "3": {
    name: "Local Restaurant Chain",
    subtitle: "Restaurant · Food · 5 AI Executives · В процессе",
    score: 72,
    status: "В работе",
    scores: [
      { label: "Рыночный потенциал", value: 75 },
      { label: "Финансовая устойчивость", value: 68 },
      { label: "Реализуемость", value: 74 },
      { label: "Конкурентное преимущество", value: 70 },
    ],
    summary: "Стратегия расширения ресторанной сети анализируется. Умеренный потенциал в конкурентном рынке fast-casual. Анализ ещё не завершён — рекомендуется добавить больше деталей о локациях и целевой аудитории.",
    financials: [
      { label: "Стартовые инвестиции", value: "$350K" },
      { label: "Прогноз выручки (год 1)", value: "Считается…" },
      { label: "Точка безубыточности", value: "Считается…" },
      { label: "Маржинальность", value: "~15-20%" },
      { label: "Food cost %", value: "~28-32%" },
      { label: "Кол-во локаций", value: "3-5" },
    ],
    market: [
      { label: "Общий рынок (TAM)", value: "$890M" },
      { label: "Достижимый рынок (SAM)", value: "$89M" },
      { label: "Целевой рынок (SOM)", value: "$4.5M" },
      { label: "Рост рынка", value: "+9%/год" },
    ],
    risks: [
      { level: "high", title: "Операционная сложность", desc: "Управление несколькими точками требует систем и команды" },
      { level: "high", title: "Высокая конкуренция", desc: "Насыщенный рынок fast-casual с низкими барьерами входа" },
      { level: "medium", title: "Рост аренды", desc: "Стоимость коммерческой недвижимости растёт" },
    ],
  },
};

const TABS = ["Резюме", "Финансы", "Рынок", "Риски"];

const RISK_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};
const RISK_LABELS: Record<string, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };

function buildProjectFromUser(raw: Record<string, string & string[]>): typeof PROJECTS_DATA["demo"] {
  const score = Number(raw.score) || 78;
  return {
    name: String(raw.name),
    subtitle: `${raw.industry || "Бизнес"} · ${raw.stage || "Идея"} · AI Executive Board`,
    score,
    status: "Завершён",
    scores: [
      { label: "Рыночный потенциал", value: Math.min(99, score + 4) },
      { label: "Финансовая устойчивость", value: Math.max(50, score - 6) },
      { label: "Реализуемость", value: Math.min(99, score + 1) },
      { label: "Конкурентное преимущество", value: Math.max(50, score - 8) },
    ],
    summary: `${raw.name} — бизнес-идея в сфере ${raw.industry || "вашей индустрии"}. ${raw.description ? String(raw.description).slice(0, 200) : ""} AI-команда проанализировала проект и подготовила стратегию с учётом рыночных условий, конкурентной среды и ваших целей.`,
    financials: [
      { label: "Прогноз выручки (год 1)", value: raw.revenue ? String(raw.revenue) : `$${(score * 3).toFixed(0)}K` },
      { label: "Точка безубыточности", value: score > 80 ? "14 месяцев" : "20 месяцев" },
      { label: "LTV пользователя", value: `$${(score * 2).toFixed(0)}` },
      { label: "CAC", value: `$${Math.floor(score / 3)}` },
      { label: "LTV/CAC", value: `${(score / 15).toFixed(1)}x` },
      { label: "Таймфрейм", value: `${raw.timeframe || "12"} месяцев` },
    ],
    market: [
      { label: "Общий рынок (TAM)", value: raw.market ? String(raw.market) : `$${score * 50}M` },
      { label: "Достижимый рынок (SAM)", value: `$${score * 10}M` },
      { label: "Целевой рынок (SOM)", value: `$${score}M` },
      { label: "Рост рынка", value: raw.growth ? String(raw.growth) : `+${Math.floor(score / 7)}%/год` },
    ],
    risks: [
      { level: "medium", title: "Конкурентная среда", desc: `В сфере ${raw.industry || "вашей индустрии"} присутствуют устоявшиеся игроки с ресурсами.` },
      { level: score > 80 ? "low" : "medium", title: "Привлечение клиентов", desc: "Стоимость привлечения может вырасти при масштабировании." },
      { level: "low", title: "Операционные риски", desc: "Требуется выстроить процессы и команду до масштабирования." },
    ],
  };
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "demo";
  const [activeTab, setActiveTab] = useState("Резюме");
  const [project, setProject] = useState(PROJECTS_DATA[id] ?? PROJECTS_DATA["demo"]);

  useEffect(() => {
    if (PROJECTS_DATA[id]) return; // встроенный проект
    try {
      const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
      const found = stored.find((p: Record<string, string>) => p.id === id);
      if (found) setProject(buildProjectFromUser(found));
    } catch {}
  }, [id]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Кнопка назад */}
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-5"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Назад к проектам
      </button>

      {/* Шапка */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <Badge variant={project.status === "Завершён" ? "success" : "warning"} dot>{project.status}</Badge>
          </div>
          <p className="text-sm text-white/35">{project.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 text-xs font-medium border border-white/[0.08] text-white/60 hover:text-white rounded-xl transition-all">
            Экспорт PDF
          </button>
          <button className="h-9 px-4 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all">
            Уточнить стратегию
          </button>
        </div>
      </div>

      {/* Бизнес-балл */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-8 flex-wrap mb-6">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-1 ${project.score >= 85 ? "text-emerald-400" : project.score >= 75 ? "text-amber-400" : "text-red-400"}`}>
            {project.score}
          </div>
          <div className="text-xs text-white/35">Бизнес-балл</div>
        </div>
        <div className="flex-1 min-w-0 space-y-2.5">
          {project.scores.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-52 flex-shrink-0">{item.label}</span>
              <Progress value={item.value} size="sm" className="flex-1" />
              <span className="text-xs text-white/50 w-8 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06] mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg transition-all ${activeTab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Резюме" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Краткое резюме стратегии</h2>
            <p className="text-sm text-white/60 leading-relaxed">{project.summary}</p>
          </CardContent>
        </Card>
      )}

      {activeTab === "Финансы" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {project.financials.map((f) => (
            <Card key={f.label} className="p-4">
              <CardContent className="p-0">
                <div className="text-lg font-bold text-white mb-0.5">{f.value}</div>
                <div className="text-xs text-white/35">{f.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "Рынок" && (
        <div className="grid grid-cols-2 gap-4">
          {project.market.map((m) => (
            <Card key={m.label} className="p-5">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-violet-400 mb-1">{m.value}</div>
                <div className="text-xs text-white/40">{m.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "Риски" && (
        <div className="space-y-3">
          {project.risks.map((r) => (
            <div key={r.title} className={`p-4 rounded-xl border ${RISK_COLORS[r.level]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide">{RISK_LABELS[r.level]}</span>
                <span className="text-sm font-semibold text-white">{r.title}</span>
              </div>
              <p className="text-xs text-white/50">{r.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
