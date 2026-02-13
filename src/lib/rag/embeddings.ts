import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany, cosineSimilarity } from "ai";

// Separate OpenAI client for embeddings (not the OpenRouter one used for chat)
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Uses default https://api.openai.com/v1 base URL
});

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dimensions, ~$0.02/1M tokens

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: texts,
  });
  return embeddings;
}

export { cosineSimilarity };
