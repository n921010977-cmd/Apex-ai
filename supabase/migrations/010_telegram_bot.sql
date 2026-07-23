-- ============================================================================
-- Telegram bot tables — keep the bot's data under the same RLS model as the app.
-- ----------------------------------------------------------------------------
-- The bot (telegram-bot/) connects with a privileged Postgres role (like the
-- app's service-role) which BYPASSES RLS; RLS is still forced here so the public
-- anon key can never read account linkage or one-time codes (both sensitive).
-- Mirrors the lockdown model of 009_rls_lockdown.sql. Idempotent.
-- ============================================================================

-- Telegram account ↔ Vertlix user (one-to-one).
create table if not exists public.telegram_accounts (
  telegram_id            bigint      primary key,
  user_id                uuid        not null references public.users(id) on delete cascade,
  username               text,
  first_name             text,
  language_code          text,
  default_model          text        not null default 'claude-haiku-4-5-20251001',
  active_agent           text        not null default 'ceo',
  active_conversation_id uuid,
  notify_enabled         boolean     not null default true,
  is_blocked             boolean     not null default false,
  created_at             timestamptz not null default now(),
  last_seen_at           timestamptz not null default now()
);
create unique index if not exists telegram_accounts_user_id_key on public.telegram_accounts(user_id);

-- One-time email link codes (HMAC-hashed, TTL + attempt cap enforced in code).
create table if not exists public.telegram_link_codes (
  id          uuid        primary key default gen_random_uuid(),
  telegram_id bigint      not null,
  email       text        not null,
  code_hash   text        not null,
  expires_at  timestamptz not null,
  attempts    int         not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists telegram_link_codes_telegram_id_idx on public.telegram_link_codes(telegram_id);

-- Lock out the anon key (bot's privileged connection bypasses RLS).
alter table public.telegram_accounts   enable row level security;
alter table public.telegram_accounts   force  row level security;
alter table public.telegram_link_codes enable row level security;
alter table public.telegram_link_codes force  row level security;
