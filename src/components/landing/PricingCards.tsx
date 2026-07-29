"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { PLANS, type Plan, type PlanFeatures } from "@/lib/plans";

// ─── Три тарифа: Starter $29 / Pro $39 / Max $49 ──────────────────────────────
// Данные берутся из src/lib/plans.ts (единый источник правды). Три премиум-
// инструмента (питч-дек, «Цели и план», «Фокус недели») открываются с Pro —
// это и есть причина апгрейда со Starter.

const ACCENT = "#6366f1";
const RGB = "99,102,241";

// Строки таблицы сравнения функций.
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

export function PricingCards() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 96px" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,46px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", textWrap: "balance" }}>
          Простые тарифы, честные лимиты
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
          На Starter открыт весь продукт, кроме трёх премиум-инструментов. Pro открывает их, Max — те же функции с лимитами в разы больше.
        </p>
      </div>

      {/* Карточки */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, alignItems: "start" }}>
        {PLANS.map((plan: Plan) => {
          const hot = plan.highlight;
          const isHover = hover === plan.id;
          return (
            <div
              key={plan.id}
              onMouseEnter={() => setHover(plan.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                position: "relative", borderRadius: 20, padding: "26px 24px 28px",
                background: hot ? `linear-gradient(180deg, rgba(${RGB},0.12), rgba(${RGB},0.03))` : "rgba(255,255,255,0.025)",
                border: hot ? `1px solid rgba(${RGB},0.5)` : "1px solid rgba(255,255,255,0.08)",
                boxShadow: hot ? `0 12px 40px rgba(${RGB},0.2)` : "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.18)",
                transform: isHover ? "translateY(-4px)" : "none", transition: "transform .2s, box-shadow .2s",
              }}
            >
              {hot && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, color: "#fff", whiteSpace: "nowrap" }}>
                  Популярный
                </div>
              )}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{plan.name}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 3, minHeight: 34 }}>{plan.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0 18px" }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>${plan.priceMonthly}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/мес</span>
              </div>

              <Link
                href="/register"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12,
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  color: "#fff",
                  background: hot ? `linear-gradient(135deg,${ACCENT},#4f46e5)` : "rgba(255,255,255,0.06)",
                  border: hot ? "none" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: hot ? `0 6px 20px rgba(${RGB},0.35), inset 0 1px 0 rgba(255,255,255,0.16)` : "none",
                }}
              >
                Выбрать {plan.name}
              </Link>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.perks.map((perk, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.72)" }}>
                    <Check size={15} style={{ color: "#34d399", flexShrink: 0, marginTop: 1 }} />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Таблица сравнения */}
      <div style={{ marginTop: 56, borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
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
              {/* Лимиты */}
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

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
        Отмена в любой момент. Лимиты обновляются каждый месяц.
      </p>
    </section>
  );
}
