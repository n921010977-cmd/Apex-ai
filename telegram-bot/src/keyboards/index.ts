import { Markup } from "telegraf";
import { AGENTS } from "../ai/agents.js";

// Main reply keyboard (persistent bottom menu) — the "site navigation".
export const mainMenu = Markup.keyboard([
  ["🏠 Главная", "🤖 AI Агенты"],
  ["💬 Чаты", "📁 Проекты"],
  ["📄 Документы", "📊 Аналитика"],
  ["💳 Подписка", "⚙️ Настройки"],
  ["👤 Профиль", "❓ Помощь"],
]).resize();

export const removeMenu = Markup.removeKeyboard();

// Inline agent picker.
export function agentPicker() {
  const rows = AGENTS.map((a) => [Markup.button.callback(`${a.emoji} ${a.name}`, `agent:${a.id}`)]);
  return Markup.inlineKeyboard(rows);
}

export function chatControls() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🆕 Новый чат", "chat:new"), Markup.button.callback("🕘 История", "chat:history")],
    [Markup.button.callback("🔁 Сменить агента", "menu:agents")],
  ]);
}

export function projectList(projects: { id: string; name: string }[]) {
  const rows = projects.map((p) => [Markup.button.callback(`📁 ${p.name}`.slice(0, 60), `project:open:${p.id}`)]);
  rows.push([Markup.button.callback("➕ Новый проект", "project:new")]);
  return Markup.inlineKeyboard(rows);
}

export function projectActions(id: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("💬 Обсудить с советом", `project:chat:${id}`)],
    [Markup.button.callback("🗑 Архивировать", `project:archive:${id}`), Markup.button.callback("⬅️ Назад", "project:list")],
  ]);
}

export function settingsMenu(defaultModel: string, notify: boolean) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🧠 Модель: ${defaultModel.includes("opus") ? "Opus" : defaultModel.includes("sonnet") ? "Sonnet" : "Haiku"}`, "set:model")],
    [Markup.button.callback(`🔔 Уведомления: ${notify ? "вкл" : "выкл"}`, "set:notify")],
    [Markup.button.callback("🌐 Язык: Русский", "set:lang"), Markup.button.callback("🕒 Часовой пояс", "set:tz")],
    [Markup.button.callback("🔓 Отвязать аккаунт", "set:unlink")],
  ]);
}

export function modelPicker() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⚡ Haiku (быстро)", "model:haiku")],
    [Markup.button.callback("⚖️ Sonnet (баланс)", "model:sonnet")],
    [Markup.button.callback("🧠 Opus (максимум)", "model:opus")],
  ]);
}

export function upgradeButton() {
  return Markup.inlineKeyboard([[Markup.button.url("⬆️ Перейти на Pro", "https://vertlix.ai/pricing")]]);
}
