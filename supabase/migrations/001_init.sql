-- Enable pgvector for memory embeddings
create extension if not exists vector;

-- Organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Members (users → organizations)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  unique(user_id, organization_id)
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  industry text,
  stage text,
  goals text[],
  timeframe text,
  status text default 'active',
  analysis jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI Agents
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  system_prompt text not null,
  model text default 'claude-haiku-4-5-20251001',
  temperature numeric default 0.7,
  max_tokens integer default 2000,
  tools_enabled text[] default '{}',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  title text default 'New Chat',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Memory chunks (long-term vector memory)
create table if not exists memory_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Usage stats (daily aggregates)
create table if not exists usage_stats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  date date not null,
  messages_count integer default 0,
  tokens_used integer default 0,
  agent_runs integer default 0,
  tool_calls integer default 0,
  unique(organization_id, date)
);

-- Indexes
create index if not exists idx_members_user_id on members(user_id);
create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_agents_org_id on agents(organization_id);

-- RLS
alter table organizations enable row level security;
alter table members enable row level security;
alter table projects enable row level security;
alter table agents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table memory_chunks enable row level security;
alter table usage_stats enable row level security;

-- RLS Policies (service_role bypasses all, anon uses these)
create policy "members_own" on members for all using (user_id = auth.uid());
create policy "projects_own" on projects for all using (user_id = auth.uid());
create policy "agents_org" on agents for all using (
  organization_id in (select organization_id from members where user_id = auth.uid())
);
create policy "conversations_own" on conversations for all using (user_id = auth.uid());
create policy "messages_via_conversation" on messages for all using (
  conversation_id in (select id from conversations where user_id = auth.uid())
);
create policy "memory_org" on memory_chunks for all using (
  organization_id in (select organization_id from members where user_id = auth.uid())
);
create policy "usage_org" on usage_stats for all using (
  organization_id in (select organization_id from members where user_id = auth.uid())
);

-- Auto-create organization on first user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  org_id uuid;
begin
  insert into organizations (name) values (coalesce(new.email, 'My Org')) returning id into org_id;
  insert into members (user_id, organization_id, role) values (new.id, org_id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Vector search function for memory
create or replace function search_memory(
  p_org_id uuid,
  p_embedding vector(1536),
  p_match_count int default 5
)
returns table(id uuid, content text, similarity float)
language sql stable as $$
  select id, content, 1 - (embedding <=> p_embedding) as similarity
  from memory_chunks
  where organization_id = p_org_id
    and embedding is not null
  order by embedding <=> p_embedding
  limit p_match_count;
$$;
