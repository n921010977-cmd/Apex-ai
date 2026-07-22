# Vertlix AI — Design System Operations Guide

> **Официальный операционный стандарт дизайн-системы.** Не визуальный дизайн и не
> компоненты — а то, **как команда создаёт, ревьюит, версионирует, передаёт и
> масштабирует** систему на десятки дизайнеров, сотни разработчиков и тысячи
> компонентов.
>
> Завершает серию: [Philosophy](./DESIGN-PHILOSOPHY.md) · [Tokens](./DESIGN-TOKENS.md) ·
> [Foundations](./FOUNDATIONS.md) · [Component Library](./COMPONENT-LIBRARY.md) ·
> [UX Patterns](./UX-PATTERNS.md) · [Page Templates](./PAGE-TEMPLATES.md) · **Design Ops**.

**Версия 1.0 · 2026-07-22**

> **Статус реальности:** код-сторона источника правды уже существует —
> [`src/styles/tokens.css`](../src/styles/tokens.css) (@theme, Tailwind v4) и
> [`design/figma-variables.json`](../design/figma-variables.json) (DTCG). Сам Figma-воркспейс
> — внешний инструмент; этот документ — стандарт его развёртывания и ведения. Сейчас продукт
> ведёт малая команда; ниже — целевая enterprise-модель, которую внедряют по мере роста
> (см. Roadmap §15). Не изображай процессы «уже работающими» — они вводятся по фазам.

---

## 1. Figma Workspace Architecture

```
Workspace: Vertlix
└── Team: Product Design            ← дизайнеры продукта
    ├── Project: 🟦 Design System   ← библиотеки (published) — только владельцы правят
    ├── Project: 🟩 Product         ← экраны продукта (потребляют библиотеку)
    ├── Project: 🟨 Explorations    ← research, playground, черновики
    └── Project: ⬛ Archive         ← замороженное
└── Team: Brand / Marketing         ← лендинг, презентации (отдельно от продукта)
```

**Правила размещения:**
- **Компоненты** → только в `Design System` (published-библиотеки). Нигде больше не создаются мастер-компоненты.
- **Страницы/экраны** → `Product` (инстансы библиотечных компонентов).
- **Исследования** (UX research, интервью, аудиты) → `Explorations`.
- **Прототипы** → рядом с экранами в `Product` (страница `Flows`), ссылаются на библиотеку.
- **Документация** → внутренний DS-сайт (§11) + `docs/` в репозитории (этот набор файлов).

**Почему так:** библиотека изолирована от продукта → её нельзя случайно сломать из экрана;
brand отделён от product → разные ритмы релизов.

---

## 2. File Structure (улучшенная)

Внутри `Design System` — отдельные **files** (не страницы), чтобы публиковались независимо и грузились быстро:

```
🟦 Design System (project)
├── 00 · README & Governance     (как пользоваться, контакты владельцев, ссылки на docs/)
├── 01 · Foundations             (Colors, Typography, Spacing, Grid, Radius, Elevation, Motion, Icons, Variables)
├── 02 · Primitives              (L1: Text, Icon, Surface, Avatar, Badge, Spinner, Skeleton…)
├── 03 · Components              (L2–L3: Buttons, Inputs, Selection, Navigation, Feedback, Overlays, Data)
├── 04 · Patterns               (L4: Forms, Tables, AI Flows, Empty/Error/Loading, Command Palette)
├── 05 · Templates              (T1–T10 из Page Templates: Marketing, Auth, Shell, List, Detail, Settings…)
├── 90 · Playground             (эксперименты — НЕ публикуется как библиотека)
└── 99 · Archive                (deprecated, заморожено)
```

**Улучшения против базовой схемы:** (a) Foundations/Primitives/Components — **разные файлы**,
не страницы (независимая публикация, быстрая загрузка при тысячах компонентов); (b) добавлен
слой **Primitives** (Atomic L1) между Foundations и Components; (c) Product Screens вынесены в
**отдельный project**, а не в файл библиотеки (иначе библиотека тяжелеет и путается с продуктом).

Внутри каждого файла — страницы: `Cover` · `🟢 Ready` (published) · `🟡 WIP` · `📐 Specs/Docs` · `🗄 Deprecated`.

---

## 3. Naming System

**Формат:** `Category / Subtype / Variant` — слэши создают вложенность в панели ассетов.

| Сущность | Правило | Пример |
|---|---|---|
| **Component** | `Category / Name` | `Button`, `Input`, `Card` |
| **Variant** | свойства через запятую | `Button` → `variant=Primary, size=Large, state=Hover` |
| **Nested/slot** | `Parent / Part` | `Card / Header`, `Table / Row` |
| **Variable** | `collection/group/role-scale` | `color/semantic/primary-500`, `space/4` |
| **Style** | `Group / Name` | `Text / Heading LG`, `Elevation / 3` |
| **Frame (экран)** | `NN · Name — Breakpoint` | `01 · Login — Desktop` |
| **Layer** | по смыслу, не «Frame 42» | `avatar`, `title`, `cta-row` |

**Правила:** PascalCase для компонентов, kebab для переменных/слоёв; `🟢/🟡/🗄` эмодзи-префиксы
статуса на страницах; порядковые `NN ·` для сортировки. **Запрещено:** `Frame 12`, `Group 3`,
`Button copy 2`, `Rectangle` как имя.

---

## 4. Variables System

Коллекции (совпадают с [`figma-variables.json`](../design/figma-variables.json), DTCG):

| Collection | Содержит | Скоуп |
|---|---|---|
| **Primitives** | Ramps 50–950 (8 палитр) | private (не биндить в компоненты) |
| **Semantic** | surface/text/border/feedback/button | **сюда биндятся компоненты** |
| **Typography** | family/weight/size/lh/tracking | все |
| **Spacing / Radius / Elevation / Motion** | шкалы | все |
| **Layout** | container/breakpoint/grid/safe | все |
| **Icon / State** | размеры/оверлеи | все |

**Modes** (на коллекции **Semantic** — Primitives не меняются между темами):
- **Dark** (дефолт) · **Light** · **High Contrast** (усиленные границы/контраст для a11y).
- **Переключение темы:** меняется mode коллекции Semantic на фрейме/странице; компоненты
  следуют автоматически (они биндятся к Semantic, не к hex).
- **Обновление значения:** правишь Primitive (напр. `primary-500`) → все Semantic-ссылки и
  компоненты обновляются разом.
- **Новый токен:** сначала добавь **Primitive**, затем **Semantic**-ссылку на него, затем
  используй; синхронизируй с `tokens.css` и `figma-variables.json` в одном PR (§16).

> Соответствие коду: Figma Semantic ↔ `--color-*` в `tokens.css`. Light-mode в коде добавляется
> переопределением Semantic-слоя (Primitives не трогаются) — та же модель, что в Figma.

---

## 5. Component Library Management

- **Создание:** заполнен Component Contract (24 пункта, [Component Library §3](./COMPONENT-LIBRARY.md)); все варианты/состояния; биндинг к Semantic-переменным; a11y; → страница `🟡 WIP` → ревью → `🟢 Ready` → publish.
- **Изменение:** непубличные правки в **branch** (§6); breaking-изменение API компонента → новая версия + миграция, не тихая замена.
- **Удаление:** запрещено сразу. → пометить **Deprecated** (описание + замена + дата), оставить ≥ 1 релиз-цикл, затем в `99 · Archive`.
- **Deprecated:** префикс `🗄`, описание «use X instead»; линт находит инстансы; авто-swap где возможно.
- **Миграция старых:** «по касанию» (трогаешь экран — обновляешь инстансы) + плановые кампании через Figma «swap instance» / find-and-replace.

**Правило анти-дублирования:** новый компонент — только после проверки, что нет близкого;
расширяй вариантом, не плоди копию (Component Library §8).

---

## 6. Version Control (Figma Branches)

**Поток:** `Draft → Review → Testing → Approved → Published`.

| Стадия | Где | Кто |
|---|---|---|
| **Draft** | branch от main-файла | автор |
| **Review** | branch + запрос ревью | Reviewer + DS Owner |
| **Testing** | прототип/тест на реальном экране | автор + dev |
| **Approved** | approve в branch | DS Owner |
| **Published** | merge в main + Publish библиотеки | DS Owner |

- **Кто правит библиотеку:** только **Design System Owner** мержит и публикует; остальные — через branch + review.
- **Кто решает:** DS Owner (арбитр по системе); спорные бренд-решения → эскалация к Design Director/VP.
- **Rollback:** Figma Version History → restore предыдущей published-версии; в коде — `git revert`
  токенов/компонента. Токены и Figma откатываются **вместе** (§16).

---

## 7. Design Review Process

Перед публикацией компонент/экран проходит ревью по 7 осям:

1. **UX** — решает задачу, снижает нагрузку (Philosophy P1/P16).
2. **UI** — токены, один акцент, иерархия, спейсинг ×8 (Foundations).
3. **Accessibility** — контраст ≥ 4.5, focus, тап ≥ 44 (§ниже, WCAG AA).
4. **Responsive** — mobile/tablet/desktop/ultra-wide (Page Templates §3).
5. **Consistency** — совпадает с существующими паттернами, нет дублей.
6. **Performance** — нет тяжёлых эффектов, разумная вложенность, 60fps motion.
7. **Developer Feasibility** — реализуемо на токенах/Tailwind без хаков; согласовано с инженером.

Ревью — асинхронно (комментарии в branch) + синк раз в неделю (DS sync). Блокер по любой оси = не публикуем.

---

## 8. Design QA

Проверять на каждом экране/компоненте:
- **Отступы** — только из `--space-*` (×8), внутригрупповые < межгрупповых.
- **Цвета** — только Semantic-переменные; ноль ручных hex; один акцент.
- **Типографика** — Text Styles из шкалы; `balance` на заголовках; строка ~65.
- **Состояния** — default/hover/pressed/focus/disabled/loading/empty/error присутствуют.
- **Адаптивность** — 4 брейкпоинта, нет горизонтального скролла страницы.
- **Анимации** — токены duration/easing; `prefers-reduced-motion`.
- **Токены** — линт «detached value» = ноль отвязанных значений.

Инструменты: Figma-плагины (Design Lint, contrast checker, token-audit) в чек-лист ревьюера.

---

## 9. Design Handoff (Dev Mode)

**Designer → Developer:**
- Экран/компонент в **Dev Mode**; аннотированы состояния, responsive-правила, интеракции.
- Передаются **токены** (не пиксели): «`--space-4`», «`radius-card`», «`ease-standard`», а не «16px».
- Ссылка на соответствующий раздел `docs/` (Component/Pattern/Template) как контракт.

**Developer → Feedback:**
- Инженер комментирует реализуемость **до** approve (feasibility-ось §7).
- Расхождение «дизайн vs токены» → правится дизайн, не форкается токен.

**Design QA (после реализации):**
- Дизайнер сверяет прод с макетом: отступы/цвета/состояния/motion/a11y (§8).
- Баги-визуалы — в трекер с ссылкой на Dev Mode.

**Правило:** handoff — это токены + состояния + контракт из `docs/`, а не «картинка с размерами».

---

## 10. Documentation System

Каждый компонент документируется (в DS-сайте §11 и `docs/COMPONENT-LIBRARY.md`):
**Название · Описание · Когда использовать · Когда НЕ · Properties · Variants · Examples (live) ·
Code Reference (путь к `src/components/...` + токены).** Документация меняется в одном PR с
компонентом (§13). Без описания «когда не использовать» компонент не публикуется.

---

## 11. Design System Website (концепция)

Внутренний сайт документации (кандидаты: Storybook + автогенерация, или Zeroheight, синхронизированный с Figma):

```
Getting Started   — что это, принципы, как подключить, контакты владельцев
Foundations       — Colors/Type/Spacing/Grid/Motion (из Tokens+Foundations, live-примеры)
Components         — каталог, каждый с props/variants/states/code (Storybook-стори)
Patterns          — UX Patterns с интерактивными флоу
Templates          — T1–T10 с превью и «как собрать»
Guidelines        — Philosophy, do/don't, контент-гайд
Accessibility     — WCAG-чеклисты, паттерны
Changelog         — версии библиотеки (из §13 change-log)
```

Источник контента — файлы `docs/` + Storybook; сайт не дублирует, а рендерит их. Живой код-пример > скриншот.

---

## 12. Team Workflow (роли)

| Роль | Отвечает за |
|---|---|
| **Design System Owner** | Целостность системы; мерж/publish библиотеки; арбитраж спорного; roadmap DS |
| **Designer (product)** | Экраны из шаблонов/компонентов; предложения новых компонентов через branch |
| **Frontend Design Engineer** | Токены в коде, компоненты `src/components/`, синк Figma↔код, feasibility |
| **Developer (product)** | Сборка экранов из компонентов; Design QA-фидбек |
| **Reviewer** | Ревью по 7 осям (§7); линт токенов/a11y |
| **Product Manager** | Приоритеты, что попадает в продукт; арбитраж product vs system |

Ритуалы: еженедельный **DS sync** (review-очередь, конфликты), ежемесячный **DS health** (adoption, detached-tokens, deprecated).

---

## 13. Change Management (не сломать продукт)

Изменение цвета/компонента/паттерна/токена:
1. **Классифицируй:** non-breaking (значение токена, новый вариант) vs **breaking** (переименование, удаление, смена API).
2. **Non-breaking** → branch → review → publish; продукт обновляется автоматически (в этом сила токенов).
3. **Breaking** → новая версия + **migration guide** + deprecation старого на ≥ 1 цикл + кампания миграции; **никогда** тихая замена.
4. **Синхронно с кодом:** Figma-переменная, `figma-variables.json` и `tokens.css` меняются в **одном PR**; иначе дрейф.
5. **Changelog** обновляется на каждое published-изменение.

**Пример (реальный открытый вопрос):** primary в компонентах = violet/blue (хардкод), в токенах =
indigo. Это **breaking бренд-решение** → выбрать A (компоненты→indigo) или B (токены→violet/blue),
затем одна миграция + changelog. Не менять молча (см. Component Library §9).

---

## 14. Access Control

| Уровень | Права | Кто |
|---|---|---|
| **Admin / Owner** | Full: мерж/publish библиотеки, управление воркспейсом, variables | DS Owner, Design Director |
| **Editor** | Править в branch, создавать компоненты (не публиковать), экраны продукта | Product Designers, FE Design Eng |
| **Contributor** | Комментировать, предлагать в branch, копировать инстансы | Developers, PM |
| **Viewer** | Смотреть, инспектировать в Dev Mode | Stakeholders, вся команда |

**Принцип:** библиотеку **публикует только Owner**; продуктовые файлы — Editor; всё остальное —
Viewer/Contributor. Права на `Design System` project строже, чем на `Product`.

---

## 15. Design System Roadmap

| Фаза | Фокус | Выход | Статус |
|---|---|---|---|
| **1 · Foundation** | Токены, Foundations, Figma Variables | `tokens.css`, `figma-variables.json`, docs | ✅ Готово (код-сторона) |
| **2 · Components** | L1–L3 в коде + Figma, контракт | `src/components/ui/*` на токенах, Storybook | 🟡 Идёт (ui-слой есть, нужна миграция на токены) |
| **3 · Patterns** | L4–L5, UX Patterns, шаблоны | Patterns/Templates собраны | 🟡 Спеки готовы (docs), Figma-сборка впереди |
| **4 · Product Adoption** | Перевод экранов на систему, линт detached | 100% экранов на токенах/компонентах | ⬜ Впереди |
| **5 · Optimization** | Метрики adoption, темы (light/HC), автоматизация синка | DS health-дашборд, token-CI | ⬜ Впереди |

Каждая фаза — с метрикой выхода (adoption %, detached-tokens = 0, a11y-pass), а не «сделано на глаз».

---

## 16. Development Connection (Figma → Production)

Реальный пайплайн (заземлён на существующие артефакты):

```
Figma Variables (Semantic)
   │  экспорт DTCG
   ▼
design/figma-variables.json   ← источник обмена (W3C DTCG)
   │  (Style Dictionary / Tokens Studio sync)
   ▼
src/styles/tokens.css (@theme, Tailwind v4)   ← источник правды в коде
   │  Tailwind генерирует утилиты (bg-surface, rounded-card, shadow-e2)
   ▼
src/components/**  (React, forwardRef, variant/size, cn)
   │  Next.js App Router
   ▼
Production
```

- **Двусторонний контракт:** имена в `figma-variables.json` = имена в `tokens.css` (Semantic-слой). Расхождение = баг.
- **Автоматизация (цель фазы 5):** CI-проверка «Figma export ↔ tokens.css» (drift-детектор); token-lint в PR.
- **Никаких магических значений в коде** — только `var(--*)`/утилиты (Component Library §8).
- **shadcn-совместимость:** Semantic-токены мапятся на shadcn `--background/--foreground/--primary` — переход не ломает пайплайн.

---

## 17. Quality Control — чек-листы

### ✅ Component Checklist (перед publish)
- [ ] Contract (24 пункта) заполнен · [ ] Все варианты/размеры · [ ] Все состояния (default→error)
- [ ] Биндинг к **Semantic**-переменным (0 detached) · [ ] Auto Layout + fill/hug осознанно
- [ ] Component/Boolean Properties + Instance-swap · [ ] A11y (роль, контраст, тап ≥44, focus)
- [ ] Motion на токенах + reduced-motion · [ ] Code Reference (`src/components/...`) · [ ] Docs «когда НЕ использовать»

### ✅ Page Checklist
- [ ] Собрана на архетипе T1–T10 (не новый каркас) · [ ] Один H1 / один primary-CTA
- [ ] 4 состояния (loading/empty/error/success) · [ ] Responsive 4 брейкпоинта, нет гориз. скролла
- [ ] Навигация/landmarks · [ ] `<title>`/метаданные · [ ] Состояние (фильтр/таб) в URL где нужно

### ✅ Accessibility Checklist (WCAG AA)
- [ ] Контраст текста ≥ 4.5:1 (крупный ≥ 3:1) · [ ] Всё с клавиатуры, tab-порядок = визуальный
- [ ] `:focus-visible` виден · [ ] Тап-зоны ≥ 44×44 · [ ] `aria-label` на иконках, `aria-live` на динамике
- [ ] Статус = цвет + иконка + текст · [ ] Формы: label + `aria-describedby` ошибок · [ ] reduced-motion

### ✅ Developer Checklist
- [ ] Только токены/утилиты (0 хардкод-hex) · [ ] Компонент из библиотеки (не inline-дубль)
- [ ] forwardRef + типизированные props · [ ] Все состояния реализованы · [ ] SSR/hydration ок
- [ ] Нет CLS/layout-shift · [ ] Lighthouse a11y ≥ 95 · [ ] Соответствует Dev Mode-спеке

---

## 18. Final — как это работает (резюме)

**Vertlix AI Design System** = 3 связанных слоя:
1. **Стандарты** (`docs/`): Philosophy → Tokens → Foundations → Components → Patterns → Templates → **этот Ops-гайд**.
2. **Источники правды**: `figma-variables.json` (обмен) ↔ `tokens.css` (код) ↔ Figma Variables (дизайн) — синхронизируются в одном PR.
3. **Процессы** (этот документ): как создавать (§5), версионировать (§6), ревьюить (§7–8), передавать (§9), менять без поломок (§13), кто за что (§12/§14), куда движемся (§15).

**Как команда работает годами без хаоса:**
- Новый экран → архетип (Templates) + компоненты (Library) + паттерны (UX) на токенах. Минуты.
- Новый компонент → contract + branch + review + publish. Никаких копий.
- Изменение → классификация breaking/non-breaking → синхронно код+Figma → changelog. Продукт не ломается.
- Качество → 4 чек-листа (§17) как обязательные врата.

**Аудит этого гайда:** ✅ масштабируется (роли/branch/library-изоляция под десятки дизайнеров);
✅ единообразие (один источник правды, синк в одном PR); ✅ enterprise-готовность (access-control,
change-management, review-gates); ✅ честность (отмечено, что Figma-воркспейс разворачивается по
фазам, а код-сторона уже есть, и открытый бренд-вопрос indigo/violet требует решения).

**Слабые места, устранённые при аудите:**
1. Риск «Figma и код разъезжаются» → §16 фиксирует единый PR для переменных/токенов + drift-CI (фаза 5).
2. Риск тихих breaking-изменений → §13 обязывает версионирование + migration + changelog.
3. Неопределённость владения → §12/§14 задают единственного publisher (DS Owner) и уровни доступа.
4. Иллюзия «всё уже готово» → §15 честно проставляет фазы (1 готова, 2–3 идут, 4–5 впереди).

---

*Companion: [Philosophy](./DESIGN-PHILOSOPHY.md) · [Tokens](./DESIGN-TOKENS.md) ·
[Foundations](./FOUNDATIONS.md) · [Component Library](./COMPONENT-LIBRARY.md) ·
[UX Patterns](./UX-PATTERNS.md) · [Page Templates](./PAGE-TEMPLATES.md) ·
источники: [`tokens.css`](../src/styles/tokens.css) · [`figma-variables.json`](../design/figma-variables.json).*
