import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { airtableUpdate, TABLES } from "@/lib/airtable/client";

/**
 * POST /api/remotion/publish-s3
 *
 * Takes the render URL from Remotion Lambda (already on S3) and
 * saves it to the Airtable VIDEOS table field "URL S3 Montaje Final".
 *
 * Body: { timelineId: string }
 *
 * The endpoint:
 * 1. Looks up the remotion_timelines record to get render_url and video_id
 * 2. Updates Airtable VIDEOS[video_id] with the S3 URL
 * 3. Returns the published URL
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { timelineId } = (await request.json()) as { timelineId: string };

    if (!timelineId) {
      return NextResponse.json(
        { error: "Missing timelineId" },
        { status: 400 }
      );
    }

    // Get timeline record from Supabase
    const { data: timeline, error: dbError } = await supabase
      .from("remotion_timelines")
      .select("id, video_id, render_url, status")
      .eq("id", timelineId)
      .single();

    if (dbError || !timeline) {
      return NextResponse.json(
        { error: "Timeline not found" },
        { status: 404 }
      );
    }

    if (!timeline.render_url) {
      return NextResponse.json(
        { error: "No render URL available — render the video first" },
        { status: 400 }
      );
    }

    if (!timeline.video_id) {
      return NextResponse.json(
        { error: "No video_id linked to this timeline" },
        { status: 400 }
      );
    }

    // Update Airtable VIDEOS table with the S3 render URL
    await airtableUpdate(TABLES.VIDEOS, timeline.video_id, {
      "URL S3 Montaje Final": timeline.render_url,
    });

    // Mark as published in Supabase
    await supabase
      .from("remotion_timelines")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", timelineId);

    return NextResponse.json({
      success: true,
      url: timeline.render_url,
      videoId: timeline.video_id,
    });
  } catch (err) {
    console.error("Publish S3 error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error publishing to Airtable",
      },
      { status: 500 }
    );
  }
}
