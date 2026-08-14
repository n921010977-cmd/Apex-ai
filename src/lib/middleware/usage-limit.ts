// ─── Месячные квоты по тарифу ─────────────────────────────────────────────────
// Считает использование каждого пользователя в рамках календарного месяца и не
// даёт превысить лимит тарифа. Это защита прибыли от абьюза: один аккаунт не
// может выжать больше, чем куплено. Хранилище — Upstash Redis (durable, общий на
// все инстансы) при наличии; иначе in-memory fallback (сбрасывается при
// перезапуске, но лучше, чем ничего). Лимиты берутся из src/lib/plans.ts.

import { limitsFor, type PlanId, type PlanLimits } from "@/lib/plans";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type QuotaKey = keyof PlanLimits;

export interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number | null; // null = без лимита
  remaining: number | null;
  resetAt: number;
}

// Первая миллисекунда следующего месяца (UTC) — момент сброса квоты.
function monthResetAt(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0);
}

function monthTag(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function keyFor(userId: string, quota: QuotaKey): string {
  return `usage:${userId}:${monthTag()}:${quota}`;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────
const store = new Map<string, { count: number; resetAt: number }>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (v.resetAt < now) store.delete(k);
  }, 10 * 60 * 1000);
}

function memPeek(key: string): number {
  const v = store.get(key);
  if (!v || v.resetAt < Date.now()) return 0;
  return v.count;
}

function memIncr(key: string, resetAt: number): number {
  const existing = store.get(key);
  if (!existing || existing.resetAt < Date.now()) {
    store.set(key, { count: 1, resetAt });
    return 1;
  }
  existing.count++;
  return existing.count;
}

// ─── Upstash ──────────────────────────────────────────────────────────────────
function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstash(commands: unknown[][]): Promise<Array<{ result: number | null }>> {
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

function result(limit: number | null, used: number, resetAt: number, allowed: boolean): UsageResult {
  return {
    allowed,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetAt,
  };
}

// ─── Supabase: атомарная проверка+списание (миграция 015) ─────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try { return await createClient(); } catch { return null; }
}

/** Читает использование без инкремента (для отображения). */
export async function peekUsage(userId: string, plan: PlanId | "none", quota: QuotaKey): Promise<UsageResult> {
  const limit = limitsFor(plan)[quota];
  const resetAt = monthResetAt();
  const key = keyFor(userId, quota);

  const client = await db();
  if (client) {
    try {
      const { data, error } = await client
        .from("quota_usage")
        .select("used")
        .eq("user_id", userId).eq("quota", quota).eq("period", monthTag())
        .maybeSingle();
      if (!error) {
        const used = Number(data?.used ?? 0);
        return result(limit, used, resetAt, limit === null || used < limit);
      }
    } catch { /* таблицы ещё нет — читаем из Redis/памяти */ }
  }

  let used = 0;
  if (upstashConfigured()) {
    try {
      const r = await upstash([["GET", `${key}`]]);
      used = Number(r[0]?.result ?? 0);
    } catch {
      used = memPeek(key);
    }
  } else {
    used = memPeek(key);
  }
  return result(limit, used, resetAt, limit === null || used < limit);
}

/**
 * Проверяет квоту и, если есть место, увеличивает счётчик на 1.
 * Возвращает allowed=false БЕЗ инкремента, когда лимит уже исчерпан.
 *
 * Гонка исключена на каждом уровне хранилища:
 *  • Supabase — одна SQL-операция `insert ... on conflict do update ... where`;
 *  • Upstash  — сначала INCR (атомарный), затем откат DECR, если перебор;
 *  • память   — однопоточный event loop, инкремент неделим.
 * Схемы «прочитал → сравнил → записал» здесь нет нигде.
 */
export async function enforceUsage(userId: string, plan: PlanId | "none", quota: QuotaKey): Promise<UsageResult> {
  const limit = limitsFor(plan)[quota];
  const resetAt = monthResetAt();
  const key = keyFor(userId, quota);

  // Лимит 0 — функция недоступна на этом тарифе, инкремент не нужен.
  if (limit === 0) return result(0, 0, resetAt, false);

  const client = await db();
  if (client) {
    try {
      const { data, error } = await client.rpc("consume_quota", {
        p_user_id: userId,
        p_quota: quota,
        p_limit: limit,
        p_period: monthTag(),
      });
      if (!error && data && typeof data === "object") {
        const used = Number(data.used ?? 0);
        return result(limit, used, resetAt, Boolean(data.allowed));
      }
    } catch { /* RPC ещё не создан — падаем в Redis/память */ }
  }

  if (upstashConfigured()) {
    try {
      // INCR атомарен: сначала занимаем слот, потом решаем, был ли он лишним.
      const ttl = Math.max(1000, resetAt - Date.now());
      const r = await upstash([["INCR", key], ["PEXPIRE", key, ttl, "NX"]]);
      const used = Number(r[0]?.result ?? 1);
      if (limit !== null && used > limit) {
        // Перебор — откатываем свой инкремент, чтобы счётчик не рос вхолостую.
        await upstash([["DECR", key]]).catch(() => {});
        return result(limit, limit, resetAt, false);
      }
      return result(limit, used, resetAt, true);
    } catch {
      // Падаем в память, чтобы не блокировать легитимный трафик при сбое Redis.
    }
  }

  // Память: между чтением и записью нет await, поэтому операция неделима.
  const cur = memPeek(key);
  if (limit !== null && cur >= limit) return result(limit, cur, resetAt, false);
  const used = memIncr(key, resetAt);
  return result(limit, used, resetAt, true);
}

/** 429-ответ при исчерпании месячной квоты. */
export function quotaExceededResponse(quota: QuotaKey, r: UsageResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Monthly plan limit reached. Upgrade your plan or wait for the new month.",
      code: "QUOTA_EXCEEDED",
      quota,
      limit: r.limit,
      used: r.used,
      resetAt: r.resetAt,
    }),
    { status: 429, headers: { "Content-Type": "application/json", "X-Quota-Reset": String(r.resetAt) } },
  );
}
