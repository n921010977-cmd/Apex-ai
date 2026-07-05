"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  TrendingUp, Globe, Target, Zap, Star, BarChart2, Download,
  Flame, Layers, Activity, X, Loader2, ArrowUpRight, Users, Plus,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const S = {
  bg: "#05060A",
  surface: "rgba(255,255,255,0.03)",
  hairline: "rgba(255,255,255,0.07)",
  hairlineHover: "rgba(255,255,255,0.13)",
  textPrimary: "#E5E7EB",
  textSecondary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.3)",
  accent: "#6366f1",
  accentHover: "#4f46e5",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  shadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)",
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const PERIODS = ["7д", "30д", "90д", "1г"];

const MARKETS = [
  { name: "Северная Америка", share: 38, growth: "+18%", revenue: "$2.4M" },
  { name: "Европа",           share: 27, growth: "+24%", revenue: "$1.7M" },
  { name: "Азия–Пасифик",    share: 21, growth: "+41%", revenue: "$1.3M" },
  { name: "Латинская Америка",share: 9,  growth: "+67%", revenue: "$0.6M" },
  { name: "Остальные",        share: 5,  growth: "+12%", revenue: "$0.3M" },
];

const CHANNELS = [
  { name: "Органический SEO",   leads: 4820, conv: "3.2%", cac: "$48",  trend: +22 },
  { name: "Реферальная прогр.", leads: 3140, conv: "5.8%", cac: "$21",  trend: +38 },
  { name: "Платная реклама",    leads: 2890, conv: "2.1%", cac: "$94",  trend: -8  },
  { name: "Email-кампании",     leads: 2010, conv: "4.4%", cac: "$32",  trend: +14 },
  { name: "Партнёрства",        leads: 1560, conv: "6.9%", cac: "$17",  trend: +51 },
  { name: "Контент",            leads: 980,  conv: "2.7%", cac: "$61",  trend: +9  },
];

const OPPORTUNITIES = [
  { id: 1, title: "Выход на рынок SEA",       tam: "$840M",  prob: 78, effort: "Средний", impact: "Высокий"  },
  { id: 2, title: "Корп. сегмент B2B",        tam: "$2.1B",  prob: 62, effort: "Высокий", impact: "Критичный"},
  { id: 3, title: "Мобильное приложение",      tam: "$310M",  prob: 91, effort: "Низкий",  impact: "Средний"  },
  { id: 4, title: "White-label решение",       tam: "$680M",  prob: 55, effort: "Высокий", impact: "Высокий"  },
];

// Revenue series (monthly, thousands)
const REVENUE = [120,145,138,162,178,195,210,228,245,268,291,320];
const LEADS   = [88, 95, 110,124,138,149,165,178,191,205,219,240];
const MONTHS  = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(to: number, active = true) {
  const [val, setVal] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const dur = 1100;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [to, active]);
  return val;
}

// ─── SVG Area Chart ─────────────────────────────────────────────────────────────
function AreaChart() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const W = 600, H = 200, PX = 12, PY = 16;

  const toPoints = (arr: number[]) => {
    const max = Math.max(...arr) * 1.1;
    return arr.map((v, i) => ({
      x: PX + (i / (arr.length - 1)) * (W - PX * 2),
      y: PY + (1 - v / max) * (H - PY * 2),
    }));
  };

  const cubicPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const mx = (prev.x + p.x) / 2;
      return `C${mx.toFixed(1)},${prev.y.toFixed(1)} ${mx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const areaPath = (pts: { x: number; y: number }[], linePath: string) =>
    `${linePath} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  const rPts = toPoints(REVENUE);
  const lPts = toPoints(LEADS);
  const rLine = cubicPath(rPts);
  const lLine = cubicPath(lPts);

  // Measure path length for draw-in animation
  const rRef = useRef<SVGPathElement>(null);
  const lRef = useRef<SVGPathElement>(null);
  const [lengths, setLengths] = useState({ r: 1200, l: 1100 });
  useEffect(() => {
    if (rRef.current && lRef.current) {
      setLengths({ r: rRef.current.getTotalLength(), l: lRef.current.getTotalLength() });
    }
  }, []);

  const gridYs = [0.25, 0.5, 0.75, 1].map(t => PY + t * (H - PY * 2));

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id="gr-rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gr-leads" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridYs.map((y, i) => (
        <line key={i} x1={PX} y1={y} x2={W - PX} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}

      {/* Areas */}
      <path d={areaPath(rPts, rLine)} fill="url(#gr-rev)" />
      <path d={areaPath(lPts, lLine)} fill="url(#gr-leads)" />

      {/* Lines — animated draw-in */}
      <path ref={rRef} d={rLine} fill="none" stroke="#6366f1" strokeWidth={2}
        strokeDasharray={lengths.r}
        strokeDashoffset={inView ? 0 : lengths.r}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
        strokeLinecap="round" />
      <path ref={lRef} d={lLine} fill="none" stroke="#10b981" strokeWidth={2}
        strokeDasharray={lengths.l}
        strokeDashoffset={inView ? 0 : lengths.l}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) 0.15s" }}
        strokeLinecap="round" />

      {/* End-point dots */}
      {inView && (
        <>
          <circle cx={rPts[rPts.length-1].x} cy={rPts[rPts.length-1].y} r={4} fill="#6366f1" style={{ filter: "drop-shadow(0 0 4px #6366f1)" }} />
          <circle cx={lPts[lPts.length-1].x} cy={lPts[lPts.length-1].y} r={4} fill="#10b981" style={{ filter: "drop-shadow(0 0 4px #10b981)" }} />
        </>
      )}

      {/* Month labels */}
      {MONTHS.map((m, i) => (
        <text key={i} x={PX + (i / (MONTHS.length - 1)) * (W - PX * 2)} y={H + 18}
          textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="system-ui">{m}</text>
      ))}
    </svg>
  );
}

// ─── Bubble Chart (opportunities) ──────────────────────────────────────────────
function BubbleChart() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const W = 300, H = 200;

  const items = [
    { x: 78, y: 84, r: 28, label: "SEA",    color: "#6366f1" },
    { x: 62, y: 40, r: 34, label: "B2B",    color: "#8b5cf6" },
    { x: 91, y: 62, r: 20, label: "Mobile", color: "#10b981" },
    { x: 55, y: 70, r: 26, label: "WL",     color: "#f59e0b" },
  ];

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          {items.map(it => (
            <radialGradient key={it.label} id={`bg-${it.label}`} cx="40%" cy="35%">
              <stop offset="0%" stopColor={it.color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={it.color} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>
        {/* Axis */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        <line x1={0} y1={0} x2={0} y2={H} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        <text x={W/2} y={H-2} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={7}>Вероятность</text>
        <text x={4} y={H/2} transform={`rotate(-90, 4, ${H/2})`} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={7}>Импакт</text>

        {items.map((it, i) => {
          const cx = (it.x / 100) * (W - 20) + 10;
          const cy = H - (it.y / 100) * (H - 16) - 8;
          return (
            <g key={it.label}>
              <motion.circle
                cx={cx} cy={cy} r={it.r}
                fill={`url(#bg-${it.label})`}
                stroke={it.color} strokeWidth={1}
                initial={{ scale: 0, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ originX: `${cx}px`, originY: `${cy}px` } as React.CSSProperties}
              />
              <motion.text
                x={cx} y={cy + 3}
                textAnchor="middle" fill={it.color} fontSize={8} fontWeight="700"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.3 }}>
                {it.label}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Mini sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 64, H = 24;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / (max - min || 1)) * H * 0.85 - 1,
  }));
  const d = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── AI Strategy Modal ──────────────────────────────────────────────────────────
interface AIResult {
  summary?: string;
  tam?: { size?: string; sam?: string; som?: string; growth_rate?: string };
  recommendations?: { priority?: number; action?: string; impact?: string; timeline?: string }[];
  north_star_metric?: string;
  growth_channels?: { channel?: string; potential?: string; strategy?: string }[];
}

function AIModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ company: "", industry: "", market: "", stage: "seed", revenue: "", goals: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  const handleClose = () => { setResult(null); setError(""); onClose(); };

  const submit = async () => {
    if (!form.company.trim() || !form.industry.trim()) { setError("Заполните компанию и отрасль"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/growth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Ошибка AI");
      setResult(json.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
        onClick={handleClose} />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          borderRadius: 22, background: "#0d0f1a", border: `1px solid rgba(99,102,241,0.2)`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)", padding: 28 }}>
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)", marginBottom: 24, marginLeft: -28, marginRight: -28, marginTop: -28 + 1 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>AI Стратегия роста</div>
              <div style={{ fontSize: 11, color: S.textMuted }}>Anthropic Claude · McKinsey-уровень</div>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, padding: 4, borderRadius: 8, display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        {!result ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "company",  label: "Компания *",       placeholder: "Apex AI" },
              { key: "industry", label: "Отрасль *",        placeholder: "SaaS / AI / FinTech" },
              { key: "market",   label: "Целевой рынок",    placeholder: "Россия, СНГ, EU" },
              { key: "revenue",  label: "Текущая выручка",  placeholder: "$500K ARR" },
              { key: "goals",    label: "Цели роста",       placeholder: "×3 за 12 мес." },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", height: 40, background: "rgba(255,255,255,0.035)", border: `1px solid ${S.hairline}`, borderRadius: 12, color: S.textPrimary, fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, display: "block", marginBottom: 6 }}>Стадия</label>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                style={{ width: "100%", height: 40, background: "#1a1d2a", border: `1px solid ${S.hairline}`, borderRadius: 12, color: S.textPrimary, fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}>
                {["pre-seed","seed","series-a","series-b","growth","enterprise"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {error && <div style={{ fontSize: 12, color: S.danger, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={submit} disabled={loading}
              style={{ height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 16px rgba(99,102,241,0.3)" }}>
              {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Анализирую…</> : <><Zap size={13} />Сгенерировать стратегию</>}
            </motion.button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ borderRadius: 14, padding: "16px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Резюме</div>
              <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.7 }}>{result.summary}</div>
            </div>
            {result.tam && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Рынок (TAM / SAM / SOM)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["TAM", result.tam.size], ["SAM", result.tam.sam], ["SOM", result.tam.som], ["CAGR", result.tam.growth_rate]].map(([k, v]) => (
                    <div key={k} style={{ borderRadius: 12, padding: "12px", background: S.surface, border: `1px solid ${S.hairline}` }}>
                      <div style={{ fontSize: 9, color: S.textMuted, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Рекомендации</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.recommendations.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ borderRadius: 12, padding: "12px 14px", background: S.surface, border: `1px solid ${S.hairline}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: S.textPrimary, marginBottom: 3 }}>{r.action}</div>
                      <div style={{ fontSize: 11, color: S.textMuted }}>{r.impact} · {r.timeline}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.north_star_metric && (
              <div style={{ borderRadius: 12, padding: "14px 16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                <Star size={13} style={{ color: S.warning, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: S.textMuted, marginBottom: 2 }}>North Star Metric</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.warning }}>{result.north_star_metric}</div>
                </div>
              </div>
            )}
            <button onClick={() => setResult(null)} style={{ height: 40, borderRadius: 12, background: S.surface, border: `1px solid ${S.hairline}`, color: S.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Новый анализ
            </button>
          </motion.div>
        )}
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Animated counter ───────────────────────────────────────────────────────────
function AnimatedKPI({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const val = useCountUp(to, inView);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
});

export default function GrowthPage() {
  const [period, setPeriod] = useState("30д");
  const [activeOpp, setActiveOpp] = useState<number | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const sparkData = [88, 95, 110, 124, 138, 149, 165, 178];

  return (
    <div style={{ minHeight: "100vh", background: S.bg, padding: "28px 24px 64px" }}>
      <style>{`
        .gr-kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
        .gr-row1{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;margin-bottom:16px}
        .gr-row2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
        @media(max-width:1100px){.gr-row1,.gr-row2{grid-template-columns:1fr!important}}
        @media(max-width:900px){.gr-kpi{grid-template-columns:repeat(3,1fr)!important}}
        @media(max-width:580px){.gr-kpi{grid-template-columns:repeat(2,1fr)!important}}
        .gr-btn{cursor:pointer;font-family:inherit;transition:all 0.18s}
        .gr-btn:hover{filter:brightness(1.1)}
        .gr-card{border-radius:16px;padding:20px 22px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);box-shadow:0 1px 2px rgba(0,0,0,0.4),0 8px 32px rgba(0,0,0,0.28),inset 0 1px 0 rgba(255,255,255,0.045);position:relative;overflow:hidden}
      `}</style>

      {/* Header */}
      <motion.div {...fadeUp(0)} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={15} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.textPrimary, letterSpacing: "-0.025em", margin: 0 }}>Рост & Рынок</h1>
          </div>
          <p style={{ fontSize: 12, color: S.textMuted, margin: 0 }}>AI-анализ рыночных возможностей и каналов роста</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", padding: 3, background: S.surface, border: `1px solid ${S.hairline}`, borderRadius: 12, gap: 2 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="gr-btn"
                style={{ padding: "5px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "none", background: period === p ? "rgba(99,102,241,0.2)" : "transparent", color: period === p ? "#818cf8" : S.textMuted }}>
                {p}
              </button>
            ))}
          </div>
          <button className="gr-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 36, borderRadius: 12, fontSize: 11, fontWeight: 600, border: `1px solid ${S.hairline}`, background: S.surface, color: S.textSecondary }}>
            <Download size={12} />Экспорт
          </button>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setAiOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 36, borderRadius: 12, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 16px rgba(99,102,241,0.25)", whiteSpace: "nowrap" }}>
            <Zap size={12} />AI Стратегия
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="gr-kpi">
        {[
          { label: "Рост MoM",     to: 24,    suf: "%",  icon: TrendingUp, color: S.success, note: "+4.2% vs пред." },
          { label: "Новые рынки",  to: 7,     suf: "",   icon: Globe,      color: S.accent,  note: "3 активных" },
          { label: "Лиды",         to: 15410, suf: "",   icon: Users,      color: "#818cf8",  note: "+18% MoM" },
          { label: "Охват рынка",  to: 38,    suf: "%",  icon: Target,     color: S.warning,  note: "↑ с 31% г/г" },
          { label: "NPS Score",    to: 72,    suf: "",   icon: Star,       color: S.danger,   note: "Top 15%" },
        ].map((k, i) => (
          <motion.div key={i} {...fadeUp(0.06 + i * 0.07)} className="gr-card">
            <div style={{ position: "absolute", top: 0, left: 16, right: 16, height: 1, background: `linear-gradient(90deg,transparent,${k.color}50,transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <k.icon size={13} style={{ color: k.color }} />
              <Sparkline data={sparkData} color={k.color} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: S.textPrimary, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              <AnimatedKPI to={k.to} suffix={k.suf} />
            </div>
            <div style={{ fontSize: 10, color: S.textMuted, marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: k.color, fontWeight: 600 }}>{k.note}</div>
          </motion.div>
        ))}
      </div>

      {/* Main chart row */}
      <div className="gr-row1">
        {/* Area Chart */}
        <motion.div {...fadeUp(0.18)} className="gr-card">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Динамика роста</div>
              <div style={{ fontSize: 11, color: S.textMuted }}>Выручка (K$) и Лиды — 12 мес.</div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {[{ label: "Выручка", color: S.accent }, { label: "Лиды", color: S.success }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 16, height: 2, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: S.textMuted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <AreaChart />
          {/* YoY stats */}
          <div style={{ display: "flex", gap: 24, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${S.hairline}` }}>
            {[["Дек vs Янв", "+167%", S.accent], ["Пик", "320K", S.textPrimary], ["CAC снижен", "−22%", S.success]].map(([l, v, c]) => (
              <div key={String(l)}>
                <div style={{ fontSize: 9, color: S.textMuted, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: String(c) }}>{v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Market share */}
        <motion.div {...fadeUp(0.24)} className="gr-card">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.3),transparent)" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>Рыночные сегменты</div>
          <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 20 }}>Доля, динамика и выручка</div>
          {MARKETS.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.07, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: S.textSecondary, fontWeight: 500 }}>{m.name}</span>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 11, color: S.success, fontWeight: 700 }}>{m.growth}</span>
                  <span style={{ fontSize: 11, color: S.textMuted }}>{m.revenue}</span>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${m.share}%` }}
                  transition={{ delay: 0.35 + i * 0.07, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${S.accent}, #818cf8)` }} />
              </div>
              <div style={{ fontSize: 9, color: S.textMuted, marginTop: 3, textAlign: "right" }}>{m.share}%</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Channels + Opportunities */}
      <div className="gr-row2">
        {/* Channels */}
        <motion.div {...fadeUp(0.3)} className="gr-card">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.3),transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Каналы привлечения</div>
              <div style={{ fontSize: 11, color: S.textMuted }}>Лиды · Конверсия · CAC</div>
            </div>
            <Activity size={13} style={{ color: S.textMuted }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {CHANNELS.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: S.textSecondary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 10, color: S.textMuted }}>CAC {c.cac}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.trend > 0 ? S.success : S.danger }}>{c.trend > 0 ? "+" : ""}{c.trend}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(c.leads / 5000) * 100}%` }}
                      transition={{ delay: 0.44 + i * 0.05, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: "100%", borderRadius: 99, background: c.trend > 0 ? `linear-gradient(90deg, ${S.accent}, #818cf8)` : "rgba(239,68,68,0.5)" }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: S.textPrimary, flexShrink: 0, width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{(c.leads / 1000).toFixed(1)}K</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Opportunities + Bubble Chart */}
        <motion.div {...fadeUp(0.36)} className="gr-card">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.3),transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Возможности роста</div>
              <div style={{ fontSize: 11, color: S.textMuted }}>Вероятность vs импакт</div>
            </div>
            <Flame size={13} style={{ color: S.warning }} />
          </div>

          {/* Bubble chart */}
          <BubbleChart />

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {OPPORTUNITIES.map((o, i) => (
              <motion.button key={o.id} onClick={() => setActiveOpp(activeOpp === o.id ? null : o.id)}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                style={{ borderRadius: 12, padding: "10px 12px", background: activeOpp === o.id ? "rgba(99,102,241,0.08)" : S.surface, border: `1px solid ${activeOpp === o.id ? "rgba(99,102,241,0.25)" : S.hairline}`, cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "inherit", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: S.textPrimary }}>{o.title}</div>
                    <div style={{ fontSize: 10, color: S.textMuted }}>TAM {o.tam} · {o.effort} усилие</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: o.prob >= 80 ? S.success : o.prob >= 60 ? S.warning : S.danger }}>{o.prob}%</div>
                    <div style={{ fontSize: 9, color: S.textMuted }}>вероятность</div>
                  </div>
                </div>
                <AnimatePresence>
                  {activeOpp === o.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${S.hairline}`, display: "flex", gap: 6 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: S.surface, color: S.textMuted }}>Усилие: {o.effort}</span>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(99,102,241,0.1)", color: "#818cf8", fontWeight: 600 }}>Импакт: {o.impact}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Forecast Banner */}
      <motion.div {...fadeUp(0.44)}
        style={{ borderRadius: 16, padding: "20px 24px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.14)", position: "relative", overflow: "hidden", boxShadow: S.shadow }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BarChart2 size={16} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary, marginBottom: 2 }}>AI Прогноз роста</div>
              <div style={{ fontSize: 12, color: S.textMuted }}>При запуске 2 новых каналов: <span style={{ color: "#818cf8", fontWeight: 700 }}>+68% выручки за 6 месяцев</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["3 мес.", "+31%"], ["6 мес.", "+68%"], ["12 мес.", "+142%"]].map(([l, v]) => (
              <div key={String(l)} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#818cf8", letterSpacing: "-0.02em" }}>{v}</div>
                <div style={{ fontSize: 9, color: S.textMuted }}>{l}</div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ y: -1 }} onClick={() => setAiOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 40, borderRadius: 12, fontSize: 12, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)", whiteSpace: "nowrap" }}>
            Запустить стратегию <ArrowUpRight size={12} />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>{aiOpen && <AIModal open={aiOpen} onClose={() => setAiOpen(false)} />}</AnimatePresence>
    </div>
  );
}
