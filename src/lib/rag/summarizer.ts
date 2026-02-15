import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { embedText } from "./embeddings";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

interface SummaryResult {
  summary: string;
  topics: string[];
}

/**
 * Summarize a conversation and store the summary with its embedding.
 * Called asynchronously after a conversation reaches 10+ messages.
 */
export async function summarizeAndStoreConversation(
  conversationId: string,
  userId: string,
  accountId: string | null
): Promise<void> {
  try {
    const supabase = await createClient();

    // Check if we already have a recent summary for this conversation
    const { data: existingSummary } = await supabase
      .from("conversation_summaries")
      .select("id, message_count")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get message count for this conversation
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    const messageCount = count || 0;

    // Only summarize if 10+ messages and either no summary or 10+ new messages
    if (messageCount < 10) return;
    if (existingSummary && messageCount - existingSummary.message_count < 10) return;

    // Fetch conversation messages
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at")
      .limit(50);

    if (!messages || messages.length === 0) return;

    // Format messages for summarization
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
      .join("\n");

    // Generate summary with Claude
    const summaryResult = await generateSummary(transcript);

    // Embed the summary
    const embedding = await embedText(summaryResult.summary);

    // Store (upsert based on conversation_id)
    if (existingSummary) {
      await supabase
        .from("conversation_summaries")
        .update({
          summary: summaryResult.summary,
          topics: summaryResult.topics,
          embedding: JSON.stringify(embedding),
          message_count: messageCount,
        })
        .eq("id", existingSummary.id);
    } else {
      await supabase.from("conversation_summaries").insert({
        conversation_id: conversationId,
        user_id: userId,
        account_id: accountId,
        summary: summaryResult.summary,
        topics: summaryResult.topics,
        embedding: JSON.stringify(embedding),
        message_count: messageCount,
      });
    }
  } catch (err) {
    // Non-critical: log and continue
    console.warn("[Summarizer] Failed:", err instanceof Error ? err.message : err);
  }
}

async function generateSummary(transcript: string): Promise<SummaryResult> {
  const { text } = await generateText({
    model: openrouter.chat(process.env.CHAT_MODEL || "anthropic/claude-sonnet-4.5"),
    system: `Eres un asistente que resume conversaciones de soporte tecnico.
Analiza la conversacion y genera un JSON con:
1. "summary": Resumen de 2-3 oraciones en espanol de lo que se discutio y resolvio
2. "topics": Lista de 3-5 keywords/temas principales (en espanol)

Responde SOLO con JSON valido, sin markdown ni texto adicional.`,
    prompt: transcript.slice(0, 4000), // Limit to ~4000 chars
    maxOutputTokens: 200,
  });

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || text,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch {
    return { summary: text.slice(0, 300), topics: [] };
  }
}
