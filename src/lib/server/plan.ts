// ─── Тариф пользователя на сервере ────────────────────────────────────────────
// Пока нет БД и реальной оплаты — активный тариф хранится в httpOnly-cookie,
// которую ставит /api/billing/select. Сервер читает её, чтобы применять лимиты.
// Когда подключим Supabase + LemonSqueezy, источником станет запись в БД
// (webhook оплаты), а этот модуль просто поменяет реализацию getServerPlan().

import { cookies } from "next/headers";
import type { PlanId } from "@/lib/plans";
import { getEntitlement } from "@/lib/payments/entitlement";

export const PLAN_COOKIE = "vertlix_plan";

/**
 * Активный тариф пользователя.
 * 1) Реальная оплата (entitlement-стор по userId) — источник правды.
 * 2) Демо-cookie (когда оплата не настроена) — запасной путь.
 */
export async function getServerPlan(userId?: string): Promise<PlanId | "none"> {
  if (userId) {
    const paid = await getEntitlement(userId);
    if (paid) return paid;
  }
  const c = await cookies();
  const v = c.get(PLAN_COOKIE)?.value;
  return v === "starter" || v === "pro" || v === "max" ? v : "none";
}
