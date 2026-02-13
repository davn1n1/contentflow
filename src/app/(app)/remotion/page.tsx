"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Film, Clock, CheckCircle, AlertCircle, Play, ArrowRight } from "lucide-react";

interface TimelineEntry {
  id: string;
  video_id: string;
  video_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  remotion_timeline: {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
    tracks: { id: string; type: string; clips: unknown[] }[];
  };
}

export default function RemotionPage() {
  const [timelines, setTimelines] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimelines() {
      try {
        const res = await fetch("/api/remotion/convert");
        if (!res.ok) throw new Error("Failed to fetch timelines");
        const data = await res.json();
        setTimelines(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading timelines");
      } finally {
        setLoading(false);
      }
    }
    fetchTimelines();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "converted":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "rendering":
        return <Clock className="h-4 w-4 text-yellow-400 animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (frames: number, fps: number) => {
    const seconds = Math.round(frames / fps);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Remotion</h1>
        <p className="text-sm text-muted-foreground">
          Preview de videos convertidos desde Shotstack JSON
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && timelines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Film className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium text-muted-foreground">
            No hay videos convertidos todavia
          </h2>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-md">
            Cuando n8n envie un JSON de Shotstack al endpoint /api/remotion/convert,
            aparecera aqui para previsualizar con Remotion Player.
          </p>
        </div>
      )}

      {!loading && timelines.length > 0 && (
        <div className="space-y-3">
          {timelines.map((entry) => {
            const tl = entry.remotion_timeline;
            const visualTracks = tl.tracks.filter((t) => t.type === "visual");
            const audioTracks = tl.tracks.filter((t) => t.type === "audio");
            const totalClips = tl.tracks.reduce((sum, t) => sum + t.clips.length, 0);

            return (
              <Link
                key={entry.id}
                href={`/remotion/${entry.id}`}
                className="block rounded-lg border border-border/50 bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Play className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {entry.video_name || entry.video_id}
                        </span>
                        {statusIcon(entry.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{tl.width}x{tl.height}</span>
                        <span>{tl.fps}fps</span>
                        <span>{formatDuration(tl.durationInFrames, tl.fps)}</span>
                        <span>{visualTracks.length} video tracks</span>
                        <span>{audioTracks.length} audio tracks</span>
                        <span>{totalClips} clips</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
