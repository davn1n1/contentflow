"use client";

import { useQuery } from "@tanstack/react-query";
import type { DraftPublicacion } from "@/types/database";

export function useDraftPublicacion(videoId: string | null) {
  return useQuery({
    queryKey: ["draft-publicacion", videoId],
    queryFn: async (): Promise<DraftPublicacion[]> => {
      const res = await fetch(`/api/data/draft-publicacion?videoId=${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch draft publicacion");
      return res.json();
    },
    enabled: !!videoId,
  });
}
