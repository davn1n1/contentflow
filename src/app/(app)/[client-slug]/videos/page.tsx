"use client";

import { useState, useDeferredValue } from "react";
import { useParams } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { useVideos } from "@/lib/hooks/use-videos";
import { VideoFilters } from "@/components/videos/video-filters";
import { VideoTable } from "@/components/videos/video-table";
import { VideoCard } from "@/components/videos/video-card";
import type { Video } from "@/types/database";
import { Plus } from "lucide-react";

export default function VideosPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const { currentAccount } = useAccountStore();
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Debounce search — React defers this value so typing doesn't trigger immediate API calls
  const deferredSearch = useDeferredValue(search);

  const { data: videos = [], isLoading } = useVideos({
    accountId: currentAccount?.id,
    estado: estado || undefined,
    search: deferredSearch || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {videos.length} videos {currentAccount?.name ? `for ${currentAccount.name}` : ""}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          New Video
        </button>
      </div>

      {/* Filters */}
      <VideoFilters
        search={search}
        onSearchChange={setSearch}
        estado={estado}
        onEstadoChange={setEstado}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <VideoTable videos={videos} clientSlug={clientSlug} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} clientSlug={clientSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
