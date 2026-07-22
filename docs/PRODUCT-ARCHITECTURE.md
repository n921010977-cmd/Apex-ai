# Vertlix AI — Product Architecture Document

> **Официальный стратегический и функциональный стандарт продукта.** Не дизайн, не
> код, не UI — а архитектура бизнеса и функциональности, на которой строится AI SaaS.
>
> Заземлён на реальный продукт (Next.js + Supabase + Anthropic): 20 AI-директоров,
> проекты → анализ → стратегия → отчёты, совет с заседаниями и голосованиями, планы с
> серверными лимитами. Дополняет дизайн-серию (`DESIGN-*`, `FOUNDATIONS`, `COMPONENT-LIBRARY`,
> `UX-PATTERNS`, `PAGE-TEMPLATES`, `DESIGN-OPS`) бизнес-слоем.
>
> **Именование:** продукт называется **Vertlix AI** (ранние доки `STRATEGY-2026`, `02-PRD`,
> `AI_EXECUTIVE_TEAM_BIBLE` созданы под прежним именем «Apex AI» — этот документ отражает
> актуальный бренд и консолидирует продуктовую архитектуру.)

**Версия 1.0 · 2026-07-22**

---

## 1. Product Vision

- **Миссия:** дать каждому предпринимателю доступ к совету директоров мирового уровня —
  через AI, за секунды, а не за миллионы долларов гонораров.
- **Долгосрочное видение:** Vertlix AI — операционная система принятия бизнес-решений.
  Не «ещё один чат», а виртуальная C-suite команда, которая анализирует, спорит, голосует и
  выдаёт исполнимые стратегии.
- **Уникальное отличие:** интеллект подан как **структурированный совет из 20 директоров**
  (CEO, CFO, CMO, COO, CTO…), а не безликое поле ввода. Директора **заседают и голосуют**
  (board meetings/votes/decisions) — пользователь видит не один ответ, а коллективное решение.
- **Конкурентное преимущество:** (1) роль-специализация + оркестрация нескольких экспертов;
  (2) прозрачность рассуждений и уверенности (доверие к решениям на деньги); (3) от идеи до
  готовой стратегии из 6 секций и PDF-отчёта — цельный путь, не набор промптов.
- **Главная ценность:** «У меня есть команда экспертов, которая помогает принять правильное
  бизнес-решение — прямо сейчас».

**Почему пользователь выберет Vertlix AI:** ChatGPT даёт ответ; Vertlix даёт **решение с
обоснованием от профильных экспертов, оформленное как стратегия и отчёт**. Дешевле консультанта,
быстрее команды, доступнее совета директоров.

---

## 2. Product Strategy

**Стратегические направления:** (1) Depth — качество AI-совета (роль-эксперты, оркестрация,
инструменты); (2) Workflow — от идеи до исполнения (стратегия, задачи, отчёты); (3) Collaboration —
команды/организации; (4) Trust — безопасность, прозрачность AI, compliance.

| Этап | Ключевые функции | Фокус |
|---|---|---|
| **MVP** ✅ | Проект → AI-анализ, чат с директором, генерация стратегии (6 секций), отчёты+PDF, auth/2FA | Доказать ценность одному основателю |
| **Version 1** | Executive Council (заседания/голосования), Vault, задачи, шаблоны, кастомные агенты | Полный цикл принятия решений |
| **Version 2** | Agent Marketplace, Knowledge Base/RAG, file-analysis, memory, интеграции, командная работа | Платформа и удержание |
| **Enterprise** | SSO/SAML, RBAC, audit, org-иерархии, приватные агенты, SLA, on-prem/VPC | Крупные компании |

---

## 3. User Personas (5+)

**P1 · Основатель-стартапер «Артём», 29.** Цель: валидировать идею и привлечь инвестиции.
Боль: нет команды/денег на консультантов. Мотивация: быстро проверить гипотезу советом.
Сценарии: анализ идеи, pitch-подготовка, стратегия выхода. Нужно: быстрый анализ, стратегия, отчёт для инвестора.

**P2 · Владелец МСБ «Марина», 41.** Цель: рост существующего бизнеса. Боль: тонет в операционке,
нет стратегического взгляда. Мотивация: решения по маркетингу/финансам без найма C-suite.
Сценарии: разбор P&L, маркетинг-план, оптимизация. Нужно: CFO/CMO-агенты, отчёты, задачи.

**P3 · Руководитель в компании «Дмитрий», 38.** Цель: обосновать решения перед правлением.
Боль: нужны быстрые, защищаемые аргументы. Мотивация: «второе мнение» уровня совета.
Сценарии: сценарный анализ, risk-review, executive-council по вопросу. Нужно: Council с голосованием, sources/reasoning.

**P4 · Маркетолог/агентство «Ника», 33.** Цель: стратегии для клиентов быстрее. Боль: рутина
исследований. Мотивация: масштабировать экспертизу. Сценарии: GTM, позиционирование, контент-стратегия.
Нужно: CMO-агент, шаблоны, командная работа, экспорт.

**P5 · Команда/организация «TeamLead Олег», 45.** Цель: единая стратегическая работа команды.
Боль: разрозненные документы и решения. Мотивация: общий контекст и роли. Сценарии: workspace с
проектами, роли/права, общая история. Нужно: организации, роли, shared workspace, admin.

**P6 · Инвестор/советник «Елена», 50** (расширенная). Цель: быстрый due-diligence портфеля.
Нужно: анализ проектов, отчёты, сравнение — read-heavy сценарии.

---

## 4. User Roles (RBAC)

Реализовано через `members.role` (скоуп по организации; проверка на сервере, не только в UI).

| Роль | Права | Ограничения |
|---|---|---|
| **Owner** | Всё: биллинг, удаление организации, управление ролями, все проекты/агенты | Единственный, кого нельзя удалить/понизить последним |
| **Admin** | Управление участниками, настройки workspace, все проекты, кастомные агенты | Нет доступа к смене владельца/удалению организации |
| **Manager** | Создавать/вести проекты и стратегии, приглашать Member, назначать задачи | Нет доступа к биллингу и удалению участников |
| **Member** | Работать в проектах, чат с агентами, свои документы/задачи | Не управляет участниками/настройками организации |
| **Viewer** | Просмотр проектов/отчётов, инспекция | Нет изменений, нет запуска платных AI-операций (по политике) |

Принцип: UI скрывает недоступное **и** сервер проверяет права (defense-in-depth, см. Security §19).

---

## 5. Information Architecture (карта продукта)

```
Vertlix AI
├── Marketing        Landing, Features, Pricing, Enterprise, About, Blog, Docs, Legal, Status
├── Authentication   Login, Register, Verify Email, Forgot/Reset, 2FA, Passkeys, OAuth
├── Application (Shell: Sidebar + TopNav + ⌘K)
│   ├── Dashboard    Overview, Executive Council, Analytics, AI
│   ├── Projects     List → Overview → Details/Settings → Create
│   ├── AI System    Chat, Agents, Agent Marketplace, Prompt Library, Conversations
│   ├── Strategy     Generation (6 секций), Reports (+PDF)
│   ├── Workspace    Vault, Notepad, Tasks, History
│   └── Support      Help, Tickets
├── Analytics        Usage, KPIs, Reports, Revenue (org-level)
├── Billing          Plans, Subscription, Invoices, Usage limits
├── Settings         Profile, Security, Appearance, Notifications, Language, API Keys, Workspace, Organization
└── Admin            Users, Organizations, Payments, Logs, Moderation, System Health
```

---

## 6. Core Features

| Feature | Что | Проблема пользователя | Приоритет | Сложность |
|---|---|---|---|---|
| **AI Executive Board** | 20 директоров-экспертов | «Нет команды/советников» | P0 | Высокая |
| **Project Analysis** | Проект → AI-оценка + факторы | «Не знаю, жизнеспособна ли идея» | P0 | Средняя |
| **Strategy Generation** | 6 секций: vision/goals/SWOT/execution/KPI/risks | «Нужна структурированная стратегия» | P0 | Высокая |
| **AI Chat (streaming)** | Диалог с директором, потоковый ответ | «Нужна консультация сейчас» | P0 | Средняя |
| **Executive Council** | Заседание с голосованием директоров | «Нужно взвешенное коллективное решение» | P1 | Высокая |
| **Reports + PDF** | Готовый отчёт для инвестора/правления | «Нужно защитить решение» | P1 | Средняя |
| **Vault / Notepad / Tasks** | Хранилище знаний, заметки, исполнение | «Решение надо довести до дел» | P1 | Низкая |
| **Custom Agents** | Свои/клонированные эксперты | «Нужен эксперт под мою нишу» | P2 | Средняя |
| **Teams / Organizations** | Совместная работа, роли | «Команде нужен общий контекст» | P2 | Высокая |
| **Agent Marketplace** | Каталог специализированных агентов | «Хочу готовых экспертов» | P3 | Высокая |
| **Knowledge Base / RAG** | Анализ своих документов | «AI должен знать мой бизнес» | P3 | Высокая |

---

## 7. AI Platform Architecture

- **AI Agents** — роль-специализированные эксперты (system-prompt + модель + tools + temperature).
- **Agent Marketplace** — каталог: канонические 20 директоров + custom + (будущее) сторонние.
- **Prompt System** — персона-промпты, шаблоны, история, подсказки-стартеры.
- **Memory** — контекст диалога/проекта (`memory_chunks`), прозрачная, управляемая.
- **Knowledge Base** — (V2) загрузка документов → embeddings → RAG-ответы на основе данных бизнеса.
- **File Analysis** — (V2) разбор PDF/таблиц с извлечением фактов.
- **AI Tools** — реальные вычисления (MRR/ARR, unit-экономика — `src/lib/tools.ts`); tool-use расширяем.
- **Model Selection** — Claude-модели (Opus/Sonnet/Haiku) под задачу/план; дорогое — на верхних тарифах.
- **Conversation System** — треды, роли, стриминг SSE, стоп-генерация, история.
- **AI Evaluation** — (V2) оценка качества ответов, guardrails, anti-hallucination, confidence-калибровка.

**Оркестрация:** direct (один агент) и orchestrate (совет: несколько директоров → синтез/голосование).

---

## 8. AI Agents System (20 директоров)

Ядро C-suite (реализовано, `src/lib/agents.ts` / `board.ts`) + расширенный совет:

| Agent | Роль | Способности | Вход | Результат |
|---|---|---|---|---|
| **CEO — Стратег** | Общая стратегия, видение | Синтез, приоритизация, arbitrage совета | Идея/проект, вопросы совета | Стратегическое направление, финальное решение |
| **CFO — Финансист** | Финансы, unit-экономика | MRR/ARR/LTV/burn расчёты (tools) | Метрики, цены, затраты | Финмодель, риски, рекомендации |
| **CMO — Маркетолог** | Маркетинг, GTM, бренд | Позиционирование, каналы, контент-стратегия | ЦА, продукт, рынок | GTM-план, воронка, месседжинг |
| **COO — Операционист** | Операции, процессы | Оптимизация, план реализации | Процессы, ресурсы | Execution-план, KPI операций |
| **CTO — Технолог** | Технологии, продукт | Архитектура, tech-риски, roadmap | Продукт, стек | Tech-стратегия, приоритеты |
| **+ Sales / Legal / Strategy / HR / Data / Growth / Risk / Product / …** | профильные советники | доменная экспертиза + tools | контекст проекта | доменные рекомендации |

**Механика совета:** заседание (`board_meetings`) → выступления (`board_speeches`) →
голосование (`board_votes`) → зафиксированное решение (`board_decisions`). Каждый агент —
единый каркас (Philosophy P15), идентичность в роли/цвете/аватаре; ответы 7–12 предложений,
профессионально, с обоснованием.

---

## 9. User Flows (20+)

1. **Новый пользователь:** Landing → Register → (verify email) → Dashboard → New Project → AI-анализ → первый результат.
2. **OAuth-вход:** Landing → «Продолжить с Google» → Dashboard.
3. **2FA-вход:** Login → пароль → OTP/backup → Dashboard.
4. **Passkey-вход:** Login → «по passkey» → Dashboard.
5. **Создание проекта:** New → форма (идея/индустрия/стадия/цели) → создать → redirect на Project Overview.
6. **Генерация стратегии:** Project → «Создать стратегию» → 6 секций стримятся → сохранены.
7. **Чат с директором:** Agents/Executives → выбрать CEO → диалог (стриминг) → reasoning/sources.
8. **Заседание совета:** Project → Executive Council → запустить → выступления → голосование → решение.
9. **Отчёт+PDF:** Project/Strategy → Reports → создать → скачать PDF (лимит по плану).
10. **Кастомный агент:** Agents → «Создать» → имя/роль/промпт → сохранён (синк на сервер).
11. **Клонирование агента:** Agents → «Клонировать» → правка → свой вариант.
12. **Vault:** сохранить документ/заметку/память → поиск → использовать в проекте.
13. **Задачи:** из стратегии → создать задачи → отметить выполненные.
14. **Апгрейд по лимиту:** создать 4-й проект на Free → 402 → Pricing → оплата → безлимит.
15. **Приглашение в команду:** Settings/Team → пригласить по email+роль → участник принимает.
16. **Смена организации:** Org Switcher → выбрать/создать workspace.
17. **Смена пароля/2FA:** Settings/Security → включить 2FA (QR→код→backup) / passkey.
18. **Сброс пароля:** Forgot → email → подписанная ссылка → Reset.
19. **Экспорт данных (GDPR):** Settings/Privacy → скачать данные / удалить аккаунт (с подтверждением).
20. **Поддержка:** Support → создать тикет → переписка → решение.
21. **Поиск ⌘K:** любой экран → ⌘K → перейти к проекту/действию.
22. **Оффлайн-работа:** локальный кэш держит UI → синк при возврате.

---

## 10. Navigation Architecture

- **Sidebar** (постоянный ≥lg): разделы — Dashboard, Projects, AI (Chat/Agents), Strategy/Reports,
  Workspace (Vault/Notepad/Tasks), Settings; активный по `--color-primary`.
- **Top Navigation:** контекст (где я/breadcrumb) + ⌘K-поиск + аватар-меню + уведомления.
- **Workspace/Org Switcher:** переключение организаций/рабочих пространств (multi-tenant).
- **User Menu:** профиль, настройки, тема, выход.
- **Command Palette (⌘K):** быстрый доступ ко всему.

**Почему так:** sidebar = стабильная карта продукта (предсказуемость, Philosophy P17); topnav =
контекст «где я»; ⌘K = скорость для опытных; org-switcher = multi-tenant без ухода с экрана.
Модель совпадает с Linear/Vercel/Notion — знакома целевой аудитории.

---

## 11. Workspace Architecture (multi-tenant)

```
Organization (тенант, план/биллинг)
└── Workspace (рабочее пространство; ≥1 на организацию)
    ├── Projects (единица работы)
    ├── Teams / Members (люди + роли)
    └── Shared: Agents (canonical + custom), Vault, History
```
- **Organization** — граница биллинга и данных (изоляция арендаторов; RLS + скоуп по org).
- **Workspace** — контекст проектов; переключается свитчером.
- **Members/Roles/Permissions** — §4; создаются при первом проекте автоматически (нулевое трение).

---

## 12. Project System

`Project` = центральная сущность цикла принятия решения:
- **Название, цель, индустрия, стадия, цели, целевая выручка, таймфрейм.**
- **AI Agents** — какие директора привлечены; **Conversations** — диалоги по проекту.
- **Documents** — из Vault/загруженные; **Tasks** — исполнение; **Strategy** — 6 секций; **Reports** — отчёты+PDF.
- **Results** — `overall_score`, `ai_results` (оценки/факторы); **История** — activity-лог изменений.
- **Статусы:** active/archived; мягкое удаление предпочтительнее hard-delete (UX Patterns §4).
- **Лимиты плана:** число проектов серверно (Free = 3 → 402).

---

## 13. Data Architecture (сущности и связи)

| Сущность | Ключевые поля | Связи |
|---|---|---|
| **User** | email, name, avatar_url, role, tier, password_hash, email_verified | 1—N Members; 1—N Projects (owner) |
| **Organization** | name, owner_id, plan | 1—N Members, Workspaces, Agents |
| **Member** | user_id, organization_id, role | N—1 User, N—1 Organization |
| **Workspace** | organization_id | 1—N Projects |
| **Project** | user_id, organization_id, name, industry, stage, goals, overall_score, ai_results, status | 1—N Conversations, Strategies, Reports, Tasks |
| **Agent / CustomAgent** | organization_id/user_id, name, role, system_prompt, model, tools | N—N Projects (через диалоги) |
| **Conversation** | user_id, project_id | 1—N Messages |
| **Message** | conversation_id, role, content, tokens_used | N—1 Conversation |
| **Strategy / StrategySection** | project_id, sections(vision/goals/swot/execution/kpi/risks) | N—1 Project |
| **Report** | user_id, project_id, content | N—1 Project; +PDF |
| **Document / Vault / MemoryChunk** | user_id/org, type, content, embedding(V2) | knowledge для RAG |
| **KnowledgeBase** (V2) | org, source docs → chunks | RAG-контекст агентов |
| **Board (meetings/speeches/votes/decisions)** | project/org | коллективные решения |
| **Subscription / Invoice / UsageStats** | organization_id, plan, usage | биллинг/лимиты |
| **Notification / ActivityLog / SupportTicket** | user/org | системные события |

**Изоляция арендаторов:** всё скоупится `user_id`/`organization_id`; RLS включён на всех таблицах
(сервер использует service-role, доступ ограничен кодом — см. Security §19).

---

## 14. Monetization Architecture

Реализовано: серверные лимиты (Free = 3 проекта → 402), reports/месяц, LemonSqueezy-биллинг.

| План | Цена (ориентир) | Проекты | Отчёты/мес | AI-модель | Команда | Ключевое |
|---|---|---|---|---|---|---|
| **Free** | $0 | 3 | 3 | Haiku/Sonnet | 1 | Попробовать совет |
| **Starter** | ~$19/мес | 10 | 20 | Sonnet | 2 | Соло-основатель |
| **Professional** | ~$49/мес | безлимит | 100 | Sonnet + Opus | 5 | Активный бизнес |
| **Business** | ~$149/мес | безлимит | безлимит | Opus | 20 | Команды, org, роли |
| **Enterprise** | custom | безлимит | безлимит | Opus + приватные | безлимит | SSO/SAML, audit, SLA, VPC |

**Механика:** лимиты enforced на сервере (не доверять клиенту); апгрейд контекстный (по факту
лимита); usage показан заранее; **запрещены тёмные паттерны** (Philosophy P2/P17). Метрики
монетизации — §18.

---

## 15. Retention System

- **Daily AI Tasks** — ежедневный «бриф совета» / рекомендация дня → повод вернуться.
- **History** — вся работа сохранена, легко продолжить.
- **Saved / Custom Agents** — персонализация повышает switching cost.
- **Templates** — готовые стратегии/промпты ускоряют повторное использование.
- **Notifications** — «отчёт готов», «заседание завершено» (§16).
- **Reports** — накопленная ценность (архив решений) удерживает.
- **Progress/Streaks** — прогресс по проекту/задачам как крючок вовлечённости.

---

## 16. Notification System

| Канал | Статус | Для чего |
|---|---|---|
| **In-app** ✅ | есть (`notifications`, тосты) | мгновенный feedback, лента |
| **Email** | частично (Resend для auth) | завершение задач, отчёты, инвайты, лимиты |
| **Push** | план | мобильные напоминания |
| **Telegram** | план | опциональный канал для алертов |

**События:** AI-задача завершена · отчёт готов · заседание совета завершено · лимит плана
исчерпан (+апгрейд) · приглашение в команду · событие безопасности (вход/2FA/passkey).
Настройки каналов — в Settings/Notifications (реализовано).

---

## 17. Admin Architecture

- **Admin Dashboard** ✅ (`/admin`, `/api/admin/stats`) — сводные метрики.
- **Users / Organizations** — просмотр, модерация, смена планов, бан.
- **Payments** — статусы подписок, инвойсы, рефанды.
- **Logs** — `activity_logs`, security-события.
- **Analytics** — продуктовые/revenue-метрики (§18).
- **Moderation** — жалобы, контроль контента.
- **Security** — аудит, подозрительная активность, управление доступом.
- **Доступ:** только owner/admin, строгая серверная проверка + audit trail.

---

## 18. Analytics Architecture

| Категория | Метрики |
|---|---|
| **Product** | DAU/WAU/MAU, stickiness (DAU/MAU), feature adoption, projects created, strategies generated |
| **User** | Activation (первый результат), Retention (D1/D7/D30), сессии, time-to-value |
| **Revenue** | MRR/ARR, Conversion (free→paid), Churn, LTV, ARPU, expansion (upsell) |
| **AI** | Сообщений/ответов, токены/стоимость, latency, satisfaction, hallucination-rate, tool-use success |

Источник: `usage_stats`, `activity_logs`, PostHog (события), биллинг. Дашборды — Admin (§17).
Правило: метрики привязаны к решениям (что улучшаем), а не тщеславные.

---

## 19. Security Requirements

Реализовано в этом продукте (см. `docs/SECURITY-AUDIT.md`):
- **Authentication** — NextAuth v5 (JWT, secure/httpOnly cookies), bcrypt(12), **TOTP 2FA**, **passkeys**, подписанные verify/reset токены, rate-limiting, энумерация-safe.
- **Authorization** — RBAC (`members.role`), скоуп по `user_id`/`organization_id`, whitelists (нет mass-assignment), IDOR закрыт, серверная проверка (не только UI).
- **Data Privacy** — GDPR-экспорт и удаление аккаунта; изоляция арендаторов; **RLS на всех 33 таблицах** (anon-ключ заблокирован, сервер — service-role).
- **Encryption** — TLS в транзите; AES-256-GCM для 2FA-секретов; секреты только в env.
- **Audit Logs** — `activity_logs` + журнал безопасности.
- **Compliance** — GDPR-готовность; AI-дисклеймер («рекомендация, не финсовет»); для Enterprise — SOC 2 / DPA (роадмап).

---

## 20. Product Roadmap

| Фаза | Название | Цель | Ключевое | Метрика выхода |
|---|---|---|---|---|
| **1 · MVP** ✅ | Доказать ценность | Проект→анализ→стратегия→отчёт, auth/2FA, чат | Активация, «первый результат» | Time-to-value < 5 мин |
| **2 · Growth** | Удержание и монетизация | Council, Vault/Tasks, custom agents, планы, инвайты | D30-retention, free→paid | Retention ↑, conversion ↑ |
| **3 · Scale** | Платформа | Marketplace, KB/RAG, file-analysis, memory, интеграции, PostHog | Adoption фич, expansion | NRR > 100% |
| **4 · Enterprise** | Крупные клиенты | SSO/SAML, RBAC-глубже, audit, org-иерархии, приватные агенты, SLA, SOC 2 | Enterprise-логотипы | ACV, security-review pass |

---

## 21. Final — резюме архитектуры

**Vertlix AI** = AI SaaS, где **виртуальный совет из 20 директоров** превращает идею в решение:
- **Продукт** (IA §5): Marketing → Auth → Application (Dashboard/Projects/AI/Strategy/Workspace) → Analytics/Billing/Settings/Admin.
- **Пользователи/роли** (§3–4): 6 персон, 5 ролей RBAC с серверной проверкой.
- **AI-система** (§7–8): роль-эксперты + оркестрация + заседания/голосования + tools + (V2) RAG/memory.
- **Данные** (§13): multi-tenant (Organization→Workspace→Project), изоляция через RLS + скоуп.
- **Бизнес-модель** (§14): 5 планов с серверными лимитами, без тёмных паттернов.
- **Масштаб/безопасность** (§18–20): метрики решений, enterprise-security уже заложена.

**Аудит документа (готовность строить бизнес):**
- ✅ **Масштабируемость** — multi-tenant, роли, лимиты, фазовый роадмап.
- ✅ **Понятность** — IA и flow однозначны; сущности и связи определены.
- ✅ **Прибыльность** — 5-уровневый tiering с реальными enforced-лимитами и апселлом.
- ✅ **Заземлённость** — на реальный продукт (не фантазия): совет, стратегии, отчёты, биллинг, RLS.
- ✅ **Готовность к миллионам** — серверный enforcement, изоляция арендаторов, security-first.

**Слабые места, устранённые при аудите:**
1. Рассинхрон бренда (Apex vs Vertlix в старых доках) → зафиксировано актуальное имя + консолидация.
2. Риск «фантазийной» архитектуры → каждая сущность/фича сверена с кодом; непостроенное (RAG,
   file-analysis, marketplace, push/telegram) честно помечено фазами V2/план.
3. Неопределённость ролей → RBAC из 5 ролей с явными правами/ограничениями и серверной проверкой.
4. Монетизация без enforcement → лимиты серверные (Free=3 подтверждён в коде), апгрейд контекстный.

---

*Companion (бизнес): `docs/STRATEGY-2026.md`, `docs/02-PRD.md`, `docs/08-Roadmap.md`,
`docs/AI_EXECUTIVE_TEAM_BIBLE.md` · (дизайн-система): [Philosophy](./DESIGN-PHILOSOPHY.md) …
[Design Ops](./DESIGN-OPS.md) · (безопасность): [Security Audit](./SECURITY-AUDIT.md).*
