-- Email verification: records when a user confirmed ownership of their email.
-- NULL = unverified. Set by /api/auth/verify-email when a valid signed link is
-- opened. Safe to run repeatedly.
alter table if exists public.users
  add column if not exists email_verified timestamptz;
