import { NextRequest, NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";
import { createClient } from "@/lib/supabase/server";
import type { RemotionTimeline } from "@/lib/remotion/types";

const AWS_REGION = process.env.REMOTION_AWS_REGION as
  | "eu-central-1"
  | "us-east-1"
  | "eu-west-1";

// AWS Lambda concurrent execution limit for this account.
// New accounts start with very low burst concurrency (~2-3).
// Once AWS approves the quota increase (requested 1500), update this env var.
// Check status: https://eu-central-1.console.aws.amazon.com/servicequotas/home/services/lambda/quotas/L-B99A9384
const LAMBDA_CONCURRENCY_LIMIT = parseInt(
  process.env.REMOTION_LAMBDA_CONCURRENCY ?? "3",
  10
);

/**
 * Calculate optimal framesPerLambda to stay within concurrency limits.
 * Remotion uses 1 main Lambda + N chunk Lambdas running concurrently.
 * We reserve 2 slots (main + stitcher) and distribute frames across the rest.
 *
 * With concurrency 3 → maxChunks=1 → all frames in 1 Lambda (safest).
 * With concurrency 1500 → maxChunks=1498 → fast parallel rendering.
 */
function calculateFramesPerLambda(totalFrames: number): number {
  const maxChunks = Math.max(LAMBDA_CONCURRENCY_LIMIT - 2, 1);
  const calculated = Math.ceil(totalFrames / maxChunks);
  // Minimum 20 frames per chunk (no point in smaller chunks)
  return Math.max(calculated, 20);
}

/**
 * POST /api/remotion/render
 *
 * Launches a Remotion Lambda render for a given timeline.
 * Body: { timelineId: string }
 * Returns: { renderId, bucketName, framesPerLambda, estimatedChunks }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const functionName = process.env.REMOTION_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;

  if (!functionName || !serveUrl || functionName === "PENDIENTE_DEPLOY") {
    return NextResponse.json(
      {
        error:
          "Lambda not configured yet. Deploy with: npx remotion lambda functions deploy",
      },
      { status: 503 }
    );
  }

  try {
    const { timelineId } = (await request.json()) as { timelineId: string };

    // Fetch timeline from Supabase
    const { data: record, error } = await supabase
      .from("remotion_timelines")
      .select("remotion_timeline")
      .eq("id", timelineId)
      .single();

    if (error || !record) {
      return NextResponse.json(
        { error: "Timeline not found" },
        { status: 404 }
      );
    }

    const timeline = record.remotion_timeline as RemotionTimeline;

    // Inject CDN proxy URLs for faster video downloads from Lambda
    const videoUrls = new Set<string>();
    for (const track of timeline.tracks) {
      for (const clip of track.clips) {
        if (clip.type === "video") videoUrls.add(clip.src);
      }
    }
    if (videoUrls.size > 0) {
      const { data: proxies } = await supabase
        .from("video_proxies")
        .select("original_url, proxy_url, status")
        .in("original_url", [...videoUrls])
        .eq("status", "ready")
        .not("proxy_url", "is", null);

      if (proxies && proxies.length > 0) {
        const proxyMap = new Map(
          proxies.map((p: { original_url: string; proxy_url: string }) => [
            p.original_url,
            p.proxy_url,
          ])
        );
        let injected = 0;
        for (const track of timeline.tracks) {
          for (const clip of track.clips) {
            const proxy = proxyMap.get(clip.src);
            if (proxy) {
              clip.proxySrc = proxy;
              injected++;
            }
          }
        }
        console.log(`[Render] Injected ${injected}/${videoUrls.size} CDN proxy URLs`);
      } else {
        console.warn(`[Render] No CDN proxy URLs available for ${videoUrls.size} videos — using original URLs`);
      }
    }

    const totalFrames = timeline.durationInFrames;
    const framesPerLambda = calculateFramesPerLambda(totalFrames);
    const estimatedChunks = Math.ceil(totalFrames / framesPerLambda);

    // Launch render on Lambda
    // maxRetries=1 avoids extra Lambda invocations from retries hitting concurrency limits.
    // When AWS approves higher concurrency, we can increase or remove this.
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: AWS_REGION,
      functionName,
      serveUrl,
      composition: "DynamicVideo",
      inputProps: timeline as unknown as Record<string, unknown>,
      codec: "h264",
      framesPerLambda,
      maxRetries: 1,
      privacy: "public",
    });

    // Update status in Supabase (persist for page reload)
    await supabase
      .from("remotion_timelines")
      .update({
        status: "rendering",
        render_id: renderId,
        render_bucket: bucketName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", timelineId);

    return NextResponse.json({
      renderId,
      bucketName,
      framesPerLambda,
      estimatedChunks,
      concurrencyLimit: LAMBDA_CONCURRENCY_LIMIT,
    });
  } catch (err) {
    console.error("Remotion render error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/remotion/render?renderId=xxx&bucketName=xxx
 *
 * Checks render progress on Lambda.
 * Returns: { done: boolean, progress?: number, url?: string, size?: number }
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const functionName = process.env.REMOTION_FUNCTION_NAME;
  if (!functionName || functionName === "PENDIENTE_DEPLOY") {
    return NextResponse.json(
      { error: "Lambda not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const renderId = searchParams.get("renderId");
  const bucketName = searchParams.get("bucketName");
  const timelineId = searchParams.get("timelineId");

  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: "Missing renderId or bucketName" },
      { status: 400 }
    );
  }

  try {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region: AWS_REGION,
    });

    // Check for fatal errors first
    if (progress.fatalErrorEncountered) {
      const errorMsg =
        progress.errors?.[0]?.message?.slice(0, 300) ?? "Unknown render error";

      if (timelineId) {
        await supabase
          .from("remotion_timelines")
          .update({
            status: "failed",
            error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", timelineId);
      }

      return NextResponse.json({
        done: false,
        failed: true,
        error: errorMsg,
      });
    }

    if (progress.done) {
      // Update Supabase with the render URL
      if (timelineId && progress.outputFile) {
        await supabase
          .from("remotion_timelines")
          .update({
            status: "rendered",
            render_url: progress.outputFile,
            updated_at: new Date().toISOString(),
          })
          .eq("id", timelineId);
      }

      return NextResponse.json({
        done: true,
        url: progress.outputFile,
        size: progress.outputSizeInBytes,
      });
    }

    return NextResponse.json({
      done: false,
      progress: progress.overallProgress, // 0 to 1
    });
  } catch (err) {
    console.error("Render progress error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Progress check failed" },
      { status: 500 }
    );
  }
}
