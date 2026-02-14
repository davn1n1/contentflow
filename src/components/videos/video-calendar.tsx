"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Video } from "@/types/database";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCalendarProps {
  videos: Video[];
  clientSlug: string;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function VideoCalendar({ videos, clientSlug }: VideoCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const videosByDate = useMemo(() => {
    const map: Record<string, Video[]> = {};
    for (const video of videos) {
      const date = video.scheduled_date || video.created_time;
      if (!date) continue;
      const key = date.substring(0, 10); // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(video);
    }
    return map;
  }, [videos]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = today.toISOString().substring(0, 10);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Fill remaining cells to complete grid
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-base font-semibold text-foreground">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-border/30 bg-muted/20" />;
          }

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayVideos = videosByDate[dateStr] || [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={cn(
                "min-h-[100px] border-b border-r border-border/30 p-1.5 transition-colors",
                isToday && "bg-primary/5",
                dayVideos.length > 0 && "hover:bg-muted/30"
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day}
                </span>
                {dayVideos.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayVideos.length - 3}
                  </span>
                )}
              </div>

              {/* Video items (max 3 visible) */}
              <div className="space-y-0.5">
                {dayVideos.slice(0, 3).map((video) => (
                  <Link
                    key={video.id}
                    href={`/${clientSlug}/videos/${video.id}`}
                    className="block px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-colors hover:bg-primary/10 group"
                    title={video.titulo || `#${video.name}`}
                  >
                    <div className="flex items-center gap-1">
                      <Film className="w-2.5 h-2.5 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span className="truncate text-foreground group-hover:text-primary">
                        #{video.name}
                      </span>
                      {video.estado && (
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          video.estado === "Published" ? "bg-success" :
                          video.estado === "In Progress" ? "bg-info animate-pulse" :
                          video.estado === "Generating" ? "bg-warning animate-pulse" :
                          "bg-muted-foreground"
                        )} />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
