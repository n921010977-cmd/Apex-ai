import posthog from "posthog-js";

/**
 * Vertlix AI — единый реестр аналитических событий (PostHog).
 *
 * Все события проходят через `track()` с типобезопасными именами — не вызывай
 * posthog.capture напрямую, чтобы имена не расходились. Свойства событий —
 * произвольные, но держись snake_case для консистентности в PostHog.
 */
export const EVENTS = {
  // ── Жизненный цикл аккаунта ──
  SIGN_UP:        "user_signed_up",      // регистрация
  SIGN_IN:        "user_signed_in",      // вход
  SIGN_OUT:       "user_signed_out",     // выход

  // ── AI-функции ──
  AI_ANALYSIS_STARTED:   "ai_analysis_started",    // запущен анализ стратегии
  AI_ANALYSIS_COMPLETED: "ai_analysis_completed",  // анализ завершён
  COUNCIL_CONVENED:      "council_convened",        // созван совет директоров
  COUNCIL_VERDICT:       "council_verdict_reached", // совет вынес вердикт
  AGENT_ASKED:           "agent_asked",             // вопрос отдельному директору
  CHAT_MESSAGE_SENT:     "chat_message_sent",       // сообщение в чат

  // ── Контент ──
  PROJECT_CREATED:  "project_created",
  REPORT_GENERATED: "report_generated",
  NOTE_CREATED:     "note_created",

  // ── Конверсия ──
  PRICING_VIEWED:   "pricing_viewed",   // просмотр тарифов
  UPGRADE_CLICKED:  "upgrade_clicked",  // клик по «Обновить/Купить»
  CHECKOUT_STARTED: "checkout_started", // переход на оплату

  // ── Вовлечённость ──
  CTA_CLICKED: "cta_clicked", // семантический клик по ключевому CTA
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

function ready(): boolean {
  // Гейтим по наличию ключа, а не по posthog.__loaded: posthog-js буферизует
  // события до готовности remote-config, поэтому ждать __loaded не нужно (и это
  // бы теряло события, если config-запрос не прошёл). Без ключа init не
  // вызывается вовсе → все вызовы становятся безопасным no-op.
  return typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

/** Отправить событие. SSR-safe и no-op, если PostHog не сконфигурирован. */
export function track(event: EventName, props?: Record<string, unknown>): void {
  if (!ready()) return;
  try { posthog.capture(event, props); } catch { /* аналитика не должна ронять UX */ }
}

/** Связать текущего анонимного посетителя с пользователем (для удержания/воронок). */
export function identifyUser(id: string, traits?: Record<string, unknown>): void {
  if (!ready()) return;
  try { posthog.identify(id, traits); } catch { /* no-op */ }
}

/** Сбросить идентификацию при выходе (чтобы не смешивать сессии). */
export function resetAnalytics(): void {
  if (!ready()) return;
  try { posthog.reset(); } catch { /* no-op */ }
}
