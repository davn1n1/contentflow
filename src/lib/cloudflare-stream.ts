/**
 * Cloudflare Stream API client.
 * Handles video upload-by-URL, status checking, and download URL retrieval.
 *
 * Required env vars:
 *   CLOUDFLARE_ACCOUNT_ID   — your Cloudflare account ID
 *   CLOUDFLARE_STREAM_TOKEN — API token with Stream:Edit permission
 */

const CF_BASE = () =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`;

function headers() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// ─── Types ──────────────────────────────────────────────

export interface StreamVideoStatus {
  state: "queued" | "inprogress" | "ready" | "error";
  pctComplete?: string;
  errorReasonCode?: string;
  errorReasonText?: string;
}

export interface StreamVideo {
  uid: string;
  status: StreamVideoStatus;
  readyToStream: boolean;
  playback?: { hls: string; dash: string };
  preview?: string;
  thumbnail?: string;
  duration?: number;
  meta?: Record<string, string>;
}

interface CfResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ message: string }>;
}

// ─── Helpers ────────────────────────────────────────────

async function cfFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CF_BASE()}${path}`, {
    ...options,
    headers: { ...headers(), ...options?.headers },
  });

  const data: CfResponse<T> = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message || `CF Stream error (${res.status})`;
    throw new Error(msg);
  }
  return data.result;
}

// ─── Public API ─────────────────────────────────────────

/** Returns true if the required env vars are set. */
export function isConfigured(): boolean {
  return !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_STREAM_TOKEN
  );
}

/**
 * Upload a video to Cloudflare Stream by source URL.
 * CF will download, re-encode, and store it on its CDN.
 */
export async function uploadByUrl(
  sourceUrl: string,
  meta?: Record<string, string>
): Promise<StreamVideo> {
  return cfFetch<StreamVideo>("/copy", {
    method: "POST",
    body: JSON.stringify({
      url: sourceUrl,
      meta: meta || {},
      requireSignedURLs: false,
    }),
  });
}

/** Get the current status of a Stream video. */
export async function getVideo(uid: string): Promise<StreamVideo> {
  return cfFetch<StreamVideo>(`/${uid}`);
}

/**
 * Request an MP4 download for a Stream video.
 * Must be called once per video; CF will prepare the download.
 */
export async function createDownload(
  uid: string
): Promise<{ default: { url: string; status: string } }> {
  return cfFetch(`/${uid}/downloads`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Check if the MP4 download is ready and return its URL. */
export async function getDownloadUrl(uid: string): Promise<string | null> {
  try {
    const result = await cfFetch<{
      default: { url: string; status: string };
    }>(`/${uid}/downloads`);
    if (result.default?.status === "ready") {
      return result.default.url;
    }
    return null;
  } catch {
    return null;
  }
}

/** Delete a video from Stream (cleanup). */
export async function deleteVideo(uid: string): Promise<void> {
  await fetch(`${CF_BASE()}/${uid}`, {
    method: "DELETE",
    headers: headers(),
  });
}
