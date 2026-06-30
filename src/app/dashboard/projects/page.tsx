"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

const PROJECTS = [
  { id: "demo", name: "AI-Powered Fitness Platform", description: "Мобильное приложение с персонализированными планами тренировок и питания на основе AI", industry: "Mobile App · SaaS", score: 87, status: "complete", executives: 8, date: "2 часа назад", revenue: "$2.4M", market: "$4.2B", growth: "+24%/год" },
  { id: "2", name: "SaaS Invoice Platform", description: "Автоматизированное выставление счетов и управление платежами для фрилансеров и агентств", industry: "SaaS · FinTech", score: 91, status: "complete", executives: 8, date: "Вчера", revenue: "$1.8M", market: "$2.1B", growth: "+18%/год" },
  { id: "3", name: "Local Restaurant Chain", description: "Стратегия расширения для регионального ресторанного бренда в сегменте fast-casual", industry: "Restaurant · Food", score: 72, status: "in_progress", executives: 5, date: "В процессе", revenue: "Считается…", market: "$890M", growth: "+9%/год" },
];

const FILTERS = ["Все", "Завершённые", "В работе"];

export default function ProjectsPage() {
  const [filter, setFilter] = useState("Все");
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = PROJECTS.filter((p) => {
    if (filter === "Завершённые") return p.status === "complete";
    if (filter === "В работе") return p.status === "in_progress";
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Мои проекты</h1>
          <p className="text-sm text-white/35">Все ваши бизнес-стратегии в одном месте</p>
        </div>
        <Link href="/dashboard/new" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая стратегия
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Всего проектов", value: PROJECTS.length.toString(), color: "from-violet-600 to-purple-600" },
          { label: "Завершено", value: PROJECTS.filter((p) => p.status === "complete").length.toString(), color: "from-emerald-600 to-teal-600" },
          { label: "В работе", value: PROJECTS.filter((p) => p.status === "in_progress").length.toString(), color: "from-amber-500 to-orange-500" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <CardContent className="p-0 flex items-center gap-3">
              <div className={`size-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-white/35">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Фильтры и переключатель вида */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${filter === f ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView("list")} className={`size-8 rounded-lg flex items-center justify-center transition-colors ${view === "list" ? "bg-violet-600/20 text-violet-400" : "text-white/30 hover:text-white/60"}`}>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button onClick={() => setView("grid")} className={`size-8 rounded-lg flex items-center justify-center transition-colors ${view === "grid" ? "bg-violet-600/20 text-violet-400" : "text-white/30 hover:text-white/60"}`}>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          </button>
        </div>
      </div>

      {/* Список / Сетка */}
      {view === "list" ? (
        <div className="space-y-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card hover className="cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="size-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{project.name}</span>
                        <Badge variant={project.status === "complete" ? "success" : "warning"} dot>
                          {project.status === "complete" ? "Завершён" : "В работе"}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/35 mb-1">{project.description}</p>
                      <div className="text-[10px] text-white/25">{project.industry} · {project.executives} экспертов · {project.date}</div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <div className={`text-xl font-bold ${project.score >= 85 ? "text-emerald-400" : project.score >= 75 ? "text-amber-400" : "text-red-400"}`}>{project.score}</div>
                        <div className="text-[10px] text-white/25">Балл</div>
                        <Progress value={project.score} size="sm" className="mt-1 w-16" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-400">{project.revenue}</div>
                        <div className="text-[10px] text-white/25">Прогноз</div>
                        <div className="text-[10px] text-white/25 mt-0.5">{project.growth}</div>
                      </div>
                      <svg className="size-4 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card hover className="cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center">
                      <svg className="size-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <Badge variant={project.status === "complete" ? "success" : "warning"} dot>
                      {project.status === "complete" ? "Завершён" : "В работе"}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{project.name}</h3>
                  <p className="text-xs text-white/35 mb-4 leading-relaxed">{project.description}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${project.score >= 85 ? "text-emerald-400" : project.score >= 75 ? "text-amber-400" : "text-red-400"}`}>{project.score}</div>
                      <div className="text-[10px] text-white/25">Бизнес-балл</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{project.revenue}</div>
                      <div className="text-[10px] text-white/25">Прогноз выручки</div>
                    </div>
                  </div>
                  <Progress value={project.score} size="sm" className="mt-3" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-sm text-white/30">Нет проектов в этой категории</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
