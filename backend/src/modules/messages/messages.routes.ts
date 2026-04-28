import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth/auth.middleware";
import { prisma } from "../../lib/prisma";

export async function messagesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/:conversationId", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { conversationId } = req.params as { conversationId: string };
    const { cursor, limit = "50" } = req.query as { cursor?: string; limit?: string };

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, agent: { userId: sub } },
    });

    if (!conversation) {
      return reply.status(404).send({ error: "Conversation not found" });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit), 100),
    });

    return reply.send({ messages: messages.reverse() });
  });
}
