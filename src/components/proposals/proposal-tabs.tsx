"use client";

import { cn } from "@/lib/utils";
import { FileText, PlayCircle, Sparkles, HelpCircle } from "lucide-react";

export const TABS = [
  { key: "brief", label: "Brief de la Reunión", icon: FileText },
  { key: "como-funciona", label: "Cómo funciona", icon: PlayCircle },
  { key: "propuesta", label: "Propuesta Personalizada", icon: Sparkles },
  { key: "faqs", label: "FAQs", icon: HelpCircle },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

interface ProposalTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function ProposalTabs({ activeTab, onTabChange }: ProposalTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/10 mb-6">
      <div className="flex gap-1 overflow-x-auto scrollbar-thin py-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-[#2996d7] text-[#2996d7]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.key === "brief"
                  ? "Brief"
                  : tab.key === "como-funciona"
                    ? "Info"
                    : tab.key === "propuesta"
                      ? "Propuesta"
                      : "FAQs"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
