import { prisma } from "../../lib/prisma";

interface MemoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getConversationHistory(
  conversationId: string,
  windowSize: number,
): Promise<MemoryMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      role: { in: ["USER", "ASSISTANT"] },
    },
    orderBy: { createdAt: "asc" },
    take: windowSize,
  });

  return messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
}
