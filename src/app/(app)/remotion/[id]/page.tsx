"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Player } from "@remotion/player";
import { ArrowLeft, Film, Layers, Music, Clock, Info } from "lucide-react";
import Link from "next/link";
import { DynamicVideo } from "@/lib/remotion/compositions/DynamicVideo";
import type { RemotionTimeline, RemotionTimelineRecord } from "@/lib/remotion/types";

export default function RemotionPreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<RemotionTimelineRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await fetch(`/api/remotion/convert?id=${id}`);
        if (!res.ok) throw new Error("Timeline not found");
        const data = await res.json();
        setRecord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading timeline");
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [id]);

  const timeline = record?.remotion_timeline as RemotionTimeline | undefined;

  const stats = useMemo(() => {
    if (!timeline) return null;
    const visualTracks = timeline.tracks.filter((t) => t.type === "visual");
    const audioTracks = timeline.tracks.filter((t) => t.type === "audio");
    const totalClips = timeline.tracks.reduce((sum, t) => sum + t.clips.length, 0);
    const durationSec = Math.round(timeline.durationInFrames / timeline.fps);
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;

    return {
      visualTracks: visualTracks.length,
      audioTracks: audioTracks.length,
      totalClips,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      resolution: `${timeline.width}x${timeline.height}`,
      fps: timeline.fps,
    };
  }, [timeline]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="aspect-video bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="space-y-6">
        <Link href="/remotion" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a Remotion
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <Film className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">{error || "Timeline no encontrado"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/remotion" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-2xl font-bold">
            {record?.video_name || record?.video_id || "Preview"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            {record?.status}
          </span>
        </div>
      </div>

      {/* Player */}
      <div className="rounded-lg overflow-hidden border border-border/50 bg-black">
        <Player
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={DynamicVideo as any}
          inputProps={timeline as unknown as Record<string, unknown>}
          durationInFrames={timeline.durationInFrames}
          fps={timeline.fps}
          compositionWidth={timeline.width}
          compositionHeight={timeline.height}
          style={{ width: "100%" }}
          controls
          autoPlay={false}
          loop={false}
          clickToPlay
        />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Duracion"
            value={stats.duration}
          />
          <StatCard
            icon={<Info className="h-4 w-4" />}
            label="Resolucion"
            value={stats.resolution}
          />
          <StatCard
            icon={<Info className="h-4 w-4" />}
            label="FPS"
            value={String(stats.fps)}
          />
          <StatCard
            icon={<Layers className="h-4 w-4" />}
            label="Video tracks"
            value={String(stats.visualTracks)}
          />
          <StatCard
            icon={<Music className="h-4 w-4" />}
            label="Audio tracks"
            value={String(stats.audioTracks)}
          />
          <StatCard
            icon={<Film className="h-4 w-4" />}
            label="Total clips"
            value={String(stats.totalClips)}
          />
        </div>
      )}

      {/* Track details */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tracks</h2>
        {timeline.tracks.map((track) => (
          <div
            key={track.id}
            className="rounded-lg border border-border/50 bg-card p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {track.type === "visual" ? (
                  <Layers className="h-4 w-4 text-blue-400" />
                ) : (
                  <Music className="h-4 w-4 text-purple-400" />
                )}
                <span className="text-sm font-medium">{track.id}</span>
                <span className="text-xs text-muted-foreground">
                  z-index: {track.zIndex}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {track.clips.length} clip{track.clips.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1">
              {track.clips.map((clip) => {
                const startSec = (clip.from / timeline.fps).toFixed(1);
                const durSec = (clip.durationInFrames / timeline.fps).toFixed(1);
                const filename = clip.src.split("/").pop() || clip.src;

                return (
                  <div
                    key={clip.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1"
                  >
                    <span className="font-mono text-[10px] px-1 rounded bg-muted">
                      {clip.type}
                    </span>
                    <span className="truncate flex-1" title={clip.src}>
                      {filename}
                    </span>
                    <span>{startSec}s</span>
                    <span className="text-muted-foreground/50">→</span>
                    <span>{durSec}s</span>
                    {clip.effect && (
                      <span className="px-1 rounded bg-blue-500/10 text-blue-400">
                        {clip.effect}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
