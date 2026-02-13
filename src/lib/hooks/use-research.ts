import { useQuery } from "@tanstack/react-query";
import type { Research, ResearchSelectedIdea } from "@/types/database";

interface UseResearchListOptions {
  accountId?: string;
  limit?: number;
}

export function useResearchList({ accountId, limit = 50 }: UseResearchListOptions) {
  return useQuery({
    queryKey: ["research", "list", accountId, limit],
    queryFn: async (): Promise<Research[]> => {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (limit) params.set("limit", String(limit));
      const res = await fetch(`/api/data/research?${params}`);
      if (!res.ok) throw new Error("Failed to fetch research list");
      return res.json();
    },
    enabled: !!accountId,
  });
}

export interface ResearchDetail extends Research {
  selected_ideas: ResearchSelectedIdea[];
}

export function useResearchDetail(researchId: string | null) {
  return useQuery({
    queryKey: ["research", "detail", researchId],
    queryFn: async (): Promise<ResearchDetail> => {
      const params = new URLSearchParams({
        id: researchId!,
        expandIdeas: "true",
      });
      const res = await fetch(`/api/data/research?${params}`);
      if (!res.ok) throw new Error("Failed to fetch research detail");
      return res.json();
    },
    enabled: !!researchId,
  });
}
