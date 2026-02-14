"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateDraftParams {
  id: string;
  [key: string]: unknown;
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateDraftParams) => {
      const res = await fetch("/api/data/draft-publicacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update draft");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["draft-publicacion"] });
    },
  });
}
