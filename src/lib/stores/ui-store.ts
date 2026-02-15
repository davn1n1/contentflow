import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewMode = "table" | "grid" | "calendar";

interface UIState {
  sidebarCollapsed: boolean;
  collapsedSections: Record<string, boolean>;
  allVideosViewMode: ViewMode;
  listadoReelsViewMode: ViewMode;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSection: (key: string, allCollapsibleKeys?: string[]) => void;
  setAllVideosViewMode: (mode: ViewMode) => void;
  setListadoReelsViewMode: (mode: ViewMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      collapsedSections: {},
      allVideosViewMode: "grid",
      listadoReelsViewMode: "grid",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSection: (key, allCollapsibleKeys) =>
        set((s) => {
          const wasCollapsed = s.collapsedSections[key] ?? false;
          if (wasCollapsed && allCollapsibleKeys) {
            // Accordion: expanding this section → collapse all others
            const newSections: Record<string, boolean> = {};
            allCollapsibleKeys.forEach((k) => {
              newSections[k] = k !== key;
            });
            return { collapsedSections: newSections };
          }
          return {
            collapsedSections: {
              ...s.collapsedSections,
              [key]: !wasCollapsed,
            },
          };
        }),
      setAllVideosViewMode: (mode) => set({ allVideosViewMode: mode }),
      setListadoReelsViewMode: (mode) => set({ listadoReelsViewMode: mode }),
    }),
    {
      name: "cf365-ui",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        const base = {
          sidebarCollapsed: (state?.sidebarCollapsed as boolean) ?? false,
          collapsedSections: (state?.collapsedSections as Record<string, boolean>) ?? {},
          allVideosViewMode: (state?.allVideosViewMode as ViewMode) ?? "grid",
          listadoReelsViewMode: (state?.listadoReelsViewMode as ViewMode) ?? "grid",
        };
        return base;
      },
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        collapsedSections: state.collapsedSections,
        allVideosViewMode: state.allVideosViewMode,
        listadoReelsViewMode: state.listadoReelsViewMode,
      }),
    }
  )
);
