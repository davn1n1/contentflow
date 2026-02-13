"use client";

import type { Video } from "@/types/database";
import { StatusBadge } from "./status-badge";
import { Clock, Monitor, Music, User } from "lucide-react";

interface VideoMetadataProps {
  video: Video;
}

export function VideoMetadata({ video }: VideoMetadataProps) {
  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Details</h3>

      <div className="space-y-3">
        <MetaRow label="Status">
          <StatusBadge status={video.estado} />
        </MetaRow>

        <MetaRow label="Format" icon={Monitor}>
          {video.horizontalvertical || video.format || "-"}
        </MetaRow>

        <MetaRow label="Duration" icon={Clock}>
          {video.voice_length_minutes || (video.voice_length ? `${Math.round(video.voice_length)}s` : "-")}
        </MetaRow>

        <MetaRow label="Platform">
          {video.platform || "YouTube"}
        </MetaRow>

        {video.descripción && (
          <div>
            <span className="text-xs text-muted-foreground">Description</span>
            <p className="text-sm text-foreground/80 mt-1 line-clamp-3">
              {video.descripción}
            </p>
          </div>
        )}

        {/* Production status flags */}
        <div className="pt-3 border-t border-border space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Production Status
          </h4>
          <StatusFlag label="Copy" done={video.status_copy} />
          <StatusFlag label="Scenes" done={video.status_escenas} />
          <StatusFlag label="Audio" done={video.status_audio} />
          <StatusFlag label="Avatars" done={video.status_avatares} />
          <StatusFlag label="Timeline" done={video.status_timeline_hooks} />
          <StatusFlag label="Renders" done={video.status_renders} />
          <StatusFlag label="Video" done={!!video.status_rendering_video} />
          <StatusFlag label="Published" done={!!video.url_youtube} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

function StatusFlag({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`w-2 h-2 rounded-full ${
          done ? "bg-success" : "bg-muted-foreground/30"
        }`}
      />
    </div>
  );
}
