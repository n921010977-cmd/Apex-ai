# Аналитика — PostHog для Vertlix AI

Продуктовая аналитика на **PostHog**: события, воронки, конверсия, удержание.
Полностью опциональна — **без ключа приложение работает как обычно** (все вызовы
`track()` становятся no-op, PostHog не инициализируется и не шлёт запросов).

## Включение

В окружении (локально `.env.local`, на проде — Vercel → Environment Variables):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...            # Project API Key из PostHog
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # или https://eu.i.posthog.com
```

Ключи берутся в PostHog → **Project Settings**. CSP в `next.config.ts` уже
разрешает домены PostHog (`*.posthog.com`, `*.i.posthog.com`).

## Как устроено

- **`src/lib/analytics/events.ts`** — единый реестр событий (`EVENTS`) + функции
  `track()`, `identifyUser()`, `resetAnalytics()`. Всегда вызывай события через
  них, а не `posthog.capture` напрямую — так имена не расходятся.
- **`src/components/PostHogProvider.tsx`** — инициализация на клиенте (только при
  наличии ключа), ручной `$pageview` на каждую навигацию App Router, и
  идентификация пользователя из сессии NextAuth (для воронок и удержания).
  Подключён в `src/app/layout.tsx` внутри `SessionProvider`.

## Что отслеживается

| Что просили | Событие / механизм | Где |
|---|---|---|
| **Регистрации** | `user_signed_up` | `register/page.tsx` (после успеха) |
| **Входы** | `user_signed_in` (`method`: credentials/google/github) | `login/page.tsx` |
| **AI-функции** | `council_convened`, `council_verdict_reached` (+ голоса) | `executives/page.tsx` |
| **Клики** | **autocapture** (PostHog ловит клики автоматически) + семантические `cta_clicked` | глобально |
| **Конверсия** | `pricing_viewed`, `upgrade_clicked` (plan, price, billing) | `PricingSection.tsx` |
| **Удержание** | `identify()` пользователя + `$pageview`/`$pageleave` → retention-отчёты PostHog строятся автоматически | `PostHogProvider` |

Дополнительно в реестре готовы: `ai_analysis_started/completed`, `agent_asked`,
`chat_message_sent`, `project_created`, `report_generated`, `note_created`,
`checkout_started` — подключаются одной строкой `track(EVENTS.X, {...})` в нужном месте.

## Добавить новое событие

1. Добавь имя в `EVENTS` в `events.ts`.
2. В нужном месте: `track(EVENTS.MY_EVENT, { any: "props" })`.

Готово — типобезопасно и попадёт в PostHog.

## Что настроить в PostHog (после включения ключа)

- **Воронка регистрации → активации**: `$pageview /register` → `user_signed_up` →
  `council_convened` → `upgrade_clicked`.
- **Retention**: по `user_signed_in` или `council_convened` (weekly retention).
- **Конверсия платящих**: `pricing_viewed` → `upgrade_clicked` → `checkout_started`.
- Включи **Session Replay** и **Heatmaps** в проекте, если нужно (autocapture уже шлёт клики).

## Приватность

- Идентификация — по внутреннему `user.id`; email/имя идут как traits (при желании
  можно убрать в `PostHogProvider`).
- Учитывай GDPR: PostHog — под-обработчик, добавь его в политику конфиденциальности
  и cookie-consent (см. `docs/data-security.md`). Для строгого режима можно включить
  `opt_out_capturing_by_default` и запрашивать согласие.
