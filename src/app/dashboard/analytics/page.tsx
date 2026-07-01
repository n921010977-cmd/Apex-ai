"use client";

import { useState } from "react";

const METRICS = [
  {
    label: "Всего проектов", value: "3", change: "+2 за месяц", up: true,
    color: "#7c3aed", glow: "rgba(124,58,237,0.4)",
    icon: (
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="1" y="7" width="5" height="5" rx="1.5"/><rect x="7.5" y="3" width="5" height="5" rx="1.5"/>
        <rect x="14" y="7" width="5" height="5" rx="1.5"/>
        <path d="M3.5 12v2.5l4 2 5-2 4 2V12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Средний балл", value: "83", change: "+5 пунктов", up: true,
    color: "#f59e0b", glow: "rgba(245,158,11,0.4)",
    icon: (
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="5"/>
        <path d="M10 2v3M10 15v3M2 10h3M15 10h3" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Проектов завершено", value: "2", change: "67% завершено", up: true,
    color: "#10b981", glow: "rgba(16,185,129,0.4)",
    icon: (
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="5" cy="5" r="3"/><circle cx="15" cy="5" r="3"/><circle cx="10" cy="15" r="3"/>
        <path d="M8 5h4M7 7l3 5M13 7l-3 5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Прогноз выручки", value: "$4.2M", change: "по всем проектам", up: true,
    color: "#3b82f6", glow: "rgba(59,130,246,0.4)",
    icon: (
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4">
        <polyline points="2 14 6 9 9 12 13 6 18 9" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 4V2M10 4l2-2M10 4l-2-2" strokeLinecap="round"/>
        <line x1="2" y1="18" x2="18" y2="18" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const PROJECTS = [
  {
    name: "Фитнес-платформа ИИ", score: 87, growth: 24,
    revenue: "$2.4M", market: "$4.2B",
    color: "#34d399", glow: "rgba(52,211,153,0.5)",
    // synthetic monthly trend (deterministic)
    pts: [12, 18, 22, 28, 35, 42, 50, 60, 70, 80, 90, 100],
  },
  {
    name: "Платформа счетов SaaS", score: 91, growth: 18,
    revenue: "$1.8M", market: "$2.1B",
    color: "#60a5fa", glow: "rgba(96,165,250,0.5)",
    pts: [8, 15, 24, 32, 42, 52, 63, 73, 82, 90, 95, 100],
  },
  {
    name: "Сеть ресторанов", score: 72, growth: 9,
    revenue: "$0.9M", market: "$0.9B",
    color: "#fb923c", glow: "rgba(251,146,60,0.5)",
    pts: [30, 34, 38, 42, 46, 50, 55, 58, 62, 65, 68, 72],
  },
];

const CATEGORIES = [
  { label: "Рыночный потенциал", value: 88, color: "#7c3aed" },
  { label: "Финансовая модель", value: 81, color: "#3b82f6" },
  { label: "Конкурентное преимущество", value: 79, color: "#10b981" },
  { label: "Операционная готовность", value: 74, color: "#f59e0b" },
  { label: "Маркетинговая стратегия", value: 85, color: "#ec4899" },
  { label: "Технологии", value: 90, color: "#22d3ee" },
];

const PERIODS = ["7 дней", "30 дней", "3 месяца", "Всё время"];

// Activity data series (30 points each, deterministic)
const ACTIVITY_DATA = {
  "7 дней":     { n: 7,  series: [[60,72,55,85,70,90,80], [45,58,42,70,55,75,65], [30,38,28,50,40,55,45]] },
  "30 дней":    { n: 30, series: [
    [40,65,45,80,55,90,70,85,60,95,75,88,50,72,82,68,91,78,85,63,77,84,69,92,74,87,61,79,88,73],
    [30,48,35,62,42,70,55,68,45,78,58,72,38,56,65,52,74,60,68,48,60,67,54,75,58,70,46,62,70,57],
    [20,32,25,45,30,55,40,52,32,62,44,58,27,43,50,38,60,46,54,36,48,55,42,62,46,57,34,50,58,44],
  ]},
  "3 месяца":   { n: 12, series: [[45,60,50,75,65,80,70,85,75,90,82,88], [35,48,40,60,52,65,56,70,60,75,66,72], [25,36,30,48,40,52,44,58,48,62,52,58]] },
  "Всё время":  { n: 8,  series: [[30,45,55,68,72,80,85,90], [24,36,44,54,58,65,70,75], [16,24,30,38,42,50,56,60]] },
};

const SERIES_COLORS = ["#7c3aed", "#3b82f6", "#10b981"];
const SERIES_LABELS = ["Активность", "Качество", "Прогресс"];

function ProjectAreaChart({ project }: { project: typeof PROJECTS[0] }) {
  const W = 500; const H = 72; const PAD = { x: 6, y: 8 };
  const n = project.pts.length;
  const max = 100;
  const pts = project.pts.map((v, i) => ({
    x: PAD.x + (i / (n - 1)) * (W - PAD.x * 2),
    y: H - PAD.y - (v / max) * (H - PAD.y * 2),
  }));
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const mx = (prev.x + p.x) / 2;
    return `C ${mx.toFixed(1)} ${prev.y.toFixed(1)} ${mx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");
  const areaPath = `${linePath} L ${pts[n-1].x} ${H} L ${pts[0].x} ${H} Z`;
  const gradId = `ag${project.score}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={project.color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={project.color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={PAD.x} y1={PAD.y + t * (H - PAD.y * 2)} x2={W - PAD.x} y2={PAD.y + t * (H - PAD.y * 2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      <path d={areaPath} fill={`url(#${gradId})`}/>
      <path d={linePath} fill="none" stroke={project.color} strokeWidth="2" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${project.glow})` }}/>
      {pts.map((p, i) => i % 4 === 0 || i === n - 1 ? (
        <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 4 : 2.5}
          fill={i === n - 1 ? project.color : "rgba(255,255,255,0.15)"}
          stroke={project.color} strokeWidth={i === n - 1 ? 0 : 1}
          style={i === n - 1 ? { filter: `drop-shadow(0 0 6px ${project.glow})` } : undefined}/>
      ) : null)}
    </svg>
  );
}

function CategoryRing({ item, index }: { item: typeof CATEGORIES[0]; index: number }) {
  const r = 20; const circ = 2 * Math.PI * r;
  const dash = (item.value / 100) * circ;
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex-shrink-0 relative">
        <svg viewBox="0 0 52 52" style={{ width: 52, height: 52 }}>
          <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
          <circle cx="26" cy="26" r={r} fill="none" stroke={item.color} strokeWidth="5"
            strokeDasharray={`${dash.toFixed(1)} ${(circ - dash).toFixed(1)}`}
            strokeDashoffset={(circ * 0.25).toFixed(1)} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${item.color}90)` }}/>
          <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill="white" fontFamily="monospace">{item.value}</text>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-white/60 leading-tight">{item.label}</div>
        <div className="mt-1 h-0.5 rounded-full" style={{ width: `${item.value}%`, background: item.color, maxWidth: "100%", opacity: 0.4, boxShadow: `0 0 4px ${item.color}` }} />
      </div>
    </div>
  );
}

function ActivityLineChart({ period }: { period: string }) {
  const data = ACTIVITY_DATA[period as keyof typeof ACTIVITY_DATA] ?? ACTIVITY_DATA["30 дней"];
  const W = 900; const H = 140; const PAD = { x: 20, y: 16 };
  const n = data.n;
  const innerW = W - PAD.x * 2; const innerH = H - PAD.y * 2;

  const mkPts = (vals: number[]) => vals.map((v, i) => ({
    x: PAD.x + (i / (n - 1)) * innerW,
    y: PAD.y + (1 - v / 100) * innerH,
  }));

  const mkPath = (vals: number[]) => {
    const pts = mkPts(vals);
    return pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const mx = (prev.x + p.x) / 2;
      return `C ${mx.toFixed(1)} ${prev.y.toFixed(1)} ${mx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(" ");
  };

  const mkArea = (vals: number[]) => {
    const pts = mkPts(vals);
    const line = mkPath(vals);
    return `${line} L ${pts[pts.length-1].x} ${H - PAD.y} L ${pts[0].x} ${H - PAD.y} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        {SERIES_COLORS.map((c, i) => (
          <linearGradient key={i} id={`alg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={c} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PAD.x} y1={PAD.y + t * innerH} x2={W - PAD.x} y2={PAD.y + t * innerH} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {Array.from({ length: 6 }, (_, i) => PAD.x + (i / 5) * innerW).map((x, i) => (
        <line key={i} x1={x} y1={PAD.y} x2={x} y2={H - PAD.y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
      ))}
      {/* area fills */}
      {data.series.map((vals, si) => (
        <path key={si} d={mkArea(vals)} fill={`url(#alg${si})`} opacity="0.8"/>
      ))}
      {/* lines */}
      {data.series.map((vals, si) => (
        <path key={si} d={mkPath(vals)} fill="none" stroke={SERIES_COLORS[si]} strokeWidth={si === 0 ? 2 : 1.5}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${si === 0 ? 5 : 3}px ${SERIES_COLORS[si]}90)` }}/>
      ))}
      {/* dots on primary line */}
      {mkPts(data.series[0]).map((p, i) => (
        i % Math.max(1, Math.floor(n / 8)) === 0 || i === n - 1 ? (
          <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 4 : 2.5} fill={SERIES_COLORS[0]}
            style={{ filter: `drop-shadow(0 0 5px ${SERIES_COLORS[0]}90)` }}/>
        ) : null
      ))}
    </svg>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30 дней");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">Аналитика</h1>
          <p className="text-sm text-white/35">Детальный анализ ваших бизнес-стратегий</p>
        </div>
        <div
          className="flex gap-0.5 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {PERIODS.map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3.5 py-1.5 text-xs rounded-lg transition-all duration-200"
                style={isActive ? {
                  background: "#7c3aed",
                  color: "white",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                } : { color: "rgba(255,255,255,0.4)" }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="relative rounded-2xl overflow-hidden p-5 group transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(10,10,14,0.85) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 6px 28px rgba(0,0,0,0.25)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${m.color}50, transparent)` }} />
            <div className="absolute inset-x-0 bottom-0 h-px opacity-20" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
            {/* icon */}
            <div
              className="size-9 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${m.color}18`, border: `1px solid ${m.color}28`, color: m.color }}
            >
              {m.icon}
            </div>
            <div className="text-2xl font-bold font-mono mb-0.5" style={{ color: m.color === "#f59e0b" ? "#fbbf24" : m.color, textShadow: `0 0 20px ${m.glow}` }}>
              {m.value}
            </div>
            <div className="text-[11px] text-white/35 mb-2">{m.label}</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              {m.up && <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9V3M3 6l3-3 3 3"/></svg>}
              {m.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 mb-5">

        {/* Project area charts */}
        <div
          className="relative rounded-2xl overflow-hidden p-5"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(10,10,14,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.45), transparent)" }} />
          <h2 className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.18em] mb-5 relative">Сравнение проектов</h2>

          <div className="space-y-5 relative">
            {PROJECTS.map((project) => {
              const scoreColor = project.score >= 85 ? "#34d399" : project.score >= 75 ? "#f59e0b" : "#f87171";
              return (
                <div key={project.name}
                  className="relative rounded-xl overflow-hidden p-4 transition-all duration-200 hover:scale-[1.005]"
                  style={{
                    background: `linear-gradient(135deg, ${project.color}08 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1px solid ${project.color}18`,
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${project.color}35, transparent)` }} />
                  {/* header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ background: project.color, boxShadow: `0 0 6px ${project.glow}` }} />
                      <span className="text-[12px] font-semibold text-white/80">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-white/30">Рост {project.growth}%/год</span>
                      <span className="text-sm font-bold font-mono" style={{ color: scoreColor, textShadow: `0 0 10px ${scoreColor}80` }}>{project.score}/100</span>
                    </div>
                  </div>
                  {/* area chart */}
                  <ProjectAreaChart project={project} />
                  {/* footer */}
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-white/25">Прогноз: {project.revenue}</span>
                    <span className="text-[9px] text-white/25">Рынок: {project.market}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category ring gauges */}
        <div
          className="relative rounded-2xl overflow-hidden p-5"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(10,10,14,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)" }} />
          <h2 className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.18em] mb-5">Средний балл по категориям</h2>
          <div className="space-y-4">
            {CATEGORIES.map((item, i) => (
              <CategoryRing key={item.label} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div
        className="relative rounded-2xl overflow-hidden p-5"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(10,10,14,0.9) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)" }} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.18em]">Активность за период</h2>
          <div className="flex items-center gap-4">
            {SERIES_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="size-2 rounded-full" style={{ background: SERIES_COLORS[i], boxShadow: `0 0 4px ${SERIES_COLORS[i]}` }} />
                <span className="text-[9px] text-white/35">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ActivityLineChart period={period} />
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-white/20">Начало периода</span>
          <span className="text-[9px] text-white/20">Сегодня</span>
        </div>
      </div>
    </div>
  );
}
