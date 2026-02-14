"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  ArrowLeft,
  Film,
  Layers,
  Music,
  Clock,
  Monitor,
  Gauge,
  ChevronDown,
  Video,
  ImageIcon,
  Volume2,
  Cloud,
  CloudOff,
  Loader2,
  CheckCircle2,
  GripVertical,
  Undo2,
  Redo2,
  Save,
  Rocket,
  Download,
  AlertCircle,
  ExternalLink,
  Minus,
  Plus,
  Timer,
} from "lucide-react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DynamicVideo } from "@/lib/remotion/compositions/DynamicVideo";
import { RenderModeContext } from "@/lib/remotion/RenderModeContext";
import { InspectorPanel } from "@/components/editor/inspector/InspectorPanel";
import { useTimelineShortcuts } from "@/lib/hooks/useTimelineShortcuts";
import type {
  RemotionTimeline,
  RemotionTimelineRecord,
  RemotionTrack,
  RemotionClip,
} from "@/lib/remotion/types";
import { useEditorStore } from "@/lib/stores/editor-store";
import { cn } from "@/lib/utils";

// ─── Elapsed Timer Hook ──────────────────────────────────

/** Returns a formatted elapsed time string (M:SS) that ticks every second while running. */
function useElapsedTimer(running: boolean) {
  const startRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      setElapsed(0);
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
    // When stopped, keep the final elapsed value (don't reset)
  }, [running]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ─── Helpers ─────────────────────────────────────────────

function formatTime(frames: number, fps: number) {
  const totalSec = Math.floor(frames / fps);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function clipTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <Video className="h-3 w-3" />;
    case "image":
      return <ImageIcon className="h-3 w-3" />;
    case "audio":
      return <Volume2 className="h-3 w-3" />;
    default:
      return <Film className="h-3 w-3" />;
  }
}

function clipTypeColor(type: string) {
  switch (type) {
    case "video":
      return "bg-blue-500/70 border-blue-400/50";
    case "image":
      return "bg-emerald-500/70 border-emerald-400/50";
    case "audio":
      return "bg-purple-500/70 border-purple-400/50";
    default:
      return "bg-gray-500/70 border-gray-400/50";
  }
}

function clipTypeBadgeColor(type: string) {
  switch (type) {
    case "video":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "image":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "audio":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    default:
      return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  }
}

function trackColor(type: string) {
  return type === "visual" ? "text-blue-400" : "text-purple-400";
}

/** Fallback for old timelines that don't have the `name` field on clips */
function clipDisplayName(clip: RemotionClip): string {
  if (clip.name) return clip.name;
  // Derive from URL
  try {
    const filename = decodeURIComponent(new URL(clip.src).pathname.split("/").pop() || "");
    const noExt = filename.replace(/\.[^.]+$/, "");
    if (noExt && noExt !== "source") {
      return noExt.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 40);
    }
  } catch { /* ignore */ }
  return `${clip.type} ${clip.id.split("-").pop()}`;
}

/** Fallback for old timelines that don't have the `name` field on tracks */
function trackDisplayName(track: RemotionTrack, allTracks?: RemotionTrack[]): string {
  if (track.name && track.name !== track.id) {
    // Position-based override: topmost visual track in multi-layer timelines is AE Renders
    if (track.name === "Avatares" && track.type === "visual" && allTracks) {
      const visualTracks = allTracks.filter(t => t.type === "visual");
      if (visualTracks.length > 1) {
        const maxZ = Math.max(...visualTracks.map(t => t.zIndex));
        if (track.zIndex === maxZ) return "AE Renders";
      }
    }
    return track.name;
  }
  // Derive from content for old timelines
  const clips = track.clips;
  if (clips.length === 0) return track.id;

  if (track.type === "audio") {
    const hasWhoosh = clips.some((c) => c.src.includes("Whoosh"));
    if (hasWhoosh) return "SFX";
    const hasVoice = clips.some((c) => c.src.includes("elevenlabs") || c.src.includes("eleven-labs"));
    if (hasVoice) return "Voz";
    const avgVol = clips.reduce((s, c) => s + (c.volume ?? 1), 0) / clips.length;
    if (avgVol < 0.5) return "Música";
    return `Audio ${track.id.split("-").pop()}`;
  }

  // Visual — extract filenames for pattern matching
  const filenames = clips.map((c) => {
    try { return decodeURIComponent(new URL(c.src).pathname.split("/").pop() || "").toLowerCase(); }
    catch { return c.src.toLowerCase(); }
  });

  if (clips.every((c) => c.src.includes("Opacidad"))) return "Opacidad";
  if (clips.every((c) => c.src.includes("Transparente"))) return "Transparente";

  // AE Renders: filenames containing ae_, ae-, render, comp, after effect
  const aeRenders = clips.filter((c, i) =>
    filenames[i].includes("ae_") || filenames[i].includes("ae-") ||
    filenames[i].includes("after_effect") || filenames[i].includes("after-effect") ||
    filenames[i].includes("_render") || filenames[i].includes("-render") ||
    filenames[i].startsWith("render") || filenames[i].includes("_comp") || filenames[i].includes("-comp") ||
    (c.name || "").toLowerCase().includes("ae render") || (c.name || "").toLowerCase().includes("after effect")
  );
  if (aeRenders.length >= clips.length * 0.5) return "AE Renders";

  // B-Roll: filenames containing broll/b-roll/b_roll, or pexels/pixabay
  const broll = clips.filter((c, i) =>
    filenames[i].includes("broll") || filenames[i].includes("b-roll") || filenames[i].includes("b_roll") ||
    c.src.includes("pexels") || c.src.includes("pixabay")
  );
  if (broll.length >= clips.length * 0.5) return "B-Roll";

  // Fuentes Research: filenames containing research/fuente
  const research = clips.filter((c, i) =>
    filenames[i].includes("research") || filenames[i].includes("fuente") ||
    (c.name || "").toLowerCase().includes("research")
  );
  if (research.length >= clips.length * 0.5) return "Fuentes Research";

  // Avatares: heygen/ugcfiles OR multiple videos without stock markers
  const avatars = clips.filter((c) => c.src.includes("heygen") || c.src.includes("ugcfiles"));
  if (avatars.length >= clips.length * 0.5) {
    // Topmost visual track in multi-layer timelines = AE Renders
    if (allTracks) {
      const visualTracks = allTracks.filter(t => t.type === "visual");
      if (visualTracks.length > 1) {
        const maxZ = Math.max(...visualTracks.map(t => t.zIndex));
        if (track.zIndex === maxZ) return "AE Renders";
      }
    }
    return "Avatares";
  }

  const images = clips.filter((c) => c.type === "image");
  if (images.length >= clips.length * 0.7 && clips.some((c) => c.transition?.in || c.transition?.out)) return "Slides";
  if (clips.some((c) => c.filter === "blur")) return "Fondos Blur";
  if (images.length === clips.length) {
    if (research.length > 0) return "Fuentes Research";
    return "Imágenes";
  }

  // All videos without specific markers → likely avatares if 3+ clips
  const videos = clips.filter((c) => c.type === "video");
  if (videos.length === clips.length && videos.length >= 3 && broll.length === 0) {
    if (allTracks) {
      const visualTracks = allTracks.filter(t => t.type === "visual");
      if (visualTracks.length > 1) {
        const maxZ = Math.max(...visualTracks.map(t => t.zIndex));
        if (track.zIndex === maxZ) return "AE Renders";
      }
    }
    return "Avatares";
  }

  return `Capa ${track.id.split("-").pop()}`;
}

// ─── Main Page ───────────────────────────────────────────

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

  const rawTimeline = record?.remotion_timeline as RemotionTimeline | undefined;
  const playerRef = useRef<PlayerRef>(null);

  // ─── Zoom state (lifted here so shortcuts can access it) ──
  const [zoom, setZoom] = useState(1);
  const zoomIn = useCallback(() => setZoom((z) => Math.min(10, +(z + 0.5).toFixed(1))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1))), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  // ─── Keyboard shortcuts ────────────────────────────────
  useTimelineShortcuts(playerRef, rawTimeline?.fps ?? 30, {
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onZoomReset: zoomReset,
  });

  // ─── Editor state (Zustand store) ───────────────────────
  const storeTimeline = useEditorStore((s) => s.timeline);
  const isDirty = useEditorStore((s) => s.isDirty);
  const selectedClipIds = useEditorStore((s) => s.selectedClipIds);
  const initTimeline = useEditorStore((s) => s.initTimeline);
  const reorderClips = useEditorStore((s) => s.reorderClips);
  const markClean = useEditorStore((s) => s.markClean);

  // Initialize store when raw timeline loads
  useEffect(() => {
    if (rawTimeline) initTimeline(rawTimeline);
  }, [rawTimeline, initTimeline]);

  const isEdited = isDirty;

  const handleClipReorder = useCallback((trackId: string, oldIndex: number, newIndex: number) => {
    reorderClips(trackId, oldIndex, newIndex);
  }, [reorderClips]);

  const discardEdits = useCallback(() => {
    if (rawTimeline) initTimeline(rawTimeline);
  }, [rawTimeline, initTimeline]);

  const [saving, setSaving] = useState(false);

  const saveEdits = useCallback(async () => {
    if (!storeTimeline || !isDirty || !record?.id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/remotion/convert", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          remotion_timeline: storeTimeline,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error al guardar");
      setRecord((prev) => prev ? { ...prev, remotion_timeline: storeTimeline, updated_at: new Date().toISOString() } : prev);
      markClean();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [storeTimeline, isDirty, record?.id, markClean]);

  // ─── CDN Proxy system (Cloudflare Stream) ─────────────
  const [proxyMap, setProxyMap] = useState<Record<string, string>>({});
  const [proxyStatus, setProxyStatus] = useState<{
    state: "idle" | "generating" | "polling" | "ready" | "unavailable";
    ready: number;
    total: number;
  }>({ state: "idle", ready: 0, total: 0 });

  // Apply proxy URLs to timeline clips
  const timeline = useMemo(() => {
    const base = storeTimeline;
    if (!base) return undefined;
    if (Object.keys(proxyMap).length === 0) return base;

    return {
      ...base,
      tracks: base.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => ({
          ...clip,
          proxySrc: proxyMap[clip.src] || clip.proxySrc,
        })),
      })),
    };
  }, [storeTimeline, proxyMap]);

  // Check proxy status on page load
  const proxyRetryRef = useRef(false);
  useEffect(() => {
    if (!record?.id) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function checkProxies() {
      try {
        const res = await fetch(`/api/remotion/proxy?timelineId=${record!.id}`);
        if (!res.ok) {
          setProxyStatus((s) => ({ ...s, state: "unavailable" }));
          return;
        }
        const data = await res.json();
        if (data.error) {
          setProxyStatus((s) => ({ ...s, state: "unavailable" }));
          return;
        }

        if (cancelled) return;

        const map: Record<string, string> = {};
        for (const [url, info] of Object.entries(data.proxies)) {
          const p = info as { proxy_url: string | null; hls_url: string | null; status: string };
          const proxyUrl = p.proxy_url || p.hls_url;
          if (proxyUrl && p.status === "ready") {
            map[url] = proxyUrl;
          }
        }
        setProxyMap(map);
        const proxiedCount = Object.keys(data.proxies).length;
        setProxyStatus({
          state: data.allReady ? "ready" : proxiedCount > 0 ? "polling" : "idle",
          ready: data.ready,
          total: data.total,
        });

        // If some URLs were never uploaded (POST timed out), re-trigger POST once
        if (proxiedCount > 0 && proxiedCount < data.total && !proxyRetryRef.current) {
          proxyRetryRef.current = true;
          console.log(`[CDN] ${proxiedCount}/${data.total} proxied — re-triggering upload for missing`);
          fetch("/api/remotion/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timelineId: record!.id }),
          }).catch(() => {});
        }

        // Keep polling if not all ready
        if (!data.allReady && proxiedCount > 0) {
          pollTimer = setTimeout(checkProxies, 5000);
        }
      } catch {
        if (!cancelled) setProxyStatus((s) => ({ ...s, state: "unavailable" }));
      }
    }

    checkProxies();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [record?.id]);

  async function generateProxies() {
    if (!record?.id) return;
    setProxyStatus((s) => ({ ...s, state: "generating" }));

    try {
      const res = await fetch("/api/remotion/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineId: record.id }),
      });
      const data = await res.json();

      if (data.error) {
        setProxyStatus({ state: "unavailable", ready: 0, total: 0 });
        return;
      }

      setProxyStatus({
        state: data.ready === data.total ? "ready" : "polling",
        ready: data.ready,
        total: data.total,
      });

      // Start polling if not all ready
      if (data.ready < data.total) {
        const poll = async () => {
          const res = await fetch(`/api/remotion/proxy?timelineId=${record!.id}`);
          const d = await res.json();
          if (!d.proxies) return;

          const map: Record<string, string> = {};
          for (const [url, info] of Object.entries(d.proxies)) {
            const p = info as { proxy_url: string | null; hls_url: string | null; status: string };
            const proxyUrl = p.proxy_url || p.hls_url;
            if (proxyUrl && p.status === "ready") {
              map[url] = proxyUrl;
            }
          }
          setProxyMap(map);
          setProxyStatus({
            state: d.allReady ? "ready" : "polling",
            ready: d.ready,
            total: d.total,
          });

          if (!d.allReady) setTimeout(poll, 5000);
        };
        setTimeout(poll, 5000);
      }
    } catch {
      setProxyStatus({ state: "unavailable", ready: 0, total: 0 });
    }
  }

  async function resetAndRetryProxies() {
    if (!record?.id) return;
    setProxyStatus({ state: "generating", ready: 0, total: 0 });
    setProxyMap({});

    try {
      // DELETE all proxy records for this timeline
      await fetch(`/api/remotion/proxy?timelineId=${record.id}`, {
        method: "DELETE",
      });

      // Re-trigger proxy generation
      await generateProxies();
    } catch {
      setProxyStatus({ state: "idle", ready: 0, total: 0 });
    }
  }

  // Downscale for preview: cap at 720p to reduce video decoding load
  const previewDimensions = useMemo(() => {
    if (!timeline) return null;
    const maxDim = 720;
    const { width, height } = timeline;
    if (width <= maxDim && height <= maxDim) return { width, height };
    const ratio = Math.min(maxDim / width, maxDim / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
    };
  }, [timeline]);

  // Memoize inputProps to prevent unnecessary Player re-renders
  const inputProps = useMemo(
    () => timeline as unknown as Record<string, unknown>,
    [timeline]
  );

  const stats = useMemo(() => {
    if (!timeline) return null;
    const visualTracks = timeline.tracks.filter((t) => t.type === "visual");
    const audioTracks = timeline.tracks.filter((t) => t.type === "audio");
    const totalClips = timeline.tracks.reduce(
      (sum, t) => sum + t.clips.length,
      0
    );
    return {
      visualTracks: visualTracks.length,
      audioTracks: audioTracks.length,
      totalClips,
      duration: formatTime(timeline.durationInFrames, timeline.fps),
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
        <Link
          href="/remotion"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
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
          <Link
            href="/remotion"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-2xl font-bold">
            {record?.video_name || record?.video_id || "Preview"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Composicion en tiempo real — el navegador monta todas las capas individualmente
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
          {record?.status}
        </span>
      </div>

      {/* Player + Inspector layout */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 rounded-lg overflow-hidden border border-border/50 bg-black">
          <Player
            ref={playerRef}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component={DynamicVideo as any}
            inputProps={inputProps}
            durationInFrames={timeline.durationInFrames}
            fps={timeline.fps}
            compositionWidth={previewDimensions?.width ?? timeline.width}
            compositionHeight={previewDimensions?.height ?? timeline.height}
            style={{ width: "100%" }}
            controls
            autoPlay={false}
            loop={false}
            clickToPlay
          />
        </div>
        <InspectorPanel />
      </div>

      {/* Lambda Render */}
      <RenderSection
        timelineId={record!.id}
        status={record!.status}
        renderUrl={record!.render_url}
        renderId={record!.render_id}
        renderBucket={record!.render_bucket}
        onStatusChange={(status, url) => {
          setRecord((prev) =>
            prev
              ? {
                  ...prev,
                  status: status as RemotionTimelineRecord["status"],
                  render_url: url ?? prev.render_url,
                }
              : prev
          );
        }}
      />

      {/* Browser Render (fallback) */}
      {timeline && (
        <BrowserRenderSection timeline={timeline} />
      )}

      {/* CDN Proxy status */}
      <ProxyStatusBar
        status={proxyStatus}
        proxyCount={Object.keys(proxyMap).length}
        onGenerate={generateProxies}
        onReset={resetAndRetryProxies}
      />

      {/* Stats bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-3">
          <StatPill icon={<Clock className="h-3.5 w-3.5" />} value={stats.duration} label="duración" />
          <StatPill icon={<Monitor className="h-3.5 w-3.5" />} value={stats.resolution} />
          <StatPill icon={<Gauge className="h-3.5 w-3.5" />} value={`${stats.fps} fps`} />
          <div className="h-4 w-px bg-border" />
          <StatPill icon={<Layers className="h-3.5 w-3.5 text-blue-400" />} value={String(stats.visualTracks)} label="video tracks" />
          <StatPill icon={<Music className="h-3.5 w-3.5 text-purple-400" />} value={String(stats.audioTracks)} label="audio tracks" />
          <StatPill icon={<Film className="h-3.5 w-3.5" />} value={String(stats.totalClips)} label="clips" />
        </div>
      )}

      {/* Visual Timeline */}
      <VisualTimeline
        timeline={timeline}
        playerRef={playerRef}
        onClipReorder={handleClipReorder}
        isEdited={isEdited}
        onDiscardEdits={discardEdits}
        onSaveEdits={saveEdits}
        saving={saving}
        selectedClipIds={selectedClipIds}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
      />

      {/* Track Explorer */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Detalle de Tracks
        </h2>
        {timeline.tracks.map((track) => (
          <TrackCard key={track.id} track={track} fps={timeline.fps} totalFrames={timeline.durationInFrames} allTracks={timeline.tracks} />
        ))}
      </div>
    </div>
  );
}

// ─── Lambda Render Section ───────────────────────────────

function RenderSection({
  timelineId,
  status: initialStatus,
  renderUrl: initialRenderUrl,
  renderId: savedRenderId,
  renderBucket: savedRenderBucket,
  onStatusChange,
}: {
  timelineId: string;
  status: string;
  renderUrl?: string;
  renderId?: string;
  renderBucket?: string;
  onStatusChange: (status: string, url?: string) => void;
}) {
  // Determine initial state: resume rendering if DB has render_id+bucket
  const canResume = initialStatus === "rendering" && savedRenderId && savedRenderBucket;
  const [renderState, setRenderState] = useState<
    "idle" | "launching" | "rendering" | "done" | "error"
  >(
    initialStatus === "rendered" && initialRenderUrl
      ? "done"
      : canResume
        ? "rendering"
        : "idle"
  );
  const [progress, setProgress] = useState(0);
  const [renderUrl, setRenderUrl] = useState(initialRenderUrl);
  const [renderSize, setRenderSize] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const elapsedTime = useElapsedTimer(renderState === "launching" || renderState === "rendering");
  const [renderInfo, setRenderInfo] = useState<{
    renderId: string;
    bucketName: string;
    framesPerLambda?: number;
    estimatedChunks?: number;
  } | null>(canResume ? { renderId: savedRenderId!, bucketName: savedRenderBucket! } : null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  // Resume polling if page loaded with an active render
  useEffect(() => {
    if (canResume && savedRenderId && savedRenderBucket) {
      pollProgress(savedRenderId, savedRenderBucket);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function launchRender() {
    setRenderState("launching");
    setErrorMsg(null);
    setProgress(0);

    try {
      const res = await fetch("/api/remotion/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineId }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al lanzar render");
      }

      setRenderInfo(data);
      setRenderState("rendering");
      onStatusChange("rendering");

      // Start polling
      pollProgress(data.renderId, data.bucketName);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setRenderState("error");
    }
  }

  function pollProgress(renderId: string, bucketName: string) {
    async function check() {
      try {
        const res = await fetch(
          `/api/remotion/render?renderId=${renderId}&bucketName=${bucketName}&timelineId=${timelineId}`
        );
        const data = await res.json();

        if (data.error || data.failed) {
          setErrorMsg(data.error || "Render failed on Lambda");
          setRenderState("error");
          onStatusChange("failed");
          return;
        }

        if (data.done) {
          setProgress(100);
          setRenderUrl(data.url);
          setRenderSize(data.size);
          setRenderState("done");
          onStatusChange("rendered", data.url);
          return;
        }

        setProgress(Math.round((data.progress ?? 0) * 100));
        pollRef.current = setTimeout(check, 3000);
      } catch {
        setErrorMsg("Error al verificar progreso");
        setRenderState("error");
      }
    }
    pollRef.current = setTimeout(check, 3000);
  }

  if (renderState === "done" && renderUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-400">Render completado</p>
          <p className="text-xs text-green-400/60 mt-0.5">
            {renderSize ? `${(renderSize / 1024 / 1024).toFixed(1)} MB · ` : ""}{elapsedTime}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={renderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver MP4
          </a>
          <a
            href={renderUrl}
            download
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </a>
          <button
            onClick={launchRender}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <Rocket className="h-3.5 w-3.5" />
            Re-render
          </button>
        </div>
      </div>
    );
  }

  if (renderState === "launching") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 animate-spin" />
        <p className="text-sm text-blue-400 flex-1">Lanzando render en AWS Lambda...</p>
        <span className="flex items-center gap-1 text-xs text-blue-400/70 font-mono flex-shrink-0">
          <Timer className="h-3 w-3" />{elapsedTime}
        </span>
      </div>
    );
  }

  if (renderState === "rendering") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm text-blue-400">Renderizando en Lambda...</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-blue-400/70 font-mono">
                <Timer className="h-3 w-3" />{elapsedTime}
              </span>
              <span className="text-xs text-blue-400/70 font-mono">{progress}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {renderInfo && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {renderInfo.estimatedChunks} chunks · {renderInfo.framesPerLambda} frames/lambda
            </p>
          )}
        </div>
      </div>
    );
  }

  if (renderState === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-400">Error en render</p>
          {errorMsg && (
            <p className="text-xs text-red-400/60 mt-0.5 line-clamp-2">{errorMsg}</p>
          )}
        </div>
        <button
          onClick={launchRender}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex-shrink-0"
        >
          <Rocket className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  // idle — show render button
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3">
      <Rocket className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-foreground">Render Final</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Renderiza el video completo en AWS Lambda (H.264, 1080p)
        </p>
      </div>
      <button
        onClick={launchRender}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium flex-shrink-0"
      >
        <Rocket className="h-4 w-4" />
        Renderizar
      </button>
    </div>
  );
}

// ─── CDN Proxy Status Bar ────────────────────────────────

function ProxyStatusBar({
  status,
  proxyCount,
  onGenerate,
  onReset,
}: {
  status: { state: string; ready: number; total: number };
  proxyCount: number;
  onGenerate: () => void;
  onReset: () => void;
}) {
  if (status.state === "unavailable") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-2.5">
        <CloudOff className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
        <span className="text-xs text-muted-foreground">
          CDN no configurado — reproduciendo desde origen
        </span>
      </div>
    );
  }

  if (status.state === "ready" && proxyCount > 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
        <span className="text-xs text-green-400 flex-1">
          CDN activo — {proxyCount} clips optimizados via Cloudflare
        </span>
        <button
          onClick={onReset}
          className="text-xs px-2 py-0.5 rounded-md text-green-400/60 hover:text-green-400 hover:bg-green-500/10 transition-colors flex-shrink-0"
          title="Limpiar cache y resubir todos los videos"
        >
          Reiniciar
        </button>
      </div>
    );
  }

  if (status.state === "generating" || status.state === "polling") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5">
        <Loader2 className="h-4 w-4 text-blue-400 flex-shrink-0 animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-blue-400">
              Optimizando para CDN...
            </span>
            <span className="text-xs text-muted-foreground">
              {status.ready}/{status.total}
            </span>
          </div>
          {status.total > 0 && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(status.ready / status.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // idle — show generate button
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-2.5">
      <Cloud className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground flex-1">
        Los videos se sirven desde origen. Optimiza via CDN para mejorar la carga.
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {proxyCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs px-3 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Limpiar
          </button>
        )}
        <button
          onClick={onGenerate}
          className="text-xs px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
        >
          Optimizar
        </button>
      </div>
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {icon}
      <span className="font-semibold">{value}</span>
      {label && <span className="text-muted-foreground text-xs">{label}</span>}
    </div>
  );
}

// ─── Visual Timeline ─────────────────────────────────────

function VisualTimeline({
  timeline,
  playerRef,
  onClipReorder,
  isEdited,
  onDiscardEdits,
  onSaveEdits,
  saving,
  selectedClipIds,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  timeline: RemotionTimeline;
  playerRef: React.RefObject<PlayerRef | null>;
  onClipReorder: (trackId: string, oldIndex: number, newIndex: number) => void;
  isEdited: boolean;
  onDiscardEdits: () => void;
  onSaveEdits: () => void;
  saving: boolean;
  selectedClipIds: string[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) {
  const totalFrames = timeline.durationInFrames;
  const [hoveredClip, setHoveredClip] = useState<{ clip: RemotionClip; rect: DOMRect } | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timecodeRef = useRef<HTMLDivElement>(null);
  const trackBarRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isSortingRef = useRef(false);

  // Drag sensor: require 8px movement before starting drag (prevents accidental drags on playhead scrub)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Animate playhead + timecode via RAF — direct DOM updates to avoid React re-renders
  useEffect(() => {
    let animId: number;
    const fps = timeline.fps;
    function tick() {
      const frame = playerRef.current?.getCurrentFrame() ?? 0;
      const bar = trackBarRef.current;
      const playhead = playheadRef.current;
      const timecode = timecodeRef.current;
      const scroller = scrollContainerRef.current;
      // Update position (skip during drag — seekFromMouseEvent handles it)
      if (!isDraggingRef.current && bar && playhead) {
        const pct = frame / totalFrames;
        const left = bar.offsetLeft + pct * bar.offsetWidth;
        playhead.style.left = `${left}px`;

        // Auto-scroll to keep playhead visible when zoomed in
        if (scroller && zoom > 1) {
          const playheadX = left;
          const scrollLeft = scroller.scrollLeft;
          const viewWidth = scroller.clientWidth;
          const margin = viewWidth * 0.15; // 15% margin from edges
          if (playheadX < scrollLeft + margin) {
            scroller.scrollLeft = playheadX - margin;
          } else if (playheadX > scrollLeft + viewWidth - margin) {
            scroller.scrollLeft = playheadX - viewWidth + margin;
          }
        }
      }
      // Always update timecode text (format: M:SS)
      if (timecode) {
        const currentSec = Math.floor(frame / fps);
        const cMin = Math.floor(currentSec / 60);
        const cSec = currentSec % 60;
        timecode.textContent = `${cMin}:${cSec.toString().padStart(2, "0")}`;
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [playerRef, totalFrames, timeline.fps, zoom]);

  // Seek player from mouse position relative to the track bar
  function seekFromMouseEvent(e: MouseEvent | React.MouseEvent) {
    const bar = trackBarRef.current;
    if (!bar || !playerRef.current) return;
    const barRect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - barRect.left, barRect.width));
    const pct = x / barRect.width;
    const frame = Math.round(pct * totalFrames);
    playerRef.current.seekTo(frame);
    const playhead = playheadRef.current;
    if (playhead) {
      playhead.style.left = `${bar.offsetLeft + pct * bar.offsetWidth}px`;
    }
  }

  function handleTimelineMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if (isSortingRef.current) return; // skip during dnd-kit drag
    const bar = trackBarRef.current;
    if (!bar) return;
    const barRect = bar.getBoundingClientRect();
    if (e.clientX < barRect.left || e.clientX > barRect.right) return;

    // Deselect clips when clicking on empty area (not on a clip)
    useEditorStore.getState().deselectAll();

    isDraggingRef.current = true;
    seekFromMouseEvent(e);
    playerRef.current?.pause();

    const handleMove = (ev: MouseEvent) => {
      if (isDraggingRef.current) {
        ev.preventDefault();
        seekFromMouseEvent(ev);
      }
    };
    const handleUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 space-y-1.5 overflow-x-auto relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Timeline
        </h2>
        <div className="flex items-center gap-2">
          {/* Undo/Redo buttons */}
          <UndoRedoButtons />
          {isEdited && (
            <>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                Editado
              </span>
              <button
                onClick={onDiscardEdits}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-muted/30"
                title="Descartar cambios y restaurar original"
              >
                <Undo2 className="h-3 w-3" />
                Descartar
              </button>
              <button
                onClick={onSaveEdits}
                disabled={saving}
                className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50"
                title="Guardar cambios en Supabase"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </>
          )}
          {/* Zoom control */}
          <div className="flex items-center gap-1 ml-2 border-l border-border/30 pl-2">
            <button
              onClick={onZoomOut}
              disabled={zoom <= 1}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
              title="Alejar (Ctrl+-)"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              onClick={onZoomReset}
              className="text-[10px] text-muted-foreground hover:text-foreground tabular-nums min-w-[2.5rem] text-center"
              title="Reset zoom (Ctrl+0)"
            >
              {zoom === 1 ? "Fit" : `${zoom}x`}
            </button>
            <button
              onClick={onZoomIn}
              disabled={zoom >= 10}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
              title="Acercar (Ctrl++)"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tracks container — scrollable when zoomed */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto select-none"
        onMouseDown={handleTimelineMouseDown}
      >
        <div className="relative space-y-1.5" style={{ width: zoom > 1 ? `${zoom * 100}%` : undefined }}>
        {timeline.tracks.map((track, trackIndex) => (
          <TimelineTrackRow
            key={track.id}
            track={track}
            totalFrames={totalFrames}
            allTracks={timeline.tracks}
            trackBarRef={trackIndex === 0 ? trackBarRef : undefined}
            sensors={sensors}
            selectedClipIds={selectedClipIds}
            onDragStart={() => {
              isSortingRef.current = true;
              setHoveredClip(null); // Clear tooltip during drag
            }}
            onDragEnd={(event: DragEndEvent) => {
              isSortingRef.current = false;
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const clipIds = track.clips.map((c) => c.id);
              const oldIndex = clipIds.indexOf(active.id as string);
              const newIndex = clipIds.indexOf(over.id as string);
              if (oldIndex !== -1 && newIndex !== -1) {
                onClipReorder(track.id, oldIndex, newIndex);
              }
            }}
            onDragCancel={() => {
              isSortingRef.current = false;
            }}
            onHoverClip={setHoveredClip}
          />
        ))}

        {/* Playhead */}
        <div
          ref={playheadRef}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: 0 }}
        >
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-5 bg-red-500 rounded-t-md rounded-b-sm cursor-col-resize pointer-events-auto flex items-center justify-center shadow-md shadow-red-500/30 hover:bg-red-400 transition-colors">
            <div className="flex flex-col gap-[2px]">
              <div className="w-1.5 h-px bg-white/60 rounded-full" />
              <div className="w-1.5 h-px bg-white/60 rounded-full" />
              <div className="w-1.5 h-px bg-white/60 rounded-full" />
            </div>
          </div>
          <div
            ref={timecodeRef}
            className="absolute -top-9 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-mono font-semibold leading-none px-2 py-1 rounded whitespace-nowrap shadow-lg"
          >
            0:00
          </div>
        </div>

        {/* Time markers — scale with zoom */}
        <TimeRuler totalFrames={totalFrames} fps={timeline.fps} />
        </div>{/* close zoom width div */}
      </div>{/* close scroll container */}

      {/* Floating tooltip */}
      {hoveredClip && (
        <TimelineTooltip clip={hoveredClip.clip} rect={hoveredClip.rect} fps={timeline.fps} />
      )}
    </div>
  );
}

// ─── Time Ruler ─────────────────────────────────────────

function TimeRuler({ totalFrames, fps }: { totalFrames: number; fps: number }) {
  const totalSec = totalFrames / fps;
  // Decide interval: aim for ~8-12 marks visible
  let interval: number;
  if (totalSec <= 30) interval = 5;
  else if (totalSec <= 120) interval = 10;
  else if (totalSec <= 300) interval = 30;
  else interval = 60;

  const marks: number[] = [];
  for (let s = 0; s <= totalSec; s += interval) {
    marks.push(s);
  }
  // Always include the end
  if (marks[marks.length - 1] < totalSec) marks.push(totalSec);

  return (
    <div className="relative h-4 mt-1">
      <div className="absolute inset-0 flex items-center" style={{ marginLeft: "7rem" }}>
        {marks.map((s) => {
          const pct = (s / totalSec) * 100;
          const min = Math.floor(s / 60);
          const sec = Math.floor(s % 60);
          return (
            <span
              key={s}
              className="absolute text-[9px] text-muted-foreground/50 -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              {min}:{sec.toString().padStart(2, "0")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Undo/Redo Buttons ──────────────────────────────────

function UndoRedoButtons() {
  const temporalStore = useEditorStore.temporal.getState;
  // Re-render on undo/redo by subscribing to isDirty changes
  const isDirty = useEditorStore((s) => s.isDirty);

  // Check lengths on each render (cheap operation)
  const pastLen = useEditorStore.temporal.getState().pastStates.length;
  const futureLen = useEditorStore.temporal.getState().futureStates.length;

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => useEditorStore.temporal.getState().undo()}
        disabled={pastLen === 0}
        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Deshacer (Ctrl+Z)"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => useEditorStore.temporal.getState().redo()}
        disabled={futureLen === 0}
        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Rehacer (Ctrl+Y)"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Timeline Track Row (with DnD) ──────────────────────

function TimelineTrackRow({
  track,
  totalFrames,
  allTracks,
  trackBarRef,
  sensors,
  selectedClipIds,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onHoverClip,
}: {
  track: RemotionTrack;
  totalFrames: number;
  allTracks: RemotionTrack[];
  trackBarRef?: React.RefObject<HTMLDivElement | null>;
  sensors: ReturnType<typeof useSensors>;
  selectedClipIds: string[];
  onDragStart: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  onHoverClip: (data: { clip: RemotionClip; rect: DOMRect } | null) => void;
}) {
  const clipIds = useMemo(() => track.clips.map((c) => c.id), [track.clips]);

  return (
    <div className="flex items-center gap-2 h-7">
      <div className="w-28 flex-shrink-0 flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
        {track.type === "visual" ? (
          <Layers className="h-3 w-3 text-blue-400 flex-shrink-0" />
        ) : (
          <Music className="h-3 w-3 text-purple-400 flex-shrink-0" />
        )}
        <span className="truncate">{trackDisplayName(track, allTracks)}</span>
      </div>

      <div
        ref={trackBarRef}
        data-track-bar
        className="flex-1 relative h-6 bg-muted/30 rounded-sm min-w-0 cursor-col-resize"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <SortableContext items={clipIds} strategy={horizontalListSortingStrategy}>
            {track.clips.map((clip) => (
              <SortableClip
                key={clip.id}
                clip={clip}
                totalFrames={totalFrames}
                isSelected={selectedClipIds.includes(clip.id)}
                onHover={onHoverClip}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

// ─── Sortable Clip ──────────────────────────────────────

function SortableClip({
  clip,
  totalFrames,
  isSelected,
  onHover,
}: {
  clip: RemotionClip;
  totalFrames: number;
  isSelected: boolean;
  onHover: (data: { clip: RemotionClip; rect: DOMRect } | null) => void;
}) {
  const selectClip = useEditorStore((s) => s.selectClip);
  const resizeClipStart = useEditorStore((s) => s.resizeClipStart);
  const resizeClipEnd = useEditorStore((s) => s.resizeClipEnd);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clip.id });

  const left = (clip.from / totalFrames) * 100;
  const width = (clip.durationInFrames / totalFrames) * 100;

  const style: React.CSSProperties = {
    left: `${left}%`,
    width: `${Math.max(width, 0.3)}%`,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : isSelected ? 10 : undefined,
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    selectClip(clip.id, e.metaKey || e.ctrlKey);
  }, [clip.id, isDragging, selectClip]);

  // Resize handle logic: drag left/right edges to trim
  const handleResizeStart = useCallback((edge: "start" | "end", e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const parentEl = (e.currentTarget as HTMLElement).closest("[data-track-bar]") as HTMLElement;
    if (!parentEl) return;

    // Pause undo tracking during drag
    useEditorStore.temporal.getState().pause();

    const barRect = parentEl.getBoundingClientRect();
    const framesPerPx = totalFrames / barRect.width;

    const handleMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const x = ev.clientX - barRect.left;
      const frameAtMouse = Math.round(x * framesPerPx);

      if (edge === "start") {
        resizeClipStart(clip.id, frameAtMouse);
      } else {
        const newDuration = frameAtMouse - clip.from;
        resizeClipEnd(clip.id, newDuration);
      }
    };

    const handleUp = () => {
      useEditorStore.temporal.getState().resume();
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, [clip.id, clip.from, totalFrames, resizeClipStart, resizeClipEnd]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group absolute top-0.5 bottom-0.5 rounded-sm border text-[9px] flex items-center gap-0.5 px-0.5 overflow-hidden whitespace-nowrap hover:brightness-125 transition-all",
        clipTypeColor(clip.type),
        isDragging && "ring-2 ring-white/40 shadow-lg",
        isSelected && !isDragging && "ring-2 ring-white/80 brightness-125 shadow-md"
      )}
      style={style}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isDragging) {
          const rect = e.currentTarget.getBoundingClientRect();
          onHover({ clip, rect });
        }
      }}
      onMouseLeave={() => onHover(null)}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/40 transition-opacity z-10 rounded-l-sm"
        onMouseDown={(e) => handleResizeStart("start", e)}
      />

      {/* Drag handle */}
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded ml-1"
        {...attributes}
        {...listeners}
        onMouseDown={(e) => { e.stopPropagation(); }}
      >
        <GripVertical className="h-3 w-3 text-white/50" />
      </div>
      {width > 5 && (
        <span className="text-white/80 truncate">
          {clipDisplayName(clip)}
        </span>
      )}

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/40 transition-opacity z-10 rounded-r-sm"
        onMouseDown={(e) => handleResizeStart("end", e)}
      />
    </div>
  );
}

/** Tooltip rendered with fixed positioning to avoid overflow:hidden clipping */
function TimelineTooltip({ clip, rect, fps }: { clip: RemotionClip; rect: DOMRect; fps: number }) {
  const durSec = (clip.durationInFrames / fps).toFixed(1);
  const startSec = (clip.from / fps).toFixed(1);

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-[11px] text-popover-foreground whitespace-nowrap space-y-1">
        {/* Visual preview: image thumbnail or video poster frame */}
        {clip.type === "image" && (
          <div className="w-48 h-28 rounded overflow-hidden bg-black/50 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clip.src}
              alt={clipDisplayName(clip)}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
        )}
        {clip.type === "video" && (
          <div className="w-48 h-28 rounded overflow-hidden bg-black/50 mb-1">
            <video
              src={clip.src}
              className="w-full h-full object-contain"
              preload="metadata"
              muted
              playsInline
            />
          </div>
        )}
        <div className="font-semibold truncate max-w-[250px]">{clipDisplayName(clip)}</div>
        <div className="text-muted-foreground">
          {clip.type === "video" ? "Video" : clip.type === "image" ? "Imagen" : "Audio"} · {durSec}s · inicio {startSec}s
        </div>
        {clip.effect && clip.effect !== "none" && (
          <div className="text-blue-400">Efecto: {clip.effect}</div>
        )}
        {clip.transition?.in && (
          <div className="text-emerald-400">Transicion: {clip.transition.in}</div>
        )}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
    </div>
  );
}

// ─── Track Card (Collapsible) ────────────────────────────

function TrackCard({
  track,
  fps,
  totalFrames,
  allTracks,
}: {
  track: RemotionTrack;
  fps: number;
  totalFrames: number;
  allTracks?: RemotionTrack[];
}) {
  const [open, setOpen] = useState(false);

  const clipTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    track.clips.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return counts;
  }, [track.clips]);

  const trackDuration = useMemo(() => {
    if (track.clips.length === 0) return "0:00";
    const lastClip = track.clips.reduce((a, b) =>
      a.from + a.durationInFrames > b.from + b.durationInFrames ? a : b
    );
    return formatTime(lastClip.from + lastClip.durationInFrames, fps);
  }, [track.clips, fps]);

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className={cn("flex-shrink-0", trackColor(track.type))}>
          {track.type === "visual" ? (
            <Layers className="h-4 w-4" />
          ) : (
            <Music className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium">{trackDisplayName(track, allTracks)}</span>

          {/* Clip type badges */}
          <div className="flex items-center gap-1.5">
            {Object.entries(clipTypes).map(([type, count]) => (
              <span
                key={type}
                className={cn(
                  "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border",
                  clipTypeBadgeColor(type)
                )}
              >
                {clipTypeIcon(type)}
                {count}
              </span>
            ))}
          </div>

          <span className="text-xs text-muted-foreground ml-auto">
            {trackDuration}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Expanded clips */}
      {open && (
        <div className="border-t border-border/50 px-4 py-2 space-y-1 max-h-72 overflow-y-auto">
          {track.clips.map((clip) => (
            <ClipRow key={clip.id} clip={clip} fps={fps} totalFrames={totalFrames} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Clip Row ────────────────────────────────────────────

function ClipRow({
  clip,
  fps,
}: {
  clip: RemotionClip;
  fps: number;
  totalFrames: number;
}) {
  const startSec = (clip.from / fps).toFixed(1);
  const durSec = (clip.durationInFrames / fps).toFixed(1);

  return (
    <div className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/20 transition-colors">
      {/* Type badge */}
      <span
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] flex-shrink-0",
          clipTypeBadgeColor(clip.type)
        )}
      >
        {clipTypeIcon(clip.type)}
        {clip.type}
      </span>

      {/* Clip name */}
      <span className="truncate flex-1 text-foreground" title={clip.src}>
        {clipDisplayName(clip)}
      </span>

      {/* Timing */}
      <span className="text-muted-foreground/70 flex-shrink-0 font-mono text-[10px]">
        {startSec}s
      </span>
      <span className="text-muted-foreground/30 flex-shrink-0">→</span>
      <span className="flex-shrink-0 font-mono text-[10px]">{durSec}s</span>

      {/* Effect */}
      {clip.effect && clip.effect !== "none" && (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] flex-shrink-0">
          {clip.effect}
        </span>
      )}
      {clip.audioEffect && clip.audioEffect !== "none" && (
        <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] flex-shrink-0">
          {clip.audioEffect}
        </span>
      )}
    </div>
  );
}

// ─── Browser Render Section (Experimental Fallback) ──────

function BrowserRenderSection({ timeline }: { timeline: RemotionTimeline }) {
  const [state, setState] = useState<"idle" | "checking" | "preparing" | "rendering" | "done" | "error" | "unsupported">("idle");
  const [progress, setProgress] = useState(0);
  const [prepareLabel, setPrepareLabel] = useState("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobSize, setBlobSize] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const elapsedTime = useElapsedTimer(state === "preparing" || state === "rendering");

  // Check browser support on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { canRenderMediaOnWeb } = await import("@remotion/web-renderer");
        const result = await canRenderMediaOnWeb({
          width: timeline.width,
          height: timeline.height,
        });
        if (!cancelled && !result.canRender) {
          setState("unsupported");
        }
      } catch {
        if (!cancelled) setState("unsupported");
      }
    })();
    return () => { cancelled = true; };
  }, [timeline.width, timeline.height]);

  async function startBrowserRender() {
    setState("preparing");
    setProgress(0);
    setPrepareLabel("");
    setErrorMsg(null);
    setBlobUrl(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { renderMediaOnWeb } = await import("@remotion/web-renderer");

      // ── Phase 1: Pre-download all media as blob URLs to avoid CORS + timeouts ──
      // Collect unique source URLs
      const urlSet = new Set<string>();
      for (const track of timeline.tracks) {
        for (const clip of track.clips) {
          urlSet.add(clip.src);
        }
      }
      const allUrls = [...urlSet];
      const blobUrlMap = new Map<string, string>();
      let downloaded = 0;

      setPrepareLabel(`Descargando ${allUrls.length} archivos...`);

      // Download in parallel (max 4 concurrent to avoid overwhelming the proxy)
      const concurrency = 4;
      const queue = [...allUrls];
      async function downloadNext() {
        while (queue.length > 0) {
          if (controller.signal.aborted) return;
          const url = queue.shift()!;
          try {
            const proxyUrl = `/api/remotion/media-proxy?url=${encodeURIComponent(url)}`;
            const resp = await fetch(proxyUrl, { signal: controller.signal });
            if (resp.ok) {
              const blob = await resp.blob();
              blobUrlMap.set(url, URL.createObjectURL(blob));
            }
          } catch {
            // Failed download — will use proxy URL as fallback during render
          }
          downloaded++;
          setProgress(Math.round((downloaded / allUrls.length) * 100));
          setPrepareLabel(`Descargando ${downloaded}/${allUrls.length} archivos...`);
        }
      }
      await Promise.all(Array.from({ length: concurrency }, () => downloadNext()));

      if (controller.signal.aborted) {
        setState("idle");
        return;
      }

      // ── Phase 2: Build timeline with blob URLs ──
      const browserTimeline = {
        ...timeline,
        tracks: timeline.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            const { proxySrc: _p, ...rest } = clip;
            return {
              ...rest,
              src: blobUrlMap.get(clip.src) || `/api/remotion/media-proxy?url=${encodeURIComponent(clip.src)}`,
            };
          }),
        })),
      };

      // ── Phase 3: Render ──
      setState("rendering");
      setProgress(0);

      // Wrap DynamicVideo with web-render context so VideoClip uses @remotion/media
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const WebDynamicVideo: React.FC<any> = (props) => (
        <RenderModeContext.Provider value={true}>
          <DynamicVideo {...props} />
        </RenderModeContext.Provider>
      );

      const { getBlob } = await renderMediaOnWeb({
        composition: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component: WebDynamicVideo as any,
          durationInFrames: browserTimeline.durationInFrames,
          fps: browserTimeline.fps,
          width: browserTimeline.width,
          height: browserTimeline.height,
          id: "DynamicVideo",
          defaultProps: browserTimeline as unknown as Record<string, unknown>,
        },
        inputProps: browserTimeline as unknown as Record<string, unknown>,
        container: "webm",
        videoCodec: "vp8",
        onProgress: ({ renderedFrames }) => {
          setProgress(Math.round((renderedFrames / timeline.durationInFrames) * 100));
        },
        signal: controller.signal,
      });

      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setBlobSize(blob.size);
      setState("done");

      // Clean up downloaded blob URLs (render output blob persists)
      for (const bUrl of blobUrlMap.values()) {
        URL.revokeObjectURL(bUrl);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setState("idle");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Error en render de navegador");
        setState("error");
      }
    }
  }

  function cancelRender() {
    abortRef.current?.abort();
    setState("idle");
    setProgress(0);
  }

  function downloadBlob() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (state === "unsupported") return null;

  if (state === "done" && blobUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-400">Render en navegador completado</p>
          <p className="text-xs text-emerald-400/60 mt-0.5">
            {blobSize ? `${(blobSize / 1024 / 1024).toFixed(1)} MB · ` : ""}WebM/VP8 · {elapsedTime}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={downloadBlob}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </button>
          <button
            onClick={() => { setState("idle"); setProgress(0); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <Monitor className="h-3.5 w-3.5" />
            Re-render
          </button>
        </div>
      </div>
    );
  }

  if (state === "preparing") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Loader2 className="h-5 w-5 text-amber-400 flex-shrink-0 animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm text-amber-400">Preparando media...</p>
            <span className="text-xs text-amber-400/70 font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{prepareLabel}</p>
        </div>
        <button
          onClick={cancelRender}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex-shrink-0"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (state === "rendering") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Loader2 className="h-5 w-5 text-amber-400 flex-shrink-0 animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm text-amber-400">Renderizando en navegador...</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-amber-400/70 font-mono">
                <Timer className="h-3 w-3" />{elapsedTime}
              </span>
              <span className="text-xs text-amber-400/70 font-mono">{progress}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            WebM/VP8 · {timeline.width}x{timeline.height}
          </p>
        </div>
        <button
          onClick={cancelRender}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex-shrink-0"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-400">Error en render de navegador</p>
          {errorMsg && <p className="text-xs text-red-400/60 mt-0.5 line-clamp-2">{errorMsg}</p>}
        </div>
        <button
          onClick={startBrowserRender}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex-shrink-0"
        >
          <Monitor className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  // idle
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3">
      <Monitor className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-foreground">Render en Navegador</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Alternativa local — renderiza en tu navegador (WebM, experimental)
        </p>
      </div>
      <button
        onClick={startBrowserRender}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-500 transition-colors font-medium flex-shrink-0"
      >
        <Monitor className="h-4 w-4" />
        Renderizar Local
      </button>
    </div>
  );
}
