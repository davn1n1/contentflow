import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PageTipsState {
  dismissedPages: string[];
  dismissPage: (pageKey: string) => void;
  hasSeenPage: (pageKey: string) => boolean;
  reset: () => void;
}

export const usePageTipsStore = create<PageTipsState>()(
  persist(
    (set, get) => ({
      dismissedPages: [],
      dismissPage: (pageKey) =>
        set((s) => ({
          dismissedPages: s.dismissedPages.includes(pageKey)
            ? s.dismissedPages
            : [...s.dismissedPages, pageKey],
        })),
      hasSeenPage: (pageKey) => get().dismissedPages.includes(pageKey),
      reset: () => set({ dismissedPages: [] }),
    }),
    {
      name: "cf365-page-tips",
      version: 1,
    }
  )
);
