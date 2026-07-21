# Vertlix AI

AI SaaS where a board of 20 AI directors analyzes a founder's project and produces strategy, reports, and an executive council. Built with the Next.js App Router.

## Stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Framework  | Next.js (App Router, Turbopack) · TypeScript · React   |
| Styling    | Tailwind CSS + a custom design system · Framer Motion  |
| Auth       | Auth.js / NextAuth v5 (Credentials + Google + GitHub)  |
| Database   | Supabase (PostgreSQL)                                  |
| Security   | bcrypt, TOTP 2FA (otplib), WebAuthn passkeys, Zod      |
| Deploy     | Vercel                                                 |

> **Note:** the database layer is **Supabase**, accessed via `@/lib/supabase`.
> A legacy `prisma/schema.prisma` remains in the tree but is **not used** by the
> app — `@prisma/client` is imported nowhere in `src/`. Schema changes live in
> `supabase/migrations/*.sql`.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see below), then apply DB migrations
#    Run the SQL files in supabase/migrations/ against your Supabase project,
#    in order (Supabase SQL editor, or the Supabase CLI):
#      supabase db push        # if using the Supabase CLI

# 3. Start the dev server
npm run dev
```

App runs at http://localhost:3000.

## Environment variables

Create a `.env.local`:

```bash
# ── Auth (required) ─────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=            # openssl rand -base64 32

# ── Supabase (required for real accounts) ───────────────────────
# Without these the app runs in demo mode: auth accepts any valid input
# and nothing is persisted.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ── Field encryption (required for 2FA) ─────────────────────────
DATA_ENCRYPTION_KEY=        # 32-byte key, base64 or hex — encrypts TOTP secrets

# ── OAuth (optional) ────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ── Transactional email (optional) ──────────────────────────────
# Powers email verification and password reset. Without a key, links are
# logged server-side so the flows still work locally.
RESEND_API_KEY=
RESEND_FROM=Vertlix AI <onboarding@resend.dev>
```

## Auth & account features

- **Sign up / sign in** — email + password (bcrypt, cost 12) or Google / GitHub OAuth. JWT sessions in secure, httpOnly cookies; per-IP rate limiting on auth routes; CSRF handled by NextAuth.
- **Email verification** — a signed, self-expiring link (`/verify-email`); no token table needed.
- **Password reset** — `/forgot-password` → emailed signed link → `/reset-password`.
- **Two-factor auth (TOTP)** — enroll with any authenticator app; enforced at login; one-time backup codes.
- **Passkeys (WebAuthn)** — passwordless sign-in with Face ID / fingerprint / device PIN; managed in settings.
- **Settings** (`/dashboard/settings`) — account, appearance (theme), notifications, privacy (data export + account deletion), and a security log.
- **Account deletion** — `DELETE /api/user` performs GDPR-style erasure across all user-owned tables; `GET /api/user/export` returns a full data export.

## Password policy

New passwords must be at least 8 characters and contain both letters and a
digit. Enforced server-side in `src/lib/password.ts` (register + change-password)
and mirrored by the client.

## Scripts

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run start      # serve the production build
npx tsc --noEmit   # type-check
```

## Migrations

SQL migrations live in `supabase/migrations/`, applied in filename order. Recent:

- `004_*` — 2FA columns on `user_settings`
- `005_vault_and_passkeys.sql` — `vault_items`, `webauthn_credentials`, `webauthn_challenges`
- `006_email_verification.sql` — `email_verified` on `users`
