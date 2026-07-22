# Vertlix AI — Page Templates

> **Официальный стандарт шаблонов страниц.** Не компоненты, не токены, не
> foundations — только layout-скелеты экранов. **Любой новый экран строится
> только на этих шаблонах.**
>
> Место в системе: [Philosophy](./DESIGN-PHILOSOPHY.md) → [Tokens](./DESIGN-TOKENS.md) →
> [Foundations](./FOUNDATIONS.md) → [Components](./COMPONENT-LIBRARY.md) →
> [UX Patterns](./UX-PATTERNS.md) → **Page Templates** → экраны. Использует
> существующую дизайн-систему, ничего нового не вводит.

**Версия 1.0 · 2026-07-22**

---

## 0. Ключевая идея: 100+ страниц = 10 архетипов

Мировые дизайн-системы не рисуют каждую страницу заново — они сводят их к горстке
**layout-архетипов**. Новый экран = выбрать архетип → заполнить слоты компонентами
(Component Library) по паттернам (UX Patterns). Это и есть «страница за минуты».

| # | Template | Каркас | Для чего |
|---|---|---|---|
| **T1** | **Marketing / Content** | Nav + секции + Footer | Лендинг, pricing, docs, blog, legal, status |
| **T2** | **Auth** | Центр-карточка (terminal-эстетика) | Login, register, verify, 2FA, session-expired |
| **T3** | **Onboarding** | Фокус на одну задачу, минимум chrome | Welcome, workspace setup, invite, AI-intro |
| **T4** | **App Shell** | Sidebar + TopNav + main + ⌘K | База всех /dashboard/* (T5–T9 живут внутри) |
| **T5** | **Overview Dashboard** | Shell + KPI-грид + виджеты + feed | Dashboard home, executive, analytics, AI |
| **T6** | **List / Index** | Shell + toolbar + grid/table + pagination | Projects, agents, reports, members, tickets |
| **T7** | **Detail / Overview** | Shell + entity-header + tabs + панели | Project/[id], agent details, report, strategy |
| **T8** | **Focused Workspace** | Shell + full-height одна поверхность | AI chat, prompt editor, create/edit agent |
| **T9** | **Settings** | Shell + settings-subnav + Section/Row | Settings, billing, workspace, organization |
| **T10** | **Utility / Status** | Центр-сообщение + иконка + CTA | Ошибки 4xx/5xx, offline, maintenance, empty |

Реально существующий каркас T4: `dashboard/layout.tsx` = `<ToastProvider>` → `Sidebar` +
`TopNav` + `<main>` + `CommandPalette`. Все T5–T9 наследуют его.

---

## 1. Спецификации архетипов (16 пунктов)

Формат для каждого: *Purpose · Goal · Layout · Hierarchy · IA · Nav · Responsive ·
Components · Empty/Loading/Error · A11y · Flow · Edge · Best · Anti.*

### T1 — Marketing / Content
- **Purpose:** конвертировать посетителя / объяснить продукт. **Goal:** «понять ценность и начать».
- **Layout:** full-bleed секции в `--container-max` (1200), sticky-nav, footer. Hero → доказательства → CTA.
- **Hierarchy:** один H1-тезис, один primary-CTA на экран (Philosophy P1). **IA:** сверху-вниз повествование.
- **Nav:** standalone top-nav (лого, разделы, «Войти»/«Начать»); footer с картой сайта.
- **Responsive:** многоколоночные секции → stack < md; nav → бургер < lg.
- **Components:** Nav, Hero, FeatureGrid, PricingCard, FAQ (Accordion), Footer, Button.
- **Empty/Loading/Error:** контент статичен (SSG); для docs-поиска — Empty/Loading как везде.
- **A11y:** landmark-и (`header/main/footer/nav`), заголовки по уровням, контраст ≥ 4.5.
- **Flow:** посетитель → CTA → `/register`. **Edge:** длинный контент (docs) → sticky-оглавление.
- **Best:** одна «вау»-сцена в Hero (единственное исключение к «интерфейс исчезает»). **Anti:** мульти-акцент, стена текста, тёмные паттерны в pricing.

### T2 — Auth
- **Purpose:** впустить/зарегистрировать безопасно. **Goal:** «войти за 5 сек».
- **Layout:** центрированная карточка ~400px на тёмном фоне с ambient-glow (terminal-эстетика: title-bar, boot-log). OAuth сверху → разделитель → форма.
- **Hierarchy:** заголовок → OAuth → email-форма → вторичные ссылки. **IA:** один экран = один шаг (второй шаг 2FA — по условию).
- **Nav:** «[esc] на главную»; переходы login↔register↔forgot.
- **Responsive:** карточка `max-width` + `padding`; на мобиле — на всю ширину с полями.
- **Components:** OAuthButton, Input, Button(primary), OTP-step, ErrorBanner, StrengthMeter.
- **States:** loading (спиннер в кнопке), error (обобщённая, `aria-live`), 2FA-second-step.
- **A11y:** `<form>`, label-ы, focus на первое поле, ошибки объявляются, OTP `inputmode="numeric"`.
- **Flow:** §1 UX Patterns (login→2FA→dashboard; register→verify). **Edge:** OAuth-only аккаунт; rate-limit.
- **Best:** энумерация-safe ошибки; passkey-кнопка. **Anti:** раздельные ошибки email/пароль.

### T3 — Onboarding
- **Purpose:** довести до первой ценности. **Goal:** «начать работать быстро».
- **Layout:** сфокусированный одиночный шаг, минимум навигации, опц. progress-точки; много воздуха (Philosophy P10).
- **Hierarchy:** заголовок-обещание → одно поле/действие → «Далее»/«Пропустить».
- **Nav:** линейные шаги + «Пропустить» всегда доступен. **IA:** один вопрос на шаг (P16).
- **Responsive:** одна колонка везде; крупные тап-зоны.
- **Components:** StepIndicator, Input, Button, EmptyState (пустой workspace).
- **Best:** value перед туром; пропускаемость. **Anti:** блокирующий 10-шаговый тур, форма из 10 полей на старте (welcome-модалка была удалена именно поэтому).

### T4 — App Shell (база всех app-страниц)
- **Purpose:** единый каркас продукта. **Layout:** `Sidebar` (постоянный ≥ lg, drawer < lg) + `TopNav` (sticky, контекст + ⌘K + аватар) + `<main>` (скролл-контейнер) + глобальный `CommandPalette` + `ToastProvider`.
- **Hierarchy:** sidebar (навигация) < topnav (контекст) < main (задача). **IA:** разделы в sidebar сгруппированы; активный по `--color-primary`.
- **Responsive:** ≥ lg sidebar виден; < lg → бургер/backdrop; safe-area на мобиле.
- **A11y:** `<nav>`/`<main>` landmarks, skip-to-content, фокус-менеджмент drawer, ⌘K доступен с клавиатуры.
- **Best:** page-enter анимация (`--ease-standard`), не блокирующая контент. **Anti:** прятать основную навигацию; layout-shift при навигации.
- *T5–T9 = T4 + своё наполнение `<main>`.*

### T5 — Overview Dashboard
- **Purpose:** снимок состояния → к решению. **Layout:** KPI-ряд (Metric Cards) → виджеты-грид (3→2→1) → Activity Feed.
- **Hierarchy:** summary раньше деталей; число крупно (`tabular-nums`), дельта семантикой.
- **Components:** MetricCard, Chart, ActivityFeed, QuickActions, Card.
- **Empty:** «Данные появятся здесь». **Loading:** skeleton-карточки той же раскладки. **Error:** виджет-уровень (один упал — остальные живут).
- **Best:** дашборд ведёт к действию (P1). **Anti:** «графики ради графиков», мульти-акцент.

### T6 — List / Index
- **Purpose:** найти и выбрать из многих. **Layout:** toolbar (search + filters + sort + primary «Создать») → grid карточек **или** table → pagination/infinite.
- **Hierarchy:** toolbar → контент → пагинация. **IA:** состояние (поиск/фильтр/сорт/страница) в URL.
- **Components:** SearchInput, FilterChips, Sort, Button, Card/Table, Pagination, BulkBar.
- **Empty:** осмысленный EmptyState + CTA «Создать первый». **Loading:** skeleton-строки/карточки. **Error:** «Не удалось загрузить» + retry.
- **Responsive:** table → карточки < md; grid 3→2→1. **Edge:** 0 результатов ≠ 0 записей (разные Empty).
- **Best:** оптимистичное создание/удаление (§4 Patterns). **Anti:** горизонтальный скролл всей страницы.

### T7 — Detail / Overview
- **Purpose:** всё об одной сущности + действия. **Layout:** entity-header (иконка/название/статус/действия) → **tabs** (Обзор/Настройки/…) → панели контента. (Как `projects/[id]`.)
- **Hierarchy:** header → активный таб → контент. **IA:** табы синхронизированы с URL (шарятся, back работает).
- **Components:** EntityHeader, Tabs, Card, Table, Timeline, Button.
- **Empty/Loading/Error:** на уровне таба; 404 если сущность не найдена/не принадлежит юзеру (скоуп по `user_id`).
- **Best:** редирект на этот шаблон после создания (напр., после создания стратегии → `projects/[id]`). **Anti:** терять таб при перезагрузке.

### T8 — Focused Workspace
- **Purpose:** глубокая работа на одной поверхности (чат/редактор). **Layout:** shell + full-height одна область; вторичные панели сворачиваемые.
- **Hierarchy:** рабочая поверхность доминирует; тулбар минимален.
- **Components:** Conversation/StreamingMessage/PromptInput (AI Chat) или Editor + Preview.
- **Loading:** стриминг по токенам / skeleton. **Empty:** «Задайте первый вопрос совету». **Error:** AI-ошибка человеческим языком.
- **Best:** ⌘Enter отправка, «стоп» при генерации, auto-scroll с уважением к ручному. **Anti:** блокировать ввод без «стоп».

### T9 — Settings
- **Purpose:** управлять аккаунтом/рабочим пространством. **Layout:** shell + settings-subnav (табы/боковой список) + панели **Section(title/desc) + Row(label/desc/control)**. Реализовано с URL-tabs.
- **Hierarchy:** subnav → секция → строка. **IA:** каждая вкладка = URL.
- **Components:** SettingsNav, Section, Row, Input/Switch/Select, Button, Toast.
- **States:** сохранение → тост; опасное (удаление аккаунта) → подтверждение паролем.
- **Best:** мгновенный feedback, автосейв где уместно. **Anti:** «Сохранить» без индикации; потеря несохранённого при смене вкладки.

### T10 — Utility / Status
- **Purpose:** объяснить тупик/пустоту и дать выход. **Layout:** центр-иконка → заголовок (1 фраза) → пояснение → 1 CTA.
- **Components:** StatusIllustration, Text, Button. **A11y:** корректный HTTP-статус + осмысленный `<h1>`.
- **Best:** спокойный тон, ясный выход (Philosophy P2). **Anti:** «Error 500» без действия; тупик без навигации.

---

## 2. Каталог страниц → шаблон

Каждая запрошенная страница = архетип + специфика. `✅` = уже есть в продукте.

### Marketing (T1)
Landing ✅ · Features · Solutions · Use Cases · Pricing ✅ · Enterprise · About · Careers ·
Partners · Contact · FAQ · Blog · Article · Docs Home · Docs Article (T1 + sticky-TOC) ·
Changelog · Release Notes · Status (T1 + live-индикаторы). *Legal ✅ → T1.*

### Authentication (T2)
Login ✅ · Register ✅ · Forgot ✅ · Reset ✅ · Verify Email ✅ · Magic Link (планируется) ·
2FA (T2 second-step ✅) · Session Expired (T10-вариант: «сессия истекла» → `/login?callbackUrl`).

### Onboarding (T3)
Welcome · Workspace Setup · Create Organization · Invite Team · Import Data · AI Introduction · Product Tour. *Все T3; org создаётся авто при первом проекте.*

### Dashboard (T5)
Dashboard Home ✅ · Executive ✅ (executives) · Analytics · AI Dashboard · Workspace · Project Dashboard. *Все T5 (Project Dashboard может быть T7).*

### AI (T8/T6/T7)
AI Chat ✅ (T8) · AI Workspace (T8) · Agent Marketplace (T6) · Agent Details (T7) ·
Create/Edit Agent (T8-форма) · Prompt Library (T6) · Prompt Editor (T8) · Prompt History (T6) ·
Conversation History ✅ (history, T6) · AI Insights (T5) · AI Reports ✅ (reports, T6→T7).

### Projects (T6/T7)
Projects List ✅ (T6) · Project Overview ✅ (projects/[id], T7) · Project Details (T7) ·
Project Settings (T7-таб / T9) · Create Project ✅ (new, T3/T8-форма).

### Analytics (T5)
Analytics · Reports ✅ · KPIs · Usage · Performance · Revenue · Funnels · Retention. *Все T5; отдельные отчёты → T7.*

### Billing (T9)
Subscription · Invoices (T6-таблица) · Payment Methods · Upgrade (T1-pricing в модалке/странице) ·
Usage · API Usage. *Все внутри T9; upgrade триггерится лимитом 402.*

### Settings (T9)
General · Profile ✅ · Security ✅ · Notifications ✅ · Appearance ✅ · Language ✅ · Privacy ·
API Keys · Integrations · Billing · Workspace · Organization. *Все — вкладки T9.*

### Team (T6/T4)
Team (T6) · Members (T6) · Roles (T9) · Permissions (T9) · Invite Member (T3/Dialog) ·
Organization Switcher (компонент в T4-shell, не страница).

### Support (T1/T6)
Help Center (T1) · Support ✅ (T8-форма/T6) · Tickets (T6→T7) · Community (T1) · System Status (T1).

### Admin (T4-variant/T6) — ✅ /admin существует
Admin Dashboard (T5) · Users (T6) · Organizations (T6) · Moderation (T6) · Audit Logs (T6-таблица) ·
System Health (T5) · Feature Flags (T9). *Отдельный admin-shell = T4 с admin-навигацией; строгие права (owner/admin).*

### Legal (T1) — ✅ /legal
Privacy Policy · Terms · Cookie Policy · Refund Policy · AI Disclaimer. *T1 + оглавление; читаемая ширина ~65 симв.*

### Error Pages (T10)
401 · 403 · 404 · 429 · 500 · 503 · Offline · Maintenance. *Все T10; корректный HTTP-статус; спокойный тон + выход.*

### Empty States (внутри T5/T6/T8)
No Projects · No Agents · No Messages · No Reports · No Team · No Data · No Search Results.
*Не отдельные страницы — состояния внутри List/Dashboard/Workspace (UX Patterns §11).*

---

## 3. Responsive (все шаблоны)

| Слой | T1 Marketing | T4–T9 App | T2 Auth |
|---|---|---|---|
| **Ultra-wide ≥1536** | контент 1200, растут поля | main центрируется, поля растут | карточка центр |
| **Desktop ≥1280** | многоколоночные секции | sidebar + многоколоночный контент | — |
| **Laptop 1024–1279** | как desktop | **sidebar появляется**; grid 12 | — |
| **Tablet 768–1023** | 2 колонки | sidebar → бургер; grid 8; table→карточки | карточка |
| **Mobile <768** | stack; nav→бургер | боттом-таб/бургер; grid 4; модалка→BottomSheet | карточка на всю ширину |

Правило: контент не растёт бесконечно (`--container-max` 1200); после `xl` растут поля (Foundations §1–2).

---

## 4. Mobile (§16)

Каждый шаблон имеет мобильную версию по правилам Foundations §5 и UX Patterns §16:
sidebar→бургер/боттом-бар, table→карточки, modal→BottomSheet, форма→одна колонка,
тап-зоны ≥44px, `--safe-*`, действия в нижней достижимой зоне. Ничего не «ломается» —
шаблон перестраивается, IA сохраняется.

---

## 5. Figma structure (§18)

```
Vertlix — Product (Figma project)
├── 📄 00 Cover / Index
├── 📄 01 Templates            ← T1…T10 как master-фреймы (Auto Layout)
│     ├── Section: Marketing (T1)
│     ├── Section: Auth (T2)
│     ├── Section: App Shell (T4)  ← Sidebar+TopNav как компоненты-инстансы
│     └── … T5–T10
├── 📄 02 Pages (Desktop)      ← конкретные экраны = инстансы шаблонов
├── 📄 03 Pages (Mobile)
├── 📄 04 Flows / Prototypes   ← кликабельные (login→2FA→dashboard; create→synced)
└── 📄 05 Handoff
```
- **Auto Layout:** каждый шаблон — вертикальный AL, слоты fill/hug (Foundations §4).
- **Variables:** биндинг к Semantic-переменным ([`figma-variables.json`](../design/figma-variables.json)); режимы Dark/Light.
- **Components/Variants:** shell-части (Sidebar, TopNav) — компоненты; страницы — их инстансы.
- **Prototypes:** флоу связывают экраны-состояния (loading/empty/error/success).
- **Правило:** новая страница = дублируешь шаблон-инстанс, меняешь наполнение слотов. Никаких новых каркасов.

---

## 6. Development (§19)

- **Next.js App Router:** T4 = `dashboard/layout.tsx` (реальный shell); T1/T2/T3/T10 — отдельные layout/route без shell. Вложенные layouts переиспользуют каркас.
- **Реализация шаблона:** страница-роут наполняет слоты компонентами из Component Library; ноль дублирования каркаса.
- **Tailwind v4:** утилиты из `@theme` (`bg-surface`, `max-w-content`, `rounded-card`, `shadow-e2`); сетка `grid-cols-4 md:grid-cols-8 lg:grid-cols-12`.
- **shadcn/ui:** проект на кастомном ui-слое (не shadcn), токены совместимы — при переходе шаблоны не меняются, только внутренности компонентов.
- **Обязательно на каждой странице:** все состояния (loading/empty/error/success), landmark-и, `<title>`/метаданные, page-enter без CLS.

```tsx
// Пример: List-страница (T6) — только сборка, без нового каркаса
export default function ProjectsPage() {
  return (
    <PageShell>                        {/* T4 предоставляет layout */}
      <Toolbar onCreate={...} />        {/* search + filter + primary CTA */}
      {loading ? <SkeletonGrid/> : items.length ? <CardGrid items={items}/> : <EmptyState.NoProjects/>}
    </PageShell>
  );
}
```

---

## 7. Quality Review (§20 — аудит)

| Критерий | Результат |
|---|---|
| **Логичность структуры** | ✅ 100+ страниц → 10 архетипов; каждая страница однозначно маппится |
| **Отсутствие повторений** | ✅ Каркас T4 один на все app-страницы; List/Detail/Settings — переиспользуемые скелеты |
| **Масштабируемость** | ✅ Новая страница = выбрать архетип + наполнить слоты (минуты, не часы) |
| **Единый UX** | ✅ Все шаблоны наследуют Foundations/Patterns; одинаковые состояния/навигация/сетка |
| **Соответствие SaaS** | ✅ Shell+sidebar (Linear/Vercel), toolbar-list (Stripe/Notion), settings-subnav (все), утилити-статусы |

**Найденные и устранённые слабые места при аудите:**
1. Риск «каждая страница — свой каркас» → введены 10 архетипов, все страницы маппятся на них.
2. Дубли навигации → каркас T4 единый (реальный `dashboard/layout.tsx`), T5–T9 = наполнение `<main>`.
3. Смешение «страница» и «состояние» → Empty States вынесены как состояния внутри T5/T6/T8, а не отдельные страницы (устранён ложный дубль с §15 запроса).
4. Честность о непостроенном → `✅` только там, где страница реально существует; остальное — шаблон-спека для будущих экранов (magic-link помечен «планируется»).
5. Session Expired ошибочно как отдельный тип → это T10-вариант + redirect, а не новый каркас.

**Итог:** любой новый экран Vertlix AI проектируется за минуты — выбери архетип T1–T10,
собери слоты из Component Library по UX Patterns на токенах. Отклонение от архетипов требует
явного обоснования и обновления этого документа.

---

*Companion: [Philosophy](./DESIGN-PHILOSOPHY.md) · [Tokens](./DESIGN-TOKENS.md) ·
[Foundations](./FOUNDATIONS.md) · [Component Library](./COMPONENT-LIBRARY.md) ·
[UX Patterns](./UX-PATTERNS.md).*
