"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Film,
  Upload,
} from "lucide-react";

interface TimelineEntry {
  id: string;
  video_id: string;
  video_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  render_url?: string;
  remotion_timeline: {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
    tracks: { id: string; type: string; clips: unknown[] }[];
  };
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  converted: { icon: Rocket, color: "text-blue-400", label: "Listo para render" },
  rendering: { icon: Clock, color: "text-yellow-400", label: "Renderizando..." },
  rendered: { icon: CheckCircle, color: "text-green-400", label: "Renderizado" },
  published: { icon: Upload, color: "text-emerald-400", label: "Publicado" },
  failed: { icon: AlertCircle, color: "text-red-400", label: "Error" },
};

function formatDuration(frames: number, fps: number) {
  const seconds = Math.round(frames / fps);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function RemotionLitePage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Remotion Lite</h1>
        <p className="text-sm text-muted-foreground">
          Render rápido — sin editor, directo a Lambda
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
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
          <Rocket className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium text-muted-foreground">
            No hay videos para renderizar
          </h2>
        </div>
      )}

      {!loading && timelines.length > 0 && (
        <div className="space-y-2">
          {timelines.map((entry) => {
            const tl = entry.remotion_timeline;
            const totalClips = tl.tracks.reduce((sum, t) => sum + t.clips.length, 0);
            const cfg = statusConfig[entry.status] || statusConfig.converted;
            const StatusIcon = cfg.icon;

            // Parse #NUM — Title
            const nameMatch = entry.video_name?.match(/^#(\d+)\s*[—–-]\s*(.+)$/);
            const videoNum = nameMatch?.[1];
            const videoTitle = nameMatch?.[2] || entry.video_name || entry.video_id;

            return (
              <Link
                key={entry.id}
                href={`/remotion/${entry.id}/render`}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-3 hover:border-primary/50 hover:bg-card/80 transition-colors"
              >
                {/* Number badge */}
                {videoNum ? (
                  <span className="inline-flex items-center justify-center text-xs font-mono font-bold w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                    {videoNum}
                  </span>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                    <Film className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{videoTitle}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span>{tl.width}×{tl.height}</span>
                    <span>{formatDuration(tl.durationInFrames, tl.fps)}</span>
                    <span>{totalClips} clips</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                    <StatusIcon className={`h-3.5 w-3.5 ${entry.status === "rendering" ? "animate-pulse" : ""}`} />
                    {cfg.label}
                  </span>
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
