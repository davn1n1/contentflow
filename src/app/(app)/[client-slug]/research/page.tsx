"use client";

import { useState, useMemo } from "react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useResearchList, useResearchDetail } from "@/lib/hooks/use-research";
import { ResearchDetailPanel } from "@/components/research/research-detail";
import { cn } from "@/lib/utils";
import { Bot, CalendarDays, Sparkles } from "lucide-react";
import type { Research } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sin fecha";
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return "Hoy";
  if (d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate()) return "Ayer";
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────

export default function ResearchPage() {
  const { currentAccount } = useAccountStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: researchList = [], isLoading: listLoading } = useResearchList({
    accountId: currentAccount?.id,
    limit: 10,
  });

  const { data: researchDetail, isLoading: detailLoading } = useResearchDetail(selectedId);

  // Auto-select first item when list loads
  if (researchList.length > 0 && !selectedId && !listLoading) {
    setSelectedId(researchList[0].id);
  }

  // Show only last 3 research entries
  const recentItems = useMemo(() => researchList.slice(0, 3), [researchList]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ─── Top: Research Selector (last 3) ─── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Research</h1>
            <p className="text-xs text-muted-foreground">Últimas investigaciones de tendencias</p>
          </div>
        </div>

        {/* Research cards — horizontal row */}
        {listLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay research disponible</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {recentItems.map((item) => (
              <ResearchCard
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Bottom: Full-width Detail ─── */}
      <div className="flex-1 overflow-hidden border-t border-border bg-background">
        <ResearchDetailPanel research={researchDetail} isLoading={detailLoading} />
      </div>
    </div>
  );
}

// ─── Research Card ────────────────────────────────────────

function ResearchCard({ item, isSelected, onSelect }: { item: Research; isSelected: boolean; onSelect: () => void }) {
  const today = isToday(item.fecha);
  const dateLabel = formatDateLabel(item.fecha);
  const fullDate = formatFullDate(item.fecha);
  const time = formatTime(item.fecha);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-xl border p-4 transition-all duration-300 overflow-hidden group",
        isSelected
          ? "border-primary/40 bg-primary/[0.06] shadow-md shadow-primary/10"
          : "border-border bg-card hover:border-primary/20 hover:bg-muted/30",
        today && !isSelected && "border-emerald-500/30 bg-emerald-500/[0.04]"
      )}
    >
      {/* Animated glow for today's research */}
      {today && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-shimmer" />
          <div className="absolute inset-[1px] rounded-xl bg-card" />
        </div>
      )}

      <div className="relative z-10">
        {/* Date — big and prominent */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {today ? (
              <>
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-lg font-bold text-emerald-400">Hoy</span>
              </>
            ) : (
              <>
                <CalendarDays className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                <span className={cn(
                  "text-lg font-bold",
                  dateLabel === "Ayer" ? "text-blue-400" : "text-foreground/70"
                )}>
                  {dateLabel}
                </span>
              </>
            )}
          </div>
          {today && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold rounded-full uppercase">
              <Sparkles className="w-3 h-3" /> Nuevo
            </span>
          )}
        </div>

        {/* Full date + time */}
        <p className="text-sm font-medium text-foreground/80 mb-1">{fullDate}</p>
        <p className="text-xs text-muted-foreground">{time}</p>

        {/* Title */}
        <p className="text-xs text-muted-foreground/70 mt-2 truncate">
          {item.titulo || "Research"}
        </p>

        {/* Status */}
        {item.status ? (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium mt-2",
            item.status.toLowerCase().includes("ok") ? "bg-emerald-500/15 text-emerald-400" :
            item.status.toLowerCase().includes("actual") ? "bg-amber-500/15 text-amber-400" :
            "bg-muted text-muted-foreground"
          )}>
            {item.status}
          </span>
        ) : null}
      </div>
    </button>
  );
}
