// ─── Оплаченный тариф пользователя (серверный источник правды) ────────────────
// Webhook об оплате приходит от NOWPayments (сервер-сервер), а не из браузера,
// поэтому активировать тариф через cookie нельзя — нужен стор по userId.
// Храним в Upstash Redis (durable) при наличии; иначе in-memory fallback.
// Значение живёт 1 месяц (подписка); дальше нужно оплатить снова.

import type { PlanId } from "@/lib/plans";

const store = new Map<string, { plan: PlanId; expiresAt: number }>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (v.expiresAt < now) store.delete(k);
  }, 10 * 60 * 1000);
}

function key(userId: string) { return `plan:${userId}`; }

function upstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
async function upstash(commands: unknown[][]): Promise<Array<{ result: string | null }>> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  return res.json();
}

/** Записать оплаченный тариф на N месяцев вперёд. */
export async function setEntitlement(userId: string, plan: PlanId, months = 1): Promise<void> {
  const ttlMs = months * 31 * 24 * 60 * 60 * 1000;
  if (upstashConfigured()) {
    try { await upstash([["SET", key(userId), plan, "PX", ttlMs]]); return; }
    catch { /* fallback */ }
  }
  store.set(key(userId), { plan, expiresAt: Date.now() + ttlMs });
}

/** Прочитать активный оплаченный тариф (или null). */
export async function getEntitlement(userId: string): Promise<PlanId | null> {
  if (upstashConfigured()) {
    try {
      const r = await upstash([["GET", key(userId)]]);
      const v = r[0]?.result;
      return v === "starter" || v === "pro" || v === "max" ? v : null;
    } catch { /* fallback */ }
  }
  const v = store.get(key(userId));
  if (!v || v.expiresAt < Date.now()) return null;
  return v.plan;
}
