"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, DollarSign, Search, Target, Settings, AlertTriangle,
  Clock, ChevronRight, Download, Share2, Plus, CheckCircle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = "COMPLETED" | "PROCESSING" | "PENDING" | "FAILED";

interface ReportSection {
  id: string;
  type: string;
  title: string;
  color: string;
  glow: string;
  icon: React.ReactNode;
}

interface MockReport {
  id: string;
  title: string;
  type: string;
  status: ReportStatus;
  pages: number;
  score: number;
  time: string;
  summary: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const REPORTS: MockReport[] = [
  {
    id: "r1",
    title: "Фитнес-платформа на базе ИИ — Полный отчёт",
    type: "Полный анализ",
    status: "COMPLETED",
    pages: 24,
    score: 87,
    time: "2 часа назад",
    summary:
      "Проект демонстрирует высокий потенциал в быстрорастущем рынке. Финансовая модель устойчива с прогнозом выхода на прибыль через 18 месяцев. Рекомендуется ускорить выход на рынок для захвата первичной доли.",
  },
  {
    id: "r2",
    title: "SaaS Invoice Platform — Стратегический отчёт",
    type: "Стратегический",
    status: "COMPLETED",
    pages: 18,
    score: 91,
    time: "Вчера",
    summary:
      "Продукт демонстрирует отличный product-market fit в сегменте малого бизнеса. Unit-экономика сильная: LTV/CAC = 4.2x. Рекомендуется инвестировать в SEO-канал для снижения CAC на 30%.",
  },
  {
    id: "r3",
    title: "Сеть ресторанов — Анализ расширения",
    type: "В работе",
    status: "PROCESSING",
    pages: 0,
    score: 72,
    time: "В процессе",
    summary: "",
  },
];

const SECTIONS: ReportSection[] = [
  { id: "summary",   type: "SUMMARY",    title: "Резюме",            color: "#a78bfa", glow: "rgba(167,139,250,0.35)", icon: <FileText      size={15} /> },
  { id: "finance",   type: "FINANCE",    title: "Финансовая модель", color: "#34d399", glow: "rgba(52,211,153,0.35)",  icon: <DollarSign    size={15} /> },
  { id: "market",    type: "MARKET",     title: "Анализ рынка",      color: "#22d3ee", glow: "rgba(34,211,238,0.35)",  icon: <Search        size={15} /> },
  { id: "marketing", type: "MARKETING",  title: "Маркетинг",         color: "#f472b6", glow: "rgba(244,114,182,0.35)", icon: <Target        size={15} /> },
  { id: "ops",       type: "OPERATIONS", title: "Операции",          color: "#fbbf24", glow: "rgba(251,191,36,0.35)",  icon: <Settings      size={15} /> },
  { id: "risks",     type: "RISKS",      title: "Риски",             color: "#f87171", glow: "rgba(248,113,113,0.35)", icon: <AlertTriangle size={15} /> },
  { id: "roadmap",   type: "ROADMAP",    title: "Дорожная карта",    color: "#60a5fa", glow: "rgba(96,165,250,0.35)",  icon: <Clock         size={15} /> },
];

// ─── Circular score gauge ──────────────────────────────────────────────────────

function ScoreGauge({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? "#34d399" : score >= 70 ? "#f59e0b" : "#f87171";
  const cx = size / 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="flex-shrink-0">
      <defs>
        <filter id="sg-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        filter="url(#sg-glow)"
      />
      <text x={cx} y={cx + 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="white" fontFamily="monospace">{score}</text>
      <text x={cx} y={cx + 17} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.35)" fontFamily="system-ui" letterSpacing="1">Бизнес-балл</text>
    </svg>
  );
}

// ─── Generating loader (skeleton) ─────────────────────────────────────────────

function GeneratingLoader() {
  const steps = [
    { label: "Финансовый агент",    color: "#34d399", done: true  },
    { label: "Маркетинговый агент", color: "#22d3ee", done: true  },
    { label: "Операционный агент",  color: "#fbbf24", done: false },
    { label: "Агент рисков",        color: "#f87171", done: false },
    { label: "Оркестратор",         color: "#a78bfa", done: false },
  ];
  const activeIdx = steps.findIndex(s => !s.done);

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] gap-7 py-6">
      {/* Spinner rings */}
      <div className="relative size-20">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
        <div
          className="absolute inset-1 rounded-full border-2 border-violet-400/30 animate-spin"
          style={{ animationDuration: "2s", borderTopColor: "#7c3aed" }}
        />
        <div
          className="absolute inset-3 rounded-full border-2 border-violet-300/20 animate-spin"
          style={{ animationDuration: "3s", animationDirection: "reverse", borderTopColor: "#a78bfa" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={18} className="text-violet-400 animate-spin" />
        </div>
      </div>

      <div className="text-center">
        <div className="text-base font-semibold text-white mb-1">Генерация отчёта</div>
        <div className="text-xs text-white/35">AI-агенты анализируют ваш проект</div>
      </div>

      {/* Agent progress bars */}
      <div className="w-full max-w-xs space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="size-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: s.done ? `${s.color}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${s.done ? `${s.color}40` : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {s.done
                ? <CheckCircle size={10} style={{ color: s.color }} />
                : i === activeIdx
                  ? <Loader2 size={9} className="animate-spin text-white/40" />
                  : null}
            </div>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: s.done ? "100%" : i === activeIdx ? "45%" : "0%",
                  background: s.done ? s.color : `${s.color}55`,
                  boxShadow: s.done ? `0 0 6px ${s.color}80` : "none",
                }}
              />
            </div>
            <span className="text-[10px] text-white/30 w-28 text-right truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Skeleton text lines */}
      <div className="w-full space-y-2">
        {[82, 58, 72, 44].map((w, i) => (
          <div key={i} className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full animate-pulse"
              style={{ width: `${w}%`, background: "rgba(124,58,237,0.2)", animationDelay: `${i * 220}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Report card (left list) ──────────────────────────────────────────────────

function ReportCard({ report, active, onClick }: { report: MockReport; active: boolean; onClick: () => void }) {
  const isProcessing = report.status === "PROCESSING";
  const statusColor  = report.status === "COMPLETED" ? "#34d399" : isProcessing ? "#f59e0b" : "#f87171";
  const statusLabel  = report.status === "COMPLETED" ? "Готов"   : isProcessing ? "В работе" : "Ошибка";

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left rounded-2xl p-4 transition-all duration-200 group hover:scale-[1.01] overflow-hidden"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(124,58,237,0.13) 0%, rgba(10,10,14,0.9) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,10,14,0.7) 100%)",
        border: active ? "1px solid rgba(124,58,237,0.32)" : "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        boxShadow: active
          ? "inset 0 1px 0 rgba(124,58,237,0.18), 0 8px 24px rgba(0,0,0,0.3)"
          : "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {/* shimmer top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${active ? "rgba(124,58,237,0.55)" : "rgba(255,255,255,0.08)"}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-2 gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }}
          />
          {statusLabel}
        </span>
        <span className="text-[9px] text-white/25 flex-shrink-0">{report.time}</span>
      </div>

      <div className="text-[12.5px] font-semibold text-white/85 leading-snug mb-2 group-hover:text-white transition-colors">
        {report.title}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-white/30 flex-wrap">
        <span>{report.type}</span>
        {report.pages > 0 && (
          <><span className="text-white/15">•</span><span>{report.pages} стр.</span></>
        )}
        {report.score > 0 && (
          <>
            <span className="text-white/15">•</span>
            <span className="font-semibold" style={{ color: report.score >= 85 ? "#34d399" : "#f59e0b" }}>
              {report.score}/100
            </span>
          </>
        )}
        {isProcessing && (
          <span className="flex items-center gap-1 text-amber-400/60">
            <Loader2 size={8} className="animate-spin" />
            Генерация…
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Section tile ──────────────────────────────────────────────────────────────

function SectionTile({ section }: { section: ReportSection }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-left overflow-hidden transition-all duration-200 group"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${section.color}14 0%, rgba(10,10,14,0.85) 100%)`
          : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,10,14,0.7) 100%)",
        border: hovered ? `1px solid ${section.color}35` : "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        boxShadow: hovered
          ? `0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 ${section.color}18`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {hovered && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${section.color}55, transparent)` }}
        />
      )}

      <div
        className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          background: hovered ? `${section.color}22` : `${section.color}10`,
          border: `1px solid ${section.color}${hovered ? "38" : "20"}`,
          color: section.color,
          boxShadow: hovered ? `0 0 12px ${section.glow}` : "none",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        {section.icon}
      </div>

      <span className="flex-1 text-[12.5px] font-medium text-white/65 group-hover:text-white transition-colors">
        {section.title}
      </span>

      <ChevronRight
        size={13}
        className="text-white/20 transition-all duration-200 group-hover:text-white/50 group-hover:translate-x-0.5"
      />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<MockReport>(REPORTS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isProcessing = activeReport.status === "PROCESSING";
  const used = 1; const total = 3;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">Отчёты</h1>
          <p className="text-sm text-white/35">Аналитические отчёты по вашим проектам</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-white/30">
            Использовано: <span className="text-white/55 font-medium">{used} из {total}</span>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              boxShadow: "0 6px 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <Plus size={14} />
            Создать отчёт
          </button>
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">

        {/* ── Left: report list ── */}
        <div className="space-y-2.5">
          {REPORTS.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              active={activeReport.id === r.id}
              onClick={() => setActiveReport(r)}
            />
          ))}

          {/* Limit block */}
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(10,10,14,0.6) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="text-[11px] text-white/30 mb-2">
              Осталось <span className="text-white/55 font-semibold">{total - used} отчёта</span> в месяц
            </div>
            <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden mb-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(used / total) * 100}%`,
                  background: "linear-gradient(90deg, #7c3aed, #6366f1)",
                  boxShadow: "0 0 8px rgba(124,58,237,0.5)",
                }}
              />
            </div>
            <Link
              href="/dashboard/settings"
              className="text-[11px] text-violet-400/70 hover:text-violet-300 transition-colors"
            >
              Апгрейд для безлимита →
            </Link>
          </div>
        </div>

        {/* ── Right: detail panel ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(10,10,14,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* shimmer top */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(59,130,246,0.35), transparent)" }}
          />
          {/* radial bg glow */}
          <div
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 40% 0%, rgba(124,58,237,0.07) 0%, transparent 70%)" }}
          />

          <div className="relative p-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white leading-snug mb-3">{activeReport.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* status badge */}
                  <span
                    className="inline-flex items-center gap-1.5 text-[9px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: isProcessing ? "rgba(245,158,11,0.12)" : "rgba(52,211,153,0.12)",
                      color: isProcessing ? "#f59e0b" : "#34d399",
                      border: `1px solid ${isProcessing ? "rgba(245,158,11,0.3)" : "rgba(52,211,153,0.3)"}`,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full animate-pulse"
                      style={{ background: isProcessing ? "#f59e0b" : "#34d399" }}
                    />
                    {isProcessing ? "В работе" : "Готов"}
                  </span>

                  {activeReport.pages > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-white/30 px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
                      <FileText size={9} />
                      {activeReport.pages} страниц
                    </span>
                  )}
                  {!isProcessing && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-white/30 px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
                      <Clock size={9} />
                      {activeReport.time}
                    </span>
                  )}
                </div>
              </div>

              {!isProcessing && activeReport.score > 0 && (
                <ScoreGauge score={activeReport.score} size={72} />
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05] mb-5" />

            {/* ── Processing state ── */}
            {isProcessing ? (
              <GeneratingLoader />
            ) : (
              <>
                {/* Summary */}
                <div className="mb-5">
                  <div className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-2.5">
                    Краткое резюме
                  </div>
                  <div
                    className="relative rounded-xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-px rounded-t-xl"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.3),transparent)" }}
                    />
                    <p className="text-[13px] text-white/60 leading-[1.75]">{activeReport.summary}</p>
                  </div>
                </div>

                {/* Section grid */}
                <div className="mb-5">
                  <div className="text-[9px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-2.5">
                    Разделы отчёта
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SECTIONS.map((s) => (
                      <SectionTile key={s.id} section={s} />
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2.5">
                  <button
                    className="flex-1 h-11 flex items-center justify-center gap-2 text-[13px] font-semibold text-white rounded-xl transition-all duration-200 hover:scale-[1.02] hover:brightness-110 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                      boxShadow: "0 8px 28px rgba(124,58,237,0.45), 0 2px 8px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-px"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)" }}
                    />
                    <Download size={15} />
                    Скачать PDF
                  </button>

                  <button
                    className="h-11 px-5 flex items-center gap-2 text-[13px] font-medium text-white/55 rounded-xl transition-all duration-200 hover:text-white hover:border-white/15"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <Share2 size={14} />
                    Поделиться
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
