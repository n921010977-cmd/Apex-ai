"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, TrendingUp, TrendingDown, DollarSign, BarChart2,
  Shield, Target, Zap, Brain, Globe, Activity, CheckCircle,
  AlertTriangle, Lightbulb, Download, Share2, RefreshCw,
  ArrowUpRight, ChevronRight, Star, Cpu, Clock, Users,
  PieChart, Layers, Rocket,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS = ["7 дней", "30 дней", "3 мес", "Год"] as const;
type Period = typeof PERIODS[number];

const CHART_TABS = ["Revenue", "Profit", "Market", "Growth", "Forecast"] as const;
type ChartTab = typeof CHART_TABS[number];

// ─── Demo data ─────────────────────────────────────────────────────────────────

const PROJECTS_TABLE = [
  { name: "AI Fitness Platform", score: 87, roi: "340%", growth: "+24%", risk: "Низкий",    potential: "Высокий",  status: "active",  color: "#7A5CFF", rgb: "122,92,255" },
  { name: "SaaS Invoice",        score: 91, roi: "420%", growth: "+18%", risk: "Мин.",       potential: "Высокий",  status: "active",  color: "#10b981", rgb: "16,185,129" },
  { name: "Restaurant Chain",    score: 72, roi: "180%", growth: "+9%",  risk: "Средний",    potential: "Средний",  status: "process", color: "#f59e0b", rgb: "245,158,11" },
];

const AI_RECS = [
  { title: "Поднять цену на 23%",      desc: "Анализ показывает недооценку. Рынок выдержит $49/мес без потери конверсии.", priority: "High", impact: "Высокий", difficulty: "Легко", roi: "+$680K", time: "2 нед.", color: "#10b981", rgb: "16,185,129", icon: DollarSign },
  { title: "Запустить EU экспансию",   desc: "GDPR-готовность 94%. Германия + Нидерланды — первые рынки с TAM $1.8B.",   priority: "High", impact: "Высокий", difficulty: "Средне", roi: "+$1.8M", time: "3 мес.",  color: "#3b82f6", rgb: "59,130,246",  icon: Globe },
  { title: "SEO-канал для SaaS",       desc: "CAC снизится на 30% при инвестиции $12K/мес. Breakeven через 4 месяца.",    priority: "Med",  impact: "Средний", difficulty: "Средне", roi: "+$340K", time: "1 мес.",  color: "#a78bfa", rgb: "167,139,250", icon: TrendingUp },
  { title: "AI Upsell для Fitness",    desc: "Сегмент Premium показывает конверсию 28%. Рекомендован новый тариф Pro.",   priority: "Med",  impact: "Средний", difficulty: "Легко", roi: "+$220K", time: "3 нед.", color: "#f59e0b", rgb: "245,158,11",  icon: Zap },
];

const HEATMAP_DATA = [
  { label: "Финансы",   vals: [85, 72, 90, 78, 88, 82, 91] },
  { label: "Продажи",   vals: [70, 85, 65, 88, 72, 90, 78] },
  { label: "Маркетинг", vals: [60, 75, 82, 70, 85, 68, 77] },
  { label: "Продукт",   vals: [90, 88, 85, 92, 87, 89, 94] },
  { label: "HR",        vals: [55, 62, 70, 58, 65, 72, 60] },
  { label: "AI",        vals: [95, 92, 98, 90, 96, 93, 97] },
  { label: "Growth",    vals: [78, 82, 75, 88, 80, 85, 83] },
];

const TIMELINE_EVENTS = [
  { icon: CheckCircle, color: "#10b981", rgb: "16,185,129", title: "Завершён анализ AI Fitness", desc: "Score 87/100 · 24 страницы", time: "2ч" },
  { icon: Globe,       color: "#3b82f6", rgb: "59,130,246", title: "Обнаружен EU-рынок",          desc: "TAM $1.8B · Германия", time: "5ч" },
  { icon: DollarSign,  color: "#7A5CFF", rgb: "122,92,255", title: "Финансовая модель обновлена", desc: "SaaS Invoice · Q2 +18%", time: "1д" },
  { icon: AlertTriangle,color:"#f59e0b", rgb: "245,158,11", title: "Конкурент FitAI привлёк $15M","desc": "Требует стратегического ответа", time: "2д" },
  { icon: Sparkles,    color: "#a78bfa", rgb: "167,139,250", title: "AI Score портфеля вырос",    desc: "83 → 87 (+4 пункта)", time: "3д" },
];

const SMART_WIDGETS = [
  { label: "AI Health",          value: "94%",   icon: Brain,       color: "#7A5CFF", rgb: "122,92,255",  sub: "Отличное" },
  { label: "Risk Index",         value: "24",    icon: Shield,       color: "#10b981", rgb: "16,185,129",  sub: "Низкий" },
  { label: "Opportunity Score",  value: "88",    icon: Target,       color: "#3b82f6", rgb: "59,130,246",  sub: "4 найдено" },
  { label: "Market Trend",       value: "↑ Bull",icon: TrendingUp,   color: "#f59e0b", rgb: "245,158,11",  sub: "+12% Q2" },
  { label: "Competitors",        value: "6",     icon: Users,        color: "#f43f5e", rgb: "244,63,94",   sub: "Отслеживается" },
  { label: "Cash Flow",          value: "+$82K", icon: DollarSign,   color: "#10b981", rgb: "16,185,129",  sub: "Этот месяц" },
];

// Chart data series
const CHART_DATA: Record<ChartTab, number[]> = {
  Revenue:  [12, 18, 22, 31, 38, 44, 52, 61, 70, 78, 85, 92],
  Profit:   [4,  6,  8,  12, 16, 20, 26, 32, 38, 44, 51, 58],
  Market:   [20, 24, 28, 33, 39, 46, 54, 63, 72, 80, 87, 95],
  Growth:   [8,  14, 18, 25, 32, 38, 45, 52, 60, 67, 75, 82],
  Forecast: [15, 20, 26, 34, 43, 52, 62, 72, 83, 91, 98, 100],
};

const CHART_COLORS: Record<ChartTab, { line: string; rgb: string }> = {
  Revenue:  { line: "#7A5CFF", rgb: "122,92,255"  },
  Profit:   { line: "#10b981", rgb: "16,185,129"  },
  Market:   { line: "#3b82f6", rgb: "59,130,246"  },
  Growth:   { line: "#f59e0b", rgb: "245,158,11"  },
  Forecast: { line: "#a78bfa", rgb: "167,139,250" },
};

// ─── SVG line chart ────────────────────────────────────────────────────────────

function LineChart({ data, color, rgb, height = 160 }: { data: number[]; color: string; rgb: string; height?: number }) {
  const W = 800; const H = height; const PX = 16; const PY = 12;
  const min = 0; const max = 100;
  const pts = data.map((v, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX * 2),
    y: H - PY - ((v - min) / (max - min)) * (H - PY * 2),
  }));
  const line = pts.map((p, i) => {
    if (!i) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2;
    return `C${mx.toFixed(1)},${prev.y.toFixed(1)} ${mx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id={`lc-${rgb}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PX} y1={PY + t*(H-PY*2)} x2={W-PX} y2={PY + t*(H-PY*2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {data.map((_, i) => (
        <text key={i} x={pts[i].x} y={H - 1} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.2)">{months[i % 12]}</text>
      ))}
      <path d={area} fill={`url(#lc-${rgb})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px rgba(${rgb},0.6))` }}/>
      {pts.map((p, i) => (
        i % 3 === 0 || i === pts.length - 1 ? (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3} fill={color} style={{ filter: `drop-shadow(0 0 5px rgba(${rgb},0.8))` }}/>
        ) : null
      ))}
      {/* Forecast label on last point */}
      <text x={pts[pts.length-1].x + 6} y={pts[pts.length-1].y + 4} fontSize="9" fill={color} fontWeight="700">+{data[data.length-1]}</text>
    </svg>
  );
}

// ─── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}90)` }}/>
    </svg>
  );
}

// ─── Animated counter ──────────────────────────────────────────────────────────

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return; done.current = true;
    let cur = 0; const step = to / 40;
    const iv = setInterval(() => { cur += step; if (cur >= to) { setV(to); clearInterval(iv); } else setV(Math.floor(cur)); }, 18);
    return () => clearInterval(iv);
  }, [to]);
  return <>{v}{suffix}</>;
}

// ─── Heatmap cell ──────────────────────────────────────────────────────────────

function heatColor(v: number) {
  if (v >= 90) return { bg: "rgba(16,185,129,0.25)", text: "#10b981" };
  if (v >= 75) return { bg: "rgba(122,92,255,0.2)",  text: "#a78bfa" };
  if (v >= 60) return { bg: "rgba(59,130,246,0.18)",  text: "#60a5fa" };
  return { bg: "rgba(244,63,94,0.15)", text: "#f87171" };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

interface ApiSummary {
  ai_messages?: number;
  total_tokens?: number;
  strategies_generated?: number;
  board_meetings?: number;
  decisions_made?: number;
  active_risks?: number;
  critical_risks?: number;
}

const PERIOD_MAP: Record<Period, string> = {
  "7 дней": "7d", "30 дней": "30d", "3 мес": "90d", "Год": "1y",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30 дней");
  const [chartTab, setChartTab] = useState<ChartTab>("Revenue");
  const [activeRec, setActiveRec] = useState<number | null>(null);
  const [apiData, setApiData] = useState<ApiSummary | null>(null);

  useEffect(() => {
    fetch(`/api/analytics?period=${PERIOD_MAP[period]}`)
      .then(r => r.json())
      .then(j => { if (j.success) setApiData(j.data.summary); })
      .catch(() => {});
  }, [period]);

  const chartColor = CHART_COLORS[chartTab];

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", position: "relative" }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,92,255,0.05) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: "0%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 60%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "24px 28px 48px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>AI Analytics</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "rgba(122,92,255,0.1)", border: "1px solid rgba(122,92,255,0.2)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7A5CFF", boxShadow: "0 0 5px #7A5CFF", animation: "an-pulse 2s ease-in-out infinite", display: "inline-block" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa" }}>AI Score 87</span>
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>Обновлено 5 мин. назад</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>Executive Portfolio Intelligence · 20 AI-агентов</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Period */}
            <div style={{ display: "flex", gap: 2, padding: 3, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: "5px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", background: period === p ? "#7c3aed" : "transparent", color: period === p ? "#fff" : "rgba(255,255,255,0.35)", boxShadow: period === p ? "0 0 12px rgba(124,58,237,0.4)" : "none" }}
                >{p}</button>
              ))}
            </div>
            <button style={{ height: 36, padding: "0 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={12} /> Экспорт
            </button>
            <button style={{ height: 36, padding: "0 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Share2 size={12} /> Поделиться
            </button>
            <Link href="/dashboard/new" style={{ height: 36, padding: "0 16px", borderRadius: 11, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
              <Sparkles size={13} /> AI-анализ
            </Link>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 20, padding: "22px 26px", borderRadius: 22, background: "rgba(122,92,255,0.04)", border: "1px solid rgba(122,92,255,0.14)", backdropFilter: "blur(20px)", position: "relative", overflow: "hidden", display: "flex", gap: 24, alignItems: "flex-start", boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(122,92,255,0.5), rgba(59,130,246,0.3), transparent)" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,92,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Brain size={14} style={{ color: "#7A5CFF" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Executive AI Summary</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 10, letterSpacing: "-0.02em" }}>
              Портфель показывает <span style={{ color: "#10b981" }}>устойчивый рост</span> +24% за квартал
            </h2>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 16 }}>
              AI Executive Board завершил анализ 3 проектов. Суммарный прогноз выручки $4.2M с вероятностью реализации 87%. Обнаружено 4 возможности масштабирования. Требует внимания: Restaurant Chain нуждается в актуализации стратегии.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { icon: TrendingUp,    color: "#10b981", text: "Рост +24% QoQ" },
                { icon: Star,          color: "#f59e0b", text: "Top 8% рынка"  },
                { icon: AlertTriangle, color: "#f59e0b", text: "1 риск обнаружен" },
                { icon: Target,        color: "#3b82f6", text: "4 возможности" },
                { icon: Rocket,        color: "#a78bfa", text: "Готов к Scale" },
              ].map((t, i) => {
                const Icon = t.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Icon size={10} style={{ color: t.color }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{t.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score ring */}
          <div style={{ flexShrink: 0, position: "relative" }}>
            <ScoreRing score={87} color="#7A5CFF" size={88} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#7A5CFF", lineHeight: 1, filter: "drop-shadow(0 0 10px rgba(122,92,255,0.6))" }}><Counter to={87} /></div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Score</div>
            </div>
          </div>
        </motion.div>

        {/* ── Bento KPI Grid ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="an-bento" style={{ display: "grid", gap: 12 }}>
            {/* Large: Revenue */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ gridRow: "1 / 3", padding: "22px", borderRadius: 20, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)" }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DollarSign size={14} style={{ color: "#10b981" }} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Total Revenue Forecast</div>
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#10b981", lineHeight: 1, marginBottom: 6, letterSpacing: "-0.04em", filter: "drop-shadow(0 0 16px rgba(16,185,129,0.4))" }}>$4.2M</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
                {apiData ? `${apiData.strategies_generated ?? 0} стратегий · ${(apiData.total_tokens ?? 0).toLocaleString()} токенов` : "Суммарный прогноз всех проектов"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={11} style={{ color: "#10b981" }} />
                  <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>+24% vs Q1</span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Prob 87%</span>
              </div>
              {/* Mini bar chart */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginTop: 20, height: 48 }}>
                {[35, 45, 40, 58, 52, 68, 62, 75, 72, 85, 88, 92].map((v, i) => (
                  <div key={i} style={{ flex: 1, background: `rgba(16,185,129,${i === 11 ? 0.8 : 0.2 + i * 0.04})`, borderRadius: 3, height: `${v}%`, transition: "height 0.4s ease" }} />
                ))}
              </div>
            </motion.div>

            {/* MRR */}
            {[
              { label: "MRR",        value: "$348K", sub: "+8.2% мес",   color: "#7A5CFF", rgb: "122,92,255", icon: BarChart2,  to: 348 },
              { label: "ARR",        value: "$4.2M", sub: "Годовой прог", color: "#3b82f6", rgb: "59,130,246", icon: TrendingUp, to: 42 },
              { label: "Burn Rate",  value: "$73K",  sub: "В месяц",     color: "#f59e0b", rgb: "245,158,11", icon: Activity,   to: 73 },
              { label: "Runway",     value: "14 мес",sub: "До раунда",   color: "#10b981", rgb: "16,185,129", icon: Clock,      to: 14 },
              { label: "AI Score",   value: "87",    sub: "Top 8%",      color: "#a78bfa", rgb: "167,139,250",icon: Cpu,        to: 87 },
              { label: "ROI",        value: "340%",  sub: "Средний",     color: "#f43f5e", rgb: "244,63,94",  icon: Target,     to: 340 },
              { label: "Проекты",    value: "3",     sub: "Активных",    color: "#34d399", rgb: "52,211,153", icon: Layers,     to: 3 },
              { label: "Confidence", value: "94%",   sub: "AI точность", color: "#7A5CFF", rgb: "122,92,255", icon: Star,       to: 94 },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 + i * 0.04 }}
                  style={{ padding: "16px", borderRadius: 18, background: `rgba(${k.rgb},0.04)`, border: `1px solid rgba(${k.rgb},0.12)`, position: "relative", overflow: "hidden" }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${k.rgb},0.5), transparent)` }} />
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `rgba(${k.rgb},0.1)`, border: `1px solid rgba(${k.rgb},0.18)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Icon size={12} style={{ color: k.color }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1, marginBottom: 4, filter: `drop-shadow(0 0 6px rgba(${k.rgb},0.4))` }}>{k.value}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{k.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Growth Chart + AI Insights ── */}
        <div className="an-main" style={{ display: "grid", gap: 16, marginBottom: 16 }}>
          {/* Growth chart */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ padding: "22px 24px", borderRadius: 22, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${chartColor.rgb},0.5), transparent)` }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, rgba(${chartColor.rgb},0.06) 0%, transparent 70%)`, pointerEvents: "none", transition: "all 0.6s" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Growth Analytics</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Динамика <span style={{ color: chartColor.line }}>{chartTab}</span></div>
              </div>
              {/* Tab switcher */}
              <div style={{ display: "flex", gap: 4 }}>
                {CHART_TABS.map(tab => (
                  <button key={tab} onClick={() => setChartTab(tab)}
                    style={{ padding: "5px 12px", borderRadius: 9, fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", background: chartTab === tab ? `rgba(${CHART_COLORS[tab].rgb},0.15)` : "rgba(255,255,255,0.04)", color: chartTab === tab ? CHART_COLORS[tab].line : "rgba(255,255,255,0.3)", borderWidth: 1, borderStyle: "solid", borderColor: chartTab === tab ? `rgba(${CHART_COLORS[tab].rgb},0.3)` : "rgba(255,255,255,0.06)" }}
                  >{tab}</button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={chartTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <LineChart data={CHART_DATA[chartTab]} color={chartColor.line} rgb={chartColor.rgb} height={170} />
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>12 месяцев назад</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>Сейчас</span>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ padding: "20px", borderRadius: 22, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Sparkles size={13} style={{ color: "#7A5CFF" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.14em" }}>AI Insights</span>
            </div>
            {[
              { icon: TrendingUp,     color: "#10b981", rgb: "16,185,129",  title: "SaaS Invoice лидирует", body: "LTV/CAC = 4.2x — лучший в портфеле. Инвест. в SEO даст +30% снижение CAC." },
              { icon: AlertTriangle,  color: "#f59e0b", rgb: "245,158,11",  title: "Требует внимания",       body: "Restaurant Chain: последний анализ 7 дней назад. Рынок изменился." },
              { icon: Target,         color: "#3b82f6", rgb: "59,130,246",  title: "Новый рынок открыт",     body: "EU экспансия: GDPR-готовность 94%. Потенциал $1.8M ARR." },
              { icon: Lightbulb,      color: "#a78bfa", rgb: "167,139,250", title: "Возможность Premium",    body: "AI Fitness: 28% пользователей готовы к $69/мес тарифу." },
            ].map((ins, i) => {
              const Icon = ins.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                  style={{ padding: "12px 14px", borderRadius: 14, background: `rgba(${ins.rgb},0.04)`, border: `1px solid rgba(${ins.rgb},0.13)` }}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `rgba(${ins.rgb},0.1)`, border: `1px solid rgba(${ins.rgb},0.18)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={11} style={{ color: ins.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.78)", marginBottom: 3 }}>{ins.title}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", lineHeight: 1.5 }}>{ins.body}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── Heatmap + Project Table ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Heatmap */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            style={{ padding: "20px 22px", borderRadius: 22, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Efficiency Heatmap</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Эффективность по направлениям</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {HEATMAP_DATA.map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", width: 76, flexShrink: 0 }}>{row.label}</span>
                  <div style={{ display: "flex", gap: 4, flex: 1 }}>
                    {row.vals.map((v, i) => {
                      const hc = heatColor(v);
                      return (
                        <div key={i} title={`${v}`} style={{ flex: 1, height: 28, borderRadius: 6, background: hc.bg, border: `1px solid ${hc.text}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: hc.text }}>
                          {v}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", width: 76 }}>День</span>
                <div style={{ display: "flex", gap: 4, flex: 1 }}>
                  {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => (
                    <div key={d} style={{ flex: 1, fontSize: 8, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>{d}</div>
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {[{ color: "#f87171", label: "<60" }, { color: "#60a5fa", label: "60–74" }, { color: "#a78bfa", label: "75–89" }, { color: "#10b981", label: "90+" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, opacity: 0.5 }} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Project table */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ padding: "20px 22px", borderRadius: 22, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Project Comparison</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Сравнение проектов</div>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 56px 64px 64px", gap: 8, padding: "0 0 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
              {["Проект","Score","ROI","Рост","Риск","Потенциал"].map(h => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
              ))}
            </div>
            {PROJECTS_TABLE.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 56px 64px 64px", gap: 8, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name.split(" ").slice(0, 2).join(" ")}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.score >= 85 ? "#10b981" : "#f59e0b" }}>{p.score}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>{p.roi}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa" }}>{p.growth}</div>
                <div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                    background: p.risk === "Низкий" || p.risk === "Мин." ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                    color: p.risk === "Низкий" || p.risk === "Мин." ? "#10b981" : "#f59e0b",
                    border: `1px solid ${p.risk === "Низкий" || p.risk === "Мин." ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}>{p.risk}</span>
                </div>
                <div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                    background: p.potential === "Высокий" ? "rgba(122,92,255,0.1)" : "rgba(255,255,255,0.05)",
                    color: p.potential === "Высокий" ? "#a78bfa" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${p.potential === "Высокий" ? "rgba(122,92,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}>{p.potential}</span>
                </div>
              </motion.div>
            ))}
            <button style={{ marginTop: 14, width: "100%", height: 34, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <BarChart2 size={11} /> Сравнить проекты
            </button>
          </motion.div>
        </div>

        {/* ── AI Recommendations ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Executive Board</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>AI Recommendations</div>
            </div>
            <button style={{ height: 32, padding: "0 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={11} /> Обновить
            </button>
          </div>
          <div className="an-recs" style={{ display: "grid", gap: 12 }}>
            {AI_RECS.map((rec, i) => {
              const Icon = rec.icon;
              const isActive = activeRec === i;
              return (
                <motion.div key={i} whileHover={{ y: -3 }}
                  onClick={() => setActiveRec(isActive ? null : i)}
                  style={{ padding: "18px 18px 14px", borderRadius: 20, background: isActive ? `rgba(${rec.rgb},0.07)` : "rgba(255,255,255,0.025)", border: `1px solid ${isActive ? `rgba(${rec.rgb},0.28)` : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "border-color 0.2s, background 0.2s", position: "relative", overflow: "hidden", boxShadow: isActive ? `0 8px 32px rgba(${rec.rgb},0.12)` : "none" }}
                >
                  {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${rec.rgb},0.6), transparent)` }} />}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `rgba(${rec.rgb},0.1)`, border: `1px solid rgba(${rec.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={15} style={{ color: rec.color }} />
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 800, padding: "3px 7px", borderRadius: 6,
                      background: rec.priority === "High" ? "rgba(244,63,94,0.1)" : "rgba(245,158,11,0.1)",
                      color: rec.priority === "High" ? "#f43f5e" : "#f59e0b",
                      border: `1px solid ${rec.priority === "High" ? "rgba(244,63,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}>{rec.priority}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 6, lineHeight: 1.35 }}>{rec.title}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.55, marginBottom: 14 }}>{rec.desc}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                    {[
                      { label: "ROI",    value: rec.roi,        color: "#10b981" },
                      { label: "Time",   value: rec.time,       color: "rgba(255,255,255,0.5)" },
                      { label: "Impact", value: rec.impact,     color: rec.color },
                      { label: "Сложность",value: rec.difficulty, color: "rgba(255,255,255,0.5)" },
                    ].map(m => (
                      <div key={m.label} style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.22)", marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: "100%", height: 32, borderRadius: 9, background: `rgba(${rec.rgb},0.12)`, border: `1px solid rgba(${rec.rgb},0.22)`, fontSize: 10, fontWeight: 700, color: rec.color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Zap size={10} /> Применить рекомендацию
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Forecast + Timeline + Widgets ── */}
        <div className="an-bottom" style={{ display: "grid", gap: 16 }}>

          {/* AI Forecast */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            style={{ padding: "20px 22px", borderRadius: 22, background: "rgba(122,92,255,0.04)", border: "1px solid rgba(122,92,255,0.12)", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(122,92,255,0.5), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <Brain size={13} style={{ color: "#7A5CFF" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em" }}>AI Forecast</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Прогноз 3 месяца", value: "$1.4M",  color: "#7A5CFF", prob: 91 },
                { label: "Прогноз 6 месяцев",value: "$2.8M",  color: "#5A8DFF", prob: 84 },
                { label: "Ожидаемая прибыль", value: "$620K", color: "#10b981", prob: 78 },
                { label: "Достижение цели",   value: "87%",   color: "#f59e0b", prob: 87 },
              ].map(f => (
                <div key={f.label} style={{ padding: "12px 14px", borderRadius: 13, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: f.color }}>{f.value}</span>
                  </div>
                  <div style={{ height: 2, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${f.prob}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                      style={{ height: "100%", borderRadius: 2, background: f.color, boxShadow: `0 0 6px ${f.color}60` }} />
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>Вероятность {f.prob}%</div>
                </div>
              ))}
            </div>
            <button style={{ marginTop: 14, width: "100%", height: 34, borderRadius: 11, background: "rgba(122,92,255,0.1)", border: "1px solid rgba(122,92,255,0.2)", fontSize: 11, fontWeight: 600, color: "#a78bfa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Rocket size={11} /> Запустить прогноз
            </button>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ padding: "20px 22px", borderRadius: 22, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <Activity size={13} style={{ color: "#3b82f6" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Activity Timeline</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {TIMELINE_EVENTS.map((ev, i) => {
                const Icon = ev.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                    style={{ display: "flex", gap: 12, position: "relative", paddingBottom: i < TIMELINE_EVENTS.length - 1 ? 14 : 0 }}
                  >
                    {i < TIMELINE_EVENTS.length - 1 && (
                      <div style={{ position: "absolute", left: 12, top: 26, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                    )}
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: `rgba(${ev.rgb},0.1)`, border: `1px solid rgba(${ev.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={11} style={{ color: ev.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.72)", marginBottom: 2 }}>{ev.title}</div>
                      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.25)" }}>{ev.desc}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 3 }}>{ev.time} назад</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Smart Widgets */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            style={{ padding: "20px 22px", borderRadius: 22, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
              <Cpu size={13} style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Smart Widgets</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SMART_WIDGETS.map((w, i) => {
                const Icon = w.icon;
                return (
                  <motion.div key={w.label} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.42 + i * 0.06 }}
                    style={{ padding: "12px", borderRadius: 14, background: `rgba(${w.rgb},0.04)`, border: `1px solid rgba(${w.rgb},0.12)`, cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Icon size={11} style={{ color: w.color }} />
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{w.label}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: w.color, marginBottom: 2 }}>{w.value}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{w.sub}</div>
                  </motion.div>
                );
              })}
            </div>
            {/* Quick actions */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Найти точки роста", icon: Target, color: "#7A5CFF", rgb: "122,92,255" },
                { label: "Оптимизировать бизнес", icon: Zap, color: "#10b981", rgb: "16,185,129" },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.label} style={{ height: 34, borderRadius: 10, background: `rgba(${a.rgb},0.08)`, border: `1px solid rgba(${a.rgb},0.18)`, fontSize: 11, fontWeight: 600, color: a.color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Icon size={11} /> {a.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

      </div>

      <style>{`
        @keyframes an-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .an-main { grid-template-columns: 1fr 340px; }
        .an-bottom { grid-template-columns: 1fr 1fr 1fr; }
        .an-bento { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; grid-template-rows: auto auto; }
        .an-recs { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 1100px) {
          .an-main { grid-template-columns: 1fr !important; }
          .an-bottom { grid-template-columns: 1fr 1fr !important; }
          .an-bento { grid-template-columns: 1fr 1fr 1fr !important; grid-template-rows: unset !important; }
          .an-bento > *:first-child { grid-row: unset !important; }
          .an-recs { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .an-bottom { grid-template-columns: 1fr !important; }
          .an-bento { grid-template-columns: 1fr 1fr !important; }
          .an-recs { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
