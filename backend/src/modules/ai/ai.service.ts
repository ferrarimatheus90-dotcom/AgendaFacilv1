import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { callClaude } from "./providers/claude.provider";
import { callOpenAI } from "./providers/openai.provider";
import { getConversationHistory } from "./memory.service";

const CLAUDE_MODELS = new Set(["CLAUDE_SONNET", "CLAUDE_HAIKU"]);
const OPENAI_MODELS = new Set(["GPT_4O", "GPT_4O_MINI"]);

export async function generateResponse(agentId: string, conversationId: string): Promise<string> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: { select: { apiKeyAnthropic: true, apiKeyOpenAI: true } } },
  });

  if (!agent) throw new Error("Agent not found");

  const history = agent.memoryEnabled
    ? await getConversationHistory(conversationId, agent.memoryWindow)
    : await getConversationHistory(conversationId, 1);

  if (history.length === 0) throw new Error("No messages to process");

  const systemPrompt = buildSystemPrompt(agent.systemPrompt, agent.tone, agent.language);

  if (CLAUDE_MODELS.has(agent.model)) {
    const apiKey = (agent.user.apiKeyAnthropic || env.ANTHROPIC_API_KEY || "").trim();
    if (!apiKey) {
      throw Object.assign(
        new Error("Chave da Anthropic não configurada. Vá em Configurações → Chaves de API e adicione sua ANTHROPIC_API_KEY, ou mude o modelo do agente para GPT-4o."),
        { statusCode: 422 },
      );
    }
    return callClaude(apiKey, agent.model, systemPrompt, history);
  }

  if (OPENAI_MODELS.has(agent.model)) {
    const apiKey = (agent.user.apiKeyOpenAI || env.OPENAI_API_KEY || "").trim();
    if (!apiKey) {
      throw Object.assign(
        new Error("Chave da OpenAI não configurada. Vá em Configurações → Chaves de API e adicione sua OPENAI_API_KEY, ou mude o modelo do agente para Claude."),
        { statusCode: 422 },
      );
    }
    return callOpenAI(apiKey, agent.model, systemPrompt, history);
  }

  throw new Error(`Unsupported model: ${agent.model}`);
}

function buildSystemPrompt(base: string, tone: string, language: string): string {
  const toneInstructions: Record<string, string> = {
    FRIENDLY: "Be warm, approachable, and conversational.",
    PROFESSIONAL: "Be formal, precise, and professional.",
    CASUAL: "Be relaxed, informal, and natural.",
    TECHNICAL: "Be detailed, accurate, and technical.",
  };

  return [
    base,
    `Tone: ${toneInstructions[tone] ?? ""}`,
    `Always respond in ${language}.`,
  ].join("\n\n");
}
