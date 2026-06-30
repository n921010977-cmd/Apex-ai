# 📘 Документ 4 — Database Architecture

## Технологии
- **База данных**: PostgreSQL 15+
- **ORM**: Prisma
- **Кеш**: Redis (сессии, очереди, rate limiting)
- **Файлы**: AWS S3 / Cloudflare R2

---

## Схема базы данных

### 1. Users (Пользователи)
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  name              String?
  avatarUrl         String?
  company           String?
  passwordHash      String?
  role              Role      @default(USER)

  // Подписка
  stripeCustomerId  String?   @unique
  subscriptionId    String?
  subscriptionStatus SubscriptionStatus @default(FREE)
  subscriptionEndsAt DateTime?

  // Счётчики (денормализация для скорости)
  projectsCount     Int       @default(0)
  reportsCount      Int       @default(0)
  reportsThisMonth  Int       @default(0)

  // Настройки
  notifyOnComplete  Boolean   @default(true)
  notifyWeekly      Boolean   @default(true)
  notifyUpdates     Boolean   @default(false)
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?

  // Связи
  projects          Project[]
  reports           Report[]
  sessions          Session[]
  notifications     Notification[]
  activityLogs      ActivityLog[]
  payments          Payment[]

  @@index([email])
  @@index([stripeCustomerId])
}

enum Role {
  USER
  ADMIN
}

enum SubscriptionStatus {
  FREE
  PRO
  ENTERPRISE
  CANCELLED
  PAST_DUE
}
```

---

### 2. Projects (Проекты)
```prisma
model Project {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Основная информация
  name        String
  description String        @db.Text
  industry    String
  stage       ProjectStage
  goals       String[]
  targetRevenue String?
  timeframe   String        @default("12")

  // Статус
  status      ProjectStatus @default(QUEUED)
  score       Int?
  progress    Int           @default(0)
  errorMessage String?

  // Метаданные
  isArchived  Boolean       @default(false)
  isPublic    Boolean       @default(false)

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  completedAt DateTime?

  // Связи
  report      Report?
  agentRuns   AgentRun[]
  chats       Chat[]
  files       File[]
  activityLogs ActivityLog[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

enum ProjectStage {
  IDEA
  PLANNING
  BUILDING
  LAUNCHED
}

enum ProjectStatus {
  QUEUED
  PROCESSING
  COMPLETE
  FAILED
}
```

---

### 3. Reports (Отчёты)
```prisma
model Report {
  id          String    @id @default(cuid())
  projectId   String    @unique
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  // Содержание (JSON)
  executiveSummary  Json?
  financialModel    Json?
  marketAnalysis    Json?
  marketingStrategy Json?
  operationsPlan    Json?
  technologyStack   Json?
  riskAnalysis      Json?
  roadmap           Json?

  // Метаданные
  version     Int       @default(1)
  pdfUrl      String?   // S3 URL
  shareToken  String?   @unique
  isPublic    Boolean   @default(false)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([shareToken])
}
```

---

### 4. Agents (AI Агенты)
```prisma
model AgentRun {
  id          String      @id @default(cuid())
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  agentRole   AgentRole
  status      AgentStatus @default(PENDING)
  prompt      String      @db.Text
  response    Json?
  tokensUsed  Int?
  errorMessage String?
  durationMs  Int?

  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime    @default(now())

  @@index([projectId])
  @@index([agentRole])
}

enum AgentRole {
  CEO
  CFO
  CMO
  COO
  CTO
  SALES
  LEGAL
  ANALYST
}

enum AgentStatus {
  PENDING
  RUNNING
  COMPLETE
  FAILED
}
```

---

### 5. Chats (История диалогов)
```prisma
model Chat {
  id        String    @id @default(cuid())
  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String

  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([projectId])
  @@index([userId])
}

model Message {
  id        String      @id @default(cuid())
  chatId    String
  chat      Chat        @relation(fields: [chatId], references: [id], onDelete: Cascade)

  role      MessageRole
  content   String      @db.Text
  agentRole AgentRole?  // если это ответ агента

  createdAt DateTime    @default(now())

  @@index([chatId])
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

---

### 6. Subscriptions (Подписки)
```prisma
model Subscription {
  id                  String             @id @default(cuid())
  userId              String             @unique
  
  stripeSubscriptionId String?           @unique
  stripePriceId       String?
  stripeProductId     String?
  
  plan                SubscriptionPlan   @default(FREE)
  status              SubscriptionStatus @default(FREE)
  
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean            @default(false)
  canceledAt          DateTime?
  
  reportsLimit        Int                @default(3)
  projectsLimit       Int                @default(3)
  
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  @@index([userId])
  @@index([stripeSubscriptionId])
}

enum SubscriptionPlan {
  FREE
  PRO
  ENTERPRISE
}
```

---

### 7. Payments (Платежи)
```prisma
model Payment {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  stripePaymentId String        @unique
  amount          Int           // в центах
  currency        String        @default("usd")
  status          PaymentStatus
  description     String?
  receiptUrl      String?

  createdAt       DateTime      @default(now())

  @@index([userId])
  @@index([createdAt])
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

---

### 8. Files (Файлы)
```prisma
model File {
  id          String    @id @default(cuid())
  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  userId      String

  name        String
  originalName String
  mimeType    String
  size        Int       // байты
  url         String    // S3 URL
  key         String    // S3 key
  type        FileType  @default(ATTACHMENT)

  createdAt   DateTime  @default(now())

  @@index([projectId])
  @@index([userId])
}

enum FileType {
  PDF_REPORT
  AVATAR
  ATTACHMENT
}
```

---

### 9. Activity Logs (Логи активности)
```prisma
model ActivityLog {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String?
  project   Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)

  action    String    // "project.created", "report.generated", "subscription.upgraded"
  metadata  Json?     // дополнительные данные
  ipAddress String?
  userAgent String?

  createdAt DateTime  @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

### 10. Sessions (Сессии)
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

---

### 11. Notifications (Уведомления)
```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      NotificationType
  title     String
  message   String
  link      String?
  isRead    Boolean          @default(false)

  createdAt DateTime         @default(now())

  @@index([userId])
  @@index([isRead])
}

enum NotificationType {
  ANALYSIS_COMPLETE
  REPORT_READY
  SUBSCRIPTION_EXPIRING
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  PRODUCT_UPDATE
  WEEKLY_INSIGHT
}
```

---

## Связи между таблицами

```
User ──────────┬──── Project (1:many)
               ├──── Report (1:many)
               ├──── Session (1:many)
               ├──── Notification (1:many)
               ├──── ActivityLog (1:many)
               ├──── Payment (1:many)
               └──── Subscription (1:1)

Project ───────┬──── Report (1:1)
               ├──── AgentRun (1:many)
               ├──── Chat (1:many)
               ├──── File (1:many)
               └──── ActivityLog (1:many)

Chat ──────────└──── Message (1:many)
```

---

## Индексы и производительность

```sql
-- Частые запросы
CREATE INDEX idx_projects_user_status ON "Project"("userId", "status");
CREATE INDEX idx_projects_created ON "Project"("createdAt" DESC);
CREATE INDEX idx_agent_runs_project ON "AgentRun"("projectId", "agentRole");
CREATE INDEX idx_notifications_unread ON "Notification"("userId", "isRead");
CREATE INDEX idx_activity_user_time ON "ActivityLog"("userId", "createdAt" DESC);
```

---

## Redis структуры

```
# Сессии
session:{token} → userId (TTL: 30d)

# Rate limiting
ratelimit:login:{ip} → count (TTL: 15m)
ratelimit:api:{userId} → count (TTL: 1m)

# Очереди задач (Bull)
queue:analysis → [{ projectId, userId, priority }]

# Кеш (TTL: 5m)
cache:project:{id} → JSON
cache:user:{id}:stats → JSON
```
