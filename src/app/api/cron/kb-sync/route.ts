import { NextRequest, NextResponse } from "next/server";
import { runKBSync } from "@/lib/kb/sync";

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
    const result = await runKBSync();

    if (result.generated === 0) {
      return NextResponse.json({
        message: "No new articles to generate",
        ...result,
      });
    }

    return NextResponse.json({
      message: `Cron: generated ${result.generated} new articles, embedded ${result.embedded}, failed ${result.failed}`,
      ...result,
    });
  } catch (err) {
    console.error("[KB Cron] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
