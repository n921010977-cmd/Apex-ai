# Vertlix AI — Component Library

> **Официальный стандарт библиотеки компонентов.** Не страницы, не лендинг, не
> дашборд — только контракт и каталог компонентов, из которых собираются экраны.
>
> Место в системе: [Philosophy](./DESIGN-PHILOSOPHY.md) → [Tokens](./DESIGN-TOKENS.md) →
> [Foundations](./FOUNDATIONS.md) → **Components** → экраны. Каждый компонент
> строится **только** из токенов и правил Foundations.

**Версия 1.0 · 2026-07-22**

---

## 0. Как пользоваться

- **Раздел 2** — атомарная архитектура (5 уровней) и структура папок.
- **Раздел 3** — обязательный **Component Contract**: каждый компонент документируется по одному шаблону из 24 пунктов.
- **Раздел 4** — эталонные (canonical) спецификации ключевых компонентов. Это шаблон для всех остальных.
- **Раздел 5** — полный каталог по уровням (variants / props / states / tokens).
- **Раздел 8** — governance. **Раздел 9** — аудит и найденные слабые места.

---

## 1. Принципы

- **Atomic Design** — 5 уровней: Primitives → Basic → Composite → Patterns → Blocks. Нижний не знает о верхнем.
- **Component-Driven** — компонент разрабатывается изолированно (в отрыве от страниц), с полным набором состояний.
- **Design Tokens** — ноль магических значений; всё из [`tokens.css`](../src/styles/tokens.css).
- **Один источник, много вариантов** — не «почти такие же» копии, а один компонент с `variant`/`size`.
- **Accessibility-first** — WCAG AA в контракте каждого компонента, а не «потом».
- **Composability** — компоненты собираются, а не форкаются (Card = Surface + Stack + Text).

---

## 2. Архитектура (5 уровней)

| Level | Название | Определение | Примеры |
|---|---|---|---|
| **L1** | **Primitives** | Неделимые атомы. Ноль бизнес-логики. | Text, Icon, Surface, Stack, Badge, Avatar, Spinner, Skeleton, Divider, FocusRing |
| **L2** | **Basic** | Один интерактивный элемент. | Button, Input, Checkbox, Switch, Select, Tooltip, Tabs, Toast |
| **L3** | **Composite** | Несколько basic + логика. | Card, Modal, Dropdown, Combobox, Table, Pagination, DatePicker |
| **L4** | **Patterns** | Устойчивые связки под задачу. | LoginForm, EmptyState, ConfirmDialog, CommandPalette, Filters |
| **L5** | **Blocks** | Крупные предметные блоки. | AIChat, AgentCard, PricingCard, DataGrid, ActivityFeed, MemberList |

**Правило зависимостей:** L(n) импортирует только L(<n) + токены. L1 не импортирует ничего кроме токенов. Нарушение = ошибка ревью.

**Структура папок (целевая):**
```
src/components/
├── primitives/   L1  (Text, Icon, Surface, Stack, Grid, Spacer, Badge, Avatar,
│                      Spinner, Skeleton, Divider, Logo, Container, Overlay, FocusRing)
├── ui/           L2  (Button, Input, Checkbox, Radio, Switch, Select, Tabs,
│                      Tooltip, Toast, Segmented, Progress)
├── composite/    L3  (Card, Modal, Drawer, Popover, Dropdown, Combobox, Table,
│                      Pagination, ContextMenu, BottomSheet)
├── patterns/     L4  (LoginForm, RegisterForm, EmptyState, ErrorState, LoadingState,
│                      ConfirmDialog, CommandPalette, InviteDialog)
└── blocks/       L5  (ai/*, team/*, settings/*, data/*, billing/*)
```
> Текущее состояние: всё в `ui/` (6 шт.), `dashboard/`, `landing/`. Миграция к
> этой структуре — в разделе 9 (governance-план, не ломающий существующее).

**Нейминг:** PascalCase файл = компонент; `ComponentName.tsx`, суб-части `Card.Header`.
Props: `variant`, `size`, `state` (управляемые визуалом), булевы `isLoading`/`hasIcon`.

---

## 3. Component Contract (обязателен для каждого компонента)

Каждый компонент — primitive или block — документируется и строится по этим 24 пунктам:

1. **Purpose** — одна фраза: зачем.
2. **Anatomy** — из каких частей состоит.
3. **Structure** — DOM/дерево.
4. **Layout** — Auto Layout направление, fill/hug.
5. **Variants** — `variant`-набор.
6. **Sizes** — `size`-набор (h из шкалы).
7. **Properties** — полный prop-API (TS-интерфейс).
8. **States** — default/hover/pressed/focused/disabled/loading/success/error.
9. **Behaviors** — что делает по взаимодействию.
10. **Accessibility** — роль, контраст, тап-зона.
11. **Keyboard** — какие клавиши.
12. **ARIA** — атрибуты.
13. **Motion** — токены duration/easing.
14. **Responsive** — как меняется по брейкпоинтам.
15. **Tokens** — какие токены использует (цвет/радиус/тень/спейс).
16. **Figma Variables** — к чему биндится.
17. **Auto Layout** — настройки.
18. **Constraints** — привязки.
19. **Component Properties** — Figma props.
20. **Boolean Properties** — Figma booleans.
21. **Instance Swap** — сменные инстансы.
22. **Best Practices** — как правильно.
23. **Anti-patterns** — как нельзя.
24. **Do / Don't** — краткий чек.

Раздел 4 показывает контракт полностью на эталонах; раздел 5 даёт сжатую форму (пп. 5–8, 15) для всего каталога.

---

## 4. Canonical specs (эталоны — шаблон для всех)

### 4.1 Button (L2)

- **Purpose:** запустить действие. Самый частый интерактивный элемент.
- **Anatomy:** `[иконка?] лейбл [иконка?]` в контейнере; опц. спиннер поверх при loading.
- **Variants:** `primary · secondary · ghost · outline · danger · success · warning · link`.
- **Sizes:** `sm h-9 px-3` · `md h-11 px-5` (default) · `lg h-12 px-6` · `xl h-14 px-8`. Icon-only = квадрат той же высоты. **Мин. тап-зона 44px** (md+).
- **Properties:**
  ```ts
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "success" | "warning" | "link";
    size?: "sm" | "md" | "lg" | "xl";
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    fullWidth?: boolean;
  }
  ```
- **States:** default → hover (осветление/подъём −1px) → pressed (`scale .98`) → focused (`--shadow-focus`) → disabled (`opacity .4`, no-events) → loading (спиннер, `aria-busy`, клик заблокирован).
- **A11y / Keyboard / ARIA:** нативный `<button>`; `Enter`/`Space` активируют; focus-visible кольцо; icon-only обязан иметь `aria-label`; loading → `aria-busy="true"`.
- **Motion:** `--motion-button` (150мс `--ease-standard`); pressed-scale мгновенно.
- **Tokens:** bg `--btn-primary-bg`; fg `--btn-primary-fg`; radius `--radius-btn` (12); тень hover `--elevation-2`; focus `--shadow-focus`.
- **Figma:** Variants по `variant`×`size`×`state`; Boolean `icon`, `loading`, `fullWidth`; Instance-swap иконки; Auto Layout hug, gap `--space-2`.
- **Do:** один primary в зоне видимости; лейбл = результат. **Don't:** >1 primary; иконка без aria-label; произвольные цвета.

**React (Tailwind v4, token-based — целевой вид):**
```tsx
<button
  className={cn(
    "inline-flex items-center justify-center gap-2 font-bold rounded-btn select-none",
    "transition ease-standard duration-fast focus-visible:shadow-focus disabled:opacity-40 disabled:pointer-events-none",
    sizes[size],
    variants[variant], // primary: "text-white bg-[image:var(--btn-primary-bg)] shadow-e1 hover:shadow-e2 active:scale-[.98]"
  )}
  aria-busy={loading || undefined}
/>
```

### 4.2 Input (L2)

- **Purpose:** ввод одной строки. **Anatomy:** `[label] [leading-icon?] field [trailing?] [hint/error]`.
- **Variants:** `text · email · password · search · number · currency · phone · otp`; textarea — отдельный компонент.
- **Sizes:** `md h-11` (default), `sm h-9`, `lg h-12`. Full-width по умолчанию (fill).
- **Properties:** `label, value, onChange, placeholder, error?, hint?, leadingIcon?, trailingIcon?, disabled, size`.
- **States:** default → hover (граница светлее) → focus (`--color-input-focus` + `--shadow-focus`) → filled → error (`--color-input-error` + сообщение) → disabled.
- **A11y:** `<label htmlFor>`; ошибка через `aria-describedby` + `aria-invalid`; placeholder ≠ label.
- **Tokens:** bg `--color-input`; border `--color-input-border`/`-focus`/`-error`; radius `--radius-btn`; text `--color-text-primary`.
- **Motion:** border/shadow 150мс. **Behavior:** валидация после blur, не во время набора (Foundations §16).
- **Don't:** плейсхолдер вместо лейбла; ошибка только цветом (нужен текст+иконка).

### 4.3 Card (L3)

- **Purpose:** контейнер связанного контента. **Anatomy:** `Card > [Header] [Content] [Footer]`.
- **Variants:** `default (glass) · bordered · elevated · interactive (hover-подъём)`.
- **Tokens:** bg `--color-card`; border `--color-border` (hover `--border-strong`); radius `--radius-card` (16); тень `--elevation-1` (hover `-2`); padding `--space-4…6`.
- **States:** rest / hover (подъём 2px, если interactive) / focused (если кликабельна — как ссылка/кнопка).
- **Responsive:** grid 3→2→1; внутри — stack на мобиле.
- **Figma:** slots через Instance-swap (Header/Content/Footer), Boolean `hasHeader/hasFooter`.
- **Don't:** плоская карточка без границы/тени; двойные тени на вложенных.

### 4.4 Modal / Dialog (L3)

- **Purpose:** блокирующее взаимодействие/подтверждение. **Anatomy:** overlay + panel(`[header][body][footer]`) + close.
- **Sizes:** `sm 400 · md 560 · lg 720 · full` (мобила → BottomSheet).
- **Tokens:** panel `--color-modal`; overlay `--color-overlay`; radius `--radius-panel` (22); тень `--elevation-5`; `z-modal`.
- **A11y (критично):** `role="dialog" aria-modal`, focus-trap, возврат фокуса при закрытии, `Esc` закрывает, фокус на первый элемент/заголовок при открытии, `aria-labelledby`.
- **Motion:** fade overlay + scale-up panel `.98→1`, `--motion-modal` (250мс); reduced-motion → fade only.
- **Responsive:** ≥ md — центр-модалка; < md — BottomSheet снизу.
- **Don't:** модалка без focus-trap; без Esc; вложенные модалки.

### 4.5 Toast (L2/L4)

- **Purpose:** неблокирующее уведомление о результате. **Variants:** `success · error · info · warning`.
- **Anatomy:** `[иконка] сообщение [действие?] [close]`. **Tokens:** `--color-{kind}-bg/-border`, `--elevation-3`, `z-toast`.
- **Behavior:** авто-скрытие 4с (error — дольше/до закрытия); стек снизу-справа; пауза на hover.
- **A11y:** `aria-live="polite"` (error — `assertive`); закрытие с клавиатуры.
- **Motion:** вход `--motion-toast` (spring), выход fade. **Don't:** тост для критичного подтверждения (нужен Dialog).

### 4.6 Primitives (L1) — сжато

| Primitive | Purpose | Ключевые props | Tokens |
|---|---|---|---|
| **Text** | Абзац/инлайн текст | `size, weight, tone, as` | `--text-*`, `--color-text-*` |
| **Heading** | Заголовки h1–h6 | `level, size` | вес 800, `--ls-tight`, balance |
| **Icon** | Обёртка lucide | `name, size, tone` | `--icon-*`, `currentColor` |
| **Badge** | Статус-метка | `variant, size` | `--color-{kind}-bg/-border` |
| **Avatar** | Юзер/агент | `src, size, status, shape, fallback` | `--radius-full/chip` |
| **Spinner** | Индетерм. загрузка | `size, tone` | `--color-primary`, `--ease-*` |
| **Skeleton** | Плейсхолдер | `width, height, radius` | `--color-skeleton` |
| **Surface** | Базовая поверхность | `elevation, padding, radius` | `--color-surface`, `--elevation-*` |
| **Stack** | Flex-раскладка | `direction, gap, align` | `--space-*` |
| **Grid** | Колоночная сетка | `cols, gap` | grid-токены |
| **Container** | Центрирующая обёртка | `max` | `--container-max` |
| **Divider** | Разделитель | `orientation` | `--color-divider` |
| **FocusRing** | Единое кольцо фокуса | — | `--shadow-focus` |
| **Overlay** | Скрим | `blur?` | `--color-overlay`, `--blur-e-*` |

### 4.7 AI-компоненты (L5) — эталон домена

- **StreamingMessage:** рендер токен-за-токеном (Philosophy P3/P6), курсор-пульс во время, `aria-live="polite"`; markdown после завершения. Reasoning — сворачиваемый блок вторичным текстом.
- **ThinkingIndicator:** три пульсирующие точки, `--ease-in-out`, «директор думает…»; reduced-motion → статичный текст.
- **AgentCard:** аватар-цвет агента (идентичность, Philosophy P15) + имя + роль + статус (`idle/thinking/done`); каркас единый для всех 20.
- **ReasoningBlock / Citation / AISources:** обоснование и источники — вторичны, доступны, но не навязчивы; никогда не выдавать сгенерированное за проверенный факт.
- **CodeBlock:** `--font-mono`, `--color-surface`, `--radius-lg`, горизонтальный скролл внутри, кнопка copy.
- **Tokens:** акцент AI = `--color-primary` (indigo); статусы = семантика.

---

## 5. Полный каталог (по уровням)

Формат: **Component — variants — states — ключевые tokens.** (Контракт целиком — по шаблону §3.)

### Buttons (L2)
Primary/Secondary/Ghost/Outline/Danger/Success/Warning/Link/IconButton/SplitButton/LoadingButton/FloatingButton(FAB)/MenuButton/ButtonGroup.
Состояния для всех: default·hover·pressed·focused·disabled·loading·success·error. Tokens: `--btn-*`, `--radius-btn`, `--elevation-1/2`, `--shadow-focus`.

### Inputs (L2/L3)
TextInput·Password(toggle)·Email·Search·Phone·Number·Currency·OTP·Textarea(auto-grow)·Autocomplete·Combobox·TagInput·RichText·Markdown·CodeEditor·**AIPromptInput**(multiline, submit on ⌘Enter, attach, streaming-aware). Tokens: `--color-input*`, `--radius-btn`.

### Selection (L2/L3)
Checkbox·Radio·Switch·SegmentedControl·Select·Dropdown·CommandPalette(⌘K)·ContextMenu. Состояния: unchecked/checked/indeterminate/focused/disabled. Tokens: `--color-primary` (вкл.), `--color-border`.

### Navigation (L2–L4)
Navbar·Sidebar(collapsible, ≥lg)·Dock·Breadcrumb·Tabs(underline/pill)·Pagination·Menu·MegaMenu·CommandSearch. Responsive: сайдбар→бургер < lg. Tokens: `--color-navbar/sidebar`, `z-sticky/fixed`.

### Feedback (L2/L4)
Toast·Snackbar·Alert·Banner·Progress(linear/circular)·Loader·Skeleton·Notification·Confirmation. Tokens: `--color-{kind}-bg/-border`, `aria-live`.

### Overlays (L3)
Modal·Dialog·Drawer·Popover·Tooltip·BottomSheet·FloatingPanel. Все: focus-trap где блокирующие, `Esc`, `z-modal/popover/tooltip`, `--elevation-3/5`.

### Data Display (L3–L5)
Card·StatisticCard·DashboardCard·MetricCard·AICard·TeamCard·PricingCard·Table·DataGrid(sort/filter/virtualize)·Timeline·ActivityFeed·Charts·Calendar·Heatmap. Таблицы: `tabular-nums`, sticky-header, mobile→карточки. Charts: семантика отдельно от акцента (см. dataviz-скилл).

### Forms (L4)
Login·Register·ForgotPassword·Billing·Profile·Workspace·Team·AIPromptForm. Все: label над полем, inline-ошибки после blur, один primary submit, все 4 состояния.

### AI (L5)
AIChat·StreamingMessage·ThinkingIndicator·AgentCard·AgentStatus·Conversation·PromptEditor·ResponseViewer·MarkdownViewer·CodeBlock·Citation·ReasoningBlock·AISources (см. §4.7).

### Team (L5)
OrganizationSwitcher·WorkspaceSwitcher·TeamCard·MemberList·RoleBadge·Permissions·InviteDialog. RoleBadge = Badge-variant по роли (owner/admin/…).

### Settings (L4/L5)
PreferencePanel·ThemeSelector·LanguageSelector·NotificationSettings·SecuritySettings·BillingSettings·APIKeys. Паттерн: Section(title/desc) + Row(label/desc/control) — как в текущих настройках.

### Empty States (L4)
NoData·NoSearch·NoAIResults·Offline·NoInternet·NoNotifications·NoProjects. Структура (Foundations §14): иконка → заголовок → пояснение → 1 CTA.

### Error States (L4)
404·403·401·500·APIError·AIError·ValidationError. Тон спокойный, причина + путь; сырой текст провайдера скрыт (Foundations §16).

### Loading (L1/L4)
Skeleton·Streaming·Progress·InfiniteLoading·LazyLoading. Skeleton повторяет будущую раскладку (нет CLS).

---

## 6. Figma readiness

Каждый компонент в Figma:
- **Variants** — матрица `variant × size × state` (без копий).
- **Component Properties** — `variant`, `size` (variant-props); text-prop `label`.
- **Boolean Properties** — `hasIcon`, `loading`, `hasHeader`, `fullWidth`.
- **Instance Swap** — иконки, слоты (Header/Content/Footer).
- **Variables** — все цвета/радиусы/спейсы биндятся к Semantic-переменным ([`figma-variables.json`](../design/figma-variables.json)), не к Primitives.
- **Styles** — Text Styles (Typography-уровни), Effect Styles (Elevation 1–5).
- **Interactive Components** — hover/pressed/focus прототипируются Smart Animate + `--ease-standard`.
- **Modes** — Dark (дефолт); Light = переопределение Semantic.

---

## 7. Ready for development

- **Стек:** React + Next.js (App Router), **Tailwind v4** (`@theme` токены уже заведены), кастомный `components/ui/` (`variant`/`size`/`cn`, `forwardRef`).
- **shadcn/ui:** проект **пока не использует** shadcn (нет Radix/cva), но токены **совместимы** — semantic-переменные мапятся на shadcn `--background/--foreground/--primary` один-в-один. Если команда внедрит shadcn, интеграция = алиасы, не переписывание.
- **Канонический паттерн компонента:**
  ```tsx
  "use client";
  import { forwardRef } from "react";
  import { cn } from "@/lib/utils";
  // 1) variant/size maps на token-утилиты  2) forwardRef  3) все состояния
  // 4) a11y (aria-*, focus-visible)  5) ноль хардкод-цветов — только токены
  ```
- **Обязательно на каждый компонент:** все состояния (loading/empty/error/success где применимо), `focus-visible`, `prefers-reduced-motion`, tests-стори в изоляции.

---

## 8. Governance (масштаб на годы)

1. **Новый компонент?** Сначала проверь каталог §5 — нет ли уже такого/близкого. Расширяй вариантом, не плоди копию.
2. **Уровень.** Определи L1–L5; запрещено импортировать вверх.
3. **Из токенов.** Ноль магических чисел/цветов; новое значение → сначала токен (см. Tokens §16).
4. **Контракт §3** заполнен целиком до мержа; все состояния реализованы.
5. **Deprecate, не delete** — алиас на цикл релиза с пометкой.
6. **Один PR** = один компонент/вариант; не «добавил и разбросал по 50 экранам».
7. **Storybook/изоляция** — компонент живёт и ревьюится вне страниц (Component-Driven).

---

## 9. Аудит библиотеки

### 🔴 Критично — компоненты не на токенах
**Найдено:** 0 из 6 текущих `ui/`-компонентов используют дизайн-токены; **4 из 6** хардкодят
`violet-*/blue-*/purple-*`. `Button` — primary = градиент `violet-600→blue-600`, focus-ring
`purple-500`, тогда как токены задают primary = **indigo `#6366f1`**. Библиотека старше
токен-системы и с ней рассинхронизирована.
**Влияние:** ребрендинг/тема не применятся к компонентам; визуальный разнобой (indigo в
токенах vs violet/blue в кнопках).
**⚠️ Это бренд-решение, не техническое** — я НЕ менял живой вид кнопок молча. Нужно ваше
решение: **(A)** привести компоненты к indigo-токенам (primary станет `#6366f1`), или
**(B)** сделать бренд-primary violet→blue и обновить токены под него. После выбора — миграция
одним проходом (варианты → `--btn-*`).

### 🟡 Дедупликация / конфликты
- `Badge` имеет `variant="purple"` — семантически пусто (не статус). → заменить на `variant="brand"` или убрать.
- Дублирование стилей кнопок между `ui/Button` и inline-кнопками в страницах (login/settings рисуют кнопки инлайн). → все кнопки через `<Button>`.
- Нет единого `Input`/`Modal`/`Select` в `ui/` — они инлайнятся в страницах (расползание). → вынести в L2/L3.

### 🟡 Atomic-структура
- Всё лежит в плоском `ui/` — нет уровней L1–L5. → поэтапная миграция к структуре §2 (без ломки: новые компоненты сразу по уровням, старые переносятся по касанию).

### ✅ Что хорошо
- Существующие компоненты уже используют `forwardRef` + `variant`/`size` + `cn` — правильный контрактный паттерн (shadcn-совместимый).
- Toast — через Context/Provider (правильно). Skeleton, Progress — есть базовые состояния.

### Оценка масштабируемости
| Критерий | Статус |
|---|---|
| Дедупликация | ⚠️ есть inline-дубли кнопок/инпутов → каталог §5 закрывает |
| Конфликты | ⚠️ токены vs хардкод (крит. находка) → требует бренд-решения |
| Масштабируемость | ✅ контракт + уровни + токены готовы к сотням компонентов |
| Atomic Design | ⚠️ структура плоская → governance-план миграции задан |
| Мировые практики | ✅ контракт из 24 пунктов, Figma-mapping, a11y-first, token-driven |

**Итог:** спецификация и каталог готовы к масштабу на годы. Единственный блокер к
«идеальной» согласованности — рассинхрон компонентов с токенами (находка §9-крит), и он
требует одного бренд-решения (A/B), после которого я проведу миграцию.

---

*Companion: [Philosophy](./DESIGN-PHILOSOPHY.md) · [Tokens](./DESIGN-TOKENS.md) ·
[Foundations](./FOUNDATIONS.md) · [Figma Variables](../design/figma-variables.json).*
