import Anthropic from "@anthropic-ai/sdk";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const modelMap: Record<string, string> = {
  CLAUDE_SONNET: "claude-sonnet-4-20250514",
  CLAUDE_HAIKU: "claude-haiku-4-5",
};

export async function callClaude(
  apiKey: string,
  modelKey: string,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: modelMap[modelKey] ?? "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}
