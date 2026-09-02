-- ============================================================================
-- 019 — Тариф Basic в БД + выдача тарифа промокодом на дни
-- ============================================================================
-- Тариф Basic ($5) добавлен в код (plans.ts) позже, чем писались миграции
-- 011/013 — их CHECK-ограничения разрешали только starter/pro/max. Без этой
-- миграции реальная оплата Basic (или выдача его промокодом) падала бы прямо
-- в БД с constraint violation, а activate_subscription молча уходила в catch
-- в entitlement.ts — тариф выдавался бы только из памяти процесса и терялся
-- при следующем деплое.
--
-- Заодно: activate_subscription умела продлевать только целыми месяцами
-- (make_interval(months => greatest(1, p_months))) — для промокода на неделю
-- нужна выдача днями. Добавлен p_days с тем же принципом «остаток не
-- обнуляется»: новый срок = max(текущий expires_at, now()) + месяцы + дни.

alter table payments      drop constraint if exists payments_plan_check;
alter table payments      add constraint payments_plan_check      check (plan in ('basic','starter','pro','max'));

alter table subscriptions drop constraint if exists subscriptions_plan_check;
alter table subscriptions add constraint subscriptions_plan_check check (plan in ('basic','starter','pro','max'));

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
  -- p_days > 0 — точечная выдача (промокод): месяцы не навязываем.
  -- Иначе — обычная оплата, минимум 1 месяц, как и раньше.
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
