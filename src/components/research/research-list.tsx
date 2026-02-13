"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Research } from "@/types/database";

interface ResearchListProps {
  items: Research[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate();
}

function getDateGroup(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sin fecha";
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const isOk = status.toLowerCase().includes("ok");
  const isUpdating = status.toLowerCase().includes("actualiz");

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        isOk && "bg-emerald-500/20 text-emerald-400",
        isUpdating && "bg-amber-500/20 text-amber-400",
        !isOk && !isUpdating && "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

interface GroupedItem {
  group: string;
  items: Research[];
  isToday: boolean;
}

export function ResearchList({ items, selectedId, onSelect, isLoading }: ResearchListProps) {
  // Group items by date
  const grouped = useMemo(() => {
    const groups = new Map<string, Research[]>();
    for (const item of items) {
      const group = getDateGroup(item.fecha);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(item);
    }
    // Convert to array preserving order (Hoy first, then Ayer, then rest)
    const result: GroupedItem[] = [];
    const order = ["Hoy", "Ayer"];
    for (const key of order) {
      if (groups.has(key)) {
        result.push({ group: key, items: groups.get(key)!, isToday: key === "Hoy" });
        groups.delete(key);
      }
    }
    // Rest sorted by date descending
    const rest = Array.from(groups.entries());
    rest.sort((a, b) => {
      if (a[0] === "Sin fecha") return 1;
      if (b[0] === "Sin fecha") return -1;
      // Parse dates from the first item
      const da = new Date(a[1][0]?.fecha || 0);
      const db = new Date(b[1][0]?.fecha || 0);
      return db.getTime() - da.getTime();
    });
    for (const [key, val] of rest) {
      result.push({ group: key, items: val, isToday: false });
    }
    return result;
  }, [items]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Search className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No research entries found</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {grouped.map(({ group, items: groupItems, isToday: isTodayGroup }) => (
        <div key={group} className="mb-3">
          {/* Date Group Header */}
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
            {isTodayGroup && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isTodayGroup
                  ? "text-emerald-400"
                  : group === "Ayer"
                    ? "text-blue-400"
                    : "text-muted-foreground/60"
              )}
            >
              {group}
            </span>
            <span className="text-xs text-muted-foreground/40">
              ({groupItems.length})
            </span>
          </div>

          {/* Items in this group */}
          <div className="space-y-1">
            {groupItems.map((item) => {
              const itemIsToday = isTodayGroup;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200",
                    selectedId === item.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted border border-transparent",
                    itemIsToday && selectedId !== item.id && "border-emerald-500/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className={cn(
                      "w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden",
                      itemIsToday && "ring-2 ring-emerald-500/30"
                    )}>
                      {item.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">🤖</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          selectedId === item.id ? "text-primary" : "text-foreground"
                        )}>
                          {item.titulo || "Research"}
                        </p>
                        {itemIsToday && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold rounded-md uppercase">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(item.fecha)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
