"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useResearchList, useResearchDetail } from "@/lib/hooks/use-research";
import { ResearchDetailPanel } from "@/components/research/research-detail";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Bot, CalendarDays, Plus, Loader2, Shield, CheckCircle2, XCircle } from "lucide-react";
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
  type BtnState = "idle" | "confirming" | "sending" | "sent" | "error";
  const [btnState, setBtnState] = useState<BtnState>("idle");
  const [polling, setPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<BtnState>("idle");
  const prevCountRef = useRef<number>(0);
  const queryClient = useQueryClient();
  stateRef.current = btnState;

  const { data: researchList = [], isLoading: listLoading } = useResearchList({
    accountId: currentAccount?.id,
    limit: 10,
  });

  const { data: researchDetail, isLoading: detailLoading } = useResearchDetail(selectedId);

  // Auto-select first item when list loads
  if (researchList.length > 0 && !selectedId && !listLoading) {
    setSelectedId(researchList[0].id);
  }

  // Polling: refetch list every 5s after webhook sent, detect new record
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["research", "list"] });
    }, 5000);
    // Stop polling after 2 minutes
    pollTimerRef.current = setTimeout(() => setPolling(false), 120_000);
    return () => {
      clearInterval(interval);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [polling, queryClient]);

  // Detect new record appearing and auto-select it
  useEffect(() => {
    if (polling && researchList.length > prevCountRef.current && researchList.length > 0) {
      setSelectedId(researchList[0].id);
    }
    prevCountRef.current = researchList.length;
  }, [researchList, polling]);

  // Show only last 3 research entries
  const recentItems = useMemo(() => researchList.slice(0, 3), [researchList]);

  // Auto-dismiss confirming after 5s
  useEffect(() => {
    if (btnState === "confirming") {
      timerRef.current = setTimeout(() => setBtnState("idle"), 5000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [btnState]);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleClick = useCallback(async () => {
    const cur = stateRef.current;
    if (cur === "sent" || cur === "error") { setBtnState("idle"); return; }
    if (cur === "idle") { setBtnState("confirming"); return; }
    if (cur === "confirming") {
      if (timerRef.current) clearTimeout(timerRef.current);
      const recordId = currentAccount?.airtable_id;
      if (!recordId) return;

      setBtnState("sending");
      try {
        const res = await fetch("/api/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ActualizaResearch", recordId }),
        });
        if (!res.ok) throw new Error("Webhook failed");
        setBtnState("sent");
        setPolling(true);
        setTimeout(() => setBtnState("idle"), 4000);
      } catch {
        setBtnState("error");
        setTimeout(() => setBtnState("idle"), 3000);
      }
    }
  }, [currentAccount?.airtable_id]);

  return (
    <div className="flex flex-col min-h-0">
      {/* ─── Top: Research Selector (last 3) ─── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3">
        {/* Header + Cards inline */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <Bot className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-foreground">Research</h1>
          </div>

          {/* Research cards — compact horizontal row */}
          <div className="flex-1">
            {listLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 flex-1 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : recentItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay research disponible</p>
            ) : (
              <div className="flex gap-2">
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

          {/* Nuevo Research button — double-confirm pattern */}
          <div className="flex flex-col items-center flex-shrink-0">
            <button
              onClick={handleClick}
              disabled={btnState === "sending" || !currentAccount?.airtable_id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border shadow-sm",
                btnState === "idle" && "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white cursor-pointer",
                btnState === "confirming" && "bg-amber-500 hover:bg-amber-400 border-amber-400 text-black cursor-pointer animate-pulse",
                btnState === "sending" && "bg-blue-600/50 border-blue-500/50 text-white/70 cursor-wait",
                btnState === "sent" && "bg-emerald-600 border-emerald-500 text-white cursor-pointer",
                btnState === "error" && "bg-red-600 border-red-500 text-white cursor-pointer"
              )}
            >
              {btnState === "idle" && <><Plus className="w-3.5 h-3.5" /> Nuevo Research</>}
              {btnState === "confirming" && <><Shield className="w-3.5 h-3.5" /> Confirmar — Click para ejecutar</>}
              {btnState === "sending" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Lanzando...</>}
              {btnState === "sent" && <><CheckCircle2 className="w-3.5 h-3.5" /> Research lanzado</>}
              {btnState === "error" && <><XCircle className="w-3.5 h-3.5" /> Error</>}
            </button>
            {btnState === "confirming" && (
              <p className="text-[10px] text-center text-amber-400/80 animate-pulse mt-1">
                Se reiniciará en 5s si no confirmas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom: Full-width Detail ─── */}
      <div className="border-t border-border bg-background">
        <ResearchDetailPanel research={researchDetail} isLoading={detailLoading} />
      </div>
    </div>
  );
}

// ─── Research Card ────────────────────────────────────────

function ResearchCard({ item, isSelected, onSelect }: { item: Research; isSelected: boolean; onSelect: () => void }) {
  const today = isToday(item.fecha);
  const dateLabel = formatDateLabel(item.fecha);
  const time = formatTime(item.fecha);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex-1 flex items-center gap-2 text-left rounded-lg border px-3 py-2 transition-all duration-200 overflow-hidden",
        isSelected
          ? "border-primary/40 bg-primary/[0.06] shadow-sm shadow-primary/10"
          : "border-border bg-card hover:border-primary/20 hover:bg-muted/30",
        today && !isSelected && "border-emerald-500/30 bg-emerald-500/[0.04]"
      )}
    >
      {/* Animated glow for today */}
      {today && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/15 to-emerald-500/0 animate-shimmer" />
          <div className="absolute inset-[1px] rounded-lg bg-card" />
        </div>
      )}

      <div className="relative z-10 flex items-center gap-2 min-w-0 w-full">
        {today ? (
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        ) : (
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
        )}

        <span className={cn(
          "text-sm font-semibold flex-shrink-0",
          today ? "text-emerald-400" : dateLabel === "Ayer" ? "text-blue-400" : "text-foreground/70"
        )}>
          {dateLabel}
        </span>

        <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>

        {item.status && (
          <span className={cn(
            "ml-auto px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0",
            item.status.toLowerCase().includes("ok") ? "bg-emerald-500/15 text-emerald-400" :
            item.status.toLowerCase().includes("actual") ? "bg-amber-500/15 text-amber-400" :
            "bg-muted text-muted-foreground"
          )}>
            {item.status}
          </span>
        )}
      </div>
    </button>
  );
}
