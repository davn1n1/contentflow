"use client";

import { TabAudio } from "@/components/scripts/script-audio-detail";
import type { VideoWithScenes } from "@/lib/hooks/use-video-detail";

export function AudioTabPanel({ video }: { video: VideoWithScenes }) {
  return (
    <div
      className="h-full overflow-y-auto px-6 py-6"
      onKeyDown={(e) => { if (e.key === " " && (e.target as HTMLElement).tagName !== "TEXTAREA" && (e.target as HTMLElement).tagName !== "INPUT") e.preventDefault(); }}
    >
      <TabAudio video={video} />
    </div>
  );
}
