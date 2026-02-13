"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/lib/stores/account-store";

interface PickerRecord {
  id: string;
  name: string | null;
  image_url: string | null;
  status: string | null;
}

interface LinkedRecordPickerProps {
  /** Label shown above the picker */
  label: string;
  /** Airtable table key for app-data API (e.g. "ctas", "broll", "avatares-set", "persona") */
  table: string;
  /** Currently selected records */
  selected: PickerRecord[];
  /** Callback when selection changes — receives the new full list of selected IDs */
  onSelectionChange: (ids: string[]) => void;
  /** Whether multiple records can be selected (default: true) */
  multiple?: boolean;
  /** Show image thumbnails in search results and selection (default: true) */
  showImages?: boolean;
  /** Color accent */
  color?: "emerald" | "blue" | "violet" | "cyan";
  /** Whether to show a large image preview for selected items */
  largePreview?: boolean;
  /** Saving state */
  isSaving?: boolean;
  /** Extra Airtable filter formula (e.g. "{CTA/Intro}='Intro'") */
  filterFormula?: string;
}

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function LinkedRecordPicker({
  label,
  table,
  selected,
  onSelectionChange,
  multiple = true,
  showImages = true,
  color = "emerald",
  largePreview = false,
  isSaving = false,
  filterFormula,
}: LinkedRecordPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PickerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentAccount } = useAccountStore();

  // Optimistic local state: tracks removed/added IDs before server confirms
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [optimisticAdded, setOptimisticAdded] = useState<PickerRecord[]>([]);

  // Reset optimistic state when props change (server confirmed the change)
  const selectedKey = selected.map((r) => r.id).join(",");
  useEffect(() => {
    setRemovedIds(new Set());
    setOptimisticAdded([]);
  }, [selectedKey]);

  // Compute visible items: props - removed + added
  const visibleSelected = [
    ...selected.filter((r) => !removedIds.has(r.id)),
    ...optimisticAdded.filter((r) => !selected.some((s) => s.id === r.id)),
  ];

  const debouncedSearch = useDebounce(search, 300);

  const colorStyles = {
    emerald: {
      badge: "bg-emerald-500/15 text-emerald-400",
      border: "border-emerald-500/20",
      ring: "ring-emerald-500/30",
      hover: "hover:bg-emerald-500/10",
    },
    blue: {
      badge: "bg-blue-500/15 text-blue-400",
      border: "border-blue-500/20",
      ring: "ring-blue-500/30",
      hover: "hover:bg-blue-500/10",
    },
    violet: {
      badge: "bg-violet-500/15 text-violet-400",
      border: "border-violet-500/20",
      ring: "ring-violet-500/30",
      hover: "hover:bg-violet-500/10",
    },
    cyan: {
      badge: "bg-cyan-500/15 text-cyan-400",
      border: "border-cyan-500/20",
      ring: "ring-cyan-500/30",
      hover: "hover:bg-cyan-500/10",
    },
  };

  const styles = colorStyles[color];

  // Fetch search results
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    async function fetchResults() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ table, limit: "20" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (currentAccount?.airtable_id) params.set("accountId", currentAccount.airtable_id);
        if (filterFormula) params.set("filter", filterFormula);

        const res = await fetch(`/api/data/app-data?${params}`, { signal: controller.signal });
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any[] = await res.json();
          const mapped: PickerRecord[] = data.map((r) => ({
            id: r.id,
            name: findTextField(r),
            image_url: findAttachmentUrl(r),
            status: r["Status"] || null,
          }));
          setResults(mapped);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          // Search failed silently
        }
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
    return () => controller.abort();
  }, [isOpen, debouncedSearch, table, currentAccount?.airtable_id, filterFormula]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleRemove = useCallback(
    (id: string) => {
      // Optimistic: immediately hide the item
      setRemovedIds((prev) => new Set([...prev, id]));
      // Compute new IDs list excluding removed
      const newIds = selected.filter((r) => r.id !== id).map((r) => r.id);
      onSelectionChange(newIds);
    },
    [selected, onSelectionChange]
  );

  const handleSelect = useCallback(
    (record: PickerRecord) => {
      const allVisible = visibleSelected;
      if (allVisible.some((r) => r.id === record.id)) return;

      // Optimistic: immediately show the new item
      if (multiple) {
        setOptimisticAdded((prev) => [...prev, record]);
        onSelectionChange([...selected.map((r) => r.id), record.id]);
      } else {
        // Single select: replace everything
        setRemovedIds(new Set(selected.map((r) => r.id)));
        setOptimisticAdded([record]);
        onSelectionChange([record.id]);
      }
      setIsOpen(false);
      setSearch("");
    },
    [selected, visibleSelected, multiple, onSelectionChange]
  );

  const selectedIds = new Set(visibleSelected.map((r) => r.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded", styles.badge)}>
          {label}
        </span>
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      {/* Selected items */}
      <div className="flex flex-wrap gap-2">
        {visibleSelected.map((rec) => (
          <div
            key={rec.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border transition-all group",
              styles.border,
              largePreview ? "flex-col items-start p-0 overflow-hidden w-full" : "px-2.5 py-1.5 bg-card"
            )}
          >
            {largePreview && rec.image_url && (
              <div className="w-full h-28 overflow-hidden bg-muted relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rec.image_url} alt={rec.name || ""} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemove(rec.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  title="Quitar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!largePreview && showImages && rec.image_url && (
              <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rec.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={cn("min-w-0 flex-1", largePreview ? "px-3 py-2" : "")}>
              <p className={cn("font-medium truncate", largePreview ? "text-sm" : "text-xs")}>{rec.name || rec.id}</p>
              {rec.status && <p className="text-[10px] text-muted-foreground">{rec.status}</p>}
            </div>
            {!largePreview && (
              <button
                onClick={() => handleRemove(rec.id)}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Quitar"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add / Change button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs font-medium transition-colors",
            "text-muted-foreground hover:text-foreground hover:border-foreground/30",
            styles.hover
          )}
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
          {visibleSelected.length > 0 ? "Cambiar" : "Seleccionar"}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 max-h-80 rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
            />
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-60">
            {results.length === 0 && !loading && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                {debouncedSearch ? "Sin resultados" : "Cargando..."}
              </div>
            )}
            {results.map((rec) => {
              const isSelected = selectedIds.has(rec.id);
              return (
                <button
                  key={rec.id}
                  onClick={() => !isSelected && handleSelect(rec)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-primary/5 opacity-50 cursor-default"
                      : "hover:bg-muted/60 cursor-pointer"
                  )}
                >
                  {showImages && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {rec.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rec.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rec.name || rec.id}</p>
                    {rec.status && (
                      <p className="text-[10px] text-muted-foreground">{rec.status}</p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-primary font-medium">Seleccionado</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers (duplicated from use-video-detail for client-side use) ───

function extractAttachmentValue(val: unknown): string | null {
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "url" in val[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = val[0] as any;
    return item?.thumbnails?.large?.url || item?.url || null;
  }
  return null;
}

function findAttachmentUrl(data: Record<string, unknown>): string | null {
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "createdTime") continue;
    const url = extractAttachmentValue(val);
    if (url) return url;
  }
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "createdTime") continue;
    if (typeof val === "string" && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)/i.test(val)) {
      return val;
    }
  }
  return null;
}

function findTextField(data: Record<string, unknown>): string | null {
  for (const key of ["Name", "Nombre", "Titulo", "Title"]) {
    if (typeof data[key] === "string" && data[key]) return data[key] as string;
  }
  return null;
}
