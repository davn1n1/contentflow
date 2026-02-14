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
  TimelineScene,
  SceneType,
} from "./types";
import { RESOLUTION_MAP, DEFAULTS, STATIC_ASSETS } from "./constants";

// ─── Clip Name Resolution ──────────────────────────────────
// Maps known static assets and URL patterns to human-readable names.

const KNOWN_ASSETS: Record<string, string> = {
  [STATIC_ASSETS.WHOOSH_IN]: "Whoosh IN",
  [STATIC_ASSETS.WHOOSH_OUT]: "Whoosh OUT",
  [STATIC_ASSETS.TRANSPARENT]: "Transparente",
  [STATIC_ASSETS.OPACITY_100]: "Opacidad 100%",
  [STATIC_ASSETS.OPACITY_90]: "Opacidad 90%",
  [STATIC_ASSETS.OPACITY_60]: "Opacidad 60%",
  [STATIC_ASSETS.OPACITY_40]: "Opacidad 40%",
};

/**
 * Derives a human-readable name from a clip's URL and context.
 * Priority: known asset → URL path patterns → decoded filename.
 */
function deriveClipName(src: string, clipType: string, clipIndex: number): string {
  // 1. Check known static assets
  if (KNOWN_ASSETS[src]) return KNOWN_ASSETS[src];

  try {
    const url = new URL(src);
    const path = decodeURIComponent(url.pathname);
    const segments = path.split("/").filter(Boolean);
    const filename = segments[segments.length - 1] || "";
    const nameNoExt = filename.replace(/\.[^.]+$/, "");

    // 2. Detect HeyGen avatar URLs (files named "source" or UUID-like)
    if (
      url.hostname.includes("heygen") ||
      url.hostname.includes("ugcfiles") ||
      /^[0-9a-f]{8,}$/i.test(nameNoExt) ||
      nameNoExt === "source"
    ) {
      // Use parent folder or path segment for context
      const parent = segments.length >= 2 ? segments[segments.length - 2] : "";
      if (parent && parent !== "source") {
        const cleanParent = parent.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return `Avatar ${cleanParent}`;
      }
      return `Avatar ${clipIndex + 1}`;
    }

    // 3. Detect S3 assets by path patterns
    if (url.hostname.includes("s3") || url.hostname.includes("amazonaws")) {
      // recursos/ folder → use filename
      if (path.includes("/recursos/")) {
        return nameNoExt.replace(/[+_-]/g, " ").trim();
      }
      // Other S3 → use last meaningful segment
      return nameNoExt.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // 4. Detect Pexels/stock footage
    if (url.hostname.includes("pexels") || url.hostname.includes("pixabay")) {
      return `B-Roll ${clipIndex + 1}`;
    }

    // 5. Detect ElevenLabs audio
    if (url.hostname.includes("elevenlabs") || url.hostname.includes("eleven-labs")) {
      return `Voz ${clipIndex + 1}`;
    }

    // 6. Default: clean up filename
    if (nameNoExt && nameNoExt.length > 0 && nameNoExt !== "source") {
      return nameNoExt
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 40);
    }

    // 7. Fallback
    const typeLabels: Record<string, string> = {
      video: "Video",
      image: "Imagen",
      audio: "Audio",
    };
    return `${typeLabels[clipType] || "Clip"} ${clipIndex + 1}`;
  } catch {
    // Invalid URL — just return a fallback
    return `Clip ${clipIndex + 1}`;
  }
}

// ─── Track Name Resolution ──────────────────────────────────
// Infers a human-readable track name from its clips' content.

function deriveTrackName(
  clips: RemotionClip[],
  trackType: "visual" | "audio",
  trackIndex: number,
  totalTracksOfType?: number
): string {
  if (clips.length === 0) {
    return trackType === "visual" ? `Capa ${trackIndex + 1}` : `Audio ${trackIndex + 1}`;
  }

  const names = clips.map((c) => c.name || "");
  const sources = clips.map((c) => c.src);

  // ── Audio track patterns ──
  if (trackType === "audio") {
    const hasWhoosh = names.some((n) => n.toLowerCase().includes("whoosh"));
    if (hasWhoosh) return "SFX (Whoosh)";

    const hasVoice =
      sources.some((s) => s.includes("elevenlabs") || s.includes("eleven-labs")) ||
      names.some((n) => n.toLowerCase().startsWith("voz"));
    if (hasVoice) return "Voz";

    // Low volume → background music
    const avgVolume = clips.reduce((sum, c) => sum + (c.volume ?? 1), 0) / clips.length;
    if (avgVolume < 0.5) return "Música de Fondo";

    return `Audio ${trackIndex + 1}`;
  }

  // ── Visual track patterns ──
  // Helper: extract filename from URL for pattern matching
  const filenames = sources.map((s) => {
    try {
      return decodeURIComponent(new URL(s).pathname.split("/").pop() || "").toLowerCase();
    } catch {
      return s.toLowerCase();
    }
  });

  // All opacity assets
  if (clips.every((c) => c.src.includes("Opacidad") || (c.name || "").includes("Opacidad"))) {
    return "Opacidad";
  }

  // All transparent assets
  if (clips.every((c) => c.src.includes("Transparente") || (c.name || "").includes("Transparente"))) {
    return "Transparente";
  }

  // AE Renders: check filenames for "ae", "after effects", "render", "comp"
  const aeClips = clips.filter(
    (c, i) =>
      filenames[i].includes("ae_") ||
      filenames[i].includes("ae-") ||
      filenames[i].includes("after_effect") ||
      filenames[i].includes("after-effect") ||
      filenames[i].includes("_render") ||
      filenames[i].includes("-render") ||
      filenames[i].startsWith("render") ||
      filenames[i].includes("_comp") ||
      filenames[i].includes("-comp") ||
      (c.name || "").toLowerCase().includes("ae render") ||
      (c.name || "").toLowerCase().includes("after effect")
  );
  if (aeClips.length > 0 && aeClips.length >= clips.length * 0.5) return "AE Renders";

  // B-Roll: check filenames/URLs for "broll", "b-roll", "b_roll", pexels, pixabay
  const brollClips = clips.filter(
    (c, i) =>
      filenames[i].includes("broll") ||
      filenames[i].includes("b-roll") ||
      filenames[i].includes("b_roll") ||
      c.src.includes("pexels") ||
      c.src.includes("pixabay") ||
      (c.name || "").toLowerCase().includes("b-roll") ||
      (c.name || "").toLowerCase().includes("broll")
  );
  if (brollClips.length > 0 && brollClips.length >= clips.length * 0.5) return "B-Roll";

  // Fuentes Research: check filenames for "research", "fuente", "fuentes"
  const researchClips = clips.filter(
    (c, i) =>
      filenames[i].includes("research") ||
      filenames[i].includes("fuente") ||
      (c.name || "").toLowerCase().includes("research") ||
      (c.name || "").toLowerCase().includes("fuente")
  );
  if (researchClips.length > 0 && researchClips.length >= clips.length * 0.5) return "Fuentes Research";

  // HeyGen / Avatar clips (explicit domain match)
  const avatarClips = clips.filter(
    (c) =>
      c.src.includes("heygen") ||
      c.src.includes("ugcfiles") ||
      (c.name || "").toLowerCase().startsWith("avatar")
  );
  if (avatarClips.length > 0 && avatarClips.length >= clips.length * 0.5) {
    // Topmost visual track in multi-layer timelines = AE Renders (overlay graphics from After Effects)
    if (trackIndex === 0 && totalTracksOfType && totalTracksOfType > 1) return "AE Renders";
    return "Avatares";
  }

  // Images with transitions → Slides
  const imageClips = clips.filter((c) => c.type === "image");
  const hasTransitions = clips.some((c) => c.transition?.in || c.transition?.out);
  if (imageClips.length > 0 && imageClips.length >= clips.length * 0.7 && hasTransitions) {
    return "Slides";
  }

  // Images with blur filter → Fondos
  const blurClips = clips.filter((c) => c.filter === "blur");
  if (blurClips.length > 0 && blurClips.length >= clips.length * 0.5) return "Fondos Blur";

  // All images — try to detect specific type from filenames
  if (imageClips.length === clips.length) {
    // Check if filenames give us more info
    if (researchClips.length > 0) return "Fuentes Research";
    return "Imágenes";
  }

  // All video clips — try to detect type
  const videoClips = clips.filter((c) => c.type === "video");
  if (videoClips.length === clips.length) {
    if (clips.some((c) => c.effect === "zoomInSlow")) return "Cámaras";
    // Multiple video clips without specific markers → likely avatares
    if (videoClips.length > 1 && avatarClips.length === 0) {
      // No explicit avatar markers but all videos — check if they look like avatar renders
      // (sequential numbered videos from same domain, no stock footage markers)
      const noStockMarkers = videoClips.every(
        (c) => !c.src.includes("pexels") && !c.src.includes("pixabay") &&
               !filenames[clips.indexOf(c)]?.includes("broll")
      );
      if (noStockMarkers && videoClips.length >= 3) {
        if (trackIndex === 0 && totalTracksOfType && totalTracksOfType > 1) return "AE Renders";
        return "Avatares";
      }
    }
    return `Video ${trackIndex + 1}`;
  }

  return `Capa ${trackIndex + 1}`;
}

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
    const converted = convertTrack(track, `visual-${i}`, "visual", zIndex, fps, i, visualTracks.length);
    if (converted.clips.length > 0) {
      remotionTracks.push(converted);
    }
  });

  // Audio tracks: zIndex doesn't matter for audio, but keep ordering
  audioTracks.forEach((track, i) => {
    const converted = convertTrack(track, `audio-${i}`, "audio", 0, fps, i, audioTracks.length);
    if (converted.clips.length > 0) {
      remotionTracks.push(converted);
    }
  });

  // Calculate total duration from all clips
  const durationInFrames = calculateTotalDuration(remotionTracks, fps);

  // Detect scenes: explicit from Shotstack JSON, or heuristic from music transitions
  let scenes: TimelineScene[] | undefined;
  if (timeline.scenes && timeline.scenes.length > 0) {
    scenes = timeline.scenes.map((s) => ({
      type: (s.type as SceneType) || "desarrollo",
      label: s.label || s.type,
      fromFrame: Math.round(s.startSeconds * fps),
      toFrame: Math.round(s.endSeconds * fps),
      color: SCENE_COLORS[s.type as SceneType] || SCENE_COLORS.desarrollo,
    }));
  } else {
    scenes = detectScenesFromMusic(remotionTracks, durationInFrames, fps);
  }

  return {
    videoId,
    fps,
    width: dimensions.width,
    height: dimensions.height,
    durationInFrames,
    backgroundColor,
    tracks: remotionTracks,
    scenes,
  };
}

function convertTrack(
  track: ShotstackTrack,
  id: string,
  type: "visual" | "audio",
  zIndex: number,
  fps: number,
  trackIndex: number,
  totalTracksOfType?: number
): RemotionTrack {
  const clips: RemotionClip[] = [];

  for (let i = 0; i < track.clips.length; i++) {
    const clip = track.clips[i];
    const converted = convertClip(clip, `${id}-clip-${i}`, fps, i);
    if (converted) {
      clips.push(converted);
    }
  }

  // Priority: explicit name from Shotstack JSON > auto-derived from content
  const name = track.name || deriveTrackName(clips, type, trackIndex, totalTracksOfType);

  return { id, name, type, zIndex, clips };
}

function convertClip(
  clip: ShotstackClip,
  id: string,
  fps: number,
  clipIndex: number
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

  // Derive a human-readable name
  const name = deriveClipName(asset.src, asset.type, clipIndex);

  return {
    id,
    name,
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

// ─── Scene Detection ──────────────────────────────────────

const SCENE_COLORS: Record<SceneType, string> = {
  hook: "#ef4444",       // red
  intro: "#f59e0b",      // amber
  desarrollo: "#3b82f6", // blue
  cta: "#10b981",        // emerald
  outro: "#8b5cf6",      // violet
  transicion: "#6b7280", // gray
};

/**
 * Heuristic scene detection based on music track transitions.
 * Music changes roughly correspond to narrative section boundaries.
 * The first segment is Hook+Intro, middle is Desarrollo, last is CTA.
 */
function detectScenesFromMusic(
  tracks: RemotionTrack[],
  totalFrames: number,
  fps: number
): TimelineScene[] {
  // Find the music track (background audio with SunoMusic or low volume)
  const musicTrack = tracks.find(
    (t) =>
      t.type === "audio" &&
      t.clips.length > 1 &&
      t.clips.some((c) => c.src.includes("SunoMusic") || c.src.includes("suno"))
  );

  if (!musicTrack || musicTrack.clips.length < 2) {
    // Fallback: single scene for the whole video
    return [{
      type: "desarrollo",
      label: "Video completo",
      fromFrame: 0,
      toFrame: totalFrames,
      color: SCENE_COLORS.desarrollo,
    }];
  }

  // Sort music clips by start time
  const sorted = [...musicTrack.clips].sort((a, b) => a.from - b.from);
  const totalDurationSec = totalFrames / fps;

  const scenes: TimelineScene[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const clip = sorted[i];
    const fromFrame = clip.from;
    const toFrame = clip.from + clip.durationInFrames;
    const fromSec = fromFrame / fps;
    const toSec = toFrame / fps;

    let type: SceneType;
    let label: string;

    if (i === 0 && fromSec < 5) {
      // First segment starting near 0 = Hook
      if (toSec <= 30) {
        type = "hook";
        label = "Hook";
      } else if (toSec <= 100) {
        type = "hook";
        label = "Hook + Intro";
      } else {
        type = "intro";
        label = "Intro";
      }
    } else if (i === sorted.length - 1 && totalDurationSec - fromSec < 60) {
      // Last segment within 60s of the end = CTA
      type = "cta";
      label = "CTA";
    } else if (i === 1 && fromSec < 100) {
      type = "intro";
      label = "Intro";
    } else {
      type = "desarrollo";
      // Number the development sections
      const devIndex = scenes.filter((s) => s.type === "desarrollo").length + 1;
      label = `Desarrollo ${devIndex}`;
    }

    scenes.push({
      type,
      label,
      fromFrame,
      toFrame: Math.min(toFrame, totalFrames),
      color: SCENE_COLORS[type],
    });
  }

  return scenes;
}
