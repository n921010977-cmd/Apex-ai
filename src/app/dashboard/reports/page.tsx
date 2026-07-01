"use client";

import { useState } from "react";

const REPORTS = [
  {
    id: "1",
    title: "Фитнес-платформа на базе ИИ — Полный отчёт",
    type: "Полный анализ",
    date: "2 часа назад",
    pages: 24,
    score: 87,
    status: "ready",
    summary: "Проект демонстрирует высокий потенциал в быстрорастущем рынке. Финансовая модель устойчива с прогнозом выхода на прибыль через 18 месяцев. Рекомендуется ускорить выход на рынок для захвата первичной доли.",
    sections: ["Резюме", "Финансовая модель", "Анализ рынка", "Маркетинг", "Операции", "Риски", "Дорожная карта"],
  },
  {
    id: "2",
    title: "SaaS Invoice Platform — Стратегический отчёт",
    type: "Стратегический",
    date: "Вчера",
    pages: 18,
    score: 91,
    status: "ready",
    summary: "SaaS Invoice Platform показывает исключительные метрики unit-экономики. LTV/CAC 11.2x — класс-А по отраслевым стандартам. Приоритет — масштабирование через канал дизайн-агентств.",
    sections: ["Резюме", "Финансовая модель", "Анализ рынка", "Маркетинг", "Технологии"],
  },
  {
    id: "3",
    title: "Сеть ресторанов — Анализ расширения",
    type: "В работе",
    date: "В процессе",
    pages: 0,
    score: 72,
    status: "in_progress",
    summary: "",
    sections: [],
  },
];

// Section config: icon + accent color
const SECTION_CFG: Record<string, { color: string; glow: string; icon: React.ReactNode }> = {
  "Резюме": {
    color: "#a78bfa", glow: "rgba(167,139,250,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h7l3 3v9H3V2z"/><path d="M10 2v3h3"/><line x1="5" y1="7" x2="11" y2="7"/><line x1="5" y1="9.5" x2="11" y2="9.5"/><line x1="5" y1="12" x2="8" y2="12"/></svg>,
  },
  "Финансовая модель": {
    color: "#34d399", glow: "rgba(52,211,153,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="1" x2="8" y2="15"/><path d="M11 3.5H6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H4"/></svg>,
  },
  "Анализ рынка": {
    color: "#22d3ee", glow: "rgba(34,211,238,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="m13 13-2.5-2.5"/></svg>,
  },
  "Маркетинг": {
    color: "#f472b6", glow: "rgba(244,114,182,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2L9 4 4 2 2 6l5 2 3 5 4-2-2-5z"/><circle cx="4.5" cy="11.5" r="1.5"/></svg>,
  },
  "Операции": {
    color: "#fbbf24", glow: "rgba(251,191,36,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"/></svg>,
  },
  "Риски": {
    color: "#f87171", glow: "rgba(248,113,113,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L1 14h14L8 1z"/><line x1="8" y1="6" x2="8" y2="9.5"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>,
  },
  "Технологии": {
    color: "#60a5fa", glow: "rgba(96,165,250,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="11 12 14 8 11 4"/><polyline points="5 4 2 8 5 12"/><line x1="9.5" y1="3" x2="6.5" y2="13"/></svg>,
  },
  "Дорожная карта": {
    color: "#818cf8", glow: "rgba(129,140,248,0.35)",
    icon: <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  },
};

export default function ReportsPage() {
  const [selected, setSelected] = useState<string>("1");
  const activeReport = REPORTS.find((r) => r.id === selected) ?? null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">Отчёты</h1>
          <p className="text-sm text-white/35">Аналитические отчёты по вашим проектам</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">Использовано: 1 из 3</span>
          <button
            className="h-9 px-4 text-xs font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              boxShadow: "0 6px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            Создать отчёт
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">

        {/* ── Left: report list ── */}
        <div className="space-y-3">
          {REPORTS.map((r) => {
            const isActive = selected === r.id;
            const isBlocked = r.status === "in_progress";
            const scoreColor = r.score >= 85 ? "#34d399" : r.score >= 75 ? "#f59e0b" : "#f87171";
            return (
              <div
                key={r.id}
                onClick={() => !isBlocked && setSelected(r.id)}
                className="relative rounded-2xl overflow-hidden p-4 transition-all duration-200"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(10,10,14,0.92) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,10,14,0.8) 100%)",
                  border: isActive
                    ? "1px solid rgba(124,58,237,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                  cursor: isBlocked ? "not-allowed" : "pointer",
                  opacity: isBlocked ? 0.55 : 1,
                  boxShadow: isActive ? "inset 0 1px 0 rgba(124,58,237,0.2), 0 8px 24px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {/* shimmer top */}
                <div className="absolute inset-x-0 top-0 h-px" style={{
                  background: isActive
                    ? "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                }} />

                {/* status + date */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={r.status === "ready" ? {
                      background: "rgba(52,211,153,0.12)",
                      border: "1px solid rgba(52,211,153,0.25)",
                      color: "#34d399",
                    } : {
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.25)",
                      color: "#fbbf24",
                    }}
                  >
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{
                      background: r.status === "ready" ? "#34d399" : "#fbbf24",
                      boxShadow: r.status === "ready" ? "0 0 5px rgba(52,211,153,0.8)" : "0 0 5px rgba(251,191,36,0.8)",
                    }} />
                    {r.status === "ready" ? "Готов" : "В работе"}
                  </span>
                  <span className="text-[9px] text-white/25">{r.date}</span>
                </div>

                {/* title */}
                <h3 className="text-[12px] font-semibold text-white/85 leading-snug mb-2">{r.title}</h3>

                {/* meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] text-white/30">{r.type}</span>
                  {r.pages > 0 && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="text-[9px] text-white/30">{r.pages} стр.</span>
                    </>
                  )}
                  <span className="text-white/15">·</span>
                  <span className="text-[9px] font-bold font-mono" style={{ color: scoreColor }}>{r.score}/100</span>
                </div>
              </div>
            );
          })}

          {/* Usage indicator */}
          <div
            className="relative rounded-2xl overflow-hidden p-4 text-center"
            style={{
              border: "1px dashed rgba(255,255,255,0.08)",
              background: "transparent",
            }}
          >
            <p className="text-[10px] text-white/25 mb-2">Осталось 2 отчёта в месяц</p>
            <button className="text-[10px] text-violet-400/70 hover:text-violet-300 transition-colors">Апгрейд для безлимита →</button>
          </div>
        </div>

        {/* ── Right: detail panel ── */}
        {activeReport ? (
          <div
            className="relative rounded-2xl overflow-hidden p-6"
            style={{
              background: "linear-gradient(160deg, rgba(124,58,237,0.07) 0%, rgba(59,130,246,0.03) 40%, rgba(10,10,14,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Top shimmer */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(59,130,246,0.3), transparent)" }} />
            {/* Subtle radial glow bg */}
            <div className="absolute top-0 left-0 w-80 h-48 opacity-[0.08] pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 0%, #7c3aed 0%, transparent 70%)" }} />

            {/* Header */}
            <div className="flex items-start justify-between mb-6 relative">
              <div className="flex-1 min-w-0 pr-6">
                <h2 className="text-base font-bold text-white mb-2 leading-snug">{activeReport.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 5px rgba(52,211,153,0.8)" }} />
                    Готов
                  </span>
                  <span className="text-[10px] text-white/30">{activeReport.pages} страниц</span>
                  <span className="text-white/15">·</span>
                  <span className="text-[10px] text-white/30">{activeReport.date}</span>
                </div>
              </div>

              {/* Score gauge */}
              <div className="flex-shrink-0 text-right">
                {(() => {
                  const color = activeReport.score >= 85 ? "#34d399" : "#f59e0b";
                  const r = 22; const circ = 2 * Math.PI * r;
                  const dash = (activeReport.score / 100) * circ;
                  return (
                    <div className="flex flex-col items-end gap-1">
                      <svg viewBox="0 0 56 56" style={{ width: 56, height: 56 }}>
                        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
                          strokeDasharray={`${dash.toFixed(1)} ${(circ - dash).toFixed(1)}`}
                          strokeDashoffset={(circ * 0.25).toFixed(1)} strokeLinecap="round"
                          style={{ filter: `drop-shadow(0 0 6px ${color}90)` }}/>
                        <text x="28" y="33" textAnchor="middle" fontSize="14" fontWeight="800" fill="white" fontFamily="monospace">{activeReport.score}</text>
                      </svg>
                      <div className="text-[9px] text-white/30">Бизнес-балл</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Summary block */}
            <div
              className="relative rounded-xl overflow-hidden p-4 mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)" }} />
              <h3 className="text-[9px] font-bold text-white/35 uppercase tracking-[0.22em] mb-3">Краткое резюме</h3>
              <p className="text-[13px] text-white/65 leading-[1.8]">{activeReport.summary}</p>
            </div>

            {/* Sections grid */}
            <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.22em] mb-3">Разделы отчёта</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {activeReport.sections.map((section) => {
                const cfg = SECTION_CFG[section] ?? { color: "#a78bfa", glow: "rgba(167,139,250,0.3)", icon: null };
                return (
                  <div
                    key={section}
                    className="relative flex items-center gap-3 p-3 rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.color}0d 0%, rgba(255,255,255,0.025) 100%)`,
                      border: `1px solid rgba(255,255,255,0.07)`,
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${cfg.color}30`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}45, transparent)` }} />
                    {/* icon container */}
                    <div
                      className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{
                        background: `${cfg.color}15`,
                        border: `1px solid ${cfg.color}25`,
                        color: cfg.color,
                        boxShadow: `0 0 0 rgba(0,0,0,0)`,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 8px ${cfg.glow}`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 rgba(0,0,0,0)"; }}
                    >
                      {cfg.icon}
                    </div>
                    <span className="text-[11.5px] text-white/55 group-hover:text-white/80 transition-colors flex-1">{section}</span>
                    <svg className="size-3 text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                );
              })}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3">
              <button
                className="flex-1 h-10 text-[13px] font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                  boxShadow: "0 8px 28px rgba(124,58,237,0.45), 0 2px 8px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 14v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V14"/><path d="M10 3v9M7 9l3 3 3-3"/>
                  </svg>
                  Скачать PDF
                </span>
              </button>
              <button
                className="h-10 px-5 text-[12px] font-medium rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
              >
                Поделиться
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl flex flex-col items-center justify-center gap-3 p-12"
            style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}
          >
            <div className="size-12 rounded-xl flex items-center justify-center" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
              <svg className="size-5 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p className="text-sm text-white/25">Выберите отчёт для просмотра</p>
          </div>
        )}
      </div>
    </div>
  );
}
