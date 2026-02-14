"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useVideoContextStore } from "@/lib/stores/video-context-store";
import { useVideoDetail } from "@/lib/hooks/use-video-detail";
import { useVideoRealtime } from "@/lib/hooks/use-pipeline";
import { PipelineHeader } from "@/components/shared/pipeline-header";
import { PipelineButtons } from "@/components/pipeline/pipeline-buttons";
import { CopyTabPanel } from "./studio-tabs/copy-tab-panel";
import { AudioTabPanel } from "./studio-tabs/audio-tab-panel";
import { MontajeTabPanel } from "./studio-tabs/montaje-tab-panel";
import { RenderTabPanel } from "./studio-tabs/render-tab-panel";
import { MiniaturaTabPanel } from "./studio-tabs/miniatura-tab-panel";
import { TabSkeleton } from "./studio-tabs/tab-skeleton";
import { cn } from "@/lib/utils";
import {
  FileText, Headphones, Film, Clapperboard, ImageIcon, Loader2, Video,
} from "lucide-react";

// ─── Tab Definitions ───────────────────────────────────────
const STUDIO_TABS = [
  { key: "copy", label: "Copy", icon: FileText, phaseKey: "copy" },
  { key: "audio", label: "Audio", icon: Headphones, phaseKey: "audio" },
  { key: "montaje", label: "Montaje Video", icon: Film, phaseKey: "video" },
  { key: "miniaturas", label: "Miniaturas", icon: ImageIcon, phaseKey: undefined },
  { key: "render", label: "Render", icon: Clapperboard, phaseKey: "render" },
] as const;

type StudioTab = (typeof STUDIO_TABS)[number]["key"];

// ─── Main Component ────────────────────────────────────────
export function VideoStudioWorkspace() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const videoId = params.id as string;
  const clientSlug = params["client-slug"] as string;

  // Read tab from URL, default to "copy"
  const activeTab = (searchParams.get("tab") as StudioTab) || "copy";

  // Video context store
  const { setActiveVideo, setActiveStudioTab } = useVideoContextStore();

  // Fetch video data (single source of truth for all tabs)
  const { data: videoDetail, isLoading } = useVideoDetail(videoId);

  // Real-time updates
  useVideoRealtime(videoId);

  // Sync video context store when video loads
  useEffect(() => {
    if (videoDetail) {
      setActiveVideo(videoDetail.id, videoDetail.name, videoDetail.titulo);
    }
  }, [videoDetail, setActiveVideo]);

  // Persist active tab
  useEffect(() => {
    setActiveStudioTab(activeTab);
  }, [activeTab, setActiveStudioTab]);

  // Tab switching updates URL without page reload
  const setTab = (tab: StudioTab) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", tab);
    sp.delete("subtab"); // Clear sub-tab when switching main tabs
    router.replace(`/${clientSlug}/videos/${videoId}?${sp}`, { scroll: false });
  };

  // Derive current pipeline phase for PipelineHeader highlight
  const currentPhase = STUDIO_TABS.find((t) => t.key === activeTab)?.phaseKey;

  // ─── Loading State ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="border-b border-border px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-64 bg-muted rounded animate-pulse" />
              <div className="h-3 w-40 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <TabSkeleton />
      </div>
    );
  }

  // ─── Not Found State ─────────────────────────────────────
  if (!videoDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-muted-foreground">
        <Video className="w-12 h-12 mb-4 opacity-30" />
        <h2 className="text-lg font-semibold mb-1">Video no encontrado</h2>
        <p className="text-sm">Este video no existe o no tienes acceso</p>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Pipeline Header — Video identity + phase progress */}
      <PipelineHeader currentPhase={currentPhase} video={videoDetail} />

      {/* Pipeline Action Buttons */}
      <div className="px-6 py-3 border-b border-border/50">
        <PipelineButtons video={videoDetail} recordId={videoDetail.id} />
      </div>

      {/* Tab Bar */}
      <div className="px-6 border-b border-border">
        <div className="flex gap-1">
          {STUDIO_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content — Only active tab is mounted */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === "copy" && <CopyTabPanel video={videoDetail} />}
          {activeTab === "audio" && <AudioTabPanel video={videoDetail} />}
          {activeTab === "montaje" && <MontajeTabPanel video={videoDetail} />}
          {activeTab === "render" && <RenderTabPanel video={videoDetail} />}
          {activeTab === "miniaturas" && <MiniaturaTabPanel video={videoDetail} />}
        </Suspense>
      </div>
    </div>
  );
}
