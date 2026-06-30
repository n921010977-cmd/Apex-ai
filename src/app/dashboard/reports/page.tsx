"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const REPORTS = [
  {
    id: "1",
    title: "AI-Powered Fitness Platform — Полный отчёт",
    project: "AI Fitness Platform",
    type: "Полный анализ",
    date: "2 часа назад",
    pages: 24,
    score: 87,
    status: "ready",
    sections: ["Резюме", "Финансовая модель", "Анализ рынка", "Маркетинг", "Операции", "Риски", "Дорожная карта"],
  },
  {
    id: "2",
    title: "SaaS Invoice Platform — Стратегический отчёт",
    project: "SaaS Invoice Platform",
    type: "Стратегический",
    date: "Вчера",
    pages: 18,
    score: 91,
    status: "ready",
    sections: ["Резюме", "Финансовая модель", "Анализ рынка", "Маркетинг", "Технологии"],
  },
  {
    id: "3",
    title: "Restaurant Chain — Анализ расширения",
    project: "Local Restaurant Chain",
    type: "В работе",
    date: "В процессе",
    pages: 0,
    score: 72,
    status: "in_progress",
    sections: [],
  },
];

const SECTION_ICONS: Record<string, JSX.Element> = {
  "Резюме": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  "Финансовая модель": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  "Анализ рынка": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  "Маркетинг": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  "Операции": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  "Риски": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  "Технологии": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  "Дорожная карта": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

export default function ReportsPage() {
  const [selected, setSelected] = useState<string | null>("1");
  const activeReport = REPORTS.find((r) => r.id === selected) ?? null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Отчёты</h1>
          <p className="text-sm text-white/35">Аналитические отчёты по вашим проектам</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">Использовано: 1 из 3</span>
          <button className="h-9 px-4 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all">
            Создать отчёт
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Список отчётов */}
        <div className="space-y-3">
          {REPORTS.map((r) => (
            <div
              key={r.id}
              onClick={() => r.status === "ready" && setSelected(r.id)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                selected === r.id
                  ? "border-violet-500/40 bg-violet-600/10"
                  : r.status === "in_progress"
                  ? "border-white/[0.06] bg-white/[0.02] opacity-60 cursor-not-allowed"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant={r.status === "ready" ? "success" : "warning"} dot>
                  {r.status === "ready" ? "Готов" : "В работе"}
                </Badge>
                <span className="text-[10px] text-white/25">{r.date}</span>
              </div>
              <h3 className="text-xs font-semibold text-white mb-1 leading-relaxed">{r.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-white/30">{r.type}</span>
                {r.pages > 0 && <><span className="text-white/15">·</span><span className="text-[10px] text-white/30">{r.pages} стр.</span></>}
                <span className="text-white/15">·</span>
                <span className={`text-[10px] font-semibold ${r.score >= 85 ? "text-emerald-400" : r.score >= 75 ? "text-amber-400" : "text-red-400"}`}>{r.score}/100</span>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-center">
            <p className="text-xs text-white/25 mb-2">Осталось 2 отчёта в месяц</p>
            <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Upgrade для безлимита →</button>
          </div>
        </div>

        {/* Просмотр отчёта */}
        <div className="xl:col-span-2">
          {activeReport ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white mb-1">{activeReport.title}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" dot>Готов</Badge>
                      <span className="text-xs text-white/30">{activeReport.pages} страниц</span>
                      <span className="text-white/15">·</span>
                      <span className="text-xs text-white/30">{activeReport.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${activeReport.score >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{activeReport.score}</div>
                    <div className="text-[10px] text-white/30">Бизнес-балл</div>
                  </div>
                </div>

                {/* Резюме */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Краткое резюме</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Проект демонстрирует высокий потенциал в быстрорастущем рынке. Финансовая модель устойчива с прогнозом выхода на прибыль через 18 месяцев. Рекомендуется ускорить выход на рынок для захвата первичной доли.
                  </p>
                </div>

                {/* Разделы */}
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Разделы отчёта</h3>
                <div className="grid grid-cols-2 gap-2">
                  {activeReport.sections.map((section) => (
                    <div
                      key={section}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 hover:bg-violet-500/5 cursor-pointer transition-all group"
                    >
                      <div className="size-7 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                        {SECTION_ICONS[section] || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>}
                      </div>
                      <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">{section}</span>
                      <svg className="size-3 text-white/20 group-hover:text-violet-400 ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="flex-1 h-9 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all">
                    Скачать PDF
                  </button>
                  <button className="h-9 px-4 text-xs font-medium border border-white/[0.10] text-white/60 rounded-xl hover:border-white/20 hover:text-white/80 transition-all">
                    Поделиться
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 flex flex-col items-center text-center gap-3">
                <div className="size-12 rounded-xl border border-dashed border-white/[0.10] flex items-center justify-center">
                  <svg className="size-6 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p className="text-sm text-white/30">Выберите отчёт для просмотра</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
