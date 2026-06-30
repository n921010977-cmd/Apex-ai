# 📘 Документ 6 — Backend Architecture

## Технологический стек
- **Framework**: Next.js 16 (App Router, API Routes)
- **ORM**: Prisma + PostgreSQL
- **Auth**: NextAuth.js v5 (JWT)
- **Payments**: Stripe
- **Queue**: Bull + Redis
- **Storage**: AWS S3 / Cloudflare R2
- **Email**: SendGrid / Resend
- **Monitoring**: Sentry + Axiom

---

## API Routes структура

```
/api
├── auth
│   ├── [...nextauth]     — NextAuth handlers
│   ├── register          — POST регистрация
│   └── verify-email      — POST подтверждение email
│
├── user
│   ├── profile           — GET/PATCH профиль
│   ├── avatar            — POST загрузка аватара
│   └── delete            — DELETE удалить аккаунт
│
├── projects
│   ├── index             — GET список / POST создать
│   ├── [id]
│   │   ├── index         — GET детали / PATCH / DELETE
│   │   ├── stream        — GET SSE прогресс анализа
│   │   └── retry         — POST повторить анализ
│
├── reports
│   ├── [id]
│   │   ├── index         — GET отчёт
│   │   ├── pdf           — GET сгенерировать/скачать PDF
│   │   └── share         — POST создать публичную ссылку
│
├── billing
│   ├── plans             — GET тарифы
│   ├── checkout          — POST создать Stripe checkout
│   ├── portal            — POST Stripe customer portal
│   └── webhook           — POST Stripe webhooks
│
├── notifications
│   ├── index             — GET список / PATCH пометить прочитанными
│   └── [id]              — DELETE удалить
│
└── admin (role: ADMIN)
    ├── users             — GET список пользователей
    ├── stats             — GET статистика платформы
    └── jobs              — GET статус очередей
```

---

## Авторизация (NextAuth.js v5)

### Конфигурация
```typescript
// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        return valid ? user : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionStatus = user.subscriptionStatus;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.subscriptionStatus = token.subscriptionStatus as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
```

### Middleware (защита роутов)
```typescript
// middleware.ts
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/projects/:path*", "/api/reports/:path*"],
};
```

---

## Prisma Setup

### prisma/schema.prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ... модели из документа 04
```

### lib/prisma.ts
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## API Route примеры

### POST /api/projects — создать проект
```typescript
// app/api/projects/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analysisQueue } from "@/lib/queue";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(20).max(5000),
  industry: z.string(),
  stage: z.enum(["IDEA", "PLANNING", "BUILDING", "LAUNCHED"]),
  goals: z.array(z.string()),
  targetRevenue: z.string().optional(),
  timeframe: z.string().default("12"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Проверить лимит проектов
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, projectsCount: true },
  });

  if (user?.subscriptionStatus === "FREE" && user.projectsCount >= 3) {
    return Response.json({ error: "Project limit reached" }, { status: 403 });
  }

  const body = createProjectSchema.parse(await req.json());

  const project = await prisma.project.create({
    data: { ...body, userId: session.user.id, status: "QUEUED" },
  });

  // Инкремент счётчика
  await prisma.user.update({
    where: { id: session.user.id },
    data: { projectsCount: { increment: 1 } },
  });

  // Добавить в очередь
  await analysisQueue.add(
    { projectId: project.id, userId: session.user.id },
    { priority: user?.subscriptionStatus === "PRO" ? 1 : 2 }
  );

  return Response.json({ project }, { status: 201 });
}
```

### GET /api/projects/[id]/stream — SSE прогресс
```typescript
// app/api/projects/[id]/stream/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Подписаться на Redis pub/sub для обновлений
      const subscriber = redis.duplicate();
      subscriber.subscribe(`project:${params.id}:progress`, (message) => {
        send(JSON.parse(message));
      });

      req.signal.addEventListener("abort", () => {
        subscriber.unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## Stripe Integration

### Checkout Session
```typescript
// app/api/billing/checkout/route.ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await auth();
  const { priceId } = await req.json();

  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session!.user.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings`,
    metadata: { userId: session!.user.id },
  });

  return Response.json({ url: checkoutSession.url });
}
```

### Webhook обработчик
```typescript
// app/api/billing/webhook/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCancelled(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }

  return new Response("OK");
}
```

---

## Очереди задач (Bull)

```typescript
// lib/queue.ts
import Bull from "bull";
import { runAnalysisPipeline } from "./ai/pipeline";

export const analysisQueue = new Bull("analysis", {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

analysisQueue.process(2, async (job) => {  // concurrency: 2
  const { projectId, userId } = job.data;

  try {
    await runAnalysisPipeline(projectId, userId, async (progress, event) => {
      await job.progress(progress);
      // Publish to Redis для SSE
      await redis.publish(
        `project:${projectId}:progress`,
        JSON.stringify({ progress, ...event })
      );
    });
  } catch (error) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "FAILED", errorMessage: String(error) },
    });
    throw error;
  }
});

analysisQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  // Sentry.captureException(err);
});
```

---

## Rate Limiting

```typescript
// middleware/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),  // 10 запросов в минуту
});

export async function rateLimitMiddleware(req: Request, identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }
}
```

---

## Логирование

```typescript
// lib/logger.ts
import Sentry from "@sentry/nextjs";

export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: "info", message, ...meta, ts: Date.now() }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ level: "error", message, ...meta, ts: Date.now() }));
    if (error) Sentry.captureException(error);
  },
  event: async (userId: string, action: string, meta?: object) => {
    await prisma.activityLog.create({
      data: { userId, action, metadata: meta ?? {} },
    });
  },
};
```

---

## Переменные окружения

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/apexai"
REDIS_URL="redis://localhost:6379"

# Auth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-32-chars"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_ENTERPRISE="price_..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="apexai-files"
AWS_REGION="us-east-1"

# Email
SENDGRID_API_KEY="SG...."

# Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."
```
