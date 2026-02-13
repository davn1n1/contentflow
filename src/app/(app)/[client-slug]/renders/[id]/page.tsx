"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useVideo } from "@/lib/hooks/use-videos";
import type { AeRender } from "@/types/database";
import { cn } from "@/lib/utils";
import { ArrowLeft, Image, Check, Clock, AlertCircle } from "lucide-react";

export default function RendersPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const videoId = params.id as string;
  const { data: video } = useVideo(videoId);

  const { data: renders = [], isLoading } = useQuery({
    queryKey: ["renders", videoId],
    queryFn: async (): Promise<AeRender[]> => {
      // Fetch video to get render IDs from Airtable linked records
      const videoRes = await fetch(`/api/data/videos?id=${videoId}`);
      if (!videoRes.ok) return [];
      const videoData = await videoRes.json();
      const renderIds: string[] = videoData?.ae_render_ids || [];
      if (renderIds.length === 0) return [];

      const res = await fetch(`/api/data/renders?ids=${renderIds.join(",")}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!videoId,
  });

  const statusIcon = (status: string | null) => {
    if (!status) return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    if (status.toLowerCase().includes("done") || status.toLowerCase().includes("complete"))
      return <Check className="w-3.5 h-3.5 text-success" />;
    if (status.toLowerCase().includes("error"))
      return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Clock className="w-3.5 h-3.5 text-warning animate-pulse" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${clientSlug}/videos/${videoId}`}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Render Manager</h1>
          <p className="text-sm text-muted-foreground">
            {video?.titulo || "Video"} &middot; {renders.length} renders
          </p>
        </div>
      </div>

      {/* Timeline overview */}
      {renders.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Timeline</h3>
          <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
            {renders.map((render) => {
              const totalDuration = Math.max(
                ...renders.map((r) => (r.end || 0)),
                1
              );
              const left = ((render.start || 0) / totalDuration) * 100;
              const width = Math.max(
                (((render.end || 0) - (render.start || 0)) / totalDuration) * 100,
                2
              );

              return (
                <div
                  key={render.id}
                  className={cn(
                    "absolute top-1 bottom-1 rounded transition-all hover:brightness-125",
                    render.activa ? "bg-primary/60" : "bg-muted-foreground/20"
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`Render #${render.n_render}: ${render.start}s - ${render.end}s`}
                >
                  <span className="text-[9px] text-foreground/70 px-1 truncate block mt-0.5">
                    {render.n_render}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Renders list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : renders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            No renders yet. Run the pipeline to generate renders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renders.map((render) => (
            <div key={render.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-foreground">
                  Render #{render.n_render}
                </span>
                <div className="flex items-center gap-1.5">
                  {statusIcon(render.status)}
                  <span className="text-xs text-muted-foreground">
                    {render.status || "Pending"}
                  </span>
                </div>
              </div>

              {/* Slide preview */}
              {render.url_slide_s3 ? (
                <img
                  src={render.url_slide_s3}
                  alt={`Render ${render.n_render}`}
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-24 bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {render.start?.toFixed(1)}s - {render.end?.toFixed(1)}s
                </span>
                <span>
                  {render.duration_total_escena?.toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
