"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { useParams } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useVideos } from "@/lib/hooks/use-videos";
import { useQuery } from "@tanstack/react-query";
import { AllVideoFilters } from "@/components/videos/all-video-filters";
import { VideoTable } from "@/components/videos/video-table";
import { VideoCard } from "@/components/videos/video-card";
import { VideoCalendar } from "@/components/videos/video-calendar";
import type { Video } from "@/types/database";

interface SponsorRecord {
  id: string;
  Name?: string;
}

export default function AllVideosPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const { currentAccount } = useAccountStore();
  const { allVideosViewMode, setAllVideosViewMode } = useUIStore();

  // Filter state
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [statusYoutube, setStatusYoutube] = useState("");
  const [sponsor, setSponsor] = useState("");

  const deferredSearch = useDeferredValue(search);

  // Fetch all videos (no estado filter at API level — we filter client-side for multi-filter)
  const { data: videos = [], isLoading } = useVideos({
    accountId: currentAccount?.id,
    search: deferredSearch || undefined,
    limit: 500,
  });

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
    queryKey: ["sponsors-resolve", sponsorIds.join(",")],
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

  function handleReset() {
    setEstado("");
    setStatusYoutube("");
    setSponsor("");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listado Todos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredVideos.length} de {videos.length} videos
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
        viewMode={allVideosViewMode}
        onViewModeChange={setAllVideosViewMode}
        estadoOptions={estadoOptions}
        statusYoutubeOptions={statusYoutubeOptions}
        sponsorOptions={sponsorOptions}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : allVideosViewMode === "table" ? (
        <VideoTable videos={filteredVideos} clientSlug={clientSlug} />
      ) : allVideosViewMode === "calendar" ? (
        <VideoCalendar videos={filteredVideos} clientSlug={clientSlug} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} clientSlug={clientSlug} />
          ))}
          {filteredVideos.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters ? "No se encontraron videos con estos filtros" : "No hay videos"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
