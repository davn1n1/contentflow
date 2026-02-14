import { create } from "zustand";
import { temporal } from "zundo";
import type { RemotionTimeline, RemotionClip } from "@/lib/remotion/types";
import {
  applyClipReorder,
  recalculateDuration,
} from "@/lib/remotion/editor-utils";

// ─── Types ───────────────────────────────────────────────

interface EditorState {
  // Undoable state (tracked by Zundo)
  timeline: RemotionTimeline | null;

  // Non-undoable state
  selectedClipIds: string[];
  isDirty: boolean;
}

interface EditorActions {
  // Initialization
  initTimeline: (timeline: RemotionTimeline) => void;

  // Selection
  selectClip: (clipId: string, addToSelection?: boolean) => void;
  deselectAll: () => void;

  // Clip mutations (undoable)
  updateClip: (clipId: string, updates: Partial<RemotionClip>) => void;
  deleteClips: (clipIds: string[]) => void;
  reorderClips: (
    trackId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  splitClipAtFrame: (clipId: string, frame: number) => void;
  resizeClipEnd: (clipId: string, newDurationInFrames: number) => void;
  resizeClipStart: (clipId: string, newFrom: number) => void;

  // Dirty tracking
  markClean: () => void;
}

type EditorStore = EditorState & EditorActions;

// ─── Helpers ─────────────────────────────────────────────

function mapClips(
  timeline: RemotionTimeline,
  clipId: string,
  fn: (clip: RemotionClip) => RemotionClip | RemotionClip[]
): RemotionTimeline {
  return {
    ...timeline,
    tracks: timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.flatMap((clip) =>
        clip.id === clipId ? [fn(clip)].flat() : [clip]
      ),
    })),
  };
}

// ─── Store ───────────────────────────────────────────────

export const useEditorStore = create<EditorStore>()(
  temporal(
    (set, get) => ({
      // State
      timeline: null,
      selectedClipIds: [],
      isDirty: false,

      // Initialization
      initTimeline: (timeline) =>
        set({ timeline, selectedClipIds: [], isDirty: false }),

      // Selection
      selectClip: (clipId, addToSelection = false) =>
        set((state) => ({
          selectedClipIds: addToSelection
            ? state.selectedClipIds.includes(clipId)
              ? state.selectedClipIds.filter((id) => id !== clipId)
              : [...state.selectedClipIds, clipId]
            : [clipId],
        })),

      deselectAll: () => set({ selectedClipIds: [] }),

      // Clip mutations
      updateClip: (clipId, updates) =>
        set((state) => {
          if (!state.timeline) return state;
          return {
            timeline: mapClips(state.timeline, clipId, (clip) => ({
              ...clip,
              ...updates,
            })),
            isDirty: true,
          };
        }),

      deleteClips: (clipIds) =>
        set((state) => {
          if (!state.timeline) return state;
          const updated = {
            ...state.timeline,
            tracks: state.timeline.tracks.map((track) => ({
              ...track,
              clips: track.clips.filter((c) => !clipIds.includes(c.id)),
            })),
          };
          return {
            timeline: recalculateDuration(updated),
            selectedClipIds: state.selectedClipIds.filter(
              (id) => !clipIds.includes(id)
            ),
            isDirty: true,
          };
        }),

      reorderClips: (trackId, oldIndex, newIndex) =>
        set((state) => {
          if (!state.timeline) return state;
          return {
            timeline: recalculateDuration(
              applyClipReorder(state.timeline, trackId, oldIndex, newIndex)
            ),
            isDirty: true,
          };
        }),

      splitClipAtFrame: (clipId, frame) =>
        set((state) => {
          if (!state.timeline) return state;
          const updated = mapClips(state.timeline, clipId, (clip) => {
            if (frame <= clip.from || frame >= clip.from + clip.durationInFrames) {
              return clip;
            }
            const splitPoint = frame - clip.from;
            return [
              {
                ...clip,
                durationInFrames: splitPoint,
                id: `${clip.id}-a`,
                name: `${clip.name} (1)`,
              },
              {
                ...clip,
                from: frame,
                durationInFrames: clip.durationInFrames - splitPoint,
                startFrom: (clip.startFrom ?? 0) + splitPoint,
                id: `${clip.id}-b`,
                name: `${clip.name} (2)`,
              },
            ];
          });
          return {
            timeline: recalculateDuration(updated),
            selectedClipIds: [],
            isDirty: true,
          };
        }),

      resizeClipEnd: (clipId, newDurationInFrames) =>
        set((state) => {
          if (!state.timeline) return state;
          const minFrames = 10;
          const duration = Math.max(minFrames, newDurationInFrames);
          return {
            timeline: recalculateDuration(
              mapClips(state.timeline, clipId, (clip) => ({
                ...clip,
                durationInFrames: duration,
              }))
            ),
            isDirty: true,
          };
        }),

      resizeClipStart: (clipId, newFrom) =>
        set((state) => {
          if (!state.timeline) return state;
          const minFrames = 10;
          return {
            timeline: recalculateDuration(
              mapClips(state.timeline, clipId, (clip) => {
                const clampedFrom = Math.max(0, newFrom);
                const end = clip.from + clip.durationInFrames;
                const newDuration = end - clampedFrom;
                if (newDuration < minFrames) return clip;
                const frameDelta = clampedFrom - clip.from;
                return {
                  ...clip,
                  from: clampedFrom,
                  durationInFrames: newDuration,
                  startFrom: (clip.startFrom ?? 0) + frameDelta,
                };
              })
            ),
            isDirty: true,
          };
        }),

      markClean: () => set({ isDirty: false }),
    }),
    {
      limit: 50,
      // Only track timeline changes (not selection, isDirty)
      partialize: (state) => ({
        timeline: state.timeline,
      }),
      equality: (pastState, currentState) =>
        pastState.timeline === currentState.timeline,
    }
  )
);
