"use client";

import { useState, useMemo, useDeferredValue, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useVideos } from "@/lib/hooks/use-videos";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AllVideoFilters } from "@/components/videos/all-video-filters";
import { AllVideoTable } from "@/components/videos/all-video-table";
import { VideoCard } from "@/components/videos/video-card";
import { VideoCalendar } from "@/components/videos/video-calendar";
import { Trash2, Copy, X as XIcon, AlertTriangle, Loader2 } from "lucide-react";
import type { Video } from "@/types/database";

interface SponsorRecord {
  id: string;
  Name?: string;
}

export default function ListadoReelsPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const { currentAccount } = useAccountStore();
  const { listadoReelsViewMode, setListadoReelsViewMode } = useUIStore();
  const queryClient = useQueryClient();

  // Filter state
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [statusYoutube, setStatusYoutube] = useState("");
  const [sponsor, setSponsor] = useState("");

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deferredSearch = useDeferredValue(search);

  // Fetch all videos
  const { data: allVideos = [], isLoading } = useVideos({
    accountId: currentAccount?.id,
    search: deferredSearch || undefined,
    limit: 500,
  });

  // Pre-filter: only Vertical format
  const videos = useMemo(() => {
    return allVideos.filter((v) => {
      const format = v.horizontalvertical || v.formato;
      return format === "Vertical";
    });
  }, [allVideos]);

  // Fetch sponsors for this account to resolve IDs → names
  const sponsorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const v of videos) {
      if (v.sponsor_ids) {
        for (const id of v.sponsor_ids) ids.add(id);
      }
    }
    return Array.from(ids);
  }, [videos]);

  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors-resolve-reels", sponsorIds.join(",")],
    queryFn: async (): Promise<SponsorRecord[]> => {
      if (sponsorIds.length === 0) return [];
      const res = await fetch(`/api/data/app-data?table=sponsors&ids=${sponsorIds.join(",")}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: sponsorIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const sponsorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sponsors) {
      map[s.id] = s.Name || s.id;
    }
    return map;
  }, [sponsors]);

  // Extract unique filter options from data
  const estadoOptions = useMemo(() => {
    const values = new Set<string>();
    for (const v of videos) {
      if (v.estado) values.add(v.estado);
    }
    return [
      { value: "", label: "Todos" },
      ...Array.from(values).sort().map((v) => ({ value: v, label: v })),
    ];
  }, [videos]);

  const statusYoutubeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const v of videos) {
      const val = v.status_youtube;
      if (val) values.add(val);
    }
    return [
      { value: "", label: "Todos" },
      ...Array.from(values).sort().map((v) => ({ value: v, label: v })),
    ];
  }, [videos]);

  const sponsorOptions = useMemo(() => {
    const uniqueIds = new Set<string>();
    for (const v of videos) {
      if (v.sponsor_ids) {
        for (const id of v.sponsor_ids) uniqueIds.add(id);
      }
    }
    return [
      { value: "", label: "Todos" },
      ...Array.from(uniqueIds).map((id) => ({
        value: id,
        label: sponsorMap[id] || id.substring(0, 8) + "...",
      })),
    ];
  }, [videos, sponsorMap]);

  // Apply client-side filters (AND combination)
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (estado && v.estado !== estado) return false;
      if (statusYoutube) {
        const val = v.status_youtube;
        if (val !== statusYoutube) return false;
      }
      if (sponsor && (!v.sponsor_ids || !v.sponsor_ids.includes(sponsor))) return false;
      return true;
    });
  }, [videos, estado, statusYoutube, sponsor]);

  const hasActiveFilters = estado !== "" || statusYoutube !== "" || sponsor !== "";

  // ── Bulk actions ──

  const bulkDelete = useMutation({
    mutationFn: async (recordIds: string[]) => {
      const res = await fetch("/api/data/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const bulkDuplicate = useMutation({
    mutationFn: async (records: Record<string, unknown>[]) => {
      const res = await fetch("/api/data/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const SKIP_KEYS = new Set([
    "id", "airtable_id", "created_time", "last_modified_time",
    "escenas_ids", "ae_render_ids", "ideas_ids", "voice_dna_ids",
    "intro_ids", "cta_ids", "intro_broll_ids", "cta_broll_ids",
    "draft_publicacion_ids", "sponsor_ids", "comentario_pineado_ids",
    "avatar_set_ids", "persona_ids", "formato_diseno_slides_ids",
    "estilo_musical_ids", "portada_a", "portada_b", "portada_c",
    "logo_account", "logo_fuentes_inspiracion",
    "status_copy", "status_audio", "status_avatares",
    "status_rendering_video", "status_escenas", "status_renders",
    "status_copy_analysis", "status_youtube_publishing",
    "status_edicion_manual", "status_agentes",
    "url_youtube", "url_drive", "url_shotstack_production",
    "yt_video_id", "n_capitulo_podcast",
  ]);

  const KEY_TO_FIELD: Record<string, string> = {
    account_id: "🏢Account",
    titulo: "Titulo Youtube A",
    post_content: "Post Content",
    elevenlabs_text: "ElevenLabs Text",
    horizontalvertical: "Horizontal/Vertical",
    estado: "Estado",
  };

  function handleDelete() {
    const ids = Array.from(selectedIds);
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowDeleteConfirm(false);
      },
    });
  }

  function handleDuplicate() {
    const selected = filteredVideos.filter((v) => selectedIds.has(v.id));
    const records = selected.map((v) => {
      const fields: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(v)) {
        if (SKIP_KEYS.has(key) || val === null || val === undefined) continue;
        const fieldName = KEY_TO_FIELD[key];
        if (!fieldName) continue;
        if (key === "account_id") {
          fields[fieldName] = [val];
        } else if (key === "titulo") {
          fields[fieldName] = `Copia de ${val}`;
        } else {
          fields[fieldName] = val;
        }
      }
      return fields;
    });
    bulkDuplicate.mutate(records, {
      onSuccess: () => {
        setSelectedIds(new Set());
      },
    });
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredVideos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVideos.map((v) => v.id)));
    }
  }

  const handleVideoDateChange = useCallback(async (videoId: string, newDate: string) => {
    queryClient.setQueryData<Video[]>(
      ["videos", currentAccount?.id, undefined, deferredSearch || undefined, 500],
      (old) => old?.map((v) => v.id === videoId ? { ...v, scheduled_date: newDate } : v)
    );

    try {
      const res = await fetch("/api/data/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: videoId,
          fields: { "Scheduled Date": newDate },
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    }
  }, [queryClient, currentAccount?.id, deferredSearch]);

  function handleReset() {
    setEstado("");
    setStatusYoutube("");
    setSponsor("");
    setSearch("");
  }

  function handleViewModeChange(mode: "table" | "grid" | "calendar") {
    if (mode !== "table" && editMode) {
      setEditMode(false);
      setSelectedIds(new Set());
    }
    setListadoReelsViewMode(mode);
  }

  function handleEditModeChange(active: boolean) {
    setEditMode(active);
    if (!active) setSelectedIds(new Set());
  }

  const isBusy = bulkDelete.isPending || bulkDuplicate.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listado Reels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredVideos.length} de {videos.length} reels (Vertical)
          {currentAccount?.name ? ` · ${currentAccount.name}` : ""}
        </p>
      </div>

      {/* Filters */}
      <AllVideoFilters
        search={search}
        onSearchChange={setSearch}
        estado={estado}
        onEstadoChange={setEstado}
        statusYoutube={statusYoutube}
        onStatusYoutubeChange={setStatusYoutube}
        sponsor={sponsor}
        onSponsorChange={setSponsor}
        viewMode={listadoReelsViewMode}
        onViewModeChange={handleViewModeChange}
        estadoOptions={estadoOptions}
        statusYoutubeOptions={statusYoutubeOptions}
        sponsorOptions={sponsorOptions}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
        editMode={editMode}
        onEditModeChange={handleEditModeChange}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : listadoReelsViewMode === "table" ? (
        <AllVideoTable
          videos={filteredVideos}
          clientSlug={clientSlug}
          sponsorMap={sponsorMap}
          editMode={editMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectId}
          onToggleAll={toggleSelectAll}
        />
      ) : listadoReelsViewMode === "calendar" ? (
        <VideoCalendar videos={filteredVideos} clientSlug={clientSlug} onVideoDateChange={handleVideoDateChange} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} clientSlug={clientSlug} />
          ))}
          {filteredVideos.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters ? "No se encontraron reels con estos filtros" : "No hay reels"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Floating Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-background border border-border shadow-2xl">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} seleccionados</span>

          <button
            onClick={handleDuplicate}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {bulkDuplicate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            Duplicar
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            {bulkDelete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Eliminar
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirmar eliminación</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Se eliminarán <span className="font-bold text-foreground">{selectedIds.size}</span> registros permanentemente. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={bulkDelete.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {bulkDelete.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
