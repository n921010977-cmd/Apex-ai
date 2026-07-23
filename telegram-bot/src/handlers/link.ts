import type { BotContext } from "../types.js";
import { startEmailLink, verifyEmailLink } from "../services/authService.js";
import { linkAccount, unlinkAccount, logAction, getLinkedAccount } from "../database/repositories.js";
import { mainMenu } from "../keyboards/index.js";
import { esc } from "../utils/format.js";

export async function beginLink(ctx: BotContext) {
  if (ctx.account) { await ctx.reply(`✅ Аккаунт уже привязан: ${esc(ctx.account.user.email)}`); return; }
  ctx.session.mode = "link_email";
  await ctx.reply(
    "🔐 <b>Привязка аккаунта Vertlix</b>\n\nВведите email, которым вы регистрировались на vertlix.ai.\n" +
    "Я отправлю на него 6-значный код подтверждения.",
    { parse_mode: "HTML" },
  );
}

export async function onLinkEmail(ctx: BotContext, text: string) {
  const tgId = BigInt(ctx.from!.id);
  const res = await startEmailLink(tgId, text);
  if (!res.ok) { await ctx.reply(`❌ ${res.reason}`); return; }
  ctx.session.mode = "link_code";
  ctx.session.linkEmail = text.trim().toLowerCase();
  await ctx.reply("📧 Если аккаунт с таким email существует — код отправлен. Введите 6-значный код:");
}

export async function onLinkCode(ctx: BotContext, text: string) {
  const tgId = BigInt(ctx.from!.id);
  const res = await verifyEmailLink(tgId, text);
  if (!res.ok) { await ctx.reply(`❌ ${res.reason}`); return; }
  await linkAccount({
    telegramId: tgId, userId: res.userId!,
    username: ctx.from?.username, firstName: ctx.from?.first_name, languageCode: ctx.from?.language_code,
  });
  await logAction(res.userId!, null, "bot.account_linked", { telegramId: String(tgId) });
  ctx.session.mode = "idle";
  ctx.session.linkEmail = undefined;
  await ctx.reply(
    `✅ Аккаунт <b>${esc(res.email!)}</b> привязан!\n\nТеперь вам доступны все возможности Vertlix AI прямо в Telegram.`,
    { parse_mode: "HTML", ...mainMenu },
  );
}

export async function doUnlink(ctx: BotContext) {
  const tgId = BigInt(ctx.from!.id);
  const acc = await getLinkedAccount(tgId);
  await unlinkAccount(tgId);
  if (acc) await logAction(acc.userId, null, "bot.account_unlinked", { telegramId: String(tgId) });
  await ctx.answerCbQuery("Аккаунт отвязан");
  await ctx.reply("🔓 Аккаунт отвязан. Данные на сайте не затронуты. Чтобы снова пользоваться ботом — /link.");
}
