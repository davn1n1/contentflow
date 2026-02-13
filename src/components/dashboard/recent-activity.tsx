"use client";

import type { Video } from "@/types/database";
import { cn } from "@/lib/utils";
import { FileText, Headphones, Video as VideoIcon, Clapperboard, Clock } from "lucide-react";

interface RecentActivityProps {
  videos: Video[];
}

function getStatusIcon(video: Video) {
  if (video.status_rendering_video) return Clapperboard;
  if (video.status_avatares) return VideoIcon;
  if (video.status_audio) return Headphones;
  return FileText;
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity({ videos }: RecentActivityProps) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {videos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          videos.slice(0, 8).map((video) => {
            const Icon = getStatusIcon(video);
            return (
              <div
                key={video.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    #{video.name} {video.titulo || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {video.estado || "Draft"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(video.last_modified_time)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
