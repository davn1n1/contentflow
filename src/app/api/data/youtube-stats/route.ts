import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth/api-guard";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

async function ytApiFetch(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string
) {
  const url = new URL(`${YT_API_BASE}/${endpoint}`);
  params.key = apiKey;
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const referer =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : "https://app.contentflow365.com/";
  const resp = await fetch(url.toString(), {
    headers: { Referer: referer },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `YouTube API error: ${resp.status}`
    );
  }
  return resp.json();
}

async function resolveChannelId(
  handle: string,
  apiKey: string
): Promise<string> {
  if (handle.startsWith("@")) {
    const resp = await ytApiFetch("search", {
      part: "snippet",
      q: handle,
      type: "channel",
      maxResults: "1",
    }, apiKey);
    if (!resp.items?.length) throw new Error("Canal no encontrado");
    return resp.items[0].snippet.channelId;
  }
  return handle;
}

function parseDuration(iso: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (
    parseInt(m[1] || "0") * 3600 +
    parseInt(m[2] || "0") * 60 +
    parseInt(m[3] || "0")
  );
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const channelHandle = searchParams.get("channelHandle");
  if (!channelHandle) {
    return NextResponse.json(
      { error: "channelHandle required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Resolve channel ID
    const channelId = await resolveChannelId(channelHandle, apiKey);

    // 2. Get channel info
    const chResp = await ytApiFetch("channels", {
      part: "snippet,statistics,contentDetails",
      id: channelId,
    }, apiKey);

    if (!chResp.items?.length) throw new Error("Canal no encontrado");
    const ch = chResp.items[0];

    // 3. Get all videos from uploads playlist
    const uploadsPlaylistId =
      ch.contentDetails.relatedPlaylists.uploads;
    const videos: {
      id: string;
      title: string;
      publishedAt: string;
      thumbnail: string;
    }[] = [];

    let nextPage = "";
    let page = 0;
    do {
      const params: Record<string, string> = {
        part: "snippet,contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
      };
      if (nextPage) params.pageToken = nextPage;

      const resp = await ytApiFetch("playlistItems", params, apiKey);
      for (const item of resp.items || []) {
        if (
          item.snippet.title === "Private video" ||
          item.snippet.title === "Deleted video"
        )
          continue;
        videos.push({
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
        });
      }
      nextPage = resp.nextPageToken || "";
      page++;
    } while (nextPage && page < 40);

    // 4. Enrich with stats in batches of 50
    const enriched: {
      id: string;
      title: string;
      publishedAt: string;
      thumbnail: string;
      views: number;
      likes: number;
      comments: number;
      duration: number;
      engagement: number;
    }[] = [];

    for (let i = 0; i < videos.length; i += 50) {
      const batch = videos.slice(i, i + 50);
      const ids = batch.map((v) => v.id).join(",");
      const resp = await ytApiFetch("videos", {
        part: "statistics,contentDetails",
        id: ids,
      }, apiKey);

      const statsMap: Record<
        string,
        { views: number; likes: number; comments: number; duration: number }
      > = {};
      for (const item of resp.items || []) {
        statsMap[item.id] = {
          views: parseInt(item.statistics.viewCount || "0"),
          likes: parseInt(item.statistics.likeCount || "0"),
          comments: parseInt(item.statistics.commentCount || "0"),
          duration: parseDuration(item.contentDetails.duration),
        };
      }

      for (const video of batch) {
        const s = statsMap[video.id] || {
          views: 0,
          likes: 0,
          comments: 0,
          duration: 0,
        };
        enriched.push({
          ...video,
          ...s,
          engagement:
            s.views > 0
              ? ((s.likes + s.comments) / s.views) * 100
              : 0,
        });
      }
    }

    return NextResponse.json({
      channel: {
        id: channelId,
        title: ch.snippet.title,
        customUrl: ch.snippet.customUrl || null,
        description: ch.snippet.description || "",
        thumbnail: ch.snippet.thumbnails?.medium?.url || null,
        subscriberCount: parseInt(ch.statistics.subscriberCount || "0"),
        viewCount: parseInt(ch.statistics.viewCount || "0"),
        videoCount: parseInt(ch.statistics.videoCount || "0"),
      },
      videos: enriched,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("YouTube stats error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch YouTube stats",
      },
      { status: 500 }
    );
  }
}
