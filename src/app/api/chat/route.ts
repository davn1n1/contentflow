import { NextRequest, NextResponse } from "next/server";
import { streamText, type UIMessage } from "ai";
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
    const { messages, conversationId, accountId, accountName } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    // 4. Get user's accessible account IDs from Airtable
    let userAccountIds: string[] = [];
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
    }

    // 5. Build system prompt with user context
    const systemPrompt = buildSystemPrompt(
      { email: auth.user.email },
      {
        accountId: accountId || undefined,
        accountName: accountName || undefined,
        accountIds: userAccountIds,
      }
    );

    // 6. Create tools scoped to user's accounts
    const tools = createChatTools(userAccountIds);

    // 7. Manage conversation persistence
    const supabase = await createClient();
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      // Create new conversation
      const lastUserMsg = [...messages].reverse().find((m: UIMessage) => m.role === "user");
      const title = lastUserMsg ? getTextFromMessage(lastUserMsg).slice(0, 100) : "New conversation";

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

    // 8. Save user message to DB
    const lastUserMessage = [...messages].reverse().find((m: UIMessage) => m.role === "user");
    if (lastUserMessage && activeConversationId) {
      await supabase.from("chat_messages").insert({
        conversation_id: activeConversationId,
        role: "user",
        content: getTextFromMessage(lastUserMessage),
      });
    }

    // 9. Stream AI response
    const result = streamText({
      model: openrouter(process.env.CHAT_MODEL || "anthropic/claude-sonnet-4-5"),
      system: systemPrompt,
      messages,
      tools,
      onFinish: async ({ text }) => {
        if (activeConversationId && text) {
          await supabase.from("chat_messages").insert({
            conversation_id: activeConversationId,
            role: "assistant",
            content: text,
          });
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
