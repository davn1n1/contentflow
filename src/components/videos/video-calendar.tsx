"use client";

import { useState, useMemo, useCallback, type DragEvent } from "react";
import Link from "next/link";
import type { Video } from "@/types/database";
import { ChevronLeft, ChevronRight, Film, ExternalLink, GripVertical, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCalendarProps {
  videos: Video[];
  clientSlug: string;
  onVideoDateChange?: (videoId: string, newDate: string) => void;
}

type CalendarView = "month" | "week" | "day";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

// ─── Timezone helpers (Europe/Madrid) ─────────────────────

/** Extract HH:mm from a scheduled_date ISO string, converted to Madrid timezone */
function getTimeInMadrid(scheduledDate: string | null): string {
  if (!scheduledDate || scheduledDate.length <= 10) return "17:00";
  const d = new Date(scheduledDate);
  if (isNaN(d.getTime())) return "17:00";
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Build ISO datetime string with Madrid timezone offset (CET +01:00 / CEST +02:00) */
function toISOWithMadridTZ(dateStr: string, timeStr: string): string {
  // Determine CET vs CEST by checking the timezone abbreviation for this date
  const refDate = new Date(`${dateStr}T12:00:00Z`);
  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    timeZoneName: "short",
  }).formatToParts(refDate);
  const tzName = tzParts.find((p) => p.type === "timeZoneName")?.value;
  const offset = tzName === "CEST" ? "+02:00" : "+01:00";
  return `${dateStr}T${timeStr}:00${offset}`;
}

// ─── Drag & Drop helpers ──────────────────────────────────

function handleDragStart(e: DragEvent, videoId: string) {
  e.dataTransfer.setData("text/plain", videoId);
  e.dataTransfer.effectAllowed = "move";
  if (e.currentTarget instanceof HTMLElement) {
    setTimeout(() => {
      (e.currentTarget as HTMLElement).style.opacity = "0.4";
    }, 0);
  }
}

function handleDragEnd(e: DragEvent) {
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = "";
  }
}

// ─── Hover detail card ────────────────────────────────────

function VideoHoverCard({
  video,
  clientSlug,
  children,
  onSaveTime,
}: {
  video: Video;
  clientSlug: string;
  children: React.ReactNode;
  onSaveTime?: (datetime: string) => void;
}) {
  const dateStr = (video.scheduled_date || video.created_time || "").substring(0, 10);
  const currentTime = getTimeInMadrid(video.scheduled_date);
  const [time, setTime] = useState(currentTime);
  const [saved, setSaved] = useState(false);

  function handleSaveTime() {
    if (!onSaveTime || !dateStr) return;
    const iso = toISOWithMadridTZ(dateStr, time);
    onSaveTime(iso);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="relative group/hover">
      {children}
      {/* Hover popover — pb-3 creates invisible bridge so cursor can travel to the card */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full z-50 pb-3 hidden group-hover/hover:block">
        <div className="w-64 rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Portada */}
          {video.portada_a ? (
            <div className="relative aspect-video bg-muted">
              <img
                src={video.portada_a}
                alt={video.titulo || `#${video.name}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                #{video.name}
              </span>
            </div>
          ) : (
            <div className="relative aspect-video bg-muted flex items-center justify-center">
              <Film className="w-8 h-8 text-muted-foreground/30" />
              <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                #{video.name}
              </span>
            </div>
          )}
          {/* Info + Buttons */}
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
              {video.titulo || "Sin título"}
            </p>
            {video.estado && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                video.estado === "Published" ? "bg-success/10 text-success" :
                video.estado === "In Progress" ? "bg-info/10 text-info" :
                video.estado === "Generating" ? "bg-warning/10 text-warning" :
                "bg-muted text-muted-foreground"
              )}>
                {video.estado}
              </span>
            )}

            {/* Time picker */}
            {onSaveTime && dateStr && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => { setTime(e.target.value); setSaved(false); }}
                  className="flex-1 text-xs bg-muted border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onClick={(e) => e.preventDefault()}
                />
                <button
                  onClick={(e) => { e.preventDefault(); handleSaveTime(); }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                    saved
                      ? "bg-success/10 text-success"
                      : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                  )}
                >
                  {saved ? <Check className="w-3 h-3" /> : "Guardar"}
                </button>
                <span className="text-[9px] text-muted-foreground flex-shrink-0">CET</span>
              </div>
            )}

            <Link
              href={`/${clientSlug}/videos/${video.id}`}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Ver Video
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video card used in week and day views
function VideoItem({
  video,
  clientSlug,
  draggable: isDraggable,
  onSaveTime,
}: {
  video: Video;
  clientSlug: string;
  draggable?: boolean;
  onSaveTime?: (datetime: string) => void;
}) {
  return (
    <VideoHoverCard video={video} clientSlug={clientSlug} onSaveTime={onSaveTime}>
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => handleDragStart(e, video.id) : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
        className={cn(
          "block rounded-lg border border-border hover:border-primary/40 transition-all group overflow-hidden bg-background",
          isDraggable && "cursor-grab active:cursor-grabbing"
        )}
      >
        <Link href={`/${clientSlug}/videos/${video.id}`} className="block">
          {/* Thumbnail */}
          {video.portada_a ? (
            <div className="relative aspect-video bg-muted">
              <img
                src={video.portada_a}
                alt={video.titulo || `#${video.name}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                #{video.name}
              </span>
            </div>
          ) : (
            <div className="relative aspect-video bg-muted flex items-center justify-center">
              <Film className="w-5 h-5 text-muted-foreground/40" />
              <span className="absolute bottom-1 left-1 text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                #{video.name}
              </span>
            </div>
          )}
          {/* Title */}
          <div className="px-2 py-1.5">
            <p className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {video.titulo || "Sin título"}
            </p>
          </div>
        </Link>
        {isDraggable && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </VideoHoverCard>
  );
}

// Compact video pill for month view
function VideoPill({
  video,
  clientSlug,
  draggable: isDraggable,
  onSaveTime,
}: {
  video: Video;
  clientSlug: string;
  draggable?: boolean;
  onSaveTime?: (datetime: string) => void;
}) {
  return (
    <VideoHoverCard video={video} clientSlug={clientSlug} onSaveTime={onSaveTime}>
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => handleDragStart(e, video.id) : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-primary/10 group",
          isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        )}
      >
        {isDraggable && (
          <GripVertical className="w-2.5 h-2.5 flex-shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        )}
        {video.portada_a ? (
          <img src={video.portada_a} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
        ) : (
          <Film className="w-3 h-3 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
        )}
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
    </VideoHoverCard>
  );
}

export function VideoCalendar({ videos, clientSlug, onVideoDateChange }: VideoCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const videosByDate = useMemo(() => {
    const map: Record<string, Video[]> = {};
    for (const video of videos) {
      const date = video.scheduled_date || video.created_time;
      if (!date) continue;
      const key = date.substring(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(video);
    }
    return map;
  }, [videos]);

  const todayStr = toDateStr(today);
  const canDrag = !!onVideoDateChange;

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const videoId = e.dataTransfer.getData("text/plain");
    if (!videoId || !onVideoDateChange) return;

    const video = videos.find((v) => v.id === videoId);
    const currentVideoDate = (video?.scheduled_date || video?.created_time || "").substring(0, 10);
    if (currentVideoDate === targetDate) return;

    onVideoDateChange(videoId, targetDate);
  }, [onVideoDateChange, videos]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  // Time assignment handler: reuses onVideoDateChange with full datetime ISO
  const handleTimeAssign = useCallback((videoId: string, datetime: string) => {
    if (!onVideoDateChange) return;
    onVideoDateChange(videoId, datetime);
  }, [onVideoDateChange]);

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (calendarView === "month") {
      d.setMonth(d.getMonth() + dir);
    } else if (calendarView === "week") {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setDate(d.getDate() + dir);
    }
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  // Header label
  let headerLabel = "";
  if (calendarView === "month") {
    headerLabel = `${MONTHS[currentMonth]} ${currentYear}`;
  } else if (calendarView === "week") {
    const monday = getMonday(currentDate);
    const sunday = addDays(monday, 6);
    const mLabel = `${monday.getDate()} ${MONTHS[monday.getMonth()].substring(0, 3)}`;
    const sLabel = `${sunday.getDate()} ${MONTHS[sunday.getMonth()].substring(0, 3)} ${sunday.getFullYear()}`;
    headerLabel = `${mLabel} - ${sLabel}`;
  } else {
    const weekdayIdx = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
    headerLabel = `${WEEKDAYS_FULL[weekdayIdx]} ${currentDate.getDate()} ${MONTHS[currentMonth]} ${currentYear}`;
  }

  return (
    <div className="glass-card rounded-xl overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold text-foreground ml-1">
            {headerLabel}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
          >
            Hoy
          </button>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  calendarView === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      {calendarView === "month" && (
        <MonthView
          currentMonth={currentMonth}
          currentYear={currentYear}
          videosByDate={videosByDate}
          todayStr={todayStr}
          clientSlug={clientSlug}
          canDrag={canDrag}
          dragOverDate={dragOverDate}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onTimeAssign={onVideoDateChange ? handleTimeAssign : undefined}
        />
      )}
      {calendarView === "week" && (
        <WeekView
          currentDate={currentDate}
          videosByDate={videosByDate}
          todayStr={todayStr}
          clientSlug={clientSlug}
          canDrag={canDrag}
          dragOverDate={dragOverDate}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onTimeAssign={onVideoDateChange ? handleTimeAssign : undefined}
        />
      )}
      {calendarView === "day" && (
        <DayView
          currentDate={currentDate}
          videosByDate={videosByDate}
          todayStr={todayStr}
          clientSlug={clientSlug}
          onTimeAssign={onVideoDateChange ? handleTimeAssign : undefined}
        />
      )}
    </div>
  );
}

// ─── Drop target props type ──────────────────────────────

interface DropTargetProps {
  canDrag: boolean;
  dragOverDate: string | null;
  onDrop: (e: DragEvent<HTMLDivElement>, dateStr: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, dateStr: string) => void;
  onDragLeave: () => void;
}

// ─── Month View ───────────────────────────────────────────

function MonthView({
  currentMonth,
  currentYear,
  videosByDate,
  todayStr,
  clientSlug,
  canDrag,
  dragOverDate,
  onDrop,
  onDragOver,
  onDragLeave,
  onTimeAssign,
}: {
  currentMonth: number;
  currentYear: number;
  videosByDate: Record<string, Video[]>;
  todayStr: string;
  clientSlug: string;
  onTimeAssign?: (videoId: string, datetime: string) => void;
} & DropTargetProps) {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-border/30 bg-muted/20" />;
          }
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayVideos = videosByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isDragOver = dragOverDate === dateStr;

          return (
            <div
              key={dateStr}
              className={cn(
                "min-h-[100px] border-b border-r border-border/30 p-1.5 transition-colors",
                isToday && "bg-primary/5",
                dayVideos.length > 0 && "hover:bg-muted/30",
                isDragOver && "bg-primary/10 ring-2 ring-inset ring-primary/40"
              )}
              onDragOver={canDrag ? (e) => onDragOver(e, dateStr) : undefined}
              onDragLeave={canDrag ? onDragLeave : undefined}
              onDrop={canDrag ? (e) => onDrop(e, dateStr) : undefined}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  {day}
                </span>
                {dayVideos.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayVideos.length - 3}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayVideos.slice(0, 3).map((video) => (
                  <VideoPill
                    key={video.id}
                    video={video}
                    clientSlug={clientSlug}
                    draggable={canDrag}
                    onSaveTime={onTimeAssign ? (dt) => onTimeAssign(video.id, dt) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Week View ───────────────────────────────────────────

function WeekView({
  currentDate,
  videosByDate,
  todayStr,
  clientSlug,
  canDrag,
  dragOverDate,
  onDrop,
  onDragOver,
  onDragLeave,
  onTimeAssign,
}: {
  currentDate: Date;
  videosByDate: Record<string, Video[]>;
  todayStr: string;
  clientSlug: string;
  onTimeAssign?: (videoId: string, datetime: string) => void;
} & DropTargetProps) {
  const monday = getMonday(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="grid grid-cols-7 divide-x divide-border">
      {days.map((d, i) => {
        const dateStr = toDateStr(d);
        const dayVideos = videosByDate[dateStr] || [];
        const isToday = dateStr === todayStr;
        const isDragOver = dragOverDate === dateStr;

        return (
          <div
            key={dateStr}
            className={cn(
              "min-h-[400px] transition-colors",
              isDragOver && "bg-primary/10"
            )}
            onDragOver={canDrag ? (e) => onDragOver(e, dateStr) : undefined}
            onDragLeave={canDrag ? onDragLeave : undefined}
            onDrop={canDrag ? (e) => onDrop(e, dateStr) : undefined}
          >
            {/* Day header */}
            <div className={cn(
              "px-2 py-2 border-b border-border text-center",
              isToday && "bg-primary/5",
              isDragOver && "bg-primary/10"
            )}>
              <div className="text-[10px] text-muted-foreground uppercase">{WEEKDAYS[i]}</div>
              <div className={cn(
                "text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full mx-auto",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {d.getDate()}
              </div>
            </div>
            {/* Videos */}
            <div className="p-1.5 space-y-1.5">
              {dayVideos.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  clientSlug={clientSlug}
                  draggable={canDrag}
                  onSaveTime={onTimeAssign ? (dt) => onTimeAssign(video.id, dt) : undefined}
                />
              ))}
              {dayVideos.length === 0 && (
                <div className="flex items-center justify-center h-20 text-[10px] text-muted-foreground/50">
                  -
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day View ───────────────────────────────────────────

function DayView({
  currentDate,
  videosByDate,
  todayStr,
  clientSlug,
  onTimeAssign,
}: {
  currentDate: Date;
  videosByDate: Record<string, Video[]>;
  todayStr: string;
  clientSlug: string;
  onTimeAssign?: (videoId: string, datetime: string) => void;
}) {
  const dateStr = toDateStr(currentDate);
  const dayVideos = videosByDate[dateStr] || [];
  const isToday = dateStr === todayStr;

  return (
    <div className={cn("p-6", isToday && "bg-primary/5")}>
      <div className="mb-4 text-center">
        <span className="text-xs text-muted-foreground uppercase">
          {dayVideos.length} video{dayVideos.length !== 1 ? "s" : ""} programado{dayVideos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {dayVideos.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin videos para este día</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {dayVideos.map((video) => {
            const videoDateStr = (video.scheduled_date || video.created_time || "").substring(0, 10);
            const currentTime = getTimeInMadrid(video.scheduled_date);

            return (
              <div key={video.id} className="rounded-xl border border-border hover:border-primary/40 transition-all group overflow-hidden bg-background">
                <Link
                  href={`/${clientSlug}/videos/${video.id}`}
                  className="block"
                >
                  {/* Thumbnail large */}
                  {video.portada_a ? (
                    <div className="relative aspect-video bg-muted">
                      <img
                        src={video.portada_a}
                        alt={video.titulo || `#${video.name}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 text-xs font-mono font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
                        #{video.name}
                      </span>
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-muted flex items-center justify-center">
                      <Film className="w-10 h-10 text-muted-foreground/30" />
                      <span className="absolute top-2 left-2 text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        #{video.name}
                      </span>
                    </div>
                  )}
                  {/* Info */}
                  <div className="p-3 pb-0">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {video.titulo || "Sin título"}
                    </h4>
                    {video.estado && (
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        video.estado === "Published" ? "bg-success/10 text-success" :
                        video.estado === "In Progress" ? "bg-info/10 text-info" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {video.estado}
                      </span>
                    )}
                  </div>
                </Link>
                {/* Time picker inline (day view shows it directly) */}
                {onTimeAssign && videoDateStr && (
                  <DayViewTimePicker
                    videoId={video.id}
                    videoDateStr={videoDateStr}
                    currentTime={currentTime}
                    onTimeAssign={onTimeAssign}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Separate component for day view time picker to manage state per-card
function DayViewTimePicker({
  videoId,
  videoDateStr,
  currentTime,
  onTimeAssign,
}: {
  videoId: string;
  videoDateStr: string;
  currentTime: string;
  onTimeAssign: (videoId: string, datetime: string) => void;
}) {
  const [time, setTime] = useState(currentTime);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const iso = toISOWithMadridTZ(videoDateStr, time);
    onTimeAssign(videoId, iso);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="px-3 py-2 flex items-center gap-1.5 border-t border-border/50">
      <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <input
        type="time"
        value={time}
        onChange={(e) => { setTime(e.target.value); setSaved(false); }}
        className="flex-1 text-xs bg-muted border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleSave}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
          saved
            ? "bg-success/10 text-success"
            : "bg-muted hover:bg-muted/80 text-foreground border border-border"
        )}
      >
        {saved ? <Check className="w-3 h-3" /> : "Guardar"}
      </button>
      <span className="text-[9px] text-muted-foreground flex-shrink-0">CET</span>
    </div>
  );
}
