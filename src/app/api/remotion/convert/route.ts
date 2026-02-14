import { NextRequest, NextResponse } from "next/server";
import { shotstack2Remotion } from "@/lib/remotion/converter";
import type { ShotstackPayload } from "@/lib/remotion/types";
import { createClient } from "@/lib/supabase/server";
import { airtableFetch, TABLES } from "@/lib/airtable/client";

const N8N_API_KEY = process.env.N8N_WEBHOOK_AUTH_VALUE;

/**
 * POST /api/remotion/convert
 *
 * Receives a Shotstack JSON payload (from n8n or the frontend)
 * and converts it to a RemotionTimeline.
 *
 * Body: {
 *   videoId: string,         // Airtable record ID
 *   videoName?: string,      // Optional name for display
 *   shotstack: { timeline, output }  // Shotstack payload from CreaTimelineOutput
 * }
 *
 * Auth: Either Supabase session (frontend) or X-Api-Key header (n8n)
 */
export async function POST(request: NextRequest) {
  // Auth: accept either session auth or API key (for n8n)
  const apiKey = request.headers.get("X-Api-Key");
  const isN8nRequest = apiKey && apiKey === N8N_API_KEY;

  if (!isN8nRequest) {
    // Try session auth for frontend requests
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { videoId, videoName, shotstack } = body as {
      videoId: string;
      videoName?: string;
      shotstack: ShotstackPayload;
    };

    if (!videoId || !shotstack?.timeline?.tracks) {
      return NextResponse.json(
        { error: "Missing videoId or shotstack payload" },
        { status: 400 }
      );
    }

    // Convert Shotstack JSON to Remotion timeline
    const remotionTimeline = shotstack2Remotion(shotstack, videoId);

    // Save to Supabase using service role for server-side writes
    const supabase = await createClient();

    // Upsert: if this videoId already has a conversion, update it
    const { data, error } = await supabase
      .from("remotion_timelines")
      .upsert(
        {
          video_id: videoId,
          video_name: videoName || null,
          shotstack_json: shotstack,
          remotion_timeline: remotionTimeline,
          status: "converted",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "video_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      // Still return the converted timeline even if save fails
      return NextResponse.json({
        success: true,
        saved: false,
        error: error.message,
        timeline: remotionTimeline,
      });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      id: data.id,
      timeline: remotionTimeline,
    });
  } catch (error) {
    console.error("Remotion convert error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion failed" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/remotion/convert
 *
 * Saves an edited RemotionTimeline back to Supabase.
 *
 * Body: {
 *   id: string,                    // Supabase record UUID
 *   remotion_timeline: RemotionTimeline  // The edited timeline
 * }
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, remotion_timeline } = body as {
      id: string;
      remotion_timeline: unknown;
    };

    if (!id || !remotion_timeline) {
      return NextResponse.json(
        { error: "Missing id or remotion_timeline" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("remotion_timelines")
      .update({
        remotion_timeline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Remotion save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/remotion/convert?videoId=recXXX
 *
 * Retrieves a saved RemotionTimeline by video ID.
 */
export async function GET(request: NextRequest) {
  // Auth: accept either session or API key
  const apiKey = request.headers.get("X-Api-Key");
  const isN8nRequest = apiKey && apiKey === N8N_API_KEY;

  if (!isN8nRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const id = searchParams.get("id");

  if (!videoId && !id) {
    // Return all timelines
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("remotion_timelines")
      .select("id, video_id, video_name, status, created_at, updated_at, remotion_timeline")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-fill missing video_name from Airtable for listing
    const missingNames = (data || []).filter((d) => !d.video_name && d.video_id);
    if (missingNames.length > 0) {
      try {
        const ids = missingNames.map((d) => `RECORD_ID()='${d.video_id}'`).join(",");
        const atRes = await airtableFetch<{ Name?: number; "Titulo Youtube A"?: string }>(
          TABLES.VIDEOS,
          {
            filterByFormula: `OR(${ids})`,
            fields: ["Name", "Titulo Youtube A"],
            maxRecords: missingNames.length,
          }
        );
        const sb = await createClient();
        for (const rec of atRes.records) {
          const title = rec.fields["Titulo Youtube A"];
          const num = rec.fields.Name;
          const name = title || (num ? `Video #${num}` : null);
          if (name) {
            const entry = (data || []).find((d) => d.video_id === rec.id);
            if (entry) {
              entry.video_name = name;
              sb.from("remotion_timelines").update({ video_name: name }).eq("id", entry.id).then(() => {});
            }
          }
        }
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json(data || []);
  }

  const supabase = await createClient();
  const query = supabase.from("remotion_timelines").select("*");

  if (id) {
    query.eq("id", id);
  } else if (videoId) {
    query.eq("video_id", videoId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Timeline not found" },
      { status: 404 }
    );
  }

  // Auto-fill video_name from Airtable if missing
  if (!data.video_name && data.video_id) {
    try {
      const atRes = await airtableFetch<{ Name?: number; "Titulo Youtube A"?: string }>(
        TABLES.VIDEOS,
        {
          filterByFormula: `RECORD_ID()='${data.video_id}'`,
          fields: ["Name", "Titulo Youtube A"],
          maxRecords: 1,
        }
      );
      const rec = atRes.records[0];
      if (rec) {
        const title = rec.fields["Titulo Youtube A"];
        const num = rec.fields.Name;
        const name = title || (num ? `Video #${num}` : null);
        if (name) {
          data.video_name = name;
          // Persist so we don't look it up again
          const sb = await createClient();
          sb.from("remotion_timelines").update({ video_name: name }).eq("id", data.id).then(() => {});
        }
      }
    } catch {
      // Non-critical — just use video_id as fallback
    }
  }

  return NextResponse.json(data);
}
