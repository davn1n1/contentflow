"use client";

import { useQuery } from "@tanstack/react-query";

export interface AppDataRecord {
  id: string;
  createdTime: string;
  [key: string]: unknown;
}

interface UseAppDataOptions {
  table: string;
  accountId?: string;
  limit?: number;
  enabled?: boolean;
}

export function useAppData({ table, accountId, limit = 200, enabled }: UseAppDataOptions) {
  return useQuery({
    queryKey: ["app-data", table, accountId, limit],
    queryFn: async (): Promise<AppDataRecord[]> => {
      const params = new URLSearchParams();
      params.set("table", table);
      if (accountId) params.set("accountId", accountId);
      if (limit) params.set("limit", String(limit));

      const res = await fetch(`/api/data/app-data?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch ${table}`);
      return res.json();
    },
    enabled: enabled !== undefined ? enabled : !!accountId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
