"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Research } from "@/types/database";

interface ResearchListProps {
  items: Research[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }) + "  " + d.toLocaleTimeString("es-ES", {
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

export function ResearchList({ items, selectedId, onSelect, isLoading }: ResearchListProps) {
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
    <div className="space-y-1 p-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            "w-full text-left p-3 rounded-lg transition-all duration-200",
            selectedId === item.id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-muted border border-transparent"
          )}
        >
          <div className="flex items-start gap-3">
            {/* Thumbnail placeholder */}
            <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
              <span className="text-lg">🤖</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                selectedId === item.id ? "text-primary" : "text-foreground"
              )}>
                {item.titulo || "Research"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(item.fecha)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
