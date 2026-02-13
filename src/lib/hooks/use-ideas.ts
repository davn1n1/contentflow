"use client";

import { useQuery } from "@tanstack/react-query";
import type { Idea } from "@/types/database";

interface UseIdeasOptions {
  accountId?: string;
  status?: string;
  tipoIdea?: string;
  search?: string;
  favorita?: boolean;
  limit?: number;
}

export function useIdeas({
  accountId,
  status,
  tipoIdea,
  search,
  favorita,
  limit = 100,
}: UseIdeasOptions) {
  return useQuery({
    queryKey: ["ideas", accountId, status, tipoIdea, search, favorita, limit],
    queryFn: async (): Promise<Idea[]> => {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (status) params.set("status", status);
      if (tipoIdea) params.set("tipoIdea", tipoIdea);
      if (search) params.set("search", search);
      if (favorita) params.set("favorita", "true");
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`/api/data/ideas?${params}`);
      if (!res.ok) throw new Error("Failed to fetch ideas");
      return res.json();
    },
    enabled: !!accountId,
  });
}

export function useIdea(ideaId: string | null) {
  return useQuery({
    queryKey: ["idea", ideaId],
    queryFn: async (): Promise<Idea> => {
      const res = await fetch(`/api/data/ideas?id=${ideaId}`);
      if (!res.ok) throw new Error("Failed to fetch idea");
      return res.json();
    },
    enabled: !!ideaId,
  });
}
