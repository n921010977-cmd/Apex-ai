-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login);

-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan TEXT DEFAULT 'free', -- free / pro / business
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);

-- ─── MEMBERS ─────────────────────────────────────────────────────────────────
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner / admin / member / viewer
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_org ON members(organization_id);
CREATE INDEX idx_members_user_org ON members(user_id, organization_id);

-- ─── AGENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE agents (
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
CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_type ON agents(type);

-- ─── AGENT TOOLS ─────────────────────────────────────────────────────────────
CREATE TABLE agent_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- search / email / create_task / database_query
  description TEXT,
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_agent_tools_agent ON agent_tools(agent_id);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE projects (
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
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ─── CONVERSATIONS ────────────────────────────────────────────────────────────
CREATE TABLE conversations (
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
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user / assistant / system / tool
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ─── AGENT MEMORY (RAG / vector search) ──────────────────────────────────────
CREATE TABLE agent_memory_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_memory_agent ON agent_memory_chunks(agent_id);
CREATE INDEX idx_memory_org ON agent_memory_chunks(organization_id);
-- Vector index for similarity search (HNSW)
CREATE INDEX idx_memory_embedding ON agent_memory_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── TASKS ───────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
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
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ─── TOOL CALLS ──────────────────────────────────────────────────────────────
CREATE TABLE tool_calls (
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
CREATE INDEX idx_tool_calls_agent ON tool_calls(agent_id);
CREATE INDEX idx_tool_calls_conversation ON tool_calls(conversation_id);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free', -- free / pro / business
  status TEXT DEFAULT 'active', -- active / canceled / past_due
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount INT,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'unpaid', -- paid / unpaid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_invoices_org ON invoices(organization_id);

-- ─── USAGE STATS ─────────────────────────────────────────────────────────────
CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_count INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  agent_runs INT DEFAULT 0,
  tool_calls INT DEFAULT 0,
  UNIQUE(organization_id, date)
);
CREATE INDEX idx_usage_org_date ON usage_stats(organization_id, date);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- login / message / agent_run / billing / project_create
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_activity_org ON activity_logs(organization_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_type ON activity_logs(type);

-- ─── API KEYS ─────────────────────────────────────────────────────────────────
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid()::text = id::text);

-- Members can access their organization data
CREATE POLICY "org_members_access" ON organizations
  FOR ALL USING (
    id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
  );

CREATE POLICY "members_access" ON members
  FOR ALL USING (user_id::text = auth.uid()::text);

CREATE POLICY "projects_access" ON projects
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
    OR user_id::text = auth.uid()::text
  );

CREATE POLICY "agents_access" ON agents
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
  );

CREATE POLICY "conversations_access" ON conversations
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM members WHERE user_id::text = auth.uid()::text)
    OR user_id::text = auth.uid()::text
  );

CREATE POLICY "messages_access" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id::text = auth.uid()::text
    )
  );

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

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
