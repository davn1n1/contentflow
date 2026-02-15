"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";

// --- Global debug log store (singleton) ---
interface DebugEntry {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  source: string;
  message: string;
  data?: unknown;
}

let entries: DebugEntry[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

export function debugLog(
  level: DebugEntry["level"],
  source: string,
  message: string,
  data?: unknown
) {
  // Only log on localhost
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") return;

  entries = [
    ...entries,
    {
      id: nextId++,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour12: false, fractionalSecondDigits: 3 }),
      level,
      source,
      message,
      data,
    },
  ];
  // Keep max 200 entries
  if (entries.length > 200) entries = entries.slice(-200);
  emitChange();
}

export function clearDebugLog() {
  entries = [];
  nextId = 0;
  emitChange();
}

function useDebugEntries(): DebugEntry[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => entries,
    () => []
  );
}

// --- Check if debug mode is active ---
export function useIsDebugMode(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") return false;
      if (window.location.hostname !== "localhost") return false;
      return new URLSearchParams(window.location.search).has("debug");
    },
    () => false
  );
}

// --- Visual Panel Component ---
const LEVEL_STYLES: Record<DebugEntry["level"], { bg: string; text: string; dot: string }> = {
  info: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  warn: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  error: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  success: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
};

export function DebugPanel() {
  const isDebug = useIsDebugMode();
  const allEntries = useDebugEntries();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<DebugEntry["level"] | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const copyAll = useCallback(() => {
    const text = allEntries
      .map((e) => `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.source}] ${e.message}${e.data ? "\n  " + JSON.stringify(e.data, null, 2) : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  }, [allEntries]);

  if (!isDebug) return null;

  const filtered = filter === "all" ? allEntries : allEntries.filter((e) => e.level === filter);
  const errorCount = allEntries.filter((e) => e.level === "error").length;
  const warnCount = allEntries.filter((e) => e.level === "warn").length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] font-mono text-xs">
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-t border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-wider text-purple-400">DEBUG</span>
          <span>{allEntries.length} logs</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px]">
              {errorCount} errors
            </span>
          )}
          {warnCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px]">
              {warnCount} warns
            </span>
          )}
        </div>
        <span className="text-[10px]">{isOpen ? "▼ Cerrar" : "▲ Abrir"}</span>
      </button>

      {/* Panel body */}
      {isOpen && (
        <div className="bg-zinc-950 border-t border-zinc-800 max-h-[40vh] flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
            {(["all", "error", "warn", "info", "success"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setFilter(l)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filter === l
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {l === "all" ? "Todo" : l.toUpperCase()}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={copyAll} className="text-zinc-500 hover:text-zinc-300 text-[10px]">
              Copiar todo
            </button>
            <button onClick={clearDebugLog} className="text-zinc-500 hover:text-red-400 text-[10px]">
              Limpiar
            </button>
          </div>

          {/* Entries */}
          <div ref={scrollRef} className="overflow-y-auto flex-1 divide-y divide-zinc-900">
            {filtered.length === 0 && (
              <div className="p-4 text-center text-zinc-600">
                Sin logs. Las llamadas API apareceran aqui.
              </div>
            )}
            {filtered.map((entry) => {
              const style = LEVEL_STYLES[entry.level];
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`px-3 py-1.5 hover:bg-zinc-900/50 cursor-pointer ${style.bg}`}
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${style.dot}`} />
                    <span className="text-zinc-600 flex-shrink-0 w-20">{entry.timestamp}</span>
                    <span className={`flex-shrink-0 w-16 font-semibold ${style.text}`}>
                      [{entry.source}]
                    </span>
                    <span className="text-zinc-300 flex-1 break-all">{entry.message}</span>
                  </div>
                  {isExpanded && entry.data !== undefined && (
                    <pre className="mt-1 ml-[9.5rem] text-[10px] text-zinc-500 bg-zinc-900 rounded p-2 overflow-x-auto max-h-48">
                      {typeof entry.data === "string"
                        ? entry.data
                        : JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
