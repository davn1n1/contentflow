"use client";

import { useState, useMemo, useCallback } from "react";
import type { YouTubeVideoStats } from "@/types/youtube";
import {
  formatNumber,
  formatNumberFull,
  formatDuration,
  formatDate,
} from "../utils";

interface VideosTabProps {
  videos: YouTubeVideoStats[];
}

type SortOption =
  | "newest"
  | "oldest"
  | "most-views"
  | "least-views"
  | "most-likes"
  | "most-engagement"
  | "longest"
  | "shortest";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mas recientes",
  oldest: "Mas antiguos",
  "most-views": "Mas vistos",
  "least-views": "Menos vistos",
  "most-likes": "Mas likes",
  "most-engagement": "Mayor engagement",
  longest: "Mas largos",
  shortest: "Mas cortos",
};

const PAGE_SIZE = 25;

function getEngagementColor(engagement: number): string {
  if (engagement >= 10) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (engagement >= 5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (engagement >= 2) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (engagement >= 1) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

export function VideosTab({ videos }: VideosTabProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Extract available years from video dates
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const v of videos) {
      years.add(new Date(v.publishedAt).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [videos]);

  // Max views for inline bar scaling
  const maxViews = useMemo(
    () => Math.max(...videos.map((v) => v.views), 1),
    [videos]
  );

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...videos];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((v) => v.title.toLowerCase().includes(q));
    }

    // Year filter
    if (yearFilter !== "all") {
      const year = parseInt(yearFilter);
      result = result.filter(
        (v) => new Date(v.publishedAt).getFullYear() === year
      );
    }

    // Sort
    switch (sort) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
        );
        break;
      case "most-views":
        result.sort((a, b) => b.views - a.views);
        break;
      case "least-views":
        result.sort((a, b) => a.views - b.views);
        break;
      case "most-likes":
        result.sort((a, b) => b.likes - a.likes);
        break;
      case "most-engagement":
        result.sort((a, b) => b.engagement - a.engagement);
        break;
      case "longest":
        result.sort((a, b) => b.duration - a.duration);
        break;
      case "shortest":
        result.sort((a, b) => a.duration - b.duration);
        break;
    }

    return result;
  }, [videos, search, sort, yearFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSort(value);
    setPage(1);
  }, []);

  const handleYearChange = useCallback((value: string) => {
    setYearFilter(value);
    setPage(1);
  }, []);

  // CSV export
  const handleExportCSV = useCallback(() => {
    const headers = [
      "Title",
      "Views",
      "Likes",
      "Comments",
      "Engagement",
      "Duration",
      "Date",
      "URL",
    ];
    const rows = filtered.map((v) => [
      `"${v.title.replace(/"/g, '""')}"`,
      v.views,
      v.likes,
      v.comments,
      v.engagement.toFixed(2) + "%",
      formatDuration(v.duration),
      formatDate(v.publishedAt),
      `https://www.youtube.com/watch?v=${v.id}`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube-videos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por titulo..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
          className="px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition-colors cursor-pointer"
        >
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>

        {/* Year filter */}
        <select
          value={yearFilter}
          onChange={(e) => handleYearChange(e.target.value)}
          className="px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition-colors cursor-pointer"
        >
          <option value="all">Todos los anos</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filtered.length === videos.length ? (
          <span>{videos.length} videos</span>
        ) : (
          <span>
            {filtered.length} de {videos.length} videos
          </span>
        )}
        {search.trim() && (
          <span className="ml-1">
            &middot; buscando &quot;{search.trim()}&quot;
          </span>
        )}
        {yearFilter !== "all" && (
          <span className="ml-1">&middot; ano {yearFilter}</span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[300px]">
                  Video
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[180px]">
                  Views
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                  Likes
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                  Comments
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                  Engagement
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                  Duration
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No se encontraron videos
                  </td>
                </tr>
              ) : (
                paginated.map((video, idx) => {
                  const globalIndex =
                    (page - 1) * PAGE_SIZE + idx + 1;
                  const barWidth = (video.views / maxViews) * 100;

                  return (
                    <tr
                      key={video.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* # */}
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {globalIndex}
                      </td>

                      {/* Video: thumbnail + title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="w-20 h-[45px] rounded object-cover bg-muted"
                              loading="lazy"
                            />
                          </a>
                          <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-red-400 transition-colors line-clamp-2 text-sm font-medium leading-tight"
                            title={video.title}
                          >
                            {video.title}
                          </a>
                        </div>
                      </td>

                      {/* Views with inline bar */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500/60 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span
                            className="text-foreground font-medium tabular-nums"
                            title={formatNumberFull(video.views)}
                          >
                            {formatNumber(video.views)}
                          </span>
                        </div>
                      </td>

                      {/* Likes */}
                      <td
                        className="px-4 py-3 text-right text-foreground tabular-nums"
                        title={formatNumberFull(video.likes)}
                      >
                        {formatNumber(video.likes)}
                      </td>

                      {/* Comments */}
                      <td
                        className="px-4 py-3 text-right text-foreground tabular-nums"
                        title={formatNumberFull(video.comments)}
                      >
                        {formatNumber(video.comments)}
                      </td>

                      {/* Engagement badge */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${getEngagementColor(video.engagement)}`}
                        >
                          {video.engagement.toFixed(2)}%
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums font-mono text-xs">
                        {formatDuration(video.duration)}
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(video.publishedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Primera pagina"
            >
              &laquo;
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Pagina anterior"
            >
              &lsaquo;
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-xs text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                      page === item
                        ? "bg-red-500/20 border-red-500/40 text-red-400 font-semibold"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Pagina siguiente"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Ultima pagina"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
