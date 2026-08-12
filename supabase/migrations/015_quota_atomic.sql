-- ============================================================================
-- 015 — Месячные квоты с атомарной проверкой
-- ============================================================================
-- Проблема, которую решает эта миграция: схема «сначала прочитали счётчик,
-- потом увеличили» позволяет обойти лимит гонкой (10 параллельных запросов
-- читают одно и то же значение и все проходят). Здесь проверка и инкремент —
-- одна атомарная операция БД: `insert ... on conflict do update ... where`.
-- Строка блокируется на время update, поэтому параллельные запросы
-- сериализуются и лимит не пробивается.
--
-- Лог AI-запросов уже есть (ai_requests из 012) — новую таблицу не создаём,
-- только добавляем недостающий индекс.

-- ── 1. Счётчики квот ────────────────────────────────────────────────────────
create table if not exists quota_usage (
  user_id    text not null,
  quota      text not null,           -- aiMessages / pitchDecks / strategies / boardMeetings / weeklyFocus
  period     text not null,           -- расчётный период, напр. '2026-08'
  used       integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, quota, period)
);
create index if not exists quota_usage_user_period_idx on quota_usage (user_id, period);

alter table quota_usage enable row level security;  -- политик нет: только сервер

-- ── 2. Атомарное «проверить и списать» ──────────────────────────────────────
-- p_limit: null = без ограничения, 0 = функция недоступна на тарифе.
-- Возвращает { allowed, used }.
create or replace function consume_quota(
  p_user_id text,
  p_quota   text,
  p_limit   integer,
  p_period  text
) returns jsonb
language plpgsql
security invoker
as $$
declare
  v_used integer;
begin
  if p_limit = 0 then
    return jsonb_build_object('allowed', false, 'used', 0);
  end if;

  insert into quota_usage (user_id, quota, period, used)
       values (p_user_id, p_quota, p_period, 1)
  on conflict (user_id, quota, period) do update
       set used = quota_usage.used + 1, updated_at = now()
     where p_limit is null or quota_usage.used < p_limit
  returning used into v_used;

  -- Строка не вернулась → условие where не выполнилось → лимит исчерпан.
  if v_used is null then
    select used into v_used
      from quota_usage
     where user_id = p_user_id and quota = p_quota and period = p_period;
    return jsonb_build_object('allowed', false, 'used', coalesce(v_used, 0));
  end if;

  return jsonb_build_object('allowed', true, 'used', v_used);
end;
$$;
revoke all on function consume_quota(text, text, integer, text) from public, anon, authenticated;

-- ── 3. Чтение счётчиков без списания (для UI) ───────────────────────────────
create or replace function peek_quota(p_user_id text, p_period text)
returns jsonb
language sql
security invoker
as $$
  select coalesce(jsonb_object_agg(quota, used), '{}'::jsonb)
    from quota_usage
   where user_id = p_user_id and period = p_period;
$$;
revoke all on function peek_quota(text, text) from public, anon, authenticated;

-- ── 4. Недостающий индекс на логе AI ────────────────────────────────────────
create index if not exists ai_requests_user_status_created_idx
  on ai_requests (user_id, status, created_at desc);

-- ── 5. Админская витрина: тариф, срок, расход квоты ─────────────────────────
-- Дополняет view из 012 полями подписки и текущего расхода, чтобы админка
-- показывала «usage / limit / remaining» без отдельных запросов на каждого.
-- drop, а не «create or replace»: набор колонок меняется, а replace умеет
-- только дописывать столбцы в конец.
drop view if exists admin_user_stats;
create view admin_user_stats as
select
  u.id::text                                   as user_id,
  u.email,
  u.name,
  coalesce(sub.plan, u.plan, 'none')           as plan,
  coalesce(sub.status, 'none')                 as sub_status,
  coalesce(sub.expires_at, u.plan_expires_at)  as expires_at,
  u.plan_expires_at,
  u.created_at,
  u.last_login_at,
  coalesce(r.total, 0)                         as requests_total,
  coalesce(r.today, 0)                         as requests_today,
  coalesce(q.used, 0)                          as usage_month,
  coalesce(s.sessions, 0)                      as sessions_count,
  greatest(u.last_login_at, s.last_visit)      as last_visit,
  coalesce(p.revenue, 0)                       as revenue
from users u
left join lateral (
  select plan, status, expires_at from subscriptions sb where sb.user_id = u.id::text limit 1
) sub on true
left join lateral (
  select used from quota_usage qu
   where qu.user_id = u.id::text and qu.quota = 'aiMessages'
     and qu.period = to_char(now(), 'YYYY-MM')
) q on true
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

alter view admin_user_stats set (security_invoker = true);
