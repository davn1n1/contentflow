"use client";

import { cn } from "@/lib/utils";
import type { Video } from "@/types/database";
import { FileText, Headphones, Video as VideoIcon, Clapperboard } from "lucide-react";

interface PipelineProgressBarProps {
  video: Video;
  compact?: boolean;
}

const steps = [
  { key: "copy", icon: FileText, label: "Copy" },
  { key: "audio", icon: Headphones, label: "Audio" },
  { key: "video", icon: VideoIcon, label: "Video" },
  { key: "render", icon: Clapperboard, label: "Render" },
] as const;

function getStepStatus(video: Video, step: string): "completed" | "running" | "pending" {
  switch (step) {
    case "copy":
      return video.status_copy ? "completed" : "pending";
    case "audio":
      return video.status_audio ? "completed" : video.status_copy ? "running" : "pending";
    case "video":
      return video.status_avatares ? "completed" : video.status_audio ? "running" : "pending";
    case "render":
      return video.status_rendering_video ? "completed" : video.status_avatares ? "running" : "pending";
    default:
      return "pending";
  }
}

export function PipelineProgressBar({ video, compact }: PipelineProgressBarProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const status = getStepStatus(video, step.key);
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center justify-center rounded-md transition-all",
                compact ? "w-6 h-6" : "w-7 h-7",
                status === "completed" && "bg-success/20 text-success",
                status === "running" && "bg-primary/20 text-primary pulse-glow",
                status === "pending" && "bg-muted text-muted-foreground"
              )}
              title={`${step.label}: ${status}`}
            >
              <step.icon className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px transition-all",
                  compact ? "w-2" : "w-4",
                  status === "completed" ? "bg-success/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
