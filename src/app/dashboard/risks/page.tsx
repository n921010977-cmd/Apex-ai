"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, AlertOctagon, CheckCircle, TrendingDown,
  Zap, Activity, Lock, Globe, Users, Download, RefreshCw,
  ChevronRight, Eye, BarChart2, Clock,
} from "lucide-react";

const RISK_MATRIX = [
  { id: 1, name: "Конкурентное давление", category: "Рыночные", severity: "Высокий", prob: 72, impact: 85, trend: "↑", color: "#FF5470", rgb: "255,84,112", icon: TrendingDown, mitigation: "Ускорить разработку уникальных фич, усилить retention программу", owner: "CEO / Product" },
  { id: 2, name: "Утечка данных клиентов", category: "Кибер", severity: "Критичный", prob: 18, impact: 98, trend: "→", color: "#FF5470", rgb: "255,84,112", icon: Lock, mitigation: "SOC 2 Type II аудит, pen testing Q3, шифрование на уровне БД", owner: "CTO / Security" },
  { id: 3, name: "Регуляторные изменения AI", category: "Правовые", severity: "Средний", prob: 55, impact: 62, trend: "↑", color: "#FFB800", rgb: "255,184,0", icon: Globe, mitigation: "Нанять GR-консультанта, мониторинг EU AI Act, подготовка compliance", owner: "Legal / Policy" },
  { id: 4, name: "Ключевые сотрудники", category: "Кадровые", severity: "Средний", prob: 38, impact: 70, trend: "↓", color: "#FFB800", rgb: "255,184,0", icon: Users, mitigation: "Retention-пакеты для топ-10, equity pool, succession plan", owner: "HR / CEO" },
  { id: 5, name: "API-зависимость (OpenAI)", category: "Технические", severity: "Высокий", prob: 45, impact: 80, trend: "→", color: "#FF5470", rgb: "255,84,112", icon: Zap, mitigation: "Multi-provider стратегия, собственная fine-tuned модель к Q2", owner: "CTO" },
  { id: 6, name: "Runway < 12 месяцев", category: "Финансовые", severity: "Низкий", prob: 22, impact: 95, trend: "↓", color: "#00E7A7", rgb: "0,231,167", icon: BarChart2, mitigation: "Fundraising раунд А, оптимизация COGS, bridge financing", owner: "CFO / CEO" },
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
  "Критичный": { bg: "rgba(255,84,112,0.15)", color: "#FF5470" },
  "Высокий":   { bg: "rgba(255,184,0,0.12)",  color: "#FFB800" },
  "Средний":   { bg: "rgba(255,184,0,0.08)",  color: "#FFB800" },
  "Низкий":    { bg: "rgba(0,231,167,0.10)",  color: "#00E7A7" },
};

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

export default function RisksPage() {
  const [activeRisk, setActiveRisk] = useState<number | null>(null);

  const overallScore = 67; // composite risk score (lower = better)
  const critical = RISK_MATRIX.filter(r => r.severity === "Критичный").length;
  const high = RISK_MATRIX.filter(r => r.severity === "Высокий").length;

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", padding: "28px 28px 60px", position: "relative", overflow: "hidden" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: -150, right: -100, width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,84,112,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, left: 50, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,92,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #FF5470, #FFB800)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={16} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Риски</h1>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>AI-мониторинг угроз, уязвимостей и контрольная панель</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <RefreshCw size={12} />Обновить
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <Download size={12} />Отчёт
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", background: "linear-gradient(135deg, #FF5470, #FFB800)", color: "#fff", cursor: "pointer" }}>
            <Zap size={12} />AI Митигация
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Risk Score",       value: overallScore, suffix: "/100", color: "#FF5470",  note: "Умеренно высокий" },
          { label: "Критических",      value: critical,     suffix: "",      color: "#FF5470",  note: "Требуют немедленно" },
          { label: "Высоких",          value: high,         suffix: "",      color: "#FFB800",  note: "Контроль усилен" },
          { label: "Открытых инцид.",  value: 3,            suffix: "",      color: "#FFB800",  note: "↓2 vs пр. неделя" },
          { label: "Controls OK",      value: 4,            suffix: "/6",    color: "#00E7A7",  note: "67% покрытие" },
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

      {/* Risk Matrix + Overall Score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 20 }}>
        {/* Risk Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #FF547080, transparent)" }} />
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Матрица рисков</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Все активные риски — нажми для деталей и митигации</div>
          </div>
          <div style={{ padding: "0 8px 8px" }}>
            {RISK_MATRIX.map((risk, i) => (
              <motion.div key={risk.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                onClick={() => setActiveRisk(activeRisk === risk.id ? null : risk.id)}
                style={{ borderRadius: 12, margin: "6px 0", padding: "12px 16px", background: activeRisk === risk.id ? `rgba(${risk.rgb},0.08)` : "transparent", border: `1px solid ${activeRisk === risk.id ? risk.color + "40" : "transparent"}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `rgba(${risk.rgb},0.12)`, border: `1px solid rgba(${risk.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <risk.icon size={14} style={{ color: risk.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{risk.name}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: SEVERITY_MAP[risk.severity]?.bg, color: SEVERITY_MAP[risk.severity]?.color, fontWeight: 700 }}>{risk.severity}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{risk.trend}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{risk.category} · Владелец: {risk.owner}</div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: risk.color }}>{risk.prob}%</div>
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
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>Митигация:</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{risk.mitigation}</div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                          <button style={{ padding: "5px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700, border: "none", background: risk.color, color: "#fff", cursor: "pointer" }}>Назначить задачу</button>
                          <button style={{ padding: "5px 12px", borderRadius: 7, fontSize: 10, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Отложить</button>
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
            style={{ borderRadius: 18, padding: "20px", background: "rgba(255,84,112,0.05)", border: "1px solid rgba(255,84,112,0.12)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #FF547080, transparent)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Общий Risk Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 56, height: 56 }}>
                <RiskMeter value={overallScore} color="#FF5470" />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#FF5470" }}>{overallScore}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#FF5470", marginBottom: 3 }}>Умеренно высокий</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>2 критичных риска требуют немедленного внимания</div>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            style={{ borderRadius: 18, padding: "18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden", flex: 1 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00E7A740, transparent)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Контроли безопасности</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {CONTROLS.map((c, i) => {
                const ic = c.status === "ok" ? <CheckCircle size={12} style={{ color: "#00E7A7" }} /> : c.status === "warn" ? <AlertTriangle size={12} style={{ color: "#FFB800" }} /> : <Clock size={12} style={{ color: "rgba(255,255,255,0.3)" }} />;
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #FFB80060, transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={14} style={{ color: "#FFB800" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Live Incident Feed</div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: "rgba(255,84,112,0.15)", color: "#FF5470", fontWeight: 700 }}>LIVE</span>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.3)", background: "transparent", border: "none", cursor: "pointer" }}>
            <Eye size={11} />Все события
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {INCIDENTS.map((inc, i) => {
            const dot = inc.level === "ok" ? "#00E7A7" : inc.level === "warn" ? "#FFB800" : "#5A8DFF";
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
    </div>
  );
}
