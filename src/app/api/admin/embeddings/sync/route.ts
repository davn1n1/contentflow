import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/rag/embeddings";

/**
 * POST /api/admin/embeddings/sync
 *
 * Generate/sync embeddings for help_articles that need them.
 * Processes articles with needs_embedding = true.
 *
 * Auth: API key in X-Admin-Key header (same as N8N_WEBHOOK_AUTH_VALUE)
 */
export async function POST(request: NextRequest) {
  // Auth: check admin key
  const adminKey = request.headers.get("X-Admin-Key");
  const expectedKey = process.env.N8N_WEBHOOK_AUTH_VALUE;
  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch articles that need embedding
    const { data: articles, error: fetchError } = await supabase
      .from("help_articles")
      .select("id, title, summary, content")
      .eq("needs_embedding", true)
      .eq("published", true);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({ message: "No articles need embedding", processed: 0 });
    }

    // Build text to embed: title + summary + content
    const texts = articles.map(
      (a) => `# ${a.title}\n\n${a.summary || ""}\n\n${a.content || ""}`
    );

    // Embed in batches of 20 (OpenAI limit is ~2048 per batch)
    const BATCH_SIZE = 20;
    const results: { id: string; title: string; status: string }[] = [];

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const batchTexts = texts.slice(i, i + BATCH_SIZE);

      const embeddings = await embedTexts(batchTexts);

      // Update each article with its embedding
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from("help_articles")
          .update({
            embedding: JSON.stringify(embeddings[j]),
            needs_embedding: false,
          })
          .eq("id", batch[j].id);

        results.push({
          id: batch[j].id,
          title: batch[j].title,
          status: updateError ? `error: ${updateError.message}` : "ok",
        });
      }
    }

    const success = results.filter((r) => r.status === "ok").length;
    const failed = results.filter((r) => r.status !== "ok").length;

    return NextResponse.json({
      message: `Processed ${articles.length} articles`,
      processed: success,
      failed,
      results,
    });
  } catch (err) {
    console.error("[Embeddings Sync] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
