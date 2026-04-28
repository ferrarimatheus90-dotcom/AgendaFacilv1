import { prisma } from "../../lib/prisma";

export async function listConversations(userId: string, agentId?: string) {
  return prisma.conversation.findMany({
    where: {
      agent: { userId },
      ...(agentId ? { agentId } : {}),
    },
    include: {
      agent: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id, agent: { userId } },
    include: {
      agent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    throw Object.assign(new Error("Conversation not found"), { statusCode: 404 });
  }

  return conversation;
}
