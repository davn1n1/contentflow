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
}: WaveformAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const colors = COLOR_MAP[color];

  // Sync play state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onTimeUpdate = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [isDragging]);

  // Reset when URL changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
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
