-- User-created / cloned agents and agent favorites — previously localStorage-only.
-- Custom agents are stored as a JSON blob keyed by the client-generated id, so
-- the full agent persona round-trips without modelling every field as a column.

create table if not exists public.custom_agents (
  id          text not null,
  user_id     uuid not null,
  data        jsonb not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  primary key (user_id, id)
);

create index if not exists custom_agents_user_idx on public.custom_agents(user_id);

-- Favorited agent ids (canonical or custom) live on the user's settings row.
alter table if exists public.user_settings
  add column if not exists fav_agents text[] default '{}';
