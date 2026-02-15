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
  scenes?: Array<{
    type: string;   // "hook" | "intro" | "desarrollo" | "cta" etc.
    label?: string;
    startSeconds: number;
    endSeconds: number;
  }>;
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
  scenes?: TimelineScene[]; // optional scene markers (from n8n or heuristic)
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
  type: "video" | "image" | "audio" | "template";
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
  // Template clip fields (only when type === "template")
  templateId?: string; // registry key, e.g. "text-reveal"
  templateProps?: Record<string, unknown>; // content + color props (timing comes from audio clips)
}

export type ClipEffect = "zoomInSlow" | "none";

export interface ClipTransition {
  in?: "carouselRight" | "fadeIn" | "none";
  out?: "slideRightFast" | "fadeOut" | "none";
}

export type AudioEffect = "fadeIn" | "fadeOut" | "fadeInFadeOut" | "none";

// Scene / section markers for the timeline
export type SceneType = "hook" | "intro" | "desarrollo" | "cta" | "outro" | "transicion";

export interface TimelineScene {
  type: SceneType;
  label: string;
  fromFrame: number;
  toFrame: number;
  color: string; // CSS color for the timeline zone
}

// =============================================================================
// Supabase record type
// =============================================================================

export interface RemotionTimelineRecord {
  id: string;
  video_id: string;
  video_name?: string;
  shotstack_json: ShotstackPayload;
  remotion_timeline: RemotionTimeline;
  status: "converted" | "previewing" | "rendering" | "rendered" | "published" | "failed";
  render_url?: string;
  render_id?: string;
  render_bucket?: string;
  created_at: string;
  updated_at: string;
}
