"use client";

import { useState, useDeferredValue, useMemo, useEffect, useRef } from "react";
import { useAppData, type AppDataRecord } from "@/lib/hooks/use-app-data";
import { useAccountStore } from "@/lib/stores/account-store";
import { RecordEditDrawer } from "@/components/app-data/record-edit-drawer";
import { cn } from "@/lib/utils";
import {
  Search,
  Loader2,
  Database,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Filter,
  X,
} from "lucide-react";

// Fields to hide from the table listing (still visible in drawer)
const HIDDEN_FIELDS = new Set([
  "id", "createdTime",
]);

// Max columns to show in table summary (keeps it clean)
const MAX_SUMMARY_COLUMNS = 8;

// Patterns to auto-hide columns (case-insensitive match)
function shouldHideColumn(name: string, records: AppDataRecord[]): boolean {
  const lower = name.toLowerCase();

  // Exact matches (case-insensitive)
  const exactHide = [
    "notes", "notas", "autonumber",
    "created", "created by", "created time", "created_by",
    "last modified", "last modified by", "last modified time",
    "account", "🏢account",
  ];
  if (exactHide.includes(lower)) return true;

  // Pattern matches
  if (lower.startsWith("id_") || lower.startsWith("id ")) return true;
  if (lower.endsWith("_id") || lower.endsWith(" id")) return true;
  if (lower.includes("record_id")) return true;
  if (lower === "id" || lower === "autonumber") return true;

  // Check if column values are all record IDs (recXXX) or JSON objects — not useful in table
  const sample = records.slice(0, 20);
  const nonEmpty = sample.filter((r) => r[name] != null && r[name] !== "");
  if (nonEmpty.length > 0) {
    const allRecordIds = nonEmpty.every((r) => {
      const v = r[name];
      if (typeof v === "string" && /^rec[a-zA-Z0-9]{10,}$/.test(v)) return true;
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string" && v[0].startsWith("rec")) return true;
      return false;
    });
    if (allRecordIds) return true;

    const allObjects = nonEmpty.every((r) => {
      const v = r[name];
      return typeof v === "object" && v !== null && !Array.isArray(v) && "id" in (v as Record<string, unknown>) && "email" in (v as Record<string, unknown>);
    });
    if (allObjects) return true;
  }

  return false;
}

// Calculate how "filled" a column is (0-1). Empty/null values reduce the score.
function columnFillRate(name: string, records: AppDataRecord[]): number {
  if (records.length === 0) return 0;
  const filled = records.filter((r) => {
    const v = r[name];
    if (v == null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
  return filled.length / records.length;
}

// Priority score for column ordering: images first, then Name, then booleans, then filled text
function columnPriority(name: string, records: AppDataRecord[]): number {
  const lower = name.toLowerCase();
  // Name always first
  if (lower === "name" || lower === "nombre") return 1000;
  // Sample first non-empty value to detect type
  const sample = records.find((r) => r[name] != null && r[name] !== "");
  if (sample) {
    const v = sample[name];
    // Image attachments — very visual, high priority
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null && "url" in v[0]) return 900;
    // Booleans — compact, useful
    if (typeof v === "boolean") return 700;
    // Tags/arrays — visual
    if (Array.isArray(v)) return 600;
    // Numbers
    if (typeof v === "number") return 500;
  }
  // Default text fields
  return 400;
}
const ROWS_PER_PAGE = 25;
const GALLERY_ITEMS_PER_PAGE = 24;

// Find the first image attachment field in a record
function findImageField(record: AppDataRecord): string | null {
  for (const [key, val] of Object.entries(record)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "url" in val[0]) {
      const a = val[0] as { type?: string; url?: string };
      if (a.type?.startsWith("image/") || a.url?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
        return key;
      }
    }
  }
  return null;
}

// Get the display name for a record
function getRecordName(record: AppDataRecord): string {
  if (record.Name) return String(record.Name);
  if (record.name) return String(record.name);
  if (record.Nombre) return String(record.Nombre);
  // Try first string field that looks like a name
  for (const [key, val] of Object.entries(record)) {
    if (key === "id" || key === "createdTime") continue;
    if (typeof val === "string" && val.length > 0 && val.length < 100 && !val.startsWith("rec") && !val.startsWith("http")) {
      return val;
    }
  }
  return record.id;
}

// Get thumbnail URL from an attachment value
function getThumbUrl(attachments: unknown[]): string | null {
  if (attachments.length === 0) return null;
  const att = attachments[0] as { url?: string; thumbnails?: { large?: { url: string }; small?: { url: string } } };
  return att.thumbnails?.large?.url || att.thumbnails?.small?.url || att.url || null;
}

// Get summary fields for gallery card (exclude name and image fields, max 3 fields)
function getGallerySummaryFields(record: AppDataRecord, imageField: string | null, columns: string[]): { key: string; value: unknown }[] {
  const result: { key: string; value: unknown }[] = [];
  for (const col of columns) {
    if (col === imageField) continue;
    const lower = col.toLowerCase();
    if (lower === "name" || lower === "nombre") continue;
    const v = record[col];
    if (v == null || v === "") continue;
    result.push({ key: col, value: v });
    if (result.length >= 3) break;
  }
  return result;
}

// Detect filterable fields across ALL record fields (not just visible columns)
function getFilterableColumns(records: AppDataRecord[]): { field: string; options: string[] }[] {
  if (records.length === 0) return [];

  // Collect all field names from all records
  const allFields = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r)) {
      if (!HIDDEN_FIELDS.has(k)) allFields.add(k);
    }
  }

  const result: { field: string; options: string[] }[] = [];
  for (const col of allFields) {
    const lower = col.toLowerCase();
    if (lower === "name" || lower === "nombre") continue;
    // Skip internal/account fields
    if (lower === "id" || lower === "createdtime") continue;
    if (lower === "account" || lower === "🏢account") continue;
    if (lower.includes("(from ")) continue; // Lookup fields are not useful as filters

    const distinctValues = new Map<string, number>();
    let validCount = 0;

    for (const r of records) {
      const v = r[col];
      if (v == null || v === "") continue;

      // Simple string values (select fields, short text with repeated values)
      if (typeof v === "string" && !v.startsWith("http") && !v.startsWith("rec") && v.length < 100) {
        distinctValues.set(v, (distinctValues.get(v) || 0) + 1);
        validCount++;
      } else if (typeof v === "boolean") {
        const label = v ? "Sí" : "No";
        distinctValues.set(label, (distinctValues.get(label) || 0) + 1);
        validCount++;
      } else if (typeof v === "number") {
        // Numbers with few distinct values (e.g. ratings, scores)
        const label = String(v);
        distinctValues.set(label, (distinctValues.get(label) || 0) + 1);
        validCount++;
      } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string" && !v[0].startsWith("rec")) {
        // Tag/multi-select arrays
        for (const tag of v) {
          if (typeof tag === "string" && tag.length < 100) {
            distinctValues.set(tag, (distinctValues.get(tag) || 0) + 1);
          }
        }
        validCount++;
      }
    }

    // Show as filter if: 2+ distinct values, max 50 options, and at least some records have values
    if (distinctValues.size >= 2 && distinctValues.size <= 50 && validCount >= 2) {
      const sorted = Array.from(distinctValues.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([val]) => val);
      result.push({ field: col, options: sorted });
    }
  }

  // Sort filters: fewer options first (more useful), then alphabetically
  result.sort((a, b) => a.options.length - b.options.length || a.field.localeCompare(b.field));

  return result;
}

interface GenericDataTableProps {
  table: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  /** Airtable field name to use as primary image (overrides auto-detection) */
  preferredImageField?: string;
  /** Auto-open the record detail when there's only 1 record (e.g. Default Settings) */
  autoOpenSingle?: boolean;
  /** Default view mode */
  defaultView?: "gallery" | "table";
  /** Default sort direction for createdTime */
  defaultSort?: "asc" | "desc";
}

export function GenericDataTable({ table, title, icon, description, preferredImageField, autoOpenSingle, defaultView = "gallery", defaultSort = "asc" }: GenericDataTableProps) {
  const { currentAccount } = useAccountStore();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSort);
  const [page, setPage] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<AppDataRecord | null>(null);
  const [viewMode, setViewMode] = useState<"gallery" | "table">(defaultView);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const deferredSearch = useDeferredValue(search);

  const { data: allRecords = [], isLoading, error } = useAppData({
    table,
    accountId: currentAccount?.id,
  });

  // Auto-open the single record when autoOpenSingle is enabled (only once per data load)
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenSingle && allRecords.length === 1 && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setSelectedRecord(allRecords[0]);
    }
  }, [autoOpenSingle, allRecords]);

  // Keep selectedRecord in sync with latest query data (e.g., after save + refetch)
  useEffect(() => {
    if (selectedRecord && allRecords.length > 0) {
      const fresh = allRecords.find((r) => r.id === selectedRecord.id);
      if (fresh && fresh !== selectedRecord) {
        setSelectedRecord(fresh);
      }
    }
  }, [allRecords, selectedRecord]);

  // Client-side search filter
  const searchFiltered = useMemo(() => {
    if (!deferredSearch) return allRecords;
    const q = deferredSearch.toLowerCase();
    return allRecords.filter((r) =>
      Object.values(r).some((v) =>
        v != null && String(v).toLowerCase().includes(q)
      )
    );
  }, [allRecords, deferredSearch]);

  // Apply dropdown filters
  const records = useMemo(() => {
    const filterEntries = Object.entries(activeFilters);
    if (filterEntries.length === 0) return searchFiltered;
    return searchFiltered.filter((r) =>
      filterEntries.every(([field, filterValue]) => {
        const v = r[field];
        if (v == null) return false;
        if (typeof v === "boolean") return (v ? "Sí" : "No") === filterValue;
        if (Array.isArray(v)) return v.some((item) => String(item) === filterValue);
        return String(v) === filterValue;
      })
    );
  }, [searchFiltered, activeFilters]);

  // Auto-discover columns from data: hide internal fields, empty columns, and cap at MAX_SUMMARY_COLUMNS
  const columns = useMemo(() => {
    if (allRecords.length === 0) return [];
    const fieldSet = new Set<string>();
    allRecords.forEach((r) => {
      Object.keys(r).forEach((k) => {
        if (!HIDDEN_FIELDS.has(k)) fieldSet.add(k);
      });
    });
    // Filter out columns that match hide patterns
    let cols = Array.from(fieldSet).filter((col) => !shouldHideColumn(col, allRecords));
    // Remove columns that are mostly empty (< 15% filled)
    cols = cols.filter((col) => columnFillRate(col, allRecords) >= 0.15);
    // Sort by priority (images, name, booleans first) then by fill rate
    cols.sort((a, b) => {
      const pa = columnPriority(a, allRecords);
      const pb = columnPriority(b, allRecords);
      if (pa !== pb) return pb - pa;
      return columnFillRate(b, allRecords) - columnFillRate(a, allRecords);
    });
    // Cap at max columns for clean summary
    cols = cols.slice(0, MAX_SUMMARY_COLUMNS);
    return cols;
  }, [allRecords]);

  // Detect filterable columns (scans ALL fields, not just visible columns)
  const filterableColumns = useMemo(() => {
    return getFilterableColumns(allRecords);
  }, [allRecords]);

  // Sort
  const sorted = useMemo(() => {
    const field = sortField || (defaultSort === "desc" ? "createdTime" : null);
    if (!field) return records;
    return [...records].sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [records, sortField, sortDir, defaultSort]);

  // Paginate
  const itemsPerPage = viewMode === "gallery" ? GALLERY_ITEMS_PER_PAGE : ROWS_PER_PAGE;
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  // Gallery: find image field from first record (preferredImageField overrides auto-detect)
  const imageField = useMemo(() => {
    if (allRecords.length === 0) return null;
    if (preferredImageField) return preferredImageField;
    return findImageField(allRecords[0]);
  }, [allRecords, preferredImageField]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function toggleFilter(field: string, value: string) {
    setActiveFilters((prev) => {
      if (prev[field] === value) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: value };
    });
    setPage(0);
  }

  function clearFilters() {
    setActiveFilters({});
    setPage(0);
  }

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm flex-shrink-0">{icon}</div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {description}
              {records.length > 0 && <span className="ml-1 text-foreground/60"> · {records.length} registros</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
            <button
              onClick={() => { setViewMode("gallery"); setPage(0); }}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "gallery"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Vista galería"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode("table"); setPage(0); }}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "table"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Vista tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <span className="px-3.5 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl text-sm font-semibold text-primary border border-primary/10">
            {records.length}
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={`Buscar en ${title}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-background hover:bg-muted/60"
          />
        </div>

        {/* Dropdown filters */}
        {filterableColumns.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {filterableColumns.map(({ field, options }) => (
              <div key={field} className="relative">
                <select
                  value={activeFilters[field] || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleFilter(field, e.target.value);
                    } else {
                      setActiveFilters((prev) => {
                        const next = { ...prev };
                        delete next[field];
                        return next;
                      });
                      setPage(0);
                    }
                  }}
                  className={cn(
                    "appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                    activeFilters[field]
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <option value="">{field}</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
              </div>
            ))}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all"
              >
                <X className="w-3 h-3" />
                Limpiar ({activeFilterCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {!currentAccount ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">Cargando cuenta...</span>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">Cargando {title.toLowerCase()}...</span>
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-12 text-center border border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Error al cargar datos. Intenta de nuevo.</p>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">Sin registros</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {search || activeFilterCount > 0 ? "No se encontraron resultados. Prueba a cambiar los filtros." : `No hay datos en ${title}.`}
          </p>
        </div>
      ) : viewMode === "gallery" ? (
        /* ─── Gallery View ─── */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((record) => {
              const name = getRecordName(record);
              const imgField = imageField || findImageField(record);
              const imgAttachments = imgField ? (record[imgField] as unknown[]) : null;
              const thumbUrl = imgAttachments ? getThumbUrl(imgAttachments) : null;
              const summaryFields = getGallerySummaryFields(record, imgField, columns);

              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  {/* Image */}
                  {thumbUrl ? (
                    <div className="aspect-video w-full overflow-hidden bg-muted/30">
                      <img
                        src={thumbUrl}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-muted-foreground/20">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-3.5 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    {summaryFields.length > 0 && (
                      <div className="space-y-1.5">
                        {summaryFields.map(({ key, value }) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold flex-shrink-0 mt-0.5 w-16 truncate">
                              {key}
                            </span>
                            <div className="min-w-0 flex-1">
                              <CellValue value={value} compact />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={sorted.length} itemsPerPage={GALLERY_ITEMS_PER_PAGE} onPageChange={setPage} />}
        </>
      ) : (
        /* ─── Table View ─── */
        <>
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {columns.map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className={cn(
                          "text-left px-3 py-2 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer select-none transition-all",
                          sortField === col
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[200px]">{col}</span>
                          {sortField === col && (
                            <span className="text-primary">
                              {sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginated.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="group/row hover:bg-primary/[0.03] cursor-pointer transition-all duration-150"
                    >
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-1 max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
                          <CellValue value={record[col]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={sorted.length} itemsPerPage={ROWS_PER_PAGE} onPageChange={setPage} />}
        </>
      )}

      {/* Edit Drawer */}
      <RecordEditDrawer
        record={selectedRecord}
        table={table}
        accountId={currentAccount?.id}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

// ─── Pagination component ──────────────────────────────────
function Pagination({ page, totalPages, total, itemsPerPage, onPageChange }: {
  page: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-muted-foreground">
        {page * itemsPerPage + 1}–{Math.min((page + 1) * itemsPerPage, total)} de {total}
      </p>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-md font-medium">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Tag color palette ──────────────────────────────────
const TAG_COLORS = [
  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "bg-rose-500/15 text-rose-400 border-rose-500/20",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20",
  "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTagColor(value: string): string {
  return TAG_COLORS[hashString(value) % TAG_COLORS.length];
}

// ─── Smart cell renderer — auto-detects field types ──────

function CellValue({ value, compact }: { value: unknown; compact?: boolean }) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground/30">—</span>;
  }

  // Boolean
  if (typeof value === "boolean") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all",
        value
          ? "bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10"
          : "bg-muted text-muted-foreground"
      )}>
        <span className={cn("w-1.5 h-1.5 rounded-full", value ? "bg-emerald-400" : "bg-muted-foreground/50")} />
        {value ? "Sí" : "No"}
      </span>
    );
  }

  // Number
  if (typeof value === "number") {
    return (
      <span className="inline-flex px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-mono text-xs font-medium">
        {value.toLocaleString()}
      </span>
    );
  }

  // Array (linked records, tags, attachments)
  if (Array.isArray(value)) {
    // Attachment array (Airtable images) — show real thumbnails with hover effects
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null && "url" in value[0]) {
      const maxShow = compact ? 2 : 3;
      return (
        <div className="flex items-center gap-2">
          {value.slice(0, maxShow).map((att, i) => {
            const a = att as { url: string; type?: string; thumbnails?: { small?: { url: string }; large?: { url: string } } };
            const isImage = a.type?.startsWith("image/") || a.url?.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
            const thumb = a.thumbnails?.large?.url || a.thumbnails?.small?.url || a.url;

            if (isImage) {
              return (
                <div key={i} className="relative group/img" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={thumb}
                    alt=""
                    className={cn(
                      "rounded-lg object-cover border border-border/50 shadow-sm transition-all duration-200 group-hover/img:scale-110 group-hover/img:shadow-lg group-hover/img:shadow-primary/20 group-hover/img:border-primary/40 group-hover/img:brightness-110",
                      compact ? "w-8 h-8" : "w-12 h-12"
                    )}
                    loading="lazy"
                  />
                </div>
              );
            }
            return (
              <span key={i} className={cn(
                "rounded-lg bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-colors",
                compact ? "w-8 h-8" : "w-12 h-12"
              )}>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </span>
            );
          })}
          {value.length > maxShow && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
              +{value.length - maxShow}
            </span>
          )}
        </div>
      );
    }
    // String array (tags, linked record IDs)
    const maxTags = compact ? 2 : 3;
    return (
      <div className="flex gap-1.5 overflow-hidden flex-wrap">
        {value.slice(0, maxTags).map((v, i) => {
          const str = String(v);
          const isRecId = str.startsWith("rec");
          return (
            <span
              key={i}
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[120px] flex-shrink-0 border transition-all",
                isRecId
                  ? "bg-muted/80 text-muted-foreground font-mono text-[10px] border-border"
                  : getTagColor(str)
              )}
            >
              {str}
            </span>
          );
        })}
        {value.length > maxTags && (
          <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full border border-border flex-shrink-0">
            +{value.length - maxTags}
          </span>
        )}
      </div>
    );
  }

  // Object (single attachment, lookup)
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("url" in obj) {
      return (
        <a
          href={obj.url as string}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 hover:shadow-sm transition-all active:scale-95"
        >
          <ExternalLink className="w-3 h-3" />
          Link
        </a>
      );
    }
    return <span className="text-xs text-muted-foreground/70 font-mono">{JSON.stringify(obj).slice(0, 50)}</span>;
  }

  // String — check for URLs
  const str = String(value);
  if (str.startsWith("http://") || str.startsWith("https://")) {
    return (
      <a
        href={str}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs group/link transition-all"
      >
        <ExternalLink className="w-3 h-3 group-hover/link:scale-110 transition-transform" />
        <span className="truncate max-w-[200px] group-hover/link:underline underline-offset-2">{str.replace(/^https?:\/\//, "")}</span>
      </a>
    );
  }

  return <span className={cn("text-xs text-foreground/80 truncate block", compact ? "max-w-[150px]" : "max-w-[220px]")} title={str}>{str}</span>;
}
