"use client";

import { useState } from "react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useYouTubeStats } from "@/lib/hooks/use-youtube-stats";
import { YouTubeHeader } from "./youtube-header";
import { OverviewTab } from "./tabs/overview-tab";
import { VideosTab } from "./tabs/videos-tab";
import { EngagementTab } from "./tabs/engagement-tab";
import { TemporalTab } from "./tabs/temporal-tab";
import { ContentTab } from "./tabs/content-tab";
import { InsightsTab } from "./tabs/insights-tab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos", label: "Videos" },
  { id: "engagement", label: "Engagement" },
  { id: "temporal", label: "Temporal" },
  { id: "content", label: "Contenido" },
  { id: "insights", label: "Insights" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function YouTubeStatsPage() {
  const { currentAccount } = useAccountStore();
  const channelHandle = currentAccount?.youtube_channel;
  const { data, isLoading, error } = useYouTubeStats(channelHandle);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // No channel configured
  if (!channelHandle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card rounded-xl border border-border p-8 max-w-md text-center">
          <div className="text-4xl mb-4">📺</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Canal YouTube no configurado
          </h2>
          <p className="text-sm text-muted-foreground">
            Configura el campo &quot;Canal YouTube&quot; en el Account de
            Airtable con el handle del canal (ej: @DavidAranzabalYoutube) para
            ver las estadisticas.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            Cargando estadisticas de YouTube...
          </p>
          <p className="text-xs text-muted-foreground/60">
            Esto puede tardar unos segundos
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card rounded-xl border border-red-500/20 p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Error al cargar datos
          </h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <YouTubeHeader channel={data.channel} fetchedAt={data.fetchedAt} />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              activeTab === tab.id
                ? "bg-red-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          videos={data.videos}
          subscriberCount={data.channel.subscriberCount}
        />
      )}
      {activeTab === "videos" && <VideosTab videos={data.videos} />}
      {activeTab === "engagement" && (
        <EngagementTab videos={data.videos} />
      )}
      {activeTab === "temporal" && <TemporalTab videos={data.videos} />}
      {activeTab === "content" && <ContentTab videos={data.videos} />}
      {activeTab === "insights" && <InsightsTab videos={data.videos} />}
    </div>
  );
}
