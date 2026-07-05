"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import {
  Shield, AlertTriangle, CheckCircle, TrendingDown,
  Zap, Lock, Globe, Users, RefreshCw,
  BarChart2, X, Plus, Loader2, Activity,
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
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  dangerBg: "rgba(239,68,68,0.1)",
  warningBg: "rgba(245,158,11,0.1)",
  successBg: "rgba(16,185,129,0.1)",
  card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045)",
};

// ─── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_RISKS = [
  { id: 1, title: "Конкурентное давление", category: "strategic", probability: 4, impact: 4, status: "active", mitigation: "Ускорить разработку уникальных фич, усилить retention программу", owner: "CEO / Product" },
  { id: 2, title: "Утечка данных клиентов", category: "technical", probability: 1, impact: 5, status: "active", mitigation: "SOC 2 Type II аудит, pen testing Q3, шифрование на уровне БД", owner: "CTO / Security" },
  { id: 3, title: "Регуляторные изменения AI", category: "legal", probability: 3, impact: 3, status: "active", mitigation: "Нанять GR-консультанта, мониторинг EU AI Act", owner: "Legal / Policy" },
  { id: 4, title: "Ключевые сотрудники", category: "operational", probability: 2, impact: 4, status: "active", mitigation: "Retention-пакеты, equity pool, succession plan", owner: "HR / CEO" },
  { id: 5, title: "API-зависимость (OpenAI)", category: "technical", probability: 3, impact: 4, status: "active", mitigation: "Multi-provider стратегия, собственная модель к Q2", owner: "CTO" },
  { id: 6, title: "Runway < 12 месяцев", category: "financial", probability: 1, impact: 5, status: "active", mitigation: "Fundraising раунд А, оптимизация COGS", owner: "CFO / CEO" },
];

const CONTROLS = [
  { name: "MFA для всех аккаунтов", status: "ok",      updated: "2 дня назад" },
  { name: "Backup & DR тест",        status: "ok",      updated: "1 нед. назад" },
  { name: "Pen Testing Q3",          status: "warn",    updated: "запланировано" },
  { name: "GDPR DPA обновление",     status: "ok",      updated: "3 нед. назад" },
  { name: "SOC 2 Type II аудит",     status: "pending", updated: "в процессе" },
  { name: "Incident Response Plan",  status: "warn",    updated: "нужно обновить" },
];

const INCIDENTS = [
  { time: "14:32", text: "Подозрительная активность IP 213.xxx — заблокировано WAF", level: "warn" },
  { time: "11:05", text: "API rate limit превышен x3 — новый клиент Singapore", level: "info" },
  { time: "08:48", text: "Регуляторный алерт: EU AI Act поправка опубликована", level: "warn" },
  { time: "Вчера", text: "Уязвимость CVE-2025-18934 — патч применён в 00:15", level: "ok" },
  { time: "2д назад", text: "Сотрудник оффбординг — права доступа отозваны ×23", level: "ok" },
];

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Операционные", financial: "Финансовые",
  strategic: "Стратегические", legal: "Правовые",
  technical: "Технические", reputational: "Репутационные",
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  operational: Users, financial: BarChart2, strategic: TrendingDown,
  legal: Globe, technical: Zap, reputational: Shield,
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Risk {
  id: number | string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  status: string;
  mitigation?: string | null;
  owner?: string | null;
  due_date?: string | null;
}

// ─── Severity util ─────────────────────────────────────────────────────────────
function getSeverity(prob: number, impact: number): { label: string; color: string; bg: string } {
  const score = prob * impact;
  if (score >= 16) return { label: "Критичный", color: S.danger, bg: S.dangerBg };
  if (score >= 9)  return { label: "Высокий",   color: S.warning, bg: S.warningBg };
  if (score >= 4)  return { label: "Средний",   color: S.warning, bg: "rgba(245,158,11,0.06)" };
  return            { label: "Низкий",   color: S.success, bg: S.successBg };
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

// ─── Scatter / Bubble risk matrix ──────────────────────────────────────────────
function RiskMatrix({ risks }: { risks: Risk[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const W = 400, H = 300, PAD = 40;

  const cellW = (W - PAD * 2) / 5;
  const cellH = (H - PAD * 2) / 5;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {/* grid cells coloured by severity zone */}
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => {
          const prob = col + 1, impact = row + 1;
          const score = prob * impact;
          const fill = score >= 16 ? "rgba(239,68,68,0.12)" : score >= 9 ? "rgba(245,158,11,0.09)" : score >= 4 ? "rgba(245,158,11,0.04)" : "rgba(16,185,129,0.05)";
          return (
            <rect
              key={`${row}-${col}`}
              x={PAD + col * cellW} y={PAD + (4 - row) * cellH}
              width={cellW} height={cellH}
              fill={fill} stroke={S.border} strokeWidth={0.5}
            />
          );
        })
      )}

      {/* axis labels */}
      {[1,2,3,4,5].map(n => (
        <text key={n} x={PAD + (n - 0.5) * cellW} y={H - 8} textAnchor="middle" fill={S.textMuted} fontSize={10}>{n}</text>
      ))}
      {[1,2,3,4,5].map(n => (
        <text key={n} x={14} y={PAD + (5 - n + 0.5) * cellH + 4} textAnchor="middle" fill={S.textMuted} fontSize={10}>{n}</text>
      ))}
      <text x={PAD + (W - PAD * 2) / 2} y={H} textAnchor="middle" fill={S.textMuted} fontSize={10}>Вероятность</text>
      <text x={8} y={PAD + (H - PAD * 2) / 2} textAnchor="middle" fill={S.textMuted} fontSize={10} transform={`rotate(-90, 8, ${PAD + (H - PAD * 2) / 2})`}>Влияние</text>

      {/* risk bubbles */}
      {risks.map((r, i) => {
        const sev = getSeverity(r.probability, r.impact);
        const cx = PAD + (r.probability - 0.5) * cellW;
        const cy = PAD + (5 - r.impact + 0.5) * cellH;
        const radius = 14;
        return (
          <motion.g key={r.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ originX: cx, originY: cy }}
          >
            <circle cx={cx} cy={cy} r={radius} fill={sev.color} fillOpacity={0.18} stroke={sev.color} strokeWidth={1.5} />
            <text x={cx} y={cy + 4} textAnchor="middle" fill={sev.color} fontSize={10} fontWeight="700">{r.probability * r.impact}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}

// ─── Donut chart ───────────────────────────────────────────────────────────────
function RiskDonut({ risks }: { risks: Risk[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const cats = ["Критичный", "Высокий", "Средний", "Низкий"];
  const colors = [S.danger, S.warning, "#f59e0b", S.success];
  const counts = cats.map(c => risks.filter(r => getSeverity(r.probability, r.impact).label === c).length);
  const total = risks.length || 1;

  const cx = 60, cy = 60, r = 48, strokeW = 14;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg ref={ref} viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={S.border} strokeWidth={strokeW} />
      {counts.map((cnt, i) => {
        const dash = (cnt / total) * circumference;
        const arc = (
          <motion.circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={colors[i]} strokeWidth={strokeW}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={inView ? -offset : -circumference}
            strokeLinecap="butt"
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }}
            initial={{ strokeDashoffset: -circumference }}
            animate={inView ? { strokeDashoffset: -offset } : {}}
            transition={{ duration: 1.3, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        );
        offset += dash;
        return arc;
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={S.textPrimary} fontSize={18} fontWeight="800">{risks.length}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill={S.textMuted} fontSize={8}>рисков</text>
    </svg>
  );
}

// ─── AddRiskModal ──────────────────────────────────────────────────────────────
function AddRiskModal({ onClose, onAdded }: { onClose: () => void; onAdded: (r: Risk) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("operational");
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigation, setMitigation] = useState("");
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { toast } = useToast();

  async function submit() {
    if (!title.trim()) { setErr("Введите название риска"); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, probability, impact, mitigation, owner }),
      });
      const j = await res.json();
      if (!j.success) { setErr(j.error ?? "Ошибка"); toast(j.error ?? "Не удалось сохранить риск", "error"); setLoading(false); return; }
      onAdded(j.data as Risk);
      toast("Риск добавлен", "success");
      onClose();
    } catch { setErr("Сетевая ошибка"); toast("Сетевая ошибка — попробуйте снова", "error"); setLoading(false); }
  }

  const sev = getSeverity(probability, impact);

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`,
    color: S.textPrimary, fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "#0e0f17", border: `1px solid ${S.border}`, borderRadius: 22, padding: 32, width: "100%", maxWidth: 520, boxShadow: S.card }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ color: S.textPrimary, fontWeight: 700, fontSize: 18 }}>Новый риск</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: S.textMuted, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Название *</label>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Опишите риск кратко" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: S.textMuted, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Категория</label>
            <select style={{ ...inp, appearance: "none" }} value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Sliders */}
          {([
            ["Вероятность", probability, setProbability],
            ["Влияние", impact, setImpact],
          ] as [string, number, (v: number) => void][]).map(([label, val, setVal]) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: S.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</label>
                <span style={{ fontSize: 13, color: S.textPrimary, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{val}/5</span>
              </div>
              <input type="range" min={1} max={5} value={val}
                onChange={e => setVal(Number(e.target.value))}
                style={{ width: "100%", accentColor: S.accent }}
              />
            </div>
          ))}

          {/* Score preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: sev.bg, border: `1px solid ${sev.color}22` }}>
            <span style={{ fontSize: 12, color: S.textMuted }}>Скор риска:</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: sev.color, fontVariantNumeric: "tabular-nums" }}>{probability * impact}</span>
            <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 8, background: sev.bg, color: sev.color, border: `1px solid ${sev.color}33`, fontWeight: 600 }}>{sev.label}</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: S.textMuted, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Митигация</label>
            <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={mitigation} onChange={e => setMitigation(e.target.value)} placeholder="Как снизить риск?" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: S.textMuted, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Ответственный</label>
            <input style={inp} value={owner} onChange={e => setOwner(e.target.value)} placeholder="Имя или роль" />
          </div>

          {err && <div style={{ color: S.danger, fontSize: 13 }}>{err}</div>}

          <button onClick={submit} disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", borderRadius: 12, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
            {loading ? "Сохраняем..." : "Добавить риск"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Fade-up helper ────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

// ─── AnimatedKPI ───────────────────────────────────────────────────────────────
function AnimatedKPI({ value, label, color, sublabel }: { value: number; label: string; color: string; sublabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, inView);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{count}</span>
      <span style={{ fontSize: 13, color: S.textSecondary }}>{label}</span>
      {sublabel && <span style={{ fontSize: 11, color: S.textMuted }}>{sublabel}</span>}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/risks?limit=50");
      const j = await res.json();
      setRisks(j.success && j.data.length > 0 ? j.data : DEMO_RISKS);
    } catch {
      setRisks(DEMO_RISKS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRisks(); }, [fetchRisks]);

  const filtered = filterCat === "all" ? risks : risks.filter(r => r.category === filterCat);
  const critical = risks.filter(r => getSeverity(r.probability, r.impact).label === "Критичный").length;
  const high = risks.filter(r => getSeverity(r.probability, r.impact).label === "Высокий").length;
  const avgScore = risks.length ? Math.round(risks.reduce((s, r) => s + r.probability * r.impact, 0) / risks.length) : 0;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.textPrimary, fontFamily: "system-ui, -apple-system, sans-serif", padding: "0 0 80px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .risk-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .risk-main { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        .risk-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .risk-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045); transition: border-color 0.2s; }
        .risk-card:hover { border-color: rgba(255,255,255,0.13); }
        .risk-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: all 0.18s; }
        .risk-row:hover { background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.1); }
        @media (max-width: 960px) { .risk-main { grid-template-columns: 1fr; } .risk-bottom { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .risk-kpi { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      {/* Header */}
      <motion.div {...fadeUp(0)} style={{ padding: "40px 40px 0", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: S.dangerBg, border: `1px solid ${S.danger}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} color={S.danger} />
              </div>
              <span style={{ fontSize: 11, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.14em" }}>Risk Intelligence</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Управление рисками</h1>
            <p style={{ fontSize: 14, color: S.textSecondary, marginTop: 6 }}>Мониторинг, оценка и митигация ключевых бизнес-рисков</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              onClick={fetchRisks}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 13, cursor: "pointer" }}
            >
              <RefreshCw size={14} />
              Обновить
            </motion.button>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, background: `linear-gradient(135deg,${S.accent},${S.accentDark})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)" }}
            >
              <Plus size={14} />
              Добавить риск
            </motion.button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="risk-kpi" style={{ marginBottom: 24 }}>
          {[
            { value: risks.length, label: "Всего рисков", color: S.textPrimary, sub: "активных" },
            { value: critical, label: "Критичных", color: S.danger, sub: "немедленно" },
            { value: high, label: "Высоких", color: S.warning, sub: "под контролем" },
            { value: avgScore, label: "Средний скор", color: S.accent, sub: "из 25 макс." },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} {...fadeUp(0.1 + i * 0.07)} className="risk-card">
              <AnimatedKPI value={kpi.value} label={kpi.label} color={kpi.color} sublabel={kpi.sub} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main content */}
      <div style={{ padding: "0 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="risk-main">
          {/* Risk list */}
          <motion.div {...fadeUp(0.2)} className="risk-card" style={{ padding: 0 }}>
            {/* Filters */}
            <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${S.border}`, display: "flex", gap: 4, flexWrap: "wrap", paddingBottom: 16 }}>
              {[["all", "Все"], ...Object.entries(CATEGORY_LABELS)].map(([k, v]) => (
                <button key={k} onClick={() => setFilterCat(k)}
                  style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${filterCat === k ? S.accent : S.border}`, background: filterCat === k ? `${S.accent}22` : "transparent", color: filterCat === k ? S.accent : S.textSecondary, fontSize: 12, cursor: "pointer", fontWeight: filterCat === k ? 700 : 400, transition: "all 0.15s" }}
                >{v}</button>
              ))}
            </div>

            {/* List */}
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <Loader2 size={24} color={S.accent} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : filtered.map((risk, i) => {
                const sev = getSeverity(risk.probability, risk.impact);
                const Icon = CATEGORY_ICONS[risk.category] ?? Shield;
                return (
                  <motion.div key={risk.id} className="risk-row"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: sev.bg, border: `1px solid ${sev.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={sev.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary }}>{risk.title}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: sev.bg, color: sev.color, border: `1px solid ${sev.color}22`, fontWeight: 700, flexShrink: 0 }}>{sev.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: S.textMuted }}>{CATEGORY_LABELS[risk.category] ?? risk.category}</span>
                        <span style={{ fontSize: 11, color: S.textMuted }}>P:{risk.probability} · I:{risk.impact} · Score:{risk.probability * risk.impact}</span>
                      </div>

                      <AnimatePresence>
                        {selectedRisk?.id === risk.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28 }} style={{ overflow: "hidden" }}
                          >
                            {risk.mitigation && (
                              <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(99,102,241,0.06)", border: `1px solid ${S.accent}22` }}>
                                <div style={{ fontSize: 10, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Митигация</div>
                                <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.6 }}>{risk.mitigation}</div>
                              </div>
                            )}
                            {risk.owner && (
                              <div style={{ fontSize: 12, color: S.textMuted, marginTop: 8 }}>
                                <Users size={11} style={{ display: "inline", marginRight: 5 }} />{risk.owner}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right panel: matrix + donut */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <motion.div {...fadeUp(0.25)} className="risk-card">
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 16 }}>Матрица рисков</div>
              <RiskMatrix risks={risks} />
              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                {[["Критичный", S.danger], ["Высокий", S.warning], ["Средний", "#f59e0b"], ["Низкий", S.success]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: 11, color: S.textMuted }}>{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="risk-card">
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 16 }}>Распределение</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <RiskDonut risks={risks} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[["Критичный", S.danger], ["Высокий", S.warning], ["Средний", "#f59e0b"], ["Низкий", S.success]].map(([l, c]) => {
                    const cnt = risks.filter(r => getSeverity(r.probability, r.impact).label === l).length;
                    return (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: S.textSecondary, flex: 1 }}>{l}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums" }}>{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="risk-bottom" style={{ marginTop: 20 }}>
          {/* Controls */}
          <motion.div {...fadeUp(0.35)} className="risk-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 16 }}>Security Controls</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CONTROLS.map((c, i) => {
                const colors = { ok: S.success, warn: S.warning, pending: S.accent };
                const icons = { ok: CheckCircle, warn: AlertTriangle, pending: Activity };
                const col = colors[c.status as keyof typeof colors] ?? S.textMuted;
                const Icon = icons[c.status as keyof typeof icons] ?? Activity;
                return (
                  <motion.div key={c.name}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: S.surface, border: `1px solid ${S.border}` }}
                  >
                    <Icon size={14} color={col} />
                    <span style={{ flex: 1, fontSize: 13, color: S.textPrimary }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: S.textMuted }}>{c.updated}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Incidents */}
          <motion.div {...fadeUp(0.4)} className="risk-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Инциденты</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: S.dangerBg, color: S.danger, border: `1px solid ${S.danger}22` }}>Live</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INCIDENTS.map((inc, i) => {
                const colors = { warn: S.warning, info: S.accent, ok: S.success };
                const col = colors[inc.level as keyof typeof colors] ?? S.textMuted;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, background: S.surface, border: `1px solid ${S.border}` }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: col, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: S.textPrimary, lineHeight: 1.5 }}>{inc.text}</div>
                      <div style={{ fontSize: 11, color: S.textMuted, marginTop: 3 }}>{inc.time}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AddRiskModal onClose={() => setShowModal(false)} onAdded={r => setRisks(prev => [r, ...prev])} />
        )}
      </AnimatePresence>
    </div>
  );
}
