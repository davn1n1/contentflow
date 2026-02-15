import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/media?url=<encoded_url>
 *
 * Proxies external media assets (images, audio, small video) through Vercel CDN.
 * This eliminates CORS issues and caches assets on Vercel's edge network,
 * making them load fast regardless of origin location (e.g. Shotstack S3 in Australia).
 *
 * Cache: 1 day in browser, 30 days on Vercel CDN.
 * Whitelisted domains only (SSRF prevention).
 *
 * For large video files, use Cloudflare Stream proxy (/api/remotion/proxy) instead.
 */

// Allowed hostname patterns for proxying (prevents SSRF)
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

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_PATTERNS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url query parameter" },
      { status: 400 }
    );
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: `Domain not in whitelist: ${new URL(url).hostname}` },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        // Pass through range requests for partial content (seek support)
        ...(request.headers.get("range")
          ? { Range: request.headers.get("range")! }
          : {}),
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("Content-Type") || "application/octet-stream";
    const contentLength = upstream.headers.get("Content-Length");

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", contentLength);

    // Cache: 1 day browser, 30 days Vercel CDN, stale-while-revalidate 1 day
    headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400"
    );

    // CORS: allow any origin (Remotion Player may run in iframe)
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Range");

    // Pass through range response headers
    if (upstream.status === 206) {
      const contentRange = upstream.headers.get("Content-Range");
      if (contentRange) headers.set("Content-Range", contentRange);
      headers.set("Accept-Ranges", "bytes");
      return new NextResponse(upstream.body, { status: 206, headers });
    }

    headers.set("Accept-Ranges", "bytes");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("[MediaProxy] Fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Media proxy fetch failed",
      },
      { status: 502 }
    );
  }
}

/** Handle CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Max-Age": "86400",
    },
  });
}
