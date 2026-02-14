"use client";

import { useQuery } from "@tanstack/react-query";
import type { AeRender } from "@/types/database";

export function useRenders(videoId: string | null) {
  return useQuery({
    queryKey: ["renders", videoId],
    queryFn: async (): Promise<AeRender[]> => {
      const videoRes = await fetch(`/api/data/videos?id=${videoId}`);
      if (!videoRes.ok) return [];
      const videoData = await videoRes.json();
      const renderIds: string[] = videoData?.ae_render_ids || [];
      if (renderIds.length === 0) return [];

      const res = await fetch(`/api/data/renders?ids=${renderIds.join(",")}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!videoId,
  });
}
