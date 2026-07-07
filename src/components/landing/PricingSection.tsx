"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const ACCENT     = "#6366f1";
const ACCENT_RGB = "99,102,241";

const PLANS = [
  {
    name:        "Starter",
    price:       { monthly: 0, annual: 0 },
    description: "Идеально для изучения вашей первой бизнес-идеи.",
    cta:         "Начать бесплатно",
    href:        "/register",
    features:    ["3 стратегических отчёта / мес.", "Все 8 AI-руководителей", "Экспорт в PDF", "Базовая финансовая модель", "Email-поддержка"],
    popular:     false,
  },
  {
    name:        "Pro",
    price:       { monthly: 49, annual: 39 },
    description: "Для основателей, создающих и запускающих бизнес.",
    cta:         "Попробовать Pro",
    href:        "/register",
    features:    ["Безлимитные стратегии", "Все 8 AI-руководителей", "Расширенный экспорт PDF", "Продвинутые финансовые модели", "Конкурентная разведка", "Приоритетная обработка", "Интеграция со Slack", "Приоритетная поддержка"],
    popular:     true,
  },
  {
    name:        "Agency",
    price:       { monthly: 149, annual: 119 },
    description: "Для агентств и консультантов с несколькими клиентами.",
    cta:         "Попробовать Agency",
    href:        "/register",
    features:    ["Всё из Pro", "Безлимитные проекты клиентов", "White-label отчёты", "Кастомный брендинг", "Командная работа", "API-доступ", "Персональный менеджер", "SLA-гарантия"],
    popular:     false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" style={{ position: "relative", padding: "96px 24px 112px", overflow: "hidden" }}>

      {/* Subtle background tint */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(${ACCENT_RGB},0.04) 0%, transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: 56 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 18px", borderRadius: 999, marginBottom: 24,
            border: `1px solid rgba(${ACCENT_RGB},0.28)`,
            background: `rgba(${ACCENT_RGB},0.07)`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, display: "block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: `rgba(${ACCENT_RGB},0.9)` }}>
              Тарифы
            </span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 14px", color: "#fff" }}>
            Инвестируй в бизнес,<br />не в консалтинг
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.35)", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.65 }}>
            Стратегический анализ, который обычно стоит тысячи долларов и недели работы — за минуты и меньше стоимости бизнес-ланча.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 4, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([
              { key: false, label: "Ежемесячно" },
              { key: true,  label: "Ежегодно" },
            ] as const).map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setAnnual(opt.key)}
                style={{
                  position: "relative",
                  padding: "6px 16px",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                  color: annual === opt.key ? "#fff" : "rgba(255,255,255,0.38)",
                  transition: "color 0.15s",
                }}
              >
                {annual === opt.key && (
                  <motion.span
                    layoutId="pricing-pill"
                    style={{ position: "absolute", inset: 0, borderRadius: 9, background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`, boxShadow: `0 2px 10px rgba(${ACCENT_RGB},0.3)` }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {opt.label}
                  {opt.key && (
                    <span style={{ marginLeft: 8, fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "rgba(16,185,129,0.18)", color: "#10b981", fontWeight: 700, letterSpacing: "0.04em" }}>
                      −20%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12, alignItems: "start" }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.22 } }}
              style={{
                position: "relative",
                borderRadius: 20,
                padding: plan.popular ? "28px 24px 24px" : "24px 22px 22px",
                background: plan.popular ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.025)",
                border: plan.popular ? `1px solid rgba(${ACCENT_RGB},0.28)` : "1px solid rgba(255,255,255,0.07)",
                boxShadow: plan.popular
                  ? `0 4px 32px rgba(${ACCENT_RGB},0.12), 0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`
                  : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {/* Popular top bevel */}
              {plan.popular && (
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, rgba(${ACCENT_RGB},0.6), transparent)` }} />
              )}

              {plan.popular && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  alignSelf: "flex-start", marginBottom: 16,
                  padding: "4px 10px", borderRadius: 999,
                  background: `rgba(${ACCENT_RGB},0.12)`,
                  border: `1px solid rgba(${ACCENT_RGB},0.28)`,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: `rgba(${ACCENT_RGB},0.95)`,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT, display: "block" }} />
                  Популярный
                </div>
              )}

              {/* Name + description */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>{plan.description}</p>
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  ${annual ? plan.price.annual : plan.price.monthly}
                </span>
                {plan.price.monthly > 0 && (
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>/мес.</span>
                )}
              </div>

              {/* Features */}
              <ul style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, margin: "0 0 24px", padding: 0, listStyle: "none" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: plan.popular ? `rgba(${ACCENT_RGB},0.18)` : "rgba(255,255,255,0.06)",
                      border: plan.popular ? `1px solid rgba(${ACCENT_RGB},0.28)` : "1px solid rgba(255,255,255,0.1)",
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={plan.popular ? ACCENT : "rgba(255,255,255,0.5)"} strokeWidth="2.5" width="9" height="9">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.58)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600,
                  textDecoration: "none", transition: "all 0.18s",
                  ...(plan.popular ? {
                    background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                    color: "#fff",
                    boxShadow: `0 4px 18px rgba(${ACCENT_RGB},0.32), inset 0 1px 0 rgba(255,255,255,0.16)`,
                  } : {
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.62)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }),
                }}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <motion.div
          style={{ marginTop: 32, textAlign: "center" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" width="15" height="15">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            14-дневная гарантия возврата средств — без вопросов
          </div>
        </motion.div>

      </div>
    </section>
  );
}
