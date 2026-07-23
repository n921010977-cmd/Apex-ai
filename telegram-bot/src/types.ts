import type { Context } from "telegraf";

export type SessionMode =
  | "idle" | "chat"
  | "link_email" | "link_code"
  | "project_name" | "project_industry";

export interface SessionData {
  mode: SessionMode;
  draftProject?: { name?: string; industry?: string };
  linkEmail?: string;
}

export interface LinkedUser {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  createdAt: Date;
}

export interface LinkedAccount {
  telegramId: bigint;
  userId: string;
  defaultModel: string;
  activeAgent: string;
  activeConversationId: string | null;
  notifyEnabled: boolean;
  isBlocked: boolean;
  user: LinkedUser;
  orgId: string | null;
}

export interface BotContext extends Context {
  session: SessionData;
  account?: LinkedAccount;
}
