"use client";

import { useQuery } from "@tanstack/react-query";
import type { Scene } from "@/types/database";

export function useScenes(videoId: string) {
  return useQuery({
    queryKey: ["scenes", videoId],
    queryFn: async (): Promise<Scene[]> => {
      // First fetch the video to get scene IDs
      const videoRes = await fetch(`/api/data/videos?id=${videoId}`);
      if (!videoRes.ok) throw new Error("Failed to fetch video");
      const video = await videoRes.json();

      const sceneIds: string[] = video?.escenas_ids || [];
      if (sceneIds.length === 0) return [];

      const res = await fetch(`/api/data/scenes?ids=${sceneIds.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch scenes");
      return res.json();
    },
    enabled: !!videoId,
  });
}
