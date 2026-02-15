import { NextRequest, NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// OpenRouter: unified API for Claude, GPT, Gemini, etc.
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
import { authenticateApiRequest } from "@/lib/auth/api-guard";
import { createChatTools } from "@/lib/chat/tools";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { airtableFetch, TABLES } from "@/lib/airtable/client";
import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/rag/embeddings";
import { searchMemoriesWithEmbedding } from "@/lib/rag/memory";
import { buildEnrichedContext } from "@/lib/chat/context-builder";
import { windowMessages } from "@/lib/chat/window-manager";
import { summarizeAndStoreConversation } from "@/lib/rag/summarizer";

export const maxDuration = 60;

// Extract text content from UIMessage parts
function getTextFromMessage(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  // 2. Rate limit
  const rateCheck = checkRateLimit(auth.user.userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before sending more messages." },
      { status: 429 }
    );
  }

  try {
    // 3. Parse request body
    const body = await request.json();
    const { messages, conversationId, accountId, accountName, pathname } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    // 4. Get user's accessible account IDs and resolve their names
    // Airtable linked record fields resolve to display names in formulas,
    // so we need names (not IDs) for FIND/ARRAYJOIN filters.
    let userAccountIds: string[] = [];
    let userAccountNames: string[] = [];
    if (auth.user.airtable_user_id) {
      try {
        const { records } = await airtableFetch(TABLES.USUARIOS, {
          filterByFormula: `RECORD_ID()='${auth.user.airtable_user_id}'`,
          fields: ["🏢Account"],
          maxRecords: 1,
        });
        if (records.length > 0) {
          const accountField = (records[0].fields as Record<string, unknown>)["🏢Account"];
          userAccountIds = Array.isArray(accountField) ? accountField : [];
        }
      } catch {
        // If Airtable fails, continue without account scoping
      }

      // Resolve account IDs → names for Airtable formula filtering
      if (userAccountIds.length > 0) {
        try {
          const idFilter = userAccountIds.length === 1
            ? `RECORD_ID()='${userAccountIds[0]}'`
            : `OR(${userAccountIds.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
          const { records: accountRecords } = await airtableFetch(TABLES.ACCOUNT, {
            filterByFormula: idFilter,
            fields: ["Name"],
            maxRecords: userAccountIds.length,
          });
          userAccountNames = accountRecords
            .map((r) => (r.fields as Record<string, unknown>)["Name"] as string)
            .filter(Boolean);
        } catch {
          // Continue without names — tools will fail gracefully
        }
      }
    }

    // 5. Extract last user message text for embedding
    const lastUserMessage = [...messages].reverse().find((m: UIMessage) => m.role === "user");
    const lastMessageText = lastUserMessage ? getTextFromMessage(lastUserMessage) : "";

    // 6. Embed query ONCE — reuse for memory search AND tool calls
    let queryEmbedding: number[] | undefined;
    try {
      if (lastMessageText) {
        queryEmbedding = await embedText(lastMessageText);
      }
    } catch {
      // If embedding fails, continue without it — tools will use keyword fallback
    }

    // 7. Parallel fetches: enriched context + conversation memories
    const [enriched, memories] = await Promise.all([
      buildEnrichedContext(accountId || undefined, userAccountIds, userAccountNames).catch(() => null),
      queryEmbedding
        ? searchMemoriesWithEmbedding(auth.user.userId, queryEmbedding, 3).catch(() => [])
        : Promise.resolve([]),
    ]);

    // 8. Convert UIMessages → ModelMessages, then window if too long
    const modelMessages = await convertToModelMessages(messages);
    const windowed = await windowMessages(modelMessages);

    // 9. Build system prompt with all context
    const systemPrompt = buildSystemPrompt(
      { email: auth.user.email },
      {
        accountId: accountId || undefined,
        accountName: accountName || undefined,
        accountIds: userAccountIds,
      },
      enriched,
      memories,
      windowed.summary,
      pathname || undefined
    );

    // 10. Create tools scoped to user's accounts (by name) + pre-computed embedding
    const tools = createChatTools(userAccountNames, { queryEmbedding });

    // 11. Manage conversation persistence
    const supabase = await createClient();
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      // Create new conversation
      const title = lastMessageText ? lastMessageText.slice(0, 100) : "New conversation";

      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: auth.user.userId,
          title,
          account_id: accountId || null,
          metadata: { accountName: accountName || null },
        })
        .select("id")
        .single();

      activeConversationId = newConv?.id;
    } else {
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConversationId);
    }

    // 12. Save user message to DB
    if (lastUserMessage && activeConversationId) {
      await supabase.from("chat_messages").insert({
        conversation_id: activeConversationId,
        role: "user",
        content: lastMessageText,
      });
    }

    // 13. Stream AI response
    const chatModel = process.env.CHAT_MODEL || "anthropic/claude-sonnet-4.5";
    console.log("[Chat] Using model:", chatModel, "| OPENROUTER_API_KEY set:", !!process.env.OPENROUTER_API_KEY);
    const result = streamText({
      model: openrouter.chat(chatModel),
      system: systemPrompt,
      messages: windowed.messages,
      tools,
      onFinish: async ({ text }) => {
        if (activeConversationId && text) {
          await supabase.from("chat_messages").insert({
            conversation_id: activeConversationId,
            role: "assistant",
            content: text,
          });

          // Async: summarize conversation if it has enough messages (non-blocking)
          summarizeAndStoreConversation(
            activeConversationId,
            auth.user.userId,
            accountId || null
          ).catch((err) =>
            console.warn("[Chat] Summarization failed:", err instanceof Error ? err.message : err)
          );
        }
      },
    });

    // Return streaming response with conversation ID header
    const response = result.toUIMessageStreamResponse();

    if (activeConversationId) {
      response.headers.set("X-Conversation-Id", activeConversationId);
    }

    return response;
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
