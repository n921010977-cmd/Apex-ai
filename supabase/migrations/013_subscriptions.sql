-- ============================================================================
-- 013 — Подписки (долговременный источник правды)
-- ============================================================================
-- До этой миграции оплаченный тариф жил в Upstash/памяти процесса и мог
-- потеряться при редеплое. Теперь подписка хранится в БД: одна активная строка
-- на пользователя, продление НЕ обнуляет остаток (expires_at сдвигается от
-- большей из дат: текущего окончания или now()).
--
-- Модель доступа как во всём проекте (см. 009/012): авторизация — NextAuth,
-- поэтому RLS включён БЕЗ политик → anon-ключ не может ни читать, ни писать;
-- сервер работает service-role ключом, проверки — в API. Пользователь не может
-- поменять plan/status/expires_at/payment_id из браузера.

create table if not exists subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  plan        text not null check (plan in ('starter','pro','max')),
  status      text not null default 'pending' check (status in ('pending','active','expired','canceled')),
  payment_id  text,                         -- track_id платежа OxaPay
  amount      numeric(12,2),
  currency    text default 'USD',
  started_at  timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Одна строка подписки на пользователя (продление обновляет её же).
create unique index if not exists subscriptions_user_key       on subscriptions (user_id);
-- Один платёж не может создать две подписки (идемпотентность webhook).
create unique index if not exists subscriptions_payment_id_key on subscriptions (payment_id) where payment_id is not null;
create index if not exists subscriptions_status_idx  on subscriptions (status);
create index if not exists subscriptions_expires_idx on subscriptions (expires_at);
create index if not exists subscriptions_plan_idx    on subscriptions (plan);

alter table subscriptions enable row level security;

-- ── Активация/продление одной атомарной операцией ───────────────────────────
-- Возвращает итоговую дату окончания. Если подписка ещё действует — новый срок
-- прибавляется к остатку, а не затирает его.
create or replace function activate_subscription(
  p_user_id    text,
  p_plan       text,
  p_months     int    default 1,
  p_payment_id text   default null,
  p_amount     numeric default null,
  p_currency   text   default 'USD'
) returns timestamptz
language plpgsql
security invoker
as $$
declare
  v_base    timestamptz;
  v_expires timestamptz;
begin
  -- Точка отсчёта: остаток текущей активной подписки или «сейчас».
  select greatest(coalesce(expires_at, now()), now()) into v_base
    from subscriptions
   where user_id = p_user_id and status = 'active';

  v_base := coalesce(v_base, now());
  v_expires := v_base + make_interval(months => greatest(1, p_months));

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

  -- Зеркалим в users для админки/аналитики.
  update users
     set plan = p_plan, plan_started_at = coalesce(plan_started_at, now()), plan_expires_at = v_expires
   where id::text = p_user_id;

  return v_expires;
end;
$$;
revoke all on function activate_subscription(text, text, int, text, numeric, text) from public, anon, authenticated;
