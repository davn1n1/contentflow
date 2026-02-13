import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isConfigured,
  uploadByUrl,
  getVideo,
  createDownload,
  getDownloadUrl,
  deleteVideo,
} from "@/lib/cloudflare-stream";

const N8N_API_KEY = process.env.N8N_WEBHOOK_AUTH_VALUE;

/** Authenticate: session (frontend) or X-Api-Key (n8n) */
async function authenticate(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get("X-Api-Key");
  if (apiKey && apiKey === N8N_API_KEY) return true;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

// ─── Types ──────────────────────────────────────────────

interface VideoProxy {
  id: string;
  original_url: string;
  stream_uid: string | null;
  proxy_url: string | null;
  hls_url: string | null;
  thumbnail_url: string | null;
  status: string;
  error_message: string | null;
}

// ─────────────────────────────────────────────────────────
// POST /api/remotion/proxy
//
// Triggers proxy generation for video clips in a timeline.
// Body: { timelineId: string }  OR  { urls: string[] }
// ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!(await authenticate(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Cloudflare Stream not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_TOKEN." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const supabase = await createClient();

    // Resolve video URLs: either from timeline or directly
    let videoUrls: string[] = [];

    if (body.timelineId) {
      const { data: timeline } = await supabase
        .from("remotion_timelines")
        .select("remotion_timeline")
        .eq("id", body.timelineId)
        .single();

      if (!timeline) {
        return NextResponse.json({ error: "Timeline not found" }, { status: 404 });
      }

      // Extract unique VIDEO URLs from the timeline (audio files are not supported by CF Stream)
      const tl = timeline.remotion_timeline as { tracks: Array<{ clips: Array<{ type: string; src: string }> }> };
      const urlSet = new Set<string>();
      for (const track of tl.tracks) {
        for (const clip of track.clips) {
          if (clip.type === "video") {
            urlSet.add(clip.src);
          }
        }
      }
      videoUrls = [...urlSet];
    } else if (body.urls && Array.isArray(body.urls)) {
      videoUrls = body.urls;
    } else {
      return NextResponse.json(
        { error: "Provide timelineId or urls[]" },
        { status: 400 }
      );
    }

    if (videoUrls.length === 0) {
      return NextResponse.json({ proxies: [], message: "No video URLs found" });
    }

    // Check which URLs already have proxies
    const { data: existing } = await supabase
      .from("video_proxies")
      .select("*")
      .in("original_url", videoUrls);

    const existingMap = new Map(
      (existing || []).map((p: VideoProxy) => [p.original_url, p])
    );

    const results: Array<{
      url: string;
      status: string;
      proxy_url: string | null;
      action: string;
    }> = [];

    // Process each URL
    for (const url of videoUrls) {
      const existing = existingMap.get(url);

      if (existing) {
        // Already exists — check if we need to poll status
        if (existing.status === "ready") {
          results.push({
            url,
            status: "ready",
            proxy_url: existing.proxy_url,
            action: "cached",
          });
          continue;
        }

        if (existing.status === "error") {
          // Retry: delete old record and re-upload
          await supabase.from("video_proxies").delete().eq("id", existing.id);
        } else {
          // Still processing — check status with CF Stream
          if (existing.stream_uid) {
            const updated = await pollAndUpdate(
              supabase,
              existing.id,
              existing.stream_uid
            );
            results.push({
              url,
              status: updated.status,
              proxy_url: updated.proxy_url,
              action: "polled",
            });
            continue;
          }
          results.push({
            url,
            status: existing.status,
            proxy_url: null,
            action: "waiting",
          });
          continue;
        }
      }

      // New upload: send to Cloudflare Stream (video only)
      try {
        console.log(`[CF Stream] Uploading: ${url.slice(0, 80)}...`);
        const video = await uploadByUrl(url, { original_url: url });
        console.log(`[CF Stream] Upload OK: uid=${video.uid}, status=${video.status.state}`);

        // Insert proxy record
        await supabase.from("video_proxies").insert({
          original_url: url,
          stream_uid: video.uid,
          status: "uploading",
          hls_url: video.playback?.hls || null,
        });

        // Request MP4 download generation
        try {
          await createDownload(video.uid);
        } catch {
          // Download creation might fail if video is still processing — that's OK
        }

        results.push({
          url,
          status: "uploading",
          proxy_url: null,
          action: "uploaded",
        });
      } catch (err) {
        console.error(`[CF Stream] Upload FAILED: ${url.slice(0, 80)}`, err instanceof Error ? err.message : err);
        // Upload failed — record the error
        await supabase.from("video_proxies").insert({
          original_url: url,
          status: "error",
          error_message:
            err instanceof Error ? err.message : "Upload failed",
        });
        results.push({ url, status: "error", proxy_url: null, action: "error" });
      }
    }

    return NextResponse.json({
      total: videoUrls.length,
      ready: results.filter((r) => r.status === "ready").length,
      processing: results.filter((r) =>
        ["uploading", "processing"].includes(r.status)
      ).length,
      errors: results.filter((r) => r.status === "error").length,
      proxies: results,
    });
  } catch (error) {
    console.error("Proxy generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy generation failed" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/remotion/proxy?timelineId=xxx
//
// Returns proxy status for all clips in a timeline.
// Returns a map of original_url → { proxy_url, status }
// ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!(await authenticate(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timelineId = searchParams.get("timelineId");
  const urls = searchParams.get("urls"); // comma-separated

  const supabase = await createClient();
  let videoUrls: string[] = [];

  if (timelineId) {
    const { data: timeline } = await supabase
      .from("remotion_timelines")
      .select("remotion_timeline")
      .eq("id", timelineId)
      .single();

    if (!timeline) {
      return NextResponse.json({ error: "Timeline not found" }, { status: 404 });
    }

    const tl = timeline.remotion_timeline as { tracks: Array<{ clips: Array<{ type: string; src: string }> }> };
    const urlSet = new Set<string>();
    for (const track of tl.tracks) {
      for (const clip of track.clips) {
        if (clip.type === "video") {
          urlSet.add(clip.src);
        }
      }
    }
    videoUrls = [...urlSet];
  } else if (urls) {
    videoUrls = urls.split(",").map((u) => u.trim());
  } else {
    return NextResponse.json(
      { error: "Provide timelineId or urls" },
      { status: 400 }
    );
  }

  if (videoUrls.length === 0) {
    return NextResponse.json({ proxies: {} });
  }

  // Fetch proxy records
  const { data: proxies } = await supabase
    .from("video_proxies")
    .select("*")
    .in("original_url", videoUrls);

  // Poll processing proxies for updated status
  const proxyMap: Record<
    string,
    { proxy_url: string | null; hls_url: string | null; status: string }
  > = {};

  for (const proxy of proxies || []) {
    const p = proxy as VideoProxy;

    if (
      p.stream_uid &&
      ["uploading", "processing"].includes(p.status)
    ) {
      const updated = await pollAndUpdate(supabase, p.id, p.stream_uid);
      proxyMap[p.original_url] = {
        proxy_url: updated.proxy_url,
        hls_url: updated.hls_url,
        status: updated.status,
      };
    } else {
      proxyMap[p.original_url] = {
        proxy_url: p.proxy_url,
        hls_url: p.hls_url,
        status: p.status,
      };
    }
  }

  const total = videoUrls.length;
  const ready = Object.values(proxyMap).filter((p) => p.status === "ready").length;

  return NextResponse.json({
    total,
    ready,
    allReady: ready === total,
    proxies: proxyMap,
  });
}

// ─────────────────────────────────────────────────────────
// DELETE /api/remotion/proxy?timelineId=xxx
//
// Cleans up proxy records (and CF Stream videos) for a timeline.
// Used to reset and retry CDN optimization.
// ─────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  if (!(await authenticate(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timelineId = searchParams.get("timelineId");

  if (!timelineId) {
    return NextResponse.json({ error: "Provide timelineId" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Get video URLs from the timeline
    const { data: timeline } = await supabase
      .from("remotion_timelines")
      .select("remotion_timeline")
      .eq("id", timelineId)
      .single();

    if (!timeline) {
      return NextResponse.json({ error: "Timeline not found" }, { status: 404 });
    }

    const tl = timeline.remotion_timeline as { tracks: Array<{ clips: Array<{ type: string; src: string }> }> };
    const urlSet = new Set<string>();
    for (const track of tl.tracks) {
      for (const clip of track.clips) {
        if (clip.type === "video") {
          urlSet.add(clip.src);
        }
      }
    }
    const videoUrls = [...urlSet];

    if (videoUrls.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // Get existing proxy records
    const { data: existing } = await supabase
      .from("video_proxies")
      .select("id, stream_uid")
      .in("original_url", videoUrls);

    const records = existing || [];

    // Delete from CF Stream (best-effort, don't fail if CF errors)
    for (const record of records) {
      if (record.stream_uid) {
        try {
          await deleteVideo(record.stream_uid);
        } catch {
          // CF cleanup is best-effort
        }
      }
    }

    // Delete from Supabase
    if (records.length > 0) {
      await supabase
        .from("video_proxies")
        .delete()
        .in("id", records.map((r: { id: string }) => r.id));
    }

    console.log(`[CF Stream] Cleaned up ${records.length} proxy records for timeline ${timelineId}`);

    return NextResponse.json({
      deleted: records.length,
      message: `Cleaned ${records.length} proxy records`,
    });
  } catch (error) {
    console.error("Proxy cleanup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}

// ─── Poll CF Stream and update Supabase ────────────────

async function pollAndUpdate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  proxyId: string,
  streamUid: string
): Promise<{ status: string; proxy_url: string | null; hls_url: string | null }> {
  try {
    const video = await getVideo(streamUid);

    if (video.status.state === "ready") {
      // Try to get download URL
      let downloadUrl: string | null = null;
      try {
        downloadUrl = await getDownloadUrl(streamUid);
        if (!downloadUrl) {
          // Download not yet created — trigger it
          await createDownload(streamUid);
          downloadUrl = await getDownloadUrl(streamUid);
        }
      } catch {
        // Downloads API might not be ready yet
      }

      const hls = video.playback?.hls || null;

      await supabase
        .from("video_proxies")
        .update({
          status: "ready",
          proxy_url: downloadUrl,
          hls_url: hls,
          thumbnail_url: video.thumbnail || null,
          duration_seconds: video.duration || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proxyId);

      return { status: "ready", proxy_url: downloadUrl, hls_url: hls };
    }

    if (video.status.state === "error") {
      await supabase
        .from("video_proxies")
        .update({
          status: "error",
          error_message: video.status.errorReasonText || "Processing failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proxyId);
      return { status: "error", proxy_url: null, hls_url: null };
    }

    // Still processing
    const newStatus =
      video.status.state === "inprogress" ? "processing" : "uploading";
    await supabase
      .from("video_proxies")
      .update({
        status: newStatus,
        hls_url: video.playback?.hls || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proxyId);

    return { status: newStatus, proxy_url: null, hls_url: null };
  } catch {
    return { status: "processing", proxy_url: null, hls_url: null };
  }
}
