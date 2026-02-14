"use client";

import type { Video } from "@/types/database";
import { StatusBadge } from "@/components/videos/status-badge";
import { PipelineProgressBar } from "@/components/videos/pipeline-progress-bar";
import { Film } from "lucide-react";

interface ThumbnailCardProps {
  video: Video;
  onClick: () => void;
}

export function ThumbnailCard({ video, onClick }: ThumbnailCardProps) {
  const title = video.titulo || video.titulo_youtube_a || `Video #${video.name}`;

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all group text-left w-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {video.portada_a ? (
          <img
            src={video.portada_a}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Film className="w-10 h-10 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/50">
              {video.status_copy ? "Sin miniatura" : "Pendiente copy"}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={video.estado} />
        </div>
        <span className="absolute bottom-2 left-2 text-xs font-mono text-white/80 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
          #{video.name}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h4>

        {/* Title options preview */}
        {(video.titulo_youtube_a || video.titulo_youtube_b) && (
          <div className="flex items-center gap-1.5">
            {video.titulo_youtube_a && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">A</span>
            )}
            {video.titulo_youtube_b && (
              <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 rounded px-1 py-0.5">B</span>
            )}
            {video.titulo_youtube_c && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 rounded px-1 py-0.5">C</span>
            )}
            <span className="text-[10px] text-muted-foreground ml-1">
              {[video.titulo_youtube_a, video.titulo_youtube_b, video.titulo_youtube_c].filter(Boolean).length} titles
            </span>
          </div>
        )}

        <PipelineProgressBar video={video} compact />
      </div>
    </button>
  );
}
