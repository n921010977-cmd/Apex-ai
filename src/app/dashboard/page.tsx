"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

interface Project {
  id: string;
  name: string;
  description: string | null;
  overall_score: number;
  status: string;
  created_at: string;
  target_revenue: string | null;
  ai_results: unknown[];
}

const DEMO_PROJECTS = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Мобильное приложение с AI-персонализацией тренировок", overall_score: 87, status: "active", created_at: new Date(Date.now() - 2 * 3600000).toISOString(), target_revenue: "$2.4M", ai_results: [1,2,3] },
  { id: "2", name: "SaaS Invoice Platform", description: "Автоматизированное выставление счетов для фрилансеров", overall_score: 91, status: "active", created_at: new Date(Date.now() - 86400000).toISOString(), target_revenue: "$1.8M", ai_results: [1,2,3] },
];

const AI_TEAM = [
  { role: "CEO", name: "София Ривз",   task: "Стратегическое видение",   color: "#7c3aed" },
  { role: "CFO", name: "Маркус Чен",   task: "Финансовый анализ",         color: "#3b82f6" },
  { role: "CMO", name: "Елена Торрес", task: "Маркетинговая стратегия",   color: "#10b981" },
  { role: "COO", name: "Джеймс Райт", task: "Операционный план",          color: "#f59e0b" },
  { role: "CTO", name: "Парк Айден",   task: "Технологический стек",      color: "#ec4899" },
];

// Mini sparkline for revenue card
const SPARKLINE = [30, 38, 45, 42, 55, 60, 58, 70, 75, 82, 88, 95];
function Sparkline() {
  const W = 80; const H = 28; const n = SPARKLINE.length;
  const min = Math.min(...SPARKLINE); const max = Math.max(...SPARKLINE);
  const pts = SPARKLINE.map((v, i) => ({
    x: (i / (n - 1)) * W,
    y: H - ((v - min) / (max - min)) * H,
  }));
  const line = pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const mx = (prev.x + p.x) / 2;
    return `C ${mx.toFixed(1)} ${prev.y.toFixed(1)} ${mx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");
  const area = `${line} L ${pts[n-1].x} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
      <defs>
        <linearGradient id="spFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spFill)"/>
      <path d={line} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px rgba(52,211,153,0.7))" }}/>
      <circle cx={pts[n-1].x} cy={pts[n-1].y} r="2.5" fill="#34d399"
        style={{ filter: "drop-shadow(0 0 4px #34d399)" }}/>
    </svg>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Только что";
  if (h < 24) return `${h}ч назад`;
  if (d === 1) return "Вчера";
  return `${d}д назад`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } }),
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("apex-user-projects");
    const localProjects: Project[] = stored ? JSON.parse(stored) : [];
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects?.length) setProjects(data.projects);
        else if (localProjects.length) setProjects(localProjects);
        else setProjects(DEMO_PROJECTS as Project[]);
      })
      .catch(() => {
        if (localProjects.length) setProjects(localProjects);
        else setProjects(DEMO_PROJECTS as Project[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";
  const avgScore = projects.length ? Math.round(projects.reduce((a, p) => a + p.overall_score, 0) / projects.length) : 0;

  const STAT_CARDS = [
    {
      label: "Проектов", value: loading ? "…" : projects.length.toString(),
      sub: loading ? "загрузка..." : "всего",
      color: "#7c3aed", glow: "rgba(124,58,237,0.4)", positive: true,
      icon: (
        <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2" y="6" width="16" height="11" rx="2"/>
          <path d="M2 9h16"/><path d="M6 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
        </svg>
      ),
      extra: null,
    },
    {
      label: "Средний балл",
      value: avgScore ? avgScore.toString() : null,
      sub: avgScore >= 80 ? "отлично" : avgScore >= 60 ? "хорошо" : "в работе",
      color: "#f59e0b", glow: "rgba(245,158,11,0.4)", positive: avgScore >= 75,
      icon: (
        <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <polygon points="10 2 12.6 7.3 18.5 8.1 14.3 12.2 15.2 18.1 10 15.3 4.8 18.1 5.7 12.2 1.5 8.1 7.4 7.3"/>
        </svg>
      ),
      extra: null,
    },
    {
      label: "Отчётов",
      value: loading ? "…" : `${projects.filter(p => (p.ai_results as unknown[])?.length > 0).length} / 3`,
      sub: "2 остались",
      color: "#3b82f6", glow: "rgba(59,130,246,0.4)", positive: false,
      icon: (
        <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="15" y1="17" x2="15" y2="8"/><line x1="10" y1="17" x2="10" y2="3"/>
          <line x1="5" y1="17" x2="5" y2="11"/>
        </svg>
      ),
      extra: null,
    },
    {
      label: "Прогноз выручки", value: "$4.2M", sub: "по всем проектам",
      color: "#10b981", glow: "rgba(16,185,129,0.4)", positive: true,
      icon: (
        <svg viewBox="0 0 20 20" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <polyline points="2 12 5 8 8 10 12 5 18 8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="2" y1="17" x2="18" y2="17" strokeLinecap="round"/>
        </svg>
      ),
      extra: <Sparkline />,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">{greeting}, основатель</h1>
          <p className="text-sm text-white/35">Ваш исполнительный совет готов к работе.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            boxShadow: "0 8px 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая стратегия
        </Link>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STAT_CARDS.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" custom={i}>
            <div
              className="relative rounded-2xl overflow-hidden p-4 group transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(10,10,14,0.88) 100%)",
                border: `1px solid rgba(255,255,255,0.08)`,
                backdropFilter: "blur(14px)",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 6px 28px rgba(0,0,0,0.25)`,
              }}
            >
              {/* neon top shimmer */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}50, transparent)` }} />
              {/* bottom metallic bevel */}
              <div className="absolute inset-x-0 bottom-0 h-px opacity-20" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />

              <div className="flex items-start justify-between mb-3">
                <div
                  className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}28`, color: s.color }}
                >
                  {s.icon}
                </div>
                {s.extra && <div className="flex-shrink-0 mt-1">{s.extra}</div>}
              </div>

              {/* value / computing indicator */}
              {s.value !== null ? (
                <div className="text-xl font-bold font-mono mb-0.5" style={{ color: s.color, textShadow: `0 0 20px ${s.glow}` }}>
                  {s.value}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mb-0.5 h-7">
                  <span className="text-[11px] text-white/35">Вычисляется</span>
                  <span className="flex gap-0.5">
                    {[0,1,2].map(d => (
                      <span key={d} className="size-1 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                    ))}
                  </span>
                </div>
              )}
              <div className="text-[11px] text-white/35 mb-1">{s.label}</div>
              <div className={`text-[10px] ${s.positive ? "text-emerald-400/80" : "text-white/25"}`}>{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Projects */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-white/80">Последние проекты</h2>
            <Link href="/dashboard/projects" className="text-xs text-violet-400/70 hover:text-violet-300 transition-colors">Все проекты →</Link>
          </div>

          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
            ))
          ) : (
            projects.slice(0, 5).map((p, i) => {
              const scoreColor = p.overall_score >= 85 ? "#34d399" : p.overall_score >= 75 ? "#f59e0b" : "#f87171";
              return (
                <motion.div key={p.id} variants={fadeUp} initial="hidden" animate="show" custom={i + 4}>
                  <Link href={`/dashboard/projects/${p.id}`}>
                    <div
                      className="relative rounded-2xl overflow-hidden p-4 cursor-pointer group transition-all duration-200 hover:scale-[1.01] hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(10,10,14,0.85) 100%)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px group-hover:opacity-100 opacity-0 transition-opacity"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)" }} />

                      <div className="flex items-center gap-4">
                        {/* avatar */}
                        <div
                          className="size-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
                        >
                          <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-white truncate">{p.name}</span>
                            <Badge variant={p.status === "active" ? "success" : "warning"} dot>
                              {p.status === "active" ? "Завершён" : "В работе"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-white/35 mb-2.5 truncate">{p.description ?? "Нет описания"}</p>
                          {/* glowing progress bar */}
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${p.overall_score}%`,
                                background: `linear-gradient(90deg, ${scoreColor}aa, ${scoreColor})`,
                                boxShadow: `0 0 8px ${scoreColor}80`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-bold font-mono" style={{ color: scoreColor }}>{p.overall_score}</div>
                          <div className="text-[10px] text-white/25 mt-0.5">{p.target_revenue ?? "—"}</div>
                          <div className="text-[9px] text-white/20 mt-0.5">{timeAgo(p.created_at)}</div>
                        </div>

                        <svg className="size-3.5 text-white/15 group-hover:text-violet-400/40 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}

          {/* New strategy slot */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8}>
            <Link href="/dashboard/new">
              <div
                className="flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
                style={{
                  border: "1px dashed rgba(255,255,255,0.08)",
                  background: "transparent",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.3)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-dashed transition-all duration-200"
                  style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
                >
                  <svg className="size-4 text-white/20 group-hover:text-violet-400/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white/30 group-hover:text-white/55 transition-colors">Новая стратегия</div>
                  <div className="text-[11px] text-white/15">Опишите бизнес-идею и получите AI-анализ</div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Right column */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* AI Team */}
          <div
            className="relative rounded-2xl overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(10,10,14,0.92) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(14px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)" }} />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-white/80">Исполнительный совет</h3>
              <span className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
                Готов к работе
              </span>
            </div>

            <div className="space-y-1">
              {AI_TEAM.map((exec) => (
                <div
                  key={exec.role}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 hover:bg-white/[0.03] cursor-default group"
                >
                  <div
                    className="size-8 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: `${exec.color}18`,
                      border: `1px solid ${exec.color}28`,
                      color: exec.color,
                      boxShadow: `0 0 8px ${exec.color}20`,
                    }}
                  >
                    {exec.role[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-white/70 truncate">{exec.name}</div>
                    <div className="text-[10px] text-white/25 truncate">{exec.task}</div>
                  </div>
                  <div className="size-2 rounded-full flex-shrink-0"
                    style={{ background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/new"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 text-[12px] font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                boxShadow: "0 6px 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Брифовать команду
            </Link>
          </div>

          {/* Pro plan banner */}
          <div
            className="relative rounded-2xl overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.08) 100%)",
              border: "1px solid rgba(124,58,237,0.2)",
              backdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(124,58,237,0.18), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.55), transparent)" }} />
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#a78bfa" }}>Pro Plan</div>
            <p className="text-[11.5px] text-white/50 mb-3 leading-relaxed">Безлимитные отчёты, расширенный финансовый анализ и PDF экспорт.</p>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold font-mono text-white">$49</span>
              <span className="text-xs text-white/30">/мес</span>
            </div>
            <Link
              href="/dashboard/settings"
              className="w-full h-8 text-[11px] font-semibold text-white rounded-xl inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
              }}
            >
              Перейти на Pro
            </Link>
          </div>

          {/* Quick actions */}
          <div
            className="relative rounded-2xl overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,14,0.88) 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-3">Быстрые действия</div>
            <div className="space-y-0.5">
              {[
                { label: "Новый анализ",  href: "/dashboard/new",       icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v5.5l2.5 2.5"/><circle cx="8" cy="8" r="6"/></svg> },
                { label: "Все проекты",   href: "/dashboard/projects",  icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="5" width="14" height="9" rx="1.5"/><path d="M1 8h14"/><path d="M5 5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V5"/></svg> },
                { label: "Аналитика",     href: "/dashboard/analytics", icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="2 11 5 7 8 9 11 5 14 7"/></svg> },
                { label: "Настройки",     href: "/dashboard/settings",  icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"/></svg> },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-white/45 hover:text-white/75 hover:bg-white/[0.04] transition-all"
                >
                  <span className="text-white/30">{action.icon}</span>
                  {action.label}
                  <svg className="size-3 ml-auto text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
