"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Globe, Target, Zap, ArrowUpRight, ArrowDownRight,
  Users, ShoppingCart, Star, BarChart2, RefreshCw, Download,
  ChevronRight, Flame, Layers, Activity,
} from "lucide-react";

const PERIODS = ["7д", "30д", "90д", "1г", "Всё"];

const MARKETS = [
  { name: "Северная Америка", share: 38, growth: "+18%", revenue: "$2.4M", color: "#7A5CFF", rgb: "122,92,255" },
  { name: "Европа",           share: 27, growth: "+24%", revenue: "$1.7M", color: "#5A8DFF", rgb: "90,141,255" },
  { name: "Азия–Пасифик",    share: 21, growth: "+41%", revenue: "$1.3M", color: "#00E7A7", rgb: "0,231,167" },
  { name: "Латинская Америка",share: 9,  growth: "+67%", revenue: "$0.6M", color: "#FFB800", rgb: "255,184,0" },
  { name: "Остальные",        share: 5,  growth: "+12%", revenue: "$0.3M", color: "#FF5470", rgb: "255,84,112" },
];

const CHANNELS = [
  { name: "Органический SEO", leads: 4820, conv: "3.2%", cac: "$48",  color: "#7A5CFF", trend: +22 },
  { name: "Реферальная программа", leads: 3140, conv: "5.8%", cac: "$21", color: "#00E7A7", trend: +38 },
  { name: "Платная реклама",  leads: 2890, conv: "2.1%", cac: "$94",  color: "#5A8DFF", trend: -8  },
  { name: "Email-кампании",   leads: 2010, conv: "4.4%", cac: "$32",  color: "#FFB800", trend: +14 },
  { name: "Партнёрства",      leads: 1560, conv: "6.9%", cac: "$17",  color: "#FF5470", trend: +51 },
  { name: "Контент-маркетинг",leads: 980,  conv: "2.7%", cac: "$61",  color: "#a78bfa", trend: +9  },
];

const OPPORTUNITIES = [
  { id: 1, title: "Выход на рынок SEA", tam: "$840M", prob: 78, effort: "Средний", impact: "Высокий", color: "#7A5CFF", icon: Globe },
  { id: 2, title: "Корпоративный сегмент B2B", tam: "$2.1B", prob: 62, effort: "Высокий", impact: "Критичный", color: "#00E7A7", icon: Layers },
  { id: 3, title: "Мобильное приложение", tam: "$310M", prob: 91, effort: "Низкий", impact: "Средний", color: "#5A8DFF", icon: Zap },
  { id: 4, title: "White-label решение", tam: "$680M", prob: 55, effort: "Высокий", impact: "Высокий", color: "#FFB800", icon: Star },
];

const GROWTH_CHART = [
  [120,145,138,162,178,195,210,228,245,268,291,320],
  [88, 95, 110,124,138,149,165,178,191,205,219,240],
];

function GrowthChart({ data }: { data: number[][] }) {
  const W = 580, H = 180;
  const max = Math.max(...data.flat());
  const pts = (arr: number[]) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * W},${H - (v / max) * H * 0.85}`).join(" ");
  const area = (arr: number[]) => {
    const p = arr.map((v, i) => `${(i / (arr.length - 1)) * W},${H - (v / max) * H * 0.85}`);
    return `M${p[0]} L${p.join(" L")} L${W},${H} L0,${H} Z`;
  };
  const colors = ["#7A5CFF", "#00E7A7"];
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        {colors.map((c, i) => (
          <linearGradient key={i} id={`gc${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.25" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0,0.25,0.5,0.75,1].map((t,i)=>(
        <line key={i} x1={0} y1={H*t} x2={W} y2={H*t} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
      ))}
      {data.map((arr, i) => (
        <g key={i}>
          <path d={area(arr)} fill={`url(#gc${i})`} />
          <polyline points={pts(arr)} fill="none" stroke={colors[i]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {arr.map((v, j) => (
            j === arr.length - 1 ? (
              <circle key={j} cx={(j/(arr.length-1))*W} cy={H-(v/max)*H*0.85} r={4} fill={colors[i]} style={{ filter: `drop-shadow(0 0 6px ${colors[i]})` }} />
            ) : null
          ))}
        </g>
      ))}
      {months.map((m, i) => (
        <text key={i} x={(i/(months.length-1))*W} y={H+18} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize={9}>{m}</text>
      ))}
    </svg>
  );
}

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let start = 0;
    const step = to / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

export default function GrowthPage() {
  const [period, setPeriod] = useState("30д");
  const [activeOpp, setActiveOpp] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", padding: "28px 28px 60px", position: "relative", overflow: "hidden" }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: -200, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,231,167,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, left: 100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,92,255,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #00E7A7, #5A8DFF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Рост & Рынок</h1>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>AI-анализ рыночных возможностей и каналов роста</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: period === p ? "rgba(0,231,167,0.15)" : "transparent", color: period === p ? "#00E7A7" : "rgba(255,255,255,0.35)", transition: "all 0.2s" }}>{p}</button>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <Download size={12} />Экспорт
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #00E7A7, #5A8DFF)", color: "#07090F", cursor: "pointer" }}>
            <Zap size={12} />AI Стратегия
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Общий рост MoM", value: 24, suffix: "%", icon: TrendingUp, color: "#00E7A7", delta: "+4.2% vs пр. мес." },
          { label: "Новые рынки",    value: 7,  suffix: "",  icon: Globe,      color: "#7A5CFF", delta: "3 активных" },
          { label: "Потенц. лиды",   value: 15410, suffix: "", icon: Users,    color: "#5A8DFF", delta: "+18% vs пр. мес." },
          { label: "Рын. охват",     value: 38, suffix: "%", icon: Target,     color: "#FFB800", delta: "↑ с 31% год назад" },
          { label: "NPS Score",      value: 72, suffix: "",  icon: Star,       color: "#FF5470", delta: "Отлично · Top 15%" },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ borderRadius: 16, padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${k.color}60, transparent)` }} />
            <k.icon size={14} style={{ color: k.color, marginBottom: 10 }} />
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
              <Counter to={k.value} suffix={k.suffix} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: k.color, fontWeight: 600 }}>{k.delta}</div>
          </motion.div>
        ))}
      </div>

      {/* Growth Chart + Market Share */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00E7A780, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Динамика роста</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Выручка vs Лиды (12 мес.)</div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ label: "Выручка", color: "#7A5CFF" }, { label: "Лиды", color: "#00E7A7" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 20, height: 2, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <GrowthChart data={GROWTH_CHART} />
        </motion.div>

        {/* Market Share */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7A5CFF80, transparent)" }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Рыночные сегменты</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Доля и рост по регионам</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MARKETS.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{m.name}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 11, color: m.color, fontWeight: 700 }}>{m.growth}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{m.revenue}</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.share}%` }} transition={{ delay: 0.4 + i * 0.06, duration: 0.8 }}
                    style={{ height: "100%", borderRadius: 4, background: m.color, boxShadow: `0 0 8px ${m.color}60` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Channels + Opportunities */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Acquisition Channels */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #5A8DFF80, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Каналы привлечения</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Лиды, конверсия и CAC</div>
            </div>
            <Activity size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CHANNELS.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, boxShadow: `0 0 6px ${c.color}`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Conv: {c.conv}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>CAC: {c.cac}</span>
                      {c.trend > 0
                        ? <span style={{ fontSize: 10, color: "#00E7A7", fontWeight: 700 }}>+{c.trend}%</span>
                        : <span style={{ fontSize: 10, color: "#FF5470", fontWeight: 700 }}>{c.trend}%</span>}
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(c.leads / 5000) * 100}%` }} transition={{ delay: 0.5 + i * 0.05, duration: 0.7 }}
                      style={{ height: "100%", borderRadius: 3, background: c.color, opacity: 0.8 }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, width: 44, textAlign: "right" }}>{c.leads.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Growth Opportunities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #FFB80080, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Возможности роста</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>AI-идентифицированные ниши</div>
            </div>
            <Flame size={14} style={{ color: "#FFB800" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OPPORTUNITIES.map((o, i) => (
              <motion.div key={o.id} onClick={() => setActiveOpp(activeOpp === o.id ? null : o.id)}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.07 }}
                style={{ borderRadius: 12, padding: "12px 14px", background: activeOpp === o.id ? `rgba(${o.color === "#7A5CFF" ? "122,92,255" : o.color === "#00E7A7" ? "0,231,167" : o.color === "#5A8DFF" ? "90,141,255" : "255,184,0"},0.12)` : "rgba(255,255,255,0.03)", border: `1px solid ${activeOpp === o.id ? o.color + "50" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${o.color}18`, border: `1px solid ${o.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <o.icon size={14} style={{ color: o.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{o.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>TAM: {o.tam}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: o.color }}>{o.prob}%</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>вероятность</div>
                  </div>
                </div>
                <AnimatePresence>
                  {activeOpp === o.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>Усилие: {o.effort}</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${o.color}18`, color: o.color, fontWeight: 700 }}>Импакт: {o.impact}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Growth Forecast */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ borderRadius: 18, padding: "22px 28px", background: "rgba(0,231,167,0.04)", border: "1px solid rgba(0,231,167,0.12)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00E7A780, transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,231,167,0.12)", border: "1px solid rgba(0,231,167,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={18} style={{ color: "#00E7A7" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>AI Прогноз роста</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>При текущих темпах и запуске 2 новых каналов: <span style={{ color: "#00E7A7", fontWeight: 700 }}>+68% выручки за 6 месяцев</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "3 мес.", val: "+31%", color: "#5A8DFF" },
              { label: "6 мес.", val: "+68%", color: "#00E7A7" },
              { label: "12 мес.", val: "+142%", color: "#7A5CFF" },
            ].map(f => (
              <div key={f.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: f.color }}>{f.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{f.label}</div>
              </div>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #00E7A7, #5A8DFF)", color: "#07090F", cursor: "pointer" }}>
            Запустить стратегию <ArrowUpRight size={13} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
