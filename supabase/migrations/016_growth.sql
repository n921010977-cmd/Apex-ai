-- ============================================================================
-- 016 — Активация, реферальные коды и метрики роста
-- ============================================================================
-- Достраивает воронку до полной цепочки:
--   визит → регистрация → активация → просмотр тарифов → чекаут → оплата
-- Активация — первый полезный результат (успешный AI-запрос), а не просто вход:
-- по ней видно, доносит ли продукт ценность до того, как просить деньги.

-- ── 1. Поля роста на пользователе ───────────────────────────────────────────
alter table users add column if not exists activated_at    timestamptz; -- первый успешный AI-результат
alter table users add column if not exists referral_code   text;        -- собственный код пользователя
alter table users add column if not exists referred_by     text;        -- код того, кто привёл

create index if not exists users_activated_idx    on users (activated_at);
create unique index if not exists users_ref_code_idx on users (referral_code) where referral_code is not null;
create index if not exists users_referred_by_idx  on users (referred_by);

-- ── 2. Отметка активации (идемпотентно — только первый раз) ─────────────────
create or replace function mark_activated(p_user_id text)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_first boolean := false;
begin
  update users
     set activated_at = now()
   where id::text = p_user_id and activated_at is null;
  get diagnostics v_first = row_count;
  return v_first;   -- true, если это была ПЕРВАЯ активация
end;
$$;
revoke all on function mark_activated(text) from public, anon, authenticated;

-- ── 3. Метрики роста: воронка, конверсии, деньги ────────────────────────────
-- Всё считается из фактических таблиц. Там, где данных для честного расчёта
-- недостаточно (например, churn без завершившихся подписок), возвращается null,
-- а интерфейс показывает «—», а не выдуманное число.
create or replace function growth_metrics(p_days int default 30)
returns jsonb
language sql
security invoker
as $$
with span as (select (now() - make_interval(days => greatest(1, p_days))) as since),
funnel as (
  select
    (select count(distinct coalesce(user_id, metadata->>'anon_id'))
       from user_events, span
      where event_name in ('visit','landing_view') and created_at >= span.since)      as visitors,
    (select count(*) from users, span where created_at >= span.since)                  as signups,
    (select count(*) from users, span where activated_at is not null
       and activated_at >= span.since)                                                 as activated,
    (select count(distinct user_id) from user_events, span
      where event_name = 'pricing_view' and created_at >= span.since)                  as pricing_views,
    (select count(distinct user_id) from user_events, span
      where event_name = 'checkout_started' and created_at >= span.since)              as checkouts,
    (select count(distinct user_id) from payments, span
      where status = 'PAID' and created_at >= span.since)                              as paid
),
money as (
  select
    (select count(distinct user_id) from subscriptions
      where status = 'active' and (expires_at is null or expires_at > now()))          as active_subs,
    -- MRR: сумма месячных цен активных подписок. Если активных нет — 0, не выдумка.
    (select coalesce(sum(case plan when 'starter' then 29 when 'pro' then 39 when 'max' then 49 else 0 end), 0)
       from subscriptions
      where status = 'active' and (expires_at is null or expires_at > now()))          as mrr,
    (select coalesce(sum(amount), 0) from payments where status = 'PAID')              as revenue_total,
    (select coalesce(sum(amount), 0) from payments, span
      where status = 'PAID' and created_at >= span.since)                              as revenue_period,
    -- Отток: подписки, истёкшие за период и не продлённые до сих пор.
    (select count(*) from subscriptions, span
      where expires_at is not null and expires_at < now() and expires_at >= span.since
        and status <> 'active')                                                        as churned
)
select jsonb_build_object(
  'days', p_days,
  'funnel', jsonb_build_object(
    'visitors', funnel.visitors, 'signups', funnel.signups, 'activated', funnel.activated,
    'pricing_views', funnel.pricing_views, 'checkouts', funnel.checkouts, 'paid', funnel.paid
  ),
  'revenue', jsonb_build_object(
    'mrr', money.mrr,
    'total', money.revenue_total,
    'period', money.revenue_period,
    'paid_users', money.active_subs,
    -- ARPU считаем только когда есть на что делить.
    'arpu', case when money.active_subs > 0
                 then round(money.mrr::numeric / money.active_subs, 2) else null end,
    'churned', money.churned,
    'churn_rate', case when (money.active_subs + money.churned) > 0
                       then round(money.churned * 100.0 / (money.active_subs + money.churned), 1)
                       else null end
  )
) from funnel, money;
$$;
revoke all on function growth_metrics(int) from public, anon, authenticated;

-- ── 4. Когорты по месяцу регистрации ────────────────────────────────────────
create or replace function cohort_metrics(p_months int default 6)
returns jsonb
language sql
security invoker
as $$
select coalesce(jsonb_agg(row_to_json(c) order by c.cohort), '[]'::jsonb) from (
  select to_char(date_trunc('month', u.created_at), 'YYYY-MM')            as cohort,
         count(*)                                                        as signups,
         count(*) filter (where u.activated_at is not null)              as activated,
         count(*) filter (where exists (
           select 1 from payments p where p.user_id = u.id::text and p.status = 'PAID'
         ))                                                              as paid
    from users u
   where u.created_at >= date_trunc('month', now()) - make_interval(months => greatest(1, p_months))
   group by 1
) c;
$$;
revoke all on function cohort_metrics(int) from public, anon, authenticated;
