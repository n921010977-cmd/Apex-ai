"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Globe, Target, Zap, ArrowUpRight,
  Users, Star, BarChart2, Download,
  Flame, Layers, Activity, X, Loader2,
} from "lucide-react";

const PERIODS = ["7д", "30д", "90д", "1г", "Всё"];

const MARKETS = [
  { name: "Северная Америка", share: 38, growth: "+18%", revenue: "$2.4M", color: "#6366f1" },
  { name: "Европа",           share: 27, growth: "+24%", revenue: "$1.7M", color: "#3b82f6" },
  { name: "Азия–Пасифик",    share: 21, growth: "+41%", revenue: "$1.3M", color: "#10b981" },
  { name: "Латинская Америка",share: 9,  growth: "+67%", revenue: "$0.6M", color: "#f59e0b" },
  { name: "Остальные",        share: 5,  growth: "+12%", revenue: "$0.3M", color: "#f43f5e" },
];

const CHANNELS = [
  { name: "Органический SEO", leads: 4820, conv: "3.2%", cac: "$48",  color: "#6366f1", trend: +22 },
  { name: "Реферальная программа", leads: 3140, conv: "5.8%", cac: "$21", color: "#10b981", trend: +38 },
  { name: "Платная реклама",  leads: 2890, conv: "2.1%", cac: "$94",  color: "#3b82f6", trend: -8  },
  { name: "Email-кампании",   leads: 2010, conv: "4.4%", cac: "$32",  color: "#f59e0b", trend: +14 },
  { name: "Партнёрства",      leads: 1560, conv: "6.9%", cac: "$17",  color: "#f43f5e", trend: +51 },
  { name: "Контент-маркетинг",leads: 980,  conv: "2.7%", cac: "$61",  color: "#a78bfa", trend: +9  },
];

const OPPORTUNITIES = [
  { id: 1, title: "Выход на рынок SEA", tam: "$840M", prob: 78, effort: "Средний", impact: "Высокий", color: "#6366f1", icon: Globe },
  { id: 2, title: "Корпоративный сегмент B2B", tam: "$2.1B", prob: 62, effort: "Высокий", impact: "Критичный", color: "#10b981", icon: Layers },
  { id: 3, title: "Мобильное приложение", tam: "$310M", prob: 91, effort: "Низкий", impact: "Средний", color: "#3b82f6", icon: Zap },
  { id: 4, title: "White-label решение", tam: "$680M", prob: 55, effort: "Высокий", impact: "Высокий", color: "#f59e0b", icon: Star },
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
  const colors = ["#6366f1", "#10b981"];
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

interface AIResult {
  summary?: string;
  tam?: { size?: string; sam?: string; som?: string; growth_rate?: string };
  swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
  growth_channels?: { channel?: string; potential?: string; strategy?: string }[];
  recommendations?: { priority?: number; action?: string; impact?: string; timeline?: string }[];
  north_star_metric?: string;
}

function AIModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ company: "", industry: "", market: "", stage: "seed", revenue: "", goals: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.company.trim() || !form.industry.trim()) {
      setError("Заполните название компании и отрасль");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Ошибка AI");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ position: "relative", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", borderRadius: 20, background: "#0e101a", border: "1px solid rgba(99,102,241,0.2)", padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>AI Стратегия роста</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Анализ Anthropic Claude</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { key: "company", label: "Название компании *", placeholder: "Apex AI" },
              { key: "industry", label: "Отрасль *", placeholder: "SaaS / AI / FinTech" },
              { key: "market", label: "Целевой рынок", placeholder: "Россия, СНГ, Европа" },
              { key: "revenue", label: "Текущая выручка", placeholder: "$500K ARR" },
              { key: "goals", label: "Цели роста", placeholder: "x3 за 12 месяцев" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", height: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Стадия</label>
              <select
                value={form.stage}
                onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                style={{ width: "100%", height: 40, background: "#1a1d2e", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box" }}>
                {["pre-seed","seed","series-a","series-b","growth","enterprise"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {error && <div style={{ fontSize: 12, color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
            <button
              onClick={submit}
              disabled={loading}
              style={{ height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #3b82f6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
              {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Анализирую…</> : <><Zap size={14} />Сгенерировать стратегию</>}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ borderRadius: 12, padding: "16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Резюме</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{result.summary}</div>
            </div>
            {result.tam && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 10 }}>📊 Рынок (TAM/SAM/SOM)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["TAM", result.tam.size], ["SAM", result.tam.sam], ["SOM", result.tam.som], ["CAGR", result.tam.growth_rate]].map(([k, v]) => (
                    <div key={k} style={{ borderRadius: 10, padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 10 }}>🎯 Рекомендации</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.recommendations.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{r.action}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.impact} · {r.timeline}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.north_star_metric && (
              <div style={{ borderRadius: 12, padding: "14px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                <Star size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>North Star Metric</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{result.north_star_metric}</div>
                </div>
              </div>
            )}
            <button onClick={() => setResult(null)} style={{ height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Новый анализ
            </button>
          </div>
        )}
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GrowthPage() {
  const [period, setPeriod] = useState("30д");
  const [activeOpp, setActiveOpp] = useState<number | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", padding: "28px 28px 60px", position: "relative", overflow: "hidden" }}>
      <style>{`
        .grow-kpi { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12; margin-bottom: 24px; }
        .grow-chart-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 20px; }
        .grow-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .grow-header-btns { display: flex; align-items: center; gap: 8px; }
        @media (max-width: 1100px) {
          .grow-chart-row { grid-template-columns: 1fr; }
          .grow-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .grow-kpi { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .grow-kpi { grid-template-columns: repeat(2, 1fr) !important; }
          .grow-header-btns .hide-sm { display: none !important; }
        }
        @media (max-width: 480px) {
          .grow-kpi { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ position: "fixed", top: -200, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, left: 100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Рост & Рынок</h1>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>AI-анализ рыночных возможностей и каналов роста</p>
        </div>
        <div className="grow-header-btns">
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }} className="hide-sm">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: period === p ? "rgba(99,102,241,0.2)" : "transparent", color: period === p ? "#818cf8" : "rgba(255,255,255,0.35)", transition: "all 0.2s" }}>{p}</button>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", whiteSpace: "nowrap" }} className="hide-sm">
            <Download size={12} />Экспорт
          </button>
          <button onClick={() => setAiOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #3b82f6)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
            <Zap size={12} />AI Стратегия
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grow-kpi" style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Общий рост MoM", value: 24, suffix: "%", icon: TrendingUp, color: "#10b981", delta: "+4.2% vs пр. мес." },
          { label: "Новые рынки",    value: 7,  suffix: "",  icon: Globe,      color: "#6366f1", delta: "3 активных" },
          { label: "Потенц. лиды",   value: 15410, suffix: "", icon: Users,    color: "#3b82f6", delta: "+18% vs пр. мес." },
          { label: "Рын. охват",     value: 38, suffix: "%", icon: Target,     color: "#f59e0b", delta: "↑ с 31% год назад" },
          { label: "NPS Score",      value: 72, suffix: "",  icon: Star,       color: "#f43f5e", delta: "Отлично · Top 15%" },
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
      <div className="grow-chart-row">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #6366f180, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Динамика роста</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Выручка vs Лиды (12 мес.)</div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ label: "Выручка", color: "#6366f1" }, { label: "Лиды", color: "#10b981" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 20, height: 2, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <GrowthChart data={GROWTH_CHART} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #6366f180, transparent)" }} />
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
      <div className="grow-bottom">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #3b82f680, transparent)" }} />
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>CAC: {c.cac}</span>
                      {c.trend > 0
                        ? <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>+{c.trend}%</span>
                        : <span style={{ fontSize: 10, color: "#f43f5e", fontWeight: 700 }}>{c.trend}%</span>}
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f59e0b80, transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Возможности роста</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>AI-идентифицированные ниши</div>
            </div>
            <Flame size={14} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OPPORTUNITIES.map((o, i) => (
              <motion.div key={o.id} onClick={() => setActiveOpp(activeOpp === o.id ? null : o.id)}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.07 }}
                style={{ borderRadius: 12, padding: "12px 14px", background: activeOpp === o.id ? `${o.color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${activeOpp === o.id ? o.color + "50" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "all 0.2s" }}>
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
        style={{ borderRadius: 18, padding: "22px 28px", background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #6366f180, transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BarChart2 size={18} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>AI Прогноз роста</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>При запуске 2 новых каналов: <span style={{ color: "#818cf8", fontWeight: 700 }}>+68% выручки за 6 месяцев</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "3 мес.", val: "+31%", color: "#3b82f6" },
              { label: "6 мес.", val: "+68%", color: "#6366f1" },
              { label: "12 мес.", val: "+142%", color: "#818cf8" },
            ].map(f => (
              <div key={f.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: f.color }}>{f.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{f.label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setAiOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #3b82f6)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
            Запустить стратегию <ArrowUpRight size={13} />
          </button>
        </div>
      </motion.div>

      <AIModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
