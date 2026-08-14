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

// ─── Живая проверка соединения (для /api/health) ──────────────────────────────
// Не «env задан → true», а реальный запрос к PostgREST: HEAD-count по users.
// Секреты не логируются и наружу не отдаются — только безопасная причина.

export type SupabaseHealth =
  | { configured: false; connected: false; reason: "no_env" }
  | { configured: true; connected: true; latencyMs: number }
  | { configured: true; connected: false; reason: "no_tables" | "auth_failed" | "unreachable" | "error" };

// ─── Расширенная диагностика для /api/health ─────────────────────────────────
// Отвечает на три вопроса, из-за которых «чтение работает, а запись падает»:
//  1) какого РОДА ключ лежит в SUPABASE_SERVICE_ROLE_KEY (значение не выводим);
//  2) применена ли миграция 018 (колонка users.role);
//  3) проходит ли реальная ЗАПИСЬ (вставка+удаление пробного события).
export interface SupabaseDeepCheck {
  serviceKeyKind: "service_role" | "anon_key_by_mistake" | "publishable_by_mistake" | "secret" | "missing" | "unknown";
  schema018: boolean | null;      // null = не удалось проверить
  writeOk: boolean | null;
  writeError?: string;            // только код ошибки Postgres, без текста
}

function classifyServiceKey(): SupabaseDeepCheck["serviceKeyKind"] {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!k) return "missing";
  if (k.startsWith("sb_secret_")) return "secret";
  if (k.startsWith("sb_publishable_")) return "publishable_by_mistake";
  // Легаси-ключи — JWT: роль лежит в payload и не является секретом.
  try {
    const payload = JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString());
    if (payload?.role === "service_role") return "service_role";
    if (payload?.role === "anon") return "anon_key_by_mistake";
  } catch { /* не JWT */ }
  return "unknown";
}

export async function deepCheckSupabase(): Promise<SupabaseDeepCheck> {
  const out: SupabaseDeepCheck = { serviceKeyKind: classifyServiceKey(), schema018: null, writeOk: null };
  if (!isSupabaseConfigured()) return out;
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Миграция 018: колонка users.role существует?
    const { error: colErr } = await db.from("users").select("role").limit(1);
    out.schema018 = !colErr;

    // Живая запись: пробное событие в user_events (RLS без политик — пишет
    // только service role), сразу удаляем. Персональных данных нет.
    const probe = `health-probe-${Date.now()}`;
    const { error: insErr } = await db.from("user_events").insert({ event_name: "health_write_probe", metadata: { probe } });
    if (insErr) {
      out.writeOk = false;
      out.writeError = insErr.code ?? "unknown";
    } else {
      out.writeOk = true;
      await db.from("user_events").delete().eq("event_name", "health_write_probe").catch(() => {});
    }
  } catch { /* сеть/прочее — оставляем null */ }
  return out;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealth> {
  if (!isSupabaseConfigured()) return { configured: false, connected: false, reason: "no_env" };

  const t0 = Date.now();
  try {
    const supabase = await createClient();
    // GET (не HEAD): у ошибочного HEAD-ответа нет тела, и SDK не может отдать
    // причину — а нам нужна честная диагностика (no_tables / auth_failed / ...).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = (supabase as any).from("users").select("id").limit(1);
    const timeout = new Promise<{ error: { message: string; code?: string } }>(resolve =>
      setTimeout(() => resolve({ error: { message: "timeout after 4000ms" } }), 4000),
    );
    const { error } = await Promise.race([query, timeout]);

    if (!error) return { configured: true, connected: true, latencyMs: Date.now() - t0 };

    const msg = `${error.code ?? ""} ${error.message ?? ""}`.trim();
    console.error("[health] Supabase query failed:", msg); // причина — в серверные логи, без ключей
    if (/42P01|does not exist|could not find the table|schema cache/i.test(msg)) {
      return { configured: true, connected: false, reason: "no_tables" };
    }
    if (/invalid api key|jwt|401|permission denied|42501/i.test(msg)) {
      return { configured: true, connected: false, reason: "auth_failed" };
    }
    if (/timeout|fetch failed|enotfound|econn|network/i.test(msg)) {
      return { configured: true, connected: false, reason: "unreachable" };
    }
    return { configured: true, connected: false, reason: "error" };
  } catch (e) {
    console.error("[health] Supabase connection error:", e instanceof Error ? e.message : String(e));
    return { configured: true, connected: false, reason: "unreachable" };
  }
}
