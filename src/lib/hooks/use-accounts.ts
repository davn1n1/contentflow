"use client";

import { useQuery } from "@tanstack/react-query";
import type { Account } from "@/types/database";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> => {
      const res = await fetch("/api/data/accounts");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
  });
}
