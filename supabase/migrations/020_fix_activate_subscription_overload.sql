-- ============================================================================
-- 020 — Убрать дубль-перегрузку activate_subscription
-- ============================================================================
-- Миграция 019 добавила `p_days` последним параметром через
-- `create or replace function activate_subscription(... 7 параметров ...)`.
-- В Postgres это НЕ заменяет старую 6-параметровую функцию — количество
-- аргументов является частью идентичности функции, поэтому в базе оказались
-- ДВЕ перегрузки одновременно. Вызов без p_days становится неоднозначным
-- (PostgREST не может выбрать, какую из двух вызывать) и падает с ошибкой
-- «function name is not unique» — RPC уходит в catch, тариф не сохраняется
-- в БД и живёт только в памяти процесса (на Vercel это исчезает уже на
-- следующем запросе, даже если пользователь только что получил «активировано»).

drop function if exists activate_subscription(text, text, int, text, numeric, text);

-- Пересоздаём единственную версию — идентична 019, просто теперь она одна.
create or replace function activate_subscription(
  p_user_id    text,
  p_plan       text,
  p_months     int    default 1,
  p_payment_id text   default null,
  p_amount     numeric default null,
  p_currency   text   default 'USD',
  p_days       int    default 0
) returns timestamptz
language plpgsql
security invoker
as $$
declare
  v_base    timestamptz;
  v_expires timestamptz;
begin
  select greatest(coalesce(expires_at, now()), now()) into v_base
    from subscriptions
   where user_id = p_user_id and status = 'active';

  v_base := coalesce(v_base, now());
  if p_days > 0 then
    v_expires := v_base + make_interval(months => greatest(0, p_months), days => p_days);
  else
    v_expires := v_base + make_interval(months => greatest(1, p_months));
  end if;

  insert into subscriptions (user_id, plan, status, payment_id, amount, currency, started_at, expires_at)
  values (p_user_id, p_plan, 'active', p_payment_id, p_amount, p_currency, now(), v_expires)
  on conflict (user_id) do update
    set plan       = excluded.plan,
        status     = 'active',
        payment_id = coalesce(excluded.payment_id, subscriptions.payment_id),
        amount     = coalesce(excluded.amount, subscriptions.amount),
        currency   = coalesce(excluded.currency, subscriptions.currency),
        started_at = coalesce(subscriptions.started_at, now()),
        expires_at = v_expires,
        updated_at = now();

  update users
     set plan = p_plan, plan_started_at = coalesce(plan_started_at, now()), plan_expires_at = v_expires
   where id::text = p_user_id;

  return v_expires;
end;
$$;
revoke all on function activate_subscription(text, text, int, text, numeric, text, int) from public, anon, authenticated;
