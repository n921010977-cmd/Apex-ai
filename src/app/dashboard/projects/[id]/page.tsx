"use client";

import { useState, useEffect, useRef } from "react";
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
  financials: { label: string; value: string; numeric?: number }[];
  market: { label: string; value: string; numeric?: number }[];
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
      { label: "Прогноз выручки (год 1)", value: "$240K", numeric: 240 },
      { label: "Прогноз выручки (год 3)", value: "$2.4M", numeric: 2400 },
      { label: "Точка безубыточности", value: "18 месяцев" },
      { label: "LTV пользователя", value: "$180" },
      { label: "CAC", value: "$22" },
      { label: "LTV/CAC", value: "8.2x" },
    ],
    market: [
      { label: "TAM (общий рынок)", value: "$4.2B", numeric: 4200 },
      { label: "SAM (достижимый)", value: "$840M", numeric: 840 },
      { label: "SOM (целевой)", value: "$42M", numeric: 42 },
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
      { label: "Прогноз выручки (год 1)", value: "$180K", numeric: 180 },
      { label: "Прогноз выручки (год 3)", value: "$1.8M", numeric: 1800 },
      { label: "Точка безубыточности", value: "12 месяцев" },
      { label: "LTV пользователя", value: "$540" },
      { label: "CAC", value: "$48" },
      { label: "LTV/CAC", value: "11.2x" },
    ],
    market: [
      { label: "TAM (общий рынок)", value: "$2.1B", numeric: 2100 },
      { label: "SAM (достижимый)", value: "$420M", numeric: 420 },
      { label: "SOM (целевой)", value: "$21M", numeric: 21 },
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
      { label: "Маржинальность", value: "~15-20%" },
      { label: "Food cost %", value: "~28-32%" },
    ],
    market: [
      { label: "TAM (общий рынок)", value: "$890M", numeric: 890 },
      { label: "SAM (достижимый)", value: "$89M", numeric: 89 },
      { label: "SOM (целевой)", value: "$4.5M", numeric: 4.5 },
      { label: "Рост рынка", value: "+9%/год" },
    ],
    risks: [
      { level: "high", title: "Операционная сложность", desc: "Управление несколькими точками требует систем и команды" },
      { level: "high", title: "Высокая конкуренция", desc: "Насыщенный рынок fast-casual с низкими барьерами входа" },
      { level: "medium", title: "Рост аренды", desc: "Стоимость коммерческой недвижимости растёт" },
    ],
  },
};

const TABS = ["Резюме", "AI Команда", "Финансы", "Рынок", "Риски"];

const AGENT_COLORS: Record<string, string> = {
  "CEO": "#7c3aed", "CFO": "#3b82f6", "CMO": "#10b981",
  "COO": "#f59e0b", "Business Analyst": "#f97316",
  "CTO": "#ec4899", "Sales Director": "#6366f1", "Legal Advisor": "#64748b",
};

const RISK_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};
const RISK_LABELS: Record<string, string> = { high: "Высокий", medium: "Средний", low: "Низкий" };
const RISK_ICONS: Record<string, string> = { high: "⚠", medium: "◈", low: "◉" };

// SVG Bar chart for market data
function MarketBarChart({ items }: { items: { label: string; value: string; numeric?: number }[] }) {
  const numericItems = items.filter(i => i.numeric !== undefined);
  if (numericItems.length < 2) return null;
  const max = Math.max(...numericItems.map(i => i.numeric!));
  const colors = ["#7c3aed", "#3b82f6", "#10b981"];
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Размер рынка (визуализация)</div>
      <div className="space-y-3">
        {numericItems.map((item, idx) => {
          const pct = (item.numeric! / max) * 100;
          return (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white/50">{item.label}</span>
                <span className="text-xs font-bold" style={{ color: colors[idx] || "#7c3aed" }}>{item.value}</span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[idx] || "#7c3aed"}, ${colors[idx] || "#7c3aed"}88)` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Score radar chart using SVG
function ScoreRadar({ scores }: { scores: { label: string; value: number }[] }) {
  const cx = 100; const cy = 100; const r = 70;
  const n = scores.length;
  const points = scores.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const frac = s.value / 100;
    return { x: cx + Math.cos(angle) * r * frac, y: cy + Math.sin(angle) * r * frac, lx: cx + Math.cos(angle) * (r + 18), ly: cy + Math.sin(angle) * (r + 18) };
  });
  const gridPoints = (frac: number) => scores.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return `${cx + Math.cos(angle) * r * frac},${cy + Math.sin(angle) * r * frac}`;
  }).join(" ");
  const dataPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {[0.25, 0.5, 0.75, 1].map(frac => (
          <polygon key={frac} points={gridPoints(frac)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {scores.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}
        <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(124,58,237,0.2)" stroke="#7c3aed" strokeWidth="1.5" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#7c3aed" />
        ))}
      </svg>
    </div>
  );
}

// Financial bar chart
function FinancialChart({ financials }: { financials: { label: string; value: string; numeric?: number }[] }) {
  const items = financials.filter(f => f.numeric !== undefined);
  if (items.length < 2) return null;
  const max = Math.max(...items.map(i => i.numeric!));
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Прогноз выручки</div>
      <div className="flex items-end gap-4 h-28">
        {items.map((item, idx) => {
          const pct = (item.numeric! / max) * 100;
          const color = idx === 0 ? "#3b82f6" : "#7c3aed";
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-bold" style={{ color }}>{item.value}</span>
              <div className="w-full rounded-t-lg transition-all duration-700 relative" style={{ height: `${Math.max(8, pct)}%`, background: `linear-gradient(180deg, ${color}, ${color}55)` }} />
              <span className="text-[9px] text-white/30 text-center leading-tight">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ProjectData = typeof PROJECTS_DATA["demo"];

function buildProjectFromUser(raw: Record<string, unknown>): ProjectData {
  const score = Number(raw.score) || 78;
  // Format revenue safely
  const rawRevenue = raw.revenue ? String(raw.revenue) : null;
  const revenueDisplay = rawRevenue && rawRevenue.length > 0 && rawRevenue !== "0"
    ? rawRevenue.startsWith("$") ? rawRevenue : `$${rawRevenue}`
    : `$${(score * 3).toFixed(0)}K`;
  const rev1Numeric = score * 3;
  const rev3Numeric = score * 30;

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
      { label: "Прогноз выручки (год 1)", value: revenueDisplay, numeric: rev1Numeric },
      { label: "Прогноз выручки (год 3)", value: `$${(rev3Numeric / 1000).toFixed(1)}M`, numeric: rev3Numeric },
      { label: "Точка безубыточности", value: score > 80 ? "14 месяцев" : "20 месяцев" },
      { label: "LTV пользователя", value: `$${(score * 2).toFixed(0)}` },
      { label: "CAC", value: `$${Math.floor(score / 3)}` },
      { label: "LTV/CAC", value: `${(score / 15).toFixed(1)}x` },
      { label: "Таймфрейм", value: `${raw.timeframe || "12"} месяцев` },
    ],
    market: [
      { label: "TAM (общий рынок)", value: raw.market ? String(raw.market) : `$${(score * 50).toFixed(0)}M`, numeric: score * 50 },
      { label: "SAM (достижимый)", value: `$${(score * 10).toFixed(0)}M`, numeric: score * 10 },
      { label: "SOM (целевой)", value: `$${score}M`, numeric: score },
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
  const [project, setProject] = useState<ProjectData>(PROJECTS_DATA[id] ?? PROJECTS_DATA["demo"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [activeAgent, setActiveAgent] = useState<string>("CEO");
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeProgress, setReanalyzeProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawProject, setRawProject] = useState<Record<string, any> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isUserProject = !PROJECTS_DATA[id];

  useEffect(() => {
    if (!isUserProject) return;
    try {
      const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = stored.find((p: any) => p.id === id);
      if (found) {
        setRawProject(found);
        setProject(buildProjectFromUser(found));
        if (found.aiResults && found.aiResults.length > 0) setAiResults(found.aiResults);
      }
    } catch {}
  }, [id, isUserProject]);

  async function handleReanalyze() {
    if (!rawProject) return;
    setIsReanalyzing(true);
    setReanalyzeProgress(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collected: any[] = [];

    abortRef.current = new AbortController();
    try {
      const brief = {
        name: rawProject.name || "",
        description: rawProject.description || "",
        industry: rawProject.industry || "",
        stage: rawProject.stage || "",
        goals: rawProject.goals || [],
        targetRevenue: rawProject.targetRevenue || "",
        timeframe: rawProject.timeframe || "12",
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "agent_done") {
              collected.push(evt.result);
              setReanalyzeProgress(collected.length);
              setAiResults([...collected]);
            }
            if (evt.type === "complete") {
              // Update score in project
              setProject(prev => ({ ...prev, score: evt.overallScore }));
              // Save to localStorage
              try {
                const stored = JSON.parse(localStorage.getItem("apex-user-projects") || "[]");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updated = stored.map((p: any) =>
                  p.id === id ? { ...p, aiResults: evt.results, score: evt.overallScore } : p
                );
                localStorage.setItem("apex-user-projects", JSON.stringify(updated));
              } catch {}
            }
          } catch {}
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setIsReanalyzing(false);
    }
  }

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
          {isUserProject && (
            <button
              onClick={() => { setActiveTab("AI Команда"); handleReanalyze(); }}
              disabled={isReanalyzing}
              className="h-9 px-4 text-xs font-medium border border-violet-500/30 text-violet-400 hover:bg-violet-600/10 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isReanalyzing ? (
                <>
                  <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
                    <path d="M21 12a9 9 0 00-9-9"/>
                  </svg>
                  {reanalyzeProgress}/8 агентов
                </>
              ) : "↻ Обновить анализ"}
            </button>
          )}
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
        <ScoreRadar scores={project.scores} />
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

      {/* ── Резюме ── */}
      {activeTab === "Резюме" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Краткое резюме стратегии</h2>
            <p className="text-sm text-white/60 leading-relaxed">{project.summary}</p>
            {aiResults.length > 0 && (() => {
              const ceo = aiResults.find(r => r.role === "CEO");
              return ceo ? (
                <div className="mt-5 pt-5 border-t border-white/[0.06]">
                  <div className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-widest mb-2">Вывод CEO</div>
                  <p className="text-sm text-white/55 leading-relaxed">{ceo.summary}</p>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* ── AI Команда ── */}
      {activeTab === "AI Команда" && (
        aiResults.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Agent list */}
            <div className="space-y-1.5">
              {aiResults.map((r) => {
                const color = AGENT_COLORS[r.role] ?? "#7c3aed";
                const isActive = activeAgent === r.role;
                const CONF_DOT: Record<string, string> = { высокая: "bg-emerald-400", средняя: "bg-amber-400", низкая: "bg-red-400" };
                return (
                  <button
                    key={r.role}
                    onClick={() => setActiveAgent(r.role)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${isActive ? "border-violet-500/40 bg-violet-600/10" : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <span style={{ color }}>{r.role[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-white">{r.role}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`size-1.5 rounded-full ${CONF_DOT[r.confidence] ?? "bg-white/20"}`} />
                          <span className="text-[10px] text-white/30 truncate">{r.title}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color }}>{r.score}</div>
                        <div className="text-[9px] text-white/25">балл</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Average score card */}
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Средний балл команды</div>
                <div className="text-xl font-bold text-violet-400">
                  {Math.round(aiResults.reduce((s, r) => s + r.score, 0) / aiResults.length)}
                </div>
                <Progress value={Math.round(aiResults.reduce((s, r) => s + r.score, 0) / aiResults.length)} size="sm" className="mt-1.5" />
              </div>
            </div>

            {/* Agent detail */}
            <div className="xl:col-span-2">
              {(() => {
                const r = aiResults.find((x) => x.role === activeAgent);
                if (!r) return null;
                const color = AGENT_COLORS[r.role] ?? "#7c3aed";
                const CONF_COLOR: Record<string, string> = { высокая: "text-emerald-400", средняя: "text-amber-400", низкая: "text-red-400" };
                return (
                  <Card>
                    <CardContent className="p-5 space-y-5">
                      {/* Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
                        <div className="size-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: `${color}20`, border: `1px solid ${color}30`, color }}>
                          {r.role[0]}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white">{r.role}</div>
                          <div className="text-xs text-white/40">{r.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color }}>{r.score}</div>
                          <div className={`text-[10px] font-medium ${CONF_COLOR[r.confidence] ?? "text-white/50"}`}>
                            {r.confidence} уверенность
                          </div>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-white/30 mb-1">
                          <span>Оценка специалиста</span>
                          <span>{r.score}/100</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                        </div>
                      </div>

                      {[
                        { label: "Краткий вывод", text: r.summary, icon: "◆" },
                        { label: "Детальный анализ", text: r.analysis, icon: "◈" },
                        { label: "Факты и предположения", text: r.facts, icon: "◉" },
                        { label: "Риски и ограничения", text: r.risks, icon: "⚠" },
                        { label: "Рекомендации", text: r.recommendations, icon: "→" },
                      ].map((sec) => sec.text ? (
                        <div key={sec.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-[10px]" style={{ color }}>{sec.icon}</span>
                            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{sec.label}</div>
                          </div>
                          <p className="text-[13px] text-white/65 leading-relaxed whitespace-pre-line">{sec.text}</p>
                        </div>
                      ) : null)}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="size-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-2xl mx-auto mb-4">
                🤖
              </div>
              <div className="text-sm font-semibold text-white mb-2">AI-анализ ещё не запущен</div>
              <p className="text-xs text-white/30 mb-5 max-w-xs mx-auto">
                Этот проект был создан до подключения AI-движка. Запустите анализ, чтобы получить полный разбор от 8 специалистов.
              </p>
              {isUserProject ? (
                <button
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="h-9 px-6 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isReanalyzing ? (
                    <>
                      <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
                        <path d="M21 12a9 9 0 00-9-9"/>
                      </svg>
                      Анализируем… {reanalyzeProgress}/8
                    </>
                  ) : "Запустить AI-анализ"}
                </button>
              ) : (
                <p className="text-xs text-white/20">Демо-проект: анализ встроен</p>
              )}
              {isReanalyzing && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full transition-all duration-300" style={{ width: `${(reanalyzeProgress / 8) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">{reanalyzeProgress} из 8 специалистов завершили анализ</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      )}

      {/* ── Финансы ── */}
      {activeTab === "Финансы" && (
        <div className="space-y-5">
          <FinancialChart financials={project.financials} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {project.financials.map((f) => (
              <Card key={f.label} className="p-4">
                <CardContent className="p-0">
                  <div className="text-lg font-bold text-white mb-0.5">{f.value}</div>
                  <div className="text-xs text-white/35">{f.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* CFO analysis if available */}
          {aiResults.length > 0 && (() => {
            const cfo = aiResults.find(r => r.role === "CFO");
            return cfo ? (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "#3b82f618", border: "1px solid #3b82f630", color: "#3b82f6" }}>C</div>
                    <span className="text-xs font-semibold text-white/60">Финансовый директор (CFO) — Анализ</span>
                    <span className="ml-auto text-xs font-bold" style={{ color: "#3b82f6" }}>{cfo.score}/100</span>
                  </div>
                  {cfo.analysis && <p className="text-[13px] text-white/55 leading-relaxed">{cfo.analysis}</p>}
                  {cfo.recommendations && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1.5">Рекомендации CFO</div>
                      <p className="text-[12px] text-white/50 leading-relaxed whitespace-pre-line">{cfo.recommendations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Рынок ── */}
      {activeTab === "Рынок" && (
        <div className="space-y-5">
          <MarketBarChart items={project.market} />
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
          {/* Business Analyst insights */}
          {aiResults.length > 0 && (() => {
            const ba = aiResults.find(r => r.role === "Business Analyst");
            return ba ? (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "#f9731618", border: "1px solid #f9731630", color: "#f97316" }}>B</div>
                    <span className="text-xs font-semibold text-white/60">Бизнес-аналитик — Рыночный анализ</span>
                    <span className="ml-auto text-xs font-bold" style={{ color: "#f97316" }}>{ba.score}/100</span>
                  </div>
                  {ba.analysis && <p className="text-[13px] text-white/55 leading-relaxed">{ba.analysis}</p>}
                  {ba.facts && (
                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                      <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1.5">Факты и данные</div>
                      <p className="text-[12px] text-white/50 leading-relaxed whitespace-pre-line">{ba.facts}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Риски ── */}
      {activeTab === "Риски" && (
        <div className="space-y-3">
          {/* AI risks from Legal Advisor and CEO if available */}
          {aiResults.length > 0 && (() => {
            const legal = aiResults.find(r => r.role === "Legal Advisor");
            const ceo = aiResults.find(r => r.role === "CEO");
            const risksFromAI = [
              ...(ceo?.risks ? [{ role: "CEO", color: "#7c3aed", text: ceo.risks }] : []),
              ...(legal?.risks ? [{ role: "Legal Advisor", color: "#64748b", text: legal.risks }] : []),
            ];
            return risksFromAI.length > 0 ? (
              <div className="space-y-3 mb-3">
                {risksFromAI.map(item => (
                  <div key={item.role} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: item.color }}>
                      {item.role} — Риски
                    </div>
                    <p className="text-[13px] text-white/55 leading-relaxed whitespace-pre-line">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          {project.risks.map((r) => (
            <div key={r.title} className={`p-4 rounded-xl border ${RISK_COLORS[r.level]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{RISK_ICONS[r.level]}</span>
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
