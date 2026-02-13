"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PipelineStep } from "@/types/database";

const ACTION_MAP: Record<PipelineStep, string> = {
  copy: "GenerateCopy",
  audio: "GenerateAudio",
  video: "GenerateAvatars",
  render: "ProcesoFinalRender",
};

export function useTriggerPipeline() {
  return useMutation({
    mutationFn: async ({ step, recordId }: { step: PipelineStep; recordId: string }) => {
      const action = ACTION_MAP[step];
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, recordId }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to trigger pipeline");
      }

      return res.json();
    },
  });
}

export function useVideoRealtime(videoId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!videoId) return;

    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "contentflow",
          table: "youtube_365_full_posts",
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          queryClient.setQueryData(["video", videoId], (old: unknown) => ({
            ...(old as Record<string, unknown>),
            ...payload.new,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, supabase, queryClient]);
}
