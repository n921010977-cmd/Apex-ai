import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function rateLimit(config: RateLimitConfig) {
  return function check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = identifier;
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
