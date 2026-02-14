import { create } from "zustand";
import { temporal } from "zundo";
import type { RemotionTimeline, RemotionClip } from "@/lib/remotion/types";
import {
  applyClipReorder,
  recalculateDuration,
} from "@/lib/remotion/editor-utils";

// ─── Types ───────────────────────────────────────────────

export interface TimelineMarker {
  id: string;
  frame: number;
  label: string;
  color: string;
}

interface EditorState {
  // Undoable state (tracked by Zundo)
  timeline: RemotionTimeline | null;

  // Non-undoable state
  selectedClipIds: string[];
  isDirty: boolean;
  clipboard: RemotionClip[];
  markers: TimelineMarker[];
  rippleEdit: boolean;
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

  // Clipboard
  copyClips: () => void;
  pasteClips: (atFrame: number) => void;

  // Markers
  addMarker: (frame: number, label?: string) => void;
  removeMarker: (id: string) => void;
  updateMarkerLabel: (id: string, label: string) => void;

  // Ripple edit
  toggleRippleEdit: () => void;

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

/**
 * Ripple edit: after resizing a clip, shift all subsequent clips in the same track
 * so they start immediately after the resized clip ends. Preserves gaps between clips.
 */
function rippleAfterClip(
  timeline: RemotionTimeline,
  clipId: string
): RemotionTimeline {
  return {
    ...timeline,
    tracks: timeline.tracks.map((track) => {
      const idx = track.clips.findIndex((c) => c.id === clipId);
      if (idx === -1) return track;
      const resized = track.clips[idx];
      const resizedEnd = resized.from + resized.durationInFrames;

      // Shift clips that come after the resized clip
      const newClips = track.clips.map((c, i) => {
        if (i <= idx) return c;
        // Calculate the expected start: immediately after the previous clip
        const prev = i === idx + 1 ? resized : track.clips[i - 1];
        const prevEnd = prev.from + prev.durationInFrames;
        if (i === idx + 1) {
          // First clip after resized: place at resized end
          return { ...c, from: resizedEnd };
        }
        // Subsequent clips: maintain relative spacing from previous
        const originalGap = c.from - (track.clips[i - 1].from + track.clips[i - 1].durationInFrames);
        return { ...c, from: prevEnd + Math.max(0, originalGap) };
      });

      return { ...track, clips: newClips };
    }),
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
      clipboard: [],
      markers: [],
      rippleEdit: false,

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

          let updated = mapClips(state.timeline, clipId, (clip) => ({
            ...clip,
            durationInFrames: duration,
          }));

          // Ripple edit: shift subsequent clips in the same track
          if (state.rippleEdit) {
            updated = rippleAfterClip(updated, clipId);
          }

          return {
            timeline: recalculateDuration(updated),
            isDirty: true,
          };
        }),

      resizeClipStart: (clipId, newFrom) =>
        set((state) => {
          if (!state.timeline) return state;
          const minFrames = 10;

          let updated = mapClips(state.timeline, clipId, (clip) => {
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
          });

          // Ripple edit: shift subsequent clips in the same track
          if (state.rippleEdit) {
            updated = rippleAfterClip(updated, clipId);
          }

          return {
            timeline: recalculateDuration(updated),
            isDirty: true,
          };
        }),

      // Clipboard
      copyClips: () => {
        const { timeline, selectedClipIds } = get();
        if (!timeline || selectedClipIds.length === 0) return;
        const clips: RemotionClip[] = [];
        for (const track of timeline.tracks) {
          for (const clip of track.clips) {
            if (selectedClipIds.includes(clip.id)) {
              clips.push({ ...clip });
            }
          }
        }
        set({ clipboard: clips });
      },

      pasteClips: (atFrame) =>
        set((state) => {
          if (!state.timeline || state.clipboard.length === 0) return state;
          // Find the track that contains the same type as the first clipboard clip
          const firstClip = state.clipboard[0];
          const targetTrack = state.timeline.tracks.find((t) =>
            t.type === firstClip.type ||
            t.clips.some((c) => c.type === firstClip.type)
          );
          if (!targetTrack) return state;

          // Calculate offset: paste starts at atFrame, maintain relative positions
          const minFrom = Math.min(...state.clipboard.map((c) => c.from));
          const offset = atFrame - minFrom;
          const newClips = state.clipboard.map((c) => ({
            ...c,
            id: `${c.id}-copy-${Date.now()}`,
            name: `${c.name} (copy)`,
            from: c.from + offset,
          }));

          const updated = {
            ...state.timeline,
            tracks: state.timeline.tracks.map((track) => {
              if (track.id !== targetTrack.id) return track;
              return { ...track, clips: [...track.clips, ...newClips] };
            }),
          };

          return {
            timeline: recalculateDuration(updated),
            selectedClipIds: newClips.map((c) => c.id),
            isDirty: true,
          };
        }),

      // Markers
      addMarker: (frame, label) => {
        const MARKER_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
        set((state) => {
          const idx = state.markers.length % MARKER_COLORS.length;
          return {
            markers: [
              ...state.markers,
              {
                id: `m-${Date.now()}`,
                frame,
                label: label || `M${state.markers.length + 1}`,
                color: MARKER_COLORS[idx],
              },
            ],
          };
        });
      },

      removeMarker: (id) =>
        set((state) => ({
          markers: state.markers.filter((m) => m.id !== id),
        })),

      updateMarkerLabel: (id, label) =>
        set((state) => ({
          markers: state.markers.map((m) =>
            m.id === id ? { ...m, label } : m
          ),
        })),

      // Ripple edit
      toggleRippleEdit: () =>
        set((state) => ({ rippleEdit: !state.rippleEdit })),

      markClean: () => set({ isDirty: false }),
    }),
    {
      limit: 50,
      // Only track timeline changes (not selection, isDirty, clipboard)
      partialize: (state) => ({
        timeline: state.timeline,
      }),
      equality: (pastState, currentState) =>
        pastState.timeline === currentState.timeline,
    }
  )
);
