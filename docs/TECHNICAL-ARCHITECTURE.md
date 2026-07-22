# Vertlix AI — Technical Architecture Document

> **Официальный технический стандарт.** Не дизайн, не маркетинг, не UI — инженерная
> архитектура production AI SaaS. Для CTO, разработчиков, DevOps и Security.
>
> Масштаб: **1 000 → 10 000 000+** пользователей. Документ разделяет **✅ Реализовано
> (текущий код)** и **🎯 Целевое (для масштаба)** — чтобы отличать фундамент от плана.
> Дополняет [Product Architecture](./PRODUCT-ARCHITECTURE.md) и [Security Audit](./SECURITY-AUDIT.md).

**Версия 1.0 · 2026-07-22**

---

## 0. Реальный стек vs целевой (честная база)

> В промпте перечислен «идеальный стек» (Prisma, Stripe, OpenAI/Gemini, Datadog). Реальный
> продукт построен иначе и осознанно. Ниже — как есть; целевые замены отмечены 🎯.

| Слой | ✅ Сейчас (в коде) | 🎯 Для масштаба |
|---|---|---|
| Frontend | Next.js **16.2.9** (App Router), React **19**, TS, **Tailwind v4** (@theme), кастомный `ui/` | shadcn-миграция опц.; RSC-оптимизация |
| Backend | Next API Routes (Node + Edge middleware), Zod | вынос тяжёлого в очереди/воркеры |
| DB | **Supabase (PostgreSQL)**, RLS, service-role сервер-сайд | read-replicas, PgBouncer, партиционирование |
| ORM | **НЕ Prisma** — `@supabase/ssr` + типы (`prisma/` удалён) | Drizzle/Prisma опц., если нужен типобезопасный слой |
| Auth | **NextAuth v5** (JWT), OAuth (Google/GitHub), bcrypt(12), **TOTP 2FA**, **passkeys** | SSO/SAML (Enterprise), refresh-rotation |
| AI | **Anthropic Claude** (Opus/Sonnet/Haiku), SSE-стриминг, tools | **Model Router** + OpenAI/Gemini мультипровайдер |
| Cache / Rate-limit | **in-memory Map + опциональный Upstash Redis** (`rate-limit.ts`) | Upstash/Redis обязательно (общий стейт) |
| Billing | **LemonSqueezy** (webhook HMAC), серверные лимиты | Stripe опц.; usage-metering |
| Storage | аватары как **data-URL в БД** | **S3/Supabase Storage** для файлов/аватаров |
| Vector/RAG | ❌ нет | **pgvector/Supabase Vector** + embeddings |
| Analytics | **PostHog** | + product-warehouse |
| Deploy | **Vercel** | Vercel + Cloudflare (WAF/CDN) |
| Monitoring | PostHog события | **Sentry** (ошибки) + **OTel/Datadog** (traces/metrics) |

**Принцип масштабирования:** архитектура уже serverless-first и stateless (JWT, скоуп по tenant),
поэтому переход к 10M идёт заменой инфра-компонентов (cache/storage/monitoring/replicas), а не
переписыванием приложения.

---

## 1. System Overview

```
Client (браузер/моб)
  │  HTTPS
  ▼
Cloudflare (🎯 WAF/CDN/DDoS)  →  Vercel Edge (middleware: auth-gate, edge-safe)
  ▼
Next.js App (App Router)
  ├── Frontend (RSC + client components, Tailwind v4)
  └── API Layer (Route Handlers, Zod-валидация, rate-limit, auth())
        │
        ├── Backend Services (логические: auth/user/workspace/ai/billing/notify/analytics)
        │        │
        │        ├── Supabase Postgres (RLS, service-role, скоуп по tenant)
        │        ├── Cache/Rate-limit (memory → 🎯 Upstash Redis)
        │        └── 🎯 Storage (S3/Supabase), 🎯 Vector DB (pgvector)
        │
        └── AI Layer (Anthropic → 🎯 Model Router) — стриминг SSE
        └── External (LemonSqueezy, Resend, OAuth Google/GitHub, PostHog)
```

**Слои:** Client (рендер) → Edge (гейтинг/безопасность) → App (UI+API) → Services (домены) →
Data (Postgres/cache/storage) → AI (модели) → External (платежи/почта/OAuth/аналитика).

---

## 2. Frontend Architecture

Целевая структура (текущее — плоское `components/`, миграция по фазам):
```
src/
├── app/           # App Router: маршруты, layouts, route handlers (api/)
├── components/
│   ├── primitives/ ui/ composite/ patterns/ blocks/   # Atomic (Component Library)
│   └── providers/  # Session, PostHog, Toast
├── features/      # 🎯 фиче-модули (projects/, ai-chat/, billing/) — со своими hooks/services
├── hooks/         # переиспользуемые хуки
├── lib/           # доменная логика: agents, orchestrator, board, tools, billing, crypto, validators
│   ├── supabase/  # client/server/types
│   └── middleware/ # rate-limit
├── services/      # 🎯 клиентские API-обёртки (typed fetch)
├── store/         # 🎯 клиентский стейт (Zustand) при росте
├── styles/        # tokens.css (@theme)
├── types/         # общие типы
└── utils/         # cn(), форматтеры
```
**Правила:** серверные компоненты по умолчанию, `"use client"` только для интерактива; доменная
логика в `lib/features`, не в компонентах; данные через typed services; ноль хардкод-стилей (токены).
**Масштаб фронта:** code-splitting по маршрутам, RSC для тяжёлого, виртуализация списков, `next/image`.

---

## 3. Backend Architecture (логические сервисы в монолите)

Сейчас — модульный монолит на Route Handlers (правильно для этой стадии); границы сервисов
логические, готовые к выносу.

| Сервис | Ответственность | API | Данные | Зависимости |
|---|---|---|---|---|
| **Auth** | вход/регистрация/2FA/passkey/сессии | `/api/auth/*` | users, user_settings, webauthn_* | NextAuth, bcrypt, otplib, simplewebauthn |
| **User** | профиль/аватар/пароль/экспорт/удаление | `/api/user/*` | users | Supabase |
| **Workspace** | организации/проекты/участники/роли | `/api/projects*`, members | orgs, members, projects | Supabase, RBAC |
| **AI** | чат/оркестрация/агенты/стратегии/память | `/api/chat*`, `/api/agents*`, `/api/strategies*`, `/api/memory` | agents, conversations, messages, strategies, memory_chunks | Anthropic, tools |
| **Billing** | планы/лимиты/вебхуки | `/api/webhooks/lemonsqueezy`, лимиты в create | subscriptions, invoices, usage_stats | LemonSqueezy |
| **Notification** | in-app/email события | `/api/notifications` | notifications | Resend (email) |
| **Analytics** | метрики/админ | `/api/admin/stats`, `/api/dashboard` | usage_stats, activity_logs | PostHog |

🎯 **Вынос:** при масштабе AI-инференс и file-processing → отдельные воркеры/очереди (тяжёлые,
долгие); остальное остаётся в edge/serverless-функциях.

---

## 4. API Architecture (REST)

Конвенции: JSON, `{ success, data | error }`, HTTP-статусы честные (401/403/404/402/422/429/500),
**Zod-валидация** на входе, `auth()` (NextAuth) + скоуп по tenant, rate-limit, **generic-ошибки**
(без сырого текста БД/провайдера).

| API | Endpoints (пример) | Методы | Security |
|---|---|---|---|
| **Auth** | `/api/auth/[...nextauth]`, `/register`, `/verify-email`, `/passkey/*`, `/2fa/*` | POST/GET | rate-limit, энумерация-safe, HMAC-токены |
| **User** | `/api/user`, `/user/avatar`, `/user/password`, `/user/export` | GET/PATCH/POST/DELETE | auth, скоуп по себе, whitelist |
| **Workspace/Project** | `/api/projects`, `/projects/[id]` | GET/POST/PATCH/DELETE | auth, скоуп `user_id/org`, план-лимит 402 |
| **Agent** | `/api/agents`, `/agents/[id]`, `/agents/custom*`, `/agents/favorites` | GET/POST/PATCH/DELETE | auth, org-скоуп (IDOR закрыт), whitelist |
| **Conversation/AI** | `/api/chat/direct` (SSE), `/chat/[id]/messages|send`, `/chat/orchestrate` | POST/GET | **auth обязателен** (платный LLM), rate-limit по юзеру |
| **Billing** | `/api/webhooks/lemonsqueezy` | POST | **HMAC-подпись** (timingSafeEqual) |
| **Analytics** | `/api/admin/stats`, `/api/dashboard` | GET | auth + admin-роль |

Request/Response/Validation — Zod-схемы (`src/lib/validators`); ошибки валидации → 422 с полями.

---

## 5. Database Architecture (Supabase Postgres)

33 таблицы, RLS на всех (anon заблокирован, сервер — service-role). Ключевые сущности:

| Entity | Поля (сокр.) | Связи | Индексы |
|---|---|---|---|
| **User** | id(uuid), email(uniq), name, avatar_url, role, tier, password_hash, email_verified, 2fa_* | 1—N members/projects | email(uniq) |
| **Account/Session** | (NextAuth JWT — сессии stateless, БД-таблицы опц.) | — | — |
| **Organization** | id, name, owner_id, plan | 1—N members/projects | owner_id |
| **Member** | user_id, organization_id, role | N—1 user/org | (user_id,org_id) uniq |
| **Project** | id, user_id, org_id, name, industry, stage, goals, overall_score, ai_results(jsonb), status | 1—N conv/strategy/report/task | user_id, org_id, created_at |
| **Agent / CustomAgent** | org_id/user_id, name, role, system_prompt, model, temperature, tools | N—N projects | org_id / (user_id,id) |
| **Conversation / Message** | user_id, project_id / conv_id, role, content, tokens_used | 1—N / N—1 | conv_id, created_at |
| **Strategy / StrategySection** | project_id, section(vision..risks), content | N—1 project | project_id |
| **Document / VaultItem / MemoryChunk** | user_id/org, type, content, tags, **embedding(vector)🎯** | knowledge | user_id; 🎯 ivfflat(embedding) |
| **Subscription/Invoice/Usage** | org_id, plan, status, usage | N—1 org | org_id |
| **Notification/AuditLog(activity_logs)/SupportTicket** | user/org, type, data(jsonb) | — | user_id, created_at |
| **webauthn_credentials/challenges, user_settings** | user_id, ... | N—1 user | user_id |

**Правила:** UUID PK, `created_at/updated_at`, FK с индексами, jsonb для гибких полей, RLS force,
скоуп по `user_id/organization_id`. 🎯 Индексы под частые запросы (project list, message history),
партиционирование `messages` по времени при росте.

---

## 6. AI Architecture (пайплайн)

```
User Request → Prompt Processing (персона + контекст + guardrails)
  → Context Retrieval (проект/диалог; 🎯 RAG из KB)
  → Memory (short: диалог; long: 🎯 vector-память)
  → Model Router (🎯 выбор провайдера/модели по задаче/плану/стоимости)
  → AI Model (Anthropic Claude: Opus/Sonnet/Haiku) — стриминг
  → Response Processing (парс, markdown, извлечение reasoning/confidence/sources)
  → Evaluation (🎯 guardrails, anti-hallucination, качество)
```
**Реализовано:** промпт-персоны 20 директоров, стриминг SSE (`chat/direct`), оркестрация совета
(direct/orchestrate), tools (MRR/ARR — `tools.ts`), заседания/голосования. **Стриминг** — token-by-token
(`ReadableStream` + SSE), `maxDuration=120`. **🎯:** model-router (мультипровайдер), RAG-контекст,
eval-слой, кэш ответов/эмбеддингов.

---

## 7. AI Agents System

Каждый агент = конфиг (`src/lib/agents.ts`):
```ts
Agent = {
  identity: { id, name, role, color, avatar },      // CEO — Стратег, ...
  instructions: system_prompt,                       // персона-промпт
  tools: [...],                                       // MRR/ARR-калькуляторы, 🎯 web/docs
  memory: conversation + 🎯 long-term(vector),
  knowledge: project context + 🎯 KB/RAG,
  permissions: org-scope,                             // кто может запускать (RBAC)
  model: "claude-opus/sonnet/haiku",                 // по плану/задаче
  temperature, max_tokens, limits                    // rate-limit по юзеру
}
```
**Оркестрация:** совет = несколько агентов → выступления → голосование (`board_*`) → синтез CEO.
Единый каркас (Philosophy P15); ответы 7–12 предложений с обоснованием.

---

## 8. Memory System

| Тип | Что | Реализация |
|---|---|---|
| **Short-term** | текущий диалог | messages в контексте запроса ✅ |
| **Long-term** | знания о бизнесе/юзере | 🎯 `memory_chunks` + embeddings + RAG |
| **User Memory** | предпочтения, стиль | user_settings ✅ + 🎯 vector |
| **Project Memory** | контекст проекта | project + strategies ✅ + 🎯 vector |

🎯 **Vector DB:** pgvector в Supabase → embedding при сохранении → semantic retrieval (top-K) →
инъекция в промпт (RAG). Инвалидация при изменении источника.

---

## 9. File Processing System (🎯 V2)

```
Upload (client) → Storage (S3/Supabase, антивирус, лимит размера/типа)
  → Processing (очередь/воркер) → Extraction (PDF/DOCX/TXT/CSV → текст; OCR для images)
  → Chunking → Embedding → Knowledge Base (pgvector) → доступно агентам (RAG)
```
**Безопасность (заложить сразу):** whitelist MIME, лимит размера, санитайз имён, приватные бакеты
(signed URLs), сканирование, изоляция по tenant. Тяжёлое — асинхронно (очередь), не в request-цикле.
Сейчас: аватары — client-resize + data-URL (без бакета); файлов-KB нет.

---

## 10. Authentication Security (✅ реализовано)

- **OAuth** (Google/GitHub) · **JWT-сессии** (NextAuth, secure/httpOnly/sameSite, 30д) ·
  **MFA/TOTP** (otplib, enforced на входе, backup-коды, AES-256-GCM секрет) ·
  **Passkeys** (WebAuthn, counter/clone-detection) · **Password Reset & Email Verification**
  (подписанные self-expiring HMAC-токены, purpose-изоляция) · **rate-limit** (10/15мин).
- 🎯 **Refresh-token rotation**, **Device Management** (список сессий, «выйти со всех» через
  token-version claim — спроектировано), **SSO/SAML** (Enterprise).

---

## 11. Authorization System (✅ RBAC)

- Роли: owner/admin/manager/member/viewer (`members.role`); скоуп по `organization_id`/`user_id`.
- Проверка **на сервере** (не только UI); whitelist полей (нет mass-assignment); IDOR закрыт
  (org-скоуп на agents/[id], ownership-check на conversations). Workspace/Org access — через members.
- 🎯 Гранулярные permissions (feature-flags по плану), policy-слой `requireRole()`.

---

## 12. Billing Architecture

- **Реализовано:** LemonSqueezy-подписки, webhook (**HMAC-SHA256 + timingSafeEqual**), серверные
  план-лимиты (Free = 3 проекта → **402** + `upgradeUrl`; reports/месяц), usage в `usage_stats`.
- Поток: checkout → webhook (`subscription_created/updated`) → обновление `plan` организации →
  лимиты применяются на сервере при каждом действии.
- 🎯 Stripe (альтернатива/доп.), usage-metering (per-token AI-биллинг), invoices/refunds UI,
  proration при апгрейде/даунгрейде, grace-период при неудачной оплате.

---

## 13. Notification System

| Канал | Статус | Реализация |
|---|---|---|
| **In-app** | ✅ | `notifications` + тосты + `aria-live` |
| **Email** | ✅ частично | Resend (auth: verify/reset); 🎯 транзакционные (отчёт готов, инвайт, лимит) |
| **Push** | 🎯 | Web Push / FCM |
| **Telegram** | 🎯 | бот + opt-in |

🎯 **Архитектура доставки:** событие → очередь → фан-аут по каналам (по настройкам юзера) →
идемпотентная доставка + ретраи. События: AI-задача/отчёт/заседание готовы, лимит, инвайт, security.

---

## 14. Cache Architecture

- **Реализовано:** rate-limit — in-memory `Map` **+ опциональный Upstash Redis** (durable, shared
  across instances; fallback на память). На serverless память — per-instance, поэтому Upstash для
  корректных глобальных лимитов.
- 🎯 **Redis (Upstash) как основной кэш:** сессионные/справочные данные, дорогие агрегаты (дашборд),
  **кэш AI-ответов** (по хешу промпта) и эмбеддингов, план-лимиты/usage-счётчики.
- **Что кэшировать:** редко меняющееся + дорогое (org-план, каталог агентов, дашборд-агрегаты).
  **Инвалидация:** по событию записи (write-through/бинды) + TTL. **Не кэшировать:** приватное без
  скоупа, стриминг AI.

---

## 15. Search Architecture

- **Global Search / ⌘K** (✅ Command Palette): действия/навигация/проекты.
- 🎯 **Full-text** (Postgres `tsvector`/`pg_trgm`) — проекты/заметки/сообщения.
- 🎯 **Vector Search** (pgvector) — семантический поиск по знаниям/памяти (RAG).
- 🎯 **AI Search** — гибрид FTS + vector + reranking; результаты помечены как AI, с источниками.

---

## 16. Security Architecture (✅ прошёл аудит — см. SECURITY-AUDIT.md)

- **OWASP Top-10 / API Top-10:** IDOR/mass-assignment/broken-auth закрыты; открытый LLM-эндпоинт
  закрыт; auth унифицирован.
- **Rate Limiting** (memory+Upstash, по юзеру/IP). **Encryption:** TLS, AES-256-GCM (2FA-секреты),
  bcrypt(12). **Secrets:** только env, service-role не в браузере, ANON-ключ заблокирован RLS.
- **Security Headers:** CSP, HSTS(preload), COOP, CORP, Origin-Agent-Cluster, Permissions-Policy,
  X-Content-Type/Frame. **Audit Logs:** activity_logs + журнал безопасности.
- 🎯 **Cloudflare** (WAF/Bot/DDoS/Turnstile), **Sentry** (security-события), dependency-CI (CVE),
  централизованный `jsonError()`, SOC 2 (Enterprise).

---

## 17. DevOps Architecture

- **Git Workflow:** trunk-based / feature-branches → PR → review → merge в main; фичи за флагами.
- **CI/CD:** на PR — typecheck (`tsc`), lint, build, тесты, `npm audit`; на merge — деплой Vercel
  (preview на PR, prod на main). 🎯 добавить: e2e-гейт, миграции-гейт, security-scan.
- **Deployment:** Vercel (edge/serverless, атомарные деплои, мгновенный rollback). Миграции Supabase
  — версионированные SQL (`supabase/migrations/*`), применяются контролируемо (RLS до, service-role sync).
- **Environments:** Development (локально/preview) · Testing (preview + seed) · Production (main).
  Секреты — per-env в Vercel; ключи не пересекаются.

---

## 18. Testing Architecture

| Уровень | Что | Инструмент (🎯) |
|---|---|---|
| **Unit** | lib-логика (validators, crypto, tokens, tools, billing-лимиты) | Vitest |
| **Integration** | API-роуты (auth-гейты, скоуп, лимиты, вебхуки) | Vitest + supertest |
| **E2E** | ключевые флоу (login→2FA→dashboard; create→optimistic→sync; AI-стрим) | Playwright |
| **Load** | AI-эндпоинты, дашборд, rate-limit под нагрузкой | k6 |
| **Security** | authz-матрица (IDOR), fuzz-инпуты, dependency-CVE | ZAP/`npm audit`/custom |

**Приоритет тестов:** сначала security-инварианты (скоуп/лимиты/авторизация — уже проверялись
рантаймом) и биллинг-лимиты; затем AI-флоу. Цель покрытия: критичные пути 100%.

---

## 19. Monitoring

- **Сейчас:** PostHog (продуктовые события: регистрации, входы, AI-использование, конверсии).
- 🎯 **Sentry** — ошибки фронта/бэка, security-события, алерты на спайки auth-fail.
- 🎯 **OpenTelemetry → Datadog/Grafana** — traces (запрос→БД→AI), metrics, logs.
- **Отслеживать:** Errors (rate/новые), Latency (p50/p95/p99 по эндпоинту), **API/AI usage**,
  **AI cost** (токены×модель — прямые деньги), DB performance (медленные запросы, пул), rate-limit-хиты.
- **Алерты:** error-spike, latency-SLO breach, AI-cost аномалия, БД-пул исчерпан, 5xx-рост.

---

## 20. Scalability (1K → 10M)

| Этап | Узкие места | Действия |
|---|---|---|
| **1K** | нет | текущая архитектура (Vercel + Supabase + memory-limit) держит |
| **100K** | rate-limit per-instance, дашборд-запросы, AI-стоимость | **Upstash Redis** (общий), кэш агрегатов, кэш AI-ответов, индексы |
| **1M** | БД-нагрузка, connection pool, файлы | **read-replicas + PgBouncer**, S3-storage, очереди для AI/файлов, CDN (Cloudflare) |
| **10M** | инференс-стоимость, hot-таблицы, регионы | **model-router** (дешёвые модели где можно) + prompt-cache, партиционирование `messages`, мульти-регион, вынос AI/worker-сервисов |

**Инварианты, дающие масштаб:** stateless (JWT), tenant-изоляция (RLS+скоуп), serverless-first,
токен-стриминг (перцептивная скорость), оптимистичный UI + локальный кэш (меньше нагрузки на БД).

---

## 21. Project Structure (финальная, целевая)

```
vertlix-ai/
├── src/
│   ├── app/              # маршруты + api/ (route handlers) + layouts
│   ├── components/       # primitives/ ui/ composite/ patterns/ blocks/ providers/
│   ├── features/         # 🎯 фиче-модули (projects, ai-chat, billing, team)
│   ├── lib/              # agents, orchestrator, board, tools, billing, crypto,
│   │   ├── supabase/     # client, server, types
│   │   ├── middleware/   # rate-limit
│   │   └── validators/   # Zod-схемы
│   ├── hooks/ services/ store/ types/ utils/ styles/(tokens.css)
│   ├── auth.ts / auth.config.ts / middleware.ts
├── supabase/migrations/  # версионированные SQL (RLS, схема)
├── design/               # figma-variables.json (DTCG)
├── docs/                 # архитектура (этот набор), security, дизайн-система
├── public/               # статика
├── next.config.ts        # security headers, images
├── tailwind.config.ts    # портируемый токен-конфиг (v4 @theme в tokens.css)
└── package.json / tsconfig / postcss.config
```

---

## 22. Development Roadmap

| Фаза | Название | Содержание | Статус |
|---|---|---|---|
| **1 · Foundation** | Каркас | Next/TS/Tailwind, Supabase+RLS, Auth+2FA+passkeys, security-headers, rate-limit | ✅ Готово |
| **2 · Core SaaS** | Продукт | Проекты, агенты, стратегии, отчёты, настройки, роли, дашборд | ✅ В основном готово |
| **3 · AI System** | Интеллект | Стриминг ✅, оркестрация/совет ✅; 🎯 model-router, RAG/vector-память, file-processing, eval | 🟡 Идёт |
| **4 · Payments** | Монетизация | LemonSqueezy ✅, план-лимиты ✅; 🎯 usage-metering, invoices/refunds UI, proration | 🟡 Идёт |
| **5 · Scale** | Инфраструктура | 🎯 Upstash Redis, S3, read-replicas/PgBouncer, Cloudflare, Sentry/OTel, очереди, мульти-регион | ⬜ Впереди |

---

## 23. Final — резюме для CTO

**Vertlix AI** — serverless-first AI SaaS на **Next.js 16 + Supabase + NextAuth v5 + Anthropic**,
уже с продакшн-безопасностью (RLS на всех таблицах, 2FA/passkeys, закрытые IDOR/mass-assignment,
security-headers, rate-limit). Архитектура **stateless и tenant-изолирована**, поэтому путь к 10M —
это замена инфра-компонентов (Redis/S3/replicas/monitoring/model-router), а не переписывание.

**Готовность по аудиенциям:**
- **CTO:** §0 (стек as-is vs target), §20 (scale-план по этапам), §22 (roadmap с честными статусами).
- **Developers:** §2–5, §21 (структура, API-конвенции, сущности/индексы).
- **DevOps:** §14, §17, §19, §20 (cache, CI/CD, monitoring, scale).
- **Security:** §10, §11, §16 + [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) (auth, RBAC, OWASP).

**Аудит документа — устранённые слабые места:**
1. Стек-иллюзия (промпт: Prisma/Stripe/OpenAI) → §0 честно фиксирует реальное (Supabase/LemonSqueezy/
   Anthropic) и целевое; ни одна замена не выдана за «уже сделанное».
2. «Микросервисы ради галочки» → зафиксирован модульный монолит с логическими границами (правильно
   для стадии) + явные точки выноса (AI/файлы) при масштабе.
3. Cache/Redis-неясность → уточнено: memory + опциональный Upstash уже в коде; Redis обязателен с 100K.
4. Непостроенное (RAG, file-processing, push/telegram, model-router, Sentry) → помечено 🎯/V2, не готовым.

---

*Companion: [Product Architecture](./PRODUCT-ARCHITECTURE.md) · [Security Audit](./SECURITY-AUDIT.md) ·
дизайн-система: [Design Ops](./DESIGN-OPS.md) и др. · инфра: `next.config.ts`, `supabase/migrations/`.*
