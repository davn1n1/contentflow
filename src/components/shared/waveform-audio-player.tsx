"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaveformAudioPlayerProps {
  url: string;
  /** Color accent: matches zone color */
  color?: "rose" | "violet" | "sky" | "amber" | "emerald";
  /** Height of the waveform in px */
  height?: number;
  /** Compact mode for table cells */
  compact?: boolean;
  className?: string;
  /** Playback callbacks for synced captions */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

const COLOR_MAP = {
  rose: { progress: "bg-rose-500", track: "bg-rose-500/20", btn: "bg-rose-600 hover:bg-rose-500", ring: "ring-rose-400/30", thumb: "bg-rose-400" },
  violet: { progress: "bg-violet-500", track: "bg-violet-500/20", btn: "bg-violet-600 hover:bg-violet-500", ring: "ring-violet-400/30", thumb: "bg-violet-400" },
  sky: { progress: "bg-sky-500", track: "bg-sky-500/20", btn: "bg-sky-600 hover:bg-sky-500", ring: "ring-sky-400/30", thumb: "bg-sky-400" },
  amber: { progress: "bg-amber-500", track: "bg-amber-500/20", btn: "bg-amber-600 hover:bg-amber-500", ring: "ring-amber-400/30", thumb: "bg-amber-400" },
  emerald: { progress: "bg-emerald-500", track: "bg-emerald-500/20", btn: "bg-emerald-600 hover:bg-emerald-500", ring: "ring-emerald-400/30", thumb: "bg-emerald-400" },
};

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WaveformAudioPlayer({
  url,
  color = "rose",
  height: _height = 48,
  compact = false,
  className,
  onTimeUpdate,
  onPlayStateChange,
}: WaveformAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const colors = COLOR_MAP[color];

  // Stable refs for callbacks (avoid re-registering listeners)
  const onTimeUpdateCbRef = useRef(onTimeUpdate);
  const onPlayStateCbRef = useRef(onPlayStateChange);
  onTimeUpdateCbRef.current = onTimeUpdate;
  onPlayStateCbRef.current = onPlayStateChange;

  // Sync play state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => { setIsPlaying(true); onPlayStateCbRef.current?.(true); };
    const onPause = () => { setIsPlaying(false); onPlayStateCbRef.current?.(false); };
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); onPlayStateCbRef.current?.(false); onTimeUpdateCbRef.current?.(0, audio.duration); };
    const handleTimeUpdate = () => {
      if (!isDragging) setCurrentTime(audio.currentTime);
      onTimeUpdateCbRef.current?.(audio.currentTime, audio.duration);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [isDragging]);

  // Reset when URL changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    onPlayStateCbRef.current?.(false);
  }, [url]);

  const onPlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Seek on track click/drag
  const seekToPosition = useCallback((clientX: number) => {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !duration) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const onTrackMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);

    const onMouseMove = (ev: MouseEvent) => seekToPosition(ev.clientX);
    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [seekToPosition]);

  return (
    <div
      className={cn(
        "rounded-lg border bg-background/60 backdrop-blur-sm",
        compact ? "p-2" : "p-3",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-2">
        {/* Play/Pause button */}
        <button
          onClick={onPlayPause}
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-full text-white transition-all shadow-lg",
            colors.btn, colors.ring,
            compact ? "w-7 h-7 ring-2" : "w-9 h-9 ring-2",
          )}
        >
          {isPlaying ? (
            <Pause className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
          ) : (
            <Play className={cn(compact ? "w-3 h-3" : "w-4 h-4", "ml-0.5")} />
          )}
        </button>

        {/* Progress track */}
        <div
          ref={trackRef}
          className={cn("flex-1 min-w-0 relative cursor-pointer group", compact ? "h-6" : "h-8")}
          onMouseDown={onTrackMouseDown}
        >
          {/* Track background */}
          <div className={cn(
            "absolute inset-y-0 left-0 right-0 my-auto rounded-full",
            colors.track,
            compact ? "h-1.5" : "h-2",
          )} />
          {/* Progress fill */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 my-auto rounded-full transition-[width] duration-75",
              colors.progress,
              compact ? "h-1.5" : "h-2",
            )}
            style={{ width: `${progress}%` }}
          />
          {/* 5-second tick marks */}
          {duration > 0 && Array.from({ length: Math.floor(duration / 5) }, (_, i) => {
            const sec = (i + 1) * 5;
            const pct = (sec / duration) * 100;
            if (pct >= 99) return null;
            return (
              <div
                key={sec}
                className="absolute top-0 bottom-0 flex flex-col items-center justify-end pointer-events-none"
                style={{ left: `${pct}%` }}
              >
                <div className={cn(
                  "w-px bg-muted-foreground/20",
                  compact ? "h-2" : "h-3",
                )} />
                <span className={cn(
                  "font-mono text-muted-foreground/30 leading-none select-none",
                  compact ? "text-[7px]" : "text-[8px]",
                )}>
                  {sec}s
                </span>
              </div>
            );
          })}
          {/* Thumb indicator */}
          <div
            className={cn(
              "absolute inset-y-0 my-auto rounded-full shadow-md transition-[left] duration-75",
              colors.thumb,
              "opacity-0 group-hover:opacity-100",
              isDragging && "opacity-100",
              compact ? "w-2.5 h-2.5" : "w-3 h-3",
            )}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time display */}
        <div className={cn(
          "flex-shrink-0 font-mono text-muted-foreground",
          compact ? "text-[10px]" : "text-xs",
        )}>
          <span className="text-foreground/80">{formatTime(currentTime)}</span>
          <span className="text-muted-foreground/40"> / </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

/** Minimal inline player for table cells — just shows a tiny play button + progress bar */
export function WaveformMini({ url, color = "rose" }: { url: string; color?: WaveformAudioPlayerProps["color"] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const colors = COLOR_MAP[color || "rose"];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };
    const onTimeUpdate = () => {
      if (audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  // Reset when URL changes
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
  }, [url]);

  const onPlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 cursor-pointer group"
      onClick={onPlayPause}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className={cn(
        "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors",
        isPlaying ? colors.btn.split(" ")[0] : "bg-muted-foreground/20 group-hover:bg-muted-foreground/30"
      )}>
        {isPlaying ? (
          <Pause className="w-2 h-2 text-white" />
        ) : (
          <Volume2 className="w-2 h-2 text-muted-foreground group-hover:text-foreground/60" />
        )}
      </div>
      {/* Mini progress bar */}
      <div className="w-16 h-1 rounded-full bg-muted-foreground/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-100", colors.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Synced Captions ─────────────────────────────────────────
// Highlights words proportionally as audio plays — like social media captions

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

function buildWordTimings(text: string, duration: number): WordTiming[] {
  if (!text || !duration || duration <= 0) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Weight each word by character length (longer words take longer to speak)
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const timings: WordTiming[] = [];
  let cursor = 0;

  for (const word of words) {
    const wordDuration = (word.length / totalChars) * duration;
    timings.push({ word, start: cursor, end: cursor + wordDuration });
    cursor += wordDuration;
  }

  return timings;
}

interface SyncedCaptionsProps {
  text: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  /** Color accent for highlighted word */
  color?: "rose" | "violet" | "sky" | "amber" | "emerald";
}

export function SyncedCaptions({ text, currentTime, duration, isPlaying, color = "emerald" }: SyncedCaptionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const timings = useRef<WordTiming[]>([]);

  // Rebuild timings when text or duration changes
  useEffect(() => {
    timings.current = buildWordTimings(text, duration);
  }, [text, duration]);

  // Auto-scroll to keep active word visible
  useEffect(() => {
    if (isPlaying && activeWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const word = activeWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();

      // Scroll if word is below visible area
      if (wordRect.top > containerRect.bottom - 20 || wordRect.bottom < containerRect.top + 20) {
        word.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentTime, isPlaying]);

  const highlightColors = {
    rose: "bg-rose-500/30 text-rose-100",
    violet: "bg-violet-500/30 text-violet-100",
    sky: "bg-sky-500/30 text-sky-100",
    amber: "bg-amber-500/30 text-amber-100",
    emerald: "bg-emerald-500/30 text-emerald-100",
  };

  const pastColors = {
    rose: "text-rose-300/80",
    violet: "text-violet-300/80",
    sky: "text-sky-300/80",
    amber: "text-amber-300/80",
    emerald: "text-emerald-300/80",
  };

  if (!text || timings.current.length === 0) return null;

  // Find current word index
  let activeIdx = -1;
  for (let i = 0; i < timings.current.length; i++) {
    if (currentTime >= timings.current[i].start && currentTime < timings.current[i].end) {
      activeIdx = i;
      break;
    }
  }
  // If past the last word, highlight last
  if (activeIdx === -1 && currentTime > 0 && currentTime >= (timings.current[timings.current.length - 1]?.end ?? 0)) {
    activeIdx = timings.current.length - 1;
  }

  return (
    <div
      ref={containerRef}
      className="max-h-[120px] overflow-y-auto rounded-lg bg-muted/30 px-3 py-2 text-[12px] leading-relaxed"
      onClick={(e) => e.stopPropagation()}
    >
      {timings.current.map((t, i) => {
        const isActive = i === activeIdx && isPlaying;
        const isPast = isPlaying && i < activeIdx;

        return (
          <span key={i}>
            <span
              ref={isActive ? activeWordRef : undefined}
              className={cn(
                "transition-all duration-150",
                isActive && cn("rounded px-0.5 font-semibold", highlightColors[color]),
                isPast && pastColors[color],
                !isActive && !isPast && "text-foreground/60",
              )}
            >
              {t.word}
            </span>
            {" "}
          </span>
        );
      })}
    </div>
  );
}
