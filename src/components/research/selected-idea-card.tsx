"use client";

import { cn } from "@/lib/utils";
import { Eye, Trophy, Sparkles } from "lucide-react";
import type { ResearchSelectedIdea } from "@/types/database";
import { CreateVideoButton } from "@/components/shared/create-video-button";

interface SelectedIdeaCardProps {
  idea: ResearchSelectedIdea;
  onClick?: () => void;
}

const RANK_STYLES: Record<number, { gradient: string; icon: string; ring: string }> = {
  1: { gradient: "from-amber-500/30 to-yellow-500/10", icon: "text-amber-400", ring: "ring-amber-500/30" },
  2: { gradient: "from-slate-400/20 to-slate-300/5", icon: "text-slate-300", ring: "ring-slate-400/20" },
  3: { gradient: "from-orange-700/20 to-orange-600/5", icon: "text-orange-400", ring: "ring-orange-600/20" },
};

export function SelectedIdeaCard({ idea, onClick }: SelectedIdeaCardProps) {
  const rankStyle = idea.research_puesto
    ? RANK_STYLES[idea.research_puesto] || { gradient: "from-primary/10 to-primary/5", icon: "text-primary", ring: "ring-primary/20" }
    : null;

  return (
    <div
      className={cn(
        "group relative rounded-xl overflow-hidden border transition-all duration-300",
        "bg-gradient-to-b from-card to-card/80 border-border",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        rankStyle && `ring-1 ${rankStyle.ring}`,
      )}
      onClick={onClick}
    >
      {/* Rank Badge - absolute positioned */}
      {idea.research_puesto != null && (
        <div className={cn(
          "absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md",
          "bg-gradient-to-r shadow-lg",
          rankStyle?.gradient || "from-primary/20 to-primary/10",
        )}>
          <Trophy className={cn("w-3.5 h-3.5", rankStyle?.icon || "text-primary")} />
          <span className={cn("text-xs font-bold", rankStyle?.icon || "text-primary")}>
            #{idea.research_puesto}
          </span>
        </div>
      )}

      {/* YT_New badge - absolute positioned */}
      {idea.yt_new && (
        <div className="absolute top-3 right-3 z-10">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg",
            idea.yt_new.toLowerCase() === "yesterday"
              ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/30"
              : "bg-muted/80 text-muted-foreground"
          )}>
            <Sparkles className="w-2.5 h-2.5" />
            {idea.yt_new}
          </span>
        </div>
      )}

      {/* Thumbnail */}
      {idea.thumb_url ? (
        <div className="relative aspect-video cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={idea.thumb_url}
            alt={idea.idea_title || "Video thumbnail"}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Duration chip */}
          {idea.yt_duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
              {idea.yt_duration}
            </span>
          )}
          {/* Views chip */}
          {idea.yt_views_count != null && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">
              <Eye className="w-2.5 h-2.5" />
              {idea.yt_views_count.toLocaleString()}
            </span>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Sin thumbnail</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title + Channel */}
        <div>
          <h4 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {idea.idea_title || "Sin título"}
          </h4>
          {idea.yt_channel_name && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{idea.yt_channel_name}</p>
          )}
        </div>

        {/* Source (Fuentes Inspiracion) */}
        {idea.fuentes_inspiracion && !idea.fuentes_inspiracion_is_id && (
          <div className="flex items-center gap-2">
            {idea.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={idea.logo_url}
                alt=""
                className="w-5 h-5 rounded-full ring-1 ring-border"
              />
            )}
            <span className="text-[11px] font-medium text-muted-foreground">
              {idea.fuentes_inspiracion}
            </span>
          </div>
        )}

        {/* Research Evaluación */}
        {idea.research_evaluacion && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 border-l-2 border-primary/30 pl-3">
            {idea.research_evaluacion}
          </p>
        )}

        {/* Research Resumen */}
        {idea.research_resumen && (
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2">
            {idea.research_resumen}
          </p>
        )}

        {/* Create Video Button */}
        <CreateVideoButton
          ideaId={idea.id}
          ideaTitle={idea.idea_title}
          variant="full"
          className="pt-3 border-t border-border/50"
        />
      </div>
    </div>
  );
}
