"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

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
  { role: "CEO", name: "Sophia Reeves", task: "Стратегическое видение", color: "#7c3aed" },
  { role: "CFO", name: "Marcus Chen", task: "Финансовый анализ", color: "#3b82f6" },
  { role: "CMO", name: "Elena Torres", task: "Маркетинговая стратегия", color: "#10b981" },
  { role: "COO", name: "James Wright", task: "Операционный план", color: "#f59e0b" },
  { role: "CTO", name: "Aiden Park", task: "Технологический стек", color: "#ec4899" },
];

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
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.07 } }),
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    // Try localStorage first for user projects
    const stored = localStorage.getItem("apex-user-projects");
    const localProjects: Project[] = stored ? JSON.parse(stored) : [];

    // Fetch from API (Supabase)
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects?.length) {
          setProjects(data.projects);
        } else if (localProjects.length) {
          setProjects(localProjects);
        } else {
          setProjects(DEMO_PROJECTS as Project[]);
        }
      })
      .catch(() => {
        if (localProjects.length) setProjects(localProjects);
        else setProjects(DEMO_PROJECTS as Project[]);
      })
      .finally(() => setLoading(false));
    void hour;
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";

  const avgScore = projects.length ? Math.round(projects.reduce((a, p) => a + p.overall_score, 0) / projects.length) : 0;

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
          <h1 className="text-xl font-bold text-white mb-0.5">{greeting}, Founder</h1>
          <p className="text-sm text-white/35">Ваш исполнительный совет готов к работе.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:-translate-y-0.5"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая стратегия
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Проектов", value: projects.length.toString(), sub: loading ? "загрузка..." : "всего", positive: true, g: "from-violet-600 to-purple-700", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg> },
          { label: "Средний балл", value: avgScore ? avgScore.toString() : "—", sub: avgScore >= 80 ? "отлично" : avgScore >= 60 ? "хорошо" : "в работе", positive: avgScore >= 75, g: "from-amber-500 to-orange-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          { label: "Отчётов", value: `${projects.filter(p => (p.ai_results as unknown[])?.length > 0).length} / 3`, sub: "2 остались", positive: false, g: "from-blue-600 to-cyan-700", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { label: "Прогноз выручки", value: "$4.2M", sub: "Все проекты", positive: true, g: "from-emerald-600 to-teal-700", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        ].map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" custom={i}>
            <Card className="p-4 hover:border-white/[0.1] transition-colors">
              <CardContent className="p-0">
                <div className={`size-8 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center text-white mb-3 shadow-lg`}>{s.icon}</div>
                <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
                <div className="text-[11px] text-white/35">{s.label}</div>
                <div className={`text-[11px] mt-0.5 ${s.positive ? "text-emerald-400/80" : "text-white/25"}`}>{s.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Projects list */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-white/80">Последние проекты</h2>
            <Link href="/dashboard/projects" className="text-xs text-violet-400/70 hover:text-violet-300 transition-colors">Все проекты →</Link>
          </div>

          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
            ))
          ) : (
            projects.slice(0, 5).map((p, i) => (
              <motion.div
                key={p.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={i + 4}
              >
                <Link href={`/dashboard/projects/${p.id}`}>
                  <Card hover className="cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600/15 to-blue-600/15 border border-violet-500/15 flex items-center justify-center flex-shrink-0 group-hover:border-violet-500/30 transition-colors">
                          <svg className="size-4 text-violet-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-white truncate">{p.name}</span>
                            <Badge variant={p.status === "active" ? "success" : "warning"} dot>
                              {p.status === "active" ? "Завершён" : "В работе"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-white/35 mb-2 truncate">{p.description ?? "Нет описания"}</p>
                          <div className="flex items-center gap-3">
                            <Progress value={p.overall_score} size="sm" className="flex-1" />
                            <span className={`text-xs font-semibold flex-shrink-0 ${p.overall_score >= 85 ? "text-emerald-400" : p.overall_score >= 75 ? "text-amber-400" : "text-red-400"}`}>{p.overall_score}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-semibold text-white">{p.target_revenue ?? "—"}</div>
                          <div className="text-[10px] text-white/25 mt-0.5">{timeAgo(p.created_at)}</div>
                        </div>
                        <svg className="size-3.5 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8}>
            <Link href="/dashboard/new">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/[0.07] hover:border-violet-500/25 hover:bg-violet-500/[0.03] transition-all cursor-pointer group">
                <div className="size-9 rounded-xl border border-dashed border-white/[0.1] group-hover:border-violet-500/30 flex items-center justify-center transition-colors">
                  <svg className="size-4 text-white/20 group-hover:text-violet-400/50 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div>
                  <div className="text-[13px] text-white/30 group-hover:text-white/50 transition-colors font-medium">Новая стратегия</div>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-white/80">Исполнительный совет</h3>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Готов к работе
                </span>
              </div>
              <div className="space-y-2">
                {AI_TEAM.map((exec) => (
                  <div key={exec.role} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors cursor-default">
                    <div
                      className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${exec.color}18`, border: `1px solid ${exec.color}22` }}
                    >
                      <span style={{ color: exec.color }}>{exec.role[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-white/65 truncate">{exec.name}</div>
                      <div className="text-[10px] text-white/25 truncate">{exec.task}</div>
                    </div>
                    <div className="size-1.5 rounded-full bg-emerald-500/60 flex-shrink-0" />
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/new"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-8 text-[12px] font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all hover:-translate-y-0.5"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Брифовать команду
              </Link>
            </CardContent>
          </Card>

          {/* Upgrade banner */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-blue-900/20" />
            <div className="absolute inset-0 border border-violet-500/15 rounded-2xl" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <div className="relative p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-1.5">Pro Plan</div>
              <p className="text-[12px] text-white/55 mb-3 leading-relaxed">Безлимитные отчёты, расширенный финансовый анализ и PDF экспорт.</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-white">$49</span>
                <span className="text-xs text-white/30">/мес</span>
              </div>
              <Link
                href="/dashboard/settings"
                className="w-full h-8 text-[12px] font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all inline-flex items-center justify-center"
              >
                Перейти на Pro
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Быстрые действия</div>
              <div className="space-y-1">
                {[
                  { label: "Новый анализ", href: "/dashboard/new", icon: "⚡" },
                  { label: "Все проекты", href: "/dashboard/projects", icon: "📁" },
                  { label: "Аналитика", href: "/dashboard/analytics", icon: "📊" },
                  { label: "Настройки", href: "/dashboard/settings", icon: "⚙️" },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                    <svg className="size-3 ml-auto text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
