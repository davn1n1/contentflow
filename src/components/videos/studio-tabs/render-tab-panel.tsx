"use client";

import { Play, Clock, Check, AlertCircle, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRenders } from "@/lib/hooks/use-renders";
import { ActionButton } from "@/components/scripts/script-audio-detail";
import { getEngineColor } from "@/lib/constants/engine-colors";
import type { VideoWithScenes } from "@/lib/hooks/use-video-detail";
import type { AeRender } from "@/types/database";

function statusIcon(status: string | null) {
  if (!status) return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  if (status.toLowerCase().includes("done") || status.toLowerCase().includes("complete"))
    return <Check className="w-3.5 h-3.5 text-success" />;
  if (status.toLowerCase().includes("error"))
    return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
  return <Clock className="w-3.5 h-3.5 text-warning animate-pulse" />;
}

function getRenderVideoUrl(render: AeRender): string | null {
  if (render.render_engine === "Remotion") return render.url_s3_remotion;
  return render.url_s3_plainly;
}

export function RenderTabPanel({ video }: { video: VideoWithScenes }) {
  const { data: renders = [], isLoading } = useRenders(video.id);

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Action: Render Final */}
      <ActionButton
        videoId={video.id}
        action="ProcesoFinalRender"
        label="Render Final"
        confirmLabel="Confirmar render final"
        icon={<Play className="w-5 h-5" />}
        color="rose"
      />

      {/* Timeline overview */}
      {renders.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Timeline</h3>
          <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
            {renders.map((render) => {
              const totalDuration = Math.max(
                ...renders.map((r) => r.end || 0),
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
            No hay renders todavía. Ejecuta el pipeline para generar renders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renders.map((render) => (
            <div key={render.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Render #{render.n_render}
                  </span>
                  {render.render_engine && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border",
                      getEngineColor(render.render_engine).text,
                      getEngineColor(render.render_engine).bg,
                      getEngineColor(render.render_engine).border,
                    )}>
                      {render.render_engine}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(render.status)}
                  <span className="text-xs text-muted-foreground">
                    {render.status || "Pending"}
                  </span>
                </div>
              </div>

              {render.url_slide_s3 ? (
                // eslint-disable-next-line @next/next/no-img-element
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

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {render.start?.toFixed(1)}s - {render.end?.toFixed(1)}s
                </span>
                <span>
                  {render.duration_total_escena?.toFixed(1)}s
                </span>
              </div>

              {getRenderVideoUrl(render) && (
                <a
                  href={getRenderVideoUrl(render)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-primary hover:underline truncate"
                >
                  Ver video renderizado
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
