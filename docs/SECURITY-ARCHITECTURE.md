# Vertlix AI — Security Architecture

> **Официальный стандарт безопасности.** Не UI, не дизайн, не маркетинг — архитектура защиты
> production AI SaaS. Дополняет [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) (лог находок/фиксов):
> тот — «что нашли и починили», этот — «как устроена оборона в целом».
>
> **Реальный стек:** Next.js 16 · TS · **Supabase (PostgreSQL, RLS)** · **NextAuth v5** ·
> in-memory + **Upstash Redis** · Vercel · Anthropic · **LemonSqueezy**. Промпт называет
> Prisma/Redis/Stripe/Cloudflare — реально: Supabase (не Prisma), Upstash, LemonSqueezy (не Stripe),
> Cloudflare — рекомендуется (не подключён). Ниже помечено **✅ реализовано** vs **🎯 целевое/рекомендация**.

**Версия 1.0 · 2026-07-22** · защита при росте до миллионов пользователей и конфиденциальных данных.

---

## 1. Security Principles

| Принцип | Применение в Vertlix AI |
|---|---|
| **Zero Trust** | Каждый запрос аутентифицируется (`auth()`) и авторизуется (скоуп по tenant); UI-скрытие ≠ защита — сервер всегда проверяет. ✅ |
| **Defense in Depth** | Слои: Edge(middleware) → app(auth+Zod+rate-limit) → **RLS в БД** → app-скоуп. Пробой одного слоя не открывает данные. ✅ |
| **Least Privilege** | ANON-ключ заблокирован RLS; service-role только сервер-сайд; роли RBAC дают минимум; агенты — ограниченный tool-скоуп. ✅ |
| **Secure by Default** | Новый роут = auth+валидация+скоуп по умолчанию; secure/httpOnly/sameSite cookies; security-headers глобально. ✅ |
| **Privacy by Design** | PII-минимизация; GDPR-экспорт/стирание из коробки; секреты шифруются; чувствительное не эмбеддится в vector. ✅ |
| **Fail Secure** | Ошибка → отказ в доступе (не открытие); нет сессии → 401/redirect; сбой RLS/скоупа → пусто, не «всё». ✅ |

---

## 2. Threat Modeling (STRIDE)

**Assets:** учётные данные, PII, бизнес-данные/документы, AI-переписки, платёжные данные,
API-ключи/секреты, AI-бюджет (токены). **Attack Surface:** маркетинг-страницы, auth-роуты, все
`/api/*`, LLM-эндпоинты (стриминг), webhook LemonSqueezy, OAuth-callbacks. **Threat Actors:**
внешний аноним, аутентифицированный злоумышленник (cross-tenant), инсайдер, автоматизированные боты,
злоупотребление AI. **Entry Points:** формы, API, OAuth, webhook, tool-исполнение, RAG-контент.

| Угроза (STRIDE) | Вероятн. | Урон | Защита | Статус |
|---|---|---|---|---|
| **S** — угон сессии/JWT-подделка | Низк. | Крит. | Подписанный JWT (NEXTAUTH_SECRET), secure/httpOnly/sameSite, HTTPS/HSTS | ✅ |
| **T** — mass-assignment/param-tampering | Ср. | Выс. | Zod + whitelist полей + user/org-скоуп | ✅ |
| **R** — отрицание действий | Низк. | Ср. | `activity_logs` + журнал безопасности | ✅ частично |
| **I** — утечка данных (IDOR, БД, ошибки) | **Была выс.** | Крит. | **RLS на всех 33 табл.**, скоуп, generic-ошибки, IDOR закрыт | ✅ |
| **D** — DoS / AI-cost abuse | Ср. | Выс. | auth на LLM + **per-user rate-limit**; 🎯 Cloudflare DDoS/WAF | ✅ / 🎯 |
| **E** — эскалация привилегий | Низк. | Крит. | серверный RBAC, org-скоуп, нет «UI-only» защиты | ✅ |
| **AI** — prompt injection / model abuse | Ср. | Ср. | untrusted-контент, tool-permission, rate-limit, дисклеймеры | ✅ / 🎯 output-фильтр |

Критичнейший риск (утечка данных через открытый anon-ключ / IDOR / открытый LLM) — **устранён**
в этой сессии (см. §5, §6, §10 и SECURITY-AUDIT.md).

---

## 3. Application Security

- **Frontend:** нет `dangerouslySetInnerHTML`/`eval`; React-эскейпинг; CSP запрещает внешние скрипты;
  секреты только `NEXT_PUBLIC_*` (публичные по смыслу). ✅
- **Backend/API:** каждый роут — `auth()` + Zod-валидация + rate-limit + скоуп по tenant. ✅
- **Middleware (Edge):** гейтинг `/dashboard`,`/report` (redirect на login); edge-safe (без Node-crypto). ✅
- **Input Validation:** Zod-схемы (`src/lib/validators`) на всех write-роутах; 422 с полями. ✅
- **Output Encoding/Sanitization:** JSON-ответы; markdown AI-вывода рендерится безопасно; **generic-ошибки** (нет сырого текста БД/провайдера). ✅
- **Security Headers** (`next.config.ts`): CSP, HSTS(preload), COOP, CORP, Origin-Agent-Cluster, Permissions-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy. ✅
- **Error Handling:** 🎯 централизованный `jsonError()` (лог детали, отдать generic) — рекомендация из аудита (сейчас — по ключевым роутам).

---

## 4. Authentication Security

- **Password:** **bcrypt cost 12** ✅ (OWASP-приемлемо); политика ≥8 + буквы+цифра (сервер+клиент). 🎯 **Argon2id** — опц. апгрейд (rehash при следующем входе).
- **OAuth:** Google/GitHub, upsert по email. ✅
- **JWT/Sessions:** NextAuth stateless JWT, 30д, secure/httpOnly/sameSite. ✅ 🎯 **Refresh-token rotation**.
- **MFA:** **TOTP 2FA** (otplib), enforced на входе, backup-коды (bcrypt, одноразовые), секрет **AES-256-GCM**. ✅
- **Passkeys:** WebAuthn (counter/clone-detection). ✅
- **Email Verification / Password Reset:** подписанные **self-expiring HMAC-токены** (purpose-изоляция: reset≠verify). ✅
- **Device Management:** 🎯 список сессий / «выйти со всех» через token-version claim (спроектировано).
- **Защита:** Brute-force → **rate-limit** (10/15мин, энумерация-safe generic-ошибки) ✅; Credential Stuffing / ATO → 🎯 **Turnstile-CAPTCHA** после подозрительной активности + account-lockout/progressive-delay.

---

## 5. Authorization Security

- **RBAC:** роли `members.role` — owner/admin/manager/member/viewer; скоуп по `organization_id`/`user_id`; проверка **на сервере**. ✅
- **ABAC:** 🎯 тонкие атрибуты (`members.permissions` jsonb, feature-flags по плану).
- **Privilege Escalation:** роль нельзя повысить с клиента; последний owner защищён (app-level). ✅
- **IDOR / BOLA:** **закрыт** — `agents/[id]` (org-скоуп на GET/PATCH/DELETE), `chat/[id]/messages` (ownership-check), все ресурсы `.eq(user_id/org)`. ✅
- **Broken Access Control:** открытый LLM-эндпоинт `chat/direct` **закрыт** (auth); auth унифицирован на NextAuth (устранён рассинхрон `supabase.auth.getUser`). ✅

---

## 6. API Security

- **Rate Limiting:** `rate-limit.ts` — in-memory Map + **Upstash Redis** (durable, shared); ключи по юзеру/IP; лимитеры auth(10/15м)/chat(20/м)/report(5/м). ✅
- **Request Validation:** Zod на входе. ✅ **API Authentication:** `auth()` (NextAuth) на всех приватных роутах. ✅
- **API Keys:** 🎯 пользовательские API-ключи (hash, scopes, revoke) — Enterprise.
- **CSRF:** NextAuth CSRF-токены + sameSite cookies. ✅ **CORS:** same-origin (нет открытого CORS). ✅ **Versioning:** 🎯 `/api/v1` при внешнем API.
- **Injection-защита:** **SQL Injection** — параметризованные запросы (supabase-js builder, нет строковой сборки) ✅; **XSS** — нет опасных sinks + CSP ✅; **SSRF** — `search_web`/image: 🎯 allowlist + запрет приватных URL/метадата-эндпоинтов.

---

## 7. Database Security (Supabase PostgreSQL)

> Промпт: «Prisma Security Best Practices». Реально — **Supabase + параметризованные запросы + RLS**
> (Prisma не в рантайме). Практики те же по сути:

- **Row Level Security:** **force RLS на всех 33 таблицах** (миграция `009`); ANON-ключ (в браузере) заблокирован полностью; сервер — service-role (bypass) + обязательный app-скоуп (defense-in-depth). ✅
- **Access Control:** service-role только сервер-сайд; секреты в env; разграничение ролей БД. ✅
- **Encryption:** at-rest (Supabase-диски), in-transit (TLS), app-level (AES-GCM 2FA-секреты). ✅
- **Backups/Audit:** daily + 🎯 PITR; `activity_logs`. ✅/🎯
- **Connection/Query Security:** PgBouncer-пул, параметризация, `if exists` в миграциях; медленные запросы под мониторингом. ✅

---

## 8. Data Security — классификация

| Уровень | Данные | Защита |
|---|---|---|
| **Public** | маркетинг, публичные цены | без ограничений |
| **Internal** | агрегаты, метрики продукта | authed, org-скоуп |
| **Confidential** | проекты, стратегии, AI-переписки, документы | RLS + tenant-скоуп + шифрование транзита |
| **Sensitive** | пароли, 2FA-секреты, backup-коды, платёжные, API-ключи | **не хранить в открытом виде**: bcrypt/AES-GCM; не логировать; не эмбеддить в vector |

**User/Business/Documents/AI Conversations** = Confidential минимум; секреты = Sensitive.
Правило: чем выше уровень — тем строже доступ, шифрование, аудит и запрет на логирование.

---

## 9. Encryption Architecture

- **In Transit:** TLS везде (Vercel/Supabase/Anthropic); HSTS(preload) + upgrade-insecure-requests. ✅
- **At Rest:** Supabase шифрует диски. ✅
- **App-level (что и где):**
  - Пароли → **bcrypt(12)** (не расшифровываются). ✅
  - 2FA-секрет (`two_fa_secret_enc`) → **AES-256-GCM** (`DATA_ENCRYPTION_KEY`). ✅
  - Backup-коды → bcrypt (одноразовые). ✅
  - Reset/verify-токены → **HMAC-SHA256** подпись (не хранятся). ✅
  - Секреты (ключи) → env, не в коде/БД. ✅
- 🎯 **Key management:** ротация `DATA_ENCRYPTION_KEY`/`NEXTAUTH_SECRET` (envelope-схема), KMS для Enterprise.

---

## 10. AI Security

| Угроза | Защита |
|---|---|
| **Prompt Injection** | system/developer промпт отделён; контент из tool/RAG/web помечен untrusted; инструкции-в-данных игнорируются; действия только через валидированные tools. ✅/🎯 |
| **Jailbreak** | отказ-политика в промпте; 🎯 модерация входа/выхода |
| **Data Leakage** | RLS + tenant-скоуп в retrieval (чужие chunks недостижимы); секреты не эмбеддятся. ✅ |
| **Training Data Exposure** | не обучаем на клиентских данных; провайдер (Anthropic) с no-train политикой. ✅ |
| **Unsafe Output** | 🎯 output-фильтр (toxicity/PII-redaction) |
| **Model Abuse / cost** | **auth обязателен** на LLM + **per-user rate-limit** + лимиты токенов/плана. ✅ |

**Слои:** Input filtering (Zod + injection-детект 🎯) → Permission (RBAC на агенты/tools) →
Sandboxing (🎯 code_exec/file) → Output filtering (🎯). Сырой error провайдера **не** отдаётся юзеру. ✅

---

## 11. AI Agent Security

Каждый агент ограничен:
- **Permissions:** кто может запускать (RBAC, план-гейтинг моделей). ✅
- **Tool Access:** только `tools_enabled[]`; каждый tool — permission + валидация + скоуп. ✅
- **Data Scope:** org-скоуп; `get_project_data` проверяет владельца (нет cross-tenant). ✅
- **Execution Limits:** лимит итераций agentic-loop (антизацикливание), max_tokens. ✅
- **Budget Limits:** 🎯 бюджет токенов/стоимости на прогон/юзера/период (usage_stats).

**Защита от:** Agent Hijacking (untrusted-контент не управляет tools) · Tool Abuse (permission+scope+rate-limit) · Unauthorized Actions (tool исполняется только с проверкой прав, результат — модели, не напрямую пользователю). ✅/🎯

---

## 12. File Security (🎯 — при вводе загрузки файлов)

Сейчас: аватары — client-resize + data-URL (MIME-whitelist PNG/JPEG/WebP, лимит ~150КБ, валидация) ✅;
файлов-документов нет. При вводе KB-загрузки — заложить сразу:
- **File Validation / MIME Checking:** magic-bytes (не только расширение), whitelist типов. 🎯
- **Size Limits:** жёсткий лимит; **ZIP-bomb** — лимит распаковки/вложенности. 🎯
- **Virus Scanning:** антивирус (ClamAV/сервис) перед обработкой. 🎯
- **Executable Upload:** запрет исполняемых; хранение вне webroot, приватные бакеты + signed URL. 🎯
- **Access Control:** скоуп по tenant; никаких публичных бакетов. 🎯

---

## 13. Cloud Security

- **Vercel:** HTTPS/edge, атомарные деплои, per-env секреты, `poweredByHeader:false`. ✅
- **Cloudflare** 🎯: **WAF** (managed rules), **DDoS**, **Bot Protection**, **Turnstile** (CAPTCHA на login/register), edge rate-limiting, geo-blocking. App готов (`CF-Connecting-IP` учитывается лимитером). 🎯
- **Docker** 🎯 (если контейнеризация): non-root user, minimal base, no secrets в образе, scan образов.
- **Secrets Management:** env per-env (§15). ✅

---

## 14. Network Security

- **Архитектура:** Client → 🎯 Cloudflare(WAF/CDN) → Vercel Edge(middleware) → serverless-функции → Supabase/Upstash/Anthropic (все по TLS).
- **Private Networks:** 🎯 приватный доступ к БД (Supabase private networking / VPC для Enterprise).
- **Firewall Rules:** 🎯 Cloudflare firewall (гео/бот/rate).
- **API Gateway:** роль шлюза — middleware + per-route auth/rate-limit (в монолите); 🎯 выделенный gateway при росте.
- **Rate Limits:** ✅ (§6) app-level; 🎯 edge-level (Cloudflare) как первый рубеж.

---

## 15. Secret Management

- **Что:** `ANTHROPIC_API_KEY`, `NEXTAUTH_SECRET`, `DATA_ENCRYPTION_KEY`, `NEXT_PUBLIC_SUPABASE_*`,
  **`SUPABASE_SERVICE_ROLE_KEY`** (RLS-bypass — критичен), OAuth `*_CLIENT_SECRET`, `RESEND_API_KEY`,
  **`LEMONSQUEEZY_WEBHOOK_SECRET`** (не Stripe), `UPSTASH_*`.
- **Правила:** **Never commit** (только env; `.env.local` в gitignore; секреты не в коде/БД — проверено аудитом);
  `NEXT_PUBLIC_*` = публичные по смыслу (никогда приватных туда); service-role **только сервер-сайд**. ✅
- **Rotation:** 🎯 периодическая ротация ключей; смена `NEXTAUTH_SECRET` инвалидирует токены/сессии (учесть).
- 🎯 **Secret scanning в CI** (gitleaks) + Vercel/Doppler для управления.

---

## 16. Logging & Audit

- **Security Logs:** `activity_logs` где `type like 'security.%'` — вход, смена пароля, 2FA on/off, passkey add/remove. ✅ (журнал в Settings/Security).
- **Audit/Activity Logs:** `activity_logs` — действия (project_create, admin-действия). ✅
- **Записывать:** Login/Logout · Permission Changes · Data Access(критичное) · **Admin Actions** · Sensitive events. ✅ (расширить покрытие 🎯).
- **Правила:** **никогда не логировать** пароли/секреты/токены/2FA; логи — иммутабельны, с retention; 🎯 отдельный audit-стор для Enterprise (tamper-evident).

---

## 17. Monitoring & Detection

- **Сейчас:** PostHog (продуктовые события: входы/регистрации/AI-использование). ✅
- 🎯 **Sentry** — ошибки фронта/бэка + **security-события** (спайки auth-fail, 4xx/5xx-аномалии).
- 🎯 **OpenTelemetry → Datadog** — traces (запрос→БД→AI), metrics, logs.
- **Отслеживать:** Attacks (rate-limit хиты, инъекц-паттерны, 401/403-спайки) · Errors · Suspicious Behavior (аномальный usage/AI-cost, cross-tenant попытки) · Performance (latency/пул).
- 🎯 **Alerting:** auth-fail spike, AI-cost аномалия, 5xx-рост, пул>80%, новые типы ошибок → on-call.

---

## 18. Incident Response

| Фаза | Действия |
|---|---|
| **Detection** | алерты (Sentry 🎯), аномалии usage/auth, отчёты пользователей; severity-классификация |
| **Containment** | отзыв скомпрометированных ключей (ротация), инвалидация сессий (смена NEXTAUTH_SECRET), блок аккаунта/IP, feature-flag off |
| **Investigation** | `activity_logs` + логи + git-история; определить scope (какие tenant/данные), root cause |
| **Recovery** | восстановление из бэкапа/PITR, патч уязвимости (forward-fix), проверка целостности |
| **Post-Mortem** | blameless разбор, timeline, action-items, обновление этого документа/чеклистов; уведомление затронутых (GDPR: 72ч) |

🎯 **Runbook** с контактами, ролями (кто DRI), каналами эскалации; регулярные учения (tabletop).

---

## 19. Compliance

- **GDPR** ✅ (готовность): право доступа (**export** `/api/user/export`), стирание (**delete** `/api/user`),
  минимизация PII, шифрование секретов, tenant-изоляция, AI-дисклеймер («рекомендация, не финсовет»);
  🎯 DPA с суб-процессорами (Anthropic/Supabase/Vercel/LemonSqueezy), уведомление о брешах ≤72ч, cookie-consent.
- **SOC 2** 🎯: контроль доступа ✅, аудит-логи ✅, шифрование ✅, incident-response (этот §18), change-management
  (Design-Ops/Git), мониторинг 🎯 — нужен формальный audit + evidence-сбор за период.
- **ISO 27001** 🎯: ISMS, risk-treatment (этот threat-model), политики, обучение — организационный процесс поверх технической базы.

Техническая база под compliance **заложена**; сертификация — организационный процесс (аудитор, период, документы).

---

## 20. Security Testing

- **Code Review** ✅ — ревью с security-осью (Design-Ops §7); PR-гейт.
- **Dependency Scan** 🎯 — `npm audit` в CI (сейчас: 5 CVE, в т.ч. sharp/libvips — не `--force`-даунгрейдить Next; точечный апдейт) + Dependabot/Snyk.
- **SAST** 🎯 — статический анализ (CodeQL/Semgrep) на инъекции/секреты.
- **DAST** 🎯 — ZAP/пробы против preview-окружения.
- **Penetration Testing** — внутренний пентест проведён в этой сессии (IDOR/mass-assignment/authz — закрыты, рантайм-верификация); 🎯 внешний пентест перед Enterprise.
- **Vulnerability Scan** 🎯 — регулярный скан инфраструктуры/образов.

---

## 21. Security Checklist

### ✅ Before Development
- [ ] Новый роут: `auth()` + Zod + rate-limit + скоуп по tenant заложены
- [ ] Секреты только в env (никогда в коде); `NEXT_PUBLIC_*` — только публичное
- [ ] Данные классифицированы (§8); Sensitive не логируется/не эмбеддится
- [ ] RLS-политика для новой таблицы (force, deny anon)

### ✅ Before Launch
- [ ] RLS на всех таблицах (force) · service-role только сервер-сайд · ANON заблокирован
- [ ] IDOR/mass-assignment/authz проверены (скоуп по user/org, whitelist полей)
- [ ] LLM-эндпоинты: auth + per-user rate-limit
- [ ] Security-headers (CSP/HSTS/COOP/CORP/…) присутствуют
- [ ] 2FA/passkeys/verify/reset работают; generic-ошибки (нет сырого текста)
- [ ] Webhook — HMAC-проверка; `DATA_ENCRYPTION_KEY`/`SERVICE_ROLE_KEY` заданы
- [ ] `npm audit` без high; 🎯 Cloudflare WAF/Turnstile; 🎯 Sentry подключён
- [ ] GDPR export/delete работают; бэкапы+PITR включены

### ✅ After Launch
- [ ] Мониторинг алертов (auth-fail/AI-cost/5xx) активен
- [ ] Ротация ключей по расписанию; ревью `activity_logs` еженедельно
- [ ] Incident-runbook актуален; учения проведены
- [ ] Dependency-scan в CI зелёный; регулярный vuln-scan
- [ ] Ретеншен логов/данных соблюдается (GDPR)

---

## 22. Final — Security Architecture (резюме)

**Слои обороны (defense in depth):**
```
Cloudflare 🎯(WAF/DDoS/Bot/Turnstile)
  → Vercel Edge (middleware auth-gate, HTTPS/HSTS)
  → App (auth() + Zod + rate-limit[mem+Upstash] + generic-errors + headers)
  → RBAC (роли, org/user-скоуп, whitelist — IDOR/mass-assign закрыты)
  → Supabase RLS (force на 33 табл., anon заблокирован, service-role сервер-сайд)
  → Encryption (TLS + AES-GCM секреты + bcrypt пароли + HMAC токены)
  → Audit (activity_logs) + Monitoring 🎯(Sentry/OTel) + Incident Response
```
- **Threat Model** ✅ (STRIDE, §2) · **Auth** ✅ (2FA/passkeys/OAuth/JWT) · **Authz** ✅ (RBAC, IDOR закрыт)
- **AI Security** ✅/🎯 (auth+rate-limit, tenant-изоляция; output-фильтр 🎯) · **Data Protection** ✅ (RLS, шифрование, GDPR)
- **Cloud** 🎯 (Cloudflare) · **Monitoring** 🎯 (Sentry/Datadog) · **Compliance** ✅ база/🎯 сертификация · **Incident Response** ✅ план

**Оценка (из аудита):** **9.0/10** — все app-/data-уязвимости закрыты (открытый LLM, IDOR×2,
mass-assignment, auth-рассинхрон, RLS-lockdown). До 9.5+ — операционное вне кода: обновить
зависимости, подключить Cloudflare + Sentry.

**Аудит документа — устранённые слабые места:**
1. Стек-иллюзия (Prisma/Stripe/Redis-only) → честно: Supabase/LemonSqueezy/Upstash+mem; Argon2id как 🎯 (bcrypt(12) уже OWASP-ок).
2. «Всё готово» → чётко ✅ vs 🎯 (Cloudflare/Sentry/file-scan/output-фильтр/API-keys — не выданы за сделанное).
3. File-security → помечено forward-looking (загрузки файлов пока нет; заложить при вводе).
4. Compliance → техбаза ✅, сертификация SOC2/ISO — организационный процесс, не «галочка в коде».

---

*Companion: [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) (находки/фиксы) · [Technical Architecture](./TECHNICAL-ARCHITECTURE.md) ·
[Database Architecture](./DATABASE-ARCHITECTURE.md) · [AI Architecture](./AI-ARCHITECTURE.md) ·
реализация: `next.config.ts`, `src/auth.ts`, `src/middleware.ts`, `supabase/migrations/009_rls_lockdown.sql`, `src/lib/middleware/rate-limit.ts`.*
