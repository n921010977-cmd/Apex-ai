import type { BotContext } from "../types.js";
import { isAdmin } from "../config/env.js";
import { stats, listRecentUsers, setBlocked, setPlan, recentLogs } from "../services/adminService.js";
import { esc } from "../utils/format.js";

function guard(ctx: BotContext): boolean {
  const id = ctx.from?.id;
  if (id == null || !isAdmin(BigInt(id))) { void ctx.reply("⛔ Команда только для администраторов."); return false; }
  return true;
}

export async function adminStats(ctx: BotContext) {
  if (!guard(ctx)) return;
  const s = await stats();
  await ctx.reply(
    `🛡 <b>Админ · статистика</b>\n\n` +
    `👥 Пользователей: <b>${s.users}</b>\n🔗 Привязано TG: <b>${s.linked}</b>\n` +
    `🟢 Активны за 24ч: <b>${s.activeToday}</b>\n💬 Диалогов: <b>${s.convos}</b>\n` +
    `✉️ Сообщений: <b>${s.messages}</b>\n📁 Проектов: <b>${s.projects}</b>`,
    { parse_mode: "HTML" },
  );
}

export async function adminUsers(ctx: BotContext) {
  if (!guard(ctx)) return;
  const rows = await listRecentUsers(10);
  const list = rows.map((r) =>
    `${r.isBlocked ? "🚫" : "🟢"} <code>${r.telegramId}</code> · ${esc(r.user.email)} · ${esc(r.user.tier)}`,
  ).join("\n");
  await ctx.reply(`🛡 <b>Последние пользователи</b>\n\n${list || "нет"}`, { parse_mode: "HTML" });
}

// /block <telegramId>  /unblock <telegramId>
export async function adminBlock(ctx: BotContext, arg: string, blocked: boolean) {
  if (!guard(ctx)) return;
  const id = arg.trim();
  if (!/^\d+$/.test(id)) { await ctx.reply("Использование: /block <telegram_id>"); return; }
  await setBlocked(BigInt(id), blocked).catch(() => {});
  await ctx.reply(`${blocked ? "🚫 Заблокирован" : "🟢 Разблокирован"}: ${id}`);
}

// /setplan <telegramId> <plan>
export async function adminSetPlan(ctx: BotContext, args: string[]) {
  if (!guard(ctx)) return;
  const [id, plan] = args;
  if (!/^\d+$/.test(id ?? "") || !plan) { await ctx.reply("Использование: /setplan <telegram_id> <free|starter|professional|business|enterprise>"); return; }
  const res = await setPlan(BigInt(id), plan);
  await ctx.reply(res ? `✅ Тариф пользователя ${id} → ${plan}` : "Не удалось (нет организации у пользователя).");
}

export async function adminLogs(ctx: BotContext) {
  if (!guard(ctx)) return;
  const logs = await recentLogs(15);
  const list = logs.map((l) => `• ${l.createdAt.toLocaleTimeString("ru-RU")} — ${esc(l.type)}`).join("\n");
  await ctx.reply(`🛡 <b>Последние действия</b>\n\n${list || "нет"}`, { parse_mode: "HTML" });
}
