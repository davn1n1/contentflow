"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { DynamicVideo } from "@/lib/remotion/compositions/DynamicVideo";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Film,
  Clock,
  Monitor,
  Image,
  Volume2,
  Video,
  CheckCircle2,
  Shield,
  Pencil,
  Rocket,
  Zap,
  ArrowDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  RemotionTimelineRecord,
  RemotionTimeline,
} from "@/lib/remotion/types";

// ─── Quality Presets ───────────────────────────────────

type QualityPreset = "lite" | "hd";

const QUALITY_PRESETS: Record<QualityPreset, { imgWidth: number; imgQuality: number; label: string; desc: string }> = {
  lite: { imgWidth: 480, imgQuality: 50, label: "Lite", desc: "480p · WebP q50 — carga ultra rapida" },
  hd:   { imgWidth: 720, imgQuality: 75, label: "HD",   desc: "720p · WebP q75 — calidad media" },
};

// ─── Proxy Timeline Transformer ────────────────────────

interface AssetStats {
  videos: { total: number; proxied: number; urls: string[] };
  images: { total: number; proxied: number; urls: string[] };
  audios: { total: number; proxied: number; urls: string[] };
}

/**
 * Creates a version of the timeline where all asset URLs are proxied
 * through our CDN for fast preview playback.
 *
 * - Video: uses CF Stream proxy_url if available, otherwise /api/proxy/media
 * - Image: Next.js Image Optimization (WebP/AVIF auto) with quality preset
 * - Audio: always /api/proxy/media
 * - Template: no change (local code)
 *
 * For Lambda render, use the ORIGINAL timeline (full quality, no proxy).
 */
function createProxyTimeline(
  timeline: RemotionTimeline,
  cfProxies?: Map<string, string>,
  quality: QualityPreset = "lite"
): { proxied: RemotionTimeline; stats: AssetStats } {
  const proxied = JSON.parse(JSON.stringify(timeline)) as RemotionTimeline;
  const preset = QUALITY_PRESETS[quality];

  const stats: AssetStats = {
    videos: { total: 0, proxied: 0, urls: [] },
    images: { total: 0, proxied: 0, urls: [] },
    audios: { total: 0, proxied: 0, urls: [] },
  };

  for (const track of proxied.tracks) {
    for (const clip of track.clips) {
      if (clip.type === "template") continue;

      if (clip.type === "video") {
        stats.videos.total++;
        // Prefer CF Stream proxy if available
        const cfProxy = cfProxies?.get(clip.src);
        if (cfProxy) {
          clip.proxySrc = cfProxy;
          stats.videos.proxied++;
          stats.videos.urls.push("CF Stream");
        } else {
          clip.proxySrc = `/api/proxy/media?url=${encodeURIComponent(clip.src)}`;
          stats.videos.proxied++;
          stats.videos.urls.push("Vercel CDN");
        }
      } else if (clip.type === "image") {
        stats.images.total++;
        // Next.js Image Optimization: auto WebP/AVIF + resize based on quality preset
        clip.proxySrc = `/_next/image?url=${encodeURIComponent(clip.src)}&w=${preset.imgWidth}&q=${preset.imgQuality}`;
        stats.images.proxied++;
      } else if (clip.type === "audio") {
        stats.audios.total++;
        clip.proxySrc = `/api/proxy/media?url=${encodeURIComponent(clip.src)}`;
        stats.audios.proxied++;
      }
    }
  }

  return { proxied, stats };
}

// ─── Format helpers ────────────────────────────────────

function formatDuration(frames: number, fps: number) {
  const totalSec = Math.round(frames / fps);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── Preview Page ──────────────────────────────────────

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const playerRef = useRef<PlayerRef>(null);

  const [record, setRecord] = useState<RemotionTimelineRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cfProxies, setCfProxies] = useState<Map<string, string>>(new Map());
  const [quality, setQuality] = useState<QualityPreset>("lite");
  // Original asset sizes (from source URLs)
  const [originalSizes, setOriginalSizes] = useState<Map<string, number>>(new Map());
  // Optimized asset sizes (from proxied/CDN URLs)
  const [optimizedSizes, setOptimizedSizes] = useState<Map<string, number>>(new Map());
  const [sizesLoading, setSizesLoading] = useState(false);
  const [optimizedSizesLoading, setOptimizedSizesLoading] = useState(false);

  // Fetch timeline + CF proxies in parallel
  useEffect(() => {
    async function load() {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        setError("ID de timeline invalido");
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data, error: dbErr } = await supabase
        .from("remotion_timelines")
        .select(
          "id, video_id, video_name, status, render_url, render_id, render_bucket, remotion_timeline, created_at, updated_at"
        )
        .eq("id", id)
        .single();

      if (dbErr || !data) {
        setError(dbErr?.message || "Timeline no encontrada");
        setLoading(false);
        return;
      }

      const rec = data as RemotionTimelineRecord;
      setRecord(rec);

      // Fetch CF Stream proxies for videos
      const tl = rec.remotion_timeline as RemotionTimeline;
      const videoUrls = new Set<string>();
      for (const track of tl.tracks) {
        for (const clip of track.clips) {
          if (clip.type === "video") videoUrls.add(clip.src);
        }
      }

      if (videoUrls.size > 0) {
        const { data: proxies } = await supabase
          .from("video_proxies")
          .select("original_url, proxy_url, status")
          .in("original_url", [...videoUrls])
          .eq("status", "ready")
          .not("proxy_url", "is", null);

        if (proxies && proxies.length > 0) {
          const map = new Map(
            proxies.map(
              (p: { original_url: string; proxy_url: string }) =>
                [p.original_url, p.proxy_url] as const
            )
          );
          setCfProxies(map);
        }
      }

      setLoading(false);

      // Fetch original asset sizes in background
      const allUrls: string[] = [];
      for (const track of tl.tracks) {
        for (const clip of track.clips) {
          if (clip.type !== "template") allUrls.push(clip.src);
        }
      }
      if (allUrls.length > 0) {
        setSizesLoading(true);
        fetch("/api/proxy/media/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: allUrls }),
        })
          .then((r) => r.json())
          .then((data: Record<string, { size: number | null }>) => {
            const map = new Map<string, number>();
            for (const [url, info] of Object.entries(data)) {
              if (info.size) map.set(url, info.size);
            }
            setOriginalSizes(map);
          })
          .catch(() => {})
          .finally(() => setSizesLoading(false));
      }
    }
    load();
  }, [id]);

  const rawTimeline = record?.remotion_timeline as
    | RemotionTimeline
    | undefined;

  // Create proxied timeline (depends on quality preset)
  const { proxiedTimeline, stats } = useMemo(() => {
    if (!rawTimeline)
      return {
        proxiedTimeline: null,
        stats: {
          videos: { total: 0, proxied: 0, urls: [] },
          images: { total: 0, proxied: 0, urls: [] },
          audios: { total: 0, proxied: 0, urls: [] },
        },
      };
    const { proxied, stats } = createProxyTimeline(rawTimeline, cfProxies, quality);
    return { proxiedTimeline: proxied, stats };
  }, [rawTimeline, cfProxies, quality]);

  // Fetch optimized sizes for images after timeline is proxied
  const fetchOptimizedSizes = useCallback(async () => {
    if (!proxiedTimeline) return;

    setOptimizedSizesLoading(true);
    const imageProxies: { src: string; proxySrc: string }[] = [];
    for (const track of proxiedTimeline.tracks) {
      for (const clip of track.clips) {
        if (clip.type === "image" && clip.proxySrc) {
          imageProxies.push({ src: clip.src, proxySrc: clip.proxySrc });
        }
      }
    }

    if (imageProxies.length === 0) {
      setOptimizedSizesLoading(false);
      return;
    }

    // Fetch each /_next/image URL via HEAD to get Content-Length
    // (Next.js generates optimized image on first request)
    const map = new Map<string, number>();
    const chunks: typeof imageProxies[] = [];
    for (let i = 0; i < imageProxies.length; i += 5) {
      chunks.push(imageProxies.slice(i, i + 5));
    }

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(async ({ src, proxySrc }) => {
          // GET request (not HEAD) because /_next/image needs to generate the image first
          const res = await fetch(proxySrc);
          const blob = await res.blob();
          map.set(src, blob.size);
        })
      );
      // Ignore individual failures
      void results;
    }

    setOptimizedSizes(map);
    setOptimizedSizesLoading(false);
  }, [proxiedTimeline]);

  // Auto-fetch optimized sizes when quality changes and original sizes are loaded
  useEffect(() => {
    if (proxiedTimeline && originalSizes.size > 0) {
      fetchOptimizedSizes();
    }
  }, [proxiedTimeline, originalSizes.size, fetchOptimizedSizes]);

  // Memoize inputProps for Player
  const inputProps = useMemo(() => {
    if (!proxiedTimeline) return null;
    return { ...proxiedTimeline } as unknown as Record<string, unknown>;
  }, [proxiedTimeline]);

  // ─── Loading / Error states ──────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !record || !proxiedTimeline || !inputProps) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-400">
          {error || "Timeline no encontrada"}
        </p>
        <Link
          href="/remotion"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Volver a timelines
        </Link>
      </div>
    );
  }

  const tl = proxiedTimeline;
  const clipCount = tl.tracks.reduce((sum, t) => sum + t.clips.length, 0);
  const totalAssets = stats.videos.total + stats.images.total + stats.audios.total;
  const totalProxied = stats.videos.proxied + stats.images.proxied + stats.audios.proxied;

  // Calculate original sizes by type
  const originalByType = { video: 0, image: 0, audio: 0, total: 0 };
  const optimizedByType = { video: 0, image: 0, audio: 0, total: 0 };
  for (const track of tl.tracks) {
    for (const clip of track.clips) {
      if (clip.type === "template") continue;
      const origSize = originalSizes.get(clip.src) || 0;
      const optSize = optimizedSizes.get(clip.src) || 0;
      if (clip.type === "video") {
        originalByType.video += origSize;
        optimizedByType.video += origSize; // Video: same (no transcoding)
      } else if (clip.type === "image") {
        originalByType.image += origSize;
        optimizedByType.image += optSize || origSize; // Fallback to original if not measured yet
      } else if (clip.type === "audio") {
        originalByType.audio += origSize;
        optimizedByType.audio += origSize; // Audio: same (no transcoding)
      }
      originalByType.total += origSize;
      optimizedByType.total += (clip.type === "image" ? (optSize || origSize) : origSize);
    }
  }
  const totalSavings = originalByType.total > 0
    ? Math.round((1 - optimizedByType.total / originalByType.total) * 100)
    : 0;

  // Parse #NUM — Title
  const nameMatch = record.video_name?.match(/^#(\d+)\s*[—–-]\s*(.+)$/);
  const videoNum = nameMatch?.[1];
  const videoTitle = nameMatch?.[2] || record.video_name || "Sin titulo";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/remotion"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Timelines
          </Link>
          <span className="text-xs text-muted-foreground/50">/</span>
          <span className="text-xs text-cyan-400 font-medium">
            Preview CDN
          </span>
        </div>

        {/* Title card */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Film className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {videoNum && (
                  <span className="inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    #{videoNum}
                  </span>
                )}
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {videoTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {tl.width}x{tl.height}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(tl.durationInFrames, tl.fps)}
            </span>
            <span>{tl.fps} fps</span>
            <span>{clipCount} clips</span>
            <span>{tl.tracks.length} tracks</span>
          </div>
        </div>

        {/* CDN Proxy Status + Quality Toggle */}
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-medium text-cyan-400">
              CDN Proxy Preview
            </h2>

            {/* Quality toggle */}
            <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/30 bg-background/50 p-0.5">
              {(Object.keys(QUALITY_PRESETS) as QualityPreset[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setQuality(key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                    quality === key
                      ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={QUALITY_PRESETS[key].desc}
                >
                  {QUALITY_PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary line with savings */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-cyan-400/70 font-mono">
              {totalProxied}/{totalAssets} proxiados
            </span>
            {originalByType.total > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-mono">
                  {formatSize(originalByType.total)}
                </span>
                {totalSavings > 0 && (
                  <>
                    <ArrowDown className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 font-mono font-medium">
                      {formatSize(optimizedByType.total)} (−{totalSavings}%)
                    </span>
                  </>
                )}
              </>
            )}
            {(sizesLoading || optimizedSizesLoading) && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Videos */}
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Video className="h-3.5 w-3.5 text-blue-400" />
                Video
              </div>
              <p className="text-lg font-semibold text-foreground">
                {stats.videos.total}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {originalByType.video > 0 ? formatSize(originalByType.video) : cfProxies.size > 0
                  ? `${cfProxies.size} CF + ${stats.videos.total - cfProxies.size} Vercel`
                  : "Via Vercel CDN"}
              </p>
            </div>

            {/* Images */}
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Image className="h-3.5 w-3.5 text-green-400" />
                Imagen
              </div>
              <p className="text-lg font-semibold text-foreground">
                {stats.images.total}
              </p>
              {originalByType.image > 0 && optimizedByType.image > 0 && optimizedByType.image < originalByType.image ? (
                <div className="text-[10px] space-y-0.5">
                  <p className="text-muted-foreground line-through">
                    {formatSize(originalByType.image)}
                  </p>
                  <p className="text-green-400 font-medium flex items-center gap-0.5">
                    <Zap className="h-2.5 w-2.5" />
                    {formatSize(optimizedByType.image)} (−{Math.round((1 - optimizedByType.image / originalByType.image) * 100)}%)
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {originalByType.image > 0 ? formatSize(originalByType.image) : `WebP ${QUALITY_PRESETS[quality].imgWidth}p`}
                </p>
              )}
            </div>

            {/* Audio */}
            <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                Audio
              </div>
              <p className="text-lg font-semibold text-foreground">
                {stats.audios.total}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {originalByType.audio > 0 ? formatSize(originalByType.audio) : "Via Vercel CDN"}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-cyan-400/50">
            Imagenes: WebP/AVIF via Next.js ({QUALITY_PRESETS[quality].imgWidth}p q{QUALITY_PRESETS[quality].imgQuality}).
            Video/Audio: CDN passthrough. Lambda render usa URLs originales full quality.
          </p>
        </div>

        {/* Player */}
        <div className="rounded-xl overflow-hidden border border-border/50 bg-black">
          <Player
            ref={playerRef}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component={DynamicVideo as any}
            inputProps={inputProps}
            durationInFrames={tl.durationInFrames}
            fps={tl.fps}
            compositionWidth={tl.width}
            compositionHeight={tl.height}
            style={{ width: "100%" }}
            controls
            autoPlay={false}
            loop={false}
            clickToPlay
            bufferStateDelayInMilliseconds={300}
          />
        </div>

        {/* Action Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/remotion/${id}`}
            className="flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/50 transition-colors font-medium"
          >
            <Pencil className="h-4 w-4" />
            Abrir en Editor
          </Link>
          <Link
            href={`/remotion/${id}/render`}
            className="flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium"
          >
            <Rocket className="h-4 w-4" />
            Render (Lite)
          </Link>
        </div>

        {/* Asset Detail Table */}
        <details className="rounded-xl border border-border/50 bg-card">
          <summary className="px-5 py-3 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Detalle de assets proxiados ({totalAssets})
          </summary>
          <div className="border-t border-border/30 max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium">Nombre</th>
                  <th className="text-right px-4 py-2 font-medium">Original</th>
                  <th className="text-right px-4 py-2 font-medium">Optimizado</th>
                  <th className="text-left px-4 py-2 font-medium">Proxy</th>
                </tr>
              </thead>
              <tbody>
                {tl.tracks.flatMap((track) =>
                  track.clips
                    .filter((clip) => clip.type !== "template")
                    .map((clip) => {
                      const origSize = originalSizes.get(clip.src);
                      const optSize = clip.type === "image" ? optimizedSizes.get(clip.src) : origSize;
                      const hasSavings = origSize && optSize && optSize < origSize;
                      const savingPct = hasSavings ? Math.round((1 - optSize / origSize) * 100) : 0;

                      return (
                        <tr
                          key={clip.id}
                          className="border-b border-border/20 hover:bg-muted/20"
                        >
                          <td className="px-4 py-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                clip.type === "video"
                                  ? "bg-blue-500/10 text-blue-400"
                                  : clip.type === "image"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {clip.type}
                            </span>
                          </td>
                          <td className="px-4 py-1.5 text-foreground truncate max-w-[180px]">
                            {clip.name}
                          </td>
                          <td className="px-4 py-1.5 text-right font-mono text-muted-foreground">
                            {origSize
                              ? formatSize(origSize)
                              : sizesLoading ? "..." : "—"}
                          </td>
                          <td className="px-4 py-1.5 text-right font-mono">
                            {optSize && hasSavings ? (
                              <span className="text-green-400">
                                {formatSize(optSize)}
                                <span className="text-green-500/70 ml-1">−{savingPct}%</span>
                              </span>
                            ) : optSize ? (
                              <span className="text-muted-foreground">{formatSize(optSize)}</span>
                            ) : optimizedSizesLoading && clip.type === "image" ? (
                              <span className="text-muted-foreground">...</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-1.5">
                            <span className="flex items-center gap-1 text-cyan-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {clip.type === "video" && cfProxies.has(clip.src)
                                ? "CF Stream"
                                : clip.type === "image"
                                  ? `WebP ${QUALITY_PRESETS[quality].imgWidth}p`
                                  : "Vercel CDN"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
