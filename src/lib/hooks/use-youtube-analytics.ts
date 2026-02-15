"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAllAnalytics,
  type YouTubeAnalyticsData,
} from "@/lib/youtube/analytics-api";

export function useYouTubeAnalytics(
  accessToken: string | null,
  channelCreatedDate?: string
) {
  return useQuery<YouTubeAnalyticsData>({
    queryKey: ["youtube-analytics", accessToken, channelCreatedDate],
    queryFn: () => fetchAllAnalytics(accessToken!, channelCreatedDate),
    enabled: !!accessToken,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
}
