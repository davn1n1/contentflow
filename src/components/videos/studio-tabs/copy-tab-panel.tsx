"use client";

import { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Lightbulb } from "lucide-react";
import { TabScript, IdeasSection } from "@/components/scripts/script-audio-detail";
import type { VideoWithScenes } from "@/lib/hooks/use-video-detail";

const SUB_TABS = [
  { key: "script", label: "Script & Copy", icon: FileText },
  { key: "ideas", label: "Ideas & Research", icon: Lightbulb },
] as const;

type SubTabKey = (typeof SUB_TABS)[number]["key"];

export function CopyTabPanel({ video }: { video: VideoWithScenes }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const clientSlug = params["client-slug"] as string;
  const subtab = (searchParams.get("subtab") as SubTabKey) || "script";

  const setSubtab = (key: SubTabKey) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", "copy");
    if (key === "script") {
      sp.delete("subtab");
    } else {
      sp.set("subtab", key);
    }
    router.replace(`/${clientSlug}/videos/${video.id}?${sp}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="px-6 border-b border-border/50">
        <div className="flex gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subtab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSubtab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary/60 text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.key === "ideas" && video.linkedIdeas && video.linkedIdeas.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-medium">
                    {video.linkedIdeas.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {subtab === "script" && <TabScript video={video} />}
        {subtab === "ideas" && (
          video.linkedIdeas && video.linkedIdeas.length > 0 ? (
            <IdeasSection ideas={video.linkedIdeas} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Lightbulb className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No hay ideas vinculadas a este video</p>
              <p className="text-xs mt-1">Las ideas se generan desde Research</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
