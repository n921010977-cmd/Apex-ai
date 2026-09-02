// ─── Серверная аналитика: AI-запросы, сессии, просмотры страниц ───────────────
// Всё best-effort: без Supabase (демо-режим) любой вызов — мгновенный no-op,
// продукт от аналитики не зависит и не падает. Пишем через service-клиент
// (RLS обходится на сервере, anon-ключ к этим таблицам доступа не имеет).
// Приватность: тексты промптов/ответов НЕ сохраняются — только метаданные.

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const SESSION_GAP_MIN = 30; // неактивность > 30 минут = новая сессия

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try { return await createClient(); } catch { return null; }
}

// ── AI-запросы ────────────────────────────────────────────────────────────────

export interface AiRequestLog {
  userId: string;
  feature: "chat" | "pitch_deck" | "strategy" | "board_meeting" | "weekly_focus";
  model?: string;
  status: "ok" | "error";
  tokensUsed?: number;
  responseTimeMs?: number;
  errorMessage?: string;
}

/** Логирует AI-вызов. Не await'ить на горячем пути — вызывать через void. */
export async function logAiRequest(log: AiRequestLog): Promise<void> {
  const client = await db();
  if (!client) return;
  try {
    await client.from("ai_requests").insert({
      user_id: log.userId,
      feature: log.feature,
      model: log.model ?? null,
      status: log.status,
      tokens_used: log.tokensUsed ?? null,
      response_time_ms: log.responseTimeMs ?? null,
      // Сообщение об ошибке укорачиваем и не даём утащить в него секреты.
      error_message: log.status === "error" ? (log.errorMessage ?? "").slice(0, 300) : null,
    });
    if (log.status === "ok") {
      await client.rpc("bump_ai_usage", { p_user_id: log.userId });
    }
  } catch { /* аналитика никогда не ломает продукт */ }
}

// ── Сессии и просмотры ────────────────────────────────────────────────────────

/** Грубый разбор User-Agent без зависимостей: тип устройства / браузер / ОС. */
export function parseUa(ua: string): { device: string; browser: string; os: string } {
  const u = ua.toLowerCase();
  const device = /mobile|iphone|android(?!.*tablet)/.test(u) ? "mobile" : /ipad|tablet/.test(u) ? "tablet" : "desktop";
  const browser =
    /edg\//.test(u) ? "Edge" :
    /opr\/|opera/.test(u) ? "Opera" :
    /chrome\//.test(u) ? "Chrome" :
    /safari\//.test(u) && /version\//.test(u) ? "Safari" :
    /firefox\//.test(u) ? "Firefox" : "Other";
  const os =
    /windows/.test(u) ? "Windows" :
    /mac os x/.test(u) && !/iphone|ipad/.test(u) ? "macOS" :
    /iphone|ipad|ios/.test(u) ? "iOS" :
    /android/.test(u) ? "Android" :
    /linux/.test(u) ? "Linux" : "Other";
  return { device, browser, os };
}

/**
 * Пинг активности: продлевает текущую сессию (окно 30 минут) или открывает
 * новую; пишет page_view. Page refresh НЕ создаёт новую сессию — окно
 * неактивности решает это на сервере.
 */
export async function trackPing(userId: string, path: string, ua: string): Promise<void> {
  const client = await db();
  if (!client) return;
  try {
    const cutoff = new Date(Date.now() - SESSION_GAP_MIN * 60_000).toISOString();
    const { data: existing } = await client
      .from("user_sessions")
      .select("id")
      .eq("user_id", userId)
      .is("ended_at", null)
      .gte("last_activity_at", cutoff)
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sessionId: string | null = existing?.id ?? null;
    const nowIso = new Date().toISOString();

    if (sessionId) {
      await client.from("user_sessions").update({ last_activity_at: nowIso }).eq("id", sessionId);
    } else {
      const { device, browser, os } = parseUa(ua);
      const { data: created } = await client
        .from("user_sessions")
        .insert({ user_id: userId, device_type: device, browser, os })
        .select("id")
        .single();
      sessionId = created?.id ?? null;
      // Новая сессия = визит: обновляем последний вход пользователя.
      await client.from("users").update({ last_login_at: nowIso }).eq("id", userId);
    }

    if (path) {
      await client.from("page_views").insert({ user_id: userId, session_id: sessionId, path: path.slice(0, 200) });
    }
  } catch { /* no-op */ }
}

// ─── События продукта и источник привлечения ──────────────────────────────────
// Единая лента user_events (миграция 014): signup / login / pricing_view /
// checkout_started / payment_success / ai_request и т.д. Пишется только с
// сервера; персональные данные в metadata не кладём.

export type ProductEvent =
  | "visit" | "signup" | "login" | "logout"
  | "pricing_view" | "checkout_started"
  | "payment_success" | "payment_failed"
  | "ai_request" | "ai_request_failed"
  | "subscription_started" | "subscription_activated" | "subscription_expired"
  | "limit_reached" | "feature_blocked" | "upgrade_clicked" | "upgrade_started"
  // Верх воронки и активация
  | "landing_view" | "signup_started" | "activation" | "feature_used"
  // События для будущих писем/уведомлений (пока только пишутся в ленту)
  | "welcome" | "first_result"
  | "usage_50_percent" | "usage_80_percent" | "usage_100_percent"
  | "subscription_expiring"
  | "promo_redeemed";

export interface Acquisition {
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_content?: string; utm_term?: string;
  landing_page?: string; referrer?: string;
}

/** Записать событие продукта. Не await'ить на горячем пути — через void. */
export async function logEvent(
  eventName: ProductEvent,
  userId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const client = await db();
  if (!client) return;
  try {
    await client.from("user_events").insert({
      user_id: userId,
      event_name: eventName,
      metadata,
    });
  } catch { /* аналитика не должна ломать продукт */ }
}

const clean = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;

/**
 * Сохранить источник привлечения пользователю — только если он ещё не записан
 * (первое касание побеждает: TikTok → регистрация остаётся TikTok).
 */
export async function saveAcquisition(userId: string, a: Acquisition): Promise<void> {
  const client = await db();
  if (!client) return;
  const patch: Record<string, string | null> = {
    utm_source: clean(a.utm_source), utm_medium: clean(a.utm_medium),
    utm_campaign: clean(a.utm_campaign), utm_content: clean(a.utm_content),
    utm_term: clean(a.utm_term), landing_page: clean(a.landing_page),
    referrer: clean(a.referrer),
  };
  if (Object.values(patch).every(v => v === null)) return;
  try {
    const { data } = await client.from("users").select("utm_source, referrer").eq("id", userId).maybeSingle();
    if (data?.utm_source || data?.referrer) return; // источник уже зафиксирован
    await client.from("users").update(patch).eq("id", userId);
  } catch { /* no-op */ }
}
