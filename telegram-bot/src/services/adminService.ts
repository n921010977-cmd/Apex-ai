import { prisma } from "../database/prisma.js";

// Admin operations — all gated by isAdmin() at the command layer.
export async function stats() {
  const [users, linked, convos, messages, projects] = await Promise.all([
    prisma.user.count(),
    prisma.telegramAccount.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.project.count(),
  ]);
  const activeToday = await prisma.telegramAccount.count({
    where: { lastSeenAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
  });
  return { users, linked, activeToday, convos, messages, projects };
}

export async function listRecentUsers(take = 10) {
  return prisma.telegramAccount.findMany({
    orderBy: { lastSeenAt: "desc" }, take,
    include: { user: { select: { email: true, tier: true } } },
  });
}

export async function setBlocked(telegramId: bigint, blocked: boolean) {
  return prisma.telegramAccount.update({ where: { telegramId }, data: { isBlocked: blocked } });
}

export async function setPlan(telegramId: bigint, plan: string) {
  const acc = await prisma.telegramAccount.findUnique({ where: { telegramId }, select: { userId: true } });
  if (!acc) return null;
  const member = await prisma.member.findFirst({ where: { userId: acc.userId }, select: { organizationId: true } });
  if (!member) return null;
  await prisma.organization.update({ where: { id: member.organizationId }, data: { plan } });
  await prisma.subscription.upsert({
    where: { organizationId: member.organizationId },
    create: { organizationId: member.organizationId, plan, status: "active" },
    update: { plan },
  });
  return plan;
}

export async function recentLogs(take = 15) {
  return prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take });
}
