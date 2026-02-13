"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OnboardingStatus {
  needsOnboarding: boolean;
  completedSteps: {
    brand: boolean;
    persona: boolean;
    voicedna: boolean;
    audiencia: boolean;
    config: boolean;
  };
  accountId: string;
  accountName: string;
}

export interface VoiceAnalysis {
  source_type: "youtube" | "blog" | "unknown";
  transcript: string;
  analysis: {
    voicename: string;
    tone: string;
    style: string;
    vocabularylevel: string;
    narrativeperspective: string;
    generaltype: string;
    custom_ai_instructions: string;
  };
  sourceRecordId?: string;
}

export function useOnboardingStatus(accountId?: string) {
  return useQuery<OnboardingStatus>({
    queryKey: ["onboarding-status", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/status?accountId=${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch onboarding status");
      return res.json();
    },
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useSaveOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      step: string;
      accountId: string;
      data: Record<string, unknown>;
      recordId?: string;
    }) => {
      const res = await fetch("/api/onboarding/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save step");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-status", variables.accountId],
      });
    },
  });
}

export function useAnalyzeVoice() {
  return useMutation<VoiceAnalysis, Error, { url: string; accountId: string }>({
    mutationFn: async (params) => {
      const res = await fetch("/api/onboarding/analyze-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze voice");
      }
      return res.json();
    },
  });
}
