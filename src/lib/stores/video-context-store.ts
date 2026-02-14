import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VideoContext {
  activeVideoId: string | null;
  activeVideoName: number | null;
  activeVideoTitle: string | null;
  activeStudioTab: string | null;

  setActiveVideo: (id: string, name?: number | null, title?: string | null) => void;
  setActiveStudioTab: (tab: string) => void;
  clearActiveVideo: () => void;
}

export const useVideoContextStore = create<VideoContext>()(
  persist(
    (set) => ({
      activeVideoId: null,
      activeVideoName: null,
      activeVideoTitle: null,
      activeStudioTab: null,

      setActiveVideo: (id, name = null, title = null) =>
        set({ activeVideoId: id, activeVideoName: name, activeVideoTitle: title }),

      setActiveStudioTab: (tab) =>
        set({ activeStudioTab: tab }),

      clearActiveVideo: () =>
        set({ activeVideoId: null, activeVideoName: null, activeVideoTitle: null, activeStudioTab: null }),
    }),
    {
      name: "cf365-video-context",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        return {
          activeVideoId: (state?.activeVideoId as string) ?? null,
          activeVideoName: (state?.activeVideoName as number) ?? null,
          activeVideoTitle: (state?.activeVideoTitle as string) ?? null,
          activeStudioTab: (state?.activeStudioTab as string) ?? null,
        };
      },
    }
  )
);
