import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth/auth.middleware";
import { listConversations, getConversation } from "./conversations.service";
import { prisma } from "../../lib/prisma";
import { EvolutionClient } from "../whatsapp/evolution.client";

export async function conversationsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { agentId } = req.query as { agentId?: string };
    const conversations = await listConversations(sub, agentId);
    return reply.send({ conversations });
  });

  app.get("/:id", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const conversation = await getConversation(id, sub);
    return reply.send({ conversation });
  });

  app.post("/:id/intervene", async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const { text } = req.body as { text: string };

    if (!text?.trim()) {
      return reply.status(400).send({ error: "text is required" });
    }

    const conversation = await getConversation(id, sub);

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { agents: { some: { id: conversation.agentId } } },
    });

    if (!instance) {
      return reply.status(400).send({ error: "No WhatsApp instance linked to this agent" });
    }

    const client = new EvolutionClient(instance.evolutionUrl, instance.evolutionKey);
    await client.sendText(instance.instanceName, {
      number: conversation.contactPhone,
      text,
    });

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: "ASSISTANT",
        content: text,
      },
    });

    return reply.send({ message });
  });
}
