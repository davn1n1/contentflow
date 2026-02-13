"use client";

import type { Video } from "@/types/database";

interface CopyViewerProps {
  video: Video;
}

export function CopyViewer({ video }: CopyViewerProps) {
  const content = video.post_content || video.elevenlabs_text;

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">
          No copy generated yet. Click "Create Copy" to generate the script.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Titles */}
      {(video.titulo_youtube_a || video.titulo_youtube_b || video.titulo_youtube_c) && (
        <div className="glass-card rounded-lg p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Title Options
          </h4>
          <div className="space-y-2">
            {video.titulo_youtube_a && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">A</span>
                <p className="text-sm text-foreground">{video.titulo_youtube_a}</p>
              </div>
            )}
            {video.titulo_youtube_b && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-purple-400 bg-purple-400/10 rounded px-1.5 py-0.5">B</span>
                <p className="text-sm text-foreground">{video.titulo_youtube_b}</p>
              </div>
            )}
            {video.titulo_youtube_c && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 rounded px-1.5 py-0.5">C</span>
                <p className="text-sm text-foreground">{video.titulo_youtube_c}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main copy */}
      <div className="glass-card rounded-lg p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Script
        </h4>
        <div className="prose prose-sm prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">
            {content}
          </pre>
        </div>
      </div>

      {/* Feedback */}
      {video.feedback && (
        <div className="glass-card rounded-lg p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Feedback
          </h4>
          <p className="text-sm text-muted-foreground">{video.feedback}</p>
        </div>
      )}
    </div>
  );
}
