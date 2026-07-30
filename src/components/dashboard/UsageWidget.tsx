"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gauge, Sparkles, ArrowUpRight, Presentation, Target, Flag, Users, CreditCard } from "lucide-react";
import { PLAN_BY_ID, type PlanId } from "@/lib/plans";

// ─── Живой виджет на дашборде: расход лимитов + «что делать дальше» ────────────
// Тянет реальные квоты из /api/usage и подбирает следующий полезный шаг по
// состоянию тарифа и расхода. Не статичная витрина, а рабочая панель.

const ACCENT = "#6366f1";
const RGB = "99,102,241";

type Q = { used: number; limit: number | null; remaining: number | null };
type UsageResp = { success: boolean; plan: PlanId | "none"; usage: Record<string, Q> };

const METERS: { key: string; label: string }[] = [
  { key: "aiMessages", label: "Сообщения" },
  { key: "strategies", label: "Стратегии" },
  { key: "boardMeetings", label: "Совет" },
  { key: "pitchDecks", label: "Питч-деки" },
];

type Step = { label: string; href: string; icon: typeof Target; tone?: "accent" | "warn" };

export function UsageWidget() {
  const [data, setData] = useState<UsageResp | null>(null);

  useEffect(() => {
    fetch("/api/usage", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {});
  }, []);

  const plan = data?.plan ?? "none";
  const planName = plan === "none" ? "Без тарифа" : PLAN_BY_ID[plan].name;

  // Подбор следующего шага по состоянию.
  const steps: Step[] = [];
  if (data) {
    if (plan === "none") {
      steps.push({ label: "Оформи тариф — откроются питч-дек и планирование", href: "/dashboard/billing", icon: CreditCard, tone: "accent" });
    }
    // квота на грани
    const near = METERS.find(m => { const q = data.usage[m.key]; return q && q.limit && q.limit > 0 && q.used / q.limit >= 0.8; });
    if (near) steps.push({ label: `Лимит «${near.label}» почти исчерпан — обнови тариф`, href: "/dashboard/billing", icon: ArrowUpRight, tone: "warn" });

    // контекстные действия
    const allows = (k: string) => plan !== "none" && PLAN_BY_ID[plan].features[k as keyof typeof PLAN_BY_ID.starter.features];
    if (allows("pitchDeck")) steps.push({ label: "Собери питч-дек для инвестора", href: "/dashboard/pitch", icon: Presentation });
    if (allows("goalsPlan")) steps.push({ label: "Построй план 30/60/90", href: "/dashboard/tools", icon: Target });
    steps.push({ label: "Проведи заседание совета директоров", href: "/dashboard/executives", icon: Users });
    if (allows("weeklyFocus")) steps.push({ label: "Задай цель и получи фокус недели", href: "/dashboard/goals", icon: Flag });
  }
  const topSteps = steps.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 14, marginBottom: 20 }}
      className="usage-widget"
    >
      {/* Расход лимитов */}
      <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Gauge size={15} style={{ color: "#a5b4fc" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Расход за месяц</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, color: plan === "none" ? "rgba(255,255,255,0.5)" : "#c7d2fe", background: plan === "none" ? "rgba(255,255,255,0.05)" : `rgba(${RGB},0.14)`, border: plan === "none" ? "1px solid rgba(255,255,255,0.1)" : `1px solid rgba(${RGB},0.3)` }}>{planName}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px" }}>
          {METERS.map(m => {
            const q = data?.usage[m.key];
            const unlimited = q?.limit === null;
            const na = q?.limit === 0;
            const pct = !q || na ? 0 : unlimited ? 12 : Math.min(100, Math.round((q.used / (q.limit || 1)) * 100));
            const danger = !!q && !unlimited && !na && q.limit! > 0 && pct >= 80;
            return (
              <div key={m.key} style={{ opacity: na ? 0.4 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>{m.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: danger ? "#fbbf24" : "rgba(255,255,255,0.75)", fontVariantNumeric: "tabular-nums" }}>
                    {!q ? "—" : na ? "—" : `${q.used}/${unlimited ? "∞" : q.limit}`}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: danger ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : `linear-gradient(90deg,${ACCENT},#818cf8)`, transition: "width .7s cubic-bezier(0.22,1,0.36,1)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Что делать дальше */}
      <div style={{ borderRadius: 16, background: `linear-gradient(180deg, rgba(${RGB},0.08), rgba(${RGB},0.02))`, border: `1px solid rgba(${RGB},0.2)`, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sparkles size={15} style={{ color: "#a5b4fc" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Что делать дальше</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {topSteps.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>Загружаем рекомендации…</div>}
          {topSteps.map((s, i) => (
            <Link key={i} href={s.href}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, textDecoration: "none",
                background: s.tone === "warn" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
                border: s.tone === "warn" ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
              <s.icon size={15} style={{ color: s.tone === "warn" ? "#fbbf24" : "#a5b4fc", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.35 }}>{s.label}</span>
              <ArrowUpRight size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 820px){ .usage-widget{ grid-template-columns: 1fr !important; } }`}</style>
    </motion.div>
  );
}
