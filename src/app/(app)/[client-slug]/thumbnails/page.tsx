"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { useVideoDetail } from "@/lib/hooks/use-video-detail";
import { useDraftPublicacion } from "@/lib/hooks/use-draft-publicacion";
import { PipelineHeader } from "@/components/shared/pipeline-header";
import { ThumbnailCard } from "@/components/thumbnails/thumbnail-card";
import { ThumbnailDetail } from "@/components/thumbnails/thumbnail-detail";
import type { DraftPublicacion } from "@/types/database";
import { ImageIcon, Star } from "lucide-react";

export default function ThumbnailsPage() {
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get("videoId");
  const { activeVideoId, setActiveVideo } = useVideoContextStore();

  const videoId = urlVideoId || activeVideoId;

  // Sync URL → context store
  useEffect(() => {
    if (urlVideoId && urlVideoId !== activeVideoId) {
      setActiveVideo(urlVideoId);
    }
  }, [urlVideoId, activeVideoId, setActiveVideo]);

  const { data: videoDetail } = useVideoDetail(videoId);
  const { data: drafts = [], isLoading } = useDraftPublicacion(videoId);

  const [selectedDraft, setSelectedDraft] = useState<DraftPublicacion | null>(null);

  // Split into sections
  const allDrafts = drafts;
  const favoriteDrafts = drafts.filter((d) => d.favorita);

  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
        <h2 className="text-lg font-semibold text-muted-foreground">Sin video seleccionado</h2>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Selecciona un video desde la lista de Videos
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PipelineHeader currentPhase="copy" />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Header with count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Miniaturas</h2>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {allDrafts.length} thumbs
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : allDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-sm font-semibold text-muted-foreground">
              No hay miniaturas para este video
            </h3>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Las miniaturas se generan durante la fase de Copy
            </p>
          </div>
        ) : (
          <>
            {/* MINIATURAS section */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Miniaturas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allDrafts.map((draft) => (
                  <ThumbnailCard
                    key={draft.id}
                    draft={draft}
                    onClick={() => setSelectedDraft(draft)}
                  />
                ))}
              </div>
            </section>

            {/* FAVORITAS section */}
            {favoriteDrafts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Favoritas
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({favoriteDrafts.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {favoriteDrafts.map((draft) => (
                    <ThumbnailCard
                      key={`fav-${draft.id}`}
                      draft={draft}
                      onClick={() => setSelectedDraft(draft)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <ThumbnailDetail
        draft={selectedDraft}
        open={!!selectedDraft}
        onOpenChange={(open) => {
          if (!open) setSelectedDraft(null);
        }}
      />
    </div>
  );
}
