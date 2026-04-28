import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { messageQueue } from "../../jobs/queue";
import { logger } from "../../lib/logger";
import { z } from "zod";

const evolutionMessageSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.any(),
});

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/evolution", async (req, reply) => {
    logger.info({ body: req.body }, "Received webhook from Evolution API");
    
    const parsed = evolutionMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error }, "Invalid webhook payload");
      return reply.status(200).send({ ok: true });
    }

    const { event, instance: instanceName, data } = parsed.data;

    // Normaliza nomes de evento (v2.3+ usa "messages.upsert", versões antigas "MESSAGES_UPSERT")
    const normalizedEvent = event.toUpperCase().replace(".", "_");

    if (normalizedEvent === "CONNECTION_UPDATE") {
      await handleConnectionUpdate(instanceName, data as Record<string, unknown>);
      return reply.status(200).send({ ok: true });
    }

    if (normalizedEvent !== "MESSAGES_UPSERT" || !data) {
      return reply.status(200).send({ ok: true });
    }

    // Adaptado para Evolution API v2 payload que geralmente vem dentro de data.message ou apenas data
    const messageData = data.message || data;
    
    if (!messageData?.key) {
      logger.warn("Message key missing");
      return reply.status(200).send({ ok: true });
    }

    if (messageData.key.fromMe) {
      return reply.status(200).send({ ok: true });
    }

    const text =
      messageData.message?.conversation ??
      messageData.message?.extendedTextMessage?.text;

    if (!text) {
      logger.warn("Text message not found in payload");
      return reply.status(200).send({ ok: true });
    }

    const phoneNumber = messageData.key.remoteJid.replace("@s.whatsapp.net", "");

    try {
      const whatsappInstance = await prisma.whatsAppInstance.findFirst({
        where: { instanceName },
        include: { agents: { where: { status: "ACTIVE" }, take: 1 } },
      });

      if (!whatsappInstance || whatsappInstance.agents.length === 0) {
        logger.warn({ instanceName }, "No active agent for instance");
        return reply.status(200).send({ ok: true });
      }

      const agent = whatsappInstance.agents[0];

      let conversation = await prisma.conversation.findUnique({
        where: { agentId_contactPhone: { agentId: agent.id, contactPhone: phoneNumber } },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            agentId: agent.id,
            contactPhone: phoneNumber,
            contactName: messageData.pushName,
          },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content: text,
        },
      });

      await messageQueue.add("process-message", {
        conversationId: conversation.id,
        agentId: agent.id,
        instanceName,
        phoneNumber,
      });
    } catch (err) {
      logger.error(err, "Error processing webhook");
    }

    return reply.status(200).send({ ok: true });
  });
}

async function handleConnectionUpdate(instanceName: string, data: Record<string, unknown>) {
  const state = (data as { state?: string }).state;
  if (!state) return;

  const statusMap: Record<string, "CONNECTED" | "DISCONNECTED" | "CONNECTING"> = {
    open: "CONNECTED",
    close: "DISCONNECTED",
    connecting: "CONNECTING",
  };

  const status = statusMap[state];
  if (!status) return;

  await prisma.whatsAppInstance.updateMany({
    where: { instanceName },
    data: { status },
  });
}
