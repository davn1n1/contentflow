"use client";

import { useState, useDeferredValue } from "react";
import { useParams } from "next/navigation";
import { useAccountStore } from "@/lib/stores/account-store";
import { useVideos } from "@/lib/hooks/use-videos";
import { ThumbnailCard } from "@/components/thumbnails/thumbnail-card";
import { ThumbnailDetail } from "@/components/thumbnails/thumbnail-detail";
import type { Video } from "@/types/database";
import { Search, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ThumbnailFilter = "all" | "with-thumbnail" | "without-thumbnail";

const FILTERS: { key: ThumbnailFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "with-thumbnail", label: "Con miniatura" },
  { key: "without-thumbnail", label: "Sin miniatura" },
];

export default function ThumbnailsPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const { currentAccount } = useAccountStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ThumbnailFilter>("all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const deferredSearch = useDeferredValue(search);

  const { data: videos = [], isLoading } = useVideos({
    accountId: currentAccount?.id,
    search: deferredSearch || undefined,
  });

  const filteredVideos = videos.filter((video) => {
    if (filter === "with-thumbnail") return !!video.portada_a;
    if (filter === "without-thumbnail") return !video.portada_a && video.status_copy;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Miniaturas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredVideos.length} videos{" "}
            {currentAccount?.name ? `de ${currentAccount.name}` : ""}
          </p>
        </div>
        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>

        {/* Segmented filter */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ImageIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-sm font-semibold text-muted-foreground">
            {search || filter !== "all"
              ? "No se encontraron videos con estos filtros"
              : "No hay videos disponibles"}
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {filter === "without-thumbnail"
              ? "Todos los videos con copy tienen miniatura"
              : "Crea un video para empezar"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <ThumbnailCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <ThumbnailDetail
        video={selectedVideo}
        open={!!selectedVideo}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(null);
        }}
      />
    </div>
  );
}
