# 📘 Документ 8 — Roadmap разработки

## Обзор этапов

| Этап | Название | Срок | Статус |
|---|---|---|---|
| 1 | Настройка проекта | Неделя 1 | ✅ |
| 2 | Дизайн-система | Неделя 1-2 | ✅ |
| 3 | Лендинг | Неделя 2 | ✅ |
| 4 | Авторизация | Неделя 3 | 🔄 В работе |
| 5 | База данных | Неделя 3 | ⏳ |
| 6 | Dashboard UI | Неделя 4 | ✅ |
| 7 | Создание проекта | Неделя 4 | ✅ |
| 8 | AI Pipeline | Неделя 5-6 | ⏳ |
| 9 | Реальные отчёты | Неделя 6-7 | ⏳ |
| 10 | PDF Export | Неделя 7 | ⏳ |
| 11 | Stripe | Неделя 8 | ⏳ |
| 12 | Уведомления | Неделя 9 | ⏳ |
| 13 | Аналитика | Неделя 9 | ✅ UI |
| 14 | Тестирование | Неделя 10 | ⏳ |
| 15 | Деплой Production | Неделя 10-11 | 🔄 Vercel |
| ... | ... | ... | ... |
| 30 | Релиз v1.0 | Месяц 4 | ⏳ |

---

## Этап 1 — Настройка проекта ✅
**Срок**: 2-3 дня

- [x] Инициализация Next.js 16 проекта
- [x] TypeScript конфигурация
- [x] Tailwind CSS v4 подключение
- [x] ESLint + Prettier
- [x] Git репозиторий
- [x] Vercel деплой (preview)
- [x] Структура папок (`app/`, `components/`, `lib/`)
- [x] Переменные окружения (`.env.example`)

---

## Этап 2 — Дизайн-система ✅
**Срок**: 3-4 дня

- [x] Цветовые токены в Tailwind config
- [x] Компонент `Button` (варианты + размеры)
- [x] Компонент `Card` + `CardContent`
- [x] Компонент `Badge` (success, warning, default)
- [x] Компонент `Progress`
- [x] Утилита `cn()` (clsx + tailwind-merge)
- [x] Базовые CSS переменные (шрифты, цвета)
- [ ] Компонент `Input`
- [ ] Компонент `Select`
- [ ] Компонент `Modal`
- [ ] Компонент `Toast`
- [ ] Компонент `Skeleton`

---

## Этап 3 — Лендинг ✅
**Срок**: 4-5 дней

- [x] Navbar (sticky, blur)
- [x] Hero секция (gradient text, CTA)
- [x] "Как это работает" (3 шага)
- [x] AI Executives секция (8 агентов)
- [x] Features секция (6 возможностей)
- [x] Pricing секция (3 тарифа)
- [x] CTA Banner
- [x] Footer
- [ ] Анимации при скролле (Framer Motion)
- [ ] Счётчики цифр (countUp)
- [ ] SEO meta tags
- [ ] OG image

---

## Этап 4 — Авторизация 🔄
**Срок**: 4-5 дней

- [ ] NextAuth.js v5 setup
- [ ] Провайдер Google OAuth
- [ ] Провайдер Credentials (email + password)
- [ ] Страница `/login`
- [ ] Страница `/register`
- [ ] Страница `/forgot-password`
- [ ] Email подтверждение (SendGrid)
- [ ] Middleware защита `/dashboard/*`
- [ ] Redirect логика (уже авторизован → /dashboard)
- [ ] Logout

---

## Этап 5 — База данных ⏳
**Срок**: 3-4 дня

- [ ] PostgreSQL настройка (Neon.tech / Supabase)
- [ ] Prisma setup + `schema.prisma`
- [ ] Миграции: Users, Projects, Reports, AgentRuns
- [ ] Миграции: Sessions, Notifications, ActivityLogs
- [ ] Seed данные для разработки
- [ ] Redis setup (Upstash)
- [ ] Prisma Studio проверка

---

## Этап 6 — Dashboard UI ✅
**Срок**: 3-4 дня

- [x] Sidebar с навигацией
- [x] Главная страница Dashboard
- [x] Stat карточки (4 метрики)
- [x] Список последних проектов
- [x] AI команда виджет
- [x] Upgrade баннер
- [x] Мои проекты (список + сетка + фильтры)
- [x] Детальная страница проекта (вкладки)
- [x] Аналитика страница
- [x] Исполнительный совет страница
- [x] Отчёты страница
- [x] Настройки страница
- [x] Поддержка страница
- [x] Блокнот

---

## Этап 7 — Создание проекта ✅ (UI)
**Срок**: 3 дня

- [x] 3-step wizard UI
- [x] Валидация форм
- [x] Loading state
- [ ] API интеграция (POST /api/projects)
- [ ] SSE прогресс (EventSource)
- [ ] Real-time обновление статуса

---

## Этап 8 — AI Pipeline ⏳
**Срок**: 7-10 дней

- [ ] Anthropic SDK интеграция
- [ ] Промпты для каждого агента (8 штук)
- [ ] Параллельный запуск агентов (Promise.all)
- [ ] CEO агрегатор
- [ ] Bull queue setup
- [ ] Redis pub/sub для progress events
- [ ] Сохранение AgentRun в БД
- [ ] Обработка ошибок и retry
- [ ] Тестирование на реальных данных

---

## Этап 9 — Реальные отчёты ⏳
**Срок**: 5 дней

- [ ] Схема данных Report (8 JSON полей)
- [ ] API GET /api/reports/[id]
- [ ] Рендеринг секций отчёта
- [ ] Share token генерация
- [ ] Публичная страница /reports/share/[token]
- [ ] История версий при повторном анализе

---

## Этап 10 — PDF Export ⏳
**Срок**: 4 дня

- [ ] Puppeteer или @react-pdf/renderer
- [ ] PDF шаблон (обложка + 8 секций)
- [ ] S3 загрузка
- [ ] API GET /api/reports/[id]/pdf
- [ ] Download кнопка на UI

---

## Этап 11 — Stripe ⏳
**Срок**: 5 дней

- [ ] Stripe аккаунт + продукты ($49 Pro, $199 Enterprise)
- [ ] API /api/billing/checkout
- [ ] API /api/billing/portal
- [ ] API /api/billing/webhook
- [ ] Обработка событий: checkout.completed, subscription.updated, payment.failed
- [ ] UI обновление тарифа после оплаты
- [ ] Email при успешной оплате
- [ ] Лимиты по тарифам в middleware

---

## Этап 12 — Уведомления ⏳
**Срок**: 3 дня

- [ ] In-app уведомления (колокольчик)
- [ ] API /api/notifications
- [ ] Email шаблоны (анализ завершён, подписка)
- [ ] Настройки уведомлений в settings
- [ ] Badge счётчик непрочитанных

---

## Этап 13 — Аналитика ⏳ (частично ✅)
**Срок**: 3 дня

- [x] Страница аналитики UI (моковые данные)
- [ ] Реальные данные из БД
- [ ] График активности (реальные данные)
- [ ] Vercel Analytics подключение
- [ ] PostHog / Mixpanel для product analytics

---

## Этап 14 — Тестирование ⏳
**Срок**: 5-7 дней

- [ ] Unit тесты (Vitest) — utils, helpers
- [ ] Integration тесты — API routes
- [ ] E2E тесты (Playwright)
  - [ ] Регистрация → логин → создание проекта
  - [ ] Оплата через Stripe (test mode)
  - [ ] Генерация PDF
- [ ] Performance тест (Lighthouse > 90)
- [ ] Security аудит (OWASP)

---

## Этап 15 — Production деплой 🔄
**Срок**: 3-4 дня

- [x] Vercel деплой (preview)
- [ ] Custom домен + SSL
- [ ] PostgreSQL (Neon.tech production)
- [ ] Redis (Upstash production)
- [ ] S3 bucket (production)
- [ ] Stripe production ключи
- [ ] SendGrid продакшен
- [ ] Sentry мониторинг
- [ ] Environment variables в Vercel
- [ ] CI/CD pipeline (GitHub Actions)

---

## Этапы 16-29 — Пост-лонч ⏳

### Этап 16 — User onboarding (неделя 12)
- [ ] Welcome тур при первом входе
- [ ] Интерактивная подсказка создать первый проект
- [ ] Onboarding email серия (3 письма)

### Этап 17 — Поиск и фильтры (неделя 12)
- [ ] Полнотекстовый поиск по проектам
- [ ] Фильтрация по индустрии, стадии, дате
- [ ] Сортировка

### Этап 18 — Sharing & Collaboration (неделя 13)
- [ ] Публичные ссылки на отчёты
- [ ] Embed виджет
- [ ] Приглашение члена команды (Enterprise)

### Этап 19 — Chat с агентами (неделя 13-14)
- [ ] Диалог с конкретным агентом
- [ ] История сообщений
- [ ] Контекст проекта в чате

### Этап 20 — Mobile optimization (неделя 14)
- [ ] Адаптивный Sidebar (drawer на mobile)
- [ ] Touch-friendly элементы
- [ ] PWA манифест

### Этап 21 — API для Enterprise (неделя 15)
- [ ] REST API документация
- [ ] API ключи управление
- [ ] Rate limiting по тарифу
- [ ] Webhook для Enterprise

### Этап 22 — White-label (неделя 15-16)
- [ ] Custom логотип
- [ ] Custom цвета
- [ ] Custom домен (CNAME)
- [ ] Убрать Apex AI брендинг

### Этап 23 — Интеграции (неделя 16)
- [ ] Notion экспорт
- [ ] Google Docs экспорт
- [ ] Slack уведомления
- [ ] Zapier / Make webhook

### Этап 24 — Dashboard улучшения (неделя 17)
- [ ] Реальные графики (Chart.js / Recharts)
- [ ] Прогнозирование трендов
- [ ] Сравнение проектов

### Этап 25 — SEO & Marketing (неделя 17-18)
- [ ] Blog (MDX)
- [ ] Case studies страницы
- [ ] Structured data (schema.org)
- [ ] Sitemap

### Этап 26 — Performance (неделя 18)
- [ ] ISR для публичных страниц
- [ ] Edge Runtime для API
- [ ] Image optimization
- [ ] Bundle size оптимизация

### Этап 27 — Безопасность (неделя 19)
- [ ] Penetration testing
- [ ] GDPR compliance
- [ ] Privacy policy / Terms
- [ ] Cookie consent banner
- [ ] Data export для пользователей

### Этап 28 — Admin панель (неделя 19-20)
- [ ] Список пользователей
- [ ] Статистика платформы
- [ ] Управление подписками
- [ ] Просмотр очередей задач

### Этап 29 — Beta программа (неделя 20)
- [ ] Форма заявки на Beta
- [ ] Onboarding Beta пользователей
- [ ] Feedback сбор (in-app)
- [ ] Bug bounty

---

## Этап 30 — Релиз v1.0 🚀
**Срок**: Месяц 4

### Чеклист перед релизом
- [ ] Все core фичи работают
- [ ] Lighthouse score > 90
- [ ] 0 критических ошибок в Sentry
- [ ] Load testing пройден (100 concurrent users)
- [ ] GDPR compliance подтверждён
- [ ] Backup и disaster recovery настроены
- [ ] Runbook для команды написан
- [ ] Status page (status.apexai.com)
- [ ] Support email настроен
- [ ] Launch на Product Hunt
- [ ] Press kit готов

---

## Метрики успеха (KPI)

### Месяц 1 после релиза
- Регистраций: 500+
- Проектов создано: 200+
- Конверсия Free → Pro: 5%+
- NPS: 40+

### Месяц 3
- MRR: $5,000+
- Активных пользователей: 300+
- Churn: < 5%

### Месяц 6
- MRR: $20,000+
- Проектов: 2000+
- Enterprise клиенты: 5+
