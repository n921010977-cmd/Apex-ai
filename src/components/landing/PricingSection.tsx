"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { checkoutUrl, type PaidPlanId } from "@/lib/billing";

const ACCENT     = "#6366f1";
const ACCENT_RGB = "99,102,241";

// ─── Plan model ───────────────────────────────────────────────────────────────
const PLANS = {
  starter: {
    id: "starter", name: "Starter", monthly: 0, annual: 0,
    tagline: "Для проверки первой идеи",
    features: ["3 стратегии / мес.", "Все 20 AI-директоров", "Экспорт в PDF", "Базовая финмодель"],
  },
  pro: {
    id: "pro", name: "Pro", monthly: 49, annual: 39,
    tagline: "Для основателей, которые строят",
    features: ["Безлимитные стратегии", "Все 20 AI-директоров", "Продвинутые финмодели", "Конкурентная разведка", "Приоритетная обработка", "Slack-интеграция"],
  },
  agency: {
    id: "agency", name: "Agency", monthly: 149, annual: 119,
    tagline: "Для агентств и консультантов",
    features: ["Всё из Pro", "Безлимит клиентских проектов", "White-label отчёты", "API-доступ", "Персональный менеджер", "SLA-гарантия"],
  },
} as const;

type PlanId = keyof typeof PLANS;

export function PricingSection() {
  const [annual, setAnnual]       = useState(true);
  const [strategies, setStrategies] = useState(4);   // стратегий в месяц
  const [clients, setClients]     = useState(1);     // клиентских проектов
  const [whiteLabel, setWhiteLabel] = useState(false);

  // ── Recommendation engine ──
  const rec: PlanId = useMemo(() => {
    if (whiteLabel || clients > 1) return "agency";
    if (strategies > 3) return "pro";
    return "starter";
  }, [strategies, clients, whiteLabel]);

  const plan = PLANS[rec];
  const price = annual ? plan.annual : plan.monthly;

  const Row = ({ label, value, children }: { label: string; value: string; children: React.ReactNode }) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span className="term-mono" style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>{value}</span>
      </div>
      {children}
    </div>
  );

  return (
    <section id="pricing" style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(${ACCENT_RGB},0.04) 0%, transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 48 }}
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div className="term-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, marginBottom: 24, border: `1px solid rgba(${ACCENT_RGB},0.25)`, background: `rgba(${ACCENT_RGB},0.05)` }}>
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.85)` }}>// калькулятор тарифа</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Соберите свой тариф
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>
            Ответьте на три вопроса — мы посчитаем, что вам нужно. Без таблиц сравнения на 40 строк.
          </p>
        </motion.div>

        {/* Configurator */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(10,11,18,0.7)", backdropFilter: "blur(20px)", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}
        >
          {/* Terminal title bar */}
          <div className="term-mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <span style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>apex — pricing configurator</span>
            {/* Billing toggle */}
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {([{ k: false, l: "МЕС" }, { k: true, l: "ГОД −20%" }] as const).map(o => (
                <button key={String(o.k)} onClick={() => setAnnual(o.k)} style={{
                  position: "relative", padding: "4px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", border: "none", cursor: "pointer", background: "transparent",
                  color: annual === o.k ? "#fff" : "rgba(255,255,255,0.35)", transition: "color 0.15s",
                }}>
                  {annual === o.k && (
                    <motion.span layoutId="cfg-billing" style={{ position: "absolute", inset: 0, borderRadius: 7, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)` }} transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{o.l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 0 }}>
            {/* ── Left: controls ── */}
            <div style={{ padding: "28px 28px 30px", display: "flex", flexDirection: "column", gap: 24, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <Row label="Сколько стратегий в месяц?" value={strategies >= 20 ? "20+" : String(strategies)}>
                <input type="range" min={1} max={20} step={1} value={strategies}
                  onChange={e => setStrategies(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: ACCENT, cursor: "pointer" }} />
                <div className="term-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                  <span>1</span><span>бесплатно до 3</span><span>20+</span>
                </div>
              </Row>

              <Row label="Сколько клиентских проектов?" value={clients >= 10 ? "10+" : String(clients)}>
                <input type="range" min={1} max={10} step={1} value={clients}
                  onChange={e => setClients(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: ACCENT, cursor: "pointer" }} />
                <div className="term-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                  <span>только свой</span><span>клиенты = Agency</span>
                </div>
              </Row>

              {/* White-label toggle */}
              <button onClick={() => setWhiteLabel(w => !w)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                background: whiteLabel ? `rgba(${ACCENT_RGB},0.1)` : "rgba(255,255,255,0.03)",
                border: whiteLabel ? `1px solid rgba(${ACCENT_RGB},0.4)` : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s",
              }}>
                <span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>White-label отчёты</span>
                  <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Ваш бренд вместо Apex AI</span>
                </span>
                <span style={{
                  width: 40, height: 22, borderRadius: 999, position: "relative", flexShrink: 0,
                  background: whiteLabel ? ACCENT : "rgba(255,255,255,0.1)", transition: "background 0.2s",
                }}>
                  <span style={{
                    position: "absolute", top: 3, left: whiteLabel ? 21 : 3,
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s cubic-bezier(0.22,1,0.36,1)",
                  }} />
                </span>
              </button>
            </div>

            {/* ── Right: live quote ── */}
            <div style={{ padding: "28px 28px 30px", background: `rgba(${ACCENT_RGB},0.04)`, display: "flex", flexDirection: "column" }}>
              <div className="term-mono" style={{ fontSize: 9.5, letterSpacing: "0.16em", color: `rgba(${ACCENT_RGB},0.8)`, textTransform: "uppercase", marginBottom: 14 }}>
                &gt; рекомендованный тариф
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={rec + String(annual)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                    <span className="term-mono" style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "0.01em" }}>{plan.name.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{plan.tagline}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0 20px" }}>
                    <span className="term-value" style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1 }}>${price}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>/мес.{annual && price > 0 ? " при оплате за год" : ""}</span>
                  </div>

                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: "0 0 24px", padding: 0, listStyle: "none", flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                        <span className="term-mono" style={{ color: ACCENT, fontSize: 11 }}>▸</span>{f}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.id === "starter" ? "/register" : checkoutUrl(plan.id as PaidPlanId)} className="term-mono" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    height: 48, borderRadius: 12, textDecoration: "none",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff",
                    background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                    boxShadow: `0 6px 20px rgba(${ACCENT_RGB},0.3), inset 0 1px 0 rgba(255,255,255,0.16)`,
                  }}>
                    {price === 0 ? `▸ Начать с ${plan.name} — бесплатно` : `▸ Оформить ${plan.name}`}
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footnote */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          className="term-mono"
          style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}
        >
          все тарифы включают 20 AI-директоров · 14 дней возврат без вопросов · отмена в один клик
        </motion.div>

      </div>
    </section>
  );
}
