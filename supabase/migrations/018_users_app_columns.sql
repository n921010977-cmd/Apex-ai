-- ============================================================================
-- 018 — Недостающие колонки users, которые пишет приложение
-- ============================================================================
-- С подключением настоящей базы вскрылось: регистрация (role/tier/лимиты
-- отчётов) и OAuth-вход (image) вставляют колонки, которых не было в схеме,
-- и падали с «column does not exist» → пользователь видел «Ошибка сервера».

alter table users add column if not exists role                    text not null default 'FREE';
alter table users add column if not exists tier                    text not null default 'FREE';
alter table users add column if not exists max_reports_per_month   integer not null default 3;
alter table users add column if not exists reports_generated_month integer not null default 0;
alter table users add column if not exists limit_reset_date        timestamptz;
alter table users add column if not exists image                   text;   -- аватар из OAuth (Google/GitHub)
