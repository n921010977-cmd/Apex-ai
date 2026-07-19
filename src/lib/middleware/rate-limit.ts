import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── In-memory fallback store ─────────────────────────────────────────────────
// Used when Upstash is not configured. Note: on serverless (e.g. Vercel) each
// instance keeps its own map, so limits are per-instance. Configure Upstash for
// a shared, durable limit across all instances.
const store = new Map<string, { count: number; resetAt: number }>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

function checkMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (existing.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: config.max - existing.count, resetAt: existing.resetAt };
}

// ─── Upstash Redis (durable, shared across instances) ─────────────────────────
function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function checkUpstash(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const rlKey = `rl:${key}`;

  // Atomic pipeline: INCR, set expiry only on first hit (NX), read remaining TTL.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", rlKey],
      ["PEXPIRE", rlKey, config.windowMs, "NX"],
      ["PTTL", rlKey],
    ]),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const results = (await res.json()) as Array<{ result: number }>;
  const count = results[0]?.result ?? 1;
  const pttl = results[2]?.result ?? config.windowMs;
  const resetAt = Date.now() + (pttl > 0 ? pttl : config.windowMs);

  if (count > config.max) return { allowed: false, remaining: 0, resetAt };
  return { allowed: true, remaining: config.max - count, resetAt };
}

export function rateLimit(config: RateLimitConfig) {
  return async function check(identifier: string): Promise<RateLimitResult> {
    if (upstashConfigured()) {
      try {
        return await checkUpstash(identifier, config);
      } catch (err) {
        // Fail open to the in-memory limiter rather than blocking legit traffic.
        console.error("[rate-limit] Upstash error, falling back to memory:", err);
      }
    }
    return checkMemory(identifier, config);
  };
}

// Pre-configured limiters
export const apiLimiter     = rateLimit({ windowMs: 60_000,  max: 60  }); // 60 req/min
export const chatLimiter    = rateLimit({ windowMs: 60_000,  max: 20  }); // 20 messages/min
export const authLimiter    = rateLimit({ windowMs: 900_000, max: 10  }); // 10 auth/15min
export const reportLimiter  = rateLimit({ windowMs: 60_000,  max: 5   }); // 5 reports/min

export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;
  return `ip:${req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"}`;
}

export function rateLimitResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    { success: false, error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}
