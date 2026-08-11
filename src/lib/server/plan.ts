// ─── Тариф пользователя на сервере ────────────────────────────────────────────
// ЕДИНСТВЕННЫЙ источник правды — entitlement-стор, который наполняется только
// подтверждённым webhook'ом оплаты (или админом через /api/admin/grant).
//
// Раньше здесь был fallback на cookie, которую ставил /api/billing/select
// («демо-активация по клику»). Это позволяло получить тариф без оплаты —
// и клик по кнопке «активировал» тариф вместо редиректа на оплату. Убрано:
// никакой активации без подтверждённого платежа.

import type { PlanId } from "@/lib/plans";
import { getEntitlement } from "@/lib/payments/entitlement";

export async function getServerPlan(userId?: string): Promise<PlanId | "none"> {
  if (!userId) return "none";
  const paid = await getEntitlement(userId);
  return paid ?? "none";
}
