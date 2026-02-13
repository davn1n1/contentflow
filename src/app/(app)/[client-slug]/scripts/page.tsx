"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { useVideoDetail } from "@/lib/hooks/use-video-detail";
import { PipelineHeader } from "@/components/shared/pipeline-header";
import { ScriptAudioDetail } from "@/components/scripts/script-audio-detail";
import { FileText } from "lucide-react";

export default function ScriptsPage() {
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get("videoId");
  const { activeVideoId, setActiveVideo } = useVideoContextStore();

  // URL param takes priority, then context store
  const videoId = urlVideoId || activeVideoId;

  const { data: videoDetail, isLoading } = useVideoDetail(videoId);

  // Sync URL param to context store
  useEffect(() => {
    if (urlVideoId && urlVideoId !== activeVideoId) {
      setActiveVideo(urlVideoId);
    }
  }, [urlVideoId, activeVideoId, setActiveVideo]);

  // Update context store with video data once loaded
  useEffect(() => {
    if (videoDetail && videoId) {
      setActiveVideo(
        videoDetail.id,
        videoDetail.name,
        videoDetail.titulo
      );
    }
  }, [videoDetail, videoId, setActiveVideo]);

  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-30" />
        <h2 className="text-lg font-semibold mb-1">Sin video seleccionado</h2>
        <p className="text-sm">Crea un video desde Research o selecciona uno desde Videos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PipelineHeader currentPhase="copy" />
      <div className="flex-1 overflow-hidden">
        <ScriptAudioDetail video={videoDetail} isLoading={isLoading} />
      </div>
    </div>
  );
}
