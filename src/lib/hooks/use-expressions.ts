"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccountStore } from "@/lib/stores/account-store";

export interface Expression {
  id: string;
  name: string;
  image: string | null;
}

export function useExpressions() {
  const accountId = useAccountStore((s) => s.currentAccount?.id);

  return useQuery({
    queryKey: ["app-data", "expresiones", accountId],
    queryFn: async (): Promise<Expression[]> => {
      const params = new URLSearchParams({ table: "expresiones" });
      if (accountId) params.set("accountId", accountId);

      const res = await fetch(`/api/data/app-data?${params}`);
      if (!res.ok) throw new Error("Failed to fetch expressions");
      const data = await res.json();

      return data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r["Expresión"] as string) || (r.Name as string) || r.id,
        image:
          (r.Muestra as { thumbnails?: { large?: { url: string } }; url: string }[])?.[0]
            ?.thumbnails?.large?.url ||
          (r.Muestra as { url: string }[])?.[0]?.url ||
          null,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
