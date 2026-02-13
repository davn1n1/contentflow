"use client";

import { useQuery } from "@tanstack/react-query";
import type { HelpArticle } from "@/types/chat";

export function useHelpArticles(options?: { category?: string; query?: string }) {
  return useQuery<HelpArticle[]>({
    queryKey: ["help-articles", options?.category, options?.query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.category) params.set("category", options.category);
      if (options?.query) params.set("q", options.query);
      const res = await fetch(`/api/help/articles?${params}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // Articles change rarely — 10min cache
  });
}

export function useHelpArticle(slug: string) {
  return useQuery<HelpArticle>({
    queryKey: ["help-article", slug],
    queryFn: async () => {
      const res = await fetch(`/api/help/articles/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}
