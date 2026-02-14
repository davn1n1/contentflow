"use client";

import type { DraftPublicacion } from "@/types/database";
import { Star, ThumbsUp, ImageIcon } from "lucide-react";

interface ThumbnailCardProps {
  draft: DraftPublicacion;
  onClick: () => void;
}

export function ThumbnailCard({ draft, onClick }: ThumbnailCardProps) {
  const imageUrl = draft.miniatura_url || draft.url_miniatura;

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all group text-left w-full"
    >
      {/* image_preview */}
      <div className="relative aspect-video bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={draft.titulo || draft.name || "Miniatura"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}

        {/* thumb_id */}
        {draft.numero_concepto && (
          <span className="absolute bottom-2 left-2 text-xs font-mono font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
            {draft.numero_concepto}
          </span>
        )}

        {/* is_favorite */}
        {draft.favorita && (
          <Star className="absolute top-2 right-2 w-5 h-5 text-amber-400 fill-amber-400 drop-shadow" />
        )}

        {/* category_code */}
        {draft.portada_youtube_abc && (
          <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
            {draft.portada_youtube_abc}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* description_text */}
        <p className="text-sm text-foreground line-clamp-3 leading-snug">
          {draft.descripcion || draft.titulo || "Sin descripcion"}
        </p>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* model_tag */}
          {(draft.slideengine || draft.tipo_creatividad) && (
            <span className="text-[10px] font-medium text-cyan-400 bg-cyan-400/10 rounded px-1.5 py-0.5">
              {draft.slideengine || draft.tipo_creatividad}
            </span>
          )}

          {/* approved */}
          {draft.portada && (
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 rounded px-1.5 py-0.5">
              Si
            </span>
          )}

          {/* tone_tag */}
          {draft.pone_persona && (
            <span className="text-[10px] font-medium text-purple-400 bg-purple-400/10 rounded px-1.5 py-0.5">
              {draft.pone_persona}
            </span>
          )}

          {/* liked */}
          {draft.status === "Aprobada" && (
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>
      </div>
    </button>
  );
}
