"use client";

import { Search, Filter, LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  estado: string;
  onEstadoChange: (value: string) => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
}

const estados = [
  { value: "", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "In Progress", label: "In Progress" },
  { value: "Published", label: "Published" },
];

export function VideoFilters({
  search,
  onSearchChange,
  estado,
  onEstadoChange,
  viewMode,
  onViewModeChange,
}: VideoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {estados.map((e) => (
          <button
            key={e.value}
            onClick={() => onEstadoChange(e.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              estado === e.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("table")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            viewMode === "table"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutList className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
