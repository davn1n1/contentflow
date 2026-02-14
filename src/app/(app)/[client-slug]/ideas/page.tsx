"use client";

import { useState, useCallback, useMemo } from "react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useIdeas } from "@/lib/hooks/use-ideas";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeaFilters } from "@/components/ideas/idea-filters";
import { IdeaDetailDrawer } from "@/components/ideas/idea-detail-drawer";
import { Lightbulb, Loader2 } from "lucide-react";
import type { Idea } from "@/types/database";

export default function IdeasPage() {
  const { currentAccount } = useAccountStore();
  const [search, setSearch] = useState("");
  const [tipoIdea, setTipoIdea] = useState("");
  const [shortLong, setShortLong] = useState("");
  const [favorita, setFavorita] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const { data: ideas, isLoading, error } = useIdeas({
    accountId: currentAccount?.id || undefined,
    tipoIdea: tipoIdea || undefined,
    search: search || undefined,
    favorita: favorita || undefined,
  });

  const filteredIdeas = useMemo(() => {
    if (!ideas || !shortLong) return ideas;
    return ideas.filter((idea) => idea.short_long === shortLong);
  }, [ideas, shortLong]);

  const handleCloseDrawer = useCallback(() => setSelectedIdea(null), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Ideas & Research
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Content ideas for {currentAccount?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {filteredIdeas && (
            <span className="px-2 py-1 bg-muted rounded-md font-medium">
              {filteredIdeas.length} ideas
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <IdeaFilters
        search={search}
        onSearchChange={setSearch}
        tipoIdea={tipoIdea}
        onTipoIdeaChange={setTipoIdea}
        shortLong={shortLong}
        onShortLongChange={setShortLong}
        favorita={favorita}
        onFavoritaChange={setFavorita}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading ideas...
          </span>
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-sm text-destructive">
            Failed to load ideas. Please try again.
          </p>
        </div>
      ) : filteredIdeas && filteredIdeas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => setSelectedIdea(idea)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">
            No ideas found
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {search || tipoIdea || shortLong || favorita
              ? "Try adjusting your filters to see more ideas."
              : "Ideas from YouTube, X, and Meta will appear here when collected."}
          </p>
        </div>
      )}

      {/* Detail Drawer */}
      <IdeaDetailDrawer idea={selectedIdea} onClose={handleCloseDrawer} />
    </div>
  );
}
