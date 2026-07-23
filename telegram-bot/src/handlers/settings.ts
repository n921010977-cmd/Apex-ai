import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { modelPicker, settingsMenu } from "../keyboards/index.js";
import { MODELS } from "../config/constants.js";
import { prisma } from "../database/prisma.js";

export async function chooseModel(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  await ctx.answerCbQuery();
  await ctx.reply("🧠 Выберите модель по умолчанию:", modelPicker());
}

export async function setModel(ctx: BotContext, tier: "haiku" | "sonnet" | "opus") {
  if (!requireAccount(ctx)) return;
  const model = MODELS[tier];
  await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { defaultModel: model } });
  await ctx.answerCbQuery(`Модель: ${tier}`);
  await ctx.editMessageText(`✅ Модель по умолчанию: <b>${tier}</b>`, { parse_mode: "HTML" }).catch(() => {});
}

export async function toggleNotify(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const next = !ctx.account.notifyEnabled;
  await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { notifyEnabled: next } });
  await ctx.answerCbQuery(next ? "Уведомления включены" : "Уведомления выключены");
  await ctx.editMessageReplyMarkup(settingsMenu(ctx.account.defaultModel, next).reply_markup).catch(() => {});
}

export async function comingSoon(ctx: BotContext, label: string) {
  await ctx.answerCbQuery(`${label}: скоро`);
}
