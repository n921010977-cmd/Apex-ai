-- ============================================================================
-- 017 — Способ входа и подтверждённость аккаунта
-- ============================================================================
-- Зачем: в админке должно быть видно, каким способом пользователь вошёл.
-- Вход через Google/GitHub сам по себе доказывает, что аккаунт настоящий —
-- провайдер проверяет владельца у себя, выдуманный email так не войдёт.
-- Для email-регистраций признак подлинности — подтверждение почты (is_verified
-- из миграции 001 ставится по ссылке из письма).

alter table users add column if not exists auth_provider text not null default 'email';
-- google / github / email
create index if not exists users_auth_provider_idx on users (auth_provider);

-- Витрина админки: добавляем способ входа и подтверждённость.
-- (drop+create — replace не умеет менять состав колонок, см. 015)
drop view if exists admin_user_stats;
create view admin_user_stats as
select
  u.id::text                                   as user_id,
  u.email,
  u.name,
  coalesce(u.auth_provider, 'email')           as auth_provider,
  coalesce(u.is_verified, false)               as is_verified,
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
