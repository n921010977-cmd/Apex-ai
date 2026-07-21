-- Avatar: a small resized data URL (or an external image URL) for the profile
-- picture. Referenced by /api/user/avatar and shown on the profile page. The
-- app keeps data-URL avatars out of the auth token to stay under the cookie
-- size limit. Safe to run repeatedly.
alter table if exists public.users
  add column if not exists avatar_url text;
