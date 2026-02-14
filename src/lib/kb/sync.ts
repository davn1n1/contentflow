import { createClient } from "@supabase/supabase-js";
import { KB_SOURCES } from "./source-map";
import { generateArticles, discoverNewPages } from "./generator";
import { embedTexts } from "@/lib/rag/embeddings";

export interface KBSyncResult {
  checked: number;
  existing: number;
  generated: number;
  embedded: number;
  failed: number;
  newSlugs: string[];
}

/**
 * Core KB sync logic — shared between Vercel Cron and dev-mode interval.
 * Discovers new pages, generates articles for missing ones, and embeds them.
 */
export async function runKBSync(): Promise<KBSyncResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE env vars");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Auto-discover new pages
  let discoveredPages: typeof KB_SOURCES = [];
  try {
    discoveredPages = await discoverNewPages();
  } catch (err) {
    console.warn(
      "[KB Sync] Auto-discovery failed:",
      err instanceof Error ? err.message : err
    );
  }

  const allSources = [...KB_SOURCES, ...discoveredPages];

  // Check which articles already exist
  const { data: existingArticles } = await supabase
    .from("help_articles")
    .select("slug")
    .in(
      "slug",
      allSources.map((s) => s.id)
    );

  const existingSlugs = new Set(
    (existingArticles || []).map((a) => a.slug)
  );

  // Only generate articles that DON'T exist yet
  const toGenerate = allSources.filter((s) => {
    if (existingSlugs.has(s.id)) return false;
    if (s.sources.length === 0) return false;
    return true;
  });

  if (toGenerate.length === 0) {
    return {
      checked: allSources.length,
      existing: existingSlugs.size,
      generated: 0,
      embedded: 0,
      failed: 0,
      newSlugs: [],
    };
  }

  // Generate new articles (3 at a time)
  const results = await generateArticles(toGenerate, 3);

  let generated = 0;
  let failed = 0;
  const upsertedSlugs: string[] = [];

  for (const { article, error } of results) {
    if (error || !article.content) {
      failed++;
      continue;
    }

    const sortOrder = (existingArticles?.length || 0) + generated + 1;

    const { error: upsertError } = await supabase
      .from("help_articles")
      .upsert(
        {
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          content: article.content,
          category: article.category,
          tags: article.tags,
          sort_order: sortOrder,
          published: true,
          needs_embedding: true,
        },
        { onConflict: "slug" }
      );

    if (!upsertError) {
      generated++;
      upsertedSlugs.push(article.slug);
    } else {
      failed++;
    }
  }

  // Embed new articles
  let embedded = 0;
  if (upsertedSlugs.length > 0) {
    try {
      const { data: toEmbed } = await supabase
        .from("help_articles")
        .select("id, title, summary, content")
        .in("slug", upsertedSlugs);

      if (toEmbed && toEmbed.length > 0) {
        const texts = toEmbed.map(
          (a) => `# ${a.title}\n\n${a.summary || ""}\n\n${a.content || ""}`
        );
        const embeddings = await embedTexts(texts);

        for (let i = 0; i < toEmbed.length; i++) {
          const { error: embedError } = await supabase
            .from("help_articles")
            .update({
              embedding: JSON.stringify(embeddings[i]),
              needs_embedding: false,
            })
            .eq("id", toEmbed[i].id);

          if (!embedError) embedded++;
        }
      }
    } catch (embedErr) {
      console.warn(
        "[KB Sync] Embedding failed:",
        embedErr instanceof Error ? embedErr.message : embedErr
      );
    }
  }

  return {
    checked: allSources.length,
    existing: existingSlugs.size,
    generated,
    embedded,
    failed,
    newSlugs: upsertedSlugs,
  };
}
