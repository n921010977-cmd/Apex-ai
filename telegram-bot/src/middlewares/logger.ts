import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../types.js";

// Lightweight structured request log + latency. Never logs message content of
// AI conversations (privacy) — only the update type and outcome.
export const logger: MiddlewareFn<BotContext> = async (ctx, next) => {
  const start = Date.now();
  const type = ctx.updateType;
  const from = ctx.from?.id;
  try {
    await next();
    console.log(JSON.stringify({ t: new Date().toISOString(), type, from, ms: Date.now() - start, ok: true }));
  } catch (err) {
    console.error(JSON.stringify({ t: new Date().toISOString(), type, from, ms: Date.now() - start, ok: false, err: String(err) }));
    throw err;
  }
};

export const errorBoundary: MiddlewareFn<BotContext> = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("[bot] unhandled:", err);
    try { await ctx.reply("⚠️ Что-то пошло не так. Попробуйте ещё раз или /start."); } catch { /* ignore */ }
  }
};
