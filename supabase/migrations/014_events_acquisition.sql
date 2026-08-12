-- ============================================================================
-- 014 — События продукта, источник привлечения и воронка конверсии
-- ============================================================================
-- Дополняет 012 (ai_requests / user_sessions / page_views): единая лента
-- событий + UTM-источник пользователя + агрегаты для админки одним RPC.
-- RLS как везде: включён без политик → anon-ключ не имеет доступа, пишет и
-- читает только сервер (service role), проверки — в API.

-- ── 1. Единая лента событий ─────────────────────────────────────────────────
create table if not exists user_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    text,                    -- null для анонимных (visit до регистрации)
  event_name text not null,           -- signup / login / pricing_view / checkout_started / payment_success / ...
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists user_events_user_created_idx on user_events (user_id, created_at desc);
create index if not exists user_events_name_created_idx on user_events (event_name, created_at desc);
create index if not exists user_events_created_idx      on user_events (created_at);

alter table user_events enable row level security;

-- ── 2. Источник привлечения на пользователе ─────────────────────────────────
alter table users add column if not exists utm_source   text;
alter table users add column if not exists utm_medium   text;
alter table users add column if not exists utm_campaign text;
alter table users add column if not exists utm_content  text;
alter table users add column if not exists utm_term     text;
alter table users add column if not exists landing_page text;
alter table users add column if not exists referrer     text;

create index if not exists users_utm_source_idx on users (utm_source);

-- ── 3. Сводка аналитики одним запросом (период задаётся в днях) ─────────────
-- Возвращает воронку, источники и ряды для графиков — чтобы дашборд не делал
-- десятки запросов.
create or replace function analytics_overview(p_days int default 30)
returns jsonb
language sql
security invoker
as $$
with span as (select (now() - make_interval(days => greatest(1, p_days))) as since)
select jsonb_build_object(
  'days', p_days,

  -- Воронка: посетители → регистрации → начатые оплаты → успешные платежи
  'funnel', jsonb_build_object(
    'visitors',  (select count(distinct coalesce(user_id, metadata->>'anon_id'))
                    from user_events, span
                   where event_name = 'visit' and created_at >= span.since),
    'signups',   (select count(*) from users, span where created_at >= span.since),
    'checkouts', (select count(distinct user_id) from user_events, span
                   where event_name = 'checkout_started' and created_at >= span.since),
    'payments',  (select count(distinct user_id) from payments, span
                   where status = 'PAID' and created_at >= span.since)
  ),

  -- Источники привлечения зарегистрированных пользователей
  'sources', (select coalesce(jsonb_agg(row_to_json(t) order by t.n desc), '[]'::jsonb) from (
      select coalesce(nullif(utm_source, ''), 'direct') as source,
             count(*) as n,
             count(*) filter (where plan is not null and plan <> 'none') as paid
        from users, span
       where created_at >= span.since
       group by 1 order by n desc limit 12) t),

  -- AI-использование
  'ai', jsonb_build_object(
    'total',  (select count(*) from ai_requests, span where created_at >= span.since),
    'failed', (select count(*) from ai_requests, span where status = 'error' and created_at >= span.since),
    'users',  (select count(distinct user_id) from ai_requests, span where created_at >= span.since),
    'by_feature', (select coalesce(jsonb_object_agg(feature, n), '{}'::jsonb) from (
        select feature, count(*) as n from ai_requests, span
         where created_at >= span.since group by 1 order by n desc limit 10) f),
    'by_model', (select coalesce(jsonb_object_agg(coalesce(model,'default'), n), '{}'::jsonb) from (
        select model, count(*) as n from ai_requests, span
         where created_at >= span.since group by 1 order by n desc limit 10) m)
  ),

  -- Деньги (только подтверждённые платежи)
  'revenue', jsonb_build_object(
    'total',  (select coalesce(sum(amount),0) from payments where status = 'PAID'),
    'period', (select coalesce(sum(amount),0) from payments, span where status = 'PAID' and created_at >= span.since),
    'today',  (select coalesce(sum(amount),0) from payments where status = 'PAID' and created_at >= date_trunc('day', now())),
    'by_plan',(select coalesce(jsonb_object_agg(plan, s), '{}'::jsonb) from (
        select plan, sum(amount) as s from payments where status = 'PAID' group by 1) r)
  ),

  -- Ряды для графиков
  'series', jsonb_build_object(
    'signups', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(*) as n
          from users, span where created_at >= span.since group by 1) t),
    'ai', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(*) as n
          from ai_requests, span where created_at >= span.since group by 1) t),
    'revenue', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, sum(amount) as n
          from payments, span where status = 'PAID' and created_at >= span.since group by 1) t),
    'paying_users', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(distinct user_id) as n
          from payments, span where status = 'PAID' and created_at >= span.since group by 1) t)
  )
);
$$;
revoke all on function analytics_overview(int) from public, anon, authenticated;

-- ── 4. Реальное удержание (D1 / D7 / D30) ───────────────────────────────────
-- Когорта = пользователи, зарегистрированные достаточно давно, чтобы окно
-- успело наступить. Вернулся = была сессия в сутки N после регистрации.
-- Никаких «примерно 65%»: если когорта пуста, возвращаем null и UI покажет «—».
create or replace function retention_rates()
returns jsonb
language sql
security invoker
as $$
with u as (select id, created_at from users),
     r as (
       select d.n,
              count(*) filter (where exists (
                select 1 from user_sessions s
                 where s.user_id = u.id
                   and s.started_at >= u.created_at + make_interval(days => d.n)
                   and s.started_at <  u.created_at + make_interval(days => d.n + 1)
              )) as returned,
              count(*) as cohort
         from (values (1),(7),(30)) as d(n)
         join u on u.created_at <= now() - make_interval(days => d.n + 1)
        group by d.n
     )
select jsonb_object_agg('d' || n,
         case when cohort > 0 then round(returned * 100.0 / cohort) else null end)
  from r;
$$;
revoke all on function retention_rates() from public, anon, authenticated;

-- ── 5. Вовлечённость: длительность сессий, просмотры, отказы ─────────────────
create or replace function engagement_stats()
returns jsonb
language sql
security invoker
as $$
select jsonb_build_object(
  'sessions_today', (select count(*) from user_sessions where started_at >= date_trunc('day', now())),
  -- Средняя длительность сессии в минутах (по разнице последней активности и старта)
  'avg_session_min', (
    select coalesce(round(avg(extract(epoch from (last_activity_at - started_at)) / 60.0)::numeric, 1), 0)
      from user_sessions where started_at >= now() - interval '7 days'
  ),
  'page_views_today', (select count(*) from page_views where created_at >= date_trunc('day', now())),
  -- Отказ = сессия ровно с одним просмотром страницы
  'bounce_rate', (
    select case when count(*) > 0
           then round(count(*) filter (where pv = 1) * 100.0 / count(*))
           else 0 end
      from (select s.id, count(p.id) as pv
              from user_sessions s left join page_views p on p.session_id = s.id
             where s.started_at >= now() - interval '7 days'
             group by s.id) q
  )
);
$$;
revoke all on function engagement_stats() from public, anon, authenticated;
