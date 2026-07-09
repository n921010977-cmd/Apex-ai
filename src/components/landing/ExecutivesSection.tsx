"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const RGB = "99,102,241";

// ─── Org data: hub (CEO) + two orbit rings ────────────────────────────────────
type Agent = {
  id: string; abbr: string; role: string; color: string;
  ring: 1 | 2;
  input: string;      // что получает
  analyzes: string;   // что анализирует
  output: string;     // что отдаёт и кому
};

const CEO = {
  id: "ceo", abbr: "CEO", role: "Генеральный директор", color: "#818cf8",
  input: "Выводы всех 19 агентов, включая конфликтующие позиции",
  analyzes: "Противоречия между департаментами, приоритеты, риск/потенциал",
  output: "Единая стратегия с решением, условиями и планом на 90 дней — вам",
};

const AGENTS: Agent[] = [
  // ── inner ring: C-suite ──
  { id: "cfo",  abbr: "CFO",  role: "Финансовый директор",    color: "#3b82f6", ring: 1, input: "Цены, издержки, данные рынка от Аналитика", analyzes: "Unit-экономику, LTV/CAC, точку безубыточности, burn", output: "Финмодель и лимиты бюджета → CEO, CMO" },
  { id: "cmo",  abbr: "CMO",  role: "Директор по маркетингу", color: "#10b981", ring: 1, input: "Сегменты и конкурентов от Аналитика, лимиты от CFO", analyzes: "Каналы привлечения, позиционирование, CAC по каналам", output: "GTM-стратегия и воронка → CEO, Продажи" },
  { id: "coo",  abbr: "COO",  role: "Операционный директор",  color: "#f59e0b", ring: 1, input: "Стратегию CEO, ограничения CFO", analyzes: "Процессы, найм, операционные узкие места", output: "Роадмап запуска 30/90 дней → CEO, HR" },
  { id: "cto",  abbr: "CTO",  role: "Технический директор",   color: "#d946ef", ring: 1, input: "Требования продукта от CPO", analyzes: "Стек, архитектуру, сроки и стоимость разработки", output: "Тех-план и оценка MVP → CEO, VP Eng" },
  { id: "cpo",  abbr: "CPO",  role: "Директор по продукту",   color: "#a78bfa", ring: 1, input: "Боли пользователей от UX, данные рынка", analyzes: "Приоритеты фич, product-market fit, retention", output: "Продуктовый роадмап → CTO, CEO" },
  { id: "ba",   abbr: "BA",   role: "Бизнес-аналитик",        color: "#f97316", ring: 1, input: "Вашу идею и описание рынка", analyzes: "TAM/SAM/SOM, конкурентов, тренды, ниши", output: "Рыночные данные → CFO, CMO, CEO" },
  { id: "law",  abbr: "LAW",  role: "Юридический советник",   color: "#94a3b8", ring: 1, input: "Бизнес-модель и географию работы", analyzes: "Структуру, IP, регуляторные требования", output: "Юр-риски и требования → CEO, CISO" },
  // ── outer ring ──
  { id: "sale", abbr: "SD",   role: "Директор по продажам",   color: "#34d399", ring: 2, input: "Воронку и сегменты от CMO", analyzes: "Цикл сделки, ценообразование, скрипты", output: "План продаж → CEO" },
  { id: "grw",  abbr: "GRW",  role: "Growth-хакер",           color: "#fb923c", ring: 2, input: "Воронку от CMO, метрики продукта", analyzes: "Точки роста, виральные петли, A/B-гипотезы", output: "Growth-эксперименты → CMO" },
  { id: "ciso", abbr: "SEC",  role: "Директор по безопасности", color: "#ef4444", ring: 2, input: "Архитектуру от CTO, юр-требования", analyzes: "Угрозы, защиту данных, комплаенс", output: "Требования безопасности → CTO" },
  { id: "hr",   abbr: "HR",   role: "Директор по персоналу",  color: "#f472b6", ring: 2, input: "План найма от COO", analyzes: "Роли, компенсации, культуру", output: "Орг-структура и план найма → COO" },
  { id: "cdo",  abbr: "CDO",  role: "Директор по данным",     color: "#06b6d4", ring: 2, input: "Метрики продукта и воронки", analyzes: "North Star, аналитику, ML-возможности", output: "Data-стратегия → CPO, CEO" },
  { id: "vpe",  abbr: "VPE",  role: "VP инженерии",           color: "#84cc16", ring: 2, input: "Тех-план от CTO", analyzes: "Команду, процессы разработки, сроки", output: "План спринтов → CTO" },
  { id: "ir",   abbr: "IR",   role: "Инвестор-отношения",     color: "#a855f7", ring: 2, input: "Финмодель от CFO, стратегию CEO", analyzes: "Инвест-привлекательность, мультипликаторы", output: "Питч-структура → CEO" },
  { id: "brd",  abbr: "BRD",  role: "Бренд-стратег",          color: "#e879f9", ring: 2, input: "Позиционирование от CMO", analyzes: "Айдентику, tone of voice, отличие от конкурентов", output: "Бренд-платформа → CMO" },
  { id: "cs",   abbr: "CS",   role: "Customer Success",       color: "#4ade80", ring: 2, input: "Продукт и сегменты", analyzes: "Onboarding, churn-триггеры, NPS", output: "Retention-план → CPO, CMO" },
  { id: "ds",   abbr: "DS",   role: "Data-сайентист",         color: "#22d3ee", ring: 2, input: "Сырые данные и метрики от CDO", analyzes: "Прогнозы, сегментацию, LTV-модели", output: "Модели и прогнозы → CDO, CFO" },
  { id: "inv",  abbr: "INV",  role: "Инвест-аналитик",        color: "#fde68a", ring: 2, input: "Финмодель, сравнимые сделки", analyzes: "ROI, оценку, сценарии выхода", output: "Инвест-оценка → IR, CEO" },
  { id: "str",  abbr: "STR",  role: "Стратег-консультант",    color: "#c4b5fd", ring: 2, input: "Всю картину рынка и продукта", analyzes: "Moat, blue ocean, горизонты роста", output: "Долгосрочная стратегия → CEO" },
];

// ─── Layout math ──────────────────────────────────────────────────────────────
const W = 860, H = 600, CX = W / 2, CY = H / 2 - 10;
const R1 = 140, R2 = 240;

function pos(a: Agent, idx: number, ringItems: Agent[]) {
  const n = ringItems.length;
  const start = a.ring === 1 ? -90 : -90 + 180 / n; // offset outer ring
  const angle = ((start + (360 / n) * idx) * Math.PI) / 180;
  const r = a.ring === 1 ? R1 : R2;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

const ring1 = AGENTS.filter(a => a.ring === 1);
const ring2 = AGENTS.filter(a => a.ring === 2);
const POS: Record<string, { x: number; y: number }> = {};
ring1.forEach((a, i) => { POS[a.id] = pos(a, i, ring1); });
ring2.forEach((a, i) => { POS[a.id] = pos(a, i, ring2); });

// ─── Section ──────────────────────────────────────────────────────────────────
export function ExecutivesSection() {
  const [sel, setSel] = useState<string>("cfo");
  const selected = sel === "ceo" ? { ...CEO } : AGENTS.find(a => a.id === sel)!;

  return (
    <section id="executives" style={{ position: "relative", padding: "96px 24px 100px", overflow: "hidden" }}>
      <style>{`
        @keyframes org-dash { to { stroke-dashoffset: -14; } }
        @keyframes org-pulse { 0%,100%{opacity:0.55} 50%{opacity:1} }
      `}</style>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 70% 55% at 50% 45%, rgba(${RGB},0.05), transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 36 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 22, border: `1px solid rgba(${RGB},0.25)`, background: `rgba(${RGB},0.05)` }}>
            <span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(165,180,252,0.9)" }}>// орг-структура · 20 агентов</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Это не список. Это организация
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
            Кликните на любого агента — увидите, что он получает, что анализирует и кому передаёт результат.
          </p>
        </motion.div>

        {/* ── Org canvas + dossier panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
          style={{ gap: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(9,10,16,0.75)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}
        >
          {/* Canvas */}
          <div style={{ overflowX: "auto", overflowY: "hidden" }}>
            <div style={{ width: W, height: H, position: "relative", margin: "0 auto" }}>
              {/* orbit guides + edges */}
              <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <circle cx={CX} cy={CY} r={R1} fill="none" stroke="rgba(255,255,255,0.045)" strokeDasharray="2 6" />
                <circle cx={CX} cy={CY} r={R2} fill="none" stroke="rgba(255,255,255,0.035)" strokeDasharray="2 6" />
                {AGENTS.map(a => {
                  const p = POS[a.id];
                  const active = sel === a.id;
                  return (
                    <g key={a.id}>
                      <line x1={CX} y1={CY} x2={p.x} y2={p.y}
                        stroke={active ? a.color : `rgba(${RGB},0.12)`}
                        strokeWidth={active ? 1.6 : 1}
                        strokeDasharray={active ? "5 5" : "none"}
                        style={active ? { animation: "org-dash 0.7s linear infinite" } : { transition: "stroke 0.3s" }} />
                      {active && (
                        <circle r="3" fill={a.color}>
                          <animateMotion dur="1.4s" repeatCount="indefinite" path={`M${p.x},${p.y} L${CX},${CY}`} />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* CEO hub */}
              <button onClick={() => setSel("ceo")} aria-label="CEO"
                style={{
                  position: "absolute", left: CX - 42, top: CY - 42, width: 84, height: 84,
                  borderRadius: 24, cursor: "pointer",
                  background: sel === "ceo" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(99,102,241,0.14)",
                  border: `1.5px solid rgba(${RGB},${sel === "ceo" ? 0.9 : 0.45})`,
                  boxShadow: sel === "ceo" ? `0 0 40px rgba(${RGB},0.45)` : `0 0 24px rgba(${RGB},0.18)`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  transition: "all 0.25s", zIndex: 5, animation: "org-pulse 3.5s ease-in-out infinite",
                }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span className="term-mono" style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>CEO</span>
              </button>

              {/* Agents */}
              {AGENTS.map(a => {
                const p = POS[a.id];
                const active = sel === a.id;
                const size = a.ring === 1 ? 52 : 44;
                return (
                  <button key={a.id} onClick={() => setSel(a.id)} aria-label={a.role} title={a.role}
                    style={{
                      position: "absolute", left: p.x - size / 2, top: p.y - size / 2,
                      width: size, height: size, borderRadius: a.ring === 1 ? 15 : 13, cursor: "pointer",
                      background: active ? `${a.color}26` : "rgba(255,255,255,0.035)",
                      border: `1.5px solid ${active ? a.color : `${a.color}55`}`,
                      boxShadow: active ? `0 0 24px ${a.color}55` : "0 2px 10px rgba(0,0,0,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.22s", zIndex: 4,
                      transform: active ? "scale(1.12)" : "scale(1)",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.transform = "scale(1.08)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.transform = "scale(1)"; }}>
                    <span className="term-mono" style={{ fontSize: a.ring === 1 ? 11 : 9.5, fontWeight: 800, color: active ? a.color : "rgba(255,255,255,0.75)", letterSpacing: "0.04em" }}>
                      {a.abbr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Dossier panel ── */}
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", display: "flex", flexDirection: "column" }}>
            <div className="term-mono" style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              // досье агента
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={sel}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ padding: "20px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${selected.color}1c`, border: `1.5px solid ${selected.color}66` }}>
                    <span className="term-mono" style={{ fontSize: 12, fontWeight: 800, color: selected.color }}>{"abbr" in selected ? (selected as Agent).abbr : "CEO"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{selected.role}</div>
                    <div className="term-mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "#34d399", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <span className="term-blink" style={{ width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} />ONLINE
                    </div>
                  </div>
                </div>

                {[
                  { k: "ПОЛУЧАЕТ", v: selected.input, icon: "↓" },
                  { k: "АНАЛИЗИРУЕТ", v: selected.analyzes, icon: "◈" },
                  { k: "ОТДАЁТ", v: selected.output, icon: "↗" },
                ].map(row => (
                  <div key={row.k}>
                    <div className="term-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: `${selected.color}cc`, marginBottom: 6 }}>
                      {row.icon} {row.k}
                    </div>
                    <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.6, margin: 0, paddingLeft: 12, borderLeft: `2px solid ${selected.color}40` }}>
                      {row.v}
                    </p>
                  </div>
                ))}

                <div style={{ marginTop: "auto" }}>
                  <Link href={`/chat?agent=${encodeURIComponent(selected.role)}`} className="term-mono"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      height: 42, borderRadius: 11, textDecoration: "none",
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      background: `linear-gradient(135deg, #6366f1, #4f46e5)`, color: "#fff",
                      boxShadow: `0 5px 18px rgba(${RGB},0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}>
                    ▸ Обсудить с агентом
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
