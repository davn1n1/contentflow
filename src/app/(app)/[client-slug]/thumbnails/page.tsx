"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { useVideoDetail } from "@/lib/hooks/use-video-detail";
import { useDraftPublicacion } from "@/lib/hooks/use-draft-publicacion";
import { useUpdateVideo } from "@/lib/hooks/use-update-video";
import { useAppData } from "@/lib/hooks/use-app-data";
import { useAccountStore } from "@/lib/stores/account-store";
import { PipelineHeader } from "@/components/shared/pipeline-header";
import { ThumbnailCard } from "@/components/thumbnails/thumbnail-card";
import { ThumbnailDetail } from "@/components/thumbnails/thumbnail-detail";
import type { DraftPublicacion } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  ImageIcon, Star, RefreshCw, Award, Type, MessageSquare,
  Save, Loader2, Megaphone, Pin, Check,
} from "lucide-react";

const TABS = [
  { key: "miniaturas", label: "Miniaturas", icon: ImageIcon },
  { key: "favoritas", label: "Favoritas", icon: Star },
  { key: "portadas", label: "Portadas", icon: Award },
  { key: "titulos", label: "Titulos", icon: Type },
  { key: "comentario", label: "Comentario", icon: MessageSquare },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ThumbnailsPage() {
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get("videoId");
  const { activeVideoId, setActiveVideo } = useVideoContextStore();
  const queryClient = useQueryClient();
  const accountId = useAccountStore((s) => s.currentAccount?.id);

  const videoId = urlVideoId || activeVideoId;
  const [activeTab, setActiveTab] = useState<TabKey>("miniaturas");

  // Sync URL → context store
  useEffect(() => {
    if (urlVideoId && urlVideoId !== activeVideoId) {
      setActiveVideo(urlVideoId);
    }
  }, [urlVideoId, activeVideoId, setActiveVideo]);

  const { data: videoDetail } = useVideoDetail(videoId);
  const { data: drafts = [], isLoading } = useDraftPublicacion(videoDetail?.draft_publicacion_ids);
  const { mutate: updateVideo, isPending: isUpdatingVideo } = useUpdateVideo();

  // App data for selectors
  const { data: allSponsors = [] } = useAppData({ table: "sponsors", accountId });
  const { data: allComentarios = [] } = useAppData({ table: "comentario-pineado", accountId });

  const [selectedDraft, setSelectedDraft] = useState<DraftPublicacion | null>(null);

  // Editable video fields
  const [tituloA, setTituloA] = useState("");
  const [tituloB, setTituloB] = useState("");
  const [tituloC, setTituloC] = useState("");
  const [variacionesTitulos, setVariacionesTitulos] = useState("");
  const [hasTitleChanges, setHasTitleChanges] = useState(false);

  useEffect(() => {
    if (videoDetail) {
      setTituloA(videoDetail.titulo_a || "");
      setTituloB(videoDetail.titulo_b || "");
      setTituloC(videoDetail.titulo_c || "");
      setVariacionesTitulos(videoDetail.variaciones_multiples_titulos || "");
      setHasTitleChanges(false);
    }
  }, [videoDetail]);

  const handleSaveTitles = () => {
    if (!videoDetail) return;
    updateVideo({
      id: videoDetail.id,
      fields: {
        "Titulo Youtube A": tituloA,
        "Titulo Youtube B": tituloB,
        "Titulo Youtube C": tituloC,
        "Variaciones Multiples Titulos": variacionesTitulos,
      },
    });
    setHasTitleChanges(false);
  };

  const handleToggleSponsor = (sponsorId: string) => {
    if (!videoDetail) return;
    const current = videoDetail.sponsor_ids || [];
    const newIds = current.includes(sponsorId)
      ? current.filter((id) => id !== sponsorId)
      : [...current, sponsorId];
    updateVideo({ id: videoDetail.id, fields: { Sponsors: newIds } });
  };

  const handleToggleComentario = (comentarioId: string) => {
    if (!videoDetail) return;
    const current = videoDetail.comentario_pineado_ids || [];
    const newIds = current.includes(comentarioId)
      ? current.filter((id) => id !== comentarioId)
      : [...current, comentarioId];
    updateVideo({ id: videoDetail.id, fields: { "Comentario Pineado": newIds } });
  };

  // Auto-refresh polling after triggering new variations
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

    setIsPolling(true);

    pollTimerRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["draft-publicacion"] });
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
    }, 8000);

    // Stop after 5 minutes
    pollTimeoutRef.current = setTimeout(() => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      setIsPolling(false);
    }, 300000);
  }, [queryClient]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedDraft && drafts.length > 0) {
      const updated = drafts.find((d) => d.id === selectedDraft.id);
      if (updated) setSelectedDraft(updated);
    }
  }, [drafts, selectedDraft]);

  const allDrafts = [...drafts].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const favoriteDrafts = allDrafts.filter((d) => d.favorita);
  const portadaDrafts = allDrafts.filter((d) => d.portada);

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

      {/* Tab navigation */}
      <div className="border-b border-border/50 px-6">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.key === "favoritas" ? favoriteDrafts.length
              : tab.key === "portadas" ? portadaDrafts.length
              : tab.key === "miniaturas" ? allDrafts.length
              : undefined;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("w-4 h-4", tab.key === "favoritas" && activeTab === tab.key && "fill-primary")} />
                {tab.label}
                {count !== undefined && (
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </button>
            );
          })}
          {isPolling && (
            <span className="flex items-center gap-1.5 text-xs text-primary animate-pulse ml-auto">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Actualizando...
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB: Miniaturas */}
        {activeTab === "miniaturas" && (
          isLoading ? (
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
              <h3 className="text-sm font-semibold text-muted-foreground">No hay miniaturas para este video</h3>
              <p className="text-xs text-muted-foreground/70 mt-1">Las miniaturas se generan durante la fase de Copy</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allDrafts.map((draft) => (
                <ThumbnailCard key={draft.id} draft={draft} onClick={() => setSelectedDraft(draft)} />
              ))}
            </div>
          )
        )}

        {/* TAB: Favoritas */}
        {activeTab === "favoritas" && (
          favoriteDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Star className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-sm font-semibold text-muted-foreground">No hay favoritas</h3>
              <p className="text-xs text-muted-foreground/70 mt-1">Marca miniaturas como favoritas desde el detalle</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteDrafts.map((draft) => (
                <ThumbnailCard key={draft.id} draft={draft} onClick={() => setSelectedDraft(draft)} />
              ))}
            </div>
          )
        )}

        {/* TAB: Portadas */}
        {activeTab === "portadas" && (
          <div className="space-y-8">
            {/* Portada Youtube A/B/C from video */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Portadas Youtube (Video)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(["A", "B", "C"] as const).map((letter) => {
                  const url = letter === "A" ? videoDetail?.portada_a
                    : letter === "B" ? videoDetail?.portada_b
                    : videoDetail?.portada_c;
                  return (
                    <div key={letter} className="glass-card rounded-xl overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        {url ? (
                          <img src={url} alt={`Portada ${letter}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shadow-lg">
                          {letter}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-foreground">Portada Youtube {letter}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {url ? "Imagen cargada" : "Sin imagen"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Portada drafts */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Miniaturas marcadas como Portada ({portadaDrafts.length})
              </h3>
              {portadaDrafts.length === 0 ? (
                <p className="text-sm text-muted-foreground/70">Ninguna miniatura marcada como portada</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {portadaDrafts.map((draft) => (
                    <ThumbnailCard key={draft.id} draft={draft} onClick={() => setSelectedDraft(draft)} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB: Titulos */}
        {activeTab === "titulos" && (
          <div className="max-w-3xl space-y-6">
            {(["A", "B", "C"] as const).map((letter) => {
              const value = letter === "A" ? tituloA : letter === "B" ? tituloB : tituloC;
              const setter = letter === "A" ? setTituloA : letter === "B" ? setTituloB : setTituloC;
              return (
                <div key={letter} className="space-y-2">
                  <label className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {letter}
                    </span>
                    <span className="text-sm font-semibold text-foreground">Titulo Youtube {letter}</span>
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => { setter(e.target.value); setHasTitleChanges(true); }}
                    className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-3 text-base text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    placeholder={`Titulo Youtube ${letter}...`}
                  />
                </div>
              );
            })}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Variaciones Multiples Titulos</label>
              <textarea
                value={variacionesTitulos}
                onChange={(e) => { setVariacionesTitulos(e.target.value); setHasTitleChanges(true); }}
                rows={4}
                className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                placeholder="Variaciones adicionales de titulos..."
              />
            </div>

            {hasTitleChanges && (
              <button
                onClick={handleSaveTitles}
                disabled={isUpdatingVideo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all"
              >
                {isUpdatingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar titulos
              </button>
            )}
          </div>
        )}

        {/* TAB: Comentario */}
        {activeTab === "comentario" && (
          <div className="max-w-3xl space-y-8">
            {/* Comentario Pineado */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Comentario Pineado</h3>
              </div>
              {/* Selected comentarios */}
              {videoDetail?.linkedComentarioPineado && videoDetail.linkedComentarioPineado.length > 0 && (
                <div className="space-y-2">
                  {videoDetail.linkedComentarioPineado.map((c) => (
                    <div key={c.id} className="glass-card rounded-lg p-3 flex items-start gap-3">
                      <Pin className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{c.name || c.id}</p>
                        {c.status && <span className="text-xs text-muted-foreground">{c.status}</span>}
                      </div>
                      <button
                        onClick={() => handleToggleComentario(c.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Available comentarios to select */}
              <div className="flex items-center gap-2 flex-wrap">
                {allComentarios.map((c) => {
                  const isSelected = videoDetail?.comentario_pineado_ids?.includes(c.id);
                  const name = (c.Name as string) || (c.Nombre as string) || c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleToggleComentario(c.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        isSelected
                          ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-amber-400/30"
                      )}
                    >
                      {name}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
                {allComentarios.length === 0 && (
                  <p className="text-xs text-muted-foreground/70">No hay comentarios pineados disponibles</p>
                )}
              </div>
            </section>

            {/* Sponsors */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">Sponsors</h3>
              </div>
              {/* Selected sponsors detail */}
              {videoDetail?.linkedSponsors && videoDetail.linkedSponsors.length > 0 && (
                <div className="space-y-2">
                  {videoDetail.linkedSponsors.map((s) => (
                    <div key={s.id} className="glass-card rounded-lg p-3 flex items-center gap-3">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name || ""} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <Megaphone className="w-4 h-4 text-blue-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{s.name || s.id}</p>
                        {s.status && <span className="text-xs text-muted-foreground">{s.status}</span>}
                      </div>
                      <button
                        onClick={() => handleToggleSponsor(s.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Available sponsors to select */}
              <div className="flex items-center gap-2 flex-wrap">
                {allSponsors.map((s) => {
                  const isSelected = videoDetail?.sponsor_ids?.includes(s.id);
                  const name = (s.Name as string) || (s.Nombre as string) || s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleToggleSponsor(s.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        isSelected
                          ? "bg-blue-400/10 border-blue-400/30 text-blue-400"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-blue-400/30"
                      )}
                    >
                      {name}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
                {allSponsors.length === 0 && (
                  <p className="text-xs text-muted-foreground/70">No hay sponsors disponibles</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <ThumbnailDetail
        draft={selectedDraft}
        open={!!selectedDraft}
        onOpenChange={(open) => {
          if (!open) setSelectedDraft(null);
        }}
        onVariationsTriggered={startPolling}
      />
    </div>
  );
}
