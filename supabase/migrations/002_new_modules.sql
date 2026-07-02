-- ─── STRATEGIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategies (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'draft', -- draft | generating | generated | published | archived
  language      TEXT        NOT NULL DEFAULT 'ru',
  questionnaire JSONB       NOT NULL DEFAULT '{}',
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  ai_model      TEXT,
  ai_tokens     INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategies_user   ON strategies(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategies_status ON strategies(user_id, status);

CREATE TABLE IF NOT EXISTS strategy_sections (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID        NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  section_key TEXT        NOT NULL,  -- vision | goals | swot | execution | kpis | risks
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL DEFAULT '',
  data_json   JSONB,
  sort_order  INT         NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategy_sections_strategy ON strategy_sections(strategy_id);

-- ─── BOARD MEETINGS (Executive AI Board) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_meetings (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  agenda        JSONB       NOT NULL DEFAULT '[]',  -- [{title, description}]
  context       JSONB       NOT NULL DEFAULT '{}',  -- KPI snapshot at meeting time
  summary       TEXT,
  ai_tokens     INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_board_meetings_user ON board_meetings(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS board_speeches (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id  UUID        NOT NULL REFERENCES board_meetings(id) ON DELETE CASCADE,
  executive   TEXT        NOT NULL, -- CEO | CFO | COO | CMO | CTO
  round       INT         NOT NULL DEFAULT 1,
  content     TEXT        NOT NULL,
  tokens_used INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_speeches_meeting ON board_speeches(meeting_id);

CREATE TABLE IF NOT EXISTS board_votes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID        NOT NULL REFERENCES board_meetings(id) ON DELETE CASCADE,
  executive  TEXT        NOT NULL,
  vote       TEXT        NOT NULL, -- approve | reject | abstain
  confidence INT,
  rationale  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_votes_meeting ON board_votes(meeting_id);

CREATE TABLE IF NOT EXISTS board_decisions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id  UUID        NOT NULL REFERENCES board_meetings(id) ON DELETE CASCADE,
  verdict     TEXT        NOT NULL, -- approved | rejected | deferred
  votes_for   INT         NOT NULL DEFAULT 0,
  votes_against INT       NOT NULL DEFAULT 0,
  abstentions INT         NOT NULL DEFAULT 0,
  summary     TEXT        NOT NULL,
  action_items JSONB      NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_decisions_meeting ON board_decisions(meeting_id);

-- ─── NOTES (Notepad) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT 'Без названия',
  content    TEXT        NOT NULL DEFAULT '',
  emoji      TEXT,
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  folder     TEXT        NOT NULL DEFAULT 'general',
  is_pinned  BOOLEAN     NOT NULL DEFAULT false,
  is_deleted BOOLEAN     NOT NULL DEFAULT false,
  word_count INT         NOT NULL DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_user    ON notes(user_id, is_deleted, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_folder  ON notes(user_id, folder);
CREATE INDEX IF NOT EXISTS idx_notes_tags    ON notes USING GIN(tags);

-- ─── RISKS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risks (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  category    TEXT        NOT NULL DEFAULT 'operational', -- operational | financial | strategic | legal | technical | reputational
  probability INT         NOT NULL DEFAULT 3, -- 1-5
  impact      INT         NOT NULL DEFAULT 3, -- 1-5
  status      TEXT        NOT NULL DEFAULT 'active', -- active | mitigated | monitoring | closed
  mitigation  TEXT,
  owner       TEXT,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risks_user   ON risks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_risks_score  ON risks(user_id, (probability * impact) DESC);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL DEFAULT '',
  type       TEXT        NOT NULL DEFAULT 'info', -- info | success | warning | error | ai | billing
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  action_url TEXT,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ─── USER SETTINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id       UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language      TEXT        NOT NULL DEFAULT 'ru',
  timezone      TEXT        NOT NULL DEFAULT 'Europe/Moscow',
  theme         TEXT        NOT NULL DEFAULT 'dark',
  ai_model      TEXT        NOT NULL DEFAULT 'claude-sonnet-5',
  email_notifs  BOOLEAN     NOT NULL DEFAULT true,
  push_notifs   BOOLEAN     NOT NULL DEFAULT false,
  two_fa        BOOLEAN     NOT NULL DEFAULT false,
  preferences   JSONB       NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUPPORT TICKETS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject     TEXT        NOT NULL,
  description TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'general', -- general | billing | technical | feature | bug
  priority    TEXT        NOT NULL DEFAULT 'medium',  -- low | medium | high | urgent
  status      TEXT        NOT NULL DEFAULT 'open',    -- open | in_progress | resolved | closed
  ai_response TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_user   ON support_tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status, created_at DESC);
