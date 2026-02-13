// =============================================================================
// Shotstack JSON Types (input from n8n workflow CreaTimelineOutput)
// =============================================================================

export interface ShotstackPayload {
  timeline: ShotstackTimeline;
  output: ShotstackOutput;
}

export interface ShotstackTimeline {
  cache?: boolean;
  background?: string;
  tracks: ShotstackTrack[];
}

export interface ShotstackTrack {
  clips: ShotstackClip[];
  name?: string; // optional: pass from n8n to override auto-derived name
}

export interface ShotstackClip {
  asset: ShotstackAsset;
  start: number | "auto";
  length: number | "auto";
  fit?: "crop" | "contain" | "cover";
  position?: string;
  effect?: string;
  scale?: number;
  offset?: { x: number; y: number };
  transition?: {
    in?: string;
    out?: string;
  };
  filter?: string;
}

export interface ShotstackAsset {
  type: "video" | "image" | "audio";
  src: string;
  trim?: number;
  volume?: number;
  effect?: string; // audio effects: "fadeIn", "fadeOut", "fadeInFadeOut"
}

export interface ShotstackOutput {
  format?: string;
  resolution?: string;
  aspectRatio?: string;
  quality?: string;
  fps?: number;
  mute?: boolean;
}

// =============================================================================
// Remotion Timeline Types (output of converter, input to DynamicVideo)
// =============================================================================

export interface RemotionTimeline {
  id?: string;
  videoId?: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  backgroundColor: string;
  tracks: RemotionTrack[];
}

export interface RemotionTrack {
  id: string;
  name: string; // human-readable label inferred from track content
  type: "visual" | "audio";
  zIndex: number;
  clips: RemotionClip[];
}

export interface RemotionClip {
  id: string;
  name: string; // human-readable label derived from URL/context
  type: "video" | "image" | "audio";
  src: string;
  proxySrc?: string; // CDN-optimized URL (Cloudflare Stream) for preview playback
  from: number; // frame number
  durationInFrames: number;
  startFrom?: number; // trim in frames
  volume?: number;
  fit?: "cover" | "contain";
  scale?: number;
  offset?: { x: number; y: number };
  effect?: ClipEffect;
  transition?: ClipTransition;
  filter?: string;
  audioEffect?: AudioEffect;
}

export type ClipEffect = "zoomInSlow" | "none";

export interface ClipTransition {
  in?: "carouselRight" | "fadeIn" | "none";
  out?: "slideRightFast" | "fadeOut" | "none";
}

export type AudioEffect = "fadeIn" | "fadeOut" | "fadeInFadeOut" | "none";

// =============================================================================
// Supabase record type
// =============================================================================

export interface RemotionTimelineRecord {
  id: string;
  video_id: string;
  video_name?: string;
  shotstack_json: ShotstackPayload;
  remotion_timeline: RemotionTimeline;
  status: "converted" | "previewing" | "rendering" | "rendered" | "failed";
  render_url?: string;
  created_at: string;
  updated_at: string;
}
