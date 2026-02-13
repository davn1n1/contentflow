import { createClient } from "@/lib/supabase/server";
import { embedText } from "./embeddings";

export interface ArticleSearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  similarity: number;
}

/**
 * Semantic search for help articles using pgvector embeddings.
 * Falls back to keyword search if embedding fails.
 */
export async function searchArticlesSemantic(
  query: string,
  options?: { threshold?: number; limit?: number; category?: string }
): Promise<ArticleSearchResult[]> {
  const { threshold = 0.45, limit = 5, category } = options || {};

  try {
    const queryEmbedding = await embedText(query);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("search_help_articles_semantic", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) throw error;

    let results = (data || []) as ArticleSearchResult[];
    if (category) {
      results = results.filter((r) => r.category === category);
    }
    return results;
  } catch (err) {
    console.warn("[RAG] Semantic search failed, falling back to keyword:", err instanceof Error ? err.message : err);
    return keywordFallback(query, { limit, category });
  }
}

/**
 * Semantic search using a pre-computed embedding (avoids re-embedding).
 */
export async function searchArticlesWithEmbedding(
  queryEmbedding: number[],
  options?: { threshold?: number; limit?: number; category?: string }
): Promise<ArticleSearchResult[]> {
  const { threshold = 0.45, limit = 5, category } = options || {};

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("search_help_articles_semantic", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) throw error;

    let results = (data || []) as ArticleSearchResult[];
    if (category) {
      results = results.filter((r) => r.category === category);
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Keyword-based fallback search (same as original implementation).
 */
async function keywordFallback(
  query: string,
  options: { limit?: number; category?: string }
): Promise<ArticleSearchResult[]> {
  const { limit = 5, category } = options;

  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from("help_articles")
      .select("id, slug, title, summary, content, category")
      .eq("published", true)
      .order("sort_order");

    if (category) dbQuery = dbQuery.eq("category", category);
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`
    );

    const { data } = await dbQuery.limit(limit);
    return (data || []).map((a) => ({ ...a, similarity: 0 }));
  } catch {
    return [];
  }
}
