"use client";

import { cn } from "@/lib/utils";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { useVideoDetail } from "@/lib/hooks/use-video-detail";
import {
  FileText, Headphones, Video, Tv,
  CheckCircle2, ChevronRight,
} from "lucide-react";

const PHASES = [
  {
    key: "copy",
    number: 1,
    label: "Create Copy",
    subtitle: "AI Script Generation",
    icon: FileText,
    statusField: "status_copy" as const,
  },
  {
    key: "audio",
    number: 2,
    label: "Create Audio",
    subtitle: "ElevenLabs + HeyGen",
    icon: Headphones,
    statusField: "status_audio" as const,
  },
  {
    key: "video",
    number: 3,
    label: "Create Video",
    subtitle: "Avatar Generation",
    icon: Video,
    statusField: "status_avatares" as const,
  },
  {
    key: "render",
    number: 4,
    label: "Render Final",
    subtitle: "Shotstack + YouTube",
    icon: Tv,
    statusField: "status_rendering_video" as const,
  },
];

interface PipelineHeaderProps {
  currentPhase?: string;
}

export function PipelineHeader({ currentPhase }: PipelineHeaderProps) {
  const { activeVideoId, activeVideoName, activeVideoTitle } = useVideoContextStore();
  const { data: video } = useVideoDetail(activeVideoId);

  if (!activeVideoId) return null;

  const title = video?.titulo || activeVideoTitle || `Video #${activeVideoName || ""}`;
  const name = video?.name || activeVideoName;

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
              {activeVideoId}
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Phases - Large Cards */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2">
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isActive = currentPhase === phase.key;
            const isCompleted = video ? !!video[phase.statusField] : false;
            const currentIndex = PHASES.findIndex(p => p.key === currentPhase);
            const isPast = currentIndex > i;

            return (
              <div key={phase.key} className="flex items-center flex-1 min-w-0">
                {/* Arrow between phases */}
                {i > 0 && (
                  <ChevronRight className={cn(
                    "w-5 h-5 shrink-0 mx-1",
                    (isCompleted || isPast) ? "text-emerald-500/60" : "text-border"
                  )} />
                )}

                {/* Phase Card */}
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all flex-1 min-w-0",
                    isActive && "bg-primary/5 border-primary/30 ring-1 ring-primary/20",
                    !isActive && isCompleted && "bg-emerald-500/5 border-emerald-500/20",
                    !isActive && !isCompleted && "bg-card/50 border-border/50",
                  )}
                >
                  {/* Number Badge */}
                  <div className={cn(
                    "absolute -top-2 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    isActive && "bg-primary text-primary-foreground",
                    !isActive && isCompleted && "bg-emerald-500 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  )}>
                    {phase.number}
                  </div>

                  {/* Icon Box */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isActive && "bg-primary/10",
                    !isActive && isCompleted && "bg-emerald-500/10",
                    !isActive && !isCompleted && "bg-muted/50",
                  )}>
                    {isCompleted && !isActive ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Icon className={cn(
                        "w-5 h-5",
                        isActive && "text-primary",
                        !isActive && !isCompleted && "text-muted-foreground/50",
                      )} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-semibold truncate",
                      isActive && "text-foreground",
                      !isActive && isCompleted && "text-emerald-400",
                      !isActive && !isCompleted && "text-muted-foreground",
                    )}>
                      {phase.label}
                    </p>
                    <p className={cn(
                      "text-[11px] truncate",
                      isActive && "text-muted-foreground",
                      !isActive && isCompleted && "text-emerald-400/60",
                      !isActive && !isCompleted && "text-muted-foreground/50",
                    )}>
                      {phase.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
