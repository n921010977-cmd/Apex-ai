"use client";

import Link from "next/link";
import { Lock, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { usePlan } from "@/lib/use-plan";
import { PLANS, type PlanFeatures } from "@/lib/plans";
import { trackEvent } from "@/lib/track-client";

// ─── Замок на премиум-инструмент ──────────────────────────────────────────────
// Оборачивает страницу премиум-функции. Если тариф её не открывает (или не
// куплен вовсе) — вместо инструмента показываем экран с замком и апселлом на
// нужный тариф. Логика доступа — единая, из src/lib/plans.ts.

const ACCENT = "#6366f1";
const RGB = "99,102,241";

const FEATURE_TITLE: Record<keyof PlanFeatures, string> = {
  pitchDeck: "Питч-дек для инвестора",
  goalsPlan: "Студия «Цели и план»",
  weeklyFocus: "Трекер целей и «Фокус недели»",
  strategies: "Генерация стратегий",
  boardMeetings: "Совет из 20 AI-директоров",
  agents: "Библиотека AI-агентов",
  webResearch: "Свежие данные с рынка",
};

/** Минимальный тариф, который открывает эту возможность. */
function minPlanFor(feature: keyof PlanFeatures) {
  return PLANS.find(p => p.features[feature]) ?? PLANS[PLANS.length - 1];
}

export function PlanGate({
  feature,
  children,
}: {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
}) {
  const { allows } = usePlan();
  if (allows(feature)) return <>{children}</>;

  const needed = minPlanFor(feature);
  const title = FEATURE_TITLE[feature];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 22,
          background: `linear-gradient(180deg, rgba(${RGB},0.08), rgba(${RGB},0.02))`,
          border: `1px solid rgba(${RGB},0.25)`,
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
            boxShadow: `0 12px 32px rgba(${RGB},0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          <Lock size={26} color="#fff" />
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(129,140,248,0.9)", marginBottom: 8 }}>
          Премиум-инструмент
        </div>
        <h1 style={{ fontSize: "clamp(24px,4vw,32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>
          {title}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Этот инструмент открывается на тарифе <b style={{ color: "#fff" }}>{needed.name}</b> (${needed.priceMonthly}/мес).
          Оформите тариф — и вкладка разблокируется.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340, margin: "0 auto 28px", textAlign: "left" }}>
          {needed.perks.slice(0, 4).map((perk, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}>
              <Check size={15} style={{ color: "#34d399", flexShrink: 0, marginTop: 2 }} />
              <span>{perk}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/billing"
          onClick={() => trackEvent("upgrade_clicked", { feature, required: needed.id })}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 50, padding: "0 28px", borderRadius: 13,
            fontSize: 15, fontWeight: 700, textDecoration: "none", color: "#fff",
            background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
            boxShadow: `0 8px 24px rgba(${RGB},0.4), inset 0 1px 0 rgba(255,255,255,0.16)`,
          }}
        >
          <Sparkles size={17} /> Открыть за ${needed.priceMonthly}/мес
        </Link>
      </motion.div>
    </div>
  );
}
