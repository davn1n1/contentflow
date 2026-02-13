"use client";

import { cn } from "@/lib/utils";
import { Clock, Eye } from "lucide-react";
import type { ResearchSelectedIdea } from "@/types/database";

interface SelectedIdeaCardProps {
  idea: ResearchSelectedIdea;
}

export function SelectedIdeaCard({ idea }: SelectedIdeaCardProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Thumbnail */}
      {idea.thumb_url ? (
        <div className="relative aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={idea.thumb_url}
            alt={idea.idea_title || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
          {/* Duration overlay */}
          {idea.yt_duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
              {idea.yt_duration}
            </span>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Sin thumbnail</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h4 className="text-sm font-semibold leading-tight line-clamp-2">
          {idea.idea_title || "Sin título"}
        </h4>

        {/* Research Puesto */}
        {idea.research_puesto != null && (
          <div>
            <span className="text-xs text-muted-foreground">Research Puesto</span>
            <p className="text-lg font-bold text-primary">{idea.research_puesto}</p>
          </div>
        )}

        {/* YT_New badge */}
        {idea.yt_new && (
          <div>
            <span className="text-xs text-muted-foreground">YT_New</span>
            <div className="mt-0.5">
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                idea.yt_new.toLowerCase() === "yesterday"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {idea.yt_new}
              </span>
            </div>
          </div>
        )}

        {/* Fuentes Inspiracion */}
        {idea.fuentes_inspiracion && (
          <div>
            <span className="text-xs text-muted-foreground">Fuentes Inspiracion</span>
            <div className="mt-0.5 flex items-center gap-2">
              {idea.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idea.logo_url}
                  alt={idea.fuentes_inspiracion}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted">
                {idea.fuentes_inspiracion}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {idea.yt_duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {idea.yt_duration}
            </span>
          )}
          {idea.yt_views_count != null && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {idea.yt_views_count.toLocaleString()}
            </span>
          )}
        </div>

        {/* Research Evaluación */}
        {idea.research_evaluacion && (
          <div>
            <span className="text-xs text-muted-foreground">Research Evaluación</span>
            <p className="text-xs mt-1 leading-relaxed line-clamp-4">
              {idea.research_evaluacion}
            </p>
          </div>
        )}

        {/* Research Resumen */}
        {idea.research_resumen && (
          <div>
            <span className="text-xs text-muted-foreground">Research Resumen</span>
            <p className="text-xs mt-1 leading-relaxed line-clamp-3">
              {idea.research_resumen}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
