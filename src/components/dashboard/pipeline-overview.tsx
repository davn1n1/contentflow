"use client";

import { cn } from "@/lib/utils";
import { FileText, Headphones, Video, Clapperboard } from "lucide-react";

interface PipelineOverviewProps {
  stats: {
    copy: number;
    audio: number;
    video: number;
    render: number;
    published: number;
  };
}

const stages = [
  { key: "copy" as const, label: "Copy", icon: FileText, color: "bg-primary" },
  { key: "audio" as const, label: "Audio", icon: Headphones, color: "bg-purple-500" },
  { key: "video" as const, label: "Video", icon: Video, color: "bg-blue-500" },
  { key: "render" as const, label: "Render", icon: Clapperboard, color: "bg-emerald-500" },
];

export function PipelineOverview({ stats }: PipelineOverviewProps) {
  const total = Math.max(stats.copy + stats.audio + stats.video + stats.render + stats.published, 1);

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Production Pipeline
      </h3>

      {/* Pipeline flow visualization */}
      <div className="flex items-center gap-2 mb-6">
        {stages.map((stage, i) => {
          const count = stats[stage.key];
          const width = Math.max((count / total) * 100, 8);
          return (
            <div key={stage.key} className="flex items-center gap-2 flex-1">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <stage.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{stage.label}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="text-muted-foreground/30 text-xs mt-3">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Published count */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground">Published</span>
        <span className="text-sm font-bold text-success">{stats.published}</span>
      </div>
    </div>
  );
}
