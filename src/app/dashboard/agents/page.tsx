"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings2, ArrowRight } from "lucide-react";

// ─── Team data ────────────────────────────────────────────────────────────────
const AGENTS = [
  { ab: "CEO", name: "CEO Стратег",        dept: "Стратегия и планирование", desc: "Определяет стратегию, анализирует возможности, строит роадмапы.", st: "Анализирует",   c: "#818cf8", g: ["#6366f1", "#4f46e5"] },
  { ab: "MR",  name: "Market Researcher",  dept: "Рыночная разведка",        desc: "Исследует тренды рынка, конкурентов и инсайты клиентов.",         st: "Исследует",     c: "#60a5fa", g: ["#3b82f6", "#2563eb"] },
  { ab: "ME",  name: "Marketing Expert",   dept: "Рост и маркетинг",         desc: "Разрабатывает маркетинг-стратегии и кампании роста.",             st: "Создаёт",       c: "#34d399", g: ["#10b981", "#059669"] },
  { ab: "FA",  name: "Financial Analyst",  dept: "Финансы и анализ",         desc: "Анализирует финансы, строит прогнозы и считает ROI.",             st: "Считает",       c: "#2dd4bf", g: ["#14b8a6", "#0d9488"] },
  { ab: "SS",  name: "Sales Strategist",   dept: "Продажи и выручка",        desc: "Строит стратегии продаж, процессы и оптимизацию выручки.",        st: "Планирует",     c: "#fbbf24", g: ["#f59e0b", "#d97706"] },
  { ab: "OM",  name: "Operations Manager", dept: "Операции и процессы",      desc: "Оптимизирует операции, процессы и эффективность команды.",        st: "Оптимизирует",  c: "#fb923c", g: ["#f97316", "#ea580c"] },
  { ab: "PA",  name: "Product Advisor",    dept: "Продукт и инновации",      desc: "Советует по продуктовой стратегии, фичам и инновациям.",          st: "Оценивает",     c: "#c084fc", g: ["#a855f7", "#9333ea"] },
];

const ACTIVITY = [
  { c: "#c084fc", t: "Market Researcher",  s: "Проанализировал 15 конкурентов",   time: "2 мин назад" },
  { c: "#60a5fa", t: "Financial Analyst",  s: "Завершил прогноз ROI",             time: "3 мин назад" },
  { c: "#34d399", t: "Marketing Expert",   s: "Сгенерировал стратегии роста",     time: "4 мин назад" },
  { c: "#818cf8", t: "CEO Стратег",        s: "Обновил стратегический роадмап",   time: "5 мин назад" },
  { c: "#fbbf24", t: "Sales Strategist",   s: "Оптимизировал воронку продаж",     time: "6 мин назад" },
];

const STAGES = [
  { n: 1, t: "Анализ проблемы",     d: "Определение ключевых вызовов",     st: "done" },
  { n: 2, t: "Сбор данных",         d: "Сбор релевантных данных и фактов", st: "done" },
  { n: 3, t: "Анализ и рисёрч",     d: "Глубокий анализ и изучение рынка", st: "progress" },
  { n: 4, t: "Разработка стратегии",d: "Создание стратегий и решений",     st: "pending" },
  { n: 5, t: "Синтез решения",      d: "Сведение инсайтов в финальный отчёт", st: "pending" },
];

function useCountUp(to: number, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return v;
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
};

export default function AITeamPage() {
  const [tab, setTab] = useState(0);
  const eff = useCountUp(92, 1400);
  const r = 42, circ = 2 * Math.PI * r;
  const progress = 67;

  return (
    <div style={{ padding: "22px 24px 48px", maxWidth: 1440, margin: "0 auto" }}>
      <style>{`
        @keyframes ait-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes ait-hub { 0%,100%{box-shadow:0 0 30px rgba(99,102,241,.4)} 50%{box-shadow:0 0 55px rgba(99,102,241,.7)} }
        @keyframes ait-flow { to { stroke-dashoffset: -24; } }
        .ait-scroll::-webkit-scrollbar{height:6px}
        .ait-scroll::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:3px}
      `}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>AI Team</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>Ваши специализированные AI-агенты работают вместе</p>
        </div>
        <div className="term-mono" style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 13px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span className="term-blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#34d399" }}>СТАТУС КОМАНДЫ: АКТИВНА</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 18 }}>
        {["Обзор команды", "Сеть агентов", "Совместная работа", "Эффективность"].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: "10px 16px", fontSize: 12.5, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer",
            color: tab === i ? "#fff" : "rgba(255,255,255,0.35)",
            borderBottom: tab === i ? "2px solid #6366f1" : "2px solid transparent", marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px]" style={{ gap: 16 }}>
        {/* ── Left ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/* Working panel */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Ваша AI-команда работает</span>
                <span className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, padding: "3px 9px", borderRadius: 20, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", color: "#34d399", letterSpacing: ".08em" }}>
                  <span className="term-blink" style={{ width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} />LIVE
                </span>
              </div>
              <Link href="/dashboard/executives" style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                <Settings2 size={12} /> Настройки команды
              </Link>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Совместная работа в реальном времени</p>

            {/* Agent cards */}
            <div className="ait-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
              {AGENTS.map((a, i) => (
                <motion.div key={a.ab}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  style={{ flex: "0 0 150px", borderRadius: 14, padding: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 76, borderRadius: 10, marginBottom: 10, background: `linear-gradient(160deg, ${a.g[0]}30, #0b0c14 75%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg, ${a.g[0]}, ${a.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 18px ${a.g[0]}55, inset 0 1px 0 rgba(255,255,255,.3)` }}>
                      <span className="term-mono" style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{a.ab}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 9.5, color: `${a.c}cc`, marginBottom: 6 }}>{a.dept}</div>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.45, flex: 1 }}>{a.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 9, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: a.c, animation: "ait-pulse 1.6s infinite" }} />
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: a.c }}>{a.st}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Collaboration hub — converging flows */}
            <div style={{ position: "relative", marginTop: 4 }}>
              <svg viewBox="0 0 700 110" style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                  {AGENTS.map((a, i) => (
                    <linearGradient key={i} id={`hubg${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={a.c} stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
                    </linearGradient>
                  ))}
                </defs>
                {AGENTS.map((a, i) => {
                  const x = 50 + i * 100;
                  const d = `M${x},0 C${x},60 350,50 350,100`;
                  return (
                    <path key={i} d={d} fill="none" stroke={`url(#hubg${i})`} strokeWidth="1.6"
                      strokeDasharray="6 6" style={{ animation: `ait-flow ${1.2 + i * 0.12}s linear infinite` }} />
                  );
                })}
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -6 }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #a5b4fc, #4f46e5 70%)", display: "flex", alignItems: "center", justifyContent: "center", animation: "ait-hub 3s ease-in-out infinite" }}>
                  <span className="term-mono" style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>AI</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", marginTop: 10 }}>Хаб совместной работы</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>Синтез инсайтов и генерация комплексных решений</div>
              </div>
            </div>
          </motion.div>

          {/* Current workflow */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Текущий процесс</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Мультиагентная работа в процессе</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>Общий прогресс</span>
                <div style={{ width: 140, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                </div>
                <span className="term-value" style={{ fontSize: 13, fontWeight: 800, color: "#a5b4fc" }}>{progress}%</span>
              </div>
            </div>

            <div className="ait-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {STAGES.map((s, i) => {
                const done = s.st === "done", prog = s.st === "progress";
                return (
                  <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                      style={{
                        width: 168, borderRadius: 12, padding: "13px 14px",
                        background: prog ? "rgba(99,102,241,0.08)" : done ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)",
                        border: prog ? "1.5px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: prog ? "0 0 24px rgba(99,102,241,0.15)" : "none",
                      }}>
                      <div className="term-mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>ЭТАП {s.n}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.t}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.45, marginBottom: 9, height: 28 }}>{s.d}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: done ? "#34d399" : prog ? "#a5b4fc" : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                        {done ? "✓ Завершён" : prog ? <><span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8" }} />В процессе</> : "◷ Ожидает"}
                      </div>
                    </motion.div>
                    {i < STAGES.length - 1 && <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Right rail ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Activity */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Активность команды</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Живые обновления от вашей AI-команды</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {ACTIVITY.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}
                  style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.c, marginTop: 4, flexShrink: 0, boxShadow: `0 0 6px ${a.c}80` }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{a.t}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{a.s}</span>
                  </span>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{a.time}</span>
                </motion.div>
              ))}
            </div>
            <Link href="/dashboard/reports" style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 14, fontSize: 11, color: "#818cf8", textDecoration: "none" }}>
              Вся активность <ArrowRight size={11} />
            </Link>
          </motion.div>

          {/* Performance */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Эффективность команды</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>Текущая сессия</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
                  <motion.circle cx={50} cy={50} r={r} fill="none" stroke="#34d399" strokeWidth={7} strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${0.92 * circ} ${circ}` }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="term-value" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{eff}%</span>
                  <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", letterSpacing: ".06em" }}>ЭФФЕКТИВН.</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["7", "Активных агентов", "#34d399"], ["24", "Задач завершено", "#818cf8"], ["98%", "Оценка качества", "#c084fc"]].map(([v, l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c as string }} />
                    <span className="term-value" style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{v}</span>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Insights */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} style={{ ...card, padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Инсайты команды</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Ключевые выводы этой сессии</div>
            <div style={{ borderRadius: 12, padding: "13px 14px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" width="15" height="15"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Сильная рыночная возможность</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Анализ показывает 78% product-market fit с высоким потенциалом роста</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
