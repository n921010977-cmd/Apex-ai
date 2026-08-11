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
