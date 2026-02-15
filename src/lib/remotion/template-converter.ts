import type { RemotionTimeline, RemotionTrack, RemotionClip } from "./types";
import { TEMPLATES, type TemplateDefinition } from "./templates";
import { STATIC_ASSETS } from "./constants";

/**
 * Convert a template definition into a RemotionTimeline
 * so it can be opened in the main editor.
 *
 * Creates:
 * - 1 visual track with a single "template" clip (the animation)
 * - 1 audio track with individual clips for each audio FX
 *
 * The audio clips can be dragged on the timeline to adjust sync.
 * When saved, extractTemplateProps() reads positions back.
 */
export function templateToTimeline(
  templateId: string,
  overrides?: Record<string, unknown>
): RemotionTimeline {
  const tpl = TEMPLATES[templateId];
  if (!tpl) throw new Error(`Template "${templateId}" not found`);

  const props = { ...tpl.defaultProps, ...overrides } as Record<string, unknown>;
  const fps = tpl.fps;

  // ── Visual track: single template clip ──
  const templateClip: RemotionClip = {
    id: `tpl-${templateId}`,
    name: tpl.name,
    type: "template",
    templateId,
    templateProps: extractContentProps(tpl, props),
    src: `template://${templateId}`,
    from: 0,
    durationInFrames: tpl.durationInFrames,
  };

  const visualTrack: RemotionTrack = {
    id: "track-template",
    name: tpl.name,
    type: "visual",
    zIndex: 1,
    clips: [templateClip],
  };

  // ── Audio track: one clip per audio FX ──
  const audioClips = buildAudioClips(tpl, props, fps);

  const audioTrack: RemotionTrack = {
    id: "track-sfx",
    name: "SFX",
    type: "audio",
    zIndex: 0,
    clips: audioClips,
  };

  return {
    id: `template-${templateId}`,
    fps: tpl.fps,
    width: tpl.width,
    height: tpl.height,
    durationInFrames: tpl.durationInFrames,
    backgroundColor: (props.bgColor as string) || "#000000",
    tracks: [visualTrack, audioTrack],
  };
}

/**
 * Extract content + color props (NOT timing/audio — those come from clip positions).
 */
function extractContentProps(
  tpl: TemplateDefinition,
  props: Record<string, unknown>
): Record<string, unknown> {
  const contentProps: Record<string, unknown> = {};
  for (const meta of tpl.propsMeta) {
    if (meta.group === "content" || meta.group === "colors") {
      contentProps[meta.key] = props[meta.key];
    }
  }
  return contentProps;
}

/**
 * Build audio clips from template's audio props.
 */
function buildAudioClips(
  tpl: TemplateDefinition,
  props: Record<string, unknown>,
  fps: number
): RemotionClip[] {
  const clips: RemotionClip[] = [];

  // Find audio-group props that are timing type (they define FX positions)
  const audioTimings = tpl.propsMeta.filter(
    (m) => m.group === "audio" && m.type === "timing"
  );

  for (const meta of audioTimings) {
    const seconds = Number(props[meta.key]) || 0;
    const frame = Math.round(seconds * fps);

    // Find corresponding volume prop
    const volumeKey = meta.key.replace("At", "Volume");
    const volume = Number(props[volumeKey]) ?? 1;

    // Map to SFX asset
    const src = getSfxSrc(meta.key);
    if (!src) continue;

    clips.push({
      id: `sfx-${meta.key}`,
      name: meta.label,
      type: "audio",
      src,
      from: frame,
      durationInFrames: 30, // ~1s for SFX
      volume,
    });
  }

  return clips;
}

/**
 * Map audio prop key to SFX URL.
 */
function getSfxSrc(propKey: string): string | null {
  if (propKey.toLowerCase().includes("whooshin")) return STATIC_ASSETS.WHOOSH_IN;
  if (propKey.toLowerCase().includes("whooshout")) return STATIC_ASSETS.WHOOSH_OUT;
  return null;
}

/**
 * Extract template props back from a timeline that was edited.
 * Reads audio clip positions and converts frames → seconds.
 * Merges with the template clip's visual props.
 *
 * This is the inverse of templateToTimeline().
 */
export function extractTemplateProps(
  timeline: RemotionTimeline,
  templateId: string
): Record<string, unknown> {
  const tpl = TEMPLATES[templateId];
  if (!tpl) throw new Error(`Template "${templateId}" not found`);

  const props: Record<string, unknown> = {};
  const fps = timeline.fps;

  // Get visual props from the template clip
  const templateClip = timeline.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.type === "template" && c.templateId === templateId);

  if (templateClip?.templateProps) {
    Object.assign(props, templateClip.templateProps);
  }

  // Get audio timing from audio clip positions
  const audioClips = timeline.tracks
    .filter((t) => t.type === "audio")
    .flatMap((t) => t.clips);

  for (const clip of audioClips) {
    // Match clip ID back to prop key (sfx-whooshInAt → whooshInAt)
    const propKey = clip.id.replace("sfx-", "");
    const meta = tpl.propsMeta.find((m) => m.key === propKey);
    if (!meta) continue;

    // Frame → seconds
    props[propKey] = Number((clip.from / fps).toFixed(3));

    // Volume
    const volumeKey = propKey.replace("At", "Volume");
    if (clip.volume != null) {
      props[volumeKey] = clip.volume;
    }
  }

  return props;
}
