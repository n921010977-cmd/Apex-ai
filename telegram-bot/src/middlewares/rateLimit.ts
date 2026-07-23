import type { MiddlewareFn } from "telegraf";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { RATE_LIMIT } from "../config/constants.js";
import type { BotContext } from "../types.js";

// Redis when configured (shared across instances), else in-memory.
const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 }) : null;
redis?.connect().catch(() => console.warn("[rate-limit] Redis unavailable, using memory"));

const mem = new Map<string, { count: number; resetAt: number }>();

export async function allow(key: string, windowMs: number, max: number): Promise<boolean> {
  if (redis && redis.status === "ready") {
    const k = `rl:${key}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.pexpire(k, windowMs);
    return n <= max;
  }
  const now = Date.now();
  const e = mem.get(key);
  if (!e || now > e.resetAt) { mem.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  e.count += 1;
  return e.count <= max;
}

// Global per-user command limiter (AI has its own stricter bucket at call site).
export const rateLimit: MiddlewareFn<BotContext> = async (ctx, next) => {
  const id = ctx.from?.id;
  if (id == null) return next();
  const ok = await allow(`cmd:${id}`, RATE_LIMIT.windowMs, RATE_LIMIT.max);
  if (!ok) { await ctx.reply("⏳ Слишком много запросов. Подождите минуту."); return; }
  await next();
};
