import { Markup } from "telegraf";
import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { listConversations, deleteConversation, recentMessages } from "../database/repositories.js";
import { prisma } from "../database/prisma.js";
import { esc, mdToHtml, clip } from "../utils/format.js";

export async function showChats(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const convos = await listConversations(ctx.account.userId, 10);
  if (convos.length === 0) {
    await ctx.reply("💬 <b>Чаты</b>\n\nИстория пуста. Напишите вопрос, чтобы начать первый диалог.", { parse_mode: "HTML" });
    return;
  }
  const rows = convos.map((c) => [
    Markup.button.callback(`💬 ${(c.title || "Диалог")} · ${c.updatedAt.toLocaleDateString("ru-RU")}`.slice(0, 60), `conv:open:${c.id}`),
  ]);
  await ctx.reply("💬 <b>Ваши чаты</b>\n\nВыберите, чтобы продолжить:", { parse_mode: "HTML", ...Markup.inlineKeyboard(rows) });
}

export async function openConversation(ctx: BotContext, id: string) {
  if (!requireAccount(ctx)) return;
  const conv = await prisma.conversation.findFirst({ where: { id, userId: ctx.account.userId } });
  if (!conv) { await ctx.answerCbQuery("Диалог не найден"); return; }
  await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { activeConversationId: id } });
  ctx.session.mode = "chat";
  const msgs = await recentMessages(id, 4);
  const preview = msgs.map((m) => `${m.role === "assistant" ? "🤖" : "🧑"} ${clip(m.content, 160)}`).join("\n\n");
  await ctx.answerCbQuery("Диалог открыт");
  await ctx.reply(
    `💬 <b>${esc(conv.title || "Диалог")}</b> — продолжаем.\n\n${mdToHtml(preview || "(пусто)")}\n\nНапишите следующее сообщение.`,
    { parse_mode: "HTML", ...Markup.inlineKeyboard([[Markup.button.callback("🗑 Удалить диалог", `conv:del:${id}`)]]) },
  );
}

export async function removeConversation(ctx: BotContext, id: string) {
  if (!requireAccount(ctx)) return;
  await deleteConversation(ctx.account.userId, id);
  if (ctx.account.activeConversationId === id) {
    await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { activeConversationId: null } });
  }
  await ctx.answerCbQuery("Удалено");
  await showChats(ctx);
}
