# APEX AI — COMPLETE SYSTEM ARCHITECTURE
*Внутренняя техдокументация. Версия 1.0. Привязана к текущему коду репозитория — каждый раздел указывает реальные файлы.*

Принцип документа: **каждое решение = почему так / альтернативы / почему они хуже / как масштабируется.**

---

## ЧАСТЬ 1 · Архитектура верхнего уровня

```
Browser (Next.js App Router, RSC + client islands)
   ↓ HTTPS
Vercel Edge (CDN, middleware: auth-guard /dashboard/*)          src/middleware.ts
   ↓
Next.js API Routes (= API Gateway + Business Logic)             src/app/api/**
   ↓                    ↓
NextAuth (JWT)      Rate Limiter (per-IP)                       src/auth.ts · lib/middleware/rate-limit.ts
   ↓
AI Orchestrator (дебаты, синтез, стриминг SSE)                  src/lib/orchestrator/ · lib/ai/orchestrator.ts
   ↓
Agent Registry (20 ролей: промпт, модель, лимиты)               src/lib/agents/registry.ts
   ↓
Anthropic Claude API (streaming, vision)
   ↓
Memory Layer (embeddings + retrieval)                           src/lib/memory.ts  [требует OPENAI_API_KEY]
   ↓
Supabase Postgres (+ pgvector) · Storage (файлы/PDF)            supabase/migrations/
   ↓
Monitoring: /api/health + Vercel Analytics + Sentry(план)
Billing: Stripe (checkout + webhooks)                            [план: /api/billing/*]
```

**Почему монолит на Next.js, а не микросервисы:**
- Плюсы: один деплой, один язык, RSC убирает слой BFF, время итерации — часы.
- Альтернатива (NestJS + отдельный фронт): +инфраструктура, +контракты, нужна команда 5+. Хуже до ~100K MAU.
- Масштабирование: API-роуты стейтлесс → горизонтально на Vercel; тяжёлая генерация выносится в очередь (см. Часть 3, Analysis Module) **до** роста, т.к. Vercel убивает функции >5 мин.

**Данные по слоям (вход → выход):**
| Слой | Принимает | Возвращает |
|---|---|---|
| Gateway/middleware | cookie-сессия, путь | redirect /login ИЛИ next() |
| API route | JSON (zod-валидация, `lib/validators`) | JSON `{success,data|error}` или SSE-поток |
| Orchestrator | `{message, persona, history, image?}` | токены через `onToken`, итог `{content,tokensUsed}` |
| Registry | agentId | `{systemPrompt, model, maxTokens, temperature}` |
| Memory | `{userId, text}` | top-k релевантных фактов (cosine, pgvector) |
| DB | типизированные запросы (supabase-js) | rows / RLS-отказ |

---

## ЧАСТЬ 2 · Frontend-архитектура

```
src/
├─ app/                    # маршруты (App Router)
│  ├─ page.tsx             # лендинг (секции из components/landing)
│  ├─ chat/                # публичный Apex Chat (SSE-стрим)
│  ├─ login/ register/ legal/
│  ├─ dashboard/           # приватная зона (layout: Sidebar+TopNav)
│  │  ├─ page.tsx          # Обзор
│  │  ├─ new/              # визард брифа (3 шага, шаблоны)
│  │  ├─ projects/[id]/    # отчёт: табы, What-If, сценарии, войс-брифы
│  │  ├─ reports/ executives/ agents/ chat/ notepad/ settings/ support/
│  └─ api/                 # серверные роуты (см. Часть 3)
├─ components/
│  ├─ landing/             # 1 секция = 1 файл = 1 уникальная механика
│  └─ dashboard/           # Sidebar.tsx, TopNav.tsx
├─ lib/
│  ├─ orchestrator/        # актуальный оркестратор (directChat, orchestrate)
│  ├─ ai/orchestrator.ts   # пайплайн полного отчёта (8 треков)
│  ├─ agents/registry.ts   # ЕДИНСТВЕННЫЙ источник определений агентов
│  ├─ validators/          # zod-схемы всех API-входов
│  ├─ middleware/rate-limit.ts · memory.ts · tools.ts · supabase/{client,server}.ts
├─ auth.ts                 # NextAuth конфиг
├─ middleware.ts           # guard /dashboard/*
└─ app/globals.css         # дизайн-токены (:root) + .term-* утилиты
```

**Конвенции фронта:**
- Стили: дизайн-токены из `globals.css` (`--sp-*`, `--r-*`, `--fs-*`, `--z-*`, `.term-mono`, `.surface-card`). Новые экраны обязаны использовать токены, не сырые значения.
- Клиентские компоненты — только там, где есть интерактив (`"use client"` на листьях, не на layout).
- Анимации: Framer Motion, easing `[0.22,1,0.36,1]`, вход 0.5–0.7s, обязательная ветка `prefers-reduced-motion` (глобально в CSS).
- Папок `features/ store/ providers/` **намеренно нет**: состояние локально (useState) + URL; Redux/Zustand добавит слой без нужды при текущем размере. Триггер пересмотра — первый случай проброса состояния через 3+ уровня.

---

## ЧАСТЬ 3 · Backend-модули (все — `src/app/api/*`)

| Модуль | Роуты | Сервисы/зависимости | Статус |
|---|---|---|---|
| **Auth** | `auth/[...nextauth]`, `auth/register` (503 — закрыто) | NextAuth+bcrypt, users table | live (demo-режим без Supabase — **убрать до прод**) |
| **Projects** | `projects`, `projects/[id]` | Supabase, zod | live |
| **Analysis** | `analyze`, `strategies/[id]/generate` | Anthropic, per-track промпты | live |
| **Reports** | `reports`, `reports/create` (202+фон), `[id]`, `[id]/download-pdf` | ai/orchestrator (8 треков параллельно) | live; **фон умрёт на Vercel → нужен QStash/cron-очередь** |
| **Agents** | `agents`, `agents/[id]`, `agents/[id]/run` | registry; run — на legacy-оркестраторе | live; **legacy слить в orchestrator/** |
| **Chat** | `chat`, `chat/direct` (публичный SSE), `chat/[id]/*`, `chat/orchestrate` | rate-limit по IP на direct | live |
| **Memory** | `memory` | pgvector + OpenAI embeddings | код есть, ключа нет |
| **Notifications** | `notifications` | Supabase | live |
| **Billing** | `billing/checkout`, `billing/webhook` | Stripe | **план (Day 1–30)** |
| **Admin/Health** | `health` | env-пробы | live |

**События (план, через Supabase Realtime/webhooks):** `report.completed` → notification + email; `stripe.checkout.completed` → tier update; `project.updated` → memory reindex.

---

## ЧАСТЬ 4 · Database Design (Supabase Postgres)

Актуальные миграции: `supabase/migrations/001_initial_schema.sql`, `002_new_modules.sql`. Ядро:

```
users(id uuid PK, email unique idx, name, password_hash, role, tier,
      max_reports_per_month int, reports_generated_month int, created_at)
organizations(id PK, owner_id FK→users ON DELETE CASCADE, name, plan)
members(user_id FK, organization_id FK, role)  UNIQUE(user_id, org_id)
projects(id PK, user_id FK CASCADE, org_id FK, name, industry, stage,
         description text, score int, metadata jsonb, created_at)
         idx: (user_id, created_at desc)
reports(id PK, project_id FK CASCADE, user_id FK, title, summary,
        overall_score int, gen_status enum(PENDING|PROCESSING|COMPLETED|FAILED),
        total_pages, created_at)  idx: (user_id, created_at desc), (gen_status)
report_sections(id PK, report_id FK CASCADE, type, title, content jsonb, sort_order)
conversations(id PK, user_id FK, org_id FK, agent_id, project_id?, title, status)
messages(id PK, conversation_id FK CASCADE, role, content, tokens, created_at)
agents(id PK, org_id FK, name, system_prompt, model, temperature, max_tokens, is_active)
memories(id PK, user_id FK, content text, embedding vector(1536), kind, created_at)
         idx: ivfflat(embedding vector_cosine_ops)
notifications(id PK, user_id FK, title, body, type, is_read, created_at)
support_tickets(id PK, user_id FK, title, status, priority, created_at)
```

**Почему так:** org-слой с первого дня (тарифы Business/Enterprise командные — миграция потом больнее в 10×); `content jsonb` в секциях — структура секций эволюционирует, а не реляционная; CASCADE от user/project вниз — GDPR-удаление одним запросом.

**Оптимизация к масштабу:** RLS на все таблицы (user_id = auth.uid() ИЛИ member of org); партиционирование `messages` по месяцам после ~10M строк; счётчики лимитов — атомарный `update ... returning` (не read-modify-write); `memories` → отдельный индекс на (user_id, kind).

**Что добавить (из стратегии):** `business_dna(project_id, snapshot jsonb, version)`, `decision_ledger(project_id, advice, action_taken, outcome, decided_at)` — главный будущий ров данных.

---

## ЧАСТЬ 5 · AI System — мозг

**Спецификация агента (schema, живёт в `lib/agents/registry.ts`):**
```ts
{ id, role, systemPrompt,            // личность+правила+формат выхода
  model,                             // haiku=массовые, sonnet=аналитика, opus=CEO-синтез
  temperature, maxTokens,
  tools: ["search_web","calculator","docs"],
  memoryScope: "project"|"user"|"none",
  inputContract:  "бриф + релевантные факты памяти + выводы агентов-доноров",
  outputContract: "markdown: ## Анализ / ## Цифры / ## Рекомендации(3) / ## Score 0-100",
  qualityRules:   ["каждая рекомендация выполнима за ≤90 дней",
                   "каждая цифра имеет основание или помечена как допущение",
                   "запрещены: 'зависит от', списки >5, вода"],
  decisionRules:  ["score<50 → обязателен блок 'почему не делать'"] }
```

**Ростер 20 (полные промпты — в registry.ts; здесь контракт):**

| Агент | Модель | Вход от | Выход для | Ключевое правило качества |
|---|---|---|---|---|
| CEO | opus | все 19 | пользователь | обязан разрешить каждый конфликт явно |
| CFO | sonnet | BA, DS | CEO, CMO | LTV/CAC/BE обязаны сходиться математически |
| CMO | sonnet | BA, CFO-лимиты | CEO, Sales | ≤2 канала на старт, CAC по каждому |
| COO | sonnet | CEO-стратегия | CEO, HR | план строго 30/60/90 с owner'ами |
| CTO | sonnet | CPO | CEO, VPE | оценка MVP в неделях ± риск |
| CPO | sonnet | UX, BA | CTO, CEO | фичи только с привязкой к метрике |
| BA/Аналитик | sonnet | бриф | CFO, CMO, CEO | TAM/SAM/SOM с методом расчёта |
| Юрист | haiku | бриф, гео | CEO, CISO | всегда дисклеймер «не юр.консультация» |
| Sales | haiku | CMO | CEO | цикл сделки + 3 скрипта возражений |
| Growth | haiku | CMO, метрики | CMO | 1 эксперимент = гипотеза+метрика+срок |
| CISO | haiku | CTO, Юрист | CTO | топ-3 угрозы по вероятности×ущербу |
| HR | haiku | COO | COO | роли в порядке найма, вилки |
| CDO | haiku | метрики | CPO, CEO | одна North Star + дерево |
| VPE | haiku | CTO | CTO | спринт-план с рисками сроков |
| IR | haiku | CFO, CEO | CEO | питч-структура 10 слайдов |
| Бренд | haiku | CMO | CMO | 1 боль = 1 сообщение |
| CS | haiku | CPO | CPO, CMO | onboarding до ценности ≤7 дней |
| DS | haiku | CDO | CDO, CFO | прогноз = модель+допущения+интервал |
| Инвест-аналитик | haiku | CFO | IR, CEO | оценка по 2 методам |
| Стратег | sonnet | всё | CEO | moat названый, не «качество» |

**Communication rules (все агенты):** пишут только в своём outputContract; ссылаются на данные доноров явно («по модели CFO…»); несогласие оформляется блоком `⚡CONFLICT: <с кем> <почему> <моё условие>` — оркестратор парсит его для этапа дебатов.

---

## ЧАСТЬ 6 · Agent Collaboration — жизненный цикл запроса

```
1  INTAKE      бриф проходит zod → нормализация → Business DNA snapshot
2  DISPATCH    оркестратор запускает независимые треки ПАРАЛЛЕЛЬНО
               (Promise.all; сегодня 8 треков в lib/ai/orchestrator.ts)
3  DRAFT       каждый агент даёт вывод по своему контракту (не видит чужих)
4  CROSS       донорские выводы раздаются получателям (BA→CFO,CMO; CFO→CMO…)
               агенты выпускают ревизию + блоки ⚡CONFLICT
5  DEBATE      оркестратор собирает конфликты; каждой паре даётся 1 раунд
               контраргументов (ограничение: max 1 раунд — иначе цена ×N)
6  SYNTHESIS   CEO (opus) получает: все финальные выводы + список конфликтов
               + правило: «каждый конфликт разреши явно, с условием проигравшей стороны»
7  VERDICT     score + решение + условия + план 90 дней
8  PERSIST     report + sections в Postgres; memory: ключевые факты → embeddings
9  STREAM      этапы 2–7 транслируются в UI SSE-событиями
               {type:"agent_start"|"agent_done"|"conflict"|"synthesis"|"token"}
10 LEDGER      (план) запись в decision_ledger для будущего обучения
```
Отказоустойчивость: таймаут трека 60s → трек помечается `degraded`, CEO синтезирует без него и указывает пробел; повторный запуск — только упавших треков.

---

## ЧАСТЬ 7 · Memory

| Тип | Хранится | Пишется когда | TTL/чистка | Реализация |
|---|---|---|---|---|
| Short (диалог) | последние ~12 сообщений | каждый ход | конец сессии | массив в запросе (уже есть) |
| Project Memory | бриф, метрики, вердикты | после каждого отчёта | с проектом | rows + embeddings |
| Company/Business DNA | структурный снапшот: стадия, экономика, рынок | after report / user edit | версионируется | `business_dna` jsonb |
| User Memory | стиль, предпочтения, отрасль | явные сигналы («не предлагай X») | user delete (GDPR) | memories(kind='user') |
| Decision Memory | совет → действие → исход | user отмечает исход | никогда (актив) | `decision_ledger` |
| Knowledge | отраслевые пакеты | релизами | по версии | статические + embeddings |

**Retrieval:** перед запуском агента — top-6 фактов по cosine из scope агента + весь Business DNA (он маленький). Обновление: новый факт с конфликтом к старому → старый помечается `superseded`, не удаляется (аудит).

---

## ЧАСТЬ 8 · UI ↔ Backend (ключевые связки)

| Действие UI | Запрос | Ответ | UI-реакция |
|---|---|---|---|
| «▸ Проверить» (демо лендинга) | POST `/api/chat/direct` {message,persona} | SSE token/done | тайпрайтер; fallback-вердикт при ошибке |
| Отправка в Apex Chat | POST `/api/chat/direct` {message,history,image?} | SSE | стрим в пузырь, индикатор набора |
| Визард «Запустить анализ» | POST `/api/projects` → POST `/api/reports/create` | 202 {reportId} | редирект на отчёт, polling статуса |
| Полоса прогресса отчёта | GET `/api/reports/[id]` (poll 3s) | {gen_status, sections} | 5/8 агентов… → рендер |
| Скачать PDF | client: `buildReportHtml()` → window.print | — | новое окно, анимации заморожены print-CSS |
| What-If слайдеры | локальный пересчёт | — | мгновенно, без сети (осознанно) |
| Логин | signIn("credentials") | jwt cookie | router.push(callbackUrl) |
| Хоткеи 1–5 / ⌘B / "/" | client router / localStorage | — | навигация/collapse/поиск |

Ошибки: любой не-2xx → `{success:false,error}` → UI показывает inline-состояние (не тост-спам); 503 от AI → честное «AI недоступен» + retry.

---

## ЧАСТЬ 9 · User Flow (экраны)

1. **Лендинг** → живое демо (2 бесплатных прогона) → вау без регистрации.
2. **/register** (сейчас locked-экран) → после открытия: email+пароль, 1 экран.
3. **Онбординг = /dashboard/new**: Шаг 1 идея (+6 шаблонов) → Шаг 2 рынок/стадия → Шаг 3 цели → «Запустить».
4. **Экран генерации**: живой пайплайн агентов (SSE), ~2–5 мин.
5. **Отчёт**: вердикт+балл с «почему», табы (Диагностика/Команда/Финансы/Рынок/Риски), войс-брифы, What-If, сценарии.
6. **Экспорт**: печатный документ совета (гейдж, графики, 8 мнений, риски).
7. **Paywall**: 2-й полный отчёт → конфигуратор тарифа → Stripe Checkout → webhook → tier.
8. **Возврат**: weekly board email «что изменилось + 3 действия» → отметить исход (→ ledger) → цикл.

---

## ЧАСТЬ 10 · Code Architecture Conventions

- **Naming:** компоненты PascalCase; роуты kebab; таблицы/поля snake_case; env SCREAMING_SNAKE.
- **API:** REST-ish, `{success,data}|{success:false,error}`, SSE для стримов; версионирование через новые пути (не заголовки).
- **Validation:** вся граница — zod (`lib/validators`); внутрь бизнес-логики попадают только типизированные данные.
- **Errors:** пользователю — человеческий текст; в лог — структурно `{route, userId?, err}`; никогда не глотать catch без пометки.
- **Logging:** dev — console (уже за NODE_ENV-гейтом); prod — Sentry + Vercel logs; лог токенов/стоимости на каждый AI-вызов (FinOps).
- **Caching:** статика — CDN; отчёты — immutable после COMPLETED (cache-friendly); LLM-кэш по хэшу (persona+message) для демо-лендинга.
- **Security:** RLS повсюду; rate-limit на публичные AI-роуты; security-заголовки (next.config); секреты только в env; демо-auth-fallback удаляется в проде.
- **Testing (план):** unit — валидаторы и финмодель-валидатор (критично!); integration — API-роуты на тестовой Supabase; e2e — Playwright:登录→бриф→отчёт; contract-тест выхода агентов (парсится ли ⚡CONFLICT и score).
- **CI/CD:** GitHub Actions: `tsc --noEmit` + `next build` + unit на PR; preview-деплой Vercel на каждый PR; main → prod; миграции — `supabase db push` отдельным шагом с ревью.

---

## ЧАСТЬ 11 · Design Review — слабые места и исправления

*Формат: №. Проблема → Исправление. Сгруппировано; топ-30 по реальному риску (остальное — в бэклог с той же схемой).*

**Критические (сломает прод):**
1. Demo-auth принимает любой пароль без Supabase → удалить ветку, feature-flag только для локали.
2. Фоновая генерация отчёта умирает на Vercel → QStash/Upstash очередь или Supabase cron + status polling.
3. Нет валидатора чисел финмодели → правило-движок: LTV=f(ARPU,churn), BE=f(burn,margin); расхождение → регенерация трека.
4. `/api/chat/direct` без auth жжёт токены → captcha-free лимит: IP+fingerprint, дневной бюджет, глобальный kill-switch.
5. Память не реализована при обещании OS → Part 7 в приоритет; до этого не обещать в UI.
6. Два оркестратора + legacy → один модуль `lib/orchestrator`, legacy удалить.
7. Данные агентов дублированы (registry / agents.ts / board route) → единственный источник registry, остальное импортирует.
8. Секции отчёта = jsonb без схемы → zod-схема секции при записи.
9. Нет идемпотентности reports/create → idempotency-key от клиента.
10. gen_status без TTL: вечный PROCESSING при падении → watchdog: >15 мин → FAILED + notify.

**Надёжность/масштаб:**
11. Rate-limit в памяти процесса → Upstash Redis (мульти-инстанс).
12. Polling отчёта каждые 3s всеми клиентами → Supabase Realtime подписка.
13. Нет ретраев Anthropic 529 → экспоненциальный retry ×3 на трек.
14. Счётчик лимитов read-modify-write → атомарный SQL.
15. Embeddings на OpenAI = второй вендор → fallback: Voyage/local; абстракция провайдера.
16. Нет бюджет-алертов по токенам → счётчик стоимости per-org + алерт 80%.
17. История чата не персистится в /chat → conversations для залогиненных.
18. print-PDF зависит от браузера юзера → серверный рендер (react-pdf/gotenberg) как Pro-фича.
19. Один регион БД → read-replica при выходе в новые рынки.
20. Нет e2e на критический путь → Playwright: бриф→отчёт ежедневно на staging.

**Продукт/UX:**
21. Демо-цифры («2,300 основателей») до реальных → заменить на «beta».
22. Нет пустых/ошибочных состояний на части экранов → чек-лист состояний на каждый экран.
23. What-If не связан с реальной моделью отчёта → передавать базовые числа отчёта, не дефолты.
24. Войс-брифы зависят от голосов ОС → серверный TTS как платная фича.
25. Оргчарт фикс-шириной на мобиле → вертикальная раскладка < 640px.
26. Хоткеи цифрами могут конфликтовать с полями → уже guard по activeElement; добавить toggle в настройках.
27. Русский хардкод → i18n-каркас (next-intl) до английского запуска.
28. Нет offline/медленной сети UX → skeleton + retry-кнопки.
29. Score без методологии на лендинге → тултип «как считается» (доверие).
30. Legal-страница без версии/истории → versioned markdown + changelog.

*Бэклог-правило: каждое новое слабое место заводится issue с этой же парой «проблема→исправление».*

---

*Конец v1.0. Изменения — через PR с обновлением соответствующей части.*
