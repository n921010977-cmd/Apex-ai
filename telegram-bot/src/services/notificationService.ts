import type { Telegraf } from "telegraf";
import type { BotContext } from "../types.js";
import { prisma } from "../database/prisma.js";
import { mdToHtml } from "../utils/format.js";

// Outbound notifications — called by the web app (via a shared queue/webhook)
// or by the bot itself. Delivers to the user's linked Telegram chat if they
// haven't opted out. Event types mirror the product's notification system.
export type NotifyEvent =
  | "ai_done" | "document_processed" | "subscription_ending" | "limit_reached" | "workspace_invite";

const ICON: Record<NotifyEvent, string> = {
  ai_done: "✅", document_processed: "📄", subscription_ending: "⏳", limit_reached: "🚦", workspace_invite: "👥",
};

export async function notifyUser(bot: Telegraf<BotContext>, userId: string, event: NotifyEvent, text: string): Promise<boolean> {
  const acc = await prisma.telegramAccount.findFirst({ where: { userId }, select: { telegramId: true, notifyEnabled: true } });
  if (!acc || !acc.notifyEnabled) return false;
  try {
    await bot.telegram.sendMessage(Number(acc.telegramId), `${ICON[event]} ${mdToHtml(text)}`, { parse_mode: "HTML" });
    return true;
  } catch (e) {
    console.error("[notify] send failed", e);
    return false;
  }
}

export async function broadcast(bot: Telegraf<BotContext>, event: NotifyEvent, text: string): Promise<number> {
  const accounts = await prisma.telegramAccount.findMany({ where: { notifyEnabled: true, isBlocked: false }, select: { telegramId: true } });
  let sent = 0;
  for (const a of accounts) {
    try { await bot.telegram.sendMessage(Number(a.telegramId), `${ICON[event]} ${mdToHtml(text)}`, { parse_mode: "HTML" }); sent++; }
    catch { /* user may have blocked the bot */ }
    await new Promise((r) => setTimeout(r, 40)); // stay under Telegram's broadcast limit
  }
  return sent;
}
