import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { ModelMessage } from "ai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Window long conversations to prevent unbounded context growth.
 * Keeps the most recent messages and summarizes older ones.
 */
export async function windowMessages(
  messages: ModelMessage[],
  options?: { maxMessages?: number }
): Promise<{ summary: string | null; messages: ModelMessage[] }> {
  const maxMessages = options?.maxMessages || 20;

  if (messages.length <= maxMessages) {
    return { summary: null, messages };
  }

  const older = messages.slice(0, -maxMessages);
  const recent = messages.slice(-maxMessages);

  const summary = await summarizeOlderMessages(older);

  return { summary, messages: recent };
}

async function summarizeOlderMessages(messages: ModelMessage[]): Promise<string> {
  try {
    // Format messages into a readable transcript
    const transcript = messages
      .map((m) => {
        const role = m.role === "user" ? "Usuario" : "Asistente";
        const text =
          typeof m.content === "string"
            ? m.content
            : Array.isArray(m.content)
              ? m.content
                  .filter((p): p is { type: "text"; text: string } => p.type === "text")
                  .map((p) => p.text)
                  .join("")
              : "";
        return `${role}: ${text}`;
      })
      .filter((line) => line.length > 10) // Skip empty/tiny messages
      .join("\n");

    if (!transcript.trim()) return "";

    const { text } = await generateText({
      model: openrouter.chat(process.env.CHAT_MODEL || "anthropic/claude-sonnet-4.5"),
      system: `Resume la conversacion anterior de forma concisa en 3-5 oraciones en espanol.
Incluye: temas discutidos, decisiones tomadas, problemas resueltos o pendientes.
Responde SOLO con el resumen, sin formato adicional.`,
      prompt: transcript.slice(0, 6000),
      maxOutputTokens: 300,
    });

    return text;
  } catch (err) {
    console.warn("[WindowManager] Summary failed:", err instanceof Error ? err.message : err);
    return "";
  }
}
