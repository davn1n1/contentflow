"use client";

import { cn } from "@/lib/utils";
import { Film, Search } from "lucide-react";
import type { Video } from "@/types/database";

interface VideoMiniListProps {
  videos: Video[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div className={cn(
      "w-2 h-2 rounded-full",
      active ? "bg-emerald-400" : "bg-muted-foreground/30"
    )} />
  );
}

export function VideoMiniList({ videos, selectedId, onSelect, isLoading }: VideoMiniListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Search className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No se encontraron videos</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {videos.map((video) => (
        <button
          key={video.id}
          onClick={() => onSelect(video.id)}
          className={cn(
            "w-full text-left p-3 rounded-lg transition-all duration-200",
            selectedId === video.id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-muted border border-transparent"
          )}
        >
          <div className="flex items-center gap-3">
            {/* Video number badge */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
              selectedId === video.id
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {video.name || <Film className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                selectedId === video.id ? "text-primary" : "text-foreground"
              )}>
                {video.titulo || `Video #${video.name || ""}`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {/* Pipeline status dots */}
                <div className="flex items-center gap-1" title="Copy / Audio / Video / Render">
                  <StatusDot active={video.status_copy} />
                  <StatusDot active={video.status_audio} />
                  <StatusDot active={video.status_avatares} />
                  <StatusDot active={!!video.status_rendering_video} />
                </div>
                {video.estado && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    video.estado === "Video Completo"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {video.estado}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
