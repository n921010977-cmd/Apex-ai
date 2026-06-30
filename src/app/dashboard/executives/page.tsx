"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const EXECUTIVES = [
  {
    role: "CEO",
    title: "Исполнительный директор",
    name: "Alex Morgan",
    color: "#7c3aed",
    gradient: "from-violet-600 to-purple-600",
    status: "active",
    expertise: ["Стратегия роста", "Лидерство", "Инвесторы"],
    bio: "Более 15 лет опыта в масштабировании стартапов от идеи до Series B. Специализируется на product-market fit и построении команд.",
    insights: [
      "Фокусируйтесь на одном ключевом сегменте рынка в первые 12 месяцев",
      "Привлекайте инвесторов только когда есть чёткие метрики роста",
      "Командная культура важнее любой стратегии — нанимайте тщательно",
    ],
    completedProjects: 3,
    avgScore: 87,
  },
  {
    role: "CFO",
    title: "Финансовый директор",
    name: "Sarah Chen",
    color: "#3b82f6",
    gradient: "from-blue-600 to-cyan-600",
    status: "active",
    expertise: ["Финансовое моделирование", "Unit-экономика", "Привлечение капитала"],
    bio: "Опыт в построении финансовых моделей для SaaS, marketplace и hardware стартапов. Помогла 20+ компаниям привлечь финансирование.",
    insights: [
      "CAC/LTV > 3:1 — минимальный порог для масштабирования",
      "Runway должен быть минимум 18 месяцев перед следующим раундом",
      "Следите за gross margin с первого дня, это ключевой сигнал для инвесторов",
    ],
    completedProjects: 3,
    avgScore: 91,
  },
  {
    role: "CMO",
    title: "Директор по маркетингу",
    name: "James Rivera",
    color: "#10b981",
    gradient: "from-emerald-600 to-teal-600",
    status: "active",
    expertise: ["Growth hacking", "Brand building", "Digital marketing"],
    bio: "Создавал маркетинговые стратегии для B2B и B2C компаний с нулём до миллиона пользователей. Эксперт в performance и content маркетинге.",
    insights: [
      "Начинайте с 1-2 каналов привлечения, не распыляйтесь",
      "Контент-маркетинг даёт лучший ROI в долгосрочной перспективе",
      "NPS и word-of-mouth — самые дешёвые источники роста",
    ],
    completedProjects: 3,
    avgScore: 84,
  },
  {
    role: "COO",
    title: "Операционный директор",
    name: "Maria Santos",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-500",
    status: "active",
    expertise: ["Операционная эффективность", "Процессы", "Масштабирование"],
    bio: "Построила операционные системы для компаний от 5 до 500 сотрудников. Специализируется на автоматизации и оптимизации процессов.",
    insights: [
      "Документируйте процессы с первого дня — масштабирование без них невозможно",
      "Автоматизируйте всё, что повторяется более 3 раз в неделю",
      "OKR работают только если команда понимает зачем они нужны",
    ],
    completedProjects: 3,
    avgScore: 79,
  },
  {
    role: "CTO",
    title: "Технический директор",
    name: "David Kim",
    color: "#ec4899",
    gradient: "from-pink-600 to-rose-600",
    status: "active",
    expertise: ["Архитектура", "AI/ML", "DevOps"],
    bio: "15 лет в разработке масштабируемых систем. Строил технические команды и архитектуры для продуктов с миллионами пользователей.",
    insights: [
      "MVP должен быть ugly — красота приходит с пониманием пользователей",
      "Технический долг убивает стартапы — рефакторьте постоянно, по чуть-чуть",
      "Безопасность данных с первого дня — потом будет в 10 раз дороже",
    ],
    completedProjects: 3,
    avgScore: 90,
  },
];

export default function ExecutivesPage() {
  const [active, setActive] = useState(EXECUTIVES[0]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Исполнительный совет</h1>
        <p className="text-sm text-white/35">Ваша команда AI-экспертов, готовая анализировать бизнес-стратегии</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Список */}
        <div className="space-y-2">
          {EXECUTIVES.map((exec) => (
            <button
              key={exec.role}
              onClick={() => setActive(exec)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                active.role === exec.role
                  ? "border-violet-500/40 bg-violet-600/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${exec.color}25`, border: `1px solid ${exec.color}40` }}
                >
                  <span style={{ color: exec.color }}>{exec.role[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{exec.role}</span>
                    <Badge variant="success" dot>Активен</Badge>
                  </div>
                  <div className="text-[11px] text-white/35 truncate">{exec.title}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: exec.color }}>{exec.avgScore}</div>
                  <div className="text-[10px] text-white/25">балл</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Детали */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-5 mb-6">
                <div
                  className={`size-16 rounded-2xl flex items-center justify-center text-xl font-bold bg-gradient-to-br ${active.gradient} text-white flex-shrink-0 shadow-lg`}
                  style={{ boxShadow: `0 8px 32px ${active.color}40` }}
                >
                  {active.role[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-white">{active.name}</h2>
                    <Badge variant="success" dot>Активен</Badge>
                  </div>
                  <p className="text-sm text-white/40">{active.title}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {active.expertise.map((e) => (
                      <span key={e} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold" style={{ color: active.color }}>{active.avgScore}</div>
                  <div className="text-[10px] text-white/30">средний балл</div>
                  <div className="text-[10px] text-white/25 mt-0.5">{active.completedProjects} проекта</div>
                </div>
              </div>

              <p className="text-sm text-white/55 leading-relaxed mb-6">{active.bio}</p>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Ключевые инсайты</h3>
                <div className="space-y-3">
                  {active.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: `${active.color}25`, color: active.color }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Статистика вклада */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Проектов", value: active.completedProjects.toString() },
              { label: "Средний балл", value: active.avgScore.toString() },
              { label: "Статус", value: "Активен" },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <CardContent className="p-0 text-center">
                  <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
                  <div className="text-[11px] text-white/30">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <button
            className="w-full h-10 text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Брифовать совет по новому проекту
          </button>
        </div>
      </div>
    </div>
  );
}
