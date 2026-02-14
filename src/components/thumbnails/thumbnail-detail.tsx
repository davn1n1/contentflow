"use client";

import { useState } from "react";
import type { DraftPublicacion } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTriggerThumbnail } from "@/lib/hooks/use-trigger-thumbnail";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
  ImageIcon,
  Star,
  ThumbsUp,
  Calendar,
} from "lucide-react";

interface ThumbnailDetailProps {
  draft: DraftPublicacion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThumbnailDetail({ draft, open, onOpenChange }: ThumbnailDetailProps) {
  const { mutate: trigger, isPending, isSuccess, isError, error, reset } = useTriggerThumbnail();
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);

  if (!draft) return null;

  const imageUrl = draft.miniatura_url || draft.url_miniatura;

  const handleRegenerate = () => {
    if (!regenerateConfirm) {
      setRegenerateConfirm(true);
      return;
    }
    setRegenerateConfirm(false);
    reset();
    // Trigger ModificaMiniatura on the video, not the draft itself
    const videoId = draft.video_ids[0];
    if (videoId) {
      trigger({ recordId: videoId });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRegenerateConfirm(false);
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {draft.numero_concepto && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                #{draft.numero_concepto}
              </span>
            )}
            {draft.titulo || draft.name || "Miniatura"}
            {draft.favorita && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {draft.status && (
              <span className="text-xs font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
                {draft.status}
              </span>
            )}
            {draft.portada_youtube_abc && (
              <span className="text-xs font-bold text-white bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                {draft.portada_youtube_abc}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Miniatura grande */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={draft.titulo || "Miniatura"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                <span className="text-sm text-muted-foreground">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Description */}
          {draft.descripcion && (
            <div className="glass-card rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Descripcion
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{draft.descripcion}</p>
            </div>
          )}

          {/* Tags & metadata */}
          <div className="glass-card rounded-lg p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Detalles
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {draft.slideengine && (
                <div>
                  <span className="text-muted-foreground text-xs">Modelo</span>
                  <p className="text-foreground font-medium">{draft.slideengine}</p>
                </div>
              )}
              {draft.tipo_creatividad && (
                <div>
                  <span className="text-muted-foreground text-xs">Tipo Creatividad</span>
                  <p className="text-foreground font-medium">{draft.tipo_creatividad}</p>
                </div>
              )}
              {draft.pone_persona && (
                <div>
                  <span className="text-muted-foreground text-xs">Expresion</span>
                  <p className="text-foreground font-medium">{draft.pone_persona}</p>
                </div>
              )}
              {draft.formato && (
                <div>
                  <span className="text-muted-foreground text-xs">Formato</span>
                  <p className="text-foreground font-medium">{draft.formato}</p>
                </div>
              )}
              {draft.portada && (
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Aprobada como portada</span>
                </div>
              )}
              {draft.created && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(draft.created).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          {draft.prompt_miniatura && (
            <div className="glass-card rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Prompt
              </h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {draft.prompt_miniatura}
              </p>
            </div>
          )}

          {/* Feedback / Notes */}
          {(draft.feedback || draft.notes) && (
            <div className="glass-card rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {draft.feedback ? "Feedback" : "Notas"}
              </h4>
              <p className="text-sm text-foreground">{draft.feedback || draft.notes}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={isPending || draft.video_ids.length === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                isPending
                  ? "bg-primary/10 border border-primary/40 text-primary"
                  : isSuccess
                    ? "bg-success/10 border border-success/20 text-success"
                    : regenerateConfirm
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                      : "bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerando...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Enviado a n8n
                </>
              ) : regenerateConfirm ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Click para confirmar
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerar Miniatura
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error?.message || "Error al regenerar miniatura"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
