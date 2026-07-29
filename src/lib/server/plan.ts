// ─── Тариф пользователя на сервере ────────────────────────────────────────────
// Пока нет БД и реальной оплаты — активный тариф хранится в httpOnly-cookie,
// которую ставит /api/billing/select. Сервер читает её, чтобы применять лимиты.
// Когда подключим Supabase + LemonSqueezy, источником станет запись в БД
// (webhook оплаты), а этот модуль просто поменяет реализацию getServerPlan().

import { cookies } from "next/headers";
import type { PlanId } from "@/lib/plans";

export const PLAN_COOKIE = "vertlix_plan";

export async function getServerPlan(): Promise<PlanId | "none"> {
  const c = await cookies();
  const v = c.get(PLAN_COOKIE)?.value;
  return v === "starter" || v === "pro" || v === "max" ? v : "none";
}
