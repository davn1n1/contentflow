import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/proxy/media/info
 *
 * Batch endpoint: accepts an array of URLs and returns their Content-Length
 * via HEAD requests. Used by the Preview page to show file sizes.
 *
 * Body: { urls: string[] }
 * Returns: { [url]: { size: number | null, type: string | null } }
 */

const ALLOWED_PATTERNS = [
  /\.amazonaws\.com$/,
  /\.cloudfront\.net$/,
  /\.elevenlabs\.io$/,
  /\.supabase\.co$/,
  /\.cloudflarestream\.com$/,
  /\.shotstack\.io$/,
  /\.googleusercontent\.com$/,
  /\.googleapis\.com$/,
  /\.heygen\.com$/,
  /\.pexels\.com$/,
  /\.suno\.ai$/,
  /\.suno\.com$/,
];

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_PATTERNS.some((p) => p.test(parsed.hostname));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = body?.urls;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls array required" }, { status: 400 });
    }

    // Limit to 100 URLs per request
    const batch = urls.slice(0, 100).filter(isAllowed);

    const results: Record<string, { size: number | null; type: string | null }> = {};

    // Parallel HEAD requests (max 10 concurrent)
    const chunks: string[][] = [];
    for (let i = 0; i < batch.length; i += 10) {
      chunks.push(batch.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD" });
          const cl = res.headers.get("Content-Length");
          const ct = res.headers.get("Content-Type");
          results[url] = {
            size: cl ? parseInt(cl, 10) : null,
            type: ct,
          };
        } catch {
          results[url] = { size: null, type: null };
        }
      });
      await Promise.all(promises);
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
