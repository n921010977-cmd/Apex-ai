"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle, TrendingDown,
  Zap, Activity, Lock, Globe, Users, Download, RefreshCw,
  ChevronRight, Eye, BarChart2, Clock, X, Plus, Loader2,
} from "lucide-react";

// ─── Static demo data (shown when API returns empty) ──────────────────────────

const DEMO_RISKS = [
  { id: 1, title: "Конкурентное давление", category: "strategic", severity: "Высокий", probability: 4, impact: 4, trend: "↑", color: "#f43f5e", icon: TrendingDown, mitigation: "Ускорить разработку уникальных фич, усилить retention программу", owner: "CEO / Product" },
  { id: 2, title: "Утечка данных клиентов", category: "technical", severity: "Критичный", probability: 1, impact: 5, trend: "→", color: "#f43f5e", icon: Lock, mitigation: "SOC 2 Type II аудит, pen testing Q3, шифрование на уровне БД", owner: "CTO / Security" },
  { id: 3, title: "Регуляторные изменения AI", category: "legal", severity: "Средний", probability: 3, impact: 3, trend: "↑", color: "#f59e0b", icon: Globe, mitigation: "Нанять GR-консультанта, мониторинг EU AI Act, подготовка compliance", owner: "Legal / Policy" },
  { id: 4, title: "Ключевые сотрудники", category: "operational", severity: "Средний", probability: 2, impact: 4, trend: "↓", color: "#f59e0b", icon: Users, mitigation: "Retention-пакеты для топ-10, equity pool, succession plan", owner: "HR / CEO" },
  { id: 5, title: "API-зависимость (OpenAI)", category: "technical", severity: "Высокий", probability: 3, impact: 4, trend: "→", color: "#f43f5e", icon: Zap, mitigation: "Multi-provider стратегия, собственная fine-tuned модель к Q2", owner: "CTO" },
  { id: 6, title: "Runway < 12 месяцев", category: "financial", severity: "Низкий", probability: 1, impact: 5, trend: "↓", color: "#10b981", icon: BarChart2, mitigation: "Fundraising раунд А, оптимизация COGS, bridge financing", owner: "CFO / CEO" },
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
  { time: "14:32", text: "Подозрительная активность IP 213.xxx — заблокировано авто-WAF", level: "warn" },
  { time: "11:05", text: "API rate limit превышен x3 — новый клиент Singapore", level: "info" },
  { time: "08:48", text: "Регуляторный алерт: EU AI Act поправка опубликована", level: "warn" },
  { time: "Вчера", text: "Уязвимость CVE-2025-18934 — патч применён в 00:15", level: "ok" },
  { time: "2д назад", text: "Сотрудник оффбординг — права доступа отозваны ×23", level: "ok" },
];

const SEVERITY_MAP: Record<string, { bg: string; color: string }> = {
  "Критичный": { bg: "rgba(244,63,94,0.15)", color: "#f43f5e" },
  "Высокий":   { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  "Средний":   { bg: "rgba(245,158,11,0.08)", color: "#f59e0b" },
  "Низкий":    { bg: "rgba(16,185,129,0.10)", color: "#10b981" },
};

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Операционные", financial: "Финансовые",
  strategic: "Стратегические", legal: "Правовые",
  technical: "Технические", reputational: "Репутационные",
};

function sevFromScore(prob: number, impact: number) {
  const score = prob * impact;
  if (score >= 20) return "Критичный";
  if (score >= 12) return "Высокий";
  if (score >= 6)  return "Средний";
  return "Низкий";
}

function colorFromSev(sev: string) {
  if (sev === "Критичный") return "#f43f5e";
  if (sev === "Высокий")   return "#f59e0b";
  if (sev === "Средний")   return "#f59e0b";
  return "#10b981";
}

function RiskMeter({ value, color }: { value: number; color: string }) {
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <svg width={56} height={56} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (value / 100) * circ }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

function Counter({ to }: { to: number }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let s = 0;
    const step = to / 36;
    const t = setInterval(() => {
      s += step;
      if (s >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(s));
    }, 28);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}</>;
}

// ─── Add Risk Modal ────────────────────────────────────────────────────────────

function AddRiskModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "operational", probability: 3, impact: 3, mitigation: "", owner: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim()) { setError("Укажите название риска"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Ошибка");
      onAdded();
      onClose();
      setForm({ title: "", description: "", category: "operational", probability: 3, impact: 3, mitigation: "", owner: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ position: "relative", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", borderRadius: 20, background: "#0e101a", border: "1px solid rgba(244,63,94,0.2)", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #f43f5e, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={15} color="#fff" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Добавить риск</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Название *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Краткое описание риска"
              style={{ width: "100%", height: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Категория</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ width: "100%", height: 40, background: "#1a1d2e", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box" }}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {(["probability", "impact"] as const).map(key => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>
                  {key === "probability" ? "Вероятность" : "Импакт"} (1–5): <span style={{ color: "#fff" }}>{form[key]}</span>
                </label>
                <input type="range" min={1} max={5} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#6366f1" }} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Митигация</label>
            <textarea value={form.mitigation} onChange={e => setForm(p => ({ ...p, mitigation: e.target.value }))} placeholder="Как снизить этот риск?"
              rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Владелец</label>
            <input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="CTO / CEO"
              style={{ width: "100%", height: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && <div style={{ fontSize: 12, color: "#f43f5e", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
          <button onClick={submit} disabled={loading}
            style={{ height: 44, borderRadius: 12, background: "linear-gradient(135deg, #f43f5e, #f59e0b)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Сохраняю…</> : <><Plus size={14} />Добавить риск</>}
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface ApiRisk {
  id: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  mitigation?: string;
  owner?: string;
  status?: string;
}

export default function RisksPage() {
  const [activeRisk, setActiveRisk] = useState<number | string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [apiRisks, setApiRisks] = useState<ApiRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | string | null>(null);

  const fetchRisks = async () => {
    try {
      const res = await fetch("/api/risks");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setApiRisks(json.data);
      }
    } catch { /* silent — use demo data */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRisks(); }, []);

  // Merge: API risks take priority, fill with demo data if empty
  const risks = apiRisks.length > 0
    ? apiRisks.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        severity: sevFromScore(r.probability, r.impact),
        probability: r.probability * 20,
        impact: r.impact * 20,
        trend: "→" as string,
        color: colorFromSev(sevFromScore(r.probability, r.impact)),
        icon: Shield,
        mitigation: r.mitigation ?? "",
        owner: r.owner ?? "",
      }))
    : DEMO_RISKS.map(r => ({ ...r, probability: r.probability * 20, impact: r.impact * 20 }));

  const overallScore = Math.round(risks.reduce((s, r) => s + (r.probability / 100) * (r.impact / 100) * 100, 0) / risks.length);
  const critical = risks.filter(r => r.severity === "Критичный").length;
  const high = risks.filter(r => r.severity === "Высокий").length;

  const handleAssign = async (risk: typeof risks[0]) => {
    setAssigningId(risk.id);
    try {
      await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[Задача] ${risk.title}`,
          category: "operational",
          probability: 2,
          impact: 3,
          mitigation: risk.mitigation,
          owner: risk.owner,
        }),
      });
    } catch { /* ignore */ }
    finally { setAssigningId(null); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", padding: "28px 28px 60px", position: "relative", overflow: "hidden" }}>
      <style>{`
        .risk-kpi { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        .risk-main { display: grid; grid-template-columns: 1fr 280px; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 1100px) { .risk-main { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .risk-kpi { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 600px) { .risk-kpi { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      <div style={{ position: "fixed", top: -150, right: -100, width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, left: 50, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #f43f5e, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={16} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Риски</h1>
            {loading && <Loader2 size={14} style={{ color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite" }} />}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>AI-мониторинг угроз, уязвимостей и контрольная панель</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={fetchRisks} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <RefreshCw size={12} />Обновить
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <Download size={12} />Отчёт
          </button>
          <button onClick={() => setAddOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #f43f5e, #f59e0b)", color: "#fff", cursor: "pointer" }}>
            <Plus size={12} />Добавить риск
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="risk-kpi">
        {[
          { label: "Risk Score",      value: overallScore, suffix: "/100", color: "#f43f5e", note: "Умеренно высокий" },
          { label: "Критических",     value: critical,     suffix: "",     color: "#f43f5e", note: "Немедленно" },
          { label: "Высоких",         value: high,         suffix: "",     color: "#f59e0b", note: "Контроль усилен" },
          { label: "Открытых инц.",   value: 3,            suffix: "",     color: "#f59e0b", note: "↓2 vs прошлая нед." },
          { label: "Controls OK",     value: 4,            suffix: "/6",   color: "#10b981", note: "67% покрытие" },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ borderRadius: 16, padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${k.color}60, transparent)` }} />
            <Shield size={13} style={{ color: k.color, marginBottom: 10 }} />
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
              <Counter to={k.value} />{k.suffix}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: k.color, fontWeight: 600 }}>{k.note}</div>
          </motion.div>
        ))}
      </div>

      {/* Risk Matrix + Sidebar */}
      <div className="risk-main">
        {/* Risk Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f43f5e80, transparent)" }} />
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Матрица рисков</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {apiRisks.length > 0 ? `${apiRisks.length} рисков из базы данных` : "Демо-данные · нажми для деталей"}
            </div>
          </div>
          <div style={{ padding: "0 8px 8px" }}>
            {risks.map((risk, i) => (
              <motion.div key={risk.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                onClick={() => setActiveRisk(activeRisk === risk.id ? null : risk.id)}
                style={{ borderRadius: 12, margin: "6px 0", padding: "12px 16px", background: activeRisk === risk.id ? `${risk.color}08` : "transparent", border: `1px solid ${activeRisk === risk.id ? risk.color + "40" : "transparent"}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${risk.color}12`, border: `1px solid ${risk.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <risk.icon size={14} style={{ color: risk.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{risk.title}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: SEVERITY_MAP[risk.severity]?.bg, color: SEVERITY_MAP[risk.severity]?.color, fontWeight: 700, whiteSpace: "nowrap" }}>{risk.severity}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{risk.trend}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      {CATEGORY_LABELS[risk.category] ?? risk.category}
                      {risk.owner && ` · ${risk.owner}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: risk.color }}>{risk.probability}%</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>вероятность</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{risk.impact}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>импакт</div>
                    </div>
                  </div>
                  <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, transform: activeRisk === risk.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                </div>
                <AnimatePresence>
                  {activeRisk === risk.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        {risk.mitigation && (
                          <>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>Митигация:</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 12 }}>{risk.mitigation}</div>
                          </>
                        )}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={e => { e.stopPropagation(); handleAssign(risk); }}
                            disabled={assigningId === risk.id}
                            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700, border: "none", background: risk.color, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: assigningId === risk.id ? 0.6 : 1 }}>
                            {assigningId === risk.id ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : null}
                            Назначить задачу
                          </button>
                          <button onClick={e => e.stopPropagation()} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Отложить</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Overall Score */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ borderRadius: 18, padding: "20px", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.12)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f43f5e80, transparent)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Общий Risk Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                <RiskMeter value={overallScore} color="#f43f5e" />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#f43f5e" }}>{overallScore}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e", marginBottom: 3 }}>Умеренно высокий</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{critical} критичных риска требуют внимания</div>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            style={{ borderRadius: 18, padding: "18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden", flex: 1 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #10b98140, transparent)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Контроли безопасности</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {CONTROLS.map((c, i) => {
                const ic = c.status === "ok"
                  ? <CheckCircle size={12} style={{ color: "#10b981" }} />
                  : c.status === "warn"
                  ? <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
                  : <Clock size={12} style={{ color: "rgba(255,255,255,0.3)" }} />;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ic}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{c.updated}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live Incident Feed */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ borderRadius: 18, padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f59e0b60, transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={14} style={{ color: "#f59e0b" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Live Incident Feed</div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: "rgba(244,63,94,0.15)", color: "#f43f5e", fontWeight: 700 }}>LIVE</span>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.3)", background: "transparent", border: "none", cursor: "pointer" }}>
            <Eye size={11} />Все события
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {INCIDENTS.map((inc, i) => {
            const dot = inc.level === "ok" ? "#10b981" : inc.level === "warn" ? "#f59e0b" : "#3b82f6";
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.06 }}
                style={{ display: "flex", gap: 14, paddingBottom: i < INCIDENTS.length - 1 ? 14 : 0, marginBottom: i < INCIDENTS.length - 1 ? 14 : 0, borderBottom: i < INCIDENTS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, boxShadow: `0 0 6px ${dot}` }} />
                  {i < INCIDENTS.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.05)", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>{inc.text}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{inc.time}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <AddRiskModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={fetchRisks} />
    </div>
  );
}
