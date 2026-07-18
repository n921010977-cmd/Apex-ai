-- ─── Ask history ────────────────────────────────────────────────────────────
-- Persists every question asked to a director (Спросить/Написать), the whole
-- board (Совет), or an agent, so История диалогов syncs across devices.
-- Auth is enforced at the API layer (session.user.id), matching the other
-- tables in this schema, so no RLS policies are defined here.

CREATE TABLE IF NOT EXISTS ask_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id   TEXT        NOT NULL,               -- localStorage id, for idempotent upserts
  kind        TEXT        NOT NULL,               -- 'agent' | 'council'
  question    TEXT        NOT NULL,
  agent_slug  TEXT,
  agent_name  TEXT,
  agent_role  TEXT,
  color       TEXT,
  answer      TEXT,                               -- single-agent answer
  responses   JSONB,                              -- council: [{role,name,text,color}]
  verdict     TEXT,                               -- council verdict
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX  IF NOT EXISTS idx_ask_history_user   ON ask_history(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ask_history_client ON ask_history(user_id, client_id);
