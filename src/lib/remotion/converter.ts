import type {
  ShotstackPayload,
  ShotstackTrack,
  ShotstackClip,
  RemotionTimeline,
  RemotionTrack,
  RemotionClip,
  ClipEffect,
  ClipTransition,
  AudioEffect,
} from "./types";
import { RESOLUTION_MAP, DEFAULTS } from "./constants";

/**
 * Converts a Shotstack JSON payload (from n8n CreaTimelineOutput)
 * into a RemotionTimeline that can be rendered by DynamicVideo.
 */
export function shotstack2Remotion(
  payload: ShotstackPayload,
  videoId?: string
): RemotionTimeline {
  const { timeline, output } = payload;

  const fps = output.fps || DEFAULTS.FPS;
  const aspectRatio = output.aspectRatio || DEFAULTS.ASPECT_RATIO;
  const resolution = output.resolution || DEFAULTS.RESOLUTION;
  const backgroundColor = timeline.background || DEFAULTS.BACKGROUND;

  // Resolve pixel dimensions
  const dimensions = RESOLUTION_MAP[aspectRatio]?.[resolution] ||
    RESOLUTION_MAP[DEFAULTS.ASPECT_RATIO][DEFAULTS.RESOLUTION];

  // Separate visual and audio tracks (same logic as CreaTimelineOutput)
  const visualTracks: ShotstackTrack[] = [];
  const audioTracks: ShotstackTrack[] = [];

  for (const track of timeline.tracks) {
    if (track.clips.length === 0) continue;
    const isAudio = track.clips[0]?.asset?.type === "audio";
    if (isAudio) {
      audioTracks.push(track);
    } else {
      visualTracks.push(track);
    }
  }

  // Convert tracks
  // Shotstack: tracks[0] = topmost (foreground)
  // Remotion: highest zIndex = foreground
  const remotionTracks: RemotionTrack[] = [];

  // Visual tracks: reverse order so tracks[0] gets highest zIndex
  visualTracks.forEach((track, i) => {
    const zIndex = visualTracks.length - i; // top track gets highest z
    const converted = convertTrack(track, `visual-${i}`, "visual", zIndex, fps);
    if (converted.clips.length > 0) {
      remotionTracks.push(converted);
    }
  });

  // Audio tracks: zIndex doesn't matter for audio, but keep ordering
  audioTracks.forEach((track, i) => {
    const converted = convertTrack(track, `audio-${i}`, "audio", 0, fps);
    if (converted.clips.length > 0) {
      remotionTracks.push(converted);
    }
  });

  // Calculate total duration from all clips
  const durationInFrames = calculateTotalDuration(remotionTracks, fps);

  return {
    videoId,
    fps,
    width: dimensions.width,
    height: dimensions.height,
    durationInFrames,
    backgroundColor,
    tracks: remotionTracks,
  };
}

function convertTrack(
  track: ShotstackTrack,
  id: string,
  type: "visual" | "audio",
  zIndex: number,
  fps: number
): RemotionTrack {
  const clips: RemotionClip[] = [];

  for (let i = 0; i < track.clips.length; i++) {
    const clip = track.clips[i];
    const converted = convertClip(clip, `${id}-clip-${i}`, fps);
    if (converted) {
      clips.push(converted);
    }
  }

  return { id, type, zIndex, clips };
}

function convertClip(
  clip: ShotstackClip,
  id: string,
  fps: number
): RemotionClip | null {
  const { asset } = clip;
  if (!asset?.src) return null;

  // Convert start time
  const startSeconds = typeof clip.start === "number" ? clip.start : 0;
  const from = Math.round(startSeconds * fps);

  // Convert duration
  let durationInFrames: number;
  if (typeof clip.length === "number") {
    durationInFrames = Math.round(clip.length * fps);
  } else {
    // "auto" — use a default. In real renders, Remotion resolves from the media.
    // For preview, we use 10 seconds as fallback.
    durationInFrames = 10 * fps;
  }

  // Convert trim
  const startFrom = asset.trim ? Math.round(asset.trim * fps) : undefined;

  // Convert fit
  let fit: "cover" | "contain" | undefined;
  if (clip.fit === "crop" || clip.fit === "cover") {
    fit = "cover";
  } else if (clip.fit === "contain") {
    fit = "contain";
  }

  // Convert visual effect
  let effect: ClipEffect | undefined;
  if (clip.effect === "zoomInSlow") {
    effect = "zoomInSlow";
  }

  // Convert transition
  let transition: ClipTransition | undefined;
  if (clip.transition) {
    transition = {
      in: clip.transition.in === "carouselRight" ? "carouselRight" : undefined,
      out: clip.transition.out === "slideRightFast" ? "slideRightFast" : undefined,
    };
  }

  // Convert audio effect
  let audioEffect: AudioEffect | undefined;
  if (asset.effect === "fadeInFadeOut") {
    audioEffect = "fadeInFadeOut";
  } else if (asset.effect === "fadeIn") {
    audioEffect = "fadeIn";
  } else if (asset.effect === "fadeOut") {
    audioEffect = "fadeOut";
  }

  // Convert offset (Shotstack: -1..1 range → Remotion: percentage)
  let offset: { x: number; y: number } | undefined;
  if (clip.offset) {
    offset = {
      x: clip.offset.x * 50, // -1..1 → -50..50 (percent)
      y: clip.offset.y * 50,
    };
  }

  return {
    id,
    type: asset.type,
    src: asset.src,
    from,
    durationInFrames,
    startFrom,
    volume: asset.volume,
    fit,
    scale: clip.scale,
    offset,
    effect,
    transition,
    filter: clip.filter,
    audioEffect,
  };
}

/**
 * Calculate total duration from all clips (max of start + duration).
 */
function calculateTotalDuration(
  tracks: RemotionTrack[],
  fps: number
): number {
  let maxFrame = 0;

  for (const track of tracks) {
    for (const clip of track.clips) {
      const end = clip.from + clip.durationInFrames;
      if (end > maxFrame) {
        maxFrame = end;
      }
    }
  }

  // Add 1 second buffer at the end
  return maxFrame + fps;
}
