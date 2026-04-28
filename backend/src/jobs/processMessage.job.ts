import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { generateResponse } from "../modules/ai/ai.service";
import { EvolutionClient } from "../modules/whatsapp/evolution.client";

export interface MessageJobData {
  conversationId: string;
  agentId: string;
  instanceName: string;
  phoneNumber: string;
}

export async function processMessageJob(data: MessageJobData): Promise<void> {
  const { conversationId, agentId, instanceName, phoneNumber } = data;

  logger.info({ conversationId }, "Processing message job");

  const responseText = await generateResponse(agentId, conversationId);

  await prisma.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: responseText,
      processedAt: new Date(),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const instance = await prisma.whatsAppInstance.findFirst({
    where: { instanceName },
  });

  if (!instance) {
    throw new Error(`Instance not found: ${instanceName}`);
  }

  const client = new EvolutionClient(instance.evolutionUrl, instance.evolutionKey);
  await client.sendText(instanceName, { number: phoneNumber, text: responseText });

  logger.info({ conversationId }, "Message processed and sent");
}

export function startWorker() {
  logger.info("Worker mode: inline (no Redis required)");
}
