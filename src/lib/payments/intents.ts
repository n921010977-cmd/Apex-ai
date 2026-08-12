// ─── Намерения оплаты (для статичных платёжных ссылок) ────────────────────────
// У ссылок pay.oxapay.com нет order_id, поэтому webhook не знает, КОМУ включать
// тариф. Решение: в момент клика по тарифу запоминаем «намерение» (кто + какой
// тариф + сумма), а пришедший webhook сопоставляем с ним:
//   1) по email плательщика (если он его указал на странице оплаты) — надёжно;
//   2) иначе — по сумме, но ТОЛЬКО если кандидат ровно один (иначе можно
//      включить тариф не тому — тогда выдаём вручную через /admin).
// Живут 3 часа. Хранилище — Upstash (durable) или память (fallback).

import type { PlanId } from "@/lib/plans";

const TTL_MS = 3 * 60 * 60 * 1000; // 3 часа
const KEY = "payintents";

export interface PayIntent {
  userId: string;
  email?: string;
  plan: PlanId;
  amount: number;
  ts: number;
}

// ── Хранилище ────────────────────────────────────────────────────────────────
let mem: PayIntent[] = [];

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

const fresh = (list: PayIntent[]) => list.filter(i => Date.now() - i.ts < TTL_MS);

async function readAll(): Promise<PayIntent[]> {
  if (upstashConfigured()) {
    try {
      const r = await upstash([["GET", KEY]]);
      const raw = r[0]?.result;
      return raw ? fresh(JSON.parse(raw) as PayIntent[]) : [];
    } catch { /* fallback */ }
  }
  return fresh(mem);
}

async function writeAll(list: PayIntent[]): Promise<void> {
  const trimmed = fresh(list).slice(-200); // защита от разрастания
  if (upstashConfigured()) {
    try { await upstash([["SET", KEY, JSON.stringify(trimmed), "PX", TTL_MS]]); return; }
    catch { /* fallback */ }
  }
  mem = trimmed;
}

// ── API ──────────────────────────────────────────────────────────────────────

/** Запомнить, что пользователь пошёл оплачивать тариф по статичной ссылке. */
export async function rememberIntent(intent: Omit<PayIntent, "ts">): Promise<void> {
  const list = await readAll();
  // Один активный интент на пользователя: перезаписываем прошлый.
  const next = list.filter(i => i.userId !== intent.userId);
  next.push({ ...intent, ts: Date.now() });
  await writeAll(next);
}

export interface MatchResult {
  intent: PayIntent | null;
  reason: "email" | "amount" | "ambiguous" | "none";
}

/**
 * Найти, кому принадлежит оплата. Совпадение по email — приоритетно;
 * по сумме — только при единственном кандидате (иначе ambiguous).
 */
export async function matchIntent(payerEmail: string | undefined, amount: number): Promise<MatchResult> {
  const list = await readAll();
  if (list.length === 0) return { intent: null, reason: "none" };

  if (payerEmail) {
    const byEmail = list.filter(i => i.email && i.email.toLowerCase() === payerEmail.toLowerCase());
    if (byEmail.length === 1) return { intent: byEmail[0], reason: "email" };
  }

  // Сумма может прийти в крипте — сверяем с допуском 3% и только по USD-номиналу.
  const byAmount = list.filter(i => Number.isFinite(amount) && amount > 0 && Math.abs(i.amount - amount) <= i.amount * 0.03);
  if (byAmount.length === 1) return { intent: byAmount[0], reason: "amount" };
  if (byAmount.length > 1) return { intent: null, reason: "ambiguous" };

  return { intent: null, reason: "none" };
}

/** Убрать намерение после успешной выдачи (защита от повторного зачёта). */
export async function consumeIntent(userId: string): Promise<void> {
  const list = await readAll();
  await writeAll(list.filter(i => i.userId !== userId));
}
