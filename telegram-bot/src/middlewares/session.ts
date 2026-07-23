import type { MiddlewareFn } from "telegraf";
import type { BotContext, SessionData } from "../types.js";

// Tiny in-memory session (keyed by chat id). For multi-instance / durable
// sessions, back this with Redis — the interface stays the same.
const store = new Map<number, SessionData>();

export const session: MiddlewareFn<BotContext> = async (ctx, next) => {
  const key = ctx.chat?.id ?? ctx.from?.id;
  if (key == null) return next();
  const data = store.get(key) ?? { mode: "idle" as const };
  ctx.session = data;
  await next();
  store.set(key, ctx.session);
};

export function resetSession(ctx: BotContext) {
  ctx.session = { mode: "idle" };
}
