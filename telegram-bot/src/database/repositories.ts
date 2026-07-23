import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

// ─── Telegram account ↔ Vertlix user ─────────────────────────────────────────
export async function getLinkedAccount(telegramId: bigint) {
  return prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { user: true },
  });
}

export async function touchLastSeen(telegramId: bigint) {
  await prisma.telegramAccount.update({
    where: { telegramId },
    data: { lastSeenAt: new Date() },
  }).catch(() => {});
}

export async function linkAccount(params: {
  telegramId: bigint; userId: string; username?: string; firstName?: string; languageCode?: string;
}) {
  return prisma.telegramAccount.upsert({
    where: { telegramId: params.telegramId },
    create: {
      telegramId: params.telegramId, userId: params.userId,
      username: params.username, firstName: params.firstName, languageCode: params.languageCode,
    },
    update: { userId: params.userId, isBlocked: false },
  });
}

export async function unlinkAccount(telegramId: bigint) {
  await prisma.telegramAccount.delete({ where: { telegramId } }).catch(() => {});
}

// ─── Org resolution (bot scopes everything to the user's org) ────────────────
export async function resolveOrgId(userId: string): Promise<string | null> {
  const m = await prisma.member.findFirst({ where: { userId }, select: { organizationId: true } });
  return m?.organizationId ?? null;
}

// ─── Conversations & messages ────────────────────────────────────────────────
export async function getOrCreateConversation(userId: string, existingId?: string | null, projectId?: string | null) {
  if (existingId) {
    const conv = await prisma.conversation.findFirst({ where: { id: existingId, userId } });
    if (conv) return conv;
  }
  return prisma.conversation.create({ data: { userId, projectId: projectId ?? null, title: "Telegram чат" } });
}

export async function recentMessages(conversationId: string, limit = 12) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.reverse();
}

export async function addMessage(conversationId: string, role: string, content: string, tokensUsed = 0) {
  return prisma.message.create({ data: { conversationId, role, content, tokensUsed } });
}

export async function listConversations(userId: string, take = 10) {
  return prisma.conversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take });
}

export async function deleteConversation(userId: string, id: string) {
  return prisma.conversation.deleteMany({ where: { id, userId } });
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export async function listProjects(userId: string, take = 10) {
  return prisma.project.findMany({ where: { userId, status: { not: "archived" } }, orderBy: { createdAt: "desc" }, take });
}

export async function createProject(userId: string, orgId: string, data: { name: string; industry?: string; stage?: string; description?: string }) {
  return prisma.project.create({ data: { userId, organizationId: orgId, ...data } });
}

export async function getProject(userId: string, id: string) {
  return prisma.project.findFirst({ where: { id, userId } });
}

export async function archiveProject(userId: string, id: string) {
  return prisma.project.updateMany({ where: { id, userId }, data: { status: "archived" } });
}

// ─── Subscription / usage ─────────────────────────────────────────────────────
export async function getPlan(orgId: string | null): Promise<string> {
  if (!orgId) return "free";
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (sub?.plan) return sub.plan;
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
  return org?.plan ?? "free";
}

export async function aiUsageToday(orgId: string | null): Promise<number> {
  if (!orgId) return 0;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const row = await prisma.usageStat.findFirst({
    where: { organizationId: orgId, metric: "ai_requests", periodStart: { gte: start } },
  });
  return Number(row?.value ?? 0n);
}

export async function incrementAiUsage(orgId: string | null) {
  if (!orgId) return;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const existing = await prisma.usageStat.findFirst({ where: { organizationId: orgId, metric: "ai_requests", periodStart: start } });
  if (existing) {
    await prisma.usageStat.update({ where: { id: existing.id }, data: { value: { increment: 1n } } });
  } else {
    await prisma.usageStat.create({ data: { organizationId: orgId, metric: "ai_requests", value: 1n, periodStart: start } });
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export async function logAction(userId: string | null, orgId: string | null, type: string, data: Record<string, unknown> = {}) {
  await prisma.activityLog.create({ data: { userId, organizationId: orgId, type, data: data as Prisma.InputJsonValue } }).catch(() => {});
}
