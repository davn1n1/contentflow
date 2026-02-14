"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateVideoParams {
  id: string;
  fields: Record<string, unknown>;
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fields }: UpdateVideoParams) => {
      const res = await fetch("/api/data/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fields }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update video");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-detail"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
