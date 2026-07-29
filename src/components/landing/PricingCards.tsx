"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { PLANS, type Plan, type PlanFeatures } from "@/lib/plans";

// ─── Три тарифа: Starter $29 / Pro $39 / Max $49 ──────────────────────────────
// Данные из src/lib/plans.ts. Три премиум-инструмента (питч-дек, «Цели и план»,
// «Фокус недели») открываются с Pro — это и есть причина апгрейда со Starter.
//
// Анимации по дизайн-системе Apex: появление fade-up со stagger, левитация на
// hover (пружина), count-up цены, живое свечение у популярного тарифа. Всё —
// с веткой prefers-reduced-motion (статичное финальное состояние).

const ACCENT = "#6366f1";
const RGB = "99,102,241";

const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURE_ROWS: { key: keyof PlanFeatures; label: string }[] = [
  { key: "boardMeetings", label: "Совет из 20 AI-директоров" },
  { key: "strategies",    label: "Генерация стратегий" },
  { key: "agents",        label: "Библиотека AI-агентов" },
  { key: "webResearch",   label: "Свежие данные с рынка" },
  { key: "pitchDeck",     label: "Питч-дек для инвестора" },
  { key: "goalsPlan",     label: "Студия «Цели и план»" },
  { key: "weeklyFocus",   label: "Трекер целей + «Фокус недели»" },
];

function limitText(v: number | null): string {
  return v === null ? "без лимита" : v === 0 ? "—" : String(v);
}

// Count-up числа цены при появлении.
function Price({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) { setN(value); return; }
    const controls = animate(0, value, {
      duration: 0.9, ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
      ${n}
    </span>
  );
}

export function PricingCards() {
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-80px" });

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 96px" }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ textAlign: "center", marginBottom: 44 }}
      >
        <h1 style={{ fontSize: "clamp(30px,5vw,46px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>
          Простые тарифы, честные лимиты
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          На Starter открыт весь продукт, кроме трёх премиум-инструментов. Pro открывает их, Max — те же функции с лимитами в разы больше.
        </p>
      </motion.div>

      {/* Карточки */}
      <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, alignItems: "start" }}>
        {PLANS.map((plan: Plan, i) => {
          const hot = plan.highlight;
          return (
            <motion.div
              key={plan.id}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={gridInView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : i * 0.1 }}
              whileHover={reduce ? undefined : { y: -8, transition: { type: "spring", stiffness: 300, damping: 22 } }}
              style={{
                position: "relative", borderRadius: 20, padding: "26px 24px 28px",
                background: hot ? `linear-gradient(180deg, rgba(${RGB},0.12), rgba(${RGB},0.03))` : "rgba(255,255,255,0.025)",
                border: hot ? `1px solid rgba(${RGB},0.5)` : "1px solid rgba(255,255,255,0.08)",
                boxShadow: hot ? `0 12px 40px rgba(${RGB},0.2)` : "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.18)",
                overflow: "hidden",
              }}
            >
              {/* Живое свечение у популярного тарифа */}
              {hot && !reduce && (
                <motion.div
                  aria-hidden
                  animate={{ opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", top: -60, left: "50%", width: 260, height: 160, transform: "translateX(-50%)", borderRadius: "50%", background: `radial-gradient(circle, rgba(${RGB},0.5), transparent 70%)`, filter: "blur(40px)", pointerEvents: "none", zIndex: 0 }}
                />
              )}

              <div style={{ position: "relative", zIndex: 1 }}>
                {hot && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, color: "#fff", whiteSpace: "nowrap", boxShadow: `0 4px 14px rgba(${RGB},0.5)` }}>
                    Популярный
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: hot ? 8 : 0 }}>{plan.name}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 3, minHeight: 34 }}>{plan.tagline}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0 18px" }}>
                  <Price value={plan.priceMonthly} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/мес</span>
                </div>

                <motion.div whileHover={reduce ? undefined : { scale: 1.02 }} whileTap={reduce ? undefined : { scale: 0.98 }}>
                  <Link
                    href="/register"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12,
                      fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff",
                      background: hot ? `linear-gradient(135deg,${ACCENT},#4f46e5)` : "rgba(255,255,255,0.06)",
                      border: hot ? "none" : "1px solid rgba(255,255,255,0.12)",
                      boxShadow: hot ? `0 6px 20px rgba(${RGB},0.35), inset 0 1px 0 rgba(255,255,255,0.16)` : "none",
                    }}
                  >
                    Выбрать {plan.name}
                  </Link>
                </motion.div>

                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.perks.map((perk, j) => (
                    <motion.div
                      key={j}
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      animate={gridInView ? { opacity: 1, x: 0 } : undefined}
                      transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : i * 0.1 + 0.25 + j * 0.05 }}
                      style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.72)" }}
                    >
                      <Check size={15} style={{ color: "#34d399", flexShrink: 0, marginTop: 1 }} />
                      <span>{perk}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Таблица сравнения */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ marginTop: 56, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "16px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Что входит</th>
                {PLANS.map(p => (
                  <th key={p.id} style={{ padding: "16px 12px", fontSize: 13.5, fontWeight: 700, color: p.highlight ? "#c7d2fe" : "#fff", textAlign: "center" }}>
                    {p.name}<br /><span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>${p.priceMonthly}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map(row => (
                <tr key={row.key} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "13px 20px", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}>{row.label}</td>
                  {PLANS.map(p => (
                    <td key={p.id} style={{ padding: "13px 12px", textAlign: "center" }}>
                      {p.features[row.key]
                        ? <Check size={17} style={{ color: "#34d399" }} />
                        : <Minus size={16} style={{ color: "rgba(255,255,255,0.2)" }} />}
                    </td>
                  ))}
                </tr>
              ))}
              {([
                ["AI-сообщения / мес", "aiMessages"],
                ["Питч-деки / мес", "pitchDecks"],
                ["Стратегии / мес", "strategies"],
                ["Заседания совета / мес", "boardMeetings"],
                ["«Фокус недели» / мес", "weeklyFocus"],
              ] as const).map(([label, key]) => (
                <tr key={key} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "13px 20px", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}>{label}</td>
                  {PLANS.map(p => (
                    <td key={p.id} style={{ padding: "13px 12px", textAlign: "center", fontSize: 13, fontWeight: 600, color: limitText(p.limits[key]) === "—" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums" }}>
                      {limitText(p.limits[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
        Отмена в любой момент. Лимиты обновляются каждый месяц.
      </p>
    </section>
  );
}
