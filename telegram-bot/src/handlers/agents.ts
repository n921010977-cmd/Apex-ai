import type { BotContext } from "../types.js";
import { requireAccount } from "../middlewares/auth.js";
import { AGENTS, getAgent } from "../ai/agents.js";
import { agentPicker } from "../keyboards/index.js";
import { prisma } from "../database/prisma.js";
import { esc } from "../utils/format.js";

export async function showAgents(ctx: BotContext) {
  if (!requireAccount(ctx)) return;
  const active = getAgent(ctx.account.activeAgent);
  const list = AGENTS.map((a) =>
    `${a.emoji} <b>${esc(a.name)}</b> — ${esc(a.blurb)}\n   <i>Инструменты:</i> ${esc(a.tools.join(", "))} · <i>Ограничения:</i> ${esc(a.limits)}`,
  ).join("\n\n");
  await ctx.reply(
    `🤖 <b>AI-Агенты</b>\n\nАктивный: ${active.emoji} <b>${esc(active.name)}</b>\n\n${list}\n\nВыберите директора для диалога:`,
    { parse_mode: "HTML", ...agentPicker() },
  );
}

export async function selectAgent(ctx: BotContext, agentId: string) {
  if (!requireAccount(ctx)) return;
  const agent = getAgent(agentId);
  await prisma.telegramAccount.update({ where: { telegramId: ctx.account.telegramId }, data: { activeAgent: agent.id } });
  ctx.session.mode = "chat";
  await ctx.answerCbQuery(`Активен: ${agent.name}`);
  await ctx.reply(
    `${agent.emoji} <b>${esc(agent.name)}</b> готов.\n${esc(agent.blurb)}\n\nЗадайте вопрос — отвечу со стримингом.`,
    { parse_mode: "HTML" },
  );
}
