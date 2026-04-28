import { prisma } from "../../lib/prisma";

export async function getDashboardStats(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeAgents, conversationsToday, messagesToday, totalConversations] = await Promise.all([
    prisma.agent.count({ where: { userId, status: "ACTIVE" } }),
    prisma.conversation.count({
      where: { agent: { userId }, createdAt: { gte: today } },
    }),
    prisma.message.count({
      where: { conversation: { agent: { userId } }, createdAt: { gte: today } },
    }),
    prisma.conversation.count({ where: { agent: { userId } } }),
  ]);

  return { activeAgents, conversationsToday, messagesToday, totalConversations };
}

export async function getDashboardActivity(userId: string) {
  const since = new Date();
  since.setHours(since.getHours() - 23, 0, 0, 0);

  const messages = await prisma.message.findMany({
    where: {
      conversation: { agent: { userId } },
      createdAt: { gte: since },
      role: "USER",
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets: Record<string, number> = {};

  for (let h = 0; h < 24; h++) {
    const d = new Date(since);
    d.setHours(since.getHours() + h);
    const key = `${String(d.getHours()).padStart(2, "0")}:00`;
    buckets[key] = 0;
  }

  for (const msg of messages) {
    const key = `${String(msg.createdAt.getHours()).padStart(2, "0")}:00`;
    if (key in buckets) buckets[key]++;
  }

  return Object.entries(buckets).map(([hour, count]) => ({ hour, count }));
}

export async function getRecentActivity(userId: string) {
  const messages = await prisma.message.findMany({
    where: { conversation: { agent: { userId } } },
    include: {
      conversation: {
        select: {
          id: true,
          contactName: true,
          contactPhone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return messages.map((m) => ({
    id: m.id,
    type: "MESSAGE",
    content: m.content,
    role: m.role,
    createdAt: m.createdAt,
    contactName: m.conversation.contactName,
    contactPhone: m.conversation.contactPhone,
  }));
}
