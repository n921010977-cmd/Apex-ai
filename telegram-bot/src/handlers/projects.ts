import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { projectList, projectActions, upgradeButton } from "../keyboards/index.js";
import { listProjects, createProject, getProject, archiveProject, logAction } from "../database/repositories.js";
import { planStatus } from "../services/subscriptionService.js";
import { prisma } from "../database/prisma.js";
import { esc } from "../utils/format.js";

export async function showProjects(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const projects = await listProjects(ctx.account.userId);
  if (projects.length === 0) {
    await ctx.reply("📁 <b>Проекты</b>\n\nУ вас пока нет проектов. Создайте первый:",
      { parse_mode: "HTML", ...projectList([]) });
    return;
  }
  await ctx.reply(`📁 <b>Проекты</b> (${projects.length})`, { parse_mode: "HTML", ...projectList(projects) });
}

export async function startCreateProject(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  // Enforce plan project limit.
  const st = await planStatus(ctx.account.orgId);
  if (st.projectLimit >= 0) {
    const count = await prisma.project.count({ where: { userId: ctx.account.userId, status: { not: "archived" } } });
    if (count >= st.projectLimit) {
      await ctx.reply(`🚦 Достигнут лимит проектов вашего тарифа (${st.projectLimit}). Обновите тариф для большего.`, upgradeButton());
      return;
    }
  }
  ctx.session.mode = "project_name";
  ctx.session.draftProject = {};
  await ctx.reply("➕ <b>Новый проект</b>\n\nКак называется проект / бизнес-идея?", { parse_mode: "HTML" });
}

export async function onProjectName(ctx: BotContext, text: string) {
  ctx.session.draftProject = { ...ctx.session.draftProject, name: text.trim().slice(0, 120) };
  ctx.session.mode = "project_industry";
  await ctx.reply("В какой индустрии / нише? (или «-» чтобы пропустить)");
}

export async function onProjectIndustry(ctx: BotContext, text: string) {
  if (!requireAccount(ctx) || !ctx.account.orgId) {
    ctx.session.mode = "idle";
    await ctx.reply("Не удалось определить рабочее пространство. Попробуйте позже.");
    return;
  }
  const industry = text.trim() === "-" ? undefined : text.trim().slice(0, 80);
  const name = ctx.session.draftProject?.name || "Новый проект";
  const project = await createProject(ctx.account.userId, ctx.account.orgId, { name, industry });
  await logAction(ctx.account.userId, ctx.account.orgId, "bot.project_create", { id: project.id, name });
  ctx.session.mode = "idle";
  ctx.session.draftProject = undefined;
  await ctx.reply(
    `✅ Проект «${esc(name)}» создан.`,
    { parse_mode: "HTML", ...projectActions(project.id) },
  );
}

export async function openProject(ctx: BotContext, id: string) {
  if (!requireAccount(ctx)) return;
  const p = await getProject(ctx.account.userId, id);
  if (!p) { await ctx.answerCbQuery("Проект не найден"); return; }
  await ctx.reply(
    `📁 <b>${esc(p.name)}</b>\n` +
    (p.industry ? `<b>Индустрия:</b> ${esc(p.industry)}\n` : "") +
    (p.stage ? `<b>Стадия:</b> ${esc(p.stage)}\n` : "") +
    `<b>Статус:</b> ${esc(p.status)}\n<b>Создан:</b> ${p.createdAt.toLocaleDateString("ru-RU")}`,
    { parse_mode: "HTML", ...projectActions(p.id) },
  );
}

export async function chatWithProject(ctx: BotContext, id: string) {
  if (!requireAccount(ctx)) return;
  const p = await getProject(ctx.account.userId, id);
  if (!p) { await ctx.answerCbQuery("Проект не найден"); return; }
  const conv = await prisma.conversation.create({ data: { userId: ctx.account.userId, projectId: p.id, title: `Проект: ${p.name}` } });
  await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { activeConversationId: conv.id } });
  ctx.session.mode = "chat";
  await ctx.answerCbQuery("Чат по проекту начат");
  await ctx.reply(`💬 Обсуждаем «${esc(p.name)}» с советом. Задайте вопрос — учту контекст проекта.`, { parse_mode: "HTML" });
}

export async function doArchiveProject(ctx: BotContext, id: string) {
  if (!requireAccount(ctx)) return;
  await archiveProject(ctx.account.userId, id);
  await ctx.answerCbQuery("Проект архивирован");
  await showProjects(ctx);
}
