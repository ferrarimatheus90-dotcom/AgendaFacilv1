import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  model: z.enum(["CLAUDE_SONNET", "CLAUDE_HAIKU", "GPT_4O", "GPT_4O_MINI"]).default("GPT_4O"),
  tone: z.enum(["FRIENDLY", "PROFESSIONAL", "CASUAL", "TECHNICAL"]).default("FRIENDLY"),
  language: z.string().default("pt-BR"),
  memoryEnabled: z.boolean().default(true),
  memoryWindow: z.number().int().min(1).max(100).default(20),
  instanceId: z.string().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
