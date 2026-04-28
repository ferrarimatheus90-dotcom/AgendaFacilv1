import OpenAI from "openai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const modelMap: Record<string, string> = {
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
};

export async function callOpenAI(
  apiKey: string,
  modelKey: string,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: modelMap[modelKey] ?? "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}
