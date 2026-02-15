"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BulkDeleteParams {
  table: string;
  recordIds: string[];
}

interface BulkDuplicateParams {
  table: string;
  records: Record<string, unknown>[];
}

export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ table, recordIds }: BulkDeleteParams) => {
      const res = await fetch("/api/data/app-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, recordIds }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to delete records");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["app-data", variables.table] });
    },
  });
}

export function useBulkDuplicate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ table, records }: BulkDuplicateParams) => {
      const res = await fetch("/api/data/app-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, records }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to duplicate records");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["app-data", variables.table] });
    },
  });
}
