import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KB_SOURCES } from "@/lib/kb/source-map";
import { generateArticles, discoverNewPages } from "@/lib/kb/generator";
import { embedTexts } from "@/lib/rag/embeddings";

/**
 * GET /api/cron/kb-sync
 *
 * Vercel Cron Job — runs every hour.
 * Checks for new pages not yet in the KB and generates articles for them.
 * Only generates articles that don't already exist (incremental).
 *
 * Auth: Vercel Cron secret (CRON_SECRET env var)
 */
export async function GET(request: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Auto-discover new pages
    let discoveredPages: typeof KB_SOURCES = [];
    try {
      discoveredPages = await discoverNewPages();
    } catch (err) {
      console.warn("[KB Cron] Auto-discovery failed:", err instanceof Error ? err.message : err);
    }

    const allSources = [...KB_SOURCES, ...discoveredPages];

    // Check which articles already exist
    const { data: existingArticles } = await supabase
      .from("help_articles")
      .select("slug")
      .in("slug", allSources.map((s) => s.id));

    const existingSlugs = new Set((existingArticles || []).map((a) => a.slug));

    // Only generate articles that DON'T exist yet (truly new pages)
    const toGenerate = allSources.filter((s) => {
      if (existingSlugs.has(s.id)) return false;
      if (s.sources.length === 0) return false;
      return true;
    });

    if (toGenerate.length === 0) {
      return NextResponse.json({
        message: "No new articles to generate",
        checked: allSources.length,
        existing: existingSlugs.size,
        new: 0,
      });
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
          "[KB Cron] Embedding failed:",
          embedErr instanceof Error ? embedErr.message : embedErr
        );
      }
    }

    return NextResponse.json({
      message: `Cron: generated ${generated} new articles, embedded ${embedded}, failed ${failed}`,
      checked: allSources.length,
      existing: existingSlugs.size,
      generated,
      embedded,
      failed,
      newSlugs: upsertedSlugs,
    });
  } catch (err) {
    console.error("[KB Cron] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
