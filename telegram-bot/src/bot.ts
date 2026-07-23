import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { env } from "./config/env.js";
import type { BotContext } from "./types.js";

import { errorBoundary, logger } from "./middlewares/logger.js";
import { session } from "./middlewares/session.js";
import { rateLimit } from "./middlewares/rateLimit.js";
import { attachAccount } from "./middlewares/auth.js";

import { mainMenu } from "./keyboards/index.js";
import * as menu from "./handlers/menu.js";
import * as agents from "./handlers/agents.js";
import * as chat from "./handlers/chat.js";
import * as projects from "./handlers/projects.js";
import * as convos from "./handlers/conversations.js";
import * as link from "./handlers/link.js";
import * as docs from "./handlers/documents.js";
import * as settings from "./handlers/settings.js";
import * as admin from "./commands/admin.js";

export function buildBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(env.BOT_TOKEN);

  // ── Middleware pipeline (order matters) ──────────────────────────────────
  bot.use(errorBoundary);
  bot.use(logger);
  bot.use(session);
  bot.use(rateLimit);
  bot.use(attachAccount);

  // ── Commands ─────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    if (ctx.account) return menu.home(ctx);
    await ctx.reply(
      "👋 <b>Добро пожаловать в Vertlix AI</b>\n\nЭто полноценная версия платформы в Telegram: " +
      "AI-совет из 20 директоров, проекты, история, подписка.\n\nЧтобы начать — привяжите аккаунт: /link",
      { parse_mode: "HTML" },
    );
  });
  bot.command("link", link.beginLink);
  bot.command("menu", menu.home);
  bot.command("agents", agents.showAgents);
  bot.command("new", chat.newChat);
  bot.command("help", menu.help);

  // Admin
  bot.command("admin", admin.adminStats);
  bot.command("users", admin.adminUsers);
  bot.command("logs", admin.adminLogs);
  bot.command("block", (ctx) => admin.adminBlock(ctx, ctx.payload, true));
  bot.command("unblock", (ctx) => admin.adminBlock(ctx, ctx.payload, false));
  bot.command("setplan", (ctx) => admin.adminSetPlan(ctx, ctx.payload.trim().split(/\s+/)));

  // ── Reply-keyboard buttons (the "site navigation") ───────────────────────
  bot.hears("🏠 Главная", menu.home);
  bot.hears("🤖 AI Агенты", agents.showAgents);
  bot.hears("💬 Чаты", convos.showChats);
  bot.hears("📁 Проекты", projects.showProjects);
  bot.hears("📄 Документы", menu.documents);
  bot.hears("📊 Аналитика", menu.analytics);
  bot.hears("💳 Подписка", menu.subscription);
  bot.hears("⚙️ Настройки", menu.settings);
  bot.hears("👤 Профиль", menu.profile);
  bot.hears("❓ Помощь", menu.help);

  // ── Inline callbacks ─────────────────────────────────────────────────────
  bot.action(/^agent:(.+)$/, (ctx) => agents.selectAgent(ctx, ctx.match[1]));
  bot.action("menu:agents", async (ctx) => { await ctx.answerCbQuery(); return agents.showAgents(ctx); });

  bot.action("chat:new", async (ctx) => { await ctx.answerCbQuery(); return chat.newChat(ctx); });
  bot.action("chat:history", async (ctx) => { await ctx.answerCbQuery(); return convos.showChats(ctx); });

  bot.action("project:new", async (ctx) => { await ctx.answerCbQuery(); return projects.startCreateProject(ctx); });
  bot.action("project:list", async (ctx) => { await ctx.answerCbQuery(); return projects.showProjects(ctx); });
  bot.action(/^project:open:(.+)$/, (ctx) => projects.openProject(ctx, ctx.match[1]));
  bot.action(/^project:chat:(.+)$/, (ctx) => projects.chatWithProject(ctx, ctx.match[1]));
  bot.action(/^project:archive:(.+)$/, (ctx) => projects.doArchiveProject(ctx, ctx.match[1]));

  bot.action(/^conv:open:(.+)$/, (ctx) => convos.openConversation(ctx, ctx.match[1]));
  bot.action(/^conv:del:(.+)$/, (ctx) => convos.removeConversation(ctx, ctx.match[1]));

  bot.action("set:model", settings.chooseModel);
  bot.action("set:notify", settings.toggleNotify);
  bot.action("set:lang", (ctx) => settings.comingSoon(ctx, "Язык"));
  bot.action("set:tz", (ctx) => settings.comingSoon(ctx, "Часовой пояс"));
  bot.action("set:unlink", link.doUnlink);
  bot.action(/^model:(haiku|sonnet|opus)$/, (ctx) => settings.setModel(ctx, ctx.match[1] as "haiku" | "sonnet" | "opus"));

  // ── Documents / photos ────────────────────────────────────────────────────
  bot.on(message("document"), docs.handleDocument);
  bot.on(message("photo"), docs.handleDocument);

  // ── Free text → route by session mode ─────────────────────────────────────
  bot.on(message("text"), async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith("/")) return; // unknown command
    switch (ctx.session.mode) {
      case "link_email":       return link.onLinkEmail(ctx, text);
      case "link_code":        return link.onLinkCode(ctx, text);
      case "project_name":     return projects.onProjectName(ctx, text);
      case "project_industry": return projects.onProjectIndustry(ctx, text);
      default:                 return chat.handleChatMessage(ctx, text); // default = talk to active agent
    }
  });

  // Fallback for other message types.
  bot.on("message", (ctx) => ctx.reply("Напишите текстом или выберите раздел в меню.", mainMenu));

  return bot;
}
