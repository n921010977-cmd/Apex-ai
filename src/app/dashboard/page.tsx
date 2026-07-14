"use client";

import Link from "next/link";

const EXECUTIVES = [
  {
    role: "CEO",
    subtitle: "Chief Strategy AI",
    name: "Sophia Rivers",
    desc: "Стратегия & Видение",
    confidence: 94,
    tasks: 12,
    color: "#7c3aed",
    gradient: "from-violet-900/60 to-violet-800/30",
    border: "border-violet-500/30",
    sparkColor: "#7c3aed",
  },
  {
    role: "CFO",
    subtitle: "Finance AI",
    name: "Marcus Chen",
    desc: "Финансы & Модели",
    confidence: 89,
    tasks: 8,
    color: "#3b82f6",
    gradient: "from-blue-900/60 to-blue-800/30",
    border: "border-blue-500/30",
    sparkColor: "#3b82f6",
  },
  {
    role: "CMO",
    subtitle: "Growth AI",
    name: "Elena Torres",
    desc: "Маркетинг & Рост",
    confidence: 91,
    tasks: 15,
    color: "#10b981",
    gradient: "from-emerald-900/60 to-emerald-800/30",
    border: "border-emerald-500/30",
    sparkColor: "#10b981",
  },
  {
    role: "COO",
    subtitle: "Operations AI",
    name: "James Wright",
    desc: "Операции & Процессы",
    confidence: 86,
    tasks: 10,
    color: "#f59e0b",
    gradient: "from-amber-900/60 to-amber-800/30",
    border: "border-amber-500/30",
    sparkColor: "#f59e0b",
  },
  {
    role: "CTO",
    subtitle: "Technology AI",
    name: "Park Aiden",
    desc: "Технологии & Архитект.",
    confidence: 92,
    tasks: 9,
    color: "#a855f7",
    gradient: "from-purple-900/60 to-purple-800/30",
    border: "border-purple-500/30",
    sparkColor: "#a855f7",
  },
];

function Sparkline({ color }: { color: string }) {
  const points = [0, 15, 8, 22, 12, 28, 18, 35, 25, 40];
  const w = 80, h = 32;
  const max = Math.max(...points);
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function ConstellationBg() {
  const nodes = [
    [820, 80], [920, 140], [860, 220], [980, 180], [1050, 100],
    [1100, 200], [950, 280], [1020, 320], [880, 350], [1130, 300],
  ];
  const edges = [
    [0,1],[1,2],[1,3],[3,4],[3,5],[2,6],[6,7],[7,8],[5,9],[7,9],
  ];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <radialGradient id="bgGlow" cx="80%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#080808" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGlow)" />
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#7c3aed" strokeOpacity="0.15" strokeWidth="1"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#7c3aed" opacity="0.35" />
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="flex-1 overflow-y-auto bg-[#080808]">
      <div className="relative min-h-screen p-8 max-w-7xl mx-auto">
        <ConstellationBg />

        <div className="relative z-10">
          {/* Status badges */}
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI СИСТЕМА АКТИВНА
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-white/60">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Confidence 91%
            </span>
          </div>

          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-5xl font-black text-white mb-1 tracking-tight">{greeting}, 1</h1>
            <h2 className="text-5xl font-black mb-5 tracking-tight bg-gradient-to-r from-violet-400 via-blue-400 to-violet-500 bg-clip-text text-transparent">
              Apex Executive Board
            </h2>
            <p className="text-sm text-white/45 max-w-md leading-relaxed">
              Ваша AI-команда директоров анализирует рынок, стратегию и финансы в реальном времени.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {[
              { icon: <svg className="size-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, value: "4", label: "Возможностей" },
              { icon: <svg className="size-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, value: "12+", label: "AI Analyses" },
              { icon: <svg className="size-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, value: "2", label: "Рисков", red: true },
              { icon: <svg className="size-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 7l-8.5 8.5-5-5L1 17"/><path d="M16 7h6v6"/></svg>, value: "34%", label: "Рост MoM", green: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                {s.icon}
                <span className={`text-lg font-bold ${s.red ? "text-red-400" : s.green ? "text-emerald-400" : "text-white"}`}>{s.value}</span>
                <span className="text-xs text-white/35">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 mb-14">
            <Link href="/dashboard/new" className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Новая стратегия
            </Link>
            <button className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold bg-white/[0.05] border border-white/[0.1] text-white/70 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all duration-200">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Спросить совет
            </button>
          </div>

          {/* Executive AI Board */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Executive AI Board</h3>
              <p className="text-xs text-white/35 mt-0.5">5 AI-директоров · Нажмите, чтобы задать вопрос</p>
            </div>
            <Link href="/dashboard/executives" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Открыть совет →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EXECUTIVES.map((exec) => (
              <div
                key={exec.role}
                className={`relative rounded-2xl bg-gradient-to-b ${exec.gradient} border ${exec.border} p-5 cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:shadow-lg`}
                style={{ boxShadow: `0 0 0 0 ${exec.color}00` }}
              >
                {/* Role header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: exec.color }}>{exec.role}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">{exec.subtitle}</div>
                  </div>
                  <span className="size-1.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                </div>

                {/* Name */}
                <div className="font-bold text-white text-sm mb-0.5">{exec.name}</div>
                <div className="text-[11px] text-white/40 mb-4">{exec.desc}</div>

                {/* Confidence */}
                <div className="text-2xl font-black mb-0.5" style={{ color: exec.color }}>{exec.confidence}%</div>
                <div className="text-[10px] text-white/30 mb-3">Уверенность AI</div>

                {/* Sparkline */}
                <div className="mb-4">
                  <Sparkline color={exec.sparkColor} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">{exec.tasks} задач активно</span>
                  <button className="text-[10px] font-medium px-2 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors inline-flex items-center gap-1">
                    Спросить
                    <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
