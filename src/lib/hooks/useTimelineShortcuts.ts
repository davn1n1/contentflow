import { useHotkeys } from "react-hotkeys-hook";
import type { PlayerRef } from "@remotion/player";
import { useEditorStore } from "@/lib/stores/editor-store";

/**
 * Keyboard shortcuts for the timeline editor.
 * All shortcuts are disabled when focus is on input/select elements.
 */
export function useTimelineShortcuts(
  playerRef: React.RefObject<PlayerRef | null>,
  fps: number,
  options?: {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onZoomReset?: () => void;
  }
) {
  const store = useEditorStore;
  const temporal = store.temporal;

  const enableOnFormTags = false;

  // Undo: Ctrl+Z
  useHotkeys(
    "mod+z",
    (e) => {
      e.preventDefault();
      temporal.getState().undo();
    },
    { enableOnFormTags }
  );

  // Redo: Ctrl+Y or Ctrl+Shift+Z
  useHotkeys(
    "mod+y, mod+shift+z",
    (e) => {
      e.preventDefault();
      temporal.getState().redo();
    },
    { enableOnFormTags }
  );

  // Play/Pause: Space
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      playerRef.current?.toggle();
    },
    { enableOnFormTags }
  );

  // Delete selected clips: Delete or Backspace
  useHotkeys(
    "delete, backspace",
    (e) => {
      const selected = store.getState().selectedClipIds;
      if (selected.length === 0) return;
      e.preventDefault();
      store.getState().deleteClips(selected);
    },
    { enableOnFormTags }
  );

  // Split at playhead: S
  useHotkeys(
    "s",
    (e) => {
      const selected = store.getState().selectedClipIds;
      if (selected.length !== 1) return;
      const frame = playerRef.current?.getCurrentFrame();
      if (frame == null) return;
      e.preventDefault();
      store.getState().splitClipAtFrame(selected[0], frame);
    },
    { enableOnFormTags }
  );

  // Seek: Left/Right arrows (1 frame), Shift+Left/Right (1 second)
  useHotkeys(
    "left",
    (e) => {
      e.preventDefault();
      const frame = playerRef.current?.getCurrentFrame() ?? 0;
      playerRef.current?.seekTo(Math.max(0, frame - 1));
    },
    { enableOnFormTags }
  );

  useHotkeys(
    "right",
    (e) => {
      e.preventDefault();
      const frame = playerRef.current?.getCurrentFrame() ?? 0;
      playerRef.current?.seekTo(frame + 1);
    },
    { enableOnFormTags }
  );

  useHotkeys(
    "shift+left",
    (e) => {
      e.preventDefault();
      const frame = playerRef.current?.getCurrentFrame() ?? 0;
      playerRef.current?.seekTo(Math.max(0, frame - fps));
    },
    { enableOnFormTags }
  );

  useHotkeys(
    "shift+right",
    (e) => {
      e.preventDefault();
      const frame = playerRef.current?.getCurrentFrame() ?? 0;
      playerRef.current?.seekTo(frame + fps);
    },
    { enableOnFormTags }
  );

  // Deselect all: Escape
  useHotkeys(
    "escape",
    () => {
      store.getState().deselectAll();
    },
    { enableOnFormTags }
  );

  // Zoom in: Ctrl+= or Ctrl++
  useHotkeys(
    "mod+=, mod+plus",
    (e) => {
      e.preventDefault();
      options?.onZoomIn?.();
    },
    { enableOnFormTags }
  );

  // Zoom out: Ctrl+-
  useHotkeys(
    "mod+minus",
    (e) => {
      e.preventDefault();
      options?.onZoomOut?.();
    },
    { enableOnFormTags }
  );

  // Zoom reset: Ctrl+0
  useHotkeys(
    "mod+0",
    (e) => {
      e.preventDefault();
      options?.onZoomReset?.();
    },
    { enableOnFormTags }
  );
}
