import type { MiddlewareFn } from "telegraf";
import type { BotContext } from "../types.js";
import { getLinkedAccount, resolveOrgId, touchLastSeen } from "../database/repositories.js";

// Resolves the linked Vertlix account for the Telegram user and attaches it to
// ctx.account. Does NOT gate here — commands decide what requires linking (so
// /start, /help, /link stay reachable while unlinked).
export const attachAccount: MiddlewareFn<BotContext> = async (ctx, next) => {
  const tgId = ctx.from?.id;
  if (tgId == null) return next();
  const acc = await getLinkedAccount(BigInt(tgId));
  if (acc) {
    if (acc.isBlocked) { await ctx.reply("🚫 Ваш аккаунт заблокирован. Обратитесь в поддержку."); return; }
    ctx.account = {
      telegramId: acc.telegramId,
      userId: acc.userId,
      defaultModel: acc.defaultModel,
      activeAgent: acc.activeAgent,
      activeConversationId: acc.activeConversationId,
      notifyEnabled: acc.notifyEnabled,
      isBlocked: acc.isBlocked,
      user: { id: acc.user.id, email: acc.user.email, name: acc.user.name, tier: acc.user.tier, createdAt: acc.user.createdAt },
      orgId: await resolveOrgId(acc.userId),
    };
    void touchLastSeen(acc.telegramId);
  }
  await next();
};

// Guard used by handlers that require a linked account.
export function requireAccount(ctx: BotContext): ctx is BotContext & { account: NonNullable<BotContext["account"]> } {
  if (!ctx.account) {
    void ctx.reply("🔐 Сначала привяжите аккаунт Vertlix: команда /link");
    return false;
  }
  return true;
}
