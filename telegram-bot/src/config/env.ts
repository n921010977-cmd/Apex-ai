import "dotenv/config";
import { z } from "zod";

// Fail fast on misconfiguration — a bot with a missing BOT_TOKEN should never boot.
const schema = z.object({
  BOT_TOKEN: z.string().min(10, "BOT_TOKEN is required (get it from @BotFather)"),
  BOT_MODE: z.enum(["polling", "webhook"]).default("polling"),
  WEBHOOK_DOMAIN: z.string().url().optional(),
  WEBHOOK_PATH: z.string().default("/tg/webhook"),
  PORT: z.coerce.number().default(8080),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEFAULT_MODEL: z.string().default("claude-haiku-4-5-20251001"),

  REDIS_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("Vertlix AI <onboarding@resend.dev>"),

  ADMIN_TELEGRAM_IDS: z.string().default(""),
  BOT_SECRET: z.string().default("vertlix-bot-dev-secret-change-me"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] Invalid configuration:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const adminIds = new Set(
  env.ADMIN_TELEGRAM_IDS.split(",").map((s) => s.trim()).filter(Boolean).map((s) => BigInt(s)),
);

export function isAdmin(telegramId: bigint): boolean {
  return adminIds.has(telegramId);
}
