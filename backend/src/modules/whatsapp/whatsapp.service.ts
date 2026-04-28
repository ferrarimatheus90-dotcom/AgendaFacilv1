import { prisma } from "../../lib/prisma";
import { EvolutionClient } from "./evolution.client";
import { env } from "../../config/env";
import { z } from "zod";

const createInstanceSchema = z.object({
  instanceName: z.string().min(1).max(100),
  evolutionUrl: z.string().url().or(z.literal("")).optional(),
  evolutionKey: z.string().or(z.literal("")).optional(),
});

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;

export { createInstanceSchema };

export async function listInstances(userId: string) {
  return prisma.whatsAppInstance.findMany({
    where: { userId },
    include: { _count: { select: { agents: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInstance(userId: string, input: CreateInstanceInput) {
  const evolutionUrl = input.evolutionUrl || env.EVOLUTION_API_URL;
  const evolutionKey = input.evolutionKey || env.EVOLUTION_API_KEY;

  const client = new EvolutionClient(evolutionUrl, evolutionKey);

  try {
    try {
      await client.createInstance(input.instanceName);
    } catch (err: any) {
      // Se já existe, apenas ignore o erro de criação e continue configurando
      if (err.statusCode !== 403 && err.statusCode !== 400) {
        throw err;
      }
      console.log(`[WhatsApp] Instance "${input.instanceName}" already exists on Evolution, reconfiguring...`);
    }

    const webhookUrl = env.WEBHOOK_URL || `${env.FRONTEND_URL.replace("3000", "3001")}/api/webhook/evolution`;
    await client.setWebhook(input.instanceName, {
      url: webhookUrl,
      webhook_by_events: true,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
    });

    // Tentar pegar o status/JID atual
    const status = await client.getInstanceStatus(input.instanceName);
    return prisma.whatsAppInstance.create({
      data: {
        userId,
        instanceName: input.instanceName,
        evolutionUrl,
        evolutionKey,
        phoneNumber: status?.ownerJid?.replace("@s.whatsapp.net", "") || null,
        status: status?.connectionStatus === "open" ? "CONNECTED" : "DISCONNECTED",
      },
    });
  } catch (err) {
    console.warn("[WhatsApp] Error during remote setup, saving local instance:", err);
    return prisma.whatsAppInstance.create({
      data: {
        userId,
        instanceName: input.instanceName,
        evolutionUrl,
        evolutionKey,
      },
    });
  }
}

export async function getInstanceQrCode(instanceId: string, userId: string) {
  const instance = await prisma.whatsAppInstance.findFirst({
    where: { id: instanceId, userId },
  });

  if (!instance) {
    throw Object.assign(new Error("Instance not found"), { statusCode: 404 });
  }

  const client = new EvolutionClient(instance.evolutionUrl, instance.evolutionKey);
  const data = await client.getQrCode(instance.instanceName) as any;

  if (data?.instance?.state === "open") {
    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: "CONNECTED" },
    });
  }

  return data;
}

export async function getInstanceStatus(instanceId: string, userId: string) {
  const instance = await prisma.whatsAppInstance.findFirst({
    where: { id: instanceId, userId },
  });

  if (!instance) {
    throw Object.assign(new Error("Instance not found"), { statusCode: 404 });
  }

  const client = new EvolutionClient(instance.evolutionUrl, instance.evolutionKey);
  const data = await client.getInstanceStatus(instance.instanceName);
  return data;
}
