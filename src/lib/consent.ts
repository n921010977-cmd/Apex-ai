// ─── Управление согласием на cookies ───────────────────────────────────────────
// Единый источник правды о выборе пользователя. Хранится в localStorage, чтобы
// решение переживало перезагрузку и не требовало серверного стейта. Необходимые
// cookies и cookies безопасности (сессия, CSRF, rate-limit) не отключаются —
// без них сайт не работает. Отдельно управляется только аналитика.

const STORAGE_KEY = "vertlix_cookie_consent";
const VERSION = 1;

export type ConsentState = {
  necessary: true;        // всегда включены — вход, безопасность, работа сайта
  analytics: boolean;     // PostHog / Vercel Analytics — управляется пользователем
  ts: number;             // когда сделан выбор (unix ms)
  version: number;        // версия политики; при повышении спрашиваем заново
};

const EVENT = "vertlix:consent-changed";

/** Прочитать сохранённый выбор. null — если выбор ещё не сделан (нужно показать баннер). */
export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== VERSION) return null; // политика изменилась — спросить снова
    return parsed;
  } catch {
    return null;
  }
}

/** Сохранить выбор и оповестить слушателей (провайдер аналитики подхватит). */
export function setConsent(analytics: boolean): ConsentState {
  const state: ConsentState = { necessary: true, analytics, ts: Date.now(), version: VERSION };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
  } catch { /* localStorage может быть недоступен — тихо игнорируем */ }
  return state;
}

/** Дал ли пользователь согласие на аналитику. */
export function analyticsAllowed(): boolean {
  return getConsent()?.analytics === true;
}

/** Подписаться на изменения согласия. Возвращает функцию отписки. */
export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
