"use client";

import { useQuery } from "@tanstack/react-query";
import type { Video } from "@/types/database";

interface UseVideosOptions {
  accountId?: string;
  estado?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useVideos({ accountId, estado, search, limit = 100 }: UseVideosOptions) {
  return useQuery({
    queryKey: ["videos", accountId, estado, search, limit],
    queryFn: async (): Promise<Video[]> => {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (estado) params.set("estado", estado);
      if (search) params.set("search", search);
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`/api/data/videos?${params}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
    enabled: !!accountId,
  });
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: ["video", id],
    queryFn: async (): Promise<Video> => {
      const res = await fetch(`/api/data/videos?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch video");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useVideoCount(accountId?: string) {
  return useQuery({
    queryKey: ["video-count", accountId],
    queryFn: async (): Promise<number> => {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      params.set("limit", "1000");

      const res = await fetch(`/api/data/videos?${params}`);
      if (!res.ok) return 0;
      const videos = await res.json();
      return videos.length;
    },
  });
}
