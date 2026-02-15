"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

function formatDateEs(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getPresets(): DateRange[] {
  const now = new Date();
  const today = toYMD(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);

  const d14 = new Date(now);
  d14.setDate(d14.getDate() - 14);

  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);

  // Current month
  const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Previous month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const d90 = new Date(now);
  d90.setDate(d90.getDate() - 90);

  const d365 = new Date(now);
  d365.setDate(d365.getDate() - 365);

  return [
    { startDate: today, endDate: today, label: "Hoy" },
    { startDate: toYMD(yesterday), endDate: toYMD(yesterday), label: "Ayer" },
    { startDate: toYMD(d7), endDate: today, label: "7 dias" },
    { startDate: toYMD(d14), endDate: today, label: "14 dias" },
    { startDate: toYMD(d30), endDate: today, label: "Ultimo mes" },
    { startDate: toYMD(curMonthStart), endDate: today, label: "Mes actual" },
    { startDate: toYMD(prevMonthStart), endDate: toYMD(prevMonthEnd), label: "Mes anterior" },
    { startDate: toYMD(d90), endDate: today, label: "3 meses" },
    { startDate: toYMD(d365), endDate: today, label: "12 meses" },
    { startDate: "2015-01-01", endDate: today, label: "Total" },
  ];
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const ref = useRef<HTMLDivElement>(null);
  const presets = getPresets();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handlePreset = (preset: DateRange) => {
    onChange(preset);
    setCustomStart(preset.startDate);
    setCustomEnd(preset.endDate);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({
        startDate: customStart,
        endDate: customEnd,
        label: `${formatDateEs(customStart)} - ${formatDateEs(customEnd)}`,
      });
      setIsOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all",
          "bg-muted/30 border-border text-foreground hover:bg-muted/50",
          isOpen && "ring-1 ring-purple-500/40 border-purple-500/40"
        )}
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="font-medium">{value.label}</span>
        <svg className={cn("w-3 h-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl shadow-black/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Presets */}
          <div className="p-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Periodos
            </p>
            <div className="grid grid-cols-2 gap-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md text-left transition-colors",
                    value.label === p.label
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="border-t border-border p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Rango personalizado
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs bg-muted/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs bg-muted/50 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              />
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd || customStart > customEnd}
                className="px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Default range: Total
export function getDefaultDateRange(): DateRange {
  return {
    startDate: "2015-01-01",
    endDate: new Date().toISOString().split("T")[0],
    label: "Total",
  };
}
