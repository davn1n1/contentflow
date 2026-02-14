"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
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
  rose: { wave: "#4a3a42", progress: "#f43f5e", cursor: "#f43f5e", btn: "bg-rose-600 hover:bg-rose-500", ring: "ring-rose-400/30" },
  violet: { wave: "#3a3a52", progress: "#8b5cf6", cursor: "#8b5cf6", btn: "bg-violet-600 hover:bg-violet-500", ring: "ring-violet-400/30" },
  sky: { wave: "#2a3a4a", progress: "#38bdf8", cursor: "#38bdf8", btn: "bg-sky-600 hover:bg-sky-500", ring: "ring-sky-400/30" },
  amber: { wave: "#4a3a2a", progress: "#f59e0b", cursor: "#f59e0b", btn: "bg-amber-600 hover:bg-amber-500", ring: "ring-amber-400/30" },
  emerald: { wave: "#2a4a3a", progress: "#10b981", cursor: "#10b981", btn: "bg-emerald-600 hover:bg-emerald-500", ring: "ring-emerald-400/30" },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WaveformAudioPlayer({
  url,
  color = "rose",
  height = 48,
  compact = false,
  className,
}: WaveformAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const colors = COLOR_MAP[color];

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url,
    waveColor: colors.wave,
    progressColor: colors.progress,
    cursorColor: colors.cursor,
    cursorWidth: 2,
    barWidth: compact ? 2 : 3,
    barGap: compact ? 1 : 2,
    barRadius: 3,
    height,
    normalize: true,
  });

  useEffect(() => {
    if (wavesurfer) {
      const onReady = () => setDuration(wavesurfer.getDuration());
      wavesurfer.on("ready", onReady);
      return () => { wavesurfer.un("ready", onReady); };
    }
  }, [wavesurfer]);

  const onPlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    wavesurfer?.playPause();
  }, [wavesurfer]);

  return (
    <div
      className={cn(
        "rounded-lg border bg-background/60 backdrop-blur-sm",
        compact ? "p-2" : "p-3",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
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

        {/* Waveform container */}
        <div ref={containerRef} className="flex-1 min-w-0" />

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

/** Minimal inline waveform for table cells — just shows a tiny waveform bar */
export function WaveformMini({ url, color = "rose" }: { url: string; color?: WaveformAudioPlayerProps["color"] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = COLOR_MAP[color || "rose"];

  const { wavesurfer, isPlaying } = useWavesurfer({
    container: containerRef,
    url,
    waveColor: colors.wave,
    progressColor: colors.progress,
    cursorColor: "transparent",
    barWidth: 1,
    barGap: 1,
    barRadius: 1,
    height: 20,
    normalize: true,
    interact: false,
  });

  const onPlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    wavesurfer?.playPause();
  }, [wavesurfer]);

  return (
    <div
      className="flex items-center gap-1 cursor-pointer group"
      onClick={onPlayPause}
    >
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
      <div ref={containerRef} className="w-16" />
    </div>
  );
}
