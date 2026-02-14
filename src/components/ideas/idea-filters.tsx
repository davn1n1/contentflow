"use client";

import { Search, Star, RotateCcw, Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeaFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  tipoIdea: string;
  onTipoIdeaChange: (value: string) => void;
  shortLong: string;
  onShortLongChange: (value: string) => void;
  favorita: boolean;
  onFavoritaChange: (value: boolean) => void;
}

const tiposIdea = [
  { value: "", label: "All Types" },
  { value: "Video Youtube", label: "Video Youtube" },
  { value: "URL", label: "URL" },
  { value: "Reel Instagram", label: "Reel Instagram" },
  { value: "Ad Meta", label: "Ad Meta" },
  { value: "Post X", label: "Post X" },
  { value: "Manual", label: "Manual" },
];

const shortLongOptions = [
  { value: "", label: "H / V" },
  { value: "Short", label: "Vertical (Short)" },
  { value: "Long", label: "Horizontal (Long)" },
];

export function IdeaFilters({
  search,
  onSearchChange,
  tipoIdea,
  onTipoIdeaChange,
  shortLong,
  onShortLongChange,
  favorita,
  onFavoritaChange,
}: IdeaFiltersProps) {
  const hasFilters = search || tipoIdea || shortLong || favorita;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Tipo Idea filter */}
      <select
        value={tipoIdea}
        onChange={(e) => onTipoIdeaChange(e.target.value)}
        className="px-3 py-2 bg-muted border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
      >
        {tiposIdea.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Short/Long (Horizontal/Vertical) filter */}
      <select
        value={shortLong}
        onChange={(e) => onShortLongChange(e.target.value)}
        className="px-3 py-2 bg-muted border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
      >
        {shortLongOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

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
            onShortLongChange("");
            onFavoritaChange(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}
