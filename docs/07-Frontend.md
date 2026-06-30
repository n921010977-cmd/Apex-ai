# 📘 Документ 7 — Frontend Architecture

## Технологический стек
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: SVG inline (Lucide-based)
- **State**: React useState/useContext (без Redux)
- **Forms**: нативные React forms + Zod
- **HTTP**: fetch (нативный) / SWR для кеширования

---

## Структура папок

```
src/
├── app/
│   ├── (auth)/                     — группа без layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── dashboard/
│   │   ├── layout.tsx              — Sidebar + main wrapper
│   │   ├── page.tsx                — Главный дашборд
│   │   ├── new/page.tsx            — Создание проекта (wizard)
│   │   ├── projects/
│   │   │   ├── page.tsx            — Список проектов
│   │   │   └── [id]/page.tsx       — Детальная страница проекта
│   │   ├── reports/page.tsx        — Отчёты
│   │   ├── executives/page.tsx     — AI команда
│   │   ├── analytics/page.tsx      — Аналитика
│   │   ├── notepad/page.tsx        — Блокнот
│   │   ├── settings/page.tsx       — Настройки
│   │   └── support/page.tsx        — Поддержка
│   │
│   ├── layout.tsx                  — Root layout (fonts, metadata)
│   ├── page.tsx                    — Landing page
│   └── globals.css
│
├── components/
│   ├── ui/                         — Базовые компоненты
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Progress.tsx
│   │   ├── Input.tsx               — TODO
│   │   ├── Select.tsx              — TODO
│   │   ├── Modal.tsx               — TODO
│   │   ├── Toast.tsx               — TODO
│   │   └── Skeleton.tsx            — TODO
│   │
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx           — TODO
│   │   ├── ProjectCard.tsx         — TODO
│   │   └── NotificationBell.tsx    — TODO
│   │
│   └── landing/
│       ├── Navbar.tsx
│       ├── HeroSection.tsx
│       ├── HowItWorksSection.tsx
│       ├── ExecutivesSection.tsx
│       ├── FeaturesSection.tsx
│       ├── PricingSection.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── utils.ts                    — cn(), formatDate(), etc.
│   ├── prisma.ts                   — Prisma client
│   ├── auth.ts                     — NextAuth config
│   └── api.ts                      — fetch wrappers
│
├── hooks/
│   ├── useUser.ts                  — текущий пользователь
│   ├── useProjects.ts              — список проектов
│   └── useNotifications.ts        — уведомления
│
└── types/
    └── index.ts                    — глобальные TypeScript типы
```

---

## 1. Landing Page

### Компоненты

**Navbar** (`/components/landing/Navbar.tsx`)
- Sticky, backdrop-blur при скролле
- Логотип | Навигация | Login + Get Started
- Mobile: hamburger меню

**HeroSection**
- Gradient заголовок
- Подзаголовок + CTA кнопки
- Анимированная демо-карточка (AI совет)
- Фоновая сетка + глоу эффекты

**HowItWorksSection**
- 3 шага с номерами
- Иконки + описания
- Горизонтальный layout на desktop

**ExecutivesSection**
- 8 карточек агентов
- Hover эффект с деталями роли
- Grid 4×2

**FeaturesSection**
- 6 фич в сетке 3×2
- Иконка + заголовок + описание

**PricingSection**
- 3 карточки: Free / Pro / Enterprise
- Highlighted карточка Pro
- Feature checklist
- CTA на каждой карточке

**Footer**
- Логотип + описание
- Ссылки (Product, Company, Legal)
- Социальные сети
- Copyright

---

## 2. Auth Pages

### /login
```tsx
// Форма: email + password
// OAuth: Google кнопка
// Ссылки: Register, Forgot password
// Редирект: /dashboard после входа

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email, password, redirect: false
    });
    if (result?.error) {
      setError("Неверный email или пароль");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };
  // ...
}
```

### /register
- Имя, Email, Пароль, Подтверждение пароля
- Checkbox согласие с условиями
- После регистрации → письмо с подтверждением

---

## 3. Dashboard

### Layout
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

### Главная страница /dashboard
- Приветствие + дата
- 4 stat-карточки (проекты, балл, отчёты, выручка)
- Последние проекты (список + ссылки)
- AI-команда (статус агентов)
- Upgrade banner (для Free)

---

## 4. Создание проекта (/dashboard/new)

### 3-step wizard
```tsx
const STEPS = {
  1: <DescriptionStep />,    // название + описание
  2: <ParametersStep />,     // индустрия + стадия
  3: <GoalsStep />,          // цели + таймфрейм
};

// После сабмита — показываем загрузку с SSE
const [status, setStatus] = useState("idle");
const [progress, setProgress] = useState(0);

const startAnalysis = async () => {
  const { project } = await createProject(formData);
  setStatus("processing");

  const eventSource = new EventSource(`/api/projects/${project.id}/stream`);
  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    setProgress(data.progress);
    if (data.type === "analysis_complete") {
      router.push(`/dashboard/projects/${project.id}`);
    }
  };
};
```

---

## 5. Страница проекта (/dashboard/projects/[id])

### Компоненты
- **ProjectHeader** — название, badge, score, кнопки
- **BusinessScoreCard** — 4 метрики с прогресс-барами
- **TabNavigation** — Резюме / Финансы / Рынок / Риски
- **TabContent** — динамический рендер по активной вкладке

### Данные
```tsx
// Загрузка данных проекта
const { data: project, isLoading } = useSWR(
  `/api/projects/${id}`,
  fetcher
);

if (isLoading) return <ProjectSkeleton />;
```

---

## 6. AI Team (/dashboard/executives)

- Список 5 агентов в левой панели
- Детальный профиль в правой (биография, экспертиза, инсайты)
- Клик на агента → анимированное переключение
- Кнопка "Брифовать" → /dashboard/new

---

## 7. Reports (/dashboard/reports)

- Список отчётов слева
- Просмотр отчёта справа (секции accordion или tab)
- Кнопки: Download PDF, Share
- Empty state: "Создайте первый проект"

---

## 8. Billing (/dashboard/settings → вкладка Подписка)

```tsx
const handleUpgrade = async (priceId: string) => {
  const { url } = await fetch("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ priceId }),
  }).then(r => r.json());
  window.location.href = url;
};

const handleManage = async () => {
  const { url } = await fetch("/api/billing/portal", {
    method: "POST",
  }).then(r => r.json());
  window.location.href = url;
};
```

---

## 9. Settings (/dashboard/settings)

### Вкладки
- **Профиль** — имя, аватар, компания, email
- **Аккаунт** — пароль, 2FA, удаление
- **Уведомления** — toggle switches
- **Подписка** — текущий план, история платежей

---

## Общие UI паттерны

### Loading Skeleton
```tsx
function ProjectSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-white/[0.06] rounded-xl w-64" />
      <div className="h-4 bg-white/[0.04] rounded-lg w-96" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.04] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
```

### Toast уведомления
```tsx
// lib/toast.ts — простая in-app реализация
const toast = {
  success: (msg: string) => showToast(msg, "success"),
  error: (msg: string) => showToast(msg, "error"),
  info: (msg: string) => showToast(msg, "info"),
};
```

### Error Boundary
```tsx
// app/error.tsx
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-xl font-bold text-white">Что-то пошло не так</h2>
      <p className="text-white/40">{error.message}</p>
      <button onClick={reset} className="...">Попробовать снова</button>
    </div>
  );
}
```

### 404 страница
```tsx
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-6xl font-bold text-white/10">404</div>
      <h1 className="text-xl font-bold text-white">Страница не найдена</h1>
      <Link href="/dashboard" className="...">На главную</Link>
    </div>
  );
}
```

---

## Hooks

### useUser
```typescript
// hooks/useUser.ts
export function useUser() {
  const { data: session } = useSession();
  const { data: user } = useSWR(
    session ? "/api/user/profile" : null,
    fetcher
  );
  return { user, isLoading: !user, isPro: user?.subscriptionStatus === "PRO" };
}
```

### useProjects
```typescript
// hooks/useProjects.ts
export function useProjects() {
  const { data, isLoading, mutate } = useSWR("/api/projects", fetcher);
  return {
    projects: data?.projects ?? [],
    isLoading,
    refresh: mutate,
  };
}
```

---

## Производительность

- **Image Optimization**: next/image для всех изображений
- **Code splitting**: автоматически через App Router
- **Suspense**: для lazy-loaded компонентов
- **SWR**: кеш + revalidation для API запросов
- **Bundle analysis**: `next-bundle-analyzer`

### Core Web Vitals цели
```
LCP: < 2.5s
FID: < 100ms
CLS: < 0.1
TTFB: < 800ms
```
