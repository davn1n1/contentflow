import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  collapsedSections: Record<string, boolean>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSection: (key: string, allCollapsibleKeys?: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      collapsedSections: {},
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
    }),
    {
      name: "cf365-ui",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        return {
          sidebarCollapsed: (state?.sidebarCollapsed as boolean) ?? false,
          collapsedSections: (state?.collapsedSections as Record<string, boolean>) ?? {},
        };
      },
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        collapsedSections: state.collapsedSections,
      }),
    }
  )
);
