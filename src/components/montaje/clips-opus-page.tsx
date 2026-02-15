"use client";

import { useState, useDeferredValue, useMemo } from "react";
import { useAppData, type AppDataRecord } from "@/lib/hooks/use-app-data";
import { useAccountStore } from "@/lib/stores/account-store";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { RecordEditDrawer } from "@/components/app-data/record-edit-drawer";
import { cn } from "@/lib/utils";
import {
  Search,
  Database,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  CalendarDays,
  Filter,
  X,
  ExternalLink,
  Film,
  Clapperboard,
  Play,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

type ViewMode = "gallery" | "table" | "calendar";

// ─── Constants ────────────────────────────────────────────

const ROWS_PER_PAGE = 25;
const GALLERY_PER_PAGE = 20;

const STATUS_COLORS: Record<string, string> = {
  Completado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Ready For Publishing": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "In Progress": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Generating: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Error: "bg-red-500/15 text-red-400 border-red-500/20",
  Pendiente: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

// Columns shown in table view — ordered by relevance
const TABLE_COLUMNS = [
  "Name",
  "Titulo Clip",
  "Youtube 365 Full Post",
  "Estado del Montaje",
  "Meta_Organico_Status",
  "Meta_Status",
  "Metricool_Uuid",
  "Favorito (from Videos Broll)",
  "Meta_Texto (from Youtube 365 Full Post)",
];

// ─── Helpers ──────────────────────────────────────────────

function getRecordName(r: AppDataRecord): string {
  if (typeof r["Titulo Clip"] === "string" && r["Titulo Clip"]) return r["Titulo Clip"];
  if (typeof r.Name === "string" && r.Name) return r.Name;
  for (const [k, v] of Object.entries(r)) {
    if (k === "id" || k === "createdTime") continue;
    if (typeof v === "string" && v.length > 0 && v.length < 120 && !v.startsWith("rec") && !v.startsWith("http")) return v;
  }
  return r.id;
}

function getThumbUrl(r: AppDataRecord): string | null {
  // Try known image fields
  for (const field of ["Portada Meta", "portada_meta", "Miniatura", "miniatura", "Broll Thumb (from Videos Broll)"]) {
    const v = r[field];
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null && "url" in v[0]) {
      const att = v[0] as { url?: string; thumbnails?: { large?: { url: string }; small?: { url: string } } };
      return att.thumbnails?.large?.url || att.thumbnails?.small?.url || att.url || null;
    }
  }
  // Auto-detect first image attachment
  for (const [, v] of Object.entries(r)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null && "url" in v[0]) {
      const att = v[0] as { url?: string; type?: string; thumbnails?: { large?: { url: string }; small?: { url: string } } };
      if (att.type?.startsWith("image/") || att.url?.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
        return att.thumbnails?.large?.url || att.thumbnails?.small?.url || att.url || null;
      }
    }
  }
  return null;
}

function getVideoUrl(r: AppDataRecord): string | null {
  for (const field of ["url_shotstack_montaje_final", "url_s3_montaje_final", "url_drive_montaje_final"]) {
    const v = r[field];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

function getAvatarImages(r: AppDataRecord): string[] {
  const v = r["Attachments (from Avatar) (from Avatar Se...)"];
  if (!Array.isArray(v)) return [];
  return v.slice(0, 3).map((att) => {
    const a = att as { url?: string; thumbnails?: { small?: { url: string }; large?: { url: string } } };
    return a.thumbnails?.small?.url || a.thumbnails?.large?.url || a.url || "";
  }).filter(Boolean);
}

function getRecordDate(r: AppDataRecord): string | null {
  if (typeof r.Created === "string") return r.Created.substring(0, 10);
  if (typeof r.created === "string") return r.created.substring(0, 10);
  if (r.createdTime) return String(r.createdTime).substring(0, 10);
  return null;
}

function getFilterableFields(records: AppDataRecord[]): { field: string; options: string[] }[] {
  if (records.length === 0) return [];
  const result: { field: string; options: string[] }[] = [];
  const checked = new Set<string>();
  for (const r of records) for (const k of Object.keys(r)) checked.add(k);
  for (const col of checked) {
    const lower = col.toLowerCase();
    if (["id", "createdtime", "name", "nombre"].includes(lower)) continue;
    if (lower.includes("account") || lower.includes("(from ") || lower.includes("url") || lower.includes("uuid")) continue;
    const distinct = new Map<string, number>();
    let valid = 0;
    for (const r of records) {
      const v = r[col];
      if (v == null || v === "") continue;
      if (typeof v === "string" && !v.startsWith("http") && !v.startsWith("rec") && v.length < 80) {
        distinct.set(v, (distinct.get(v) || 0) + 1);
        valid++;
      }
    }
    if (distinct.size >= 2 && distinct.size <= 40 && valid >= 2) {
      const sorted = Array.from(distinct.entries()).sort((a, b) => b[1] - a[1]).map(([v]) => v);
      result.push({ field: col, options: sorted });
    }
  }
  result.sort((a, b) => a.options.length - b.options.length);
  return result;
}

// Calendar constants
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

// ─── StatusBadge ──────────────────────────────────────────

function StatusBadge({ value }: { value: string }) {
  const colors = STATUS_COLORS[value] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", colors)}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        value === "Completado" || value === "Published" ? "bg-emerald-400" :
        value === "Ready For Publishing" ? "bg-blue-400" :
        value === "In Progress" || value === "Generating" ? "bg-amber-400" :
        value === "Error" ? "bg-red-400" : "bg-zinc-400"
      )} />
      {value}
    </span>
  );
}

// ─── CellValue ────────────────────────────────────────────

function CellValue({ value }: { value: unknown }) {
  if (value == null || value === "") return <span className="text-muted-foreground/30">—</span>;
  if (typeof value === "boolean") return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", value ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>{value ? "Sí" : "No"}</span>;
  if (typeof value === "number") return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-mono text-xs font-medium">{value.toLocaleString()}</span>;
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null && "url" in value[0]) {
      return (
        <div className="flex items-center gap-1.5">
          {value.slice(0, 2).map((att, i) => {
            const a = att as { url: string; thumbnails?: { small?: { url: string } } };
            return <img key={i} src={a.thumbnails?.small?.url || a.url} alt="" className="w-8 h-8 rounded-lg object-cover border border-border/50" loading="lazy" />;
          })}
          {value.length > 2 ? <span className="text-[10px] text-muted-foreground">+{value.length - 2}</span> : null}
        </div>
      );
    }
    return (
      <div className="flex gap-1 flex-wrap">
        {value.slice(0, 2).map((v, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20 truncate max-w-[100px]">{String(v)}</span>)}
        {value.length > 2 ? <span className="text-[10px] text-muted-foreground">+{value.length - 2}</span> : null}
      </div>
    );
  }
  const str = String(value);
  if (STATUS_COLORS[str]) return <StatusBadge value={str} />;
  if (str.startsWith("http")) return <a href={str} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-primary text-xs"><ExternalLink className="w-3 h-3" /><span className="truncate max-w-[160px]">{str.replace(/^https?:\/\//, "")}</span></a>;
  return <span className="text-xs text-foreground/80 truncate block max-w-[220px]" title={str}>{str}</span>;
}

// ─── Main Component ───────────────────────────────────────

export function ClipsOpusPage() {
  const { currentAccount } = useAccountStore();
  const { activeVideoId, activeVideoName, activeVideoTitle } = useVideoContextStore();
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<AppDataRecord | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [calDate, setCalDate] = useState(new Date());
  const [showAll, setShowAll] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const { data: allRecords = [], isLoading, error } = useAppData({
    table: "montaje-video",
    accountId: currentAccount?.id,
  });

  // Filter by active video (linked via "Youtube 365 Full Post" field)
  const videoFiltered = useMemo(() => {
    if (showAll || !activeVideoId) return allRecords;
    return allRecords.filter((r) => {
      const linked = r["Youtube 365 Full Post"];
      // Linked record field: array of record IDs
      if (Array.isArray(linked)) {
        if (linked.some((v) => String(v) === activeVideoId)) return true;
        // Also match by video number
        if (activeVideoName && linked.some((v) => String(v) === String(activeVideoName))) return true;
      }
      // Lookup/number value
      if (linked != null && activeVideoName && String(linked) === String(activeVideoName)) return true;
      // Also check Name field contains video number
      if (activeVideoName && typeof r.Name === "string" && r.Name.includes(String(activeVideoName))) return true;
      return false;
    });
  }, [allRecords, activeVideoId, activeVideoName, showAll]);

  // Search
  const searchFiltered = useMemo(() => {
    if (!deferredSearch) return videoFiltered;
    const q = deferredSearch.toLowerCase();
    return videoFiltered.filter((r) => Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(q)));
  }, [videoFiltered, deferredSearch]);

  // Filters
  const records = useMemo(() => {
    const entries = Object.entries(activeFilters);
    if (entries.length === 0) return searchFiltered;
    return searchFiltered.filter((r) => entries.every(([field, fv]) => {
      const v = r[field];
      if (v == null) return false;
      if (Array.isArray(v)) return v.some((item) => String(item) === fv);
      return String(v) === fv;
    }));
  }, [searchFiltered, activeFilters]);

  // Sort
  const sorted = useMemo(() => {
    const field = sortField || "createdTime";
    return [...records].sort((a, b) => {
      const va = a[field]; const vb = b[field];
      if (va == null && vb == null) return 0;
      if (va == null) return 1; if (vb == null) return -1;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [records, sortField, sortDir]);

  // Columns: use known fields, fallback auto-discover
  const columns = useMemo(() => {
    if (allRecords.length === 0) return TABLE_COLUMNS;
    const allKeys = new Set<string>();
    allRecords.forEach((r) => Object.keys(r).forEach((k) => { if (k !== "id" && k !== "createdTime") allKeys.add(k); }));
    const present = TABLE_COLUMNS.filter((c) => allKeys.has(c));
    if (present.length >= 4) return present;
    return Array.from(allKeys).filter((k) => {
      const l = k.toLowerCase();
      return !["autonumber", "created", "created by", "account", "🏢account", "notes", "notas"].includes(l);
    }).slice(0, 9);
  }, [allRecords]);

  // Filterable fields (based on video-filtered records)
  const filterableColumns = useMemo(() => getFilterableFields(videoFiltered), [videoFiltered]);

  // Pagination
  const perPage = viewMode === "gallery" ? GALLERY_PER_PAGE : ROWS_PER_PAGE;
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);

  // Calendar data
  const recordsByDate = useMemo(() => {
    const map: Record<string, AppDataRecord[]> = {};
    for (const r of records) {
      const d = getRecordDate(r);
      if (!d) continue;
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    return map;
  }, [records]);

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function toggleFilter(field: string, value: string) {
    setActiveFilters((prev) => {
      if (prev[field] === value) { const next = { ...prev }; delete next[field]; return next; }
      return { ...prev, [field]: value };
    });
    setPage(0);
  }

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 text-red-500 shadow-sm flex-shrink-0">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">Clips Opus</h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {!showAll && activeVideoId ? (
                <>
                  Video #{activeVideoName}{activeVideoTitle ? ` — ${activeVideoTitle}` : ""}
                  {records.length > 0 ? <span className="ml-1 text-foreground/60"> · {records.length} clips</span> : null}
                </>
              ) : (
                <>
                  Todos los montajes y clips de video
                  {records.length > 0 ? <span className="ml-1 text-foreground/60"> · {records.length} clips</span> : null}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
            {([
              { mode: "gallery" as ViewMode, icon: LayoutGrid, label: "Galería" },
              { mode: "table" as ViewMode, icon: List, label: "Lista" },
              { mode: "calendar" as ViewMode, icon: CalendarDays, label: "Calendario" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setPage(0); }}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === mode ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {/* Toggle: filter by video / show all */}
          {activeVideoId ? (
            <button
              onClick={() => { setShowAll((v) => !v); setPage(0); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                showAll
                  ? "bg-muted/50 text-muted-foreground border-border hover:bg-muted/70"
                  : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
              )}
            >
              {showAll ? `Filtrar por #${activeVideoName}` : "Mostrar todos"}
            </button>
          ) : null}
          <span className="px-3.5 py-1.5 bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-xl text-sm font-semibold text-red-500 border border-red-500/10">
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
            placeholder="Buscar clips..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-background hover:bg-muted/60"
          />
        </div>
        {filterableColumns.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {filterableColumns.map(({ field, options }) => (
              <div key={field} className="relative">
                <select
                  value={activeFilters[field] || ""}
                  onChange={(e) => {
                    if (e.target.value) toggleFilter(field, e.target.value);
                    else { setActiveFilters((prev) => { const n = { ...prev }; delete n[field]; return n; }); setPage(0); }
                  }}
                  className={cn(
                    "appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                    activeFilters[field] ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted/70"
                  )}
                >
                  <option value="">{field}</option>
                  {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
              </div>
            ))}
            {activeFilterCount > 0 ? (
              <button onClick={() => { setActiveFilters({}); setPage(0); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all">
                <X className="w-3 h-3" /> Limpiar ({activeFilterCount})
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Content */}
      {!currentAccount ? (
        <LoadingState text="Cargando cuenta..." />
      ) : isLoading ? (
        <LoadingState text="Cargando clips..." />
      ) : error ? (
        <div className="glass-card rounded-xl p-12 text-center border border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive font-medium">Error al cargar datos. Intenta de nuevo.</p>
        </div>
      ) : records.length === 0 ? (
        <EmptyState hasFilters={!!search || activeFilterCount > 0} />
      ) : viewMode === "gallery" ? (
        <>
          <GalleryView records={paginated} onSelect={setSelectedRecord} />
          {totalPages > 1 ? <PaginationBar page={page} totalPages={totalPages} total={sorted.length} perPage={GALLERY_PER_PAGE} onChange={setPage} /> : null}
        </>
      ) : viewMode === "table" ? (
        <>
          <TableView records={paginated} columns={columns} sortField={sortField} sortDir={sortDir} onSort={handleSort} onSelect={setSelectedRecord} />
          {totalPages > 1 ? <PaginationBar page={page} totalPages={totalPages} total={sorted.length} perPage={ROWS_PER_PAGE} onChange={setPage} /> : null}
        </>
      ) : (
        <CalendarView recordsByDate={recordsByDate} currentDate={calDate} onChangeDate={setCalDate} onSelect={setSelectedRecord} />
      )}

      {/* Record detail drawer */}
      <RecordEditDrawer record={selectedRecord} table="montaje-video" onClose={() => setSelectedRecord(null)} />
    </div>
  );
}

// ─── Gallery View ─────────────────────────────────────────

function GalleryView({ records, onSelect }: { records: AppDataRecord[]; onSelect: (r: AppDataRecord) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {records.map((record) => {
        const name = getRecordName(record);
        const thumbUrl = getThumbUrl(record);
        const videoUrl = getVideoUrl(record);
        const avatarImages = getAvatarImages(record);
        const estado = record["Estado del Montaje"];
        const metaOrgStatus = record["Meta_Organico_Status"];
        const metaStatus = record["Meta_Status"];
        const videoNum = record["Youtube 365 Full Post"];
        const metricoolId = record["Metricool_Uuid"];
        const brollFav = record["Favorito (from Videos Broll)"];

        return (
          <div
            key={record.id}
            onClick={() => onSelect(record)}
            className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            {/* Thumbnail + Video Montaje overlay */}
            <div className="relative aspect-[9/16] max-h-[280px] w-full overflow-hidden bg-muted/30">
              {thumbUrl ? (
                <img src={thumbUrl} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
                  <Film className="w-10 h-10 text-muted-foreground/20" />
                </div>
              )}
              {/* Video montaje play button overlay */}
              {videoUrl ? (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110">
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  </div>
                </a>
              ) : null}
              {/* Video number badge */}
              {videoNum != null ? (
                <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                  #{String(Array.isArray(videoNum) ? videoNum[0] : videoNum)}
                </span>
              ) : null}
            </div>

            {/* Card body — main fields */}
            <div className="p-3.5 space-y-2.5">
              {/* Title */}
              <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                {name}
              </h3>

              {/* Name (if different from title) */}
              {typeof record.Name === "string" && record.Name !== name ? (
                <p className="text-[11px] text-muted-foreground truncate">{record.Name}</p>
              ) : null}

              {/* Avatar images */}
              {avatarImages.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold w-14 flex-shrink-0">Avatar</span>
                  <div className="flex -space-x-1.5">
                    {avatarImages.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-7 h-7 rounded-full border-2 border-card object-cover" loading="lazy" />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Favorito broll */}
              {brollFav != null && brollFav !== "" ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold w-14 flex-shrink-0">Broll</span>
                  <CellValue value={brollFav} />
                </div>
              ) : null}

              {/* Meta texto */}
              {typeof record["Meta_Texto (from Youtube 365 Full Post)"] === "string" && record["Meta_Texto (from Youtube 365 Full Post)"] ? (
                <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                  {record["Meta_Texto (from Youtube 365 Full Post)"]}
                </p>
              ) : null}

              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5">
                {typeof estado === "string" && estado ? <StatusBadge value={estado} /> : null}
                {typeof metaOrgStatus === "string" && metaOrgStatus ? <StatusBadge value={metaOrgStatus} /> : null}
                {typeof metaStatus === "string" && metaStatus ? <StatusBadge value={metaStatus} /> : null}
              </div>

              {/* Metricool UUID */}
              {metricoolId != null && metricoolId !== "" ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold w-14 flex-shrink-0">Metricool</span>
                  <span className="text-[10px] font-mono text-muted-foreground truncate">{String(metricoolId)}</span>
                </div>
              ) : null}

              {/* Video montaje link */}
              {videoUrl ? (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/15"
                >
                  <Play className="w-3.5 h-3.5" />
                  Ver Video Montaje
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────

function TableView({ records, columns, sortField, sortDir, onSort, onSelect }: {
  records: AppDataRecord[];
  columns: string[];
  sortField: string | null;
  sortDir: "asc" | "desc";
  onSort: (f: string) => void;
  onSelect: (r: AppDataRecord) => void;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {/* Extra column for video montaje */}
              <th className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Video
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => onSort(col)}
                  className={cn(
                    "text-left px-3 py-2 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer select-none transition-all",
                    sortField === col ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate max-w-[180px]">{col}</span>
                    {sortField === col ? (sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {records.map((record) => {
              const videoUrl = getVideoUrl(record);
              return (
                <tr key={record.id} onClick={() => onSelect(record)} className="group/row hover:bg-primary/[0.03] cursor-pointer transition-all duration-150">
                  {/* Video montaje column */}
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {videoUrl ? (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-500 text-[10px] font-medium hover:bg-red-500/20 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-1.5 max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
                      <CellValue value={record[col]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────

function CalendarView({ recordsByDate, currentDate, onChangeDate, onSelect }: {
  recordsByDate: Record<string, AppDataRecord[]>;
  currentDate: Date;
  onChangeDate: (d: Date) => void;
  onSelect: (r: AppDataRecord) => void;
}) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = toDateStr(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    onChangeDate(d);
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><ChevronRight className="w-4 h-4" /></button>
          <h3 className="text-sm font-semibold text-foreground ml-1">{MONTHS[month]} {year}</h3>
        </div>
        <button onClick={() => onChangeDate(new Date())} className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border">Hoy</button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase">{day}</div>)}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="min-h-[100px] border-b border-r border-border/30 bg-muted/20" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayRecords = recordsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={cn("min-h-[100px] border-b border-r border-border/30 p-1.5 transition-colors", isToday && "bg-primary/5", dayRecords.length > 0 && "hover:bg-muted/30")}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{day}</span>
                {dayRecords.length > 3 ? <span className="text-[10px] text-muted-foreground">+{dayRecords.length - 3}</span> : null}
              </div>
              <div className="space-y-0.5">
                {dayRecords.slice(0, 3).map((r) => {
                  const thumb = getThumbUrl(r);
                  const estado = r["Estado del Montaje"];
                  return (
                    <button key={r.id} onClick={() => onSelect(r)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-primary/10 group w-full text-left">
                      {thumb ? <img src={thumb} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" /> : <Film className="w-3 h-3 flex-shrink-0 text-muted-foreground group-hover:text-primary" />}
                      <span className="truncate text-foreground group-hover:text-primary">{getRecordName(r).substring(0, 25)}</span>
                      {estado === "Completado" ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────

function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="glass-card rounded-xl p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <Database className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <p className="text-lg font-semibold text-foreground mb-1">Sin clips</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {hasFilters ? "No se encontraron resultados. Prueba a cambiar los filtros." : "No hay clips de montaje aún."}
      </p>
    </div>
  );
}

function PaginationBar({ page, totalPages, total, perPage, onChange }: {
  page: number; totalPages: number; total: number; perPage: number; onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-muted-foreground">{page * perPage + 1}–{Math.min((page + 1) * perPage, total)} de {total}</p>
      <div className="flex items-center gap-0.5">
        <button onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-md font-medium">{page + 1} / {totalPages}</span>
        <button onClick={() => onChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
