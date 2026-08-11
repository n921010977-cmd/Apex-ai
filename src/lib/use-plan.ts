"use client";

// ─── Текущий тариф пользователя (клиентское состояние) ────────────────────────
// Пока нет БД и реальной оплаты — тариф хранится в localStorage. Значение "none"
// означает «тариф не куплен»: премиум-инструменты закрыты замком до покупки.
// Когда подключим оплату (LemonSqueezy + Supabase), источником станет сервер, а
// этот хук просто будет читать план из сессии — API останется тем же.

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { planAllows, type PlanId, type PlanFeatures } from "@/lib/plans";

export type ActivePlan = PlanId | "none";

const KEY = "vertlix_plan";
const EVENT = "vertlix-plan-change";

function read(): ActivePlan {
  if (typeof window === "undefined") return "none";
  const v = window.localStorage.getItem(KEY);
  return v === "starter" || v === "pro" || v === "max" ? v : "none";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function setActivePlan(plan: ActivePlan) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, plan);
  window.dispatchEvent(new Event(EVENT));
}

/** Читает текущий тариф и даёт помощник allows(feature). */
export function usePlan() {
  const plan = useSyncExternalStore(subscribe, read, () => "none" as ActivePlan);

  // Правда о тарифе живёт на сервере (оплаченный entitlement). Локальное
  // значение — только кэш для мгновенного UI: при монтировании сверяемся с
  // /api/usage, чтобы вкладки отражали реальный оплаченный тариф, а ручная
  // правка localStorage ничего не давала (API и так проверяют сервер).
  useEffect(() => {
    let alive = true;
    fetch("/api/usage", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!alive || !d?.success) return;
        const p = d.plan === "starter" || d.plan === "pro" || d.plan === "max" ? d.plan : "none";
        if (p !== read()) setActivePlan(p);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const allows = useCallback(
    (feature: keyof PlanFeatures) => (plan === "none" ? false : planAllows(plan, feature)),
    [plan],
  );

  const setPlan = useCallback((p: ActivePlan) => setActivePlan(p), []);

  return { plan, allows, setPlan, purchased: plan !== "none" };
}

/** Хук-заглушка, чтобы гарантировать монтирование на клиенте (SSR → none). */
export function usePlanHydrated() {
  useEffect(() => {}, []);
}
