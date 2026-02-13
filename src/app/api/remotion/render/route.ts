import { NextRequest, NextResponse } from "next/server";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";
import { createClient } from "@/lib/supabase/server";

const AWS_REGION = process.env.REMOTION_AWS_REGION as
  | "eu-central-1"
  | "us-east-1"
  | "eu-west-1";

/**
 * POST /api/remotion/render
 *
 * Launches a Remotion Lambda render for a given timeline.
 * Body: { timelineId: string }
 * Returns: { renderId, bucketName }
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

    // Launch render on Lambda
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: AWS_REGION,
      functionName,
      serveUrl,
      composition: "DynamicVideo",
      inputProps: record.remotion_timeline,
      codec: "h264",
      framesPerLambda: 20,
      privacy: "public",
    });

    // Update status in Supabase
    await supabase
      .from("remotion_timelines")
      .update({
        status: "rendering",
        updated_at: new Date().toISOString(),
      })
      .eq("id", timelineId);

    return NextResponse.json({ renderId, bucketName });
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
