"use client";

import { Search, Star, RotateCcw, BookOpen, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Fuente {
  id: string;
  Name?: string;
  Nombre?: string;
  [key: string]: unknown;
}

interface IdeaFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  tipoIdea: string;
  onTipoIdeaChange: (value: string) => void;
  fuenteId: string;
  onFuenteIdChange: (value: string) => void;
  favorita: boolean;
  onFavoritaChange: (value: boolean) => void;
  fuentes: Fuente[];
}

const tiposIdea = [
  { value: "Video Youtube", label: "Video Youtube" },
  { value: "URL", label: "URL" },
  { value: "Reel Instagram", label: "Reel Instagram" },
  { value: "Ad Meta", label: "Ad Meta" },
  { value: "Post X", label: "Post X" },
  { value: "Manual", label: "Manual" },
];

export function IdeaFilters({
  search,
  onSearchChange,
  tipoIdea,
  onTipoIdeaChange,
  fuenteId,
  onFuenteIdChange,
  favorita,
  onFavoritaChange,
  fuentes,
}: IdeaFiltersProps) {
  const hasFilters = search || tipoIdea || fuenteId || favorita;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Search + Fuente + Favorita + Reset */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar ideas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        {/* Fuentes Inspiracion filter */}
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={fuenteId}
            onChange={(e) => onFuenteIdChange(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
          >
            <option value="">Todas las Fuentes</option>
            {fuentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.Name || f.Nombre || f.id}
              </option>
            ))}
          </select>
        </div>

        {/* Favorita toggle */}
        <button
          onClick={() => onFavoritaChange(!favorita)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
            favorita
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : "bg-muted text-muted-foreground border-border hover:text-foreground"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", favorita && "fill-yellow-400")} />
          Favorita
        </button>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={() => {
              onSearchChange("");
              onTipoIdeaChange("");
              onFuenteIdChange("");
              onFavoritaChange(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Row 2: Tipo Idea toggle buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        {tiposIdea.map((t) => (
          <button
            key={t.value}
            onClick={() => onTipoIdeaChange(tipoIdea === t.value ? "" : t.value)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
              tipoIdea === t.value
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
