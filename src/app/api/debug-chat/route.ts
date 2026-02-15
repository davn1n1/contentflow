import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      OPENROUTER_API_KEY_set: !!process.env.OPENROUTER_API_KEY,
      OPENROUTER_API_KEY_length: process.env.OPENROUTER_API_KEY?.length || 0,
      OPENROUTER_API_KEY_prefix: process.env.OPENROUTER_API_KEY?.slice(0, 8) || "NOT SET",
      OPENAI_API_KEY_set: !!process.env.OPENAI_API_KEY,
      OPENAI_BASE_URL_set: !!process.env.OPENAI_BASE_URL,
      OPENAI_BASE_URL_value: process.env.OPENAI_BASE_URL || "NOT SET",
      CHAT_MODEL: process.env.CHAT_MODEL || "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Test 1: Direct fetch to OpenRouter
  try {
    const directRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages: [{ role: "user", content: "Say hi in 3 words" }],
        max_tokens: 20,
      }),
    });
    const directData = await directRes.json();
    diagnostics.directFetch = {
      status: directRes.status,
      ok: directRes.ok,
      response: directRes.ok
        ? directData.choices?.[0]?.message?.content?.slice(0, 50)
        : directData,
    };
  } catch (err) {
    diagnostics.directFetch = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Test 2: AI SDK with explicit API key at runtime
  try {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    const { text } = await generateText({
      model: openrouter.chat("anthropic/claude-sonnet-4.5"),
      prompt: "Say hello in 3 words",
      maxOutputTokens: 20,
    });
    diagnostics.aiSdkTest = { success: true, text: text.slice(0, 50) };
  } catch (err) {
    diagnostics.aiSdkTest = {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined,
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
