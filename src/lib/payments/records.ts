// ─── Журнал платежей (таблица payments) ───────────────────────────────────────
// Пишется при создании счёта и обновляется webhook'ом. Все операции best-effort:
// без Supabase (демо-режим) сервис продолжает работать — активация тарифа идёт
// через entitlement-стор, просто без журнала.

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELED" | "AMOUNT_MISMATCH";

export interface PaymentRecord {
  user_id: string;
  track_id: string;
  order_id: string;
  plan: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try { return await createClient(); } catch { return null; }
}

/** Записывает новый платёж со статусом PENDING (при выставлении счёта). */
export async function recordPaymentCreated(p: Omit<PaymentRecord, "status">): Promise<void> {
  const client = await db();
  if (!client) return;
  try {
    await client.from("payments").insert({ ...p, status: "PENDING" });
  } catch { /* журнал не должен ронять оплату */ }
}

/** Читает платёж по track_id. */
export async function getPaymentByTrackId(trackId: string): Promise<PaymentRecord | null> {
  const client = await db();
  if (!client) return null;
  try {
    const { data } = await client.from("payments").select("*").eq("track_id", trackId).maybeSingle();
    return (data as PaymentRecord) ?? null;
  } catch { return null; }
}

/**
 * Помечает платёж статусом. Для перехода в PAID действует идемпотентность:
 * обновляется только строка, которая ещё НЕ в PAID — второй webhook по тому же
 * track_id вернёт updated:false, и начисление не продублируется.
 */
export async function markPaymentStatus(trackId: string, status: PaymentStatus): Promise<{ updated: boolean }> {
  const client = await db();
  if (!client) return { updated: true }; // без БД идемпотентность обеспечивает сам entitlement (идempotent set)
  try {
    const { data } = await client
      .from("payments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("track_id", trackId)
      .neq("status", "PAID")
      .select("track_id");
    return { updated: Array.isArray(data) && data.length > 0 };
  } catch { return { updated: true }; }
}
