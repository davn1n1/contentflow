"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Loader2, ImageOff, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/lib/stores/account-store";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";

interface PickerRecord {
  id: string;
  name: string | null;
  image_url: string | null;
  status: string | null;
}

/** A single client-side filter condition: record[field] must match one of values */
export interface ClientFilter {
  field: string;
  values: (string | boolean | number)[];
}

interface LinkedRecordPickerProps {
  label: string;
  table: string;
  selected: PickerRecord[];
  onSelectionChange: (ids: string[]) => void;
  multiple?: boolean;
  showImages?: boolean;
  color?: "emerald" | "blue" | "violet" | "cyan";
  largePreview?: boolean;
  isSaving?: boolean;
  filterFormula?: string;
  clientFilters?: ClientFilter[];
}

// ─── Debounce hook ───────────────────────────────────
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Filter helpers ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldCaseInsensitive(record: Record<string, any>, field: string): unknown {
  if (field in record) return record[field];
  const lower = field.toLowerCase();
  for (const key of Object.keys(record)) {
    if (key.toLowerCase() === lower) return record[key];
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchesFilters(record: Record<string, any>, filters: ClientFilter[]): boolean {
  return filters.every(({ field, values }) => {
    const val = getFieldCaseInsensitive(record, field);
    if (val === undefined || val === null) return false;
    if (typeof val === "boolean") {
      return values.some((v) => {
        if (typeof v === "boolean") return v === val;
        if (typeof v === "string") return v.toLowerCase() === String(val).toLowerCase();
        return false;
      });
    }
    if (typeof val === "number") return values.includes(val);
    if (typeof val === "string") {
      const lower = val.toLowerCase();
      return values.some((v) => String(v).toLowerCase() === lower);
    }
    if (Array.isArray(val)) {
      return val.some((item) => {
        const itemLower = String(item).toLowerCase();
        return values.some((v) => String(v).toLowerCase() === itemLower);
      });
    }
    return false;
  });
}

// ─── Color styles ────────────────────────────────────
const colorStyles = {
  emerald: { badge: "bg-emerald-500/15 text-emerald-400", border: "border-emerald-500/20" },
  blue: { badge: "bg-blue-500/15 text-blue-400", border: "border-blue-500/20" },
  violet: { badge: "bg-violet-500/15 text-violet-400", border: "border-violet-500/20" },
  cyan: { badge: "bg-cyan-500/15 text-cyan-400", border: "border-cyan-500/20" },
};

// ─── Main Component ──────────────────────────────────
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
  clientFilters,
}: LinkedRecordPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PickerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentAccount } = useAccountStore();

  // Optimistic state
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [optimisticAdded, setOptimisticAdded] = useState<PickerRecord[]>([]);

  const selectedKey = selected.map((r) => r.id).join(",");
  useEffect(() => {
    if (optimisticAdded.length === 0 && removedIds.size === 0) return;
    const serverHasAdded = optimisticAdded.every((a) => selected.some((s) => s.id === a.id));
    const serverRemovedAll = [...removedIds].every((rid) => !selected.some((s) => s.id === rid));
    if (serverHasAdded && serverRemovedAll) {
      setRemovedIds(new Set());
      setOptimisticAdded([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  let visibleSelected = [
    ...selected.filter((r) => !removedIds.has(r.id)),
    ...optimisticAdded.filter((r) => !selected.some((s) => s.id === r.id)),
  ];
  if (!multiple && visibleSelected.length > 1) {
    visibleSelected = [visibleSelected[visibleSelected.length - 1]];
  }

  const debouncedSearch = useDebounce(search, 300);
  const clientFiltersKey = clientFilters ? JSON.stringify(clientFilters) : "";
  const styles = colorStyles[color];

  // Fetch results when popover opens or search changes
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    async function fetchResults() {
      setLoading(true);
      try {
        const hasClientFilters = clientFilters && clientFilters.length > 0;
        const fetchLimit = hasClientFilters ? "200" : "20";
        const params = new URLSearchParams({ table, limit: fetchLimit });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (currentAccount?.airtable_id) params.set("accountId", currentAccount.airtable_id);
        if (filterFormula && !hasClientFilters) params.set("filter", filterFormula);

        const res = await fetch(`/api/data/app-data?${params}`, { signal: controller.signal });
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let data: any[] = await res.json();
          if (hasClientFilters) {
            data = data.filter((r) => matchesFilters(r, clientFilters));
          }
          setResults(data.map((r) => ({
            id: r.id,
            name: findTextField(r),
            image_url: findAttachmentUrl(r),
            status: r["Status"] || null,
          })));
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") { /* silent */ }
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedSearch, table, currentAccount?.airtable_id, filterFormula, clientFiltersKey]);

  const handleRemove = useCallback(
    (id: string) => {
      setRemovedIds((prev) => new Set([...prev, id]));
      onSelectionChange(selected.filter((r) => r.id !== id).map((r) => r.id));
    },
    [selected, onSelectionChange]
  );

  const handleSelect = useCallback(
    (record: PickerRecord) => {
      const isAlreadySelected = visibleSelected.some((r) => r.id === record.id);

      if (isAlreadySelected) {
        // Deselect
        handleRemove(record.id);
        return;
      }

      if (multiple) {
        setOptimisticAdded((prev) => [...prev, record]);
        onSelectionChange([...selected.map((r) => r.id), record.id]);
      } else {
        setRemovedIds(new Set(selected.map((r) => r.id)));
        setOptimisticAdded([record]);
        onSelectionChange([record.id]);
        setOpen(false);
      }
      setSearch("");
    },
    [selected, visibleSelected, multiple, onSelectionChange, handleRemove]
  );

  const selectedIds = new Set(visibleSelected.map((r) => r.id));

  return (
    <div>
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded", styles.badge)}>
          {label}
        </span>
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      {/* Selected items */}
      {visibleSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {visibleSelected.map((rec) => (
            <div
              key={rec.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border transition-all",
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
        </div>
      )}

      {/* Popover trigger + dropdown (Radix handles positioning automatically) */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs font-medium transition-colors",
              "text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            {visibleSelected.length > 0 ? "Cambiar" : "Seleccionar"}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar..."
              value={search}
              onValueChange={setSearch}
              loading={loading}
            />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              {results.map((rec) => {
                const isSelected = selectedIds.has(rec.id);
                return (
                  <CommandItem
                    key={rec.id}
                    value={rec.id}
                    onSelect={() => handleSelect(rec)}
                    className={cn(isSelected && "opacity-60")}
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
                      {rec.status && <p className="text-[10px] text-muted-foreground">{rec.status}</p>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────

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
  for (const key of ["Name", "Nombre", "Titulo", "Title", "Id And Tag Summary"]) {
    if (typeof data[key] === "string" && data[key]) return data[key] as string;
  }
  return null;
}
