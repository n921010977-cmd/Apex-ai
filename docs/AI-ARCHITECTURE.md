# Vertlix AI — Intelligence Architecture

> **Официальный стандарт AI-архитектуры.** Не дизайн, не UI, не маркетинг — техническая
> архитектура искусственного интеллекта: агенты, оркестрация, память/RAG, инструменты,
> безопасность, стоимость, БД, API.
>
> **Концепция:** AI Business Operating System — виртуальная команда из 20 директоров-экспертов
> (CEO/CFO/CMO/COO/CTO + аналитик/юрист/продажи/…). Дополняет
> [Technical Architecture](./TECHNICAL-ARCHITECTURE.md) и [Database Architecture](./DATABASE-ARCHITECTURE.md).

**Версия 1.0 · 2026-07-22** · масштаб до **10M+**

> **Реальность (в коде):** ✅ Anthropic Claude (Opus 4.8 / Sonnet 5 / Haiku 4.5), стриминг SSE
> token-by-token (`orchestrator`), **настоящий function-calling** (`tools.ts`: расчёты LTV/CAC/
> MRR/ARR/burn/runway, web-search, report/task-tools), **pgvector RAG-память** (`memory.ts`:
> `getEmbedding` → similarity search через RPC), совет с заседаниями/голосованиями (`board.ts`),
> per-user rate-limit + auth на LLM-эндпоинтах, generic-обработка ошибок. 🎯 — model-router
> (мультипровайдер), document-ingestion в KB, prompt-versioning, eval-loop, response-cache.

---

## 1. AI System Overview

```
User
 ↓
Application Layer      (Next.js API: auth(), rate-limit по юзеру, Zod, скоуп по tenant)
 ↓
AI Orchestration       (orchestrator.ts/legacy: single-agent + multi-agent совет)
 ↓
Agent System           (20 директоров: persona + model + tools + limits — agents.ts)
 ↓
Model Router 🎯        (сейчас: прямой Anthropic; цель: выбор провайдера/модели по задаче/цене)
 ↓
LLM Providers          (✅ Anthropic Claude Opus/Sonnet/Haiku; 🎯 OpenAI/Gemini/OSS)
 ↓
Response Processing    (стриминг onToken, tool-loop, парс, извлечение reasoning/confidence)
 ↓
Memory                 (✅ pgvector RAG memory_chunks; short-term = messages контекст)
```
Каждый слой изолирован: приложение решает **кто/можно ли** (authz, лимиты), оркестрация — **как**
(один агент или совет), агент — **что** (персона+инструменты), роутер — **чем** (модель), провайдер —
**инференс**, память — **контекст**.

---

## 2. AI Agent Architecture

Структура агента (реальный конфиг `agents.ts` + таблица `agents`):

```ts
Agent = {
  identity:     { id, name, type },          // CEO — Стратег, CFO — Финансист, ...
  role:         type,                         // ceo/cfo/cmo/coo/cto/analyst/legal/sales/custom
  goal:         "зона ответственности",
  instructions: system_prompt,                // персона-промпт (по-русски, 7–12 предложений)
  personality:  тон/стиль в промпте,
  knowledge:    project context (+ 🎯 RAG из KB),
  tools:        tools_enabled[] → tools.ts,   // calculate_metrics, search_web, ...
  memory:       conversation (short) + pgvector (long),
  permissions:  org-скоуп + RBAC (кто запускает),
  model:        claude-opus-4-8 | sonnet-5 | haiku-4-5,   // по задаче/плану
  parameters:   { temperature, max_tokens },
  evaluation:   🎯 quality/hallucination score
}
```

---

## 3. Agent Types

| Agent | Purpose | Capabilities | Tools | Input → Output | Limitations |
|---|---|---|---|---|---|
| **CEO — Стратег** | Общая стратегия, синтез совета | приоритизация, арбитраж | все (read) | вопрос/проект → решение | не заменяет юр./фин. факты |
| **CFO / Finance** | Финансы, unit-экономика | LTV/CAC/MRR/ARR/burn/runway | `calculate_metrics` | метрики/цены → финмодель | не финсовет (дисклеймер) |
| **CMO / Marketing** | GTM, бренд, каналы | позиционирование, воронка | `search_web`, `generate_report` | ЦА/продукт → GTM-план | нет доступа к рекламным API (🎯) |
| **Sales** | Продажи, pipeline | скрипты, сегментация | `create_task`, `get_project_data` | ICP → sales-план | — |
| **Business Analyst** | Анализ данных, разбор | метрики, инсайты | `calculate_metrics`, `get_project_data` | данные → выводы | нет прямого доступа к БД клиента (🎯) |
| **Legal Assistant** | Юр-ассистирование | риск-ревью, чек-листы | `search_web` | документ/вопрос → замечания | не юрсовет (дисклеймер) |
| **Research** | Ресёрч | сбор/сжатие информации | `search_web` | тема → сводка+источники | зависит от качества поиска |
| **Strategy / Product** | Стратегия/продукт | roadmap, приоритеты | `generate_report` | контекст → план | — |

**Каждый тип:** свой system_prompt, набор tools, модель (сложное → Opus, быстрое → Haiku),
temperature. Ограничения зашиты в промпт (дисклеймеры) и в permissions.

---

## 4. Agent Orchestration

| Режим | Реализация |
|---|---|
| **Single Agent** | `directChat`/`runOrchestrator` — один директор, стриминг + tool-loop ✅ |
| **Multi-Agent (совет)** | `board.ts`: заседание → выступления директоров → голосование → решение ✅ |
| **Collaboration** | директора обсуждают вопрос; CEO синтезирует ✅ |
| **Delegation** | 🎯 CEO делегирует под-задачи профильным агентам (граф) |
| **Workflow** | 🎯 многошаговые пайплайны (анализ→стратегия→отчёт) как оркестрируемый граф |

```
CEO (координатор)
 ├─→ Marketing  → (search_web, отчёт)
 ├─→ Research   → (сбор данных, источники)
 └─→ Finance    → (calculate_metrics)
        ↓ синтез CEO → голосование совета → decision
```
🎯 **Оркестратор-граф:** декларативные workflow (узлы=агенты, рёбра=передача контекста),
параллельный fan-out + синтез, лимит глубины/стоимости на прогон.

---

## 5. Model Router (🎯 — сейчас прямой Anthropic)

Цель: единая точка выбора модели/провайдера.

```
task → Router(cost, speed, quality, task_type, context_size, plan)
       → выбор: Claude Opus (сложное/reasoning) | Sonnet (баланс) | Haiku (быстрое/дешёвое)
                🎯 GPT (альтернатива) | Gemini (длинный контекст/мультимодал) | OSS (приватно)
```
- **Cost/Quality trade-off:** дешёвая модель по умолчанию, эскалация к Opus для сложного (reasoning,
  финмодель, стратегия). **Context size:** длинный контекст → модель с большим окном (🎯 Gemini).
  **Plan-gating:** Opus — на верхних тарифах.
- **Реализация:** сейчас модель фиксируется на агенте (`agents.model`); 🎯 абстракция `LLMProvider`
  интерфейс + роутер + фолбэк при ошибке/лимите провайдера + прайс-таблица.

---

## 6. Prompt Engineering System

**Слои промпта (порядок склейки):**
```
System Prompt     — персона директора (роль, тон, ограничения, дисклеймеры)
Developer Prompt  — правила формата (markdown, 7–12 предложений, по-русски, tool-политика)
Context           — проект/диалог + 🎯 RAG-выдержки (top-K из KB)
Memory            — short (последние сообщения) + long (pgvector релевантное)
Tools             — определения функций (tools.ts) для function-calling
User Prompt       — запрос пользователя
Output Format     — структура ответа (вывод + reasoning + confidence + sources)
```
- **Templates:** персоны в `agents.ts`; общий каркас формата — переиспользуемый.
- 🎯 **Versioning:** каждый промпт — версия (`prompt_versions`), A/B, откат.
- 🎯 **Testing:** eval-набор кейсов на регресс промптов (перед публикацией).
- 🎯 **Optimization:** сжатие промпта, few-shot только где нужно, вынос статики в prefix-cache.

---

## 7. Memory System

| Тип | Что | Реализация |
|---|---|---|
| **Short-term** | текущий ход рассуждения | контекст запроса |
| **Conversation** | история диалога | `messages` (по conversation_id) ✅ |
| **User Memory** | предпочтения/стиль | `user_settings` ✅ + 🎯 vector |
| **Workspace/Project** | контекст проекта | project+strategies ✅ + pgvector |
| **Agent Memory** | долгосрочные знания агента | `memory_chunks` + embeddings ✅ |

**Реализовано (`memory.ts`):** `saveMemory` (chunk + embedding), `searchMemory` (getEmbedding →
**pgvector similarity RPC** → top-K по `<=>`), `clearMemory`. Скоуп по `organization_id`.
- **Что сохранять:** выводы, факты о бизнесе, решения, предпочтения.
- **Что НЕЛЬЗЯ:** секреты, платёжные данные, пароли, чужой PII; чувствительное — не эмбеддить.
- **Обновление:** append + пометка устаревшего; инвалидация при изменении источника; TTL для сессионного.

---

## 8. RAG Architecture

```
Upload → Parsing(PDF/DOCX/TXT/CSV → текст; 🎯 OCR)
  → Chunking(смысловые куски + overlap) → Embedding(vector)
  → Vector Storage(pgvector: memory_chunks/document_chunks)
  → Retrieval(query embedding → similarity top-K, фильтр по tenant)
  → Context Injection(выдержки в промпт с цитатами)
  → Generation(LLM с источниками)
```
- **✅ Retrieval-часть реализована** (`searchMemory`: embedding + pgvector similarity + top-K).
- 🎯 **Ingestion-часть** (upload→parse→chunk→embed для документов) — нужен storage + parser + embeddings-провайдер.
- **Best practices:** chunk 300–800 токенов с overlap; hybrid (vector + FTS) + rerank; всегда
  показывать источники (anti-hallucination); фильтрация по `organization_id` (tenant-изоляция в retrieval).

---

## 9. Knowledge Base

- **Источники:** Documents (PDF/DOCX/TXT/CSV) · Web Data (`search_web`) · Company Data (проекты/стратегии) · 🎯 Databases/Files.
- **Индексация:** документ → chunks → embeddings → pgvector (`ivfflat`/`hnsw` индекс).
- **Обновление:** при изменении источника — переэмбеддинг изменённых chunks; версия/`updated_at`.
- **Поиск:** semantic (vector) + 🎯 keyword (FTS `tsvector`) → гибрид + rerank; результаты скоупятся по tenant.
- **Статус:** company-data (проекты) и web-search ✅; загрузка своих документов в KB — 🎯 (§8 ingestion).

---

## 10. AI Tools System (реальный function-calling)

Определения — `tools.ts`; исполнение — `executeToolCall`.

| Tool | Permission | Input | Output | Security |
|---|---|---|---|---|
| **calculate_metrics** ✅ | authed | metric (ltv/cac/ltv_cac_ratio/mrr/arr/burn/runway) + params | значение + формула + бенчмарк | чистая функция, без побочек |
| **search_web** ✅ | authed (+план) | query | результаты/сводка | SSRF-контроль, allowlist (🎯), без приватных URL |
| **generate_report** ✅ | authed | project/params | отчёт (сохраняется) | скоуп по user/project |
| **get_project_data** ✅ | authed | project_id | данные проекта | **скоуп по владельцу** (нет IDOR) |
| **create_task** ✅ | authed | title/project | задача | скоуп по user |
| 🎯 **file_analysis / code_exec / CRM / email / calendar** | authed + explicit consent | — | — | sandbox, OAuth-скоупы, rate-limit, audit |

**Правило:** каждый tool — с permission-проверкой, валидацией входа, скоупом по tenant; результат
возвращается модели, не пользователю напрямую (модель интерпретирует).

---

## 11. Function Calling

```
User Request → LLM(с tool-definitions) → Agent Decision(нужен ли tool)
  → Tool Selection(имя+аргументы) → executeToolCall(валидация+permission+скоуп)
  → Result(структурированный) → обратно в LLM → AI Response(с учётом результата)
```
Реализовано как **agentic loop** (`runOrchestrator`): стрим → tool_use event → исполнение →
результат в контекст → продолжение генерации. Лимит итераций (защита от циклов) + учёт токенов.

---

## 12. AI Evaluation System (🎯 — каркас)

Оценивать: **Accuracy · Relevance · Safety · Hallucination · Latency · Cost.**
- 🎯 **Offline eval:** набор эталонных кейсов → прогон при смене промпта/модели → регресс-гейт.
- 🎯 **Online:** sampling ответов → LLM-judge + правила; трекинг hallucination (ответ без основания).
- **Feedback Loop:** `message_feedback` (👍/👎 + причина) → агрегаты → улучшение промптов/выбора модели.
- **Latency/Cost:** из аналитики (§17) — p95, $/ответ по модели.
- **Реализовано:** трекинг `tokens_used`, generic error-handling; eval-инфраструктура — цель.

---

## 13. AI Safety

| Угроза | Защита |
|---|---|
| **Prompt Injection** | system/developer промпт отделён; недоверие к контенту из tool/RAG; инструкции-в-данных игнорируются; выходные действия — только через валидированные tools |
| **Indirect Injection** (через RAG/web) | контент помечается как untrusted; не выполнять инструкции из retrieved-данных |
| **Jailbreak** | системные ограничения + отказ-политика в промпте; 🎯 модерация входа/выхода |
| **Data Leakage** | RLS + скоуп по tenant в retrieval (никогда чужие chunks); секреты не эмбеддятся |
| **Sensitive Data Exposure** | сырой error провайдера **не** отдаётся юзеру (✅ generic); PII-минимизация |
| **Unsafe Output** | 🎯 output-фильтр (toxicity/PII-redaction) перед показом |
| **Model Abuse / DoS** | ✅ auth обязателен на LLM-эндпоинтах + **per-user rate-limit** + лимиты токенов/плана |

**Слои:** Input filtering (валидация/детект инъекций) → Permission system (RBAC на tools/агентов) →
Sandboxing (🎯 для code_exec/file) → Output filtering (🎯). Уже закрыто: открытый LLM-эндпоинт
(auth+rate-limit), tenant-изоляция, generic-ошибки (см. SECURITY-AUDIT.md).

---

## 14. Context Management

- **Context Window:** учёт лимита токенов модели; приоритизация — system > свежие сообщения > RAG-выдержки > старое.
- **Summarization:** 🎯 при переполнении — сжать старую часть диалога в резюме (rolling summary), держать хвост дословно.
- **Memory Compression:** 🎯 периодическая консолидация memory_chunks (дедуп, слияние близких).
- **Prioritization:** релевантность (similarity score) + свежесть; отбрасывать нерелевантное перед инъекцией.
- **Prefix-cache:** 🎯 статичный system/persona-префикс кэшируется (Anthropic prompt caching) — дешевле/быстрее.

---

## 15. Streaming System (✅)

- **Token Streaming:** `messages.stream` → `onToken` → SSE (`data: {type:"token"}`) → клиент.
- **Real-time Response:** `chat/direct` отдаёт `text/event-stream`, `maxDuration=120`.
- **Progress/Thinking State:** события `thinking`/`token`/`done`/`error`; на клиенте — пульс-индикатор.
- **Error Handling:** ошибка в стриме → событие `error` с **человеческим** сообщением (сырой текст скрыт),
  частичный ответ сохраняется, «повторить».
- **Stop:** пользователь может прервать генерацию (abort).

---

## 16. AI Cost Optimization

| Метод | Как |
|---|---|
| **Caching** 🎯 | кэш ответов по хешу (промпт+контекст) в Redis; prompt-prefix cache (Anthropic) |
| **Model Selection** ✅/🎯 | Haiku по умолчанию, Opus только для сложного (роутер §5) |
| **Token Optimization** | краткие system-промпты, обрезка контекста, только нужные tools в определении |
| **Prompt Compression** 🎯 | сжатие длинного контекста/истории (summary) |
| **Batch Processing** 🎯 | фоновые задачи (отчёты) — батч/оффпик, не в реальном времени |

**Учёт:** `tokens_used` на сообщение → стоимость по модели → лимиты/биллинг (usage_stats). AI-cost —
прямые деньги, поэтому мониторится как первоклассная метрика (§17).

---

## 17. AI Analytics

Отслеживать: **Requests** (по агенту/юзеру/орг), **Tokens** (in/out), **Cost** ($ = токены×цена модели),
**Latency** (p50/p95/p99, TTFT — time-to-first-token), **Quality** (feedback, eval-score),
**User Satisfaction** (👍/👎, retention AI-фич). Источник: `messages.tokens_used`, `usage_stats`,
PostHog события, 🎯 eval-стор. Алерты: cost-аномалия, latency-регресс, рост hallucination/👎.

---

## 18. AI Database Structure

| Модель | Статус | Назначение |
|---|---|---|
| **agents / agent_tools** | ✅ | конфиг агента + инструменты |
| **custom_agents** | ✅ | per-user свои/клонированные |
| **AgentVersion** | 🎯 | версии конфигов/промптов агента |
| **Prompt / PromptVersion** | 🎯 | шаблоны промптов + версии/A-B |
| **conversations / messages** | ✅ | диалоги + сообщения (`tokens_used`) |
| **memory_chunks (+embedding)** | ✅ | pgvector память/RAG |
| **document_chunks / embeddings** | 🎯 | KB-документы (ingestion) |
| **tool (agent_tools) / tool_calls** | ✅/🎯 | определения + лог вызовов |
| **Evaluation / message_feedback** | 🎯 | оценки качества, обратная связь |
| **usage_stats** | ✅ | токены/запросы/стоимость |
| **board_meetings/speeches/votes/decisions** | ✅ | коллективные решения совета |

(Полные поля/индексы — [Database Architecture](./DATABASE-ARCHITECTURE.md) + [`reference-schema.prisma`](./reference-schema.prisma).)

---

## 19. AI API Architecture

| Endpoint | Метод | Статус | Security |
|---|---|---|---|
| `POST /api/agents` · `/agents/[id]` | create/update agent | ✅ | auth + org-скоуп + whitelist |
| `POST /api/agents/[id]/run` | run agent | ✅ | auth + **rate-limit по юзеру** |
| `POST /api/chat/direct` | single-agent **stream (SSE)** | ✅ | **auth обязателен** + rate-limit |
| `POST /api/chat/orchestrate` | multi-agent совет | ✅ | auth + rate-limit |
| `GET /api/chat/[id]/messages` · `POST /send` | история/отправка | ✅ | auth + **ownership-check** |
| `POST /api/memory` | search/add/clear память | ✅ | auth + org-скоуп |
| `POST /api/strategies/[id]/generate` | генерация стратегии (6 секций) | ✅ | auth + report-limiter |
| `POST /api/board/meetings/[id]/start` | заседание совета | ✅ | auth |
| 🎯 `POST /api/knowledge/upload` · `/tools/execute` | KB-ingest / прямой tool | 🎯 | auth + sandbox + consent |

Конвенции: Zod-валидация, generic-ошибки (без сырого провайдер-текста), стриминг через SSE.

---

## 20. Enterprise Features

- **Private Agents** 🎯 — приватные агенты организации (не в общем каталоге), скоуп по org.
- **Custom Models** 🎯 — выбор/подключение моделей (в т.ч. приватные/OSS через роутер §5).
- **Team Agents** ✅/🎯 — общие агенты организации (agents.organization_id); шеринг настроек.
- **Permissions** ✅ — RBAC на запуск агентов/tools, план-гейтинг моделей.
- **Audit Logs** ✅ — `activity_logs` (AI-действия, tool-вызовы 🎯), security-события.
- **Data Isolation** ✅ — RLS на всех таблицах + скоуп по tenant в retrieval (чужие chunks недостижимы);
  🎯 приватный vector-неймспейс на крупного клиента, on-prem/VPC-инференс.

---

## 21. Development Roadmap

| Фаза | Название | Содержание | Статус |
|---|---|---|---|
| **1** | Basic AI Chat | Claude, стриминг SSE, персоны | ✅ Готово |
| **2** | Single Agents | 20 директоров, tools (function-calling), стратегии/отчёты | ✅ Готово |
| **3** | Memory + RAG | pgvector memory (retrieval ✅); 🎯 document-ingestion, KB-загрузка, summarization | 🟡 Идёт |
| **4** | Multi-Agent System | совет/голосования ✅; 🎯 оркестратор-граф, делегирование, workflow | 🟡 Идёт |
| **5** | Enterprise AI Platform | 🎯 model-router (мультипровайдер), eval-loop, response-cache, private agents, output-фильтры, prompt-versioning | ⬜ Впереди |

---

## 22. Final — Intelligence Architecture (резюме)

**Диаграмма:**
```
User → API(auth,rate-limit,Zod) → Orchestration(single/council)
     → Agent(persona+tools+model) → [Model Router 🎯] → Claude(Opus/Sonnet/Haiku)
     → Response(stream onToken, tool-loop, sources) → Memory(pgvector RAG)
                                   ↑ Tools(calc/search/report/task) · Safety(injection/isolation/rate-limit)
```
- **Agent System** ✅ — 20 директоров, persona+tools+model, совет с голосованием.
- **Memory/RAG** ✅ retrieval (pgvector similarity), 🎯 ingestion.
- **Tools** ✅ реальный function-calling (LTV/CAC/MRR/ARR/burn/runway, web, report, task).
- **Security** ✅ auth+per-user rate-limit на LLM, tenant-изоляция, generic-ошибки, injection-политика.
- **Database** ✅ agents/conversations/messages/memory_chunks/board_*; 🎯 prompt/eval-версии.
- **APIs** ✅ chat(SSE)/agents/memory/strategies/board.
- **Scaling** — stateless + streaming + per-user лимиты; путь к 10M: model-router (дешёвые модели +
  prefix-cache), response-cache (Redis), батчинг фоновых задач, партиционирование `messages`.

**Аудит — устранённые/зафиксированные слабые места:**
1. Стек-иллюзия (промпт: GPT/Gemini) → честно: **Anthropic Claude** в рантайме; мультипровайдер — 🎯 роутер (§5).
2. «RAG с нуля» → уточнено: **retrieval уже реализован** (pgvector в `memory.ts`), не хватает **ingestion** документов.
3. AI-безопасность → зафиксировано реально закрытое (открытый LLM-эндпоинт → auth+rate-limit,
   tenant-изоляция, generic-ошибки) vs 🎯 (output-фильтры, sandbox для code_exec).
4. Стоимость как afterthought → cost — первоклассная метрика (§16–17), модель-роутинг и кэш в плане.
5. Prompt-инфраструктура → versioning/testing/eval помечены 🎯 (сейчас промпты в коде `agents.ts`).

---

*Companion: [Technical Architecture](./TECHNICAL-ARCHITECTURE.md) · [Database Architecture](./DATABASE-ARCHITECTURE.md) ·
[Product Architecture](./PRODUCT-ARCHITECTURE.md) · [Security Audit](./SECURITY-AUDIT.md) ·
реальные модули: `src/lib/orchestrator*.ts`, `agents.ts`, `board.ts`, `tools.ts`, `memory.ts`.*
