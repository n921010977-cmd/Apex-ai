"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import {
  FileText, Search, Download, Plus, CheckCircle, Loader2,
  Sparkles, Brain, TrendingUp, Shield, BarChart2, ChevronRight,
  RefreshCw, Eye, Clock, Star, Zap,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const S = {
  bg: "#05060A",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.13)",
  textPrimary: "#E5E7EB",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.3)",
  accent: "#6366f1",
  accentDark: "#4f46e5",
  violet: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  title: string;
  type: string;
  status: "COMPLETED" | "PROCESSING" | string;
  pages?: number;
  score?: number;
  time?: string;
  summary?: string;
  market?: string;
  revenue?: string;
  risk?: string;
  growth?: string;
  created_at?: string;
}

// ─── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_REPORTS: Report[] = [
  {
    id: "r1", title: "Фитнес-платформа на базе ИИ", type: "Полный анализ", status: "COMPLETED",
    pages: 24, score: 87, time: "2 часа назад",
    summary: "Высокий потенциал в быстрорастущем рынке. Финансовая модель устойчива, прогноз прибыльности — 18 месяцев. Рекомендуется ускорить GTM-стратегию.",
    market: "$4.2B", revenue: "$2.4M", risk: "Низкий", growth: "+24%",
  },
  {
    id: "r2", title: "SaaS Invoice Platform", type: "Стратегический", status: "COMPLETED",
    pages: 18, score: 91, time: "Вчера",
    summary: "Отличный product-market fit в сегменте малого бизнеса. LTV/CAC = 4.2x. Инвестировать в SEO для снижения CAC на 30%.",
    market: "$2.1B", revenue: "$1.8M", risk: "Минимальный", growth: "+18%",
  },
  {
    id: "r3", title: "Сеть ресторанов — Расширение", type: "Анализ расширения", status: "PROCESSING",
    pages: 0, score: 72, time: "В процессе",
    summary: "",
    market: "$890M", revenue: "—", risk: "Средний", growth: "+9%",
  },
  {
    id: "r4", title: "EdTech Startup — Due Diligence", type: "Инвест. анализ", status: "COMPLETED",
    pages: 31, score: 79, time: "3 дня назад",
    summary: "CAC высокий, но retention 82% компенсирует. B2B-канал перспективен. Score снижен из-за регуляторных рисков в России.",
    market: "$6.5B", revenue: "$3.1M", risk: "Средний", growth: "+31%",
  },
];

const TYPES = ["Все", "Полный анализ", "Стратегический", "Инвест. анализ", "Анализ расширения"];

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(to: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / 1200, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return val;
}

// ─── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const col = score >= 85 ? S.success : score >= 70 ? S.accent : S.warning;
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={inView ? { strokeDasharray: `${(score/100)*circ} ${circ}` } : {}}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={col} fontSize={13} fontWeight="800" style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px`, fontVariantNumeric: "tabular-nums" }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Report → printable HTML ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildReportHtml(r: Report & { report_sections?: any[] }, autoPrint = false): string {
  const esc = (s: string) => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const scoreColor = (r.score ?? 0) >= 85 ? "#10b981" : (r.score ?? 0) >= 70 ? "#6366f1" : "#f59e0b";

  const metrics = [
    ["TAM", r.market], ["Revenue", r.revenue], ["Рост", r.growth], ["Риск", r.risk], ["Страниц", r.pages ? `${r.pages} стр.` : null],
  ].filter(([, v]) => v) as [string, string][];

  const sections = Array.isArray(r.report_sections)
    ? r.report_sections.map(s => `<section class="sec"><h2>${esc(s.title ?? "")}</h2><div class="body">${esc(s.content?.markdown ?? s.content ?? "")}</div></section>`).join("")
    : "";

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(r.title)} — Apex AI</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#05060A;color:#E5E7EB;padding:56px 48px;line-height:1.65;max-width:900px;margin:0 auto}
  .eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.35)}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:28px}
  h1{font-size:26px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:8px 0 6px;max-width:560px}
  .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .chip{font-size:11px;padding:3px 10px;border-radius:6px;background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.25);font-weight:600}
  .chip.ok{background:rgba(16,185,129,.12);color:#34d399;border-color:rgba(16,185,129,.25)}
  .score{text-align:center;flex-shrink:0}
  .score .n{font-size:44px;font-weight:800;color:${scoreColor};font-variant-numeric:tabular-nums;line-height:1}
  .score .l{font-size:10px;color:rgba(255,255,255,.35);margin-top:2px}
  .summary{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:14px;padding:20px 22px;margin-bottom:28px;font-size:14px;color:rgba(255,255,255,.72)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:32px}
  .cell{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 16px}
  .cell .k{font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.08em}
  .cell .v{font-size:18px;font-weight:800;color:#fff;margin-top:4px;font-variant-numeric:tabular-nums}
  .sec{margin-bottom:26px;page-break-inside:avoid}
  .sec h2{font-size:15px;font-weight:700;color:#818cf8;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(129,140,248,.18)}
  .sec .body{font-size:13px;color:rgba(255,255,255,.62);white-space:pre-wrap}
  .foot{margin-top:44px;border-top:1px solid rgba(255,255,255,.08);padding-top:16px;font-size:11px;color:rgba(255,255,255,.28);display:flex;justify-content:space-between}
  @media print{body{background:#fff;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,.cell .v{color:#111}.sec .body{color:#333}}
</style></head>
<body>
  <div class="head">
    <div>
      <div class="eyebrow">Apex AI · Бизнес-отчёт</div>
      <h1>${esc(r.title)}</h1>
      <div class="chips">
        <span class="chip">${esc(r.type)}</span>
        ${r.status === "COMPLETED" ? '<span class="chip ok">✓ Готов</span>' : '<span class="chip">В процессе</span>'}
        ${r.time ? `<span class="chip" style="background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);border-color:rgba(255,255,255,.1)">${esc(r.time)}</span>` : ""}
      </div>
    </div>
    ${r.score ? `<div class="score"><div class="n">${r.score}</div><div class="l">Бизнес-балл</div></div>` : ""}
  </div>
  ${r.summary ? `<div class="summary">${esc(r.summary)}</div>` : ""}
  ${metrics.length ? `<div class="grid">${metrics.map(([k, v]) => `<div class="cell"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div>` : ""}
  ${sections}
  <div class="foot"><span>Apex AI · Автоматически сгенерировано</span><span>${new Date().toLocaleDateString("ru")}</span></div>
  ${autoPrint ? "<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>" : ""}
</body></html>`;
}

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Enrich a real (DB-backed) report with its sections before rendering
async function loadFull(report: Report): Promise<Report> {
  if (!isUuid(report.id)) return report;
  try {
    const res = await fetch(`/api/reports/${report.id}`);
    const j = await res.json();
    if (j.success && j.data) return { ...report, ...j.data };
  } catch { /* fall back to summary data */ }
  return report;
}

async function openReportView(report: Report) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write("<!DOCTYPE html><title>Загрузка…</title><body style='background:#05060A'></body>");
  const full = await loadFull(report);
  w.document.open();
  w.document.write(buildReportHtml(full));
  w.document.close();
  return true;
}

async function downloadReportPdf(report: Report) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write("<!DOCTYPE html><title>Подготовка PDF…</title><body style='background:#05060A'></body>");
  const full = await loadFull(report);
  w.document.open();
  w.document.write(buildReportHtml(full, true));
  w.document.close();
  return true;
}

// ─── Report card ───────────────────────────────────────────────────────────────
function ReportCard({ report, index, onSelect, selected, onView, onPdf }: { report: Report; index: number; onSelect: () => void; selected: boolean; onView: (r: Report) => void; onPdf: (r: Report) => void }) {
  const isCompleted = report.status === "COMPLETED";
  const score = report.score ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={onSelect}
      style={{ background: S.surface, border: `1px solid ${selected ? S.accent : S.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "border-color 0.2s", boxShadow: S.card }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(99,102,241,0.1)", color: S.accent, border: `1px solid ${S.accent}22`, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{report.type}</span>
            {isCompleted ? (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: S.success, border: `1px solid ${S.success}22`, fontWeight: 700 }}>✓ Готов</span>
            ) : (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: S.warning, border: `1px solid ${S.warning}22`, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />В процессе
              </span>
            )}
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, color: S.textPrimary, margin: 0, marginBottom: 6, textWrap: "balance" } as React.CSSProperties}>{report.title}</h3>

          {report.summary && (
            <p style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.6, margin: 0, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{report.summary}</p>
          )}

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {report.market && (
              <div style={{ display: "flex", align: "center", gap: 4 } as React.CSSProperties}>
                <span style={{ fontSize: 11, color: S.textMuted }}>TAM:</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: S.textPrimary }}>{report.market}</span>
              </div>
            )}
            {report.growth && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={10} color={S.success} />
                <span style={{ fontSize: 11, fontWeight: 700, color: S.success }}>{report.growth}</span>
              </div>
            )}
            {report.pages ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FileText size={10} color={S.textMuted} />
                <span style={{ fontSize: 11, color: S.textMuted }}>{report.pages} стр.</span>
              </div>
            ) : null}
            {report.time && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} color={S.textMuted} />
                <span style={{ fontSize: 11, color: S.textMuted }}>{report.time}</span>
              </div>
            )}
          </div>
        </div>

        {isCompleted && score > 0 && <ScoreRing score={score} />}
      </div>

      {/* Action row */}
      {isCompleted && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${S.border}`, paddingTop: 14 }}>
          <button onClick={e => { e.stopPropagation(); onView(report); }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", borderRadius: 10, background: "transparent", border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 12, cursor: "pointer" }}
          >
            <Eye size={12} />Просмотр
          </button>
          <button onClick={e => { e.stopPropagation(); onPdf(report); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <Download size={12} />PDF
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Animated KPI ──────────────────────────────────────────────────────────────
function AnimatedKPI({ value, label, color, suffix = "" }: { value: number; label: string; color: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, inView);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{count}{suffix}</span>
      <span style={{ fontSize: 12, color: S.textSecondary }}>{label}</span>
    </div>
  );
}

// ─── Fade-up ───────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Все");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleView = useCallback(async (r: Report) => {
    if (r.status !== "COMPLETED") { toast("Отчёт ещё генерируется", "info"); return; }
    const ok = await openReportView(r);
    if (!ok) toast("Разрешите всплывающие окна для просмотра", "error");
  }, [toast]);

  const handlePdf = useCallback(async (r: Report) => {
    if (r.status !== "COMPLETED") { toast("Отчёт ещё генерируется", "info"); return; }
    toast("Готовим PDF — откроется окно печати", "info");
    const ok = await downloadReportPdf(r);
    if (!ok) toast("Разрешите всплывающие окна для экспорта", "error");
  }, [toast]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const j = await res.json();
      const apiReports = (j.success && j.data?.length > 0) ? j.data : [];
      setReports([...apiReports, ...DEMO_REPORTS]);
    } catch {
      setReports(DEMO_REPORTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "Все" || r.type === filterType;
    return matchSearch && matchType;
  });

  const completed = reports.filter(r => r.status === "COMPLETED").length;
  const avgScore = reports.filter(r => r.score).length
    ? Math.round(reports.filter(r => r.score).reduce((s, r) => s + (r.score ?? 0), 0) / reports.filter(r => r.score).length)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.textPrimary, fontFamily: "system-ui,-apple-system,sans-serif", padding: "0 0 80px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rp-kpi { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .rp-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        .rp-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        .rp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045); }
        @media (max-width: 960px) { .rp-layout { grid-template-columns: 1fr; } .rp-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .rp-kpi { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      {/* Header */}
      <motion.div {...fadeUp(0)} style={{ padding: "40px 40px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: `1px solid ${S.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} color={S.accent} />
              </div>
              <span style={{ fontSize: 11, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.14em" }}>Research Hub</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Отчёты</h1>
            <p style={{ fontSize: 14, color: S.textSecondary, marginTop: 6 }}>AI-анализ бизнес-идей, рынков и стратегий</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={fetchReports}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 13, cursor: "pointer" }}
            >
              <RefreshCw size={14} />
            </motion.button>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <Plus size={14} />
              Новый анализ
            </motion.button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="rp-kpi" style={{ marginBottom: 28 }}>
          {[
            { value: reports.length, label: "Всего отчётов", color: S.textPrimary, suffix: "" },
            { value: completed, label: "Завершено", color: S.success, suffix: "" },
            { value: avgScore, label: "Средний Score", color: S.accent, suffix: "" },
            { value: 20, label: "AI-агентов", color: S.violet, suffix: "×" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} {...fadeUp(0.1 + i * 0.07)} className="rp-card">
              <AnimatedKPI {...kpi} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div style={{ padding: "0 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="rp-layout">
          {/* Reports list */}
          <div>
            {/* Filters */}
            <motion.div {...fadeUp(0.2)} style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <Search size={14} color={S.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск отчётов..."
                  style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`, color: S.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              {/* Type filter */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {TYPES.slice(0, 4).map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${filterType === t ? S.accent : S.border}`, background: filterType === t ? `${S.accent}1a` : "transparent", color: filterType === t ? S.accent : S.textMuted, fontSize: 11, cursor: "pointer", fontWeight: filterType === t ? 700 : 400, transition: "all 0.15s" }}
                  >{t}</button>
                ))}
              </div>
            </motion.div>

            {/* Grid */}
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <Loader2 size={28} color={S.accent} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : (
              <div className="rp-grid">
                {filtered.map((r, i) => (
                  <ReportCard key={r.id} report={r} index={i} onSelect={() => setSelectedId(selectedId === r.id ? null : r.id)} selected={selectedId === r.id} onView={handleView} onPdf={handlePdf} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Selected detail or placeholder */}
            <AnimatePresence mode="wait">
              {selectedId ? (() => {
                const r = reports.find(x => x.id === selectedId);
                if (!r) return null;
                return (
                  <motion.div key={selectedId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }} className="rp-card"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Детали</span>
                      {r.score && <ScoreRing score={r.score} size={48} />}
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: S.textPrimary, margin: "0 0 8px" }}>{r.title}</h4>
                    {r.summary && <p style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.7, margin: "0 0 16px" }}>{r.summary}</p>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        ["TAM", r.market], ["Revenue", r.revenue], ["Рост", r.growth], ["Риск", r.risk], ["Страниц", r.pages ? `${r.pages} стр.` : "—"],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: S.surface, border: `1px solid ${S.border}` }}>
                          <span style={{ fontSize: 12, color: S.textMuted }}>{k}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: S.textPrimary }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <button onClick={() => handleView(r)}
                        style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Eye size={13} />Просмотр
                      </button>
                      <button onClick={() => handlePdf(r)}
                        style={{ flex: 1, padding: "10px", borderRadius: 10, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Download size={13} />PDF
                      </button>
                    </div>
                  </motion.div>
                );
              })() : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rp-card"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 180, gap: 12 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.08)", border: `1px solid ${S.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Eye size={20} color={S.accent} />
                  </div>
                  <span style={{ fontSize: 13, color: S.textMuted }}>Выберите отчёт для просмотра деталей</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI capabilities card */}
            <motion.div {...fadeUp(0.35)} className="rp-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Brain size={14} color={S.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>20 AI Агентов</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: BarChart2, label: "Финансовый моделинг" },
                  { icon: Shield,    label: "Risk Assessment" },
                  { icon: TrendingUp,label: "Market Intelligence" },
                  { icon: Zap,       label: "Competitive Analysis" },
                  { icon: Star,      label: "Opportunity Scoring" },
                  { icon: Sparkles,  label: "Strategic Recommendations" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.label}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: S.surface, border: `1px solid ${S.border}` }}
                    >
                      <Icon size={13} color={S.accent} />
                      <span style={{ fontSize: 12, color: S.textSecondary }}>{item.label}</span>
                      <CheckCircle size={11} color={S.success} style={{ marginLeft: "auto" }} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick stats */}
            <motion.div {...fadeUp(0.42)} className="rp-card">
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 14 }}>Производительность</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Время анализа", value: "< 30 мин" },
                  { label: "Источников на отчёт", value: "200+" },
                  { label: "Точность прогнозов", value: "89%" },
                  { label: "Avg Score портфеля", value: `${avgScore}/100` },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: S.surface, border: `1px solid ${S.border}` }}>
                    <span style={{ fontSize: 12, color: S.textMuted }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.textPrimary }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
