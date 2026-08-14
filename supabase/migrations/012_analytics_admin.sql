-- ============================================================================
-- 012 — Аналитика пользователей и админ-панель
-- ============================================================================
-- Модель доступа как в 009: NextAuth (не Supabase Auth), поэтому политики на
-- auth.uid() бессмысленны. RLS ВКЛЮЧЁН без политик → anon-ключ не читает и не
-- пишет ничего; сервер ходит с SERVICE ROLE (обходит RLS), авторизация — в API.
-- Всё идемпотентно (if not exists) и не трогает существующие данные.
-- ============================================================================

-- ── 1. users: поля тарифа, активности и админ-флаг ──────────────────────────
alter table users add column if not exists is_admin            boolean not null default false;
alter table users add column if not exists plan                text;
alter table users add column if not exists plan_started_at     timestamptz;
alter table users add column if not exists plan_expires_at     timestamptz;
alter table users add column if not exists last_login_at       timestamptz;
alter table users add column if not exists last_ai_request_at  timestamptz;
alter table users add column if not exists ai_requests_count   bigint not null default 0;

create index if not exists users_plan_idx       on users (plan);
create index if not exists users_last_login_idx on users (last_login_at);

-- ── 2. ai_requests: каждый AI-вызов ─────────────────────────────────────────
-- Промпты/ответы НЕ храним (приватность) — только метаданные.
create table if not exists ai_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  created_at       timestamptz not null default now(),
  model            text,
  feature          text not null,            -- chat / pitch_deck / strategy / board_meeting / weekly_focus
  status           text not null default 'ok' check (status in ('ok','error')),
  tokens_used      integer,
  response_time_ms integer,
  error_message    text
);
create index if not exists ai_requests_user_created_idx on ai_requests (user_id, created_at desc);
create index if not exists ai_requests_created_idx      on ai_requests (created_at);
create index if not exists ai_requests_status_idx       on ai_requests (status);
create index if not exists ai_requests_feature_idx      on ai_requests (feature);

-- ── 3. user_sessions: визиты (30 минут неактивности = новая сессия) ─────────
create table if not exists user_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  started_at       timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  ended_at         timestamptz,
  device_type      text,
  browser          text,
  os               text
);
create index if not exists user_sessions_user_idx     on user_sessions (user_id, started_at desc);
create index if not exists user_sessions_activity_idx on user_sessions (last_activity_at);

-- ── 4. page_views ───────────────────────────────────────────────────────────
create table if not exists page_views (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  session_id uuid references user_sessions(id) on delete set null,
  path       text not null,
  created_at timestamptz not null default now()
);
create index if not exists page_views_user_idx    on page_views (user_id, created_at desc);
create index if not exists page_views_created_idx on page_views (created_at);
create index if not exists page_views_path_idx    on page_views (path);

-- ── 5. payments: провайдер (таблица создана в 011) ──────────────────────────
alter table payments add column if not exists provider text not null default 'oxapay';

-- ── 6. RLS: запрет anon на все новые таблицы ────────────────────────────────
alter table ai_requests   enable row level security;
alter table user_sessions enable row level security;
alter table page_views    enable row level security;

-- ── 7. Инкремент счётчика AI-запросов (атомарно, вызывается сервером) ───────
create or replace function bump_ai_usage(p_user_id text)
returns void
language sql
security invoker
as $$
  update users
     set ai_requests_count  = coalesce(ai_requests_count, 0) + 1,
         last_ai_request_at = now()
   where id::text = p_user_id;
$$;
revoke all on function bump_ai_usage(text) from public, anon, authenticated;

-- ── 8. Пер-пользовательские агрегаты для /admin/users (одним запросом) ──────
-- drop+create, а не `or replace`: миграция 015 расширяет набор колонок,
-- а replace не умеет менять их состав при повторном прогоне цепочки.
drop view if exists admin_user_stats;
create view admin_user_stats as
select
  u.id::text                                   as user_id,
  u.email,
  u.name,
  coalesce(u.plan, 'none')                     as plan,
  u.plan_expires_at,
  u.created_at,
  u.last_login_at,
  coalesce(r.total, 0)                         as requests_total,
  coalesce(r.today, 0)                         as requests_today,
  coalesce(s.sessions, 0)                      as sessions_count,
  greatest(u.last_login_at, s.last_visit)      as last_visit,
  coalesce(p.revenue, 0)                       as revenue
from users u
left join lateral (
  select count(*)                                              as total,
         count(*) filter (where created_at >= date_trunc('day', now())) as today
  from ai_requests a where a.user_id = u.id::text
) r on true
left join lateral (
  select count(*) as sessions, max(last_activity_at) as last_visit
  from user_sessions us where us.user_id = u.id::text
) s on true
left join lateral (
  select sum(amount) as revenue
  from payments pay where pay.user_id = u.id::text and pay.status = 'PAID'
) p on true;

-- security_invoker: у anon нет прав на подлежащие таблицы → view для него закрыт.
alter view admin_user_stats set (security_invoker = true);

-- ── 9. Сводка для дашборда одним RPC (без тысячи запросов) ──────────────────
create or replace function admin_overview()
returns jsonb
language sql
security invoker
as $$
select jsonb_build_object(
  'users_total',      (select count(*) from users),
  'users_today',      (select count(*) from users where created_at >= date_trunc('day', now())),
  'users_week',       (select count(*) from users where created_at >= now() - interval '7 days'),
  'users_month',      (select count(*) from users where created_at >= now() - interval '30 days'),
  'active_today',     (select count(distinct user_id) from user_sessions where last_activity_at >= date_trunc('day', now())),
  'active_week',      (select count(distinct user_id) from user_sessions where last_activity_at >= now() - interval '7 days'),
  'ai_total',         (select count(*) from ai_requests),
  'ai_today',         (select count(*) from ai_requests where created_at >= date_trunc('day', now())),
  'ai_week',          (select count(*) from ai_requests where created_at >= now() - interval '7 days'),
  'ai_month',         (select count(*) from ai_requests where created_at >= now() - interval '30 days'),
  'ai_errors_week',   (select count(*) from ai_requests where status = 'error' and created_at >= now() - interval '7 days'),
  'revenue_total',    (select coalesce(sum(amount),0) from payments where status = 'PAID'),
  'revenue_month',    (select coalesce(sum(amount),0) from payments where status = 'PAID' and created_at >= now() - interval '30 days'),
  'paying_users',     (select count(distinct user_id) from payments where status = 'PAID'),
  'plan_distribution',(select coalesce(jsonb_object_agg(plan, cnt), '{}'::jsonb) from
                        (select coalesce(plan,'none') as plan, count(*) as cnt from users group by 1) d),
  'signups_by_day',   (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from
                        (select date_trunc('day', created_at)::date as d, count(*) as n
                         from users where created_at >= now() - interval '30 days' group by 1) t),
  'ai_by_day',        (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from
                        (select date_trunc('day', created_at)::date as d, count(*) as n
                         from ai_requests where created_at >= now() - interval '30 days' group by 1) t),
  'revenue_by_day',   (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from
                        (select date_trunc('day', created_at)::date as d, sum(amount) as n
                         from payments where status = 'PAID' and created_at >= now() - interval '30 days' group by 1) t)
);
$$;
revoke all on function admin_overview() from public, anon, authenticated;
