import Link from "next/link";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

const RECENT_PROJECTS = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Мобильное приложение с AI-персонализацией тренировок", score: 87, status: "complete", date: "2ч назад", revenue: "$2.4M" },
  { id: "2", name: "SaaS Invoice Platform", description: "Автоматизированное выставление счетов для фрилансеров", score: 91, status: "complete", date: "Вчера", revenue: "$1.8M" },
  { id: "3", name: "Local Restaurant Chain", description: "Стратегия расширения ресторанного бренда fast-casual", score: 72, status: "in_progress", date: "В процессе", revenue: "—" },
];

const AI_TEAM = [
  { role: "CEO", name: "Sophia Reeves", task: "Стратегическое видение", color: "#7c3aed", status: "ready" },
  { role: "CFO", name: "Marcus Chen", task: "Финансовый анализ", color: "#3b82f6", status: "ready" },
  { role: "CMO", name: "Elena Torres", task: "Маркетинговая стратегия", color: "#10b981", status: "ready" },
  { role: "COO", name: "James Wright", task: "Операционный план", color: "#f59e0b", status: "ready" },
  { role: "CTO", name: "Aiden Park", task: "Технологический стек", color: "#ec4899", status: "ready" },
];

export default function DashboardPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 17 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">{greeting}, Founder</h1>
          <p className="text-sm text-white/35">Ваш исполнительный совет готов к работе.</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-violet-500/20"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новая стратегия
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Проектов", value: "3", sub: "+2 в этом месяце", positive: true, g: "from-violet-600 to-purple-700", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg> },
          { label: "Средний балл", value: "82", sub: "+5 пт улучшение", positive: true, g: "from-amber-500 to-orange-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          { label: "Отчётов", value: "1 / 3", sub: "2 остались", positive: false, g: "from-blue-600 to-cyan-700", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { label: "Прогноз выручки", value: "$4.2M", sub: "Все проекты", positive: true, g: "from-emerald-600 to-teal-700", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        ].map((s) => (
          <Card key={s.label} className="p-4 hover:border-white/[0.1] transition-colors">
            <CardContent className="p-0">
              <div className={`size-8 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center text-white mb-3 shadow-lg`}>{s.icon}</div>
              <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-[11px] text-white/35">{s.label}</div>
              <div className={`text-[11px] mt-0.5 ${s.positive ? "text-emerald-400/80" : "text-white/25"}`}>{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Projects list */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-white/80">Последние проекты</h2>
            <Link href="/dashboard/projects" className="text-xs text-violet-400/70 hover:text-violet-300 transition-colors">Все проекты →</Link>
          </div>

          {RECENT_PROJECTS.map((p) => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
              <Card hover className="cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600/15 to-blue-600/15 border border-violet-500/15 flex items-center justify-center flex-shrink-0 group-hover:border-violet-500/30 transition-colors">
                      <svg className="size-4 text-violet-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-white truncate">{p.name}</span>
                        <Badge variant={p.status === "complete" ? "success" : "warning"} dot>
                          {p.status === "complete" ? "Завершён" : "В работе"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-white/35 mb-2 truncate">{p.description}</p>
                      <div className="flex items-center gap-3">
                        <Progress value={p.score} size="sm" className="flex-1" />
                        <span className={`text-xs font-semibold flex-shrink-0 ${p.score >= 85 ? "text-emerald-400" : p.score >= 75 ? "text-amber-400" : "text-red-400"}`}>{p.score}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-white">{p.revenue}</div>
                      <div className="text-[10px] text-white/25 mt-0.5">{p.date}</div>
                    </div>
                    <svg className="size-3.5 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

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
        </div>

        {/* Right column */}
        <div className="space-y-4">
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
                  <div key={exec.role} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors group cursor-default">
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
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-8 text-[12px] font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Брифовать команду
              </Link>
            </CardContent>
          </Card>

          {/* Upgrade */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-blue-900/20" />
            <div className="absolute inset-0 border border-violet-500/15 rounded-2xl" />
            <div className="relative p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-1.5">Pro Plan</div>
              <p className="text-[12px] text-white/55 mb-3 leading-relaxed">Безлимитные отчёты, расширенный финансовый анализ и PDF экспорт.</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-white">$49</span>
                <span className="text-xs text-white/30">/мес</span>
              </div>
              <button className="w-full h-8 text-[12px] font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all">
                Перейти на Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
