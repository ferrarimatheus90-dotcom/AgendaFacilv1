import { prisma } from "../../lib/prisma";
import type { CreateAgentInput, UpdateAgentInput } from "./agents.schema";

export async function listAgents(userId: string) {
  return prisma.agent.findMany({
    where: { userId },
    include: {
      instance: { select: { id: true, instanceName: true, status: true, phoneNumber: true } },
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAgent(id: string, userId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id, userId },
    include: {
      instance: { select: { id: true, instanceName: true, status: true, phoneNumber: true } },
    },
  });

  if (!agent) {
    throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
  }

  return agent;
}

export async function createAgent(userId: string, input: CreateAgentInput) {
  return prisma.agent.create({
    data: { ...input, userId },
  });
}

export async function updateAgent(id: string, userId: string, input: UpdateAgentInput) {
  await getAgent(id, userId);

  return prisma.agent.update({
    where: { id },
    data: input,
  });
}

export async function deleteAgent(id: string, userId: string) {
  await getAgent(id, userId);

  return prisma.agent.delete({ where: { id } });
}

export async function toggleAgent(id: string, userId: string) {
  const agent = await getAgent(id, userId);
  const newStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

  return prisma.agent.update({
    where: { id },
    data: { status: newStatus },
    select: { id: true, status: true },
  });
}
