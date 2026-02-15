"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAllAnalytics,
  type YouTubeAnalyticsData,
} from "@/lib/youtube/analytics-api";

export function useYouTubeAnalytics(
  accessToken: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery<YouTubeAnalyticsData>({
    queryKey: ["youtube-analytics", accessToken, startDate, endDate],
    queryFn: () => fetchAllAnalytics(accessToken!, startDate, endDate),
    enabled: !!accessToken,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
}
