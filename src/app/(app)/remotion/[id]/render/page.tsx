"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Rocket,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Timer,
  Upload,
  Film,
  Clock,
  Monitor,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RemotionTimelineRecord, RemotionTimeline } from "@/lib/remotion/types";

// ─── Elapsed Timer ──────────────────────────────────────
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
  }, [running]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ─── Format duration ────────────────────────────────────
function formatDuration(frames: number, fps: number) {
  const totalSec = Math.round(frames / fps);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Quick Render Page ──────────────────────────────────
export default function QuickRenderPage() {
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<RemotionTimelineRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline record (minimal fields)
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
        .select("id, video_id, video_name, status, render_url, render_id, render_bucket, remotion_timeline, created_at, updated_at")
        .eq("id", id)
        .single();

      if (dbErr || !data) {
        setError(dbErr?.message || "Timeline no encontrada");
        setLoading(false);
        return;
      }
      setRecord(data as RemotionTimelineRecord);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-400">{error || "Timeline no encontrada"}</p>
        <Link href="/remotion" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Volver a timelines
        </Link>
      </div>
    );
  }

  const tl = record.remotion_timeline as RemotionTimeline;
  const clipCount = tl.tracks.reduce((sum, t) => sum + t.clips.length, 0);

  // Parse #NUM — Title
  const nameMatch = record.video_name?.match(/^#(\d+)\s*[—–-]\s*(.+)$/);
  const videoNum = nameMatch?.[1];
  const videoTitle = nameMatch?.[2] || record.video_name || "Sin título";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/remotion"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Timelines
          </Link>
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
                <h1 className="text-lg font-semibold text-foreground truncate">{videoTitle}</h1>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              {tl.width}×{tl.height}
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

        {/* Render Section */}
        <RenderCard
          timelineId={record.id}
          initialStatus={record.status}
          initialRenderUrl={record.render_url}
          savedRenderId={record.render_id}
          savedRenderBucket={record.render_bucket}
        />

        {/* Link to full editor */}
        <Link
          href={`/remotion/${id}`}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          Abrir en Editor completo
        </Link>
      </div>
    </div>
  );
}

// ─── Render Card (self-contained) ───────────────────────
function RenderCard({
  timelineId,
  initialStatus,
  initialRenderUrl,
  savedRenderId,
  savedRenderBucket,
}: {
  timelineId: string;
  initialStatus: string;
  initialRenderUrl?: string;
  savedRenderId?: string;
  savedRenderBucket?: string;
}) {
  const canResume = initialStatus === "rendering" && savedRenderId && savedRenderBucket;

  const [renderState, setRenderState] = useState<
    "idle" | "launching" | "rendering" | "done" | "error"
  >(
    initialStatus === "rendered" && initialRenderUrl
      ? "done"
      : initialStatus === "published" && initialRenderUrl
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

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(initialStatus === "published");

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

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
      if (!res.ok || data.error) throw new Error(data.error || "Error al lanzar render");

      setRenderInfo(data);
      setRenderState("rendering");
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
          return;
        }

        if (data.done) {
          setProgress(100);
          setRenderUrl(data.url);
          setRenderSize(data.size);
          setRenderState("done");
          return;
        }

        setProgress(Math.round((data.progress ?? 0) * 100));
        pollRef.current = setTimeout(check, 3000);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error al verificar progreso");
        setRenderState("error");
      }
    }
    pollRef.current = setTimeout(check, 3000);
  }

  async function publishToS3() {
    setPublishing(true);
    try {
      const res = await fetch("/api/remotion/publish-s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error al publicar");
      setPublished(true);
    } catch (err) {
      console.error("Publish error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Rocket className="h-4 w-4" />
        Render Lambda
      </h2>

      {/* DONE */}
      {renderState === "done" && renderUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">Render completado</p>
              <p className="text-xs text-green-400/60 mt-0.5">
                {renderSize ? `${(renderSize / 1024 / 1024).toFixed(1)} MB · ` : ""}{elapsedTime}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <a
              href={renderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver MP4
            </a>
            <a
              href={renderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
            <button
              onClick={launchRender}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <Rocket className="h-3.5 w-3.5" />
              Re-render
            </button>
          </div>

          {/* Publish */}
          {published ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-emerald-400">Publicado — URL guardada en Airtable</p>
            </div>
          ) : (
            <button
              onClick={publishToS3}
              disabled={publishing}
              className="flex items-center gap-2 w-full justify-center text-sm px-4 py-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50 font-medium"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {publishing ? "Publicando..." : "Publicar en S3 → Airtable"}
            </button>
          )}
        </div>
      )}

      {/* LAUNCHING */}
      {renderState === "launching" && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 animate-spin" />
          <p className="text-sm text-blue-400 flex-1">Lanzando render en AWS Lambda...</p>
          <span className="flex items-center gap-1 text-xs text-blue-400/70 font-mono flex-shrink-0">
            <Timer className="h-3 w-3" />{elapsedTime}
          </span>
        </div>
      )}

      {/* RENDERING */}
      {renderState === "rendering" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-400">Renderizando en Lambda...</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-blue-400/70 font-mono">
                <Timer className="h-3 w-3" />{elapsedTime}
              </span>
              <span className="text-xs text-blue-400/70 font-mono">{progress}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {renderInfo && (
            <p className="text-[10px] text-muted-foreground">
              {renderInfo.estimatedChunks} chunks · {renderInfo.framesPerLambda} frames/lambda
            </p>
          )}
        </div>
      )}

      {/* ERROR */}
      {renderState === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-400">Error en render</p>
              {errorMsg && <p className="text-xs text-red-400/60 mt-0.5 line-clamp-2">{errorMsg}</p>}
            </div>
          </div>
          <button
            onClick={launchRender}
            className="flex items-center justify-center gap-1.5 w-full text-sm px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Rocket className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      )}

      {/* IDLE */}
      {renderState === "idle" && (
        <button
          onClick={launchRender}
          className="flex items-center justify-center gap-2 w-full text-sm px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium"
        >
          <Rocket className="h-4 w-4" />
          Renderizar en Lambda
        </button>
      )}
    </div>
  );
}
