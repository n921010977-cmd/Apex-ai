"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Sparkles, ShieldCheck } from "lucide-react";
import { PLANS, type Plan, type PlanFeatures } from "@/lib/plans";
import { usePlan } from "@/lib/use-plan";
import { useToast } from "@/components/ui/Toast";

// ─── Тарифы внутри приложения ─────────────────────────────────────────────────
// Здесь пользователь выбирает тариф. Пока нет реальной оплаты — выбор сразу
// открывает соответствующие вкладки (тариф пишется в localStorage через usePlan).
// Когда подключим LemonSqueezy, кнопка будет вести на checkout, а активный тариф
// придёт с сервера — верстка и логика доступа останутся теми же.

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

export default function BillingPage() {
  const { plan: active, setPlan } = usePlan();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const choose = (p: Plan) => {
    setBusy(p.id);
    // Тут в будущем будет редирект на checkout LemonSqueezy.
    setTimeout(() => {
      setPlan(p.id);
      setBusy(null);
      toast(`Тариф ${p.name} активирован — вкладки разблокированы`, "success");
    }, 450);
  };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 24px 96px" }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", color: "#fff" }}>
          Тарифы и подписка
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 620, lineHeight: 1.6 }}>
          На Starter открыт весь продукт, кроме трёх премиум-инструментов. Pro открывает их, Max — те же функции с лимитами в разы больше.
        </p>
        {active !== "none" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, padding: "6px 14px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <ShieldCheck size={15} style={{ color: "#34d399" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>
              Ваш тариф: {PLANS.find(p => p.id === active)?.name}
            </span>
          </div>
        )}
      </motion.div>

      {/* Карточки */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, alignItems: "start" }}>
        {PLANS.map((plan, i) => {
          const hot = plan.highlight;
          const isCurrent = active === plan.id;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
              style={{
                position: "relative", borderRadius: 20, padding: "26px 24px 28px",
                background: hot ? `linear-gradient(180deg, rgba(${RGB},0.12), rgba(${RGB},0.03))` : "rgba(255,255,255,0.025)",
                border: isCurrent ? "1px solid rgba(52,211,153,0.5)" : hot ? `1px solid rgba(${RGB},0.5)` : "1px solid rgba(255,255,255,0.08)",
                boxShadow: hot ? `0 12px 40px rgba(${RGB},0.2)` : "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              {hot && (
                <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, color: "#fff", whiteSpace: "nowrap", boxShadow: `0 4px 14px rgba(${RGB},0.5)` }}>
                  Популярный
                </div>
              )}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: hot ? 8 : 0 }}>{plan.name}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 3, minHeight: 34 }}>{plan.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0 18px" }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>${plan.priceMonthly}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/мес</span>
              </div>

              <button
                onClick={() => choose(plan)}
                disabled={isCurrent || busy !== null}
                style={{
                  width: "100%", height: 46, borderRadius: 12, border: "none", cursor: isCurrent ? "default" : "pointer",
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  background: isCurrent
                    ? "rgba(52,211,153,0.15)"
                    : hot ? `linear-gradient(135deg,${ACCENT},#4f46e5)` : "rgba(255,255,255,0.08)",
                  boxShadow: hot && !isCurrent ? `0 6px 20px rgba(${RGB},0.35)` : "none",
                  opacity: busy && busy !== plan.id ? 0.5 : 1,
                }}
              >
                {isCurrent ? "Текущий тариф" : busy === plan.id ? "Активируем…" : `Выбрать ${plan.name}`}
              </button>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.perks.map((perk, j) => (
                  <div key={j} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.72)" }}>
                    <Check size={15} style={{ color: "#34d399", flexShrink: 0, marginTop: 1 }} />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Таблица сравнения */}
      <div style={{ marginTop: 44, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
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
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Sparkles size={13} /> Отмена в любой момент. Лимиты обновляются каждый месяц.
      </p>
    </div>
  );
}
