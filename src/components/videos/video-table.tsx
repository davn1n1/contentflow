"use client";

import Link from "next/link";
import type { Video } from "@/types/database";
import { StatusBadge } from "./status-badge";
import { PipelineProgressBar } from "./pipeline-progress-bar";
import { ExternalLink } from "lucide-react";

interface VideoTableProps {
  videos: Video[];
  clientSlug: string;
}

export function VideoTable({ videos, clientSlug }: VideoTableProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">#</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Title</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Pipeline</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Format</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Duration</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr
                key={video.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {video.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${clientSlug}/videos/${video.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1 max-w-xs"
                  >
                    {video.titulo || video.titulo_youtube_a || "Untitled"}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={video.estado} />
                </td>
                <td className="px-4 py-3">
                  <PipelineProgressBar video={video} compact />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {video.horizontalvertical || video.format || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {video.voice_length_minutes || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(video.created_time).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {video.url_youtube && (
                      <a
                        href={video.url_youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {videos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No videos found</p>
        </div>
      )}
    </div>
  );
}
