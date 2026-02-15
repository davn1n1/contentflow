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
const LAMBDA_CONCURRENCY_LIMIT = parseInt(
  process.env.REMOTION_LAMBDA_CONCURRENCY ?? "3",
  10
);

// Remotion hard limit on max functions per render
const REMOTION_MAX_FUNCTIONS = 200;

/**
 * Calculate optimal framesPerLambda given total frames and max allowed chunks.
 * Always ensures chunks stay within both our concurrency limit and Remotion's 200 cap.
 */
function calculateFramesPerLambda(totalFrames: number, maxFunctions = REMOTION_MAX_FUNCTIONS): number {
  const maxFromConcurrency = Math.max(LAMBDA_CONCURRENCY_LIMIT - 2, 1);
  const maxChunks = Math.min(maxFromConcurrency, maxFunctions);
  const calculated = Math.ceil(totalFrames / maxChunks);
  // Minimum 20 frames per chunk (no point in smaller chunks)
  return Math.max(calculated, 20);
}

/**
 * Extract a numeric limit from Remotion error messages like:
 * "Too many functions: This render would cause 884 functions to spawn. We limit this amount to 200 functions"
 */
function extractFunctionLimit(errorMsg: string): number | null {
  const match = errorMsg.match(/limit this amount to (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract "would cause N functions" from error message to know what was attempted.
 */
function extractAttemptedFunctions(errorMsg: string): number | null {
  const match = errorMsg.match(/would cause (\d+) functions/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * POST /api/remotion/render
 *
 * Launches a Remotion Lambda render for a given timeline.
 * Auto-retries with adjusted framesPerLambda if Remotion rejects due to function limits.
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

    // Auto-retry loop: if Remotion rejects due to function limits, adjust and retry
    const MAX_RETRIES = 3;
    let currentMaxFunctions = REMOTION_MAX_FUNCTIONS;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const framesPerLambda = calculateFramesPerLambda(totalFrames, currentMaxFunctions);
      const estimatedChunks = Math.ceil(totalFrames / framesPerLambda);

      console.log(
        `[Render] Attempt ${attempt}/${MAX_RETRIES}: ${totalFrames} frames, ` +
        `${framesPerLambda} frames/lambda, ~${estimatedChunks} chunks, ` +
        `maxFunctions=${currentMaxFunctions}`
      );

      try {
        const { renderId, bucketName } = await renderMediaOnLambda({
          region: AWS_REGION,
          functionName,
          serveUrl,
          composition: "DynamicVideo",
          inputProps: timeline as unknown as Record<string, unknown>,
          codec: "h264",
          // High quality encoding: CRF 18 = visually lossless for H.264
          crf: 18,
          framesPerLambda,
          maxRetries: 1,
          privacy: "public",
          // Allow 120s per delayRender (default 30s too short for Shotstack S3 in Australia)
          timeoutInMilliseconds: 120000,
        });

        // Success — update Supabase and return
        await supabase
          .from("remotion_timelines")
          .update({
            status: "rendering",
            render_id: renderId,
            render_bucket: bucketName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", timelineId);

        console.log(
          `[Render] Launched: renderId=${renderId}, ${estimatedChunks} chunks, ${framesPerLambda} frames/lambda`
        );

        return NextResponse.json({
          renderId,
          bucketName,
          framesPerLambda,
          estimatedChunks,
          concurrencyLimit: LAMBDA_CONCURRENCY_LIMIT,
          attempt,
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message;

        // Check if it's a "too many functions" error — auto-adjust and retry
        if (msg.includes("Too many functions") || msg.includes("too many functions")) {
          const remotionLimit = extractFunctionLimit(msg);
          const attempted = extractAttemptedFunctions(msg);

          console.warn(
            `[Render] Too many functions (attempted: ${attempted}, limit: ${remotionLimit}). ` +
            `Adjusting maxFunctions from ${currentMaxFunctions} to ${remotionLimit ?? Math.floor(currentMaxFunctions * 0.5)}`
          );

          // Use the limit Remotion told us, or halve our estimate
          currentMaxFunctions = remotionLimit ?? Math.floor(currentMaxFunctions * 0.5);
          if (currentMaxFunctions < 1) currentMaxFunctions = 1;
          continue;
        }

        // Check for concurrency/throttle errors — reduce aggressively
        if (
          msg.includes("TooManyRequestsException") ||
          msg.includes("Rate exceeded") ||
          msg.includes("concurrency")
        ) {
          console.warn(
            `[Render] Concurrency/throttle error. Reducing maxFunctions from ${currentMaxFunctions} to ${Math.floor(currentMaxFunctions * 0.5)}`
          );
          currentMaxFunctions = Math.max(Math.floor(currentMaxFunctions * 0.5), 1);
          continue;
        }

        // Non-retryable error — break
        break;
      }
    }

    // All retries exhausted
    console.error("Remotion render error (all retries exhausted):", lastError);
    return NextResponse.json(
      { error: lastError?.message ?? "Render failed after retries" },
      { status: 500 }
    );
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
