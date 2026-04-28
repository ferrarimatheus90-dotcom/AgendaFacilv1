import { prisma } from "../../lib/prisma";
import { getAgent } from "./agents.service";
import { generateResponse } from "../ai/ai.service";

const TEST_PHONE = "test-session";

export async function testAgent(
  agentId: string,
  userId: string,
  userMessage: string,
): Promise<{ userMessage: string; assistantReply: string; conversationId: string }> {
  await getAgent(agentId, userId);

  // Reutiliza ou cria uma conversa de teste para este agente
  let conversation = await prisma.conversation.findUnique({
    where: { agentId_contactPhone: { agentId, contactPhone: TEST_PHONE } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { agentId, contactPhone: TEST_PHONE, contactName: "Teste" },
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: userMessage },
  });

  const reply = await generateResponse(agentId, conversation.id);

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: reply,
      processedAt: new Date(),
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return { userMessage, assistantReply: reply, conversationId: conversation.id };
}
