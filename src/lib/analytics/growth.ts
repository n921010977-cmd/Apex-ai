// ─── Активация, пороги расхода и предупреждения ───────────────────────────────
// Здесь живут события жизненного цикла, по которым видно, доводит ли продукт
// пользователя до пользы и до оплаты. Всё пишется только с сервера.
//
// Пороги 80/100 % главной квоты дублируются письмом (см. lib/notifications) —
// без RESEND_API_KEY письмо уходит в лог, продукт от почты не зависит.

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics/server";
import { notifyUsageThreshold } from "@/lib/notifications";
import type { UsageResult } from "@/lib/middleware/usage-limit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try { return await createClient(); } catch { return null; }
}

/**
 * Активация = первый полезный результат (успешно выполненный AI-запрос).
 * Вызывается после успеха, а не после клика: активированным считается тот, кто
 * реально что-то получил. Событие пишется один раз на пользователя.
 */
export async function markActivated(userId: string, feature: string): Promise<void> {
  void logEvent("feature_used", userId, { feature });

  const client = await db();
  if (!client) return;
  try {
    const { data, error } = await client.rpc("mark_activated", { p_user_id: userId });
    if (error) return;
    if (data === true) {
      // Первый результат в жизни аккаунта — ключевая точка воронки.
      void logEvent("activation", userId, { feature });
      void logEvent("first_result", userId, { feature });
    }
  } catch { /* аналитика не ломает продукт */ }
}

/**
 * Пороги расхода месячной квоты: 50 / 80 / 100 %. Событие на каждый порог
 * пишется один раз за месяц — повторные вызовы после пересечения молчат,
 * поэтому пользователя нельзя завалить одинаковыми предупреждениями.
 */
export async function checkUsageThresholds(userId: string, quota: string, usage: UsageResult): Promise<void> {
  if (!usage.limit || usage.limit <= 0) return;
  const pct = (usage.used / usage.limit) * 100;
  const threshold = pct >= 100 ? 100 : pct >= 80 ? 80 : pct >= 50 ? 50 : 0;
  if (!threshold) return;

  // Порог пересекается ровно на том запросе, который его перешагнул: считаем
  // процент до инкремента и сравниваем.
  const before = ((usage.used - 1) / usage.limit) * 100;
  if (before >= threshold) return;

  const name = threshold === 100 ? "usage_100_percent"
    : threshold === 80 ? "usage_80_percent" : "usage_50_percent";
  void logEvent(name, userId, { quota, used: usage.used, limit: usage.limit });

  // Письмо шлём на 80 и 100 % и только по главной квоте — на 50 % не спамим.
  if (quota === "aiMessages" && (threshold === 80 || threshold === 100)) {
    void notifyUsageThreshold(userId, threshold, usage.used, usage.limit);
  }
}

/**
 * Подписка заканчивается меньше чем через N дней — повод напомнить о продлении.
 * Возвращает число оставшихся дней (или null, если напоминать не о чем).
 */
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/** Генерирует короткий реферальный код пользователя (буквы+цифры, без похожих символов). */
export function makeReferralCode(seed: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  let out = "";
  for (let i = 0; i < 7; i++) { out += alphabet[hash % alphabet.length]; hash = Math.floor(hash / alphabet.length) + i * 7919; }
  return out;
}
