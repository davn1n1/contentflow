"use client";

import { useState } from "react";
import type { Video } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/videos/status-badge";
import { PipelineProgressBar } from "@/components/videos/pipeline-progress-bar";
import { useTriggerThumbnail } from "@/lib/hooks/use-trigger-thumbnail";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
  Film,
  ExternalLink,
  Calendar,
  Clock,
} from "lucide-react";

interface ThumbnailDetailProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThumbnailDetail({ video, open, onOpenChange }: ThumbnailDetailProps) {
  const { mutate: trigger, isPending, isSuccess, isError, error, reset } = useTriggerThumbnail();
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);

  if (!video) return null;

  const title = video.titulo || video.titulo_youtube_a || `Video #${video.name}`;
  const titles = [
    { key: "A", value: video.titulo_youtube_a, color: "text-primary", bg: "bg-primary/10" },
    { key: "B", value: video.titulo_youtube_b, color: "text-purple-400", bg: "bg-purple-400/10" },
    { key: "C", value: video.titulo_youtube_c, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  const handleRegenerate = () => {
    if (!regenerateConfirm) {
      setRegenerateConfirm(true);
      return;
    }
    setRegenerateConfirm(false);
    reset();
    trigger({ recordId: video.airtable_id || video.id });
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
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              #{video.name}
            </span>
            {title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            <StatusBadge status={video.estado} />
            <span className="text-xs text-muted-foreground">
              {video.voice_length_minutes || "-"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Thumbnail grande */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {video.portada_a ? (
              <img
                src={video.portada_a}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <Film className="w-16 h-16 text-muted-foreground/20" />
                <span className="text-sm text-muted-foreground">
                  {video.status_copy ? "Sin miniatura generada" : "Se necesita crear copy primero"}
                </span>
              </div>
            )}
          </div>

          {/* YouTube Preview Mockup */}
          {video.portada_a && video.titulo_youtube_a && (
            <div className="glass-card rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                YouTube Preview
              </h4>
              <div className="flex gap-3">
                <div className="w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={video.portada_a}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                    {video.titulo_youtube_a}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Channel Name</p>
                  <p className="text-xs text-muted-foreground">
                    {video.voice_length_minutes || "-"} min
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Títulos A/B/C */}
          <div className="glass-card rounded-lg p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Title Options
            </h4>
            {titles.some(t => t.value) ? (
              <div className="space-y-2">
                {titles.map(({ key, value, color, bg }) =>
                  value ? (
                    <div key={key} className="flex items-start gap-2">
                      <span className={cn("text-xs font-bold rounded px-1.5 py-0.5 flex-shrink-0", color, bg)}>
                        {key}
                      </span>
                      <p className="text-sm text-foreground">{value}</p>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No titles generated yet.
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="glass-card rounded-lg p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Video Info
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(video.created_time).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              {video.voice_length_minutes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {video.voice_length_minutes}
                </div>
              )}
            </div>
            <div className="mt-3">
              <PipelineProgressBar video={video} compact />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={!video.status_copy || isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                isPending
                  ? "bg-primary/10 border border-primary/40 text-primary"
                  : isSuccess
                    ? "bg-success/10 border border-success/20 text-success"
                    : regenerateConfirm
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                      : !video.status_copy
                        ? "bg-muted/50 border border-border text-muted-foreground cursor-not-allowed opacity-50"
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

            {video.url_youtube && (
              <a
                href={video.url_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                YouTube
              </a>
            )}
          </div>

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error?.message || "Error al regenerar miniatura"}
            </div>
          )}

          {/* Warning si no hay copy */}
          {!video.status_copy && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Las miniaturas se generan durante la fase de Copy. Ejecuta "Crear Copy" primero.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
