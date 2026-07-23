# Vertlix AI — Telegram Bot

A **full alternate interface** to the Vertlix AI platform inside Telegram. Not a
separate product — the same AI board, projects, history, subscriptions and data,
reachable from a chat.

**Stack:** Node.js 20 · TypeScript · **Telegraf 4** · **Prisma** (→ same Postgres
as the web app) · Anthropic Claude (OpenAI-ready router) · Redis (optional).

> **Note on the stack:** the web app uses the Supabase client; this bot is a
> *separate process* and uses **Prisma against the same Postgres database** — a
> clean split that honors the requested stack without touching the app. AI runs
> on **Anthropic Claude** (the configured provider); the router is OpenAI-ready.

---

## 1. Architecture

```
 Telegram user
     │  updates (polling / webhook)
     ▼
 Telegraf Bot  ──►  Middleware: errorBoundary → logger → session → rateLimit → attachAccount
     │                                   │
     │                                   ├─ auth: telegram_id → linked Vertlix user
     ▼                                   │
 Handlers (commands / menu / callbacks)  │
     │                                   ▼
 Services (auth-link, subscription,   Prisma  ──►  PostgreSQL (SAME DB as web app,
 notification, admin)                    │          RLS-scoped by user/org in code)
     │                                   │
     ▼                                   ▼
 AI layer (agents · router · chat)  ──►  Anthropic Claude (Opus/Sonnet/Haiku)
     │
     └─ streaming reply → throttled Telegram message edits
```

**Auth model.** Telegram has no cookies, so we **link** a Telegram ID to a Vertlix
account: `/link` → email → one-time code (emailed via Resend, anti-enumeration) →
`telegram_accounts` row. Every request resolves the linked user and scopes all
DB access by `user_id` / `organization_id`.

**Streaming.** Telegram has no token stream — we accumulate Claude's stream and
**edit one message** on a throttle (~1.2s) with a `▌` cursor, then finalize.

---

## 2. Project structure

```
telegram-bot/
├── prisma/schema.prisma        # maps existing tables + telegram_accounts, telegram_link_codes
└── src/
    ├── index.ts                # entry: launch (polling/webhook), graceful shutdown
    ├── bot.ts                  # Telegraf assembly: middleware, commands, routing
    ├── config/                 # env (zod-validated), constants (plans, models, limits)
    ├── database/               # prisma client + repositories (all queries)
    ├── middlewares/            # session, rateLimit, auth, logger/errorBoundary
    ├── ai/                     # agents (personas), anthropic, router, chat (streaming)
    ├── services/               # authService (linking), subscription, notification, admin
    ├── handlers/               # menu, agents, chat, projects, conversations, link, documents, settings
    ├── commands/               # admin commands
    ├── keyboards/              # reply + inline keyboards (the menus)
    ├── utils/                  # format (markdown→Telegram HTML), throttle
    └── types.ts                # BotContext, session, linked account
```

## 3. Features (maps to the request)

| # | Feature | Where |
|---|---|---|
| 2 | Auth: `/start`, `/link` (email code), unlink, device = telegram_id | `handlers/link`, `services/authService` |
| 3 | Main menu (🏠🤖💬📁📄📊💳⚙️👤❓) | `keyboards`, `bot.hears` |
| 4 | AI agents (Analyst/Marketing/Finance/Strategy/Sales/PM/Research…) | `ai/agents` |
| 5 | AI chat: streaming, history, new/open/delete | `handlers/chat`, `handlers/conversations` |
| 6 | Projects: create (wizard), open, archive, chat-in-project | `handlers/projects` |
| 7 | Documents: upload receipt + validation (RAG ingestion = platform-side) | `handlers/documents` |
| 8 | Subscription: plan, limits, remaining AI requests | `services/subscription`, `handlers/menu` |
| 9 | Notifications: ai_done, document_processed, sub_ending, limit, invite | `services/notification` |
| 10 | Settings: model, notifications, language/tz, unlink | `handlers/settings` |
| 11 | Profile: name, email, TG id, plan, usage, reg date | `handlers/menu` |
| 12 | Security: telegram_id check, rate-limit, action log, block, anti-enum | `middlewares/*`, `services/admin` |
| 13 | Admin: `/admin /users /logs /block /unblock /setplan` | `commands/admin` |
| 16 | DB models (User, TelegramAccount, Conversation, Message, Agent, Project, Subscription, Usage, Notification…) | `prisma/schema.prisma` |

## 4. Setup (local)

```bash
cd telegram-bot
cp .env.example .env         # fill BOT_TOKEN, DATABASE_URL, ANTHROPIC_API_KEY, ...
npm install
npm run prisma:generate
# create the two new tables against your DB (dev):
npm run prisma:push          # or add them to supabase/migrations and apply
npm run dev                  # tsx watch, long-polling
```

Get `BOT_TOKEN` from [@BotFather]. `DATABASE_URL` = the same Postgres/Supabase
connection string the web app uses (pooled), `DIRECT_URL` = direct (for `db push`).

## 5. Deployment

**Long polling (simplest, single instance):**
```bash
npm run build && npm start        # BOT_MODE=polling
```

**Webhook (serverful, scalable):**
```bash
# BOT_MODE=webhook, WEBHOOK_DOMAIN=https://bot.vertlix.ai, PORT=8080
npm run build && npm start
```

**Docker:**
```bash
docker build -t vertlix-bot .
docker run --env-file .env -p 8080:8080 vertlix-bot
```

**PM2:**
```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 logs vertlix-bot
```

**Managed platforms (long-polling worker — no public port).** Config files are
included; enter secrets in the platform dashboard (never in git):
- **Railway** — `railway.json` (Dockerfile build). New Project → Deploy from repo → set env vars.
- **Fly.io** — `fly.toml`. `fly launch --no-deploy` → `fly secrets set BOT_TOKEN=… DATABASE_URL=… ANTHROPIC_API_KEY=…` → `fly deploy`.
- **Render** — `render.yaml` (Background Worker, `rootDir: telegram-bot`). New Blueprint → fill the `sync:false` secrets.

> This sandbox can't host the bot (no persistent process, and api.telegram.org is
> not reachable from here) — deploy on one of the above or your own VPS.

## 6. Security

- **telegram_id verification** on every update (`attachAccount`); blocked accounts rejected.
- **Rate limiting** per user (Redis or in-memory): global command bucket + stricter AI bucket.
- **Plan enforcement** server-side (daily AI cap, project limit) — never trust the client.
- **Anti-enumeration** linking (generic "code sent"); one-time codes are HMAC-hashed, TTL + attempt cap.
- **Action log** (`activity_logs`) for linking, AI use, project create, admin actions.
- **Token safety:** secrets only in env; `.env` git-ignored; no secrets in code/images.

## 7. What's platform-side (honest notes)

- **Document RAG ingestion** (parse→chunk→embed) runs on the platform once storage +
  embeddings are configured; the bot validates & records uploads and will surface results.
  Semantic retrieval already exists on the platform.
- **Notifications** are best wired via a shared queue/webhook from the web app calling
  `notifyUser(...)`; the sender is implemented here.
- The two new tables (`telegram_accounts`, `telegram_link_codes`) should also be added to
  `supabase/migrations/` with RLS, to stay consistent with the app's data model.
