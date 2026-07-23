import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { mainMenu, settingsMenu, upgradeButton } from "../keyboards/index.js";
import { planStatus } from "../services/subscriptionService.js";
import { prisma } from "../database/prisma.js";
import { esc } from "../utils/format.js";
import { getAgent } from "../ai/agents.js";

export async function home(ctx: BotContext) {
  const name = ctx.account?.user.name || ctx.from?.first_name || "основатель";
  await ctx.reply(
    `🏠 <b>Vertlix AI</b>\n\nПривет, ${esc(name)}! Ваш AI-совет директоров готов.\n\n` +
    `Задайте вопрос текстом — ответит активный директор (<b>${esc(getAgent(ctx.account?.activeAgent ?? "ceo").name)}</b>), ` +
    `или выберите раздел в меню ниже.`,
    { parse_mode: "HTML", ...mainMenu },
  );
}

export async function profile(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const a = ctx.account;
  const st = await planStatus(a.orgId);
  const reg = a.user.createdAt.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  await ctx.reply(
    `👤 <b>Профиль</b>\n\n` +
    `<b>Имя:</b> ${esc(a.user.name || "—")}\n` +
    `<b>Email:</b> ${esc(a.user.email)}\n` +
    `<b>Telegram ID:</b> <code>${a.telegramId}</code>\n` +
    `<b>Тариф:</b> ${esc(st.label)}\n` +
    `<b>AI-запросов сегодня:</b> ${st.aiUsed}${st.aiLimit < 0 ? "" : ` / ${st.aiLimit}`}\n` +
    `<b>Регистрация:</b> ${esc(reg)}`,
    { parse_mode: "HTML" },
  );
}

export async function subscription(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const st = await planStatus(ctx.account.orgId);
  const rem = st.aiRemaining < 0 ? "∞" : String(st.aiRemaining);
  const proj = st.projectLimit < 0 ? "безлимит" : String(st.projectLimit);
  await ctx.reply(
    `💳 <b>Подписка</b>\n\n` +
    `<b>Текущий тариф:</b> ${esc(st.label)}\n` +
    `<b>AI-запросов в день:</b> ${st.aiLimit < 0 ? "безлимит" : st.aiLimit}\n` +
    `<b>Использовано сегодня:</b> ${st.aiUsed}\n` +
    `<b>Осталось:</b> ${rem}\n` +
    `<b>Лимит проектов:</b> ${proj}\n\n` +
    (st.plan === "free" ? `Больше запросов и Opus-модель — на Pro.` : `Спасибо, что с нами 💜`),
    { parse_mode: "HTML", ...(st.plan === "free" ? upgradeButton() : {}) },
  );
}

export async function analytics(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const uid = ctx.account.userId;
  const [convos, messages, projects] = await Promise.all([
    prisma.conversation.count({ where: { userId: uid } }),
    prisma.message.count({ where: { conversation: { userId: uid } } }),
    prisma.project.count({ where: { userId: uid, status: { not: "archived" } } }),
  ]);
  const st = await planStatus(ctx.account.orgId);
  await ctx.reply(
    `📊 <b>Аналитика</b>\n\n` +
    `💬 Диалогов: <b>${convos}</b>\n` +
    `✉️ Сообщений: <b>${messages}</b>\n` +
    `📁 Проектов: <b>${projects}</b>\n` +
    `🤖 AI-запросов сегодня: <b>${st.aiUsed}</b>`,
    { parse_mode: "HTML" },
  );
}

export async function documents(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  await ctx.reply(
    `📄 <b>Документы</b>\n\n` +
    `Пришлите файл (PDF, DOCX, TXT, CSV или изображение) — я приму его и извлеку текст для анализа.\n\n` +
    `<i>Полная загрузка в базу знаний (RAG-ingestion) подключается по мере настройки хранилища и эмбеддингов; ` +
    `семантический поиск по памяти уже работает на стороне платформы.</i>`,
    { parse_mode: "HTML" },
  );
}

export async function settings(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  await ctx.reply(
    `⚙️ <b>Настройки</b>\n\nВыберите, что изменить:`,
    { parse_mode: "HTML", ...settingsMenu(ctx.account.defaultModel, ctx.account.notifyEnabled) },
  );
}

export async function help(ctx: BotContext) {
  await ctx.reply(
    `❓ <b>Помощь</b>\n\n` +
    `<b>Что умеет бот:</b> это полноценная версия Vertlix AI в Telegram — AI-совет из 20 директоров, ` +
    `проекты, история, подписка.\n\n` +
    `<b>Команды:</b>\n` +
    `/start — запустить / меню\n` +
    `/link — привязать аккаунт Vertlix\n` +
    `/menu — главное меню\n` +
    `/agents — выбрать директора\n` +
    `/new — новый чат\n` +
    `/help — эта справка\n\n` +
    `Просто напишите вопрос текстом — активный директор ответит со стримингом.`,
    { parse_mode: "HTML" },
  );
}
