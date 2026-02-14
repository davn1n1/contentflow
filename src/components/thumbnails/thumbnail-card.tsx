"use client";

import type { DraftPublicacion } from "@/types/database";
import { getEngineColor } from "@/lib/constants/engine-colors";
import { CheckCircle2, ImageIcon, User } from "lucide-react";

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  "Aprobada": { text: "text-emerald-400", bg: "bg-emerald-400/10" },
  "Pendiente": { text: "text-amber-400", bg: "bg-amber-400/10" },
  "En proceso": { text: "text-blue-400", bg: "bg-blue-400/10" },
  "Rechazada": { text: "text-red-400", bg: "bg-red-400/10" },
  "Nueva": { text: "text-cyan-400", bg: "bg-cyan-400/10" },
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || { text: "text-muted-foreground", bg: "bg-muted" };
}

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
      {/* Image preview */}
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

        {/* Numero concepto - grande y destacado */}
        {draft.numero_concepto && (
          <span className="absolute bottom-2 left-2 text-sm font-bold text-white bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">
            {draft.numero_concepto}
          </span>
        )}

        {/* Favorita - tick verde bonito */}
        {draft.favorita && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-4.5 h-4.5 text-white" />
          </div>
        )}

        {/* Portada ABC badge */}
        {draft.portada_youtube_abc && (
          <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-lg">
            {draft.portada_youtube_abc}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Titulo */}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {draft.titulo || draft.name || "Sin titulo"}
        </p>

        {/* Status badge */}
        {draft.status && (
          <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${getStatusColor(draft.status).text} ${getStatusColor(draft.status).bg}`}>
            {draft.status}
          </span>
        )}

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* SlideEngine - colorful Airtable-style tag */}
          {draft.slideengine && (
            <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${getEngineColor(draft.slideengine).text} ${getEngineColor(draft.slideengine).bg}`}>
              {draft.slideengine}
            </span>
          )}

          {/* Expresion tags - resolved names */}
          {draft.expresiones.map((expr) => (
            <span
              key={expr.id}
              className="text-[10px] font-medium text-amber-400 bg-amber-400/10 rounded px-1.5 py-0.5 inline-flex items-center gap-1"
            >
              {expr.image && (
                <img src={expr.image} alt="" className="w-3 h-3 rounded-full object-cover" />
              )}
              {expr.name}
            </span>
          ))}

          {/* Pone Persona */}
          {draft.pone_persona && (
            <span className="text-[10px] font-medium text-purple-400 bg-purple-400/10 rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
              <User className="w-2.5 h-2.5" />
              {draft.pone_persona}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
