"use client";

import { useEditorStore } from "@/lib/stores/editor-store";
import { ClipProperties } from "./ClipProperties";
import { X, MousePointerClick } from "lucide-react";

export function InspectorPanel() {
  const selectedClipIds = useEditorStore((s) => s.selectedClipIds);
  const timeline = useEditorStore((s) => s.timeline);
  const deselectAll = useEditorStore((s) => s.deselectAll);

  if (selectedClipIds.length === 0 || !timeline) {
    return (
      <div className="w-80 flex-shrink-0 rounded-lg border border-border/50 bg-card p-4 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
        <MousePointerClick className="h-8 w-8 text-muted-foreground/30" />
        <div>
          <p className="text-sm text-muted-foreground">Sin seleccion</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Haz click en un clip del timeline para editar sus propiedades
          </p>
        </div>
      </div>
    );
  }

  // Find the selected clip across all tracks
  const clipId = selectedClipIds[0];
  let selectedClip = null;
  for (const track of timeline.tracks) {
    const found = track.clips.find((c) => c.id === clipId);
    if (found) {
      selectedClip = found;
      break;
    }
  }

  if (!selectedClip) {
    return null;
  }

  return (
    <div className="w-80 flex-shrink-0 rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <h3 className="text-sm font-semibold truncate">{selectedClip.name}</h3>
        <button
          onClick={deselectAll}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted/30"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Properties */}
      <div className="p-4 overflow-y-auto max-h-[60vh]">
        <ClipProperties clip={selectedClip} fps={timeline.fps} />
      </div>
    </div>
  );
}
