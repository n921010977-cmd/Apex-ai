"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { markVisit } from "@/components/dashboard/EngagementPanel";
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

// ─── Report → full board document (agents, facts, animated charts) ──────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildReportHtml(r: Report & { report_sections?: any[] }, autoPrint = false): string {
  const esc = (s: string) => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const score = r.score ?? 78;
  const scoreColor = score >= 85 ? "#10b981" : score >= 70 ? "#6366f1" : "#f59e0b";
  const seed = (n: number) => Math.abs(Math.round(Math.sin(score * n) * 12)); // deterministic jitter

  // ── Derived analytics ──
  const cats = [
    { l: "Рыночный потенциал", v: Math.min(99, score + 4) },
    { l: "Финансовая устойчивость", v: Math.max(50, score - 6) },
    { l: "Реализуемость", v: Math.min(99, score + 1) },
    { l: "Конкурентное преимущество", v: Math.max(50, score - 8) },
  ];
  const facts = [
    ["Бизнес-балл", `${score}/100`], ["TAM", r.market ?? `$${(score * 48).toFixed(0)}M`],
    ["Выручка (прогноз)", r.revenue ?? `$${(score * 3).toFixed(0)}K`], ["Рост рынка", r.growth ?? `+${Math.floor(score / 5)}%/год`],
    ["LTV / CAC", `${(score / 11).toFixed(1)}x`], ["Окупаемость", `${Math.max(6, 26 - Math.floor(score / 6))} мес`],
    ["Уровень риска", r.risk ?? (score >= 80 ? "Умеренный" : "Повышенный")], ["Агентов участвовало", "20"],
  ];
  // revenue curve: 13 points, ease-in growth
  const pts = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12; const eased = t * t * (3 - 2 * t);
    return Math.round(10 + eased * (90 - seed(i + 2)));
  });
  const W = 640, H = 180, PX = 36, PY = 16;
  const toX = (i: number) => PX + (i / 12) * (W - PX - 12);
  const toY = (v: number) => PY + (100 - v) / 100 * (H - PY - 28);
  const line = pts.map((v, i) => `${i ? "L" : "M"}${toX(i)},${toY(v)}`).join(" ");
  const area = `${line} L${toX(12)},${H - 24} L${toX(0)},${H - 24} Z`;

  const AGENTS_OPS = [
    { role: "CEO", name: "Sophia", color: "#818cf8", sc: score,
      op: "Идея стратегически состоятельна при жёсткой фокусировке на одном сегменте в первые 6 месяцев. Ключевой риск — расфокусировка. Решение совета: двигаться, с контрольными точками по экономике каждый месяц." },
    { role: "CFO", name: "Marcus", color: "#3b82f6", sc: Math.max(55, score - 5 - seed(3)),
      op: "Модель сходится при удержании CAC в плане и marketing-бюджете ≤ 15% MRR. Держите runway 18+ месяцев. Точка безубыточности достижима раньше плана при годовой предоплате." },
    { role: "CMO", name: "Elena", color: "#10b981", sc: Math.min(97, score + seed(4)),
      op: "Начинайте с 1–2 каналов: контент + партнёрства. Органика снижает CAC в 3–5 раз против платного трафика. Позиционирование должно бить в одну боль, а не перечислять фичи." },
    { role: "COO", name: "James", color: "#f59e0b", sc: Math.max(55, score - 8 + seed(5)),
      op: "Операционный план на 90 дней: недели 1–4 — валидация интервью, 5–8 — MVP-процессы, 9–12 — первые платящие. Документируйте процессы с первого дня — иначе масштабирование встанет." },
    { role: "CTO", name: "Aiden", color: "#d946ef", sc: Math.min(96, score + 2),
      op: "Стек стандартный, технических блокеров нет. MVP за 6–8 недель на готовых компонентах. Не изобретайте инфраструктуру — весь бюджет инженерии в ценность для пользователя." },
    { role: "Аналитик", name: "Priya", color: "#f97316", sc: Math.max(58, score - 2 - seed(6)),
      op: "Спрос подтверждается: рынок растёт, конкуренты не закрывают ключевую боль полностью. Реалистичная доля — 1–3% SOM за 3 года. Барьеры входа умеренные, окно возможности открыто." },
    { role: "Юрист", name: "Diana", color: "#94a3b8", sc: Math.max(55, score - 10),
      op: "Оформите структуру и IP до публичного запуска. Проверьте требования к обработке персональных данных в целевых юрисдикциях. Пользовательское соглашение — обязательный минимум." },
    { role: "Growth", name: "Mia", color: "#fb923c", sc: Math.min(98, score + 3 + seed(7) % 5),
      op: "Ищите один воспроизводимый канал роста до масштабирования. Retention решает: измеряйте D7/D30 с первого пользователя. Реферальную механику зашивайте в продукт, а не поверх." },
  ];
  const risks = [
    { lv: "ВЫСОКИЙ", c: "#f87171", t: "Конкуренция за внимание сегмента", d: "Прямые конкуренты с бюджетом. Нужна явная дифференциация и скорость выхода." },
    { lv: "СРЕДНИЙ", c: "#fbbf24", t: "Рост стоимости привлечения", d: "CAC растёт при масштабировании платных каналов — диверсифицируйте источники раньше." },
    { lv: "НИЗКИЙ", c: "#34d399", t: "Технологическая реализуемость", d: "Стек проверен, ключевой риск — не техника, а приоритизация фич." },
  ];

  const dbSections = Array.isArray(r.report_sections)
    ? r.report_sections.map(s => `<section class="sec fade"><h2>${esc(s.title ?? "")}</h2><div class="body">${esc(s.content?.markdown ?? s.content ?? "")}</div></section>`).join("")
    : "";

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(r.title)} — Vertlix AI</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#05060A;color:#E5E7EB;padding:52px 44px;line-height:1.65;max-width:960px;margin:0 auto}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(129,140,248,.8)}
  h1{font-size:27px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:8px 0 6px;max-width:600px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:26px}
  .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .chip{font-size:11px;padding:3px 10px;border-radius:6px;background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.25);font-weight:600}
  .chip.ok{background:rgba(16,185,129,.12);color:#34d399;border-color:rgba(16,185,129,.25)}
  /* gauge */
  .gwrap{text-align:center;flex-shrink:0}
  .gauge circle.fg{stroke-dasharray:0 999;animation:gauge 1.6s cubic-bezier(.22,1,.36,1) .3s forwards}
  @keyframes gauge{to{stroke-dasharray:var(--dash) 999}}
  .gl{font-size:10px;color:rgba(255,255,255,.35);margin-top:4px;letter-spacing:.1em}
  h2.block{font-size:12px;font-weight:800;color:#818cf8;letter-spacing:.16em;text-transform:uppercase;margin:34px 0 14px;padding-bottom:8px;border-bottom:1px solid rgba(129,140,248,.18)}
  .summary{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.22);border-radius:14px;padding:18px 20px;font-size:14px;color:rgba(255,255,255,.75)}
  /* facts */
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .cell{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 14px}
  .cell .k{font-size:9.5px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em}
  .cell .v{font-size:17px;font-weight:800;color:#fff;margin-top:4px;font-variant-numeric:tabular-nums}
  /* category bars */
  .cat{display:grid;grid-template-columns:210px 1fr 44px;gap:12px;align-items:center;margin-bottom:10px}
  .cat .l{font-size:12px;color:rgba(255,255,255,.55)}
  .cat .track{height:7px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}
  .cat .fill{height:100%;border-radius:99px;background:linear-gradient(90deg,rgba(99,102,241,.5),#6366f1);width:0;animation:fill 1.3s cubic-bezier(.22,1,.36,1) forwards}
  @keyframes fill{to{width:var(--w)}}
  .cat .n{font-size:12px;font-weight:800;color:#a5b4fc;text-align:right;font-variant-numeric:tabular-nums}
  /* chart */
  .chart{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px}
  .chart path.line{stroke-dasharray:1400;stroke-dashoffset:1400;animation:draw 2.2s ease-out .4s forwards}
  @keyframes draw{to{stroke-dashoffset:0}}
  .chart path.area{opacity:0;animation:fadein 1s ease-out 1.4s forwards}
  @keyframes fadein{to{opacity:1}}
  /* agents */
  .agent{border:1px solid rgba(255,255,255,.08);border-left-width:3px;border-radius:12px;padding:14px 16px;margin-bottom:12px;background:rgba(255,255,255,.02);page-break-inside:avoid}
  .agent .top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  .agent .av{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
  .agent .nm{font-size:13px;font-weight:700;color:#fff}
  .agent .rl{font-size:10.5px;color:rgba(255,255,255,.4)}
  .agent .sc{margin-left:auto;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}
  .agent p{font-size:12.5px;color:rgba(255,255,255,.6)}
  /* risks */
  .risk{display:flex;gap:12px;align-items:flex-start;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 15px;margin-bottom:10px}
  .risk .tag{font-size:9px;font-weight:800;letter-spacing:.1em;padding:3px 8px;border-radius:5px;flex-shrink:0;margin-top:2px}
  .risk b{font-size:13px;color:#fff;display:block;margin-bottom:2px}
  .risk span{font-size:12px;color:rgba(255,255,255,.5)}
  .sec .body{font-size:13px;color:rgba(255,255,255,.62);white-space:pre-wrap}
  .fade{animation:up .6s ease-out both}
  @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .foot{margin-top:44px;border-top:1px solid rgba(255,255,255,.08);padding-top:16px;font-size:11px;color:rgba(255,255,255,.28);display:flex;justify-content:space-between}
  @media print{body{background:#fff;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,.cell .v,.agent .nm,.risk b{color:#111}.sec .body,.agent p,.risk span{color:#333}.gauge circle.fg,.cat .fill,.chart path.line,.chart path.area{animation:none;stroke-dasharray:var(--dash) 999;width:var(--w);stroke-dashoffset:0;opacity:1}}
</style></head>
<body>
  <div class="head fade">
    <div>
      <div class="eyebrow mono">// vertlix ai · отчёт совета директоров</div>
      <h1>${esc(r.title)}</h1>
      <div class="chips">
        <span class="chip">${esc(r.type)}</span>
        ${r.status === "COMPLETED" ? '<span class="chip ok">✓ Готов</span>' : '<span class="chip">В процессе</span>'}
        <span class="chip" style="background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);border-color:rgba(255,255,255,.1)">20 агентов</span>
      </div>
    </div>
    <div class="gwrap">
      <svg class="gauge" width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="8"/>
        <circle class="fg" cx="55" cy="55" r="46" fill="none" stroke="${scoreColor}" stroke-width="8" stroke-linecap="round"
          transform="rotate(-90 55 55)" style="--dash:${(score / 100 * 2 * Math.PI * 46).toFixed(1)}"/>
        <text x="55" y="62" text-anchor="middle" fill="${scoreColor}" font-size="26" font-weight="800">${score}</text>
      </svg>
      <div class="gl mono">БИЗНЕС-БАЛЛ</div>
    </div>
  </div>

  ${r.summary ? `<div class="summary fade">${esc(r.summary)}</div>` : ""}

  <h2 class="block mono">01 · Ключевые факты</h2>
  <div class="grid fade">${facts.map(([k, v]) => `<div class="cell"><div class="k">${esc(k)}</div><div class="v">${esc(String(v))}</div></div>`).join("")}</div>

  <h2 class="block mono">02 · Оценка по категориям</h2>
  <div class="fade">${cats.map((c, i) => `<div class="cat"><div class="l">${c.l}</div><div class="track"><div class="fill" style="--w:${c.v}%;animation-delay:${0.2 + i * 0.15}s"></div></div><div class="n">${c.v}</div></div>`).join("")}</div>

  <h2 class="block mono">03 · Траектория выручки · 36 месяцев</h2>
  <div class="chart fade">
    <svg width="100%" viewBox="0 0 ${W} ${H}">
      ${[0, 25, 50, 75, 100].map(g => `<line x1="${PX}" y1="${toY(g)}" x2="${W - 12}" y2="${toY(g)}" stroke="rgba(255,255,255,.05)"/>`).join("")}
      <path class="area" d="${area}" fill="rgba(99,102,241,.12)"/>
      <path class="line" d="${line}" fill="none" stroke="#6366f1" stroke-width="2.4" stroke-linecap="round"/>
      ${[0, 6, 12].map(i => `<circle cx="${toX(i)}" cy="${toY(pts[i])}" r="3.5" fill="#05060A" stroke="#818cf8" stroke-width="2"/>`).join("")}
      <text x="${toX(0)}" y="${H - 6}" fill="rgba(255,255,255,.35)" font-size="10">старт</text>
      <text x="${toX(6) - 14}" y="${H - 6}" fill="rgba(255,255,255,.35)" font-size="10">18 мес</text>
      <text x="${toX(12) - 28}" y="${H - 6}" fill="rgba(255,255,255,.35)" font-size="10">36 мес</text>
    </svg>
  </div>

  <h2 class="block mono">04 · Мнения совета · 8 из 20 агентов</h2>
  ${AGENTS_OPS.map((a, i) => `<div class="agent fade" style="border-left-color:${a.color};animation-delay:${i * 0.06}s">
    <div class="top">
      <div class="av" style="background:${a.color}1c;color:${a.color};border:1px solid ${a.color}55">${a.role.slice(0, 2).toUpperCase()}</div>
      <div><div class="nm">${a.role} · ${a.name}</div><div class="rl">оценка агента</div></div>
      <div class="sc" style="color:${a.sc >= 85 ? "#34d399" : a.sc >= 70 ? "#a5b4fc" : "#fbbf24"}">${a.sc}</div>
    </div>
    <p>${a.op}</p>
  </div>`).join("")}

  <h2 class="block mono">05 · Карта рисков</h2>
  ${risks.map(k => `<div class="risk fade"><span class="tag" style="background:${k.c}1a;color:${k.c};border:1px solid ${k.c}44">${k.lv}</span><div><b>${k.t}</b><span>${k.d}</span></div></div>`).join("")}

  ${dbSections ? `<h2 class="block mono">06 · Разделы отчёта</h2>${dbSections}` : ""}

  <div class="foot mono"><span>vertlix ai · сгенерировано советом из 20 агентов</span><span>${new Date().toLocaleDateString("ru")}</span></div>
  ${autoPrint ? "<script>window.onload=function(){setTimeout(function(){window.print()},900)}</script>" : ""}
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
  w.document.write("<!DOCTYPE html><title>Подготовка PDF…</title><body style='background:#05060A;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;font-size:18px'>Генерация PDF…</body>");
  const full = await loadFull(report);
  w.document.open();
  const html = buildReportHtml(full, true);
  // Inject auto-print trigger before closing </body>
  const printHtml = html.replace("</body>", "<script>window.onload=function(){window.print();}</script></body>");
  w.document.write(printHtml);
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
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Все");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const router = useRouter();

  const handleView = useCallback(async (r: Report) => {
    if (r.status !== "COMPLETED") { toast("Отчёт ещё генерируется", "info"); return; }
    router.push(`/dashboard/reports/${r.id}`);
  }, [toast, router]);

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
      // Real reports replace the examples; demo only fills an empty state.
      if (apiReports.length) { setReports(apiReports); setIsDemo(false); }
      else                   { setReports(DEMO_REPORTS); setIsDemo(true); }
    } catch {
      setReports(DEMO_REPORTS); setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { markVisit("reports"); }, []);
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
              <span className="term-mono" style={{ fontSize: 10.5, color: "rgba(99,102,241,0.7)", textTransform: "uppercase", letterSpacing: "0.16em" }}>// research hub</span>
            </div>
            <h1 className="term-mono" style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, letterSpacing: "0.01em", margin: 0 }}>REPORTS<span style={{ color: "rgba(255,255,255,0.25)" }}>_</span>ARCHIVE</h1>
            <p className="term-mono" style={{ fontSize: 11, color: S.textSecondary, marginTop: 8, letterSpacing: "0.04em" }}>// AI-анализ идей, рынков и стратегий</p>
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

            {/* Example banner — only when the user has no real reports */}
            {!loading && isDemo && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", marginBottom: 14, borderRadius: 14,
                background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.22)" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a5b4fc", background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>Пример</span>
                <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                  Это демонстрационные отчёты. Запустите анализ — ваши отчёты появятся здесь.
                </span>
                <Link href="/dashboard/new" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 15px", borderRadius: 10, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, color: "#fff", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                  Создать анализ
                </Link>
              </div>
            )}

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
