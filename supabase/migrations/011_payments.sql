-- ─── Платежи OxaPay ───────────────────────────────────────────────────────────
-- Журнал платежей: создаётся при выставлении счёта (PENDING), обновляется
-- webhook'ом. track_id уникален — это же защита от двойного зачисления.

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  track_id    text not null,
  order_id    text not null,
  plan        text not null check (plan in ('starter','pro','max')),
  amount      numeric(12,2) not null,
  currency    text not null default 'USD',
  status      text not null default 'PENDING'
              check (status in ('PENDING','PAID','FAILED','EXPIRED','CANCELED','AMOUNT_MISMATCH')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Один track_id — один платёж (идемпотентность webhook на уровне БД).
create unique index if not exists payments_track_id_key on payments (track_id);
create index if not exists payments_user_id_idx  on payments (user_id);
create index if not exists payments_order_id_idx on payments (order_id);
create index if not exists payments_status_idx   on payments (status);

-- RLS: таблица доступна только сервису (service_role обходит RLS).
alter table payments enable row level security;
