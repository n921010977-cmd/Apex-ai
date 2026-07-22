# Vertlix AI — Cloud Infrastructure & DevOps Guide

> **Официальный стандарт инфраструктуры.** Не дизайн, не frontend, не бизнес-логика — production
> инфраструктура масштабируемого AI SaaS. Дополняет [Technical Architecture](./TECHNICAL-ARCHITECTURE.md),
> [Security Architecture](./SECURITY-ARCHITECTURE.md), [cloudflare-security.md](./cloudflare-security.md).
>
> **Реальность (SRE-честность):** Vertlix AI — **managed serverless**: **Vercel** (Next.js 16) +
> **Supabase** (managed Postgres) + опциональный **Upstash Redis**. **Нет** собственного Docker/K8s/
> Terraform — и это **правильно** для стадии: managed-PaaS даёт HA/масштаб/бэкапы из коробки без
> ops-оверхеда. Путь к 10M — добавление компонентов (Redis/S3/queues/CDN/monitoring), а не
> «поднять кластер». Ниже: **✅ сейчас** vs **🎯 целевое**. Промпт называет Prisma/OpenAI/Gemini/
> Stripe — реально Supabase/Anthropic/LemonSqueezy.

**Версия 1.0 · 2026-07-22** · масштаб до **10M+**

---

## 1. Cloud Architecture Overview

```
User
 ↓ HTTPS
Cloudflare 🎯   (DNS · CDN · WAF · DDoS · Bot · Turnstile)
 ↓
Vercel Edge     (middleware: auth-gate, geo, кэш статики) — CDN Vercel ✅
 ↓
Application      (Next.js 16 App Router: RSC + client) ✅
 ↓
API              (Route Handlers: auth() + Zod + rate-limit) ✅
 ↓
Data             Supabase Postgres (RLS, PgBouncer) ✅ · Upstash Redis ✅опц · S3 🎯
 ↓
AI Services      Anthropic Claude ✅ (🎯 model-router / OpenAI / Gemini)
```
**Слои:** Cloudflare (первый рубеж: безопасность+CDN) → Vercel Edge (гейтинг, ближе к юзеру) →
App (рендер) → API (логика+защита) → Data (состояние) → AI (инференс). Каждый — независимо масштабируется.

---

## 2. Environment Strategy

| Env | Назначение | Переменные | Доступы | Безопасность |
|---|---|---|---|---|
| **Development** | локально | `.env.local` (dev-ключи, demo-mode без Supabase) | разработчик | секреты не в git |
| **Preview** (Testing) | автопревью на PR | Vercel Preview env (изолированные тест-ключи) | команда | отдельная БД/проект Supabase (не прод!) |
| **Staging** 🎯 | прод-подобное | Staging env (staging-Supabase, staging-ключи) | QA/релиз | прод-парити, синтетика-данные |
| **Production** | боевое | Vercel Prod env (прод-секреты) | минимум (owner/CI) | RLS, HSTS, service-role только сервер |

**Правила:** секреты — per-env в Vercel (не пересекаются); прод-ключи недоступны в preview; каждый env
= свой проект Supabase (изоляция данных); `NEXT_PUBLIC_*` — только публичное.

---

## 3. Git Workflow

- **Ветки:** `main` (прод, защищён) · `develop` 🎯 (интеграция) · `feature/*` (задачи) · `hotfix/*` (срочные фиксы в прод).
- **Правила веток:** `main` — защита (PR + review + зелёный CI + no force-push); прямой пуш запрещён.
- **Pull Request:** маленький, one-concern; описание + скриншоты/verification; линкует задачу.
- **Code Review:** ≥1 аппрув; security-ось (Design-Ops §7); авто-чеки (lint/type/build/test) обязательны.
- **Merge Strategy:** **squash-merge** в `main` (чистая история, 1 коммит = 1 фича); rebase для актуализации ветки; ветка удаляется после мержа.
- **Текущее:** работа в `feature`-ветке → PR в `main`. `develop`/`hotfix` вводятся при росте команды.

---

## 4. CI/CD Pipeline (🎯 — сейчас Vercel auto-deploy без CI-гейтов)

```
Code Push → Install deps → Lint → Type Check → Unit Tests → Security Scan → Build → Deploy
```
Целевой GitHub Actions (`.github/workflows/ci.yml`):
```yaml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint                 # ESLint
      - run: npx tsc --noEmit             # Type check
      - run: npm test --if-present        # Unit (Vitest) 🎯
      - run: npm audit --omit=dev || true # Dependency scan (не блокирует на transient)
      - run: npm run build                # Build gate
  migrations-check:                        # 🎯 миграции применяются чисто с нуля
    runs-on: ubuntu-latest
    steps: [ "supabase db reset на seed-БД" ]
```
Деплой — **Vercel Git-интеграция** (preview на PR, prod на merge в `main`) ✅. 🎯 добавить: e2e-гейт
(Playwright), SAST (CodeQL/Semgrep), secret-scan (gitleaks), миграции-гейт.

---

## 5. Deployment Strategy

- **Continuous Deployment:** merge в `main` → авто-деплой Vercel prod ✅.
- **Preview Deployments:** каждый PR → изолированный URL (тест на прод-подобном) ✅.
- **Automatic Deploy / Zero Downtime:** Vercel — **атомарные immutable-деплои** (новая версия готова → мгновенное переключение трафика; нет даунтайма) ✅.
- **Rollback:** Vercel **instant rollback** на предыдущий immutable-деплой (секунды) ✅; для БД — forward-fix + PITR.
- **DB-миграции при деплое:** **expand→migrate→contract** для breaking-изменений колонок (сначала совместимая схема, деплой кода, потом чистка) — zero-downtime.

---

## 6. Docker Architecture (🎯 — только для воркеров; app на Vercel НЕ контейнеризован)

> Приложение работает на Vercel serverless — **Docker не нужен и не используется** (zero-config).
> Контейнеры уместны только для 🎯 **фоновых воркеров** (очередь: AI-обработка, файлы, отчёты),
> которые нельзя гонять в 10-сек serverless-лимите.

Целевой worker-`Dockerfile` (multi-stage, оптимизированный):
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app     # non-root
COPY --from=deps /app/node_modules ./node_modules
COPY worker/ ./worker/
USER app                                          # least privilege
CMD ["node", "worker/index.js"]
```
- **Размер:** alpine + multi-stage + `--omit=dev` (минимум). **Безопасность:** non-root, no secrets в
  образе (env в рантайме), scan образа. **Скорость:** слой deps кэшируется (COPY package* до кода).
- **Images/Containers/Volumes/Networks:** воркеры — stateless (без volume); сеть — приватная к БД/Redis;
  оркестрация — Fly.io/Railway/ECS/🎯 K8s (только если много воркеров).

---

## 7. Vercel Architecture

- **Next.js Deployment:** App Router, RSC по умолчанию, автосборка ✅.
- **Edge Functions:** `middleware.ts` (auth-gate, гео) — near-user, low-latency; **без Node-crypto** (edge-safe) ✅.
- **Serverless Functions:** Route Handlers (`/api/*`) — Node-рантайм для bcrypt/otplib/Anthropic; `maxDuration=120` для AI ✅.
- **Когда что:** **Edge** — лёгкое, глобальное, быстрое (гейтинг, редиректы); **Serverless** — Node-зависимости, БД, AI, дольше; **RSC/статика** — рендер, кэш на CDN.
- **Env Vars:** per-env (dev/preview/prod), секреты не в билд-бандл (только `NEXT_PUBLIC_*` инлайнятся) ✅.
- **Preview Deployments:** на каждый PR ✅.

---

## 8. Cloudflare Architecture (🎯 — план в [cloudflare-security.md](./cloudflare-security.md))

- **DNS:** Cloudflare как authoritative DNS; проксирование (оранжевое облако) на Vercel; каноникализация домена.
- **CDN/Caching:** кэш статики/ассетов на edge; `Cache-Control` уважается; API/стриминг — bypass (не кэшировать приватное/SSE).
- **WAF:** managed rules (OWASP) + custom (блок инъекц-паттернов, гео при необходимости).
- **DDoS Protection:** L3/L4/L7 автоматом (Cloudflare).
- **Bot Protection / Turnstile:** Bot Fight + **Turnstile-CAPTCHA** на login/register (app готов — `CF-Connecting-IP` учитывается rate-лимитером ✅).
- **Правила:** rate-limit на edge (первый рубеж перед app-лимитом), challenge подозрительным, allowlist для webhook/health.

---

## 9. Database Infrastructure (Supabase Postgres)

- **Connection Pooling:** **PgBouncer** (Supabase pooler) — обязателен для serverless (каждая функция = коннект); `DATABASE_URL` пулед, `DIRECT_URL` для миграций. ✅
- **Backups:** Supabase daily ✅; 🎯 **PITR** на прод (восстановление на момент — критично для платежей).
- **Replication:** 🎯 **read-replicas** при 1M+ (чтение — на реплики, запись — на primary); Supabase поддерживает.
- **Monitoring:** `pg_stat_statements`, медленные запросы, пул (§13).
- **Migration Strategy:** версионированные SQL (`supabase/migrations/*`), forward-only, идемпотентные; RLS-изменения **до** переключения ключа; CI-гейт «чистая миграция с нуля» (§4). ⚠️ дубль `001` — консолидировать (см. [DATABASE-ARCHITECTURE.md §20](./DATABASE-ARCHITECTURE.md)).

---

## 10. Redis Architecture (Upstash — serverless-friendly)

- **Реализовано:** rate-limit (in-memory Map + **Upstash Redis** durable/shared; fallback на память). ✅
- **Использование:** **Cache** (дорогие агрегаты дашборда, план орг, каталог агентов, 🎯 AI-ответы по хешу) ·
  **Rate Limiting** ✅ (глобальные счётчики across-instances) · **Sessions** — не нужны (JWT stateless) ·
  **Queues** 🎯 (лёгкие — Upstash QStash; тяжёлые — отдельная очередь §12) · **Usage-счётчики** 🎯 (горячие инкременты → флаш в БД).
- **Что хранить:** эфемерное/производное/горячее (кэш, счётчики, лимиты). **Что НЕ хранить:** источник
  правды, приватное без скоупа/шифрования, крупные блобы. **Инвалидация:** write-through + TTL.

---

## 11. Storage Architecture (🎯 — сейчас data-URL)

- **Сейчас:** аватары — client-resize + data-URL в `users.avatar_url` (без бакета) ✅; файлов-документов нет.
- 🎯 **S3-compatible** (Supabase Storage / AWS S3 / R2): **приватные** бакеты + **signed URL** (не публичные);
  структура `org/{orgId}/...` (tenant-изоляция); CDN перед публичными ассетами.
- **Поддержка:** Documents (KB/RAG), Images (аватары/обложки), AI Files. **Безопасность:** MIME-whitelist,
  лимит размера, антивирус, вне webroot (см. [Security Arch §12](./SECURITY-ARCHITECTURE.md)).

---

## 12. Queue System (🎯 — фоновые задачи)

Нужно, т.к. serverless-функции ограничены по времени, а часть работы — долгая/тяжёлая.
- **Очередь:** Upstash QStash (serverless-native) / BullMQ на Redis / SQS.
- **Для:** **AI Processing** (batch-анализ, длинные генерации), **Emails** (транзакционные), **Reports** (PDF),
  **File Processing** (parse→chunk→embed для RAG), **Analytics** (агрегация).
- **Паттерн:** API кладёт job → воркер (§6 Docker) обрабатывает → результат в БД + notification.
  Идемпотентность (dedup по job-id), ретраи с backoff, DLQ для упавших.

---

## 13. Monitoring Architecture

- **Сейчас:** PostHog (продуктовые события) ✅.
- 🎯 **Sentry** — errors (фронт/бэк) + security-события + release-tracking.
- 🎯 **OpenTelemetry → Datadog** — traces (request→БД→AI), metrics, logs (единая корреляция).
- **Отслеживать:** Errors (rate/новые) · Latency (p50/p95/p99, TTFB, TTFT для AI) · CPU/Memory (serverless-функции/воркеры) · Database (медленные запросы, пул, storage) · API (RPS, 4xx/5xx) · **AI Costs** (токены×модель — прямые деньги, first-class метрика).

---

## 14. Logging System

- **Application Logs:** structured JSON (`{ts, level, msg, requestId, userId?, route}`); Vercel-логи → 🎯 drain в Datadog/Logtail.
- **Security Logs:** `activity_logs` (`type like 'security.%'`) — вход, 2FA, passkey, permission-changes ✅.
- **Audit Logs:** `activity_logs` (admin/data-действия) ✅; 🎯 tamper-evident для Enterprise.
- **Performance Logs:** latency/slow-query метрики → мониторинг.
- **Формат:** structured JSON (парсится/фильтруется). **Хранение:** горячие 30д + архив (retention по GDPR). **Поиск:** 🎯 централизованный log-search (Datadog/Loki). **Правило:** никогда не логировать секреты/пароли/токены/PII.

---

## 15. Alerting System

| Триггер | Порог | Канал |
|---|---|---|
| **Critical Error** | новый/спайк error-rate | Slack + Email + 🎯 PagerDuty |
| **Database Failure** | пул>80%, connection-fail, реплика-лаг | Slack + on-call |
| **High Latency** | p95 > SLO | Slack |
| **Security Attack** | auth-fail spike, WAF-события, cross-tenant попытки | Slack + Email (security) |
| **High AI Costs** | аномалия $/час | Slack + Email |

**Каналы:** Slack (основной), Email, 🎯 Telegram (опц.). Правила: severity-роутинг (crit → on-call/pager,
warn → канал); дедуп/группировка (no alert-fatigue); runbook-ссылка в алерте.

---

## 16. Scalability Strategy

| Масштаб | Узкие места | Что менять |
|---|---|---|
| **1K** | нет | текущее (Vercel + Supabase + memory-limit) ✅ |
| **100K** | rate-limit per-instance, дашборд-запросы, AI-cost | **Upstash Redis** (общий), кэш агрегатов + AI-ответов, индексы, Cloudflare CDN |
| **1M** | БД-нагрузка, пул, файлы, тяжёлые задачи | **read-replicas + PgBouncer**, **S3-storage**, **очередь+воркеры**, edge-кэш |
| **10M** | инференс-стоимость, hot-таблицы, регионы | **model-router** (дешёвые модели + prompt-cache), партиционирование `messages`, мульти-регион, вынос воркеров, DB-per-large-tenant для Enterprise |

**Инвариант:** app **stateless** (JWT) + **tenant-изолирован** (RLS) + serverless — горизонтальный
масштаб автоматом (Vercel), рост = добавление компонентов данных, не переписывание.

---

## 17. High Availability

- **Backup:** Supabase daily ✅ + 🎯 PITR; тест восстановления регулярно (бэкап без теста = нет бэкапа).
- **Failover:** Vercel мульти-region edge ✅; 🎯 Supabase read-replica/standby; 🎯 мульти-провайдер AI (роутер с фолбэком при сбое Anthropic).
- **Disaster Recovery:** runbook (кто/что/куда); восстановление из снапшота/PITR; 🎯 cross-region реплика для крупного масштаба.
- **RTO** (target): ≤ 1ч (восстановление из снапшота) / минуты (Vercel rollback, PITR-точка).
- **RPO** (target): ≤ 24ч (daily) → ≤ минуты (**PITR** — обязателен на прод с платежами).

---

## 18. Performance Optimization

- **Frontend:** RSC (меньше JS), code-split по маршрутам, `next/image`, `next/font` (self-host), виртуализация списков, ноль CLS. ✅
- **Backend:** edge для лёгкого, кэш дорогих агрегатов, оптимистичный UI (меньше нагрузки), стриминг. ✅
- **Database:** индексы под запросы, курсорная пагинация, избегать N+1, `EXPLAIN ANALYZE`, PgBouncer, 🎯 реплики.
- **AI Requests:** Haiku по умолчанию + Opus для сложного (роутер), 🎯 prompt-prefix cache + response-cache, стриминг (perceived speed), обрезка контекста.
- **Методы:** Caching (Redis/CDN/prefix) · CDN (Cloudflare/Vercel) · Lazy Loading · токен-оптимизация.

---

## 19. Cost Optimization

- **Cloud (Vercel):** serverless = плата за использование; кэш на CDN снижает функц-инвокации; edge для дешёвого гейтинга.
- **Database (Supabase):** правильные индексы (меньше CPU), пул (меньше коннектов), архивация старого (`messages` retention/партиции), реплики только при нужде.
- **AI API (крупнейшая статья):** **model-router** (дешёвые модели где можно) · **prompt-prefix cache** (Anthropic) · **response-cache** (Redis по хешу) · обрезка контекста · батчинг фоновых · лимиты по плану (не жечь на free). ✅частично/🎯
- **Storage/Bandwidth:** сжатие (WebP/AVIF), CDN-кэш, S3-lifecycle (архив холодного), приватные бакеты.
- **Правило:** AI-cost и БД — мониторятся как first-class (§13); алерт на аномалии (§15).

---

## 20. Security Operations (DevSecOps)

- **Secrets Management:** env per-env в Vercel; **никогда не коммитить** (проверено аудитом); service-role только сервер-сайд; 🎯 ротация ключей + gitleaks в CI. ✅/🎯
- **Access Control:** минимум доступов к прод (owner/CI); MFA на Vercel/Supabase/GitHub; branch-protection на `main`. ✅/🎯
- **Dependency Scanning:** 🎯 `npm audit` + Dependabot/Snyk в CI (сейчас 5 CVE — точечный апдейт, не `--force`).
- **Vulnerability Checks:** 🎯 SAST (CodeQL/Semgrep), DAST (ZAP на preview), регулярный vuln-scan.
- Полная модель — [Security Architecture](./SECURITY-ARCHITECTURE.md).

---

## 21. Infrastructure as Code (🎯 — managed-first, IaC для параметризуемого)

> Vercel/Supabase — **managed** (конфиг в панели/CLI), не через Terraform «сервер». IaC применяется к
> **параметризуемым ресурсам**: Cloudflare (DNS/WAF/rules), Upstash, env-переменные, S3-бакеты/политики.

Целевой Terraform-скоуп:
```hcl
# providers: cloudflare, vercel, upstash, aws(s3)
resource "cloudflare_record"        "app"      { ... }   # DNS
resource "cloudflare_ruleset"       "waf"      { ... }   # WAF/rate-rules
resource "vercel_project_environment_variable" "secrets" { ... }
resource "upstash_redis_database"   "cache"    { ... }
resource "aws_s3_bucket"            "files"    { ... }   # приватный + policy
```
- **Resources:** DNS/WAF (Cloudflare), env (Vercel), Redis (Upstash), storage (S3) — версионируемы, review в PR.
- **Networks:** приватный доступ к БД/Redis (🎯 VPC/private-networking для Enterprise).
- **Deployment:** `terraform plan` в PR, `apply` из CI после аппрува (как код-миграции).
- **Альтернатива:** Pulumi (TS — один язык с приложением). Supabase-миграции остаются SQL (§9).

---

## 22. Final — Cloud Infrastructure (резюме)

**Диаграмма:**
```
User → Cloudflare🎯(WAF/CDN/DDoS/Turnstile) → Vercel Edge(middleware, CDN)
     → Next.js App(RSC) → API(auth+Zod+rate-limit[Upstash])
     → Supabase(RLS, PgBouncer, backups+PITR🎯, replicas🎯) · S3🎯 · Queue🎯(workers)
     → Anthropic(🎯 model-router)
     ↑ Monitoring🎯(Sentry/OTel/Datadog) · Logs(structured) · Alerts(Slack) · CI/CD🎯(Actions→Vercel)
```
- **Deploy** ✅ (Vercel CD, preview, instant rollback, zero-downtime) · **CI** 🎯 (Actions-гейты)
- **DB** ✅ (Supabase, PgBouncer) + 🎯 (PITR, replicas) · **Cache** ✅ (Upstash) · **Storage/Queue** 🎯
- **Monitoring/Alerting** 🎯 (Sentry/Datadog/Slack) · **HA** ✅/🎯 (RTO≤1ч, RPO→минуты с PITR)
- **Scaling** — managed-first, компонентный рост 1K→10M без переписывания · **IaC** 🎯 (Cloudflare/Upstash/S3/env)

**Аудит документа — устранённые слабые места:**
1. Стек-иллюзия (Docker/K8s/Terraform обязательны) → честно: **managed serverless** (Vercel+Supabase),
   Docker — только для воркеров, K8s — не нужен на стадии; IaC — для параметризуемого (Cloudflare/Upstash/S3).
2. «Всё построено» → ✅ vs 🎯 чётко: CI/CD, Cloudflare, S3, очередь, PITR, Sentry — **не** выданы за готовое.
3. Prisma/OpenAI/Stripe → Supabase/Anthropic/LemonSqueezy зафиксированы.
4. Дубль `001`-миграции → отмечен как ops-долг (консолидировать перед прод-масштабом).
5. Docker-app-иллюзия → уточнено: приложение на Vercel НЕ контейнеризовано (и не должно); Docker — воркеры.

---

*Companion: [Technical Architecture](./TECHNICAL-ARCHITECTURE.md) · [Security Architecture](./SECURITY-ARCHITECTURE.md) ·
[Database Architecture](./DATABASE-ARCHITECTURE.md) · [cloudflare-security.md](./cloudflare-security.md) ·
реализация: `next.config.ts`, `src/middleware.ts`, `src/lib/middleware/rate-limit.ts`, `supabase/migrations/`.*
