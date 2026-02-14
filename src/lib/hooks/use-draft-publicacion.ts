"use client";

import { useQuery } from "@tanstack/react-query";
import type { DraftPublicacion } from "@/types/database";

export function useDraftPublicacion(draftIds: string[] | undefined) {
  const ids = draftIds ?? [];
  return useQuery({
    queryKey: ["draft-publicacion", ids],
    queryFn: async (): Promise<DraftPublicacion[]> => {
      if (ids.length === 0) return [];
      const res = await fetch(`/api/data/draft-publicacion?ids=${ids.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch draft publicacion");
      return res.json();
    },
    enabled: ids.length > 0,
  });
}
