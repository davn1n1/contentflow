"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDraftPublicacion } from "@/lib/hooks/use-draft-publicacion";
import { useUpdateVideo } from "@/lib/hooks/use-update-video";
import { useAppData } from "@/lib/hooks/use-app-data";
import { useAccountStore } from "@/lib/stores/account-store";
import { ThumbnailCard } from "@/components/thumbnails/thumbnail-card";
import { ThumbnailDetail } from "@/components/thumbnails/thumbnail-detail";
import type { VideoWithScenes } from "@/lib/hooks/use-video-detail";
import type { DraftPublicacion } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  ImageIcon, Star, RefreshCw, Award, Type, MessageSquare,
  Save, Loader2, Megaphone, Pin, Check, ChevronDown, X, AlertCircle,
} from "lucide-react";

const TABS = [
  { key: "miniaturas", label: "Miniaturas", icon: ImageIcon },
  { key: "favoritas", label: "Favoritas", icon: Star },
  { key: "portadas", label: "Portadas", icon: Award },
  { key: "titulos", label: "Titulos", icon: Type },
  { key: "comentario", label: "Comentario", icon: MessageSquare },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MiniaturaTabPanel({ video }: { video: VideoWithScenes }) {
  const queryClient = useQueryClient();
  const accountId = useAccountStore((s) => s.currentAccount?.id);
  const [activeTab, setActiveTab] = useState<TabKey>("miniaturas");

  const { data: drafts = [], isLoading } = useDraftPublicacion(video.draft_publicacion_ids);
  const { mutate: updateVideo, isPending: isUpdatingVideo, error: updateError } = useUpdateVideo();

  const {
    data: allSponsors = [],
    isLoading: isLoadingSponsors,
    error: sponsorsError,
  } = useAppData({ table: "sponsors", accountId, enabled: true });
  const {
    data: allComentarios = [],
    isLoading: isLoadingComentarios,
    error: comentariosError,
  } = useAppData({ table: "comentario-pineado", accountId, enabled: true });

  const [selectedDraft, setSelectedDraft] = useState<DraftPublicacion | null>(null);
  const [expandedComentarioId, setExpandedComentarioId] = useState<string | null>(null);
  const [expandedSponsorId, setExpandedSponsorId] = useState<string | null>(null);

  // Editable video fields
  const [tituloA, setTituloA] = useState("");
  const [tituloB, setTituloB] = useState("");
  const [tituloC, setTituloC] = useState("");
  const [variacionesTitulos, setVariacionesTitulos] = useState("");
  const [hasTitleChanges, setHasTitleChanges] = useState(false);
  const variacionesRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeVariaciones = useCallback(() => {
    const el = variacionesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (video) {
      setTituloA(video.titulo_a || "");
      setTituloB(video.titulo_b || "");
      setTituloC(video.titulo_c || "");
      setVariacionesTitulos(video.variaciones_multiples_titulos || "");
      setHasTitleChanges(false);
    }
  }, [video]);

  useEffect(() => {
    if (activeTab === "titulos") {
      requestAnimationFrame(autoResizeVariaciones);
    }
  }, [variacionesTitulos, activeTab, autoResizeVariaciones]);

  const handleSaveTitles = () => {
    updateVideo({
      id: video.id,
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
    const current = video.sponsor_ids || [];
    const newIds = current.includes(sponsorId)
      ? current.filter((id) => id !== sponsorId)
      : [...current, sponsorId];
    updateVideo({ id: video.id, fields: { Sponsors: newIds } });
  };

  const handleToggleComentario = (comentarioId: string) => {
    const current = video.comentario_pineado_ids || [];
    const newIds = current.includes(comentarioId)
      ? current.filter((id) => id !== comentarioId)
      : [...current, comentarioId];
    updateVideo({ id: video.id, fields: { "Comentario Pineado": newIds } });
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
  const portadaDrafts = allDrafts
    .filter((d) => d.portada)
    .sort((a, b) => {
      const order = { A: 0, B: 1, C: 2 } as Record<string, number>;
      const oa = order[a.portada_youtube_abc || ""] ?? 99;
      const ob = order[b.portada_youtube_abc || ""] ?? 99;
      return oa - ob;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab navigation */}
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
                  "flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "border-primary/60 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", tab.key === "favoritas" && activeTab === tab.key && "fill-primary")} />
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
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Portadas Youtube (Video)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(["A", "B", "C"] as const).map((letter) => {
                  const url = letter === "A" ? video.portada_a
                    : letter === "B" ? video.portada_b
                    : video.portada_c;
                  const titulo = letter === "A" ? video.titulo_a
                    : letter === "B" ? video.titulo_b
                    : video.titulo_c;
                  return (
                    <div key={letter} className="glass-card rounded-xl overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
                        <p className="text-sm font-medium text-foreground">{titulo || `Portada Youtube ${letter}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {url ? "Imagen cargada" : "Sin imagen"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

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
          <div className="max-w-3xl space-y-3">
            {(["A", "B", "C"] as const).map((letter) => {
              const value = letter === "A" ? tituloA : letter === "B" ? tituloB : tituloC;
              const setter = letter === "A" ? setTituloA : letter === "B" ? setTituloB : setTituloC;
              return (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {letter}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => { setter(e.target.value); setHasTitleChanges(true); }}
                    className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    placeholder={`Titulo Youtube ${letter}...`}
                  />
                </div>
              );
            })}

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variaciones Multiples Titulos</label>
              <textarea
                ref={variacionesRef}
                value={variacionesTitulos}
                onChange={(e) => { setVariacionesTitulos(e.target.value); setHasTitleChanges(true); autoResizeVariaciones(); }}
                className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none overflow-hidden"
                style={{ minHeight: "80px" }}
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
                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded-full">
                  {video.comentario_pineado_ids?.length || 0} asignados
                </span>
                {isUpdatingVideo && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                )}
              </div>

              {isLoadingComentarios && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Cargando comentarios...
                </div>
              )}
              {comentariosError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> Error cargando: {(comentariosError as Error).message}
                </div>
              )}
              {updateError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> Error al guardar: {(updateError as Error).message}
                </div>
              )}

              {!isLoadingComentarios && (
                <div className="flex items-center gap-2 flex-wrap">
                  {allComentarios.map((c) => {
                    const isSelected = video.comentario_pineado_ids?.includes(c.id);
                    const name = (c.Name as string) || (c.Nombre as string) || c.id;
                    return (
                      <div key={c.id} className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleToggleComentario(c.id)}
                          disabled={isUpdatingVideo}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                            isUpdatingVideo && "opacity-50 cursor-wait",
                            isSelected
                              ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:border-amber-400/30 hover:text-amber-300"
                          )}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                          {name}
                        </button>
                        {isSelected && (
                          <button
                            onClick={() => setExpandedComentarioId(expandedComentarioId === c.id ? null : c.id)}
                            className="p-1 text-amber-400/60 hover:text-amber-400 transition-colors"
                            title="Ver detalle"
                          >
                            <ChevronDown className={cn("w-3 h-3 transition-transform", expandedComentarioId === c.id && "rotate-180")} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {allComentarios.length === 0 && !comentariosError && (
                    <p className="text-xs text-muted-foreground/70">
                      No hay comentarios pineados disponibles
                      {!accountId && " (sin cuenta seleccionada)"}
                    </p>
                  )}
                </div>
              )}

              {expandedComentarioId && (() => {
                const fullData = allComentarios.find((c) => c.id === expandedComentarioId);
                const linked = video.linkedComentarioPineado?.find((c) => c.id === expandedComentarioId);
                const name = fullData ? ((fullData.Name as string) || (fullData.Nombre as string)) : linked?.name;
                return (
                  <div className="glass-card rounded-xl p-4 border border-amber-400/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Pin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <h4 className="text-sm font-semibold text-foreground">{name || expandedComentarioId}</h4>
                      </div>
                      <button onClick={() => setExpandedComentarioId(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {fullData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(fullData)
                          .filter(([key]) => !["id", "createdTime"].includes(key))
                          .map(([key, val]) => {
                            if (val === null || val === undefined || val === "") return null;
                            const displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                            if (displayVal.length > 500) return null;
                            return (
                              <div key={key} className="text-xs">
                                <span className="text-muted-foreground">{key}: </span>
                                <span className="text-foreground">{displayVal}</span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>

            {/* Sponsors */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">Sponsors</h3>
                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded-full">
                  {video.sponsor_ids?.length || 0} asignados
                </span>
                {isUpdatingVideo && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                )}
              </div>

              {isLoadingSponsors && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Cargando sponsors...
                </div>
              )}
              {sponsorsError && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> Error cargando: {(sponsorsError as Error).message}
                </div>
              )}

              {!isLoadingSponsors && (
                <div className="flex items-center gap-2 flex-wrap">
                  {allSponsors.map((s) => {
                    const isSelected = video.sponsor_ids?.includes(s.id);
                    const name = (s.Name as string) || (s.Nombre as string) || s.id;
                    return (
                      <div key={s.id} className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleToggleSponsor(s.id)}
                          disabled={isUpdatingVideo}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                            isUpdatingVideo && "opacity-50 cursor-wait",
                            isSelected
                              ? "bg-blue-400/10 border-blue-400/30 text-blue-400"
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:border-blue-400/30 hover:text-blue-300"
                          )}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}
                          {name}
                        </button>
                        {isSelected && (
                          <button
                            onClick={() => setExpandedSponsorId(expandedSponsorId === s.id ? null : s.id)}
                            className="p-1 text-blue-400/60 hover:text-blue-400 transition-colors"
                            title="Ver detalle"
                          >
                            <ChevronDown className={cn("w-3 h-3 transition-transform", expandedSponsorId === s.id && "rotate-180")} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {allSponsors.length === 0 && !sponsorsError && (
                    <p className="text-xs text-muted-foreground/70">
                      No hay sponsors disponibles
                      {!accountId && " (sin cuenta seleccionada)"}
                    </p>
                  )}
                </div>
              )}

              {expandedSponsorId && (() => {
                const fullData = allSponsors.find((s) => s.id === expandedSponsorId);
                const linked = video.linkedSponsors?.find((s) => s.id === expandedSponsorId);
                const name = fullData ? ((fullData.Name as string) || (fullData.Nombre as string)) : linked?.name;
                const imageUrl = linked?.image_url || null;
                return (
                  <div className="glass-card rounded-xl p-4 border border-blue-400/20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={name || ""} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <Megaphone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                        <h4 className="text-sm font-semibold text-foreground">{name || expandedSponsorId}</h4>
                      </div>
                      <button onClick={() => setExpandedSponsorId(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {fullData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(fullData)
                          .filter(([key]) => !["id", "createdTime"].includes(key))
                          .map(([key, val]) => {
                            if (val === null || val === undefined || val === "") return null;
                            const displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                            if (displayVal.length > 500) return null;
                            return (
                              <div key={key} className="text-xs">
                                <span className="text-muted-foreground">{key}: </span>
                                <span className="text-foreground">{displayVal}</span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })()}
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
