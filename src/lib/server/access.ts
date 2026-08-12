// ─── Единая серверная проверка доступа ────────────────────────────────────────
// Один вход для всех премиум-API: авторизация → активная подписка → право на
// функцию по тарифу → месячная квота (атомарное списание). Frontend может
// показывать что угодно — доступ решается только здесь.
//
// Источник правды о тарифе: таблица subscriptions в Supabase (см. entitlement).
// localStorage, cookie, тело запроса и query-параметры НЕ участвуют в решении.

import { auth } from "@/auth";
import { getSubscription } from "@/lib/payments/entitlement";
import { PLAN_BY_ID, planAllows, limitsFor, type PlanId, type PlanFeatures } from "@/lib/plans";
import { enforceUsage, type QuotaKey, type UsageResult } from "@/lib/middleware/usage-limit";
import { logEvent } from "@/lib/analytics/server";

export type Feature = keyof PlanFeatures;

/** Активный тариф пользователя (или "none", если подписки нет/истекла). */
export type ActivePlan = PlanId | "none";

export interface Subscription {
  plan: ActivePlan;
  status: "active" | "expired" | "canceled" | "pending" | "none";
  expiresAt: string | null;
}

/**
 * Подписка пользователя с учётом срока. Если expires_at в прошлом или статус не
 * active — тариф считается отсутствующим ("none"), даже если в БД что-то лежит.
 */
export async function getUserSubscription(userId: string): Promise<Subscription> {
  const sub = await getSubscription(userId);
  const active = sub.status === "active" && Boolean(sub.plan)
    && (!sub.expiresAt || new Date(sub.expiresAt).getTime() > Date.now());
  return {
    plan: active ? (sub.plan as PlanId) : "none",
    status: sub.status,
    expiresAt: sub.expiresAt,
  };
}

/** Матрица «функция × тариф» живёт в plans.ts — здесь только удобная обёртка. */
export function canUseFeature(plan: ActivePlan, feature: Feature): boolean {
  return plan === "none" ? false : planAllows(plan, feature);
}

/** Минимальный тариф, на котором функция открыта (для текста «нужен Pro»). */
export function minPlanFor(feature: Feature): PlanId | null {
  for (const id of ["starter", "pro", "max"] as PlanId[]) {
    if (planAllows(id, feature)) return id;
  }
  return null;
}

export type DenyCode = "UNAUTHORIZED" | "PLAN_REQUIRED" | "FEATURE_LOCKED" | "QUOTA_EXCEEDED";

export interface AccessResult {
  allowed: boolean;
  userId: string;
  plan: ActivePlan;
  usage?: UsageResult;
  code?: DenyCode;
  reason?: string;
  status?: 401 | 402 | 403 | 429;
  requiredPlan?: PlanId | null;
}

/**
 * Полная проверка доступа к премиум-функции.
 * feature — что именно открываем; quota — какую месячную квоту списать
 * (списывается ТОЛЬКО если доступ разрешён).
 */
export async function requireFeature(
  feature: Feature | null,
  quota: QuotaKey | null,
): Promise<AccessResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { allowed: false, userId: "", plan: "none", code: "UNAUTHORIZED", status: 401, reason: "Нужно войти в аккаунт" };
  }

  const sub = await getUserSubscription(userId);
  const plan = sub.plan;

  if (feature) {
    if (plan === "none") {
      // Без тарифа даём только бесплатную квоту тех функций, у которых она > 0.
      const freeLimit = quota ? limitsFor("none")[quota] : 0;
      if (!quota || freeLimit === 0) {
        void logEvent("feature_blocked", userId, { feature, plan, required: minPlanFor(feature) });
        return {
          allowed: false, userId, plan, code: "PLAN_REQUIRED", status: 402,
          reason: "Для этой функции нужен активный тариф",
          requiredPlan: minPlanFor(feature),
        };
      }
    } else if (!canUseFeature(plan, feature)) {
      void logEvent("feature_blocked", userId, { feature, plan, required: minPlanFor(feature) });
      return {
        allowed: false, userId, plan, code: "FEATURE_LOCKED", status: 403,
        reason: `Функция недоступна на тарифе ${PLAN_BY_ID[plan].name}`,
        requiredPlan: minPlanFor(feature),
      };
    }
  }

  if (!quota) return { allowed: true, userId, plan };

  const usage = await enforceUsage(userId, plan, quota);
  if (!usage.allowed) {
    void logEvent("limit_reached", userId, { quota, plan, limit: usage.limit, used: usage.used });
    return {
      allowed: false, userId, plan, usage, code: "QUOTA_EXCEEDED", status: 429,
      reason: "Месячный лимит исчерпан. Обновите тариф или дождитесь начала месяца.",
      requiredPlan: plan === "max" ? null : plan === "pro" ? "max" : "pro",
    };
  }

  return { allowed: true, userId, plan, usage };
}

/** Готовый ответ отказа с кодом, который понимает frontend. */
export function denyResponse(access: AccessResult): Response {
  const body: Record<string, unknown> = {
    success: false,
    error: access.reason ?? "Доступ запрещён",
    code: access.code,
    plan: access.plan,
  };
  if (access.requiredPlan) body.requiredPlan = access.requiredPlan;
  if (access.usage) {
    body.limit = access.usage.limit;
    body.used = access.usage.used;
    body.remaining = access.usage.remaining;
    body.resetAt = access.usage.resetAt;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (access.usage) headers["X-Quota-Reset"] = String(access.usage.resetAt);
  return new Response(JSON.stringify(body), { status: access.status ?? 403, headers });
}
