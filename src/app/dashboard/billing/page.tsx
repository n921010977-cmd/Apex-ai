"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Sparkles, ShieldCheck, Loader2, AlertTriangle, TrendingUp, X } from "lucide-react";
import { PLANS, PLAN_BY_ID, type Plan, type PlanFeatures, type PlanId } from "@/lib/plans";
import { usePlan } from "@/lib/use-plan";
import { useToast } from "@/components/ui/Toast";
import { PaymentFlowNote } from "@/components/dashboard/PaymentFlowNote";

// ─── Тарифы и подписка внутри приложения ──────────────────────────────────────
// Умная страница биллинга: выбор тарифа (оплата криптой через OxaPay или демо),
// обработка возврата с оплаты (?paid=1 — ждём подтверждения webhook’ом), живые
// счётчики расхода лимитов текущего тарифа и подсказка апгрейда у лимита.

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

// Квоты, которые показываем в панели расхода (в порядке важности).
const QUOTA_META: { key: string; label: string }[] = [
  { key: "aiMessages",   label: "AI-сообщения" },
  { key: "strategies",   label: "Стратегии" },
  { key: "boardMeetings",label: "Заседания совета" },
  { key: "pitchDecks",   label: "Питч-деки" },
  { key: "weeklyFocus",  label: "«Фокус недели»" },
];

type Usage = Record<string, { used: number; limit: number | null; remaining: number | null }>;

function limitText(v: number | null): string {
  return v === null ? "без лимита" : v === 0 ? "—" : String(v);
}

// Живой счётчик одной квоты.
function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit === null;
  const pct = unlimited ? 8 : limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const danger = !unlimited && limit > 0 && pct >= 80;
  const color = danger ? "#f59e0b" : ACCENT;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: danger ? "#fbbf24" : "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums" }}>
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${unlimited ? 100 : pct}%` }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ height: "100%", borderRadius: 99, background: unlimited ? `linear-gradient(90deg,${ACCENT},#34d399)` : `linear-gradient(90deg,${color},${danger ? "#fbbf24" : "#818cf8"})` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { plan: clientPlan, setPlan } = usePlan();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const [serverPlan, setServerPlan] = useState<PlanId | "none" | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [pay, setPay] = useState<"idle" | "pending" | "done" | "canceled">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const active = serverPlan ?? clientPlan;

  const loadUsage = useCallback(async (): Promise<PlanId | "none" | null> => {
    try {
      const r = await fetch("/api/usage", { cache: "no-store" });
      const d = await r.json();
      if (!d.success) return null;
      setServerPlan(d.plan);
      const u: Usage = {};
      for (const k of Object.keys(d.usage)) u[k] = d.usage[k];
      setUsage(u);
      if (d.plan !== "none") setPlan(d.plan); // синхронизируем разблокировку вкладок
      return d.plan;
    } catch { return null; }
  }, [setPlan]);

  // Первичная загрузка + обработка возврата с оплаты.
  useEffect(() => {
    loadUsage();
    const params = new URLSearchParams(window.location.search);
    const clean = () => window.history.replaceState({}, "", "/dashboard/billing");

    if (params.get("canceled")) { setPay("canceled"); clean(); return; }

    if (params.get("paid")) {
      setPay("pending"); clean();
      let tries = 0;
      pollRef.current = setInterval(async () => {
        tries++;
        const p = await loadUsage();
        if (p && p !== "none") {
          setPay("done");
          toast("Оплата подтверждена — тариф активирован!", "success");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (tries >= 20) { // ~1 мин
          if (pollRef.current) clearInterval(pollRef.current);
          setPay("idle");
        }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = async (p: Plan) => {
    setBusy(p.id);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p.id }),
      });
      const data = await res.json().catch(() => ({}));

      // Оплата настроена и счёт создан → уводим на страницу оплаты OxaPay.
      if (data?.configured && data?.invoiceUrl) { window.location.href = data.invoiceUrl; return; }

      // Оплата настроена, но счёт не создался (неверный ключ, мерчант не одобрен,
      // нет NEXT_PUBLIC_APP_URL) — показываем причину, НЕ включаем демо молча.
      if (data?.configured) {
        setBusy(null);
        toast(data?.error || "Не удалось открыть оплату. Проверьте OXAPAY_MERCHANT_KEY и одобрение мерчанта.", "error");
        return;
      }
      // data.configured === false → OxaPay не настроен: демо-разблокировка ниже.
    } catch {
      setBusy(null);
      toast("Сеть недоступна — попробуйте ещё раз", "error");
      return;
    }

    // Демо-путь: OxaPay не подключён (ключа нет). Открываем тариф локально.
    try {
      await fetch("/api/billing/select", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p.id }),
      });
    } catch { /* cookie не критична */ }
    setPlan(p.id);
    await loadUsage();
    setBusy(null);
    toast(`Демо-режим: тариф ${p.name} открыт (оплата OxaPay не подключена)`, "success");
  };

  // Умная подсказка апгрейда: на тарифе (не Max) и какая-то квота ≥ 80%.
  const activePlanObj = active !== "none" ? PLAN_BY_ID[active] : null;
  const nearLimit = usage && activePlanObj
    ? QUOTA_META.some(({ key }) => {
        const u = usage[key];
        return u && u.limit && u.limit > 0 && u.used / u.limit >= 0.8;
      })
    : false;
  const nextPlan = activePlanObj && activePlanObj.id !== "max"
    ? PLANS[PLANS.findIndex(p => p.id === activePlanObj.id) + 1]
    : null;

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 24px 96px" }}>
      {/* Статус оплаты */}
      <AnimatePresence>
        {pay === "pending" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, marginBottom: 20,
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <Loader2 size={18} style={{ color: "#a5b4fc", animation: "spin 1s linear infinite" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Подтверждаем оплату в сети…</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>Крипто-платёж подтверждается 1–3 минуты. Тариф включится автоматически.</div>
            </div>
          </motion.div>
        )}
        {pay === "canceled" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, marginBottom: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <X size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>Оплата отменена. Выбери тариф ещё раз, когда будешь готов.</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", color: "#fff" }}>Тарифы и подписка</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 620, lineHeight: 1.6 }}>
          На Starter открыт весь продукт, кроме трёх премиум-инструментов. Pro открывает их, Max — те же функции с лимитами в разы больше.
        </p>
        {active !== "none" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, padding: "6px 14px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <ShieldCheck size={15} style={{ color: "#34d399" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>Ваш тариф: {PLAN_BY_ID[active].name}</span>
          </div>
        )}
      </motion.div>

      {/* Живой расход лимитов текущего тарифа */}
      {active !== "none" && usage && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          style={{ marginBottom: 26, borderRadius: 18, padding: "20px 22px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} style={{ color: "#a5b4fc" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", color: "#fff" }}>Расход за этот месяц</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px 28px" }}>
            {QUOTA_META.map(({ key, label }) => {
              const u = usage[key];
              if (!u || u.limit === 0) return null; // недоступно на тарифе — не показываем
              return <QuotaBar key={key} label={label} used={u.used} limit={u.limit} />;
            })}
          </div>

          {/* Умная подсказка апгрейда */}
          {nearLimit && nextPlan && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <AlertTriangle size={17} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.45 }}>
                Ты близок к лимиту тарифа. На <b style={{ color: "#fff" }}>{nextPlan.name}</b> лимиты в разы больше.
              </div>
              <button onClick={() => choose(nextPlan)} disabled={busy !== null}
                style={{ flexShrink: 0, height: 36, padding: "0 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg,${ACCENT},#4f46e5)` }}>
                Обновить до {nextPlan.name}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Карточки */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, alignItems: "start" }}>
        {PLANS.map((plan, i) => {
          const hot = plan.highlight;
          const isCurrent = active === plan.id;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
              style={{ position: "relative", borderRadius: 20, padding: "26px 24px 28px",
                background: hot ? `linear-gradient(180deg, rgba(${RGB},0.12), rgba(${RGB},0.03))` : "rgba(255,255,255,0.025)",
                border: isCurrent ? "1px solid rgba(52,211,153,0.5)" : hot ? `1px solid rgba(${RGB},0.5)` : "1px solid rgba(255,255,255,0.08)",
                boxShadow: hot ? `0 12px 40px rgba(${RGB},0.2)` : "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.18)" }}>
              {hot && (
                <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, background: `linear-gradient(135deg,${ACCENT},#4f46e5)`, color: "#fff", whiteSpace: "nowrap", boxShadow: `0 4px 14px rgba(${RGB},0.5)` }}>Популярный</div>
              )}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: hot ? 8 : 0 }}>{plan.name}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginTop: 3, minHeight: 34 }}>{plan.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0 18px" }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>${plan.priceMonthly}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>/мес</span>
              </div>
              <button onClick={() => choose(plan)} disabled={isCurrent || busy !== null}
                style={{ width: "100%", height: 46, borderRadius: 12, border: "none", cursor: isCurrent ? "default" : "pointer", fontSize: 14, fontWeight: 700, color: "#fff",
                  background: isCurrent ? "rgba(52,211,153,0.15)" : hot ? `linear-gradient(135deg,${ACCENT},#4f46e5)` : "rgba(255,255,255,0.08)",
                  boxShadow: hot && !isCurrent ? `0 6px 20px rgba(${RGB},0.35)` : "none", opacity: busy && busy !== plan.id ? 0.5 : 1 }}>
                {isCurrent ? "Текущий тариф" : busy === plan.id ? "Открываем оплату…" : `Выбрать ${plan.name}`}
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
                      {p.features[row.key] ? <Check size={17} style={{ color: "#34d399" }} /> : <Minus size={16} style={{ color: "rgba(255,255,255,0.2)" }} />}
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

      {/* Как проходит оплата */}
      <PaymentFlowNote />

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Sparkles size={13} /> Отмена в любой момент. Лимиты обновляются каждый месяц.
      </p>
    </div>
  );
}
