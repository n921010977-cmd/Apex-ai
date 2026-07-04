"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, DollarSign, Search, Target, Settings, AlertTriangle,
  Clock, Download, Share2, Plus, CheckCircle, Loader2, Sparkles,
  Brain, TrendingUp, Shield, BarChart2, Zap, ChevronRight,
  ArrowUpRight, Eye, RefreshCw, Star, Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = "COMPLETED" | "PROCESSING";

interface MockReport {
  id: string;
  title: string;
  type: string;
  status: ReportStatus;
  pages: number;
  score: number;
  time: string;
  summary: string;
  market: string;
  revenue: string;
  risk: string;
  agents: number;
  growth: string;
  color: string;
  rgb: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const REPORTS: MockReport[] = [
  {
    id: "r1",
    title: "Фитнес-платформа на базе ИИ",
    type: "Полный анализ",
    status: "COMPLETED",
    pages: 24,
    score: 87,
    time: "2 часа назад",
    summary: "Проект демонстрирует высокий потенциал в быстрорастущем рынке. Финансовая модель устойчива с прогнозом выхода на прибыль через 18 месяцев. Рекомендуется ускорить выход на рынок для захвата первичной доли.",
    market: "$4.2B",
    revenue: "$2.4M",
    risk: "Низкий",
    agents: 20,
    growth: "+24%",
    color: "#7A5CFF",
    rgb: "122,92,255",
  },
  {
    id: "r2",
    title: "SaaS Invoice Platform",
    type: "Стратегический",
    status: "COMPLETED",
    pages: 18,
    score: 91,
    time: "Вчера",
    summary: "Продукт демонстрирует отличный product-market fit в сегменте малого бизнеса. Unit-экономика сильная: LTV/CAC = 4.2x. Рекомендуется инвестировать в SEO-канал для снижения CAC на 30%.",
    market: "$2.1B",
    revenue: "$1.8M",
    risk: "Минимальный",
    agents: 20,
    growth: "+18%",
    color: "#10b981",
    rgb: "16,185,129",
  },
  {
    id: "r3",
    title: "Сеть ресторанов — Расширение",
    type: "Анализ расширения",
    status: "PROCESSING",
    pages: 0,
    score: 72,
    time: "В процессе",
    summary: "",
    market: "$890M",
    revenue: "Считается…",
    risk: "Средний",
    agents: 20,
    growth: "+9%",
    color: "#f59e0b",
    rgb: "245,158,11",
  },
];

// 7 sections for completed reports
const SECTIONS = [
  { id: "summary",   title: "Резюме CEO",         color: "#a78bfa", rgb: "167,139,250", icon: Brain,         size: "full",  desc: "Стратегическое видение и ключевые выводы" },
  { id: "finance",   title: "Финансовая модель",   color: "#34d399", rgb: "52,211,153",  icon: DollarSign,    size: "half",  desc: "P&L, Cash Flow, Unit Economics" },
  { id: "market",    title: "Анализ рынка",         color: "#38bdf8", rgb: "56,189,248",  icon: Globe,         size: "half",  desc: "TAM, SAM, SOM, конкуренты" },
  { id: "marketing", title: "Маркетинг & Рост",     color: "#f472b6", rgb: "244,114,182", icon: TrendingUp,    size: "third", desc: "GTM, каналы, CAC/LTV" },
  { id: "ops",       title: "Операции",             color: "#fbbf24", rgb: "251,191,36",  icon: Settings,      size: "third", desc: "Процессы, команда, KPI" },
  { id: "risks",     title: "Риски",                color: "#f87171", rgb: "248,113,113", icon: Shield,        size: "third", desc: "Матрица рисков, митигация" },
  { id: "roadmap",   title: "Дорожная карта",       color: "#60a5fa", rgb: "96,165,250",  icon: Clock,         size: "full",  desc: "Milestones, Q1–Q4 план действий" },
];

// ─── Report body builder (for exports) ─────────────────────────────────────────

function buildSectionBodies(report: MockReport): { title: string; body: string }[] {
  const s = report.score;
  return [
    { title: "Резюме CEO", body: report.summary || "Стратегический анализ проекта по методологии Executive Board. Проект оценён 20 AI-агентами по ключевым направлениям бизнеса." },
    { title: "Финансовая модель", body: `Прогноз выручки: ${report.revenue}. Годовой рост: ${report.growth}. Unit-экономика устойчива, модель предполагает выход на операционную прибыль в горизонте 12–18 месяцев. Рекомендуется контроль burn rate и оптимизация CAC.` },
    { title: "Анализ рынка", body: `Объём целевого рынка (SAM): ${report.market}. Динамика рынка положительная (${report.growth} в год). Конкурентная среда умеренная, присутствует окно возможностей для быстрого захвата доли.` },
    { title: "Маркетинг и рост", body: `Основные каналы привлечения: органический SEO, реферальная программа, контент-маркетинг. Приоритет — снижение стоимости привлечения клиента и рост виральности продукта.` },
    { title: "Операции", body: `Операционная модель требует стандартизации процессов и автоматизации рутинных задач. Ключевые KPI отслеживаются еженедельно. Команда масштабируется под целевую нагрузку.` },
    { title: "Риски", body: `Общий уровень риска: ${report.risk}. Основные категории: рыночные, финансовые, операционные и технологические риски. Для каждой предусмотрены меры митигации и резервный фонд.` },
    { title: "Дорожная карта", body: `Q1 — запуск MVP и первые клиенты. Q2 — product-market fit и оптимизация воронки. Q3 — масштабирование каналов роста. Q4 — привлечение раунда и выход на новые сегменты.` },
  ];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(title: string) {
  return title.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "report";
}

// Word export (.doc) — Word opens HTML-based .doc natively
function downloadWord(report: MockReport) {
  const sections = buildSectionBodies(report);
  const rows = sections.map(s => `
    <h2 style="color:#4f46e5;font-size:16pt;margin:18pt 0 6pt;">${s.title}</h2>
    <p style="font-size:11pt;line-height:1.6;color:#222;">${s.body}</p>`).join("");
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${report.title}</title></head>
  <body style="font-family:Calibri,Arial,sans-serif;padding:24pt;">
    <div style="border-bottom:3px solid #7c3aed;padding-bottom:10pt;margin-bottom:16pt;">
      <div style="font-size:9pt;letter-spacing:2pt;color:#7c3aed;text-transform:uppercase;">Apex AI · Executive Board</div>
      <h1 style="font-size:24pt;margin:6pt 0;color:#111;">${report.title}</h1>
      <div style="font-size:10pt;color:#666;">${report.type} · Оценка ${report.score}/100 · ${report.time}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16pt;font-size:11pt;">
      <tr>
        <td style="padding:8pt;background:#f3f0ff;border:1px solid #ddd;"><b>Рынок (SAM)</b><br>${report.market}</td>
        <td style="padding:8pt;background:#f0fff5;border:1px solid #ddd;"><b>Прогноз выручки</b><br>${report.revenue}</td>
        <td style="padding:8pt;background:#fff8f0;border:1px solid #ddd;"><b>Рост</b><br>${report.growth}</td>
        <td style="padding:8pt;background:#fff0f3;border:1px solid #ddd;"><b>Риск</b><br>${report.risk}</td>
      </tr>
    </table>
    ${rows}
    <p style="margin-top:24pt;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:8pt;">Сформировано Apex AI · 20 AI-агентов · ${new Date().toLocaleDateString("ru-RU")}</p>
  </body></html>`;
  triggerDownload(new Blob(["﻿" + html], { type: "application/msword" }), `${safeName(report.title)}.doc`);
}

// Excel export (.xls) — Excel opens HTML-table-based .xls natively
function downloadExcel(report: MockReport) {
  const sections = buildSectionBodies(report);
  const metricRows = [
    ["Название", report.title],
    ["Тип отчёта", report.type],
    ["Оценка", `${report.score}/100`],
    ["Рынок (SAM)", report.market],
    ["Прогноз выручки", report.revenue],
    ["Годовой рост", report.growth],
    ["Уровень риска", report.risk],
    ["AI-агентов", String(report.agents)],
    ["Страниц", String(report.pages)],
    ["Дата", new Date().toLocaleDateString("ru-RU")],
  ].map(([k, v]) => `<tr><td style="font-weight:bold;background:#f3f0ff;">${k}</td><td>${v}</td></tr>`).join("");
  const sectionRows = sections.map(s => `<tr><td style="font-weight:bold;vertical-align:top;background:#eef;">${s.title}</td><td>${s.body}</td></tr>`).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>
    <table border="1" style="border-collapse:collapse;font-family:Calibri,Arial;font-size:11pt;">
      <tr><td colspan="2" style="font-size:16pt;font-weight:bold;background:#7c3aed;color:#fff;">Apex AI — ${report.title}</td></tr>
      ${metricRows}
      <tr><td colspan="2" style="height:8pt;"></td></tr>
      <tr><td colspan="2" style="font-size:13pt;font-weight:bold;background:#4f46e5;color:#fff;">Разделы отчёта</td></tr>
      ${sectionRows}
    </table></body></html>`;
  triggerDownload(new Blob(["﻿" + html], { type: "application/vnd.ms-excel" }), `${safeName(report.title)}.xls`);
}

// PDF export — open a print-ready window; user saves as PDF
function downloadPDF(report: MockReport) {
  const sections = buildSectionBodies(report);
  const rows = sections.map(s => `
    <section><h2>${s.title}</h2><p>${s.body}</p></section>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title>
    <style>
      *{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1a1a1a;padding:40px;max-width:760px;margin:0 auto;}
      .eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7c3aed;font-weight:700;}
      h1{font-size:30px;margin:8px 0 4px;} .meta{color:#777;font-size:13px;margin-bottom:24px;}
      .kpis{display:flex;gap:10px;margin:20px 0;} .kpi{flex:1;padding:12px;border-radius:10px;background:#f5f3ff;border:1px solid #e5e0ff;}
      .kpi b{display:block;font-size:16px;color:#4f46e5;} .kpi span{font-size:11px;color:#888;}
      h2{font-size:17px;color:#4f46e5;margin:22px 0 6px;border-left:4px solid #7c3aed;padding-left:10px;}
      p{line-height:1.7;font-size:13px;color:#333;} footer{margin-top:32px;border-top:1px solid #eee;padding-top:10px;color:#aaa;font-size:11px;}
      @media print{body{padding:0;}}
    </style></head><body>
    <div class="eyebrow">Apex AI · Executive Board</div>
    <h1>${report.title}</h1>
    <div class="meta">${report.type} · Оценка ${report.score}/100 · ${report.time}</div>
    <div class="kpis">
      <div class="kpi"><b>${report.market}</b><span>Рынок (SAM)</span></div>
      <div class="kpi"><b>${report.revenue}</b><span>Прогноз</span></div>
      <div class="kpi"><b>${report.growth}</b><span>Рост</span></div>
      <div class="kpi"><b>${report.risk}</b><span>Риск</span></div>
    </div>
    ${rows}
    <footer>Сформировано Apex AI · 20 AI-агентов · ${new Date().toLocaleDateString("ru-RU")}</footer>
    <script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
    </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

// ─── Animated number (count-up) ─────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1100, className, style }: { value: number; duration?: number; className?: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className} style={style}>{display}</span>;
}

// ─── Animated meter bar ─────────────────────────────────────────────────────────

function MeterBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), delay + 120); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}><AnimatedNumber value={value} />%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 10px ${color}55`, transition: `width 1.3s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms` }} />
      </div>
    </div>
  );
}

// ─── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 64, animate = false }: { score: number; color: string; size?: number; animate?: boolean }) {
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const [shown, setShown] = useState(animate ? 0 : score);
  useEffect(() => {
    if (!animate) { setShown(score); return; }
    setShown(0);
    const t = setTimeout(() => setShown(score), 120);
    return () => clearTimeout(t);
  }, [score, animate]);
  const dash = (shown / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color}90)`, transition: animate ? "stroke-dasharray 1.3s cubic-bezier(0.34,1.1,0.64,1)" : "none" }}
      />
    </svg>
  );
}

// ─── Generating Loader ─────────────────────────────────────────────────────────

function GeneratingLoader({ color }: { color: string }) {
  const steps = [
    { label: "Финансовый агент",     done: true  },
    { label: "Маркетинговый агент",  done: true  },
    { label: "Операционный агент",   done: false },
    { label: "Агент рисков",         done: false },
    { label: "Оркестратор CEO",      done: false },
  ];
  const activeIdx = steps.findIndex(s => !s.done);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      <div className="relative" style={{ width: 72, height: 72 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${color}20`, animation: "rp-ping 1.5s ease-out infinite" }} />
        <div style={{ position: "absolute", inset: 4, borderRadius: "50%", border: `2px solid ${color}30`, borderTopColor: color, animation: "rp-spin 2s linear infinite" }} />
        <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: `2px solid ${color}15`, borderTopColor: `${color}80`, animation: "rp-spin 3s linear infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={16} style={{ color, animation: "rp-spin 1s linear infinite" }} />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>Генерация отчёта</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>20 AI-агентов анализируют ваш проект параллельно</div>
      </div>

      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: s.done ? `${color}15` : "rgba(255,255,255,0.04)", border: `1px solid ${s.done ? `${color}40` : "rgba(255,255,255,0.07)"}` }}>
              {s.done
                ? <CheckCircle size={9} style={{ color }} />
                : i === activeIdx ? <Loader2 size={8} style={{ color: "rgba(255,255,255,0.35)", animation: "rp-spin 1s linear infinite" }} /> : null
              }
            </div>
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}80`, width: s.done ? "100%" : i === activeIdx ? "45%" : "0%", transition: "width 0.7s ease" }} />
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", width: 130, textAlign: "right" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Skeleton shimmer */}
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 8 }}>
        {[90, 70, 80, 50].map((w, i) => (
          <div key={i} style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${w}%`, borderRadius: 4, background: `rgba(${REPORTS[2].rgb},0.15)`, animation: `rp-pulse 1.8s ease-in-out ${i * 200}ms infinite` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bento Section card ────────────────────────────────────────────────────────

function SectionBento({ section }: { section: typeof SECTIONS[0] }) {
  const [hov, setHov] = useState(false);
  const Icon = section.icon;
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      style={{
        padding: "16px 18px",
        borderRadius: 16,
        background: hov ? `rgba(${section.rgb},0.06)` : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? `rgba(${section.rgb},0.25)` : "rgba(255,255,255,0.06)"}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background 0.2s, border-color 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hov && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${section.rgb},0.6), transparent)` }} />}
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${section.rgb},0.1)`, border: `1px solid rgba(${section.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: hov ? `0 0 12px rgba(${section.rgb},0.25)` : "none", transition: "box-shadow 0.2s" }}>
        <Icon size={14} style={{ color: section.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.78)", marginBottom: 2 }}>{section.title}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{section.desc}</div>
      </div>
      <ArrowUpRight size={13} style={{ color: hov ? section.color : "rgba(255,255,255,0.15)", flexShrink: 0, transition: "color 0.2s" }} />
    </motion.button>
  );
}

// ─── Report list card ──────────────────────────────────────────────────────────

function ReportListCard({ report, active, onClick }: { report: MockReport; active: boolean; onClick: () => void }) {
  const done = report.status === "COMPLETED";
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 14,
        background: active ? `rgba(${report.rgb},0.08)` : "rgba(255,255,255,0.025)",
        border: `1px solid ${active ? `rgba(${report.rgb},0.28)` : "rgba(255,255,255,0.06)"}`,
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: "60%", borderRadius: 2, background: report.color, boxShadow: `0 0 8px ${report.color}` }} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingLeft: active ? 8 : 0 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: done ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", color: done ? "#10b981" : "#f59e0b", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
          {done ? "● Готов" : "● Генерация"}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{report.time}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)", lineHeight: 1.4, marginBottom: 5, paddingLeft: active ? 8 : 0 }}>{report.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: active ? 8 : 0 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{report.type}</span>
        {report.pages > 0 && <><span style={{ color: "rgba(255,255,255,0.12)" }}>·</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{report.pages} стр.</span></>}
        {report.score > 0 && <><span style={{ color: "rgba(255,255,255,0.12)" }}>·</span><span style={{ fontSize: 9, fontWeight: 700, color: report.color }}>{report.score}/100</span></>}
      </div>
    </motion.button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [active, setActive] = useState<MockReport>(REPORTS[0]);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  if (!mounted) return null;

  const isProcessing = active.status === "PROCESSING";
  const scoreColor = active.score >= 85 ? "#10b981" : active.score >= 70 ? "#f59e0b" : "#f87171";

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", position: "relative" }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "9px 18px", borderRadius: 12, background: "rgba(20,18,32,0.95)", border: "1px solid rgba(124,58,237,0.35)", color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%",  left:  "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(${active.rgb},0.05) 0%, transparent 65%)`, transition: "all 1s ease" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "24px 28px 40px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>Отчёты</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Аналитические отчёты вашего Executive Board</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              Использовано: <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>1 из 3</span>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 11, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", fontSize: 12, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
              <Plus size={13} /> Создать отчёт
            </button>
          </div>
        </div>

        {/* ── Layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Left: list ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* AI status */}
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(122,92,255,0.05)", border: "1px solid rgba(122,92,255,0.12)", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Sparkles size={12} style={{ color: "#7A5CFF", flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>20 AI-агентов сформировали {REPORTS.filter(r => r.status === "COMPLETED").length} отчёта</span>
            </div>

            {REPORTS.map(r => (
              <ReportListCard key={r.id} report={r} active={active.id === r.id} onClick={() => setActive(r)} />
            ))}

            {/* Quota */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Квота в месяц</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>1 / 3</span>
              </div>
              <div style={{ height: 2, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: "33%", borderRadius: 2, background: "linear-gradient(90deg, #7c3aed, #6366f1)", boxShadow: "0 0 8px rgba(124,58,237,0.5)" }} />
              </div>
              <Link href="/dashboard/settings" style={{ fontSize: 10, color: "rgba(122,92,255,0.7)", textDecoration: "none" }}>Upgrade для безлимита →</Link>
            </div>
          </div>

          {/* ── Right: detail ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: 22,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(24px)",
                overflow: "hidden",
                boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Shimmer top */}
              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(${active.rgb},0.5), rgba(99,102,241,0.3), transparent)` }} />

              {/* Ambient glow */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, pointerEvents: "none", background: `radial-gradient(ellipse at 30% 0%, rgba(${active.rgb},0.07) 0%, transparent 60%)` }} />

              <div style={{ position: "relative", padding: "24px 28px 28px" }}>

                {/* ── Report header ── */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: isProcessing ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)", color: isProcessing ? "#f59e0b" : "#10b981", border: `1px solid ${isProcessing ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                        {isProcessing ? "● Генерация" : "● Готов"}
                      </span>
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>{active.type}</span>
                      {active.pages > 0 && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>{active.pages} стр.</span>}
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>{active.time}</span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 0 }}>{active.title} — Полный отчёт</h2>
                  </div>

                  {/* Score ring */}
                  {!isProcessing && active.score > 0 && (
                    <div style={{ flexShrink: 0, position: "relative" }}>
                      <ScoreRing score={active.score} color={scoreColor} size={68} animate />
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}><AnimatedNumber value={active.score} /></div>
                        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Score</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Processing or detail ── */}
                {isProcessing ? (
                  <GeneratingLoader color={active.color} />
                ) : (
                  <>
                    {/* KPI strip */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
                      {[
                        { label: "Рынок (SAM)", value: active.market,  icon: Globe,       color: "#38bdf8" },
                        { label: "Прогноз",     value: active.revenue, icon: DollarSign,  color: "#10b981" },
                        { label: "Рост",         value: active.growth,  icon: TrendingUp,  color: "#a78bfa" },
                        { label: "Риск",         value: active.risk,    icon: Shield,      color: active.risk === "Низкий" || active.risk === "Минимальный" ? "#10b981" : "#f59e0b" },
                        { label: "AI Агентов",   value: `${active.agents}`,icon: Brain,   color: active.color },
                      ].map((k, ki) => {
                        const Icon = k.icon;
                        return (
                          <motion.div key={k.label} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: ki * 0.07, duration: 0.4, ease: [0.34, 1.1, 0.64, 1] }}
                            style={{ padding: "12px 14px", borderRadius: 14, background: `rgba(${active.rgb},0.03)`, border: `1px solid rgba(${active.rgb},0.1)` }}>
                            <Icon size={12} style={{ color: k.color, marginBottom: 6 }} />
                            <div style={{ fontSize: 13, fontWeight: 800, color: k.color, marginBottom: 2 }}>{k.value}</div>
                            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{k.label}</div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Animated breakdown meters */}
                    <div style={{ padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 14 }}>Оценка по направлениям</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                        {[
                          { label: "Рыночный потенциал", v: Math.min(99, active.score + 4), c: "#38bdf8" },
                          { label: "Финансовая модель",  v: Math.max(40, active.score - 3), c: "#10b981" },
                          { label: "Реализуемость",       v: Math.min(99, active.score + 1), c: "#a78bfa" },
                          { label: "Конкурентоспособность", v: Math.max(40, active.score - 6), c: "#f59e0b" },
                        ].map((m, i) => (
                          <MeterBar key={m.label} label={m.label} value={m.v} color={m.c} delay={i * 130} />
                        ))}
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div style={{ padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${active.rgb},0.4), transparent)` }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Sparkles size={11} style={{ color: active.color }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Executive Summary</span>
                      </div>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.75, margin: 0 }}>{active.summary}</p>
                    </div>

                    {/* AI Insight row */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      {[
                        { icon: Star,          color: "#f59e0b", text: "Топ 8% среди аналогичных проектов" },
                        { icon: TrendingUp,    color: "#10b981", text: `Рост выручки ${active.growth}/год` },
                        { icon: CheckCircle,   color: active.color, text: "Стратегия готова к исполнению" },
                      ].map((ins, i) => {
                        const Icon = ins.icon;
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <Icon size={12} style={{ color: ins.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{ins.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bento sections */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Разделы отчёта</div>

                      {/* Full: Summary */}
                      <div style={{ marginBottom: 8 }}>
                        <SectionBento section={SECTIONS[0]} />
                      </div>

                      {/* Half: Finance + Market */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <SectionBento section={SECTIONS[1]} />
                        <SectionBento section={SECTIONS[2]} />
                      </div>

                      {/* Third: Marketing + Ops + Risks */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <SectionBento section={SECTIONS[3]} />
                        <SectionBento section={SECTIONS[4]} />
                        <SectionBento section={SECTIONS[5]} />
                      </div>

                      {/* Full: Roadmap */}
                      <SectionBento section={SECTIONS[6]} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => downloadPDF(active)} style={{
                        flex: 1, minWidth: 150, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        borderRadius: 13, background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
                        fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
                        boxShadow: "0 8px 28px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
                        position: "relative", overflow: "hidden",
                      }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }} />
                        <Download size={15} /> Скачать PDF
                      </button>

                      <button onClick={() => { downloadWord(active); setToast("Файл Word (.doc) скачан"); }} style={{ height: 44, padding: "0 16px", display: "flex", alignItems: "center", gap: 7, borderRadius: 13, background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", fontSize: 12, fontWeight: 600, color: "#60a5fa", cursor: "pointer" }}>
                        <FileText size={14} /> Word
                      </button>

                      <button onClick={() => { downloadExcel(active); setToast("Файл Excel (.xls) скачан"); }} style={{ height: 44, padding: "0 16px", display: "flex", alignItems: "center", gap: 7, borderRadius: 13, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 12, fontWeight: 600, color: "#34d399", cursor: "pointer" }}>
                        <BarChart2 size={14} /> Excel
                      </button>

                      <button onClick={async () => {
                        const url = typeof window !== "undefined" ? window.location.href : "";
                        try {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          if ((navigator as any).share) { await (navigator as any).share({ title: active.title, text: `Отчёт Apex AI: ${active.title}`, url }); }
                          else { await navigator.clipboard.writeText(url); setToast("Ссылка скопирована"); }
                        } catch { /* user cancelled */ }
                      }} style={{ height: 44, padding: "0 16px", display: "flex", alignItems: "center", gap: 7, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                        <Share2 size={14} /> Поделиться
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes rp-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rp-ping  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }
        @keyframes rp-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
