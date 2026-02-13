import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VideoContext {
  activeVideoId: string | null;
  activeVideoName: number | null;
  activeVideoTitle: string | null;

  setActiveVideo: (id: string, name?: number | null, title?: string | null) => void;
  clearActiveVideo: () => void;
}

export const useVideoContextStore = create<VideoContext>()(
  persist(
    (set) => ({
      activeVideoId: null,
      activeVideoName: null,
      activeVideoTitle: null,

      setActiveVideo: (id, name = null, title = null) =>
        set({ activeVideoId: id, activeVideoName: name, activeVideoTitle: title }),

      clearActiveVideo: () =>
        set({ activeVideoId: null, activeVideoName: null, activeVideoTitle: null }),
    }),
    {
      name: "cf365-video-context",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        return {
          activeVideoId: (state?.activeVideoId as string) ?? null,
          activeVideoName: (state?.activeVideoName as number) ?? null,
          activeVideoTitle: (state?.activeVideoTitle as string) ?? null,
        };
      },
    }
  )
);
