-- ============================================================================
-- VERTLIX AI — ПОЛНАЯ УСТАНОВКА БАЗЫ (миграции 001–018 одним файлом)
-- ============================================================================
-- Как применить: Supabase → SQL Editor → New query → вставить ЦЕЛИКОМ → Run.
-- Файл можно запускать повторно: уже созданные объекты пропускаются.
-- Файл 001_init.sql из репозитория намеренно НЕ включён — это ранняя legacy-
-- схема на auth.users, приложение использует собственную таблицу users.
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 001_initial_schema.sql                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan TEXT DEFAULT 'free', -- free / pro / business
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);

-- ─── MEMBERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner / admin / member / viewer
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user_org ON members(user_id, organization_id);

-- ─── AGENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'custom', -- sales / support / coding / marketing / custom / CEO / CFO / CMO / COO / CTO / analyst / legal
  system_prompt TEXT,
  model TEXT DEFAULT 'claude-haiku-4-5-20251001',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 4000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);

-- ─── AGENT TOOLS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- search / email / create_task / database_query
  description TEXT,
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_tools_agent ON agent_tools(agent_id);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  stage TEXT,
  goals JSONB DEFAULT '[]',
  target_revenue TEXT,
  timeframe TEXT DEFAULT '12',
  overall_score INT DEFAULT 0,
  status TEXT DEFAULT 'active', -- active / archived / analyzing
  ai_results JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ─── CONVERSATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT DEFAULT 'active', -- active / archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user / assistant / system / tool
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- ─── AGENT MEMORY (RAG / vector search) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_memory_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_memory_agent ON agent_memory_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_org ON agent_memory_chunks(organization_id);
-- Vector index for similarity search (HNSW)
CREATE INDEX IF NOT EXISTS idx_memory_embedding ON agent_memory_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── TASKS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- todo / in_progress / done
  priority TEXT DEFAULT 'medium', -- low / medium / high
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ─── TOOL CALLS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  status TEXT DEFAULT 'running', -- success / error / running
  execution_time_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tool_calls_agent ON tool_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_conversation ON tool_calls(conversation_id);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
-- (legacy-таблица subscriptions удалена из установки; настоящую создаёт секция 013)

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount INT,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'unpaid', -- paid / unpaid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);

-- ─── USAGE STATS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_count INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  agent_runs INT DEFAULT 0,
  tool_calls INT DEFAULT 0,
  UNIQUE(organization_id, date)
);
CREATE INDEX IF NOT EXISTS idx_usage_org_date ON usage_stats(organization_id, date);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- login / message / agent_run / billing / project_create
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(type);

-- ─── API KEYS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS "users_self" ON users;
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid()::text = id::text);

-- Members can access their organization data
DROP POLICY IF EXISTS "org_members_access" ON organizations;
CREATE POLICY "org_members_access" ON organizations
  FOR ALL USING (
    id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
  );

DROP POLICY IF EXISTS "members_access" ON members;
CREATE POLICY "members_access" ON members
  FOR ALL USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "projects_access" ON projects;
CREATE POLICY "projects_access" ON projects
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
    OR user_id::text = auth.uid()::text
  );

DROP POLICY IF EXISTS "agents_access" ON agents;
CREATE POLICY "agents_access" ON agents
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
  );

DROP POLICY IF EXISTS "conversations_access" ON conversations;
CREATE POLICY "conversations_access" ON conversations
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
    OR user_id::text = auth.uid()::text
  );

DROP POLICY IF EXISTS "messages_access" ON messages;
CREATE POLICY "messages_access" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "tasks_access" ON tasks;
CREATE POLICY "tasks_access" ON tasks
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
  );

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_orgs_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_agents_updated BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 002_new_modules.sql                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 003_ask_history.sql                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 004_two_factor_auth.sql                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Real TOTP-based 2FA storage. The secret is encrypted at rest by the
-- application (AES-256-GCM, src/lib/crypto/encryption.ts) before being
-- written here — this column never holds a plaintext secret. Backup codes
-- are stored as bcrypt hashes, one-time-use, removed on redemption.
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS two_fa_secret_enc   TEXT,
  ADD COLUMN IF NOT EXISTS two_fa_backup_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS two_fa_verified_at   TIMESTAMPTZ;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 005_vault_and_passkeys.sql                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ─── VAULT ITEMS ──────────────────────────────────────────────────────────────
-- Server-side persistence for the Knowledge Vault (previously localStorage-only).
CREATE TABLE IF NOT EXISTS vault_items (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'doc',   -- doc | note | memory | project | report
  title      TEXT        NOT NULL DEFAULT 'Без названия',
  content    TEXT        NOT NULL DEFAULT '',
  source     TEXT        NOT NULL DEFAULT 'Добавлено вручную',
  tags       TEXT[]      NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vault_user ON vault_items(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_tags ON vault_items USING GIN(tags);

-- ─── WEBAUTHN / PASSKEYS ──────────────────────────────────────────────────────
-- One row per registered passkey (device biometric / security key). The public
-- key and metadata are non-secret — passkeys have no server-held secret to leak.
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id             TEXT        PRIMARY KEY,          -- base64url credential ID
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key     TEXT        NOT NULL,             -- base64url COSE public key
  counter        BIGINT      NOT NULL DEFAULT 0,   -- signature counter (clone detection)
  transports     TEXT[]      NOT NULL DEFAULT '{}',
  device_label   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);

-- Transient challenge storage for the WebAuthn ceremony (short-lived, one-shot).
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  email      TEXT,                                 -- for login before user is known
  challenge  TEXT        NOT NULL,
  kind       TEXT        NOT NULL,                 -- 'register' | 'authenticate'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenge_email ON webauthn_challenges(email);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 006_email_verification.sql                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Email verification: records when a user confirmed ownership of their email.
-- NULL = unverified. Set by /api/auth/verify-email when a valid signed link is
-- opened. Safe to run repeatedly.
alter table if exists public.users
  add column if not exists email_verified timestamptz;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 007_avatar.sql                                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Avatar: a small resized data URL (or an external image URL) for the profile
-- picture. Referenced by /api/user/avatar and shown on the profile page. The
-- app keeps data-URL avatars out of the auth token to stay under the cookie
-- size limit. Safe to run repeatedly.
alter table if exists public.users
  add column if not exists avatar_url text;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 008_custom_agents.sql                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 009_rls_lockdown.sql                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ============================================================================
-- RLS LOCKDOWN — deny the public anon key direct access to every table.
-- ============================================================================
--
-- WHY: NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the browser. With RLS off (or
-- missing on newer tables), anyone could take that key and query the database
-- directly — reading every user's notes, vault items, reports, etc. — bypassing
-- all of the app's API-layer checks.
--
-- MODEL: this app authenticates with NextAuth (not Supabase Auth), so the old
-- `auth.uid()` policies can never match (there is no Supabase session — auth.uid()
-- is always NULL). Instead:
--   • RLS is ENABLED on every table with NO policy granting `anon` → the anon
--     key is denied all access.
--   • The server uses the SERVICE ROLE key (SUPABASE_SERVICE_ROLE_KEY), which
--     bypasses RLS. Authorization is enforced in the API routes by scoping every
--     query with user_id / organization_id (audited).
--
-- ⚠️  DEPLOY ORDER: set SUPABASE_SERVICE_ROLE_KEY in the server environment
--     BEFORE (or together with) applying this migration. If RLS is on but the
--     server still uses the anon key, every query is denied and the app breaks.
--
-- Idempotent: enabling RLS twice is a no-op. `if exists` skips tables a given
-- deployment doesn't have.
-- ============================================================================

do $$
declare
  t text;
  tables text[] := array[
    'users','organizations','members','projects','agents','conversations',
    'messages','memory_chunks','agent_memory_chunks','agent_tools','tool_calls',
    'usage_stats','tasks','subscriptions','invoices','activity_logs','api_keys',
    'ask_history','board_decisions','board_meetings','board_speeches','board_votes',
    'custom_agents','notes','notifications','risks','strategies','strategy_sections',
    'support_tickets','user_settings','vault_items','webauthn_challenges',
    'webauthn_credentials'
  ];
begin
  foreach t in array tables loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);
      -- Force RLS even for the table owner, closing the owner-bypass gap.
      execute format('alter table public.%I force row level security;', t);
    end if;
  end loop;
end $$;

-- No `create policy ... to anon` statements anywhere: with RLS enabled and no
-- permissive policy, the anon (and authenticated) roles are denied. Only the
-- service_role — used exclusively server-side — bypasses RLS.


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 010_telegram_bot.sql                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ============================================================================
-- Telegram bot tables — keep the bot's data under the same RLS model as the app.
-- ----------------------------------------------------------------------------
-- The bot (telegram-bot/) connects with a privileged Postgres role (like the
-- app's service-role) which BYPASSES RLS; RLS is still forced here so the public
-- anon key can never read account linkage or one-time codes (both sensitive).
-- Mirrors the lockdown model of 009_rls_lockdown.sql. Idempotent.
-- ============================================================================

-- Telegram account ↔ Vertlix user (one-to-one).
create table if not exists public.telegram_accounts (
  telegram_id            bigint      primary key,
  user_id                uuid        not null references public.users(id) on delete cascade,
  username               text,
  first_name             text,
  language_code          text,
  default_model          text        not null default 'claude-haiku-4-5-20251001',
  active_agent           text        not null default 'ceo',
  active_conversation_id uuid,
  notify_enabled         boolean     not null default true,
  is_blocked             boolean     not null default false,
  created_at             timestamptz not null default now(),
  last_seen_at           timestamptz not null default now()
);
create unique index if not exists telegram_accounts_user_id_key on public.telegram_accounts(user_id);

-- One-time email link codes (HMAC-hashed, TTL + attempt cap enforced in code).
create table if not exists public.telegram_link_codes (
  id          uuid        primary key default gen_random_uuid(),
  telegram_id bigint      not null,
  email       text        not null,
  code_hash   text        not null,
  expires_at  timestamptz not null,
  attempts    int         not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists telegram_link_codes_telegram_id_idx on public.telegram_link_codes(telegram_id);

-- Lock out the anon key (bot's privileged connection bypasses RLS).
alter table public.telegram_accounts   enable row level security;
alter table public.telegram_accounts   force  row level security;
alter table public.telegram_link_codes enable row level security;
alter table public.telegram_link_codes force  row level security;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 011_payments.sql                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 012_analytics_admin.sql                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ============================================================================
-- 012 — Аналитика пользователей и админ-панель
-- ============================================================================
-- Модель доступа как в 009: NextAuth (не Supabase Auth), поэтому политики на
-- auth.uid() бессмысленны. RLS ВКЛЮЧЁН без политик → anon-ключ не читает и не
-- пишет ничего; сервер ходит с SERVICE ROLE (обходит RLS), авторизация — в API.
-- Всё идемпотентно (if not exists) и не трогает существующие данные.
-- ============================================================================

-- ── 1. users: поля тарифа, активности и админ-флаг ──────────────────────────
alter table users add column if not exists is_admin            boolean not null default false;
alter table users add column if not exists plan                text;
alter table users add column if not exists plan_started_at     timestamptz;
alter table users add column if not exists plan_expires_at     timestamptz;
alter table users add column if not exists last_login_at       timestamptz;
alter table users add column if not exists last_ai_request_at  timestamptz;
alter table users add column if not exists ai_requests_count   bigint not null default 0;

create index if not exists users_plan_idx       on users (plan);
create index if not exists users_last_login_idx on users (last_login_at);

-- ── 2. ai_requests: каждый AI-вызов ─────────────────────────────────────────
-- Промпты/ответы НЕ храним (приватность) — только метаданные.
create table if not exists ai_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  created_at       timestamptz not null default now(),
  model            text,
  feature          text not null,            -- chat / pitch_deck / strategy / board_meeting / weekly_focus
  status           text not null default 'ok' check (status in ('ok','error')),
  tokens_used      integer,
  response_time_ms integer,
  error_message    text
);
create index if not exists ai_requests_user_created_idx on ai_requests (user_id, created_at desc);
create index if not exists ai_requests_created_idx      on ai_requests (created_at);
create index if not exists ai_requests_status_idx       on ai_requests (status);
create index if not exists ai_requests_feature_idx      on ai_requests (feature);

-- ── 3. user_sessions: визиты (30 минут неактивности = новая сессия) ─────────
create table if not exists user_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  started_at       timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  ended_at         timestamptz,
  device_type      text,
  browser          text,
  os               text
);
create index if not exists user_sessions_user_idx     on user_sessions (user_id, started_at desc);
create index if not exists user_sessions_activity_idx on user_sessions (last_activity_at);

-- ── 4. page_views ───────────────────────────────────────────────────────────
create table if not exists page_views (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  session_id uuid references user_sessions(id) on delete set null,
  path       text not null,
  created_at timestamptz not null default now()
);
create index if not exists page_views_user_idx    on page_views (user_id, created_at desc);
create index if not exists page_views_created_idx on page_views (created_at);
create index if not exists page_views_path_idx    on page_views (path);

-- ── 5. payments: провайдер (таблица создана в 011) ──────────────────────────
alter table payments add column if not exists provider text not null default 'oxapay';

-- ── 6. RLS: запрет anon на все новые таблицы ────────────────────────────────
alter table ai_requests   enable row level security;
alter table user_sessions enable row level security;
alter table page_views    enable row level security;

-- ── 7. Инкремент счётчика AI-запросов (атомарно, вызывается сервером) ───────
create or replace function bump_ai_usage(p_user_id text)
returns void
language sql
security invoker
as $$
  update users
     set ai_requests_count  = coalesce(ai_requests_count, 0) + 1,
         last_ai_request_at = now()
   where id::text = p_user_id;
$$;
revoke all on function bump_ai_usage(text) from public, anon, authenticated;

-- ── 8. Пер-пользовательские агрегаты для /admin/users (одним запросом) ──────
-- drop+create, а не `or replace`: миграция 015 расширяет набор колонок,
-- а replace не умеет менять их состав при повторном прогоне цепочки.
drop view if exists admin_user_stats;
create view admin_user_stats as
select
  u.id::text                                   as user_id,
  u.email,
  u.name,
  coalesce(u.plan, 'none')                     as plan,
  u.plan_expires_at,
  u.created_at,
  u.last_login_at,
  coalesce(r.total, 0)                         as requests_total,
  coalesce(r.today, 0)                         as requests_today,
  coalesce(s.sessions, 0)                      as sessions_count,
  greatest(u.last_login_at, s.last_visit)      as last_visit,
  coalesce(p.revenue, 0)                       as revenue
from users u
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

-- security_invoker: у anon нет прав на подлежащие таблицы → view для него закрыт.
alter view admin_user_stats set (security_invoker = true);

-- ── 9. Сводка для дашборда одним RPC (без тысячи запросов) ──────────────────
create or replace function admin_overview()
returns jsonb
language sql
security invoker
as $$
select jsonb_build_object(
  'users_total',      (select count(*) from users),
  'users_today',      (select count(*) from users where created_at >= date_trunc('day', now())),
  'users_week',       (select count(*) from users where created_at >= now() - interval '7 days'),
  'users_month',      (select count(*) from users where created_at >= now() - interval '30 days'),
  'active_today',     (select count(distinct user_id) from user_sessions where last_activity_at >= date_trunc('day', now())),
  'active_week',      (select count(distinct user_id) from user_sessions where last_activity_at >= now() - interval '7 days'),
  'ai_total',         (select count(*) from ai_requests),
  'ai_today',         (select count(*) from ai_requests where created_at >= date_trunc('day', now())),
  'ai_week',          (select count(*) from ai_requests where created_at >= now() - interval '7 days'),
  'ai_month',         (select count(*) from ai_requests where created_at >= now() - interval '30 days'),
  'ai_errors_week',   (select count(*) from ai_requests where status = 'error' and created_at >= now() - interval '7 days'),
  'revenue_total',    (select coalesce(sum(amount),0) from payments where status = 'PAID'),
  'revenue_month',    (select coalesce(sum(amount),0) from payments where status = 'PAID' and created_at >= now() - interval '30 days'),
  'paying_users',     (select count(distinct user_id) from payments where status = 'PAID'),
  'plan_distribution',(select coalesce(jsonb_object_agg(plan, cnt), '{}'::jsonb) from
                        (select coalesce(plan,'none') as plan, count(*) as cnt from users group by 1) d),
  'signups_by_day',   (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from
                        (select date_trunc('day', created_at)::date as d, count(*) as n
                         from users where created_at >= now() - interval '30 days' group by 1) t),
  'ai_by_day',        (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from
                        (select date_trunc('day', created_at)::date as d, count(*) as n
                         from ai_requests where created_at >= now() - interval '30 days' group by 1) t),
  'revenue_by_day',   (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from
                        (select date_trunc('day', created_at)::date as d, sum(amount) as n
                         from payments where status = 'PAID' and created_at >= now() - interval '30 days' group by 1) t)
);
$$;
revoke all on function admin_overview() from public, anon, authenticated;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 013_subscriptions.sql                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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

-- Миграция 001 создавала другую таблицу subscriptions (под Stripe, с
-- organization_id и без user_id) — приложение её не использует. Если она ещё
-- лежит в базе, `create table if not exists` ниже молча оставил бы её, и
-- индекс по user_id упал бы. Убираем legacy-таблицу, только если это она.
do $$ begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'subscriptions'
                and column_name = 'organization_id')
     and not exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'subscriptions'
                and column_name = 'user_id') then
    drop table subscriptions cascade;
  end if;
end $$;

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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 014_events_acquisition.sql                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ============================================================================
-- 014 — События продукта, источник привлечения и воронка конверсии
-- ============================================================================
-- Дополняет 012 (ai_requests / user_sessions / page_views): единая лента
-- событий + UTM-источник пользователя + агрегаты для админки одним RPC.
-- RLS как везде: включён без политик → anon-ключ не имеет доступа, пишет и
-- читает только сервер (service role), проверки — в API.

-- ── 1. Единая лента событий ─────────────────────────────────────────────────
create table if not exists user_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    text,                    -- null для анонимных (visit до регистрации)
  event_name text not null,           -- signup / login / pricing_view / checkout_started / payment_success / ...
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists user_events_user_created_idx on user_events (user_id, created_at desc);
create index if not exists user_events_name_created_idx on user_events (event_name, created_at desc);
create index if not exists user_events_created_idx      on user_events (created_at);

alter table user_events enable row level security;

-- ── 2. Источник привлечения на пользователе ─────────────────────────────────
alter table users add column if not exists utm_source   text;
alter table users add column if not exists utm_medium   text;
alter table users add column if not exists utm_campaign text;
alter table users add column if not exists utm_content  text;
alter table users add column if not exists utm_term     text;
alter table users add column if not exists landing_page text;
alter table users add column if not exists referrer     text;

create index if not exists users_utm_source_idx on users (utm_source);

-- ── 3. Сводка аналитики одним запросом (период задаётся в днях) ─────────────
-- Возвращает воронку, источники и ряды для графиков — чтобы дашборд не делал
-- десятки запросов.
create or replace function analytics_overview(p_days int default 30)
returns jsonb
language sql
security invoker
as $$
with span as (select (now() - make_interval(days => greatest(1, p_days))) as since)
select jsonb_build_object(
  'days', p_days,

  -- Воронка: посетители → регистрации → начатые оплаты → успешные платежи
  'funnel', jsonb_build_object(
    'visitors',  (select count(distinct coalesce(user_id, metadata->>'anon_id'))
                    from user_events, span
                   where event_name = 'visit' and created_at >= span.since),
    'signups',   (select count(*) from users, span where created_at >= span.since),
    'checkouts', (select count(distinct user_id) from user_events, span
                   where event_name = 'checkout_started' and created_at >= span.since),
    'payments',  (select count(distinct user_id) from payments, span
                   where status = 'PAID' and created_at >= span.since)
  ),

  -- Источники привлечения зарегистрированных пользователей
  'sources', (select coalesce(jsonb_agg(row_to_json(t) order by t.n desc), '[]'::jsonb) from (
      select coalesce(nullif(utm_source, ''), 'direct') as source,
             count(*) as n,
             count(*) filter (where plan is not null and plan <> 'none') as paid
        from users, span
       where created_at >= span.since
       group by 1 order by n desc limit 12) t),

  -- AI-использование
  'ai', jsonb_build_object(
    'total',  (select count(*) from ai_requests, span where created_at >= span.since),
    'failed', (select count(*) from ai_requests, span where status = 'error' and created_at >= span.since),
    'users',  (select count(distinct user_id) from ai_requests, span where created_at >= span.since),
    'by_feature', (select coalesce(jsonb_object_agg(feature, n), '{}'::jsonb) from (
        select feature, count(*) as n from ai_requests, span
         where created_at >= span.since group by 1 order by n desc limit 10) f),
    'by_model', (select coalesce(jsonb_object_agg(coalesce(model,'default'), n), '{}'::jsonb) from (
        select model, count(*) as n from ai_requests, span
         where created_at >= span.since group by 1 order by n desc limit 10) m)
  ),

  -- Деньги (только подтверждённые платежи)
  'revenue', jsonb_build_object(
    'total',  (select coalesce(sum(amount),0) from payments where status = 'PAID'),
    'period', (select coalesce(sum(amount),0) from payments, span where status = 'PAID' and created_at >= span.since),
    'today',  (select coalesce(sum(amount),0) from payments where status = 'PAID' and created_at >= date_trunc('day', now())),
    'by_plan',(select coalesce(jsonb_object_agg(plan, s), '{}'::jsonb) from (
        select plan, sum(amount) as s from payments where status = 'PAID' group by 1) r)
  ),

  -- Ряды для графиков
  'series', jsonb_build_object(
    'signups', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(*) as n
          from users, span where created_at >= span.since group by 1) t),
    'ai', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(*) as n
          from ai_requests, span where created_at >= span.since group by 1) t),
    'revenue', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, sum(amount) as n
          from payments, span where status = 'PAID' and created_at >= span.since group by 1) t),
    'paying_users', (select coalesce(jsonb_agg(row_to_json(t) order by t.d), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as d, count(distinct user_id) as n
          from payments, span where status = 'PAID' and created_at >= span.since group by 1) t)
  )
);
$$;
revoke all on function analytics_overview(int) from public, anon, authenticated;

-- ── 4. Реальное удержание (D1 / D7 / D30) ───────────────────────────────────
-- Когорта = пользователи, зарегистрированные достаточно давно, чтобы окно
-- успело наступить. Вернулся = была сессия в сутки N после регистрации.
-- Никаких «примерно 65%»: если когорта пуста, возвращаем null и UI покажет «—».
create or replace function retention_rates()
returns jsonb
language sql
security invoker
as $$
with u as (select id, created_at from users),
     r as (
       select d.n,
              count(*) filter (where exists (
                select 1 from user_sessions s
                 where s.user_id = u.id::text
                   and s.started_at >= u.created_at + make_interval(days => d.n)
                   and s.started_at <  u.created_at + make_interval(days => d.n + 1)
              )) as returned,
              count(*) as cohort
         from (values (1),(7),(30)) as d(n)
         join u on u.created_at <= now() - make_interval(days => d.n + 1)
        group by d.n
     )
select jsonb_object_agg('d' || n,
         case when cohort > 0 then round(returned * 100.0 / cohort) else null end)
  from r;
$$;
revoke all on function retention_rates() from public, anon, authenticated;

-- ── 5. Вовлечённость: длительность сессий, просмотры, отказы ─────────────────
create or replace function engagement_stats()
returns jsonb
language sql
security invoker
as $$
select jsonb_build_object(
  'sessions_today', (select count(*) from user_sessions where started_at >= date_trunc('day', now())),
  -- Средняя длительность сессии в минутах (по разнице последней активности и старта)
  'avg_session_min', (
    select coalesce(round(avg(extract(epoch from (last_activity_at - started_at)) / 60.0)::numeric, 1), 0)
      from user_sessions where started_at >= now() - interval '7 days'
  ),
  'page_views_today', (select count(*) from page_views where created_at >= date_trunc('day', now())),
  -- Отказ = сессия ровно с одним просмотром страницы
  'bounce_rate', (
    select case when count(*) > 0
           then round(count(*) filter (where pv = 1) * 100.0 / count(*))
           else 0 end
      from (select s.id, count(p.id) as pv
              from user_sessions s left join page_views p on p.session_id = s.id
             where s.started_at >= now() - interval '7 days'
             group by s.id) q
  )
);
$$;
revoke all on function engagement_stats() from public, anon, authenticated;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 015_quota_atomic.sql                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 016_growth.sql                                                            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- ============================================================================
-- 016 — Активация, реферальные коды и метрики роста
-- ============================================================================
-- Достраивает воронку до полной цепочки:
--   визит → регистрация → активация → просмотр тарифов → чекаут → оплата
-- Активация — первый полезный результат (успешный AI-запрос), а не просто вход:
-- по ней видно, доносит ли продукт ценность до того, как просить деньги.

-- ── 1. Поля роста на пользователе ───────────────────────────────────────────
alter table users add column if not exists activated_at    timestamptz; -- первый успешный AI-результат
alter table users add column if not exists referral_code   text;        -- собственный код пользователя
alter table users add column if not exists referred_by     text;        -- код того, кто привёл

create index if not exists users_activated_idx    on users (activated_at);
create unique index if not exists users_ref_code_idx on users (referral_code) where referral_code is not null;
create index if not exists users_referred_by_idx  on users (referred_by);

-- ── 2. Отметка активации (идемпотентно — только первый раз) ─────────────────
create or replace function mark_activated(p_user_id text)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_first boolean := false;
begin
  update users
     set activated_at = now()
   where id::text = p_user_id and activated_at is null;
  get diagnostics v_first = row_count;
  return v_first;   -- true, если это была ПЕРВАЯ активация
end;
$$;
revoke all on function mark_activated(text) from public, anon, authenticated;

-- ── 3. Метрики роста: воронка, конверсии, деньги ────────────────────────────
-- Всё считается из фактических таблиц. Там, где данных для честного расчёта
-- недостаточно (например, churn без завершившихся подписок), возвращается null,
-- а интерфейс показывает «—», а не выдуманное число.
create or replace function growth_metrics(p_days int default 30)
returns jsonb
language sql
security invoker
as $$
with span as (select (now() - make_interval(days => greatest(1, p_days))) as since),
funnel as (
  select
    (select count(distinct coalesce(user_id, metadata->>'anon_id'))
       from user_events, span
      where event_name in ('visit','landing_view') and created_at >= span.since)      as visitors,
    (select count(*) from users, span where created_at >= span.since)                  as signups,
    (select count(*) from users, span where activated_at is not null
       and activated_at >= span.since)                                                 as activated,
    (select count(distinct user_id) from user_events, span
      where event_name = 'pricing_view' and created_at >= span.since)                  as pricing_views,
    (select count(distinct user_id) from user_events, span
      where event_name = 'checkout_started' and created_at >= span.since)              as checkouts,
    (select count(distinct user_id) from payments, span
      where status = 'PAID' and created_at >= span.since)                              as paid
),
money as (
  select
    (select count(distinct user_id) from subscriptions
      where status = 'active' and (expires_at is null or expires_at > now()))          as active_subs,
    -- MRR: сумма месячных цен активных подписок. Если активных нет — 0, не выдумка.
    (select coalesce(sum(case plan when 'starter' then 29 when 'pro' then 39 when 'max' then 49 else 0 end), 0)
       from subscriptions
      where status = 'active' and (expires_at is null or expires_at > now()))          as mrr,
    (select coalesce(sum(amount), 0) from payments where status = 'PAID')              as revenue_total,
    (select coalesce(sum(amount), 0) from payments, span
      where status = 'PAID' and created_at >= span.since)                              as revenue_period,
    -- Отток: подписки, истёкшие за период и не продлённые до сих пор.
    (select count(*) from subscriptions, span
      where expires_at is not null and expires_at < now() and expires_at >= span.since
        and status <> 'active')                                                        as churned
)
select jsonb_build_object(
  'days', p_days,
  'funnel', jsonb_build_object(
    'visitors', funnel.visitors, 'signups', funnel.signups, 'activated', funnel.activated,
    'pricing_views', funnel.pricing_views, 'checkouts', funnel.checkouts, 'paid', funnel.paid
  ),
  'revenue', jsonb_build_object(
    'mrr', money.mrr,
    'total', money.revenue_total,
    'period', money.revenue_period,
    'paid_users', money.active_subs,
    -- ARPU считаем только когда есть на что делить.
    'arpu', case when money.active_subs > 0
                 then round(money.mrr::numeric / money.active_subs, 2) else null end,
    'churned', money.churned,
    'churn_rate', case when (money.active_subs + money.churned) > 0
                       then round(money.churned * 100.0 / (money.active_subs + money.churned), 1)
                       else null end
  )
) from funnel, money;
$$;
revoke all on function growth_metrics(int) from public, anon, authenticated;

-- ── 4. Когорты по месяцу регистрации ────────────────────────────────────────
create or replace function cohort_metrics(p_months int default 6)
returns jsonb
language sql
security invoker
as $$
select coalesce(jsonb_agg(row_to_json(c) order by c.cohort), '[]'::jsonb) from (
  select to_char(date_trunc('month', u.created_at), 'YYYY-MM')            as cohort,
         count(*)                                                        as signups,
         count(*) filter (where u.activated_at is not null)              as activated,
         count(*) filter (where exists (
           select 1 from payments p where p.user_id = u.id::text and p.status = 'PAID'
         ))                                                              as paid
    from users u
   where u.created_at >= date_trunc('month', now()) - make_interval(months => greatest(1, p_months))
   group by 1
) c;
$$;
revoke all on function cohort_metrics(int) from public, anon, authenticated;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 017_auth_provider.sql                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 018_users_app_columns.sql                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 019_basic_plan_and_promo.sql                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 020_fix_activate_subscription_overload.sql                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
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
