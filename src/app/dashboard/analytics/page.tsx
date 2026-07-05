"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Activity,
  Brain, Target, Shield, Download, RefreshCw, Sparkles,
  DollarSign, Users, Clock,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const S = {
  bg: "#05060A",
  surface: "rgba(255,255,255,0.03)",
  surfaceHover: "rgba(255,255,255,0.055)",
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

const PERIODS = ["7 дней", "30 дней", "3 мес", "Год"] as const;
type Period = typeof PERIODS[number];

// ─── Demo data ─────────────────────────────────────────────────────────────────
const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

const SERIES = {
  revenue:  [28, 34, 42, 55, 62, 70, 79, 85, 94, 102, 111, 124],
  profit:   [6,  9,  13, 18, 22, 27, 33, 38, 44, 51,  58,  66],
  users:    [410, 520, 670, 810, 1020, 1250, 1510, 1790, 2100, 2450, 2840, 3280],
};

const CATEGORY_SCORES = [
  { label: "Финансы",    score: 91, delta: "+3" },
  { label: "Продажи",    score: 78, delta: "+5" },
  { label: "Маркетинг",  score: 65, delta: "-2" },
  { label: "Продукт",    score: 94, delta: "+1" },
  { label: "HR",         score: 58, delta: "+4" },
  { label: "AI Core",    score: 97, delta: "+6" },
];

const AI_RECS = [
  { icon: DollarSign, title: "Поднять цену на 23%", desc: "Анализ показывает недооценку. Рынок выдержит $49/мес без потери конверсии.", tag: "Высокий ROI", roi: "+$680K" },
  { icon: TrendingUp,  title: "Запустить EU экспансию", desc: "GDPR-готовность 94%. Германия + Нидерланды — первые рынки с TAM $1.8B.", tag: "Стратегический", roi: "+$1.8M" },
  { icon: Users,       title: "SEO-канал для SaaS", desc: "CAC снизится на 30% при инвестиции $12K/мес. Breakeven через 4 месяца.", tag: "Quick Win", roi: "+$340K" },
  { icon: Target,      title: "AI Upsell Premium", desc: "Сегмент Premium показывает конверсию 28%. Рекомендован новый тариф Pro.", tag: "Легко", roi: "+$220K" },
];

const TIMELINE = [
  { icon: Activity,   title: "AI Fitness Platform — Score 87/100", desc: "Анализ завершён · 24 стр.", time: "2 ч" },
  { icon: TrendingUp, title: "Обнаружен EU рынок", desc: "TAM $1.8B · Германия", time: "5 ч" },
  { icon: DollarSign, title: "Финансовая модель обновлена", desc: "SaaS Invoice · Q2 +18%", time: "1 д" },
  { icon: Shield,     title: "Risk index снижен", desc: "28 → 24 после митигации", time: "2 д" },
  { icon: Brain,      title: "AI Score портфеля вырос", desc: "83 → 87 (+4 пункта)", time: "3 д" },
];

// ─── Backend interface ─────────────────────────────────────────────────────────
interface ApiSummary {
  total_decisions?: number;
  avg_roi?: number;
  active_projects?: number;
  time_series?: { date: string; value: number }[];
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(to: number, active: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [to, active, duration]);
  return val;
}

// ─── SVG Area Chart ────────────────────────────────────────────────────────────
function AreaChart({ data, color, labels, height = 180 }: { data: number[]; color: string; labels?: string[]; height?: number }) {
  const svgRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-60px" });
  const [pathLen, setPathLen] = useState(0);

  const W = 700, H = height, PX = 8, PY = 16;
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.05;
  const pts = data.map((v, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX * 2),
    y: H - PY - ((v - min) / (max - min)) * (H - PY * 2),
  }));

  const d = pts.map((p, i) => {
    if (!i) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1], mx = (prev.x + p.x) / 2;
    return `C${mx.toFixed(1)},${prev.y.toFixed(1)} ${mx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
  const area = `${d} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  const gradId = `ag-${color.replace("#","")}`;

  useEffect(() => {
    if (svgRef.current) setPathLen(svgRef.current.getTotalLength());
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={PX} y1={PY + t*(H-PY*2)} x2={W-PX} y2={PY + t*(H-PY*2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path ref={svgRef} d={d} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={pathLen || 2000}
          strokeDashoffset={inView ? 0 : (pathLen || 2000)}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
        />
        {pts.map((p, i) => i === pts.length - 1 ? (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
        ) : null)}
        {(labels ?? MONTHS.slice(0, data.length)).map((l, i) => (
          <text key={i} x={pts[i].x} y={H - 2} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.22)">{l}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Bar chart ─────────────────────────────────────────────────────────────────
function HorizontalBar({ score, color, label, delta }: { score: number; color: string; label: string; delta: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const isPos = delta.startsWith("+");
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: S.textSecondary }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: isPos ? S.success : S.danger }}>{delta}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: S.textPrimary, fontVariantNumeric: "tabular-nums" }}>{score}</span>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${score}%` } : {}}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "100%", borderRadius: 4, background: color }}
        />
      </div>
    </div>
  );
}

// ─── AnimatedKPI ───────────────────────────────────────────────────────────────
function AnimatedKPI({ value, label, sub, color, prefix = "", suffix = "" }: {
  value: number; label: string; sub: string; color: string; prefix?: string; suffix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, inView);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
        {prefix}{count.toLocaleString()}{suffix}
      </span>
      <span style={{ fontSize: 13, color: S.textSecondary }}>{label}</span>
      <span style={{ fontSize: 11, color: S.textMuted }}>{sub}</span>
    </div>
  );
}

// ─── Fade-up helper ────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30 дней");
  const [apiData, setApiData] = useState<ApiSummary | null>(null);
  const [chartTab, setChartTab] = useState<"revenue" | "profit" | "users">("revenue");

  const PERIOD_MAP: Record<Period, string> = {
    "7 дней": "7d", "30 дней": "30d", "3 мес": "90d", "Год": "1y",
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics?period=${PERIOD_MAP[period]}`);
      const j = await res.json();
      if (j.success) setApiData(j.data ?? j.summary ?? j);
    } catch { /* use demo data */ }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartColors = { revenue: S.accent, profit: S.success, users: S.violet };
  const chartLabels = { revenue: "Revenue ($K)", profit: "Profit ($K)", users: "Пользователи" };

  const kpis = [
    { value: apiData?.total_decisions ?? 142, label: "Решений принято", sub: "AI-анализ", color: S.accent, suffix: "" },
    { value: apiData?.avg_roi ?? 280, label: "Средний ROI", sub: "по портфелю", color: S.success, suffix: "%" },
    { value: apiData?.active_projects ?? 3, label: "Активных проектов", sub: "в работе", color: S.violet, suffix: "" },
    { value: 94, label: "AI Health Score", sub: "отличное", color: S.warning, suffix: "" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.textPrimary, fontFamily: "system-ui,-apple-system,sans-serif", padding: "0 0 80px" }}>
      <style>{`
        .an-kpi { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .an-main { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
        .an-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .an-recs { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        .an-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045); transition: border-color 0.2s; }
        .an-card:hover { border-color: rgba(255,255,255,0.13); }
        @media (max-width: 960px) { .an-main { grid-template-columns: 1fr; } .an-bottom { grid-template-columns: 1fr; } .an-recs { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .an-kpi { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      {/* Header */}
      <motion.div {...fadeUp(0)} style={{ padding: "40px 40px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: `1px solid ${S.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={18} color={S.accent} />
              </div>
              <span style={{ fontSize: 11, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.14em" }}>Business Intelligence</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Аналитика</h1>
            <p style={{ fontSize: 14, color: S.textSecondary, marginTop: 6 }}>Комплексный анализ бизнес-метрик, трендов и прогнозов</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Period toggle */}
            <div style={{ display: "flex", background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 3, gap: 2 }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: "6px 12px", borderRadius: 9, border: "none", background: period === p ? S.accent : "transparent", color: period === p ? "#fff" : S.textMuted, fontSize: 12, cursor: "pointer", fontWeight: period === p ? 700 : 400, transition: "all 0.15s" }}
                >{p}</button>
              ))}
            </div>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={fetchData}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 13, cursor: "pointer" }}
            >
              <RefreshCw size={14} />
            </motion.button>

            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <Download size={14} />
              Отчёт
            </motion.button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="an-kpi" style={{ marginBottom: 24 }}>
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} {...fadeUp(0.1 + i * 0.07)} className="an-card">
              <AnimatedKPI {...kpi} prefix="" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div style={{ padding: "0 40px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Main chart + scores */}
        <div className="an-main" style={{ marginBottom: 20 }}>
          <motion.div {...fadeUp(0.2)} className="an-card">
            {/* Chart tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>
                {chartLabels[chartTab]} · {period}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {(["revenue", "profit", "users"] as const).map(t => (
                  <button key={t} onClick={() => setChartTab(t)}
                    style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${chartTab === t ? chartColors[t] : S.border}`, background: chartTab === t ? `${chartColors[t]}18` : "transparent", color: chartTab === t ? chartColors[t] : S.textMuted, fontSize: 12, cursor: "pointer", fontWeight: chartTab === t ? 700 : 400, transition: "all 0.15s", textTransform: "capitalize" }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <AreaChart data={SERIES[chartTab]} color={chartColors[chartTab]} height={200} />

            {/* Sparklines summary row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 20 }}>
              {(["revenue", "profit", "users"] as const).map(t => {
                const d = SERIES[t];
                const last = d[d.length - 1];
                const prev = d[d.length - 2];
                const delta = ((last - prev) / prev * 100).toFixed(1);
                const isUp = last >= prev;
                return (
                  <div key={t} style={{ padding: "12px 14px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}` }}>
                    <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4, textTransform: "capitalize" }}>{t}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: chartColors[t], fontVariantNumeric: "tabular-nums" }}>{last.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: isUp ? S.success : S.danger, marginTop: 2 }}>
                      {isUp ? <TrendingUp size={10} style={{ display: "inline", marginRight: 3 }} /> : <TrendingDown size={10} style={{ display: "inline", marginRight: 3 }} />}
                      {isUp ? "+" : ""}{delta}%
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Category scores */}
          <motion.div {...fadeUp(0.25)} className="an-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 20 }}>Здоровье по отделам</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {CATEGORY_SCORES.map((c, i) => {
                const col = c.score >= 90 ? S.success : c.score >= 70 ? S.accent : c.score >= 55 ? S.warning : S.danger;
                return (
                  <motion.div key={c.label}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.22,1,0.36,1] }}
                  >
                    <HorizontalBar score={c.score} color={col} label={c.label} delta={c.delta} />
                  </motion.div>
                );
              })}
            </div>

            {/* AI pulse */}
            <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 12, background: "rgba(99,102,241,0.06)", border: `1px solid ${S.accent}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Sparkles size={14} color={S.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: S.accent }}>AI Insight</span>
              </div>
              <p style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.6, margin: 0 }}>
                Продукт и AI-направление показывают стабильный рост. Маркетинг требует внимания — рекомендуется SEO-стратегия.
              </p>
            </div>
          </motion.div>
        </div>

        {/* AI recommendations */}
        <motion.div {...fadeUp(0.3)} className="an-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Brain size={16} color={S.accent} />
              <span style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>AI Рекомендации</span>
            </div>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.1)", color: S.accent, border: `1px solid ${S.accent}22` }}>{AI_RECS.length} активных</span>
          </div>
          <div className="an-recs">
            {AI_RECS.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <motion.div key={rec.title}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.07, duration: 0.45, ease: [0.22,1,0.36,1] }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  style={{ padding: "16px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`, cursor: "pointer", transition: "border-color 0.18s" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: `1px solid ${S.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={S.accent} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: S.success }}>{rec.roi}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "rgba(99,102,241,0.08)", color: S.textMuted, border: `1px solid ${S.border}` }}>{rec.tag}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 6 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.6 }}>{rec.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom: timeline + quick stats */}
        <div className="an-bottom">
          <motion.div {...fadeUp(0.38)} className="an-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Clock size={14} color={S.textMuted} />
              <span style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Активность</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {TIMELINE.map((ev, i) => {
                const Icon = ev.icon;
                return (
                  <motion.div key={ev.title}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, background: S.surface, border: `1px solid ${S.border}` }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(99,102,241,0.08)", border: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} color={S.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{ev.desc}</div>
                    </div>
                    <span style={{ fontSize: 11, color: S.textMuted, flexShrink: 0 }}>{ev.time}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.42)} className="an-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 20 }}>Метрики портфеля</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Общий TAM", value: "$4.8B", color: S.accent },
                { label: "Weighted IRR", value: "38%", color: S.success },
                { label: "Avg Payback", value: "14 мес", color: S.warning },
                { label: "AI Coverage", value: "97%", color: S.violet },
                { label: "Time to Value", value: "2.3 нед", color: S.textPrimary },
                { label: "Decisions / Day", value: "4.7", color: S.textPrimary },
              ].map((m, i) => (
                <motion.div key={m.label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.48 + i * 0.05 }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: S.surface, border: `1px solid ${S.border}` }}
                >
                  <span style={{ fontSize: 13, color: S.textSecondary }}>{m.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
