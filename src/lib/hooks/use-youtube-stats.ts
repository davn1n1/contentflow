"use client";

import { useQuery } from "@tanstack/react-query";
import type { YouTubeStatsResponse } from "@/types/youtube";

export function useYouTubeStats(channelHandle: string | null | undefined) {
  return useQuery({
    queryKey: ["youtube-stats", channelHandle],
    queryFn: async (): Promise<YouTubeStatsResponse> => {
      const res = await fetch(
        `/api/data/youtube-stats?channelHandle=${encodeURIComponent(channelHandle!)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch YouTube stats");
      }
      return res.json();
    },
    enabled: !!channelHandle,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
