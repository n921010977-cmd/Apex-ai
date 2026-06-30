# 📘 Документ 5 — AI Architecture

## Общая схема

```
Пользователь
    │
    │ POST /api/projects
    ▼
API Route (Next.js)
    │
    │ Создаёт Project в БД (status: QUEUED)
    │ Ставит задачу в очередь Bull/Redis
    ▼
Queue Worker
    │
    │ Параллельный запуск 7 агентов
    ▼
┌────────────────────────────────────┐
│  CFO     CMO     COO     CTO       │
│  Sales   Legal   Analyst           │
└────────────────────────────────────┘
    │
    │ Все ответы агрегируются
    ▼
CEO Agent
    │
    │ Составляет финальную стратегию
    ▼
Report Generator
    │
    │ Сохраняет Report в БД
    │ Генерирует PDF (опционально)
    │ Отправляет уведомление
    ▼
Пользователь получает результат
```

---

## Агенты и промпты

### Системный промпт (базовый для всех агентов)
```
Ты — [ROLE] в AI Executive Board компании Apex AI.
Твоя задача — проанализировать бизнес-идею и дать конкретные,
actionable рекомендации в своей области экспертизы.

Правила:
- Давай конкретные числа и метрики, не абстрактные советы
- Используй реальные примеры из индустрии
- Будь честен о рисках и ограничениях
- Формат: структурированный JSON
- Язык: русский (если не указано иное)
```

---

### CEO (Executive Director)
**Роль**: Стратегия, видение, приоритеты, инвесторы

**Промпт**:
```
Проанализируй бизнес-идею как CEO. Дай оценку:
1. Бизнес-модель и ключевые предположения
2. Конкурентное позиционирование
3. Видение на 3 года
4. Топ-3 приоритета на первые 90 дней
5. Ключевые риски и как их митигировать
6. Оценка привлекательности для инвесторов (1-10)

Верни JSON с полями: vision, businessModel, priorities, 
investorScore, keyRisks, recommendation
```

---

### CFO (Chief Financial Officer)
**Роль**: Финансовая модель, юнит-экономика, привлечение капитала

**Промпт**:
```
Проанализируй финансовую сторону бизнеса. Рассчитай:
1. Финансовую модель на 3 года (revenue, costs, EBITDA)
2. Юнит-экономику (CAC, LTV, LTV/CAC, churn)
3. Точку безубыточности (месяц и объём)
4. Необходимые инвестиции для запуска
5. Runway при разных сценариях (base/optimistic/pessimistic)
6. Рекомендуемую структуру ценообразования

Верни JSON с численными значениями по каждому пункту.
```

---

### CMO (Chief Marketing Officer)
**Роль**: Маркетинговая стратегия, каналы, бренд

**Промпт**:
```
Разработай маркетинговую стратегию:
1. ICP (Ideal Customer Profile) — демография, боли, Jobs-to-be-done
2. Топ-3 канала привлечения с обоснованием
3. Контент-стратегия и SEO
4. Бюджет маркетинга на первые 12 месяцев
5. KPI и метрики успеха
6. Positioning statement

Верни JSON с actionable планом действий.
```

---

### COO (Chief Operations Officer)
**Роль**: Операции, процессы, команда, масштабирование

**Промпт**:
```
Разработай операционный план:
1. Минимальная команда для запуска (роли и зарплаты)
2. Ключевые бизнес-процессы и как их автоматизировать
3. Инструменты и стек (CRM, support, analytics, HR)
4. OKR на первый квартал
5. План масштабирования от 0 до 1000 клиентов
6. Операционные риски

Верни JSON с конкретными рекомендациями.
```

---

### CTO (Chief Technology Officer)
**Роль**: Технологии, архитектура, технический стек

**Промпт**:
```
Определи технологическую стратегию:
1. Рекомендуемый технологический стек (с обоснованием)
2. Архитектура MVP (монолит vs микросервисы vs serverless)
3. Технический долг — что можно срезать на MVP
4. Безопасность и соответствие требованиям (GDPR, SOC2)
5. Инфраструктура и DevOps (CI/CD, hosting, мониторинг)
6. Timeline разработки MVP

Верни JSON с конкретным стеком и обоснованием каждого выбора.
```

---

### Sales Director
**Роль**: GTM-стратегия, продажи, воронка

**Промпт**:
```
Разработай стратегию продаж:
1. Go-to-Market стратегия (PLG vs SLG vs hybrid)
2. Воронка продаж с конверсиями на каждом этапе
3. Sales playbook для первых продаж
4. Ценовая стратегия (anchor pricing, freemium, trial)
5. Первые 10 клиентов — как найти и где
6. Метрики продаж: MRR, ARR, churn, NRR

Верни JSON с конкретным планом.
```

---

### Legal Advisor
**Роль**: Юридические риски, структура, compliance

**Промпт**:
```
Проанализируй юридические аспекты:
1. Оптимальная юридическая структура (Inc, LLC, ИП)
2. Юрисдикция для регистрации
3. Ключевые юридические риски в данной индустрии
4. Необходимые лицензии и разрешения
5. Защита IP (торговые марки, патенты, авторские права)
6. Compliance требования (GDPR, CCPA, PCI DSS и др.)

Верни JSON с приоритизированным списком действий.
```

---

### Business Analyst
**Роль**: Рынок, конкуренты, TAM/SAM/SOM

**Промпт**:
```
Проведи рыночный анализ:
1. TAM, SAM, SOM с обоснованием расчётов
2. Анализ 5 главных конкурентов (strengths/weaknesses)
3. Конкурентные преимущества (USP)
4. Тренды рынка на 3-5 лет
5. Барьеры входа и как их преодолеть
6. Бизнес-балл (0-100) с объяснением

Верни JSON с численными данными и источниками.
```

---

## CEO Aggregator (финальный шаг)

```
CEO получает ответы всех 7 агентов и:
1. Разрешает противоречия между агентами
2. Синтезирует единую стратегию
3. Рассчитывает общий Business Score (взвешенное среднее)
4. Формирует Executive Summary (1 страница)
5. Создаёт Roadmap (30/60/90 дней)
6. Выделяет 3 главные рекомендации
```

---

## Технические детали

### Модель
```
Основная:  claude-sonnet-4-6 (баланс цена/качество)
Запасная:  claude-haiku-4-5 (быстро, дёшево для простых задач)
```

### Параметры вызова
```typescript
{
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  temperature: 0.7,    // для финансов: 0.3 (точность)
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: userPrompt }]
}
```

### Параллельность
```typescript
// Все 7 агентов запускаются параллельно
const [cfo, cmo, coo, cto, sales, legal, analyst] = await Promise.all([
  runAgent("CFO", projectContext),
  runAgent("CMO", projectContext),
  runAgent("COO", projectContext),
  runAgent("CTO", projectContext),
  runAgent("SALES", projectContext),
  runAgent("LEGAL", projectContext),
  runAgent("ANALYST", projectContext),
]);

// CEO запускается после всех
const ceo = await runAgent("CEO", { ...projectContext, agentResponses: { cfo, cmo, ... } });
```

### Обработка ошибок
```typescript
// Retry логика
const MAX_RETRIES = 3;
const RETRY_DELAY = [1000, 2000, 4000]; // exponential backoff

// Если агент упал — используем заглушку, не блокируем весь отчёт
if (agentFailed) {
  return { status: "failed", fallback: defaultResponse[agentRole] };
}
```

### Оценка токенов и стоимость
```
Средний проект:
- 7 агентов × ~2000 tokens input + ~2000 tokens output = ~28,000 tokens
- CEO aggregator: ~6,000 tokens
- Итого: ~34,000 tokens per project

Стоимость (claude-sonnet-4-6):
- Input:  $3/MTok  → $0.10 per project
- Output: $15/MTok → $0.47 per project
- Итого: ~$0.57 per project
```

---

## Очередь задач (Bull + Redis)

```typescript
// Создание очереди
const analysisQueue = new Bull("analysis", { redis: REDIS_URL });

// Добавление задачи
await analysisQueue.add({ projectId, userId }, {
  priority: user.isPro ? 1 : 2,  // Pro пользователи в приоритете
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false,
});

// Обработчик
analysisQueue.process(async (job) => {
  const { projectId, userId } = job.data;
  await runAnalysisPipeline(projectId, userId, (progress) => {
    job.progress(progress);
    // Уведомляем клиент через SSE/WebSocket
    notifyClient(userId, { type: "progress", projectId, progress });
  });
});
```

---

## Real-time обновления

```
Клиент подписывается на SSE: GET /api/projects/:id/stream

Сервер отправляет события:
→ { type: "agent_started",   agent: "CFO", progress: 15 }
→ { type: "agent_complete",  agent: "CFO", progress: 30 }
→ { type: "agent_started",   agent: "CMO", progress: 30 }
→ ...
→ { type: "analysis_complete", progress: 100, reportId: "..." }
→ { type: "error", message: "..." }
```
