import { NextRequest, NextResponse } from "next/server";

/**
 * Allowed domains for media proxy (prevent open proxy abuse).
 * Only proxy files from known sources used in our video pipeline.
 */
const ALLOWED_DOMAINS = [
  "fxforaliving.s3.eu-central-1.amazonaws.com",
  "s3.eu-central-1.amazonaws.com",
  "s3.ap-southeast-2.amazonaws.com",
  "shotstack-ingest-api-stage-sources.s3.ap-southeast-2.amazonaws.com",
  "shotstack-api-stage-output.s3.ap-southeast-2.amazonaws.com",
  "cdn.heygen.com",
  "files.heygen.ai",
  "resource.heygen.ai",
  "ugcfiles.heygen.ai",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/remotion/media-proxy?url=<encoded-url>
 *
 * Server-side proxy for media files that lack CORS headers.
 * Used by the browser render to fetch audio/video from S3.
 * No auth required (URLs are already authenticated via signed params or public).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: "Domain not allowed" },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "ContentFlow365-MediaProxy/1.0" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const headers = new Headers({
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, immutable",
    });
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("[media-proxy] Fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proxy fetch failed" },
      { status: 502 }
    );
  }
}
