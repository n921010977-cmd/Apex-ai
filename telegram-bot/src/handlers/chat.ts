import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { allow } from "../middlewares/rateLimit.js";
import { AI_RATE_LIMIT, STREAM_EDIT_INTERVAL_MS } from "../config/constants.js";
import { canUseAi } from "../services/subscriptionService.js";
import { getAgent } from "../ai/agents.js";
import { aiEnabled } from "../ai/anthropic.js";
import { pickModel } from "../ai/router.js";
import { streamAgentReply, type ChatTurn } from "../ai/chat.js";
import { makeThrottler } from "../utils/throttle.js";
import { mdToHtml, clip } from "../utils/format.js";
import { chatControls, upgradeButton } from "../keyboards/index.js";
import {
  getOrCreateConversation, recentMessages, addMessage, incrementAiUsage, logAction, getPlan,
} from "../database/repositories.js";
import { prisma } from "../database/prisma.js";

export async function handleChatMessage(ctx: BotContext, text: string) {
  if (!requireAccount(ctx)) return;
  const acc = ctx.account;

  if (!aiEnabled()) { await ctx.reply("🤖 AI временно недоступен (не настроен ANTHROPIC_API_KEY)."); return; }

  // Per-user AI bucket.
  if (!(await allow(`ai:${acc.telegramId}`, AI_RATE_LIMIT.windowMs, AI_RATE_LIMIT.max))) {
    await ctx.reply("⏳ Слишком часто. Подождите немного перед следующим вопросом."); return;
  }

  // Plan cap (server-side truth).
  const { ok, status } = await canUseAi(acc.orgId);
  if (!ok) {
    await ctx.reply(
      `🚦 Достигнут дневной лимит AI-запросов вашего тарифа (${status.aiLimit}). Обновите тариф для продолжения.`,
      upgradeButton(),
    );
    return;
  }

  const agent = getAgent(acc.activeAgent);
  const plan = await getPlan(acc.orgId);
  const model = acc.defaultModel && acc.defaultModel.startsWith("claude") ? acc.defaultModel : pickModel(agent, plan);

  // Conversation + history.
  const conv = await getOrCreateConversation(acc.userId, acc.activeConversationId);
  if (conv.id !== acc.activeConversationId) {
    await prisma.telegramAccount.update({ where: { telegramId: acc.telegramId }, data: { activeConversationId: conv.id } });
  }
  const history: ChatTurn[] = (await recentMessages(conv.id, 12)).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user", content: m.content,
  }));

  await ctx.sendChatAction("typing");
  const placeholder = await ctx.reply(`${agent.emoji} <i>${agent.name} думает…</i>`, { parse_mode: "HTML" });
  const chatId = placeholder.chat.id;
  const msgId = placeholder.message_id;

  // Throttled streaming edits.
  const throttler = makeThrottler<string>(STREAM_EDIT_INTERVAL_MS, async (partial) => {
    await ctx.telegram.editMessageText(chatId, msgId, undefined, mdToHtml(clip(partial)) + " ▌", { parse_mode: "HTML" }).catch(() => {});
  });

  try {
    const result = await streamAgentReply({
      agent, model, history, userMessage: text,
      onUpdate: (partial) => throttler.push(partial),
    });

    // Final render (no cursor) + controls.
    await throttler.flush(result.text);
    await ctx.telegram.editMessageText(chatId, msgId, undefined, mdToHtml(clip(result.text)), {
      parse_mode: "HTML", ...chatControls(),
    }).catch(async () => {
      await ctx.telegram.editMessageText(chatId, msgId, undefined, clip(result.text)).catch(() => {});
    });

    // Persist + usage + audit.
    await addMessage(conv.id, "user", text, result.inputTokens);
    await addMessage(conv.id, "assistant", result.text, result.outputTokens);
    await prisma.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });
    await incrementAiUsage(acc.orgId);
    await logAction(acc.userId, acc.orgId, "bot.ai_message", { agent: agent.id, model, tokens: result.outputTokens });
  } catch (err) {
    console.error("[chat] stream error", err);
    await ctx.telegram.editMessageText(chatId, msgId, undefined,
      "⚠️ Не удалось получить ответ. Попробуйте переформулировать или повторить.").catch(() => {});
  }
}

export async function newChat(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { activeConversationId: null } });
  ctx.session.mode = "chat";
  const agent = getAgent(ctx.account.activeAgent);
  await ctx.reply(`🆕 Новый чат начат с ${agent.emoji} <b>${agent.name}</b>. Задайте вопрос.`, { parse_mode: "HTML" });
}
