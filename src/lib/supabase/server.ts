import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Whether a real Supabase backend is configured. When false the app runs in
 * demo mode: data routes return safe empty/demo payloads instead of crashing
 * with "supabaseUrl is required".
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * A chainable no-op query builder used in demo mode. Every method returns the
 * same builder, and awaiting it resolves to an empty Supabase-shaped result, so
 * route handlers that expect `{ data, error, count }` keep working (returning
 * empty data) instead of throwing when no database is configured.
 */
function createDemoClient() {
  const result = { data: [] as unknown[], error: null, count: 0 };
  const single = { data: null, error: null, count: 0 };
  const makeBuilder = (isSingle = false): unknown => {
    const target = () => {};
    return new Proxy(target, {
      get(_t, prop) {
        if (prop === "then") {
          const payload = isSingle ? single : result;
          return (resolve: (v: unknown) => unknown) => resolve(payload);
        }
        if (prop === "single" || prop === "maybeSingle") return () => makeBuilder(true);
        // insert/update/delete/select/eq/order/range/... all chain
        return () => makeBuilder(isSingle);
      },
      apply() { return makeBuilder(isSingle); },
    });
  };
  return {
    from: () => makeBuilder(),
    rpc: () => makeBuilder(),
    auth: {
      // A stable demo user so routes that gate on Supabase auth return empty
      // data (200) in demo mode instead of 401. No real data is exposed —
      // every query resolves to an empty result.
      getUser: async () => ({ data: { user: { id: "demo-user", email: "demo@vertlix.ai" } }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  };
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createDemoClient() as any;
  }
  const cookieStore = await cookies();

  // Prefer the SERVICE ROLE key server-side. It bypasses RLS, which lets us
  // enable RLS-deny on every table (migration 009) so the public anon key can't
  // touch the DB directly from a browser. This key is NEVER shipped to the
  // client — this module is server-only (imports next/headers). Authorization
  // is enforced by per-user / per-org scoping in the API routes. Falls back to
  // the anon key when the service key isn't set (do NOT enable RLS in that case).
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function createServiceClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
