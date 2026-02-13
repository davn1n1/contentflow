"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useScenes } from "@/lib/hooks/use-scenes";
import { useVideo } from "@/lib/hooks/use-videos";
import { cn } from "@/lib/utils";
import type { Video, Scene } from "@/types/database";
import { ArrowLeft, Play, Image, FileText, Check, X } from "lucide-react";

const classificationColors: Record<string, string> = {
  Hook: "bg-red-500/10 text-red-400 border-red-500/20",
  Intro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Desarrollo: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CTA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Cierre: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ScenesPage() {
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const videoId = params.id as string;

  const { data: video } = useVideo(videoId);
  const { data: scenes = [], isLoading } = useScenes(videoId);

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
          <h1 className="text-xl font-bold text-foreground">Scenes Editor</h1>
          <p className="text-sm text-muted-foreground">
            {video?.titulo || "Video"} &middot; {scenes.length} scenes
          </p>
        </div>
      </div>

      {/* Scenes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : scenes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            No scenes generated yet. Run "Create Copy" to generate scenes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenes.map((scene, i) => {
            const classification = scene.clasificación_escena || "Desarrollo";
            const colorClass = classificationColors[classification] || classificationColors["Desarrollo"];

            return (
              <div key={scene.id} className="glass-card rounded-xl overflow-hidden">
                <div className="flex">
                  {/* Scene number + classification */}
                  <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center border-r border-border bg-muted/30 py-4">
                    <span className="text-lg font-bold text-foreground">
                      {scene.n_escena || i + 1}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full border",
                        colorClass
                      )}
                    >
                      {classification}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 space-y-3">
                    {/* Script */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Script
                        </span>
                        {scene.copy_revisado_ok && (
                          <Check className="w-3 h-3 text-success" />
                        )}
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                        {scene.script || scene.script_elevenlabs || "No script"}
                      </p>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {scene.duration && (
                        <span>
                          {scene.start?.toFixed(1)}s - {scene.end?.toFixed(1)}s ({scene.duration.toFixed(1)}s)
                        </span>
                      )}
                      {scene.camera && <span>Camera: {scene.camera}</span>}
                      {scene.topic && (
                        <span className="text-primary">{scene.topic}</span>
                      )}
                    </div>
                  </div>

                  {/* Slide preview */}
                  <div className="w-32 flex-shrink-0 border-l border-border bg-muted/20 flex flex-col items-center justify-center p-2 gap-2">
                    {scene.url_slide_s3 ? (
                      <img
                        src={scene.url_slide_s3}
                        alt={`Scene ${scene.n_escena} slide`}
                        className="w-full h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Audio status */}
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {scene.status_audio || "pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
