import type { RemotionTimeline, RemotionTrack, RemotionClip } from "./types";

/**
 * Reorder clips within a track after a drag & drop operation.
 * Recalculates `from` (start frame) for each clip so they play sequentially
 * in the new order, preserving gaps if they existed.
 */
export function reorderClipsInTrack(
  track: RemotionTrack,
  oldIndex: number,
  newIndex: number
): RemotionTrack {
  if (oldIndex === newIndex) return track;

  const clips = [...track.clips];
  const [moved] = clips.splice(oldIndex, 1);
  clips.splice(newIndex, 0, moved);

  // Recalculate `from` values so clips are sequential (no overlaps)
  const reframed = recalculateClipTimings(clips);

  return { ...track, clips: reframed };
}

/**
 * Recalculate `from` values for an ordered array of clips.
 * Each clip starts immediately after the previous one ends.
 */
export function recalculateClipTimings(clips: RemotionClip[]): RemotionClip[] {
  let cursor = 0;
  return clips.map((clip) => {
    const updated = { ...clip, from: cursor };
    cursor += clip.durationInFrames;
    return updated;
  });
}

/**
 * Apply a clip reorder to a full timeline.
 * Returns a new timeline with the specified track's clips reordered.
 */
export function applyClipReorder(
  timeline: RemotionTimeline,
  trackId: string,
  oldIndex: number,
  newIndex: number
): RemotionTimeline {
  return {
    ...timeline,
    tracks: timeline.tracks.map((track) => {
      if (track.id !== trackId) return track;
      return reorderClipsInTrack(track, oldIndex, newIndex);
    }),
  };
}

/**
 * Recalculate total duration after edits.
 * Returns the max end frame across all clips + 1 second buffer.
 */
export function recalculateDuration(
  timeline: RemotionTimeline
): RemotionTimeline {
  let maxFrame = 0;
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      const end = clip.from + clip.durationInFrames;
      if (end > maxFrame) maxFrame = end;
    }
  }
  return {
    ...timeline,
    durationInFrames: maxFrame + timeline.fps,
  };
}
