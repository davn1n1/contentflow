import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { KB_SOURCES } from "@/lib/kb/source-map";
import { generateArticles } from "@/lib/kb/generator";
import { embedTexts } from "@/lib/rag/embeddings";

/**
 * POST /api/admin/kb/generate
 *
 * Auto-generate help articles from codebase analysis.
 * Uses Claude to read source files (routes, docs, components) and produce KB articles.
 *
 * Body (optional):
 *   { "slugs": ["slug1", "slug2"], "regenerate": false }
 *   - slugs: Only generate these specific articles. If omitted, generate all.
 *   - regenerate: If true, regenerate even if article already exists. Default: false.
 *
 * Auth: API key in X-Admin-Key header (same as N8N_WEBHOOK_AUTH_VALUE)
 */
export async function POST(request: NextRequest) {
  // Auth
  const adminKey = request.headers.get("X-Admin-Key");
  const expectedKey = process.env.N8N_WEBHOOK_AUTH_VALUE;
  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse optional body
    let slugs: string[] | undefined;
    let regenerate = false;

    try {
      const body = await request.json();
      slugs = Array.isArray(body.slugs) ? body.slugs : undefined;
      regenerate = body.regenerate === true;
    } catch {
      // No body or invalid JSON — process all sources
    }

    // Service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Filter sources based on request
    let sources = slugs
      ? KB_SOURCES.filter((s) => slugs!.includes(s.id))
      : KB_SOURCES;

    // Check which articles already exist
    const { data: existingArticles } = await supabase
      .from("help_articles")
      .select("slug")
      .in("slug", sources.map((s) => s.id));

    const existingSlugs = new Set((existingArticles || []).map((a) => a.slug));

    // Filter out existing articles (unless regenerate=true or source says skipIfExists)
    const toGenerate = sources.filter((s) => {
      if (s.skipIfExists && existingSlugs.has(s.id) && !regenerate) return false;
      if (existingSlugs.has(s.id) && !regenerate) return false;
      if (s.sources.length === 0 && !existingSlugs.has(s.id)) return false; // No sources and doesn't exist yet — skip for now
      return true;
    });

    const skipped = sources.length - toGenerate.length;

    if (toGenerate.length === 0) {
      return NextResponse.json({
        message: "No articles to generate",
        total: sources.length,
        skipped,
        generated: 0,
        embedded: 0,
        failed: 0,
      });
    }

    // Generate articles with Claude (3 at a time)
    const results = await generateArticles(toGenerate, 3);

    // Upsert into help_articles
    let generated = 0;
    let failed = 0;
    const upsertedSlugs: string[] = [];
    const details: { slug: string; title: string; status: string }[] = [];

    for (const { article, error } of results) {
      if (error || !article.content) {
        failed++;
        details.push({ slug: article.slug, title: article.title, status: `error: ${error || "empty content"}` });
        continue;
      }

      // Determine sort_order based on existing count + position
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

      if (upsertError) {
        failed++;
        details.push({ slug: article.slug, title: article.title, status: `db error: ${upsertError.message}` });
      } else {
        generated++;
        upsertedSlugs.push(article.slug);
        details.push({ slug: article.slug, title: article.title, status: "ok" });
      }
    }

    // Embed new/updated articles
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
          "[KB Generate] Embedding failed:",
          embedErr instanceof Error ? embedErr.message : embedErr
        );
      }
    }

    return NextResponse.json({
      message: `Generated ${generated} articles, embedded ${embedded}, skipped ${skipped}, failed ${failed}`,
      total: sources.length,
      generated,
      embedded,
      skipped,
      failed,
      details,
    });
  } catch (err) {
    console.error("[KB Generate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
