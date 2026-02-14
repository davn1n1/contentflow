import { create } from "zustand";
import { persist } from "zustand/middleware";

const NPS_INTERVAL_DAYS = 30;
const NPS_MIN_SESSIONS = 3;

interface NpsState {
  lastSurveyAt: string | null;
  lastDismissedAt: string | null;
  sessionCount: number;
  incrementSession: () => void;
  setLastSurveyAt: (date: string) => void;
  setLastDismissedAt: (date: string) => void;
  shouldShowSurvey: () => boolean;
}

export const useNpsStore = create<NpsState>()(
  persist(
    (set, get) => ({
      lastSurveyAt: null,
      lastDismissedAt: null,
      sessionCount: 0,
      incrementSession: () => {
        // Only count once per browser session (tab)
        if (typeof window !== "undefined") {
          const key = "cf365-nps-session-counted";
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, "1");
        }
        set((s) => ({ sessionCount: s.sessionCount + 1 }));
      },
      setLastSurveyAt: (date) => set({ lastSurveyAt: date }),
      setLastDismissedAt: (date) => set({ lastDismissedAt: date }),
      shouldShowSurvey: () => {
        const { lastSurveyAt, lastDismissedAt, sessionCount } = get();

        // Need minimum sessions
        if (sessionCount < NPS_MIN_SESSIONS) return false;

        // Check time since last interaction
        const lastAction = lastSurveyAt || lastDismissedAt;
        if (!lastAction) return true; // Never surveyed

        const daysSince = Math.floor(
          (Date.now() - new Date(lastAction).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince >= NPS_INTERVAL_DAYS;
      },
    }),
    {
      name: "cf365-nps",
      version: 1,
      partialize: (state) => ({
        lastSurveyAt: state.lastSurveyAt,
        lastDismissedAt: state.lastDismissedAt,
        sessionCount: state.sessionCount,
      }),
    }
  )
);
