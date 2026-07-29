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
