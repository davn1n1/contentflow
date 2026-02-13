"use client";

import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/types/database";
import { StatusBadge } from "./status-badge";
import { PipelineProgressBar } from "./pipeline-progress-bar";
import { Clock, Film } from "lucide-react";

interface VideoCardProps {
  video: Video;
  clientSlug: string;
}

export function VideoCard({ video, clientSlug }: VideoCardProps) {
  return (
    <Link
      href={`/${clientSlug}/videos/${video.id}`}
      className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all group block"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {video.portada_a ? (
          <img
            src={video.portada_a}
            alt={video.titulo || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/50" />
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
      <div className="p-4">
        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
          {video.titulo || video.titulo_youtube_a || "Untitled"}
        </h4>

        <div className="mb-3">
          <PipelineProgressBar video={video} compact />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {video.voice_length_minutes || "-"}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(video.created_time).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
