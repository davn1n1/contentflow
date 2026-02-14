"use client";

import { Play, Film } from "lucide-react";
import { TabEscenas, ActionButton } from "@/components/scripts/script-audio-detail";
import type { VideoWithScenes } from "@/lib/hooks/use-video-detail";

export function MontajeTabPanel({ video }: { video: VideoWithScenes }) {
  return (
    <div className="px-6 py-6 space-y-6">
      {/* Action: Crear Video (GenerateAvatars) */}
      <ActionButton
        videoId={video.id}
        action="GenerateAvatars"
        label="Crear Video (Avatares)"
        confirmLabel="Confirmar creación de video"
        icon={<Play className="w-5 h-5" />}
        color="amber"
      />

      {/* Scene visual list */}
      <TabEscenas video={video} />
    </div>
  );
}
