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
const RISK_ICONS_SVG: Record<string, React.ReactNode> = {
  high: (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2L14 13H2L8 2z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/>
    </svg>
  ),
  medium: (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="2 10 5 6 8 8 11 4 14 6"/><line x1="2" y1="13" x2="14" y2="13"/>
    </svg>
  ),
  low: (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="5"/><polyline points="6 8 8 10 11 6"/>
    </svg>
  ),
};

// Risk radar chart
function RiskRadarChart({ risks }: { risks: { level: string; title: string }[] }) {
  const cx = 110; const cy = 110; const r = 80;
  const axes = risks.length > 0 ? risks.slice(0, 6) : [
    { title: "Конкуренция", level: "high" },
    { title: "Рынок", level: "medium" },
    { title: "Исполнение", level: "high" },
    { title: "Финансы", level: "medium" },
    { title: "Регуляторика", level: "low" },
    { title: "Технологии", level: "medium" },
  ];
  const n = axes.length;
  const levelVal: Record<string, number> = { high: 0.85, medium: 0.55, low: 0.3 };
  const levelColor: Record<string, string> = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };

  const pts = axes.map((ax, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const frac = levelVal[ax.level] ?? 0.5;
    return {
      x: cx + Math.cos(angle) * r * frac,
      y: cy + Math.sin(angle) * r * frac,
      lx: cx + Math.cos(angle) * (r + 22),
      ly: cy + Math.sin(angle) * (r + 22),
      color: levelColor[ax.level] ?? "#a78bfa",
      title: ax.title,
      level: ax.level,
    };
  });
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-5"
      style={{
        background: "linear-gradient(135deg, rgba(251,146,60,0.05) 0%, rgba(15,15,20,0.85) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(251,146,60,0.4),transparent)" }} />
      <div className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-3 relative">Матрица угроз</div>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 220 220" style={{ width: 200, height: 200 }}>
          <defs>
            <radialGradient id="riskFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05"/>
            </radialGradient>
          </defs>
          {/* grid rings */}
          {[0.3, 0.55, 0.85].map((frac, gi) => {
            const ringPts = Array.from({ length: n }, (_, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              return `${cx + Math.cos(angle) * r * frac},${cy + Math.sin(angle) * r * frac}`;
            }).join(" ");
            const colors = ["rgba(52,211,153,0.12)", "rgba(251,191,36,0.12)", "rgba(248,113,113,0.12)"];
            return <polygon key={gi} points={ringPts} fill={colors[gi]} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>;
          })}
          {/* axis lines */}
          {pts.map((p, i) => (
            <line key={i} x1={cx} y1={cy} x2={cx + Math.cos((i/n)*2*Math.PI-Math.PI/2)*r} y2={cy + Math.sin((i/n)*2*Math.PI-Math.PI/2)*r} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          ))}
          {/* data polygon */}
          <polygon points={poly} fill="url(#riskFill)" stroke="rgba(248,113,113,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* nodes */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#0a0a0a" stroke={p.color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 4px ${p.color}80)` }}/>
              <circle cx={p.x} cy={p.y} r="2" fill={p.color}/>
            </g>
          ))}
          {/* labels */}
          {pts.map((p, i) => (
            <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="rgba(255,255,255,0.35)" fontFamily="system-ui">
              {p.title.length > 10 ? p.title.slice(0, 10) : p.title}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// Concentric circles TAM/SAM/SOM visualization
function MarketConcentricChart({ items }: { items: { label: string; value: string; numeric?: number }[] }) {
  const numericItems = items.filter(i => i.numeric !== undefined).slice(0, 3);
  if (numericItems.length < 2) return null;
  const max = Math.max(...numericItems.map(i => i.numeric!));
  const RINGS = [
    { color: "#7c3aed", glow: "rgba(124,58,237,0.4)", label: "TAM" },
    { color: "#3b82f6", glow: "rgba(59,130,246,0.4)", label: "SAM" },
    { color: "#10b981", glow: "rgba(16,185,129,0.5)", label: "SOM" },
  ];
  const cx = 120; const cy = 120;
  const maxR = 90;

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-5"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(15,15,20,0.8) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* grid bg */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)" }} />

      <div className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4 relative">Размер рынка (визуализация)</div>

      <div className="relative flex items-center gap-8">
        {/* SVG circles */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 240 240" style={{ width: 180, height: 180 }}>
            <defs>
              {RINGS.map((r, i) => (
                <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={r.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={r.color} stopOpacity="0.03" />
                </radialGradient>
              ))}
            </defs>
            {/* rings from outside in */}
            {numericItems.map((item, i) => {
              const frac = Math.pow(item.numeric! / max, 0.45);
              const r = maxR * frac;
              const ring = RINGS[i];
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r} fill={`url(#rg${i})`} />
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={ring.color} strokeWidth={i === 0 ? 1.5 : 1}
                    style={{ filter: `drop-shadow(0 0 6px ${ring.glow})` }} />
                </g>
              );
            }).reverse()}
            {/* center dot */}
            <circle cx={cx} cy={cy} r="3" fill="#10b981" style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.8))" }} />
          </svg>
        </div>

        {/* legend */}
        <div className="flex-1 space-y-4">
          {numericItems.map((item, i) => {
            const ring = RINGS[i];
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="size-2.5 rounded-full flex-shrink-0" style={{ background: ring.color, boxShadow: `0 0 8px ${ring.glow}` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white/35 mb-0.5">{item.label}</div>
                  <div className="text-base font-bold font-mono leading-tight" style={{ color: ring.color }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Premium luxury gauge (replaces diamond radar)
function PremiumScoreGauge({ score }: { score: number }) {
  const cx = 65; const cy = 65; const r = 48;
  const startDeg = 135; const totalDeg = 270;
  const color = score >= 85 ? "#34d399" : score >= 70 ? "#f59e0b" : "#f87171";
  const d2r = (d: number) => d * Math.PI / 180;
  const pt = (deg: number) => ({ x: cx + r * Math.cos(d2r(deg)), y: cy + r * Math.sin(d2r(deg)) });
  const arc = (s: number, e: number) => {
    const sp = pt(s); const ep = pt(e);
    const large = e - s > 180 ? 1 : 0;
    return `M ${sp.x.toFixed(2)} ${sp.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ep.x.toFixed(2)} ${ep.y.toFixed(2)}`;
  };
  const scoreEnd = startDeg + (score / 100) * totalDeg;
  return (
    <svg viewBox="0 0 130 102" style={{ width: 130, height: 102 }}>
      <defs>
        <pattern id="gaugeGrid" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.07)" />
        </pattern>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 10} fill="url(#gaugeGrid)" />
      <path d={arc(startDeg, startDeg + totalDeg)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinecap="round" />
      {score > 0 && <path d={arc(startDeg, scoreEnd)} fill="none" stroke="url(#gaugeGrad)" strokeWidth="7" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color}90)` }} />}
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize="24" fontWeight="800" fill="white" fontFamily="monospace">{score}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="system-ui" letterSpacing="1.5">Бизнес-балл</text>
    </svg>
  );
}

// Concentric rings for Резюме tab with % pointer lines
function ResumeConcentricChart({ items }: { items: { label: string; value: string; numeric?: number }[] }) {
  const numericItems = items.filter(i => i.numeric !== undefined).slice(0, 3);
  if (numericItems.length < 2) return null;
  const max = Math.max(...numericItems.map(i => i.numeric!));
  const cx = 130; const cy = 130; const maxR = 100;
  const RINGS = [
    { color: "#7c3aed", glow: "rgba(124,58,237,0.5)", label: "TAM", angle: -55 },
    { color: "#22d3ee", glow: "rgba(34,211,238,0.5)", label: "SAM", angle: 25 },
    { color: "#10b981", glow: "rgba(16,185,129,0.5)", label: "SOM", angle: 110 },
  ];
  const rings = numericItems.map((item, i) => {
    const frac = Math.pow(item.numeric! / max, 0.45);
    const r = Math.max(10, maxR * frac);
    const ring = RINGS[i];
    const rad = ring.angle * Math.PI / 180;
    const dotX = cx + r * Math.cos(rad); const dotY = cy + r * Math.sin(rad);
    const lineLen = 32;
    const lx = cx + (r + lineLen) * Math.cos(rad); const ly = cy + (r + lineLen) * Math.sin(rad);
    const pct = Math.round((item.numeric! / max) * 100);
    return { ...item, r, ring, dotX, dotY, lx, ly, pct, i };
  });

  return (
    <div className="relative rounded-2xl overflow-hidden p-5" style={{
      background: "linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(15,15,20,0.88) 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.45), transparent)" }} />
      <div className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-2 relative">Структура рынка</div>
      <svg viewBox="0 0 260 260" style={{ width: "100%", maxWidth: 260, margin: "0 auto", display: "block" }}>
        <defs>
          {rings.map((ri, i) => (
            <radialGradient key={i} id={`rg2_${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ri.ring.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={ri.ring.color} stopOpacity="0.02" />
            </radialGradient>
          ))}
        </defs>
        {[...rings].reverse().map((ri, idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={ri.r} fill={`url(#rg2_${rings.length - 1 - idx})`} />
            <circle cx={cx} cy={cy} r={ri.r} fill="none" stroke={ri.ring.color} strokeWidth={ri.i === 0 ? 1.5 : 1}
              strokeDasharray={ri.i === 0 ? undefined : "4 3"}
              style={{ filter: `drop-shadow(0 0 8px ${ri.ring.glow})` }} />
          </g>
        ))}
        {rings.map((ri, i) => (
          <g key={i}>
            <circle cx={ri.dotX} cy={ri.dotY} r="4" fill={ri.ring.color} style={{ filter: `drop-shadow(0 0 5px ${ri.ring.glow})` }} />
            <line x1={ri.dotX} y1={ri.dotY} x2={ri.lx} y2={ri.ly} stroke={ri.ring.color} strokeWidth="0.75" strokeDasharray="3 2" opacity="0.55" />
            <rect x={ri.lx - 15} y={ri.ly - 9} width="30" height="18" rx="4" fill={ri.ring.color} fillOpacity="0.12" stroke={ri.ring.color} strokeOpacity="0.35" strokeWidth="0.75" />
            <text x={ri.lx} y={ri.ly + 4.5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={ri.ring.color} fontFamily="monospace">{ri.pct}%</text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r="4.5" fill="#10b981" style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.9))" }} />
      </svg>
      <div className="flex justify-center gap-6 mt-1">
        {rings.map((ri, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="size-2 rounded-full flex-shrink-0" style={{ background: ri.ring.color, boxShadow: `0 0 6px ${ri.ring.glow}` }} />
            <div>
              <div className="text-[8px] text-white/30">{ri.ring.label}</div>
              <div className="text-[10px] font-bold font-mono leading-tight" style={{ color: ri.ring.color }}>{ri.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Financial bar chart
function FinancialAreaChart({ financials }: { financials: { label: string; value: string; numeric?: number }[] }) {
  const items = financials.filter(f => f.numeric !== undefined);
  if (items.length < 2) return null;
  const max = Math.max(...items.map(i => i.numeric!));
  const W = 600; const H = 120; const PAD = 24;
  const pts = items.map((item, i) => ({
    x: PAD + (i / (items.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((item.numeric! / max) * (H - PAD * 2)),
    ...item,
  }));
  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${(pts[i-1].x + p.x)/2} ${pts[i-1].y} ${(pts[i-1].x + p.x)/2} ${p.y} ${p.x} ${p.y}`)).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  const firstVal = items[0];
  const lastVal = items[items.length - 1];

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(59,130,246,0.04) 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* circuit pattern bg */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <div className="relative p-5">
        <div className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Прогноз выручки</div>
        {/* value labels */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xl font-bold font-mono" style={{ color: "#60a5fa" }}>{firstVal.value}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{firstVal.label}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold font-mono" style={{ color: "#a78bfa" }}>{lastVal.value}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{lastVal.label}</div>
          </div>
        </div>
        {/* SVG area chart */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* grid lines */}
          {[0.25, 0.5, 0.75].map(t => (
            <line key={t} x1={PAD} y1={PAD + t * (H - PAD * 2)} x2={W - PAD} y2={PAD + t * (H - PAD * 2)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {/* area fill */}
          <path d={areaD} fill="url(#areaFill)" />
          {/* line */}
          <path d={pathD} fill="none" stroke="url(#areaGrad)" strokeWidth="2" strokeLinecap="round" />
          {/* data points */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#0a0a0a" stroke={i === 0 ? "#3b82f6" : "#7c3aed"} strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="2" fill={i === 0 ? "#3b82f6" : "#7c3aed"} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  "LTV пользователя": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1 10 4 6 7 8 10 4 15 7" /><line x1="1" y1="15" x2="15" y2="15" />
    </svg>
  ),
  "CAC": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="6" r="3"/><rect x="3" y="11" width="10" height="3" rx="1"/><line x1="8" y1="9" x2="8" y2="11"/>
    </svg>
  ),
  "LTV/CAC": (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  ),
};

function CircularScore({ score, color }: { score: number; color: string }) {
  const r = 22; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg viewBox="0 0 60 60" className="size-10">
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      <text x="30" y="35" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="monospace">{score}</text>
    </svg>
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

    // Try Supabase API first
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.project) {
          const p = data.project;
          const mapped = {
            id: p.id, name: p.name, description: p.description,
            industry: p.industry, stage: p.stage, goals: p.goals,
            targetRevenue: p.target_revenue, timeframe: p.timeframe,
            score: p.overall_score, aiResults: Array.isArray(p.ai_results) ? p.ai_results : [],
          };
          setRawProject(mapped);
          setProject(buildProjectFromUser(mapped));
          if (mapped.aiResults?.length > 0) setAiResults(mapped.aiResults);
          return;
        }
        throw new Error("not found");
      })
      .catch(() => {
        // Fallback to localStorage
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
      });
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
        <PremiumScoreGauge score={project.score} />
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
      {activeTab === "Резюме" && (() => {
        // Pick 4 key metrics for cards
        const KEY_METRICS = ["LTV пользователя", "CAC", "Точка безубыточности", "LTV/CAC"];
        const metricCards = KEY_METRICS.map(k => project.financials.find(f => f.label === k)).filter(Boolean) as typeof project.financials;
        const CARD_CFG: Record<string, { color: string; glow: string; icon: React.ReactNode }> = {
          "LTV пользователя": { color: "#a78bfa", glow: "rgba(167,139,250,0.35)", icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 10 4 6 7 8 10 4 15 7"/><line x1="1" y1="15" x2="15" y2="15"/></svg> },
          "CAC":              { color: "#34d399", glow: "rgba(52,211,153,0.35)",  icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><rect x="3" y="11" width="10" height="3" rx="1"/><line x1="8" y1="9" x2="8" y2="11"/></svg> },
          "Точка безубыточности": { color: "#60a5fa", glow: "rgba(96,165,250,0.35)", icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> },
          "LTV/CAC":          { color: "#f59e0b", glow: "rgba(245,158,11,0.35)",  icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="14" x2="14" y2="2"/><circle cx="5" cy="5" r="2"/><circle cx="11" cy="11" r="2"/></svg> },
        };
        const ceo = aiResults.find(r => r.role === "CEO");
        const cmo = aiResults.find(r => r.role === "CMO");
        return (
          <div className="space-y-4">
            {/* Top row: market rings (left) + score panel (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResumeConcentricChart items={project.market} />

              {/* Score + mini progress bars */}
              <div
                className="relative rounded-2xl overflow-hidden p-5 flex flex-col justify-between"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(15,15,20,0.88) 100%)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.45),transparent)" }} />
                <div className="text-[10px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-3 relative">Бизнес-оценка</div>
                <div className="flex items-center gap-5 mb-5">
                  <PremiumScoreGauge score={project.score} />
                  <div className="flex-1 space-y-2.5">
                    {project.scores.map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/35 flex-1 min-w-0 truncate">{s.label}</span>
                        <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: "linear-gradient(90deg,#7c3aed,#3b82f6)" }} />
                        </div>
                        <span className="text-[10px] font-mono text-white/45 w-5 text-right flex-shrink-0">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* summary excerpt */}
                <div className="relative pt-4 border-t border-white/[0.05]">
                  <div className="text-[9px] text-white/25 uppercase tracking-[0.2em] mb-1.5">Стратегическое резюме</div>
                  <p className="text-[12px] text-white/55 leading-[1.75] line-clamp-4">{project.summary}</p>
                </div>
              </div>
            </div>

            {/* 4 key metric cards */}
            {metricCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metricCards.map((m) => {
                  const cfg = CARD_CFG[m.label] ?? { color: "#a78bfa", glow: "rgba(167,139,250,0.3)", icon: null };
                  return (
                    <div
                      key={m.label}
                      className="relative rounded-xl overflow-hidden p-4 group transition-all duration-300 hover:scale-[1.03]"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backdropFilter: "blur(14px)",
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 6px 28px rgba(0,0,0,0.25)`,
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${cfg.color}50,transparent)` }} />
                      {/* metallic bevel */}
                      <div className="absolute inset-x-0 bottom-0 h-px opacity-30" style={{ background: `linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)` }} />
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.glow}` }}>{m.value}</div>
                        <div className="mt-0.5 opacity-40 group-hover:opacity-75 transition-opacity" style={{ color: cfg.color }}>{cfg.icon}</div>
                      </div>
                      <div className="text-[10px] text-white/30 leading-tight">{m.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CEO + CMO premium analysis panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CEO panel */}
              <div
                className="relative rounded-2xl overflow-hidden p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(10,10,14,0.92) 100%)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(124,58,237,0.14), 0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.55),transparent)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.3)", color: "#7c3aed" }}>C</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white/85">CEO — Стратегический вывод</div>
                    <div className="text-[10px] text-white/30 mt-0.5">AI Executive Board · Общая стратегия</div>
                  </div>
                  {ceo && <CircularScore score={ceo.score} color="#7c3aed" />}
                </div>
                <p className="text-[12.5px] text-white/58 leading-[1.8]">
                  {ceo?.summary ?? project.summary}
                </p>
              </div>

              {/* CMO panel */}
              <div
                className="relative rounded-2xl overflow-hidden p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(10,10,14,0.92) 100%)",
                  border: "1px solid rgba(16,185,129,0.16)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(16,185,129,0.12), 0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>M</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white/85">CMO — Маркетинговая стратегия</div>
                    <div className="text-[10px] text-white/30 mt-0.5">AI Executive Board · Go-to-Market</div>
                  </div>
                  {cmo && <CircularScore score={cmo.score} color="#10b981" />}
                </div>
                <p className="text-[12.5px] text-white/58 leading-[1.8] line-clamp-6">
                  {cmo?.summary ?? cmo?.analysis ?? "Запустите AI-анализ для получения маркетинговой стратегии от CMO."}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

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
                        { label: "📌 Краткий вывод", text: r.summary, icon: "◆" },
                        { label: "📊 Подробный анализ", text: r.analysis, icon: "◈" },
                        { label: "📋 Факты и предположения", text: r.facts, icon: "◉" },
                        { label: "⚠️ Возможные риски", text: r.risks, icon: "⚠" },
                        { label: "🚀 Практический план действий", text: r.recommendations, icon: "→" },
                        { label: "📈 Прогноз", text: r.forecast, icon: "↗" },
                      ].map((sec) => sec.text ? (
                        <div key={sec.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2.5">{sec.label}</div>
                          <p className="text-[13px] text-white/65 leading-relaxed whitespace-pre-line">{sec.text}</p>
                        </div>
                      ) : null)}

                      {/* Metrics grid */}
                      {r.metrics && r.metrics.success_probability !== "—" && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">🎯 Оценка</div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Вероятность успеха", value: r.metrics.success_probability },
                              { label: "Уровень риска", value: r.metrics.risk_level },
                              { label: "Конкуренция", value: r.metrics.competition },
                              { label: "Инвест. привлекательность", value: r.metrics.investment_appeal },
                              { label: "Масштабируемость", value: r.metrics.scalability },
                            ].map((m) => (
                              <div key={m.label} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                <div className="text-[9px] text-white/30 mb-0.5">{m.label}</div>
                                <div className="text-sm font-bold" style={{ color }}>{m.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
        <div className="space-y-4">
          {/* Premium area chart */}
          <FinancialAreaChart financials={project.financials} />

          {/* Glassmorphism metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {project.financials.map((f) => {
              const icon = METRIC_ICONS[f.label];
              const isRevenue = f.label.startsWith("Прогноз");
              const accentColor = isRevenue ? "#60a5fa" : f.label === "LTV пользователя" ? "#a78bfa" : f.label === "CAC" ? "#34d399" : f.label === "LTV/CAC" ? "#f59e0b" : "rgba(255,255,255,0.7)";
              return (
                <div
                  key={f.label}
                  className="relative rounded-xl overflow-hidden p-4 group transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* shimmer edge */}
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }} />
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xl font-bold font-mono" style={{ color: accentColor }}>{f.value}</div>
                    {icon && (
                      <div className="mt-0.5 opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: accentColor }}>
                        {icon}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-white/30 leading-tight">{f.label}</div>
                </div>
              );
            })}
          </div>

          {/* CFO analysis — premium panel */}
          {aiResults.length > 0 && (() => {
            const cfo = aiResults.find(r => r.role === "CFO");
            return cfo ? (
              <div
                className="relative rounded-2xl overflow-hidden p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(124,58,237,0.04) 100%)",
                  border: "1px solid rgba(59,130,246,0.15)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6" }}
                  >C</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white/80">Финансовый директор (CFO) — Анализ</div>
                    <div className="text-[10px] text-white/30 mt-0.5">AI Executive Board · Финансовый аудит</div>
                  </div>
                  <CircularScore score={cfo.score} color="#3b82f6" />
                </div>
                {cfo.analysis && <p className="text-[13px] text-white/60 leading-relaxed">{cfo.analysis}</p>}
                {cfo.recommendations && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="text-[9px] text-white/25 uppercase tracking-[0.2em] mb-2">Рекомендации CFO</div>
                    <p className="text-[12px] text-white/50 leading-relaxed whitespace-pre-line">{cfo.recommendations}</p>
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Рынок ── */}
      {activeTab === "Рынок" && (
        <div className="space-y-4">
          {/* Concentric rings TAM/SAM/SOM */}
          <MarketConcentricChart items={project.market} />

          {/* Glassmorphism market metric cards */}
          <div className="grid grid-cols-2 gap-3">
            {project.market.map((m, i) => {
              const colors = ["#a78bfa", "#60a5fa", "#34d399", "#f59e0b"];
              const color = colors[i % colors.length];
              return (
                <div
                  key={m.label}
                  className="relative rounded-xl overflow-hidden p-5 group transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
                  <div className="text-2xl font-bold font-mono mb-1.5" style={{ color }}>{m.value}</div>
                  <div className="text-[11px] text-white/35">{m.label}</div>
                </div>
              );
            })}
          </div>

          {/* Business Analyst — premium panel */}
          {aiResults.length > 0 && (() => {
            const ba = aiResults.find(r => r.role === "Business Analyst");
            return ba ? (
              <div
                className="relative rounded-2xl overflow-hidden p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(15,15,20,0.6) 100%)",
                  border: "1px solid rgba(249,115,22,0.14)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(249,115,22,0.1), 0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.45), transparent)" }} />
                {/* header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.24)", color: "#f97316" }}
                  >B</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white/80">Бизнес-аналитик — Рыночный анализ</div>
                    <div className="text-[10px] text-white/30 mt-0.5">AI Executive Board · Исследование рынка</div>
                  </div>
                  <CircularScore score={ba.score} color="#f97316" />
                </div>
                {/* analysis text — readable */}
                {ba.analysis && (
                  <p className="text-[13px] text-white/65 leading-[1.8] tracking-[0.01em]">{ba.analysis}</p>
                )}
                {ba.facts && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="text-[9px] text-white/25 uppercase tracking-[0.2em] mb-2">Факты и данные</div>
                    <p className="text-[12px] text-white/50 leading-[1.8] whitespace-pre-line">{ba.facts}</p>
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Риски ── */}
      {activeTab === "Риски" && (
        <div className="space-y-4">
          {/* Radar threat matrix */}
          <RiskRadarChart risks={project.risks} />

          {/* Risk cards — glassmorphism */}
          <div className="space-y-2.5">
            {project.risks.map((r) => {
              const cfg = {
                high: { color: "#f87171", glow: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.2)", bg: "rgba(248,113,113,0.05)" },
                medium: { color: "#fbbf24", glow: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.05)" },
                low: { color: "#34d399", glow: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.2)", bg: "rgba(52,211,153,0.04)" },
              }[r.level] ?? { color: "#a78bfa", glow: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.15)", bg: "rgba(167,139,250,0.04)" };
              return (
                <div
                  key={r.title}
                  className="relative rounded-xl overflow-hidden p-4 transition-all duration-200 hover:scale-[1.005]"
                  style={{
                    background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1px solid ${cfg.border}`,
                    backdropFilter: "blur(8px)",
                    boxShadow: `inset 0 1px 0 ${cfg.glow}`,
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}40, transparent)` }} />
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }}>
                      {RISK_ICONS_SVG[r.level]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: cfg.color }}>{RISK_LABELS[r.level]}</span>
                        <span className="text-sm font-semibold text-white/85">{r.title}</span>
                      </div>
                      <p className="text-[12px] text-white/45 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CEO + Legal risks from AI — premium panels */}
          {aiResults.length > 0 && (() => {
            const legal = aiResults.find(r => r.role === "Legal Advisor");
            const ceo = aiResults.find(r => r.role === "CEO");
            const panels = [
              ...(ceo?.risks ? [{ label: "CEO — Риски", sub: "Стратегический риск-аудит", letter: "C", color: "#7c3aed", text: ceo.risks, score: ceo.score }] : []),
              ...(legal?.risks ? [{ label: "Legal Advisor — Риски", sub: "Юридические и регуляторные риски", letter: "L", color: "#64748b", text: legal.risks, score: legal.score }] : []),
            ];
            return panels.length > 0 ? (
              <div className="space-y-3">
                {panels.map(p => (
                  <div
                    key={p.label}
                    className="relative rounded-2xl overflow-hidden p-5"
                    style={{
                      background: `linear-gradient(135deg, ${p.color}0d 0%, rgba(15,15,20,0.7) 100%)`,
                      border: `1px solid ${p.color}25`,
                      backdropFilter: "blur(16px)",
                      boxShadow: `inset 0 1px 0 ${p.color}18, 0 8px 32px rgba(0,0,0,0.25)`,
                    }}
                  >
                    <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.color}50, transparent)` }} />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: `${p.color}18`, border: `1px solid ${p.color}28`, color: p.color }}>{p.letter}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white/80">{p.label}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">AI Executive Board · {p.sub}</div>
                      </div>
                      <CircularScore score={p.score} color={p.color} />
                    </div>
                    <p className="text-[13px] text-white/60 leading-[1.8] whitespace-pre-line">{p.text}</p>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
