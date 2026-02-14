"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useTriggerThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId }: { recordId: string }) => {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ModificaMiniatura", recordId }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to regenerate thumbnail");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
