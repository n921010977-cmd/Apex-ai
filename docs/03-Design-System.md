# 📘 Документ 3 — UI/UX Design System

## Принципы дизайна
- **Dark-first** — основная тема тёмная, светлая не планируется
- **Минимализм** — меньше элементов, больше воздуха
- **Микроанимации** — всё плавно, без резких переходов
- **Консистентность** — одинаковые компоненты везде

---

## 1. Цветовая палитра

### Фоны
```
Background base:     #080808
Background surface:  #0a0a0a
Background elevated: #111111
Background card:     rgba(255,255,255,0.03)
```

### Акцентные цвета
```
Primary:    #7c3aed  (violet-600)
Secondary:  #3b82f6  (blue-600)
Gradient:   from-violet-600 to-blue-600
```

### Статусные цвета
```
Success:    #10b981  (emerald-500)
Warning:    #f59e0b  (amber-500)
Error:      #ef4444  (red-500)
Info:       #3b82f6  (blue-500)
```

### Текстовые токены
```
text-primary:    rgba(255,255,255,1.0)   — заголовки
text-secondary:  rgba(255,255,255,0.60)  — основной текст
text-tertiary:   rgba(255,255,255,0.35)  — подписи, метки
text-disabled:   rgba(255,255,255,0.20)  — неактивные элементы
text-accent:     #a78bfa                 — violet-400
```

### Границы
```
border-subtle:   rgba(255,255,255,0.06)
border-default:  rgba(255,255,255,0.08)
border-strong:   rgba(255,255,255,0.12)
border-accent:   rgba(124,58,237,0.30)  — violet
```

---

## 2. Типографика

### Шрифты
```
Sans-serif: Geist Sans (--font-geist-sans)
Monospace:  Geist Mono (--font-geist-mono)
```

### Масштаб
| Токен | Размер | Вес | Применение |
|---|---|---|---|
| `text-xs` | 10-11px | 400/500 | Метки, бейджи, мета |
| `text-sm` | 14px | 400/500 | Основной текст, кнопки |
| `text-base` | 16px | 400 | Параграфы |
| `text-lg` | 18px | 600 | Подзаголовки карточек |
| `text-xl` | 20px | 700 | Заголовки страниц |
| `text-2xl` | 24px | 700 | Крупные цифры в stat |
| `text-4xl` | 36px | 700 | Бизнес-балл, Hero |

---

## 3. Кнопки

### Варианты

**Primary** — основное действие
```
bg-gradient-to-r from-violet-600 to-blue-600
text-white
h-10 px-5 rounded-xl text-sm font-medium
hover: from-violet-500 to-blue-500 + shadow
```

**Secondary** — вторичное действие
```
border border-white/[0.10]
text-white/60
h-10 px-5 rounded-xl text-sm
hover: border-white/20 text-white/80
```

**Ghost** — третичное
```
text-white/40
hover: text-white/70 bg-white/[0.04]
```

**Danger** — деструктивное
```
border border-red-500/30 text-red-400
hover: bg-red-500/10
```

### Размеры
```
sm:  h-8  px-3  text-xs  rounded-lg
md:  h-9  px-4  text-xs  rounded-xl   (default)
lg:  h-10 px-5  text-sm  rounded-xl
xl:  h-12 px-8  text-base rounded-2xl
```

### Состояния
- `default` → `hover` → `active` → `disabled` → `loading`
- Loading: заменяем текст на спиннер, `opacity-70`
- Disabled: `opacity-40 cursor-not-allowed`

---

## 4. Карточки

### Card Default
```
bg-white/[0.03]
border border-white/[0.07]
rounded-2xl
```

### Card Hover
```
+ transition-all duration-300
hover:border-violet-500/20
hover:bg-white/[0.05]
hover:shadow-lg hover:shadow-violet-500/5
```

### Card Glass
```
backdrop-blur-xl
bg-white/[0.04]
border border-white/[0.08]
```

### Card Elevated
```
bg-[#111111]
border border-white/[0.07]
shadow-2xl shadow-black/50
```

### CardContent padding
```
p-4   — компактный
p-5   — стандартный
p-6   — просторный
```

---

## 5. Иконки

### Библиотека
Все иконки — **SVG inline**, стиль `fill="none" stroke="currentColor"`.

### Размеры
```
size-3    — 12px  микро (точка статуса)
size-3.5  — 14px  мелкие (в кнопках sm)
size-4    — 16px  стандарт (навигация, кнопки)
size-5    — 20px  средние (карточки)
size-6    — 24px  крупные (заголовки секций)
size-7    — 28px  героические
```

### strokeWidth
```
1.5 — декоративные иконки, иллюстрации
2.0 — интерактивные элементы (кнопки, навигация)
2.5 — акцентные (крест, галочка)
```

---

## 6. Анимации

### Transition tokens
```css
transition-colors:    color, background-color, border-color — 150ms ease
transition-all:       все свойства — 200ms ease
transition-transform: transform — 200ms ease
```

### Hover эффекты
```
Кнопки:   scale(1.01) + shadow
Карточки: translateY(-1px) + shadow
Ссылки:   opacity 0.7 → 1.0
```

### Loading состояния
```
animate-pulse   — скелетоны
animate-spin    — спиннеры (border-t transparent)
animate-bounce  — уведомления (редко)
```

### Framer Motion
```tsx
// Появление страницы
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Список элементов
staggerChildren: 0.05
```

---

## 7. Отступы и сетка

### Spacing scale (Tailwind)
```
4px  = p-1
8px  = p-2
12px = p-3
16px = p-4
20px = p-5
24px = p-6
32px = p-8
```

### Сетка страниц
```
max-w-7xl mx-auto   — максимальная ширина контента
p-8                 — внутренние отступы страниц
gap-4 / gap-6       — между карточками
```

### Breakpoints
```
sm:   640px
md:   768px
lg:   1024px
xl:   1280px
2xl:  1536px
```

---

## 8. Sidebar

### Структура
```
[Logo + название]        — 64px высота
[Nav items]              — flex-1 overflow-y-auto
  - Dashboard
  - Новая стратегия      — accent (violet)
  - Мои проекты
  - Отчёты
  - Исполнительный совет
  - Аналитика
  - Блокнот
[Usage widget]           — mx-3 mb-3
[Bottom items]           — border-top
  - Настройки
  - Помощь и поддержка
[User profile]           — flex items-center
```

### Ширина: `w-60` (240px)

### Nav item states
```
Default:  text-white/40 border-transparent
Hover:    text-white/80 bg-white/[0.04]
Active:   text-violet-300 bg-violet-500/15 border-violet-500/20
Accent:   text-violet-400 + pulse dot
```

---

## 9. Dashboard layout

### Общая структура
```
┌─────────────────────────────────────┐
│  Sidebar (w-60)  │  Main content    │
│                  │  (flex-1)        │
│                  │  overflow-y-auto │
└─────────────────────────────────────┘
```

### Main content areas
```
Header (заголовок + CTA)     — mb-8
Stats grid (2-4 колонки)     — mb-8
Content grid (2/3 + 1/3)     — gap-6
```

---

## 10. Landing Page

### Структура секций
```
Navbar         — sticky top-0 backdrop-blur z-50
Hero           — min-h-screen flex items-center
How it works   — py-24
AI Executives  — py-24 bg-gradient
Features       — py-24
Pricing        — py-24
CTA Banner     — py-24 gradient
Footer         — py-16
```

### Hero
- Gradient text: `bg-gradient-to-r from-white to-white/50`
- Фоновая сетка: `grid-pattern opacity-20`
- Глоу эффекты: `radial-gradient violet/20`

### Анимации Landing
- Счётчики цифр (countUp на viewport enter)
- Fade-in + slide-up для секций (IntersectionObserver)
- Плавный скролл между секциями
