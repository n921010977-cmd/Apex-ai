// ─── Оплаченная подписка пользователя ─────────────────────────────────────────
// Источник правды по приоритету:
//   1) таблица subscriptions в Supabase — переживает редеплой, хранит срок;
//   2) Upstash Redis — если БД не настроена;
//   3) память процесса — последний fallback (демо/локально).
//
// Пишется ТОЛЬКО с сервера: webhook подтверждённой оплаты или админ.
// Из браузера подписку изменить нельзя (RLS запрещает anon доступ к таблице).

import type { PlanId } from "@/lib/plans";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type SubscriptionStatus = "active" | "expired" | "canceled" | "pending" | "none";

export interface SubscriptionInfo {
  plan: PlanId | null;
  status: SubscriptionStatus;
  expiresAt: string | null;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try { return await createClient(); } catch { return null; }
}

/**
 * Активировать/продлить подписку на N месяцев.
 * В БД продление НЕ обнуляет остаток (RPC activate_subscription прибавляет срок
 * к текущей дате окончания). В fallback-хранилищах — та же логика вручную.
 */
export async function setEntitlement(
  userId: string,
  plan: PlanId,
  months = 1,
  meta?: { paymentId?: string; amount?: number; currency?: string },
): Promise<void> {
  const client = await db();

  if (client) {
    try {
      const { error } = await client.rpc("activate_subscription", {
        p_user_id: userId,
        p_plan: plan,
        p_months: months,
        p_payment_id: meta?.paymentId ?? null,
        p_amount: meta?.amount ?? null,
        p_currency: meta?.currency ?? "USD",
      });
      if (!error) return; // подписка сохранена в БД — этого достаточно
      console.error("[subscriptions] activate_subscription failed:", error.message);
    } catch (e) {
      console.error("[subscriptions] activate error:", e instanceof Error ? e.message : String(e));
    }
  }

  // Fallback: Upstash / память. Продлеваем от остатка, а не от «сейчас».
  const current = await readFallback(userId);
  const base = current && current.expiresAt > Date.now() ? current.expiresAt : Date.now();
  const expiresAt = base + months * 31 * 24 * 60 * 60 * 1000;
  const ttlMs = Math.max(60_000, expiresAt - Date.now());

  if (upstashConfigured()) {
    try { await upstash([["SET", key(userId), plan, "PX", ttlMs]]); return; }
    catch { /* память ниже */ }
  }
  store.set(key(userId), { plan, expiresAt });
}

async function readFallback(userId: string): Promise<{ plan: PlanId; expiresAt: number } | null> {
  if (upstashConfigured()) {
    try {
      const r = await upstash([["GET", key(userId)], ["PTTL", key(userId)]]);
      const v = r[0]?.result;
      if (v === "starter" || v === "pro" || v === "max") {
        const pttl = Number(r[1]?.result ?? 0);
        return { plan: v, expiresAt: Date.now() + (pttl > 0 ? pttl : 0) };
      }
      return null;
    } catch { /* память ниже */ }
  }
  const m = store.get(key(userId));
  if (!m || m.expiresAt < Date.now()) return null;
  return m;
}

/** Полные данные подписки (для /api/subscription/status и админки). */
export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  const client = await db();
  if (client) {
    try {
      const { data } = await client
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        const expired = data.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;
        const active = data.status === "active" && !expired;
        return {
          plan: active ? (data.plan as PlanId) : null,
          status: expired ? "expired" : (data.status as SubscriptionStatus),
          expiresAt: data.expires_at ?? null,
        };
      }
      return { plan: null, status: "none", expiresAt: null };
    } catch { /* fallback ниже */ }
  }

  const f = await readFallback(userId);
  if (!f) return { plan: null, status: "none", expiresAt: null };
  return { plan: f.plan, status: "active", expiresAt: new Date(f.expiresAt).toISOString() };
}

/** Активный оплаченный тариф (или null). Используется гейтами и лимитами. */
export async function getEntitlement(userId: string): Promise<PlanId | null> {
  const sub = await getSubscription(userId);
  return sub.status === "active" ? sub.plan : null;
}
