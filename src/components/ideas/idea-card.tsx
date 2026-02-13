"use client";

import { cn } from "@/lib/utils";
import type { Idea } from "@/types/database";
import { Star, ExternalLink, Image as ImageIcon } from "lucide-react";
import { CreateVideoButton } from "@/components/shared/create-video-button";

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
}

const TIPO_IDEA_CONFIG: Record<string, { color: string; bg: string }> = {
  "Video Youtube": { color: "text-red-400", bg: "bg-red-500/20" },
  URL: { color: "text-blue-400", bg: "bg-blue-500/20" },
  "Reel Instagram": { color: "text-pink-400", bg: "bg-pink-500/20" },
  "Ad Meta": { color: "text-indigo-400", bg: "bg-indigo-500/20" },
  "Post X": { color: "text-sky-400", bg: "bg-sky-500/20" },
  Manual: { color: "text-amber-400", bg: "bg-amber-500/20" },
};

const TRANSCRIPT_CONFIG: Record<string, { color: string; bg: string }> = {
  "Transcript OK": { color: "text-emerald-400", bg: "bg-emerald-500/20" },
  "Error Transcript": { color: "text-red-400", bg: "bg-red-500/20" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const tipoConfig = TIPO_IDEA_CONFIG[idea.tipo_idea || ""] || {
    color: "text-muted-foreground",
    bg: "bg-muted",
  };
  const transcriptConfig = idea.status_transcript
    ? TRANSCRIPT_CONFIG[idea.status_transcript]
    : null;

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted/50 overflow-hidden">
        {idea.thumb_url ? (
          <img
            src={idea.thumb_url}
            alt={idea.idea_title || ""}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        {idea.favorita && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 backdrop-blur-sm">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {idea.idea_title || "Untitled Idea"}
        </h3>

        {/* Channel name */}
        {idea.yt_channel_name && (
          <p className="text-xs text-muted-foreground truncate">
            {idea.yt_channel_name}
          </p>
        )}

        {/* Tipo Idea badge */}
        {idea.tipo_idea && (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
              tipoConfig.bg,
              tipoConfig.color
            )}
          >
            {idea.tipo_idea}
          </span>
        )}

        {/* Score */}
        {idea.score !== null && idea.score !== undefined && (
          <p className="text-xs text-muted-foreground">{idea.score}</p>
        )}

        {/* Date + relative */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(idea.created).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
            {timeAgo(idea.created)}
          </span>
        </div>

        {/* Summary */}
        {idea.summary && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {idea.summary}
          </p>
        )}

        {/* Bottom badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {idea.short_long && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-400">
              {idea.short_long}
            </span>
          )}
          {transcriptConfig && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
                transcriptConfig.bg,
                transcriptConfig.color
              )}
            >
              {idea.status_transcript}
            </span>
          )}
        </div>

        {/* Source link */}
        {idea.url_fuente && (
          <div className="pt-1">
            <a
              href={idea.url_fuente}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors truncate max-w-full"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{idea.domain || "Source"}</span>
            </a>
          </div>
        )}

        {/* Create Video */}
        <CreateVideoButton
          ideaId={idea.id}
          ideaTitle={idea.idea_title}
          variant="compact"
          className="pt-2 border-t border-border/50"
        />
      </div>
    </div>
  );
}
