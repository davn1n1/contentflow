"use client";

import { cn } from "@/lib/utils";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { useVideoDetail } from "@/lib/hooks/use-video-detail";
import type { VideoWithScenes } from "@/lib/hooks/use-video-detail";
import {
  FileText, Headphones, Film, ImageIcon, Clapperboard,
  CheckCircle2, ChevronRight, Clock, Hash, AlignLeft,
} from "lucide-react";

// ─── 5-Phase Pipeline Definition ─────────────────────────────
const PHASES = [
  {
    key: "copy",
    tabKey: "copy",
    number: 1,
    label: "Copy",
    subtitle: "AI Script Generation",
    icon: FileText,
    getStatus: (v: VideoWithScenes) => !!v.status_copy,
  },
  {
    key: "audio",
    tabKey: "audio",
    number: 2,
    label: "Audio",
    subtitle: "ElevenLabs + HeyGen",
    icon: Headphones,
    getStatus: (v: VideoWithScenes) => !!v.status_audio,
  },
  {
    key: "montaje",
    tabKey: "montaje",
    number: 3,
    label: "Montaje Video",
    subtitle: "Avatares + Escenas",
    icon: Film,
    getStatus: (v: VideoWithScenes) => !!v.status_avatares,
  },
  {
    key: "miniaturas",
    tabKey: "miniaturas",
    number: 4,
    label: "Miniaturas",
    subtitle: "Thumbnails A/B/C",
    icon: ImageIcon,
    getStatus: (v: VideoWithScenes) => !!v.portada_a,
  },
  {
    key: "render",
    tabKey: "render",
    number: 5,
    label: "Render Final",
    subtitle: "Shotstack + YouTube",
    icon: Clapperboard,
    getStatus: (v: VideoWithScenes) => !!v.status_rendering_video,
  },
] as const;

// ─── Component Props ─────────────────────────────────────────
interface PipelineHeaderProps {
  /** Active tab key (for Video Studio) or currentPhase (for standalone pages) */
  activeTab?: string;
  currentPhase?: string;
  /** Pass video directly to avoid duplicate fetch */
  video?: VideoWithScenes | null;
  /** Tab click handler — when provided, phase cards become clickable */
  onTabChange?: (tab: string) => void;
}

export function PipelineHeader({ activeTab, currentPhase, video: videoProp, onTabChange }: PipelineHeaderProps) {
  const { activeVideoId, activeVideoName, activeVideoTitle } = useVideoContextStore();
  const { data: fetchedVideo } = useVideoDetail(videoProp ? null : activeVideoId);
  const video = videoProp || fetchedVideo;

  if (!video && !activeVideoId) return null;

  const title = video?.titulo || activeVideoTitle || `Video #${activeVideoName || ""}`;
  const name = video?.name || activeVideoName;
  const resolvedTab = activeTab || currentPhase || "copy";

  return (
    <div className="border-b border-border bg-gradient-to-r from-background via-background to-card">
      {/* Video Identity */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-bold ring-1 ring-primary/20">
            {name || "#"}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {video?.id || activeVideoId}
            </p>
          </div>

          {/* Video Stats Pills */}
          {video && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {video.extension_listado && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <AlignLeft className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{video.extension_listado}</span>
                </div>
              )}
              {video.extension_palabras != null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{video.extension_palabras.toLocaleString()} palabras</span>
                </div>
              )}
              {video.estimated_duration && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{video.estimated_duration}</span>
                </div>
              )}
              {!video.estimated_duration && video.voice_length_minutes && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{video.voice_length_minutes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Phases — 5 clickable phase cards with status */}
      {video && (
      <div className="px-6 pb-4">
        <div className="flex items-center gap-1.5">
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isActive = resolvedTab === phase.tabKey;
            const isCompleted = phase.getStatus(video);
            const isClickable = !!onTabChange;

            return (
              <div key={phase.key} className="flex items-center flex-1 min-w-0">
                {/* Arrow between phases */}
                {i > 0 && (
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0 mx-0.5",
                    isCompleted ? "text-emerald-500/60" : "text-border"
                  )} />
                )}

                {/* Phase Card — clickable when onTabChange provided */}
                <button
                  onClick={isClickable ? () => onTabChange(phase.tabKey) : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all flex-1 min-w-0 text-left",
                    isClickable && "hover:brightness-110 cursor-pointer",
                    !isClickable && "cursor-default",
                    isActive && !isCompleted && "bg-primary/8 border-primary/30 ring-1 ring-primary/20",
                    isActive && isCompleted && "bg-emerald-500/8 border-emerald-500/30 ring-1 ring-emerald-500/20",
                    !isActive && isCompleted && "bg-emerald-500/5 border-emerald-500/20",
                    !isActive && !isCompleted && "bg-card/50 border-border/50",
                    !isActive && !isCompleted && isClickable && "hover:border-border",
                  )}
                >
                  {/* Number Badge */}
                  <div className={cn(
                    "absolute -top-1.5 -left-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold",
                    isActive && !isCompleted && "bg-primary text-primary-foreground",
                    isCompleted && "bg-emerald-500 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground border border-border",
                  )}>
                    {phase.number}
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isActive && !isCompleted && "bg-primary/10",
                    isCompleted && "bg-emerald-500/10",
                    !isActive && !isCompleted && "bg-muted/50",
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Icon className={cn(
                        "w-4 h-4",
                        isActive && "text-primary",
                        !isActive && "text-muted-foreground/50",
                      )} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <p className={cn(
                      "text-xs font-semibold truncate",
                      isActive && !isCompleted && "text-foreground",
                      isCompleted && "text-emerald-400",
                      !isActive && !isCompleted && "text-muted-foreground",
                    )}>
                      {phase.label}
                    </p>
                    <p className={cn(
                      "text-[10px] truncate",
                      isActive && !isCompleted && "text-muted-foreground",
                      isCompleted && "text-emerald-400/60",
                      !isActive && !isCompleted && "text-muted-foreground/40",
                    )}>
                      {phase.subtitle}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
