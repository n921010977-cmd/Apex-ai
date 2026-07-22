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
