"use client";

import { Search, LayoutGrid, LayoutList, Calendar, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export type ViewMode = "table" | "grid" | "calendar";

interface FilterOption {
  value: string;
  label: string;
}

interface AllVideoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  estado: string;
  onEstadoChange: (value: string) => void;
  statusYoutube: string;
  onStatusYoutubeChange: (value: string) => void;
  sponsor: string;
  onSponsorChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  estadoOptions: FilterOption[];
  statusYoutubeOptions: FilterOption[];
  sponsorOptions: FilterOption[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || label;
  const isActive = value !== "";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
          isActive
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-muted text-muted-foreground border-border hover:text-foreground hover:border-border/80"
        )}
      >
        <span className="truncate max-w-[120px]">{isActive ? selectedLabel : label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs transition-colors",
                value === option.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AllVideoFilters({
  search,
  onSearchChange,
  estado,
  onEstadoChange,
  statusYoutube,
  onStatusYoutubeChange,
  sponsor,
  onSponsorChange,
  viewMode,
  onViewModeChange,
  estadoOptions,
  statusYoutubeOptions,
  sponsorOptions,
  onReset,
  hasActiveFilters,
}: AllVideoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar videos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Estado"
          value={estado}
          options={estadoOptions}
          onChange={onEstadoChange}
        />

        <FilterDropdown
          label="Status YouTube..."
          value={statusYoutube}
          options={statusYoutubeOptions}
          onChange={onStatusYoutubeChange}
        />

        <FilterDropdown
          label="Sponsors"
          value={sponsor}
          options={sponsorOptions}
          onChange={onSponsorChange}
        />

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View mode toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => onViewModeChange("table")}
          title="Lista"
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
          title="Galería"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange("calendar")}
          title="Calendario"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            viewMode === "calendar"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
