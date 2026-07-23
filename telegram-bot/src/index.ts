import { env } from "./config/env.js";
import { buildBot } from "./bot.js";
import { disconnect } from "./database/prisma.js";

async function main() {
  const bot = buildBot();

  // Command hints shown in the Telegram "/" menu.
  await bot.telegram.setMyCommands([
    { command: "start", description: "Запустить / главное меню" },
    { command: "link", description: "Привязать аккаунт Vertlix" },
    { command: "menu", description: "Главное меню" },
    { command: "agents", description: "Выбрать AI-директора" },
    { command: "new", description: "Новый чат" },
    { command: "help", description: "Помощь" },
  ]);

  if (env.BOT_MODE === "webhook") {
    if (!env.WEBHOOK_DOMAIN) throw new Error("WEBHOOK_DOMAIN is required in webhook mode");
    await bot.launch({
      webhook: { domain: env.WEBHOOK_DOMAIN, hookPath: env.WEBHOOK_PATH, port: env.PORT },
    });
    console.log(`[bot] webhook mode on :${env.PORT}${env.WEBHOOK_PATH}`);
  } else {
    await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});
    // launch() resolves only after the bot stops; don't await it here.
    void bot.launch();
    console.log("[bot] long-polling mode started");
  }

  const shutdown = async (sig: string) => {
    console.log(`[bot] ${sig} — shutting down`);
    bot.stop(sig);
    await disconnect();
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[bot] fatal:", err);
  process.exit(1);
});
