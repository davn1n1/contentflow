import { createClient } from "@/lib/supabase/server";
import { embedText } from "./embeddings";

export interface ConversationMemory {
  id: string;
  conversation_id: string;
  summary: string;
  topics: string[];
  similarity: number;
  created_at: string;
}

/**
 * Search relevant past conversation summaries by semantic similarity.
 */
export async function searchRelevantMemories(
  userId: string,
  currentQuery: string,
  limit = 3
): Promise<ConversationMemory[]> {
  const queryEmbedding = await embedText(currentQuery);
  return searchMemoriesWithEmbedding(userId, queryEmbedding, limit);
}

/**
 * Search memories using a pre-computed embedding (avoids re-embedding).
 */
export async function searchMemoriesWithEmbedding(
  userId: string,
  queryEmbedding: number[],
  limit = 3
): Promise<ConversationMemory[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("search_conversation_memory", {
      p_user_id: userId,
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.6,
      match_count: limit,
    });

    if (error) {
      console.warn("[Memory] Search failed:", error.message);
      return [];
    }

    return (data || []) as ConversationMemory[];
  } catch (err) {
    console.warn("[Memory] Search error:", err instanceof Error ? err.message : err);
    return [];
  }
}
