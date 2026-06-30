"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";

const METRICS = [
  { label: "Всего проектов", value: "3", change: "+2 за месяц", up: true, color: "from-violet-600 to-purple-600" },
  { label: "Средний балл", value: "83", change: "+5 пунктов", up: true, color: "from-amber-500 to-orange-500" },
  { label: "Проектов завершено", value: "2", change: "67% завершено", up: true, color: "from-emerald-600 to-teal-600" },
  { label: "Прогноз выручки", value: "$4.2M", change: "по всем проектам", up: true, color: "from-blue-600 to-cyan-600" },
];

const PROJECTS_DATA = [
  { name: "AI Fitness Platform", score: 87, revenue: 2400000, market: 4200000000, growth: 24 },
  { name: "SaaS Invoice Platform", score: 91, revenue: 1800000, market: 2100000000, growth: 18 },
  { name: "Restaurant Chain", score: 72, revenue: 0, market: 890000000, growth: 9 },
];

const SCORE_BREAKDOWN = [
  { label: "Рыночный потенциал", value: 88 },
  { label: "Финансовая модель", value: 81 },
  { label: "Конкурентное преимущество", value: 79 },
  { label: "Операционная готовность", value: 74 },
  { label: "Маркетинговая стратегия", value: 85 },
  { label: "Технологии", value: 90 },
];

const PERIODS = ["7 дней", "30 дней", "3 месяца", "Всё время"];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30 дней");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Аналитика</h1>
          <p className="text-sm text-white/35">Детальный анализ ваших бизнес-стратегий</p>
        </div>
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${period === p ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {METRICS.map((m) => (
          <Card key={m.label} className="p-4">
            <CardContent className="p-0">
              <div className={`size-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3 opacity-90`}>
                <svg className="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{m.value}</div>
              <div className="text-xs text-white/35">{m.label}</div>
              <div className="text-xs mt-1 text-emerald-400">{m.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Сравнение проектов */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-white mb-5">Сравнение проектов</h2>
              <div className="space-y-5">
                {PROJECTS_DATA.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white/70">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/30">Рост {p.growth}%/год</span>
                        <span className={`text-xs font-bold ${p.score >= 85 ? "text-emerald-400" : p.score >= 75 ? "text-amber-400" : "text-red-400"}`}>{p.score}/100</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${p.score >= 85 ? "from-emerald-600 to-teal-500" : p.score >= 75 ? "from-amber-500 to-orange-500" : "from-red-600 to-rose-500"}`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/25">Прогноз: ${(p.revenue / 1000000).toFixed(1)}M</span>
                      <span className="text-[10px] text-white/25">Рынок: ${(p.market / 1000000000).toFixed(1)}B</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Разбивка по категориям */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-white mb-5">Средний балл по категориям</h2>
            <div className="space-y-3">
              {SCORE_BREAKDOWN.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-white/50">{item.label}</span>
                    <span className="text-[11px] font-semibold text-white">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Активность */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-white mb-5">Активность за период</h2>
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 50, 72, 82, 68, 91, 78, 85, 63, 77, 84, 69, 92, 74, 87, 61, 79, 88, 73].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-600/60 to-violet-400/30 hover:from-violet-500/80 hover:to-violet-300/50 transition-colors cursor-pointer"
                style={{ height: `${h}%` }}
                title={`День ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/20">1 {period.split(" ")[1] || "нед."}</span>
            <span className="text-[10px] text-white/20">Сегодня</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
