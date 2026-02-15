"use client";

import { useState } from "react";
import { useAccountStore } from "@/lib/stores/account-store";
import { useYouTubeStats } from "@/lib/hooks/use-youtube-stats";
import { useYouTubeOAuth } from "@/lib/youtube/oauth";
import { useYouTubeAnalytics } from "@/lib/hooks/use-youtube-analytics";
import { YouTubeHeader } from "./youtube-header";
import { OverviewTab } from "./tabs/overview-tab";
import { VideosTab } from "./tabs/videos-tab";
import { EngagementTab } from "./tabs/engagement-tab";
import { TemporalTab } from "./tabs/temporal-tab";
import { ContentTab } from "./tabs/content-tab";
import { InsightsTab } from "./tabs/insights-tab";
import { DemographicsTab } from "./tabs/demographics-tab";
import { GeographyTab } from "./tabs/geography-tab";
import { RevenueTab } from "./tabs/revenue-tab";
import { TrafficTab } from "./tabs/traffic-tab";
import { cn } from "@/lib/utils";

const PUBLIC_TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos", label: "Videos" },
  { id: "engagement", label: "Engagement" },
  { id: "temporal", label: "Temporal" },
  { id: "content", label: "Contenido" },
  { id: "insights", label: "Insights" },
] as const;

const OAUTH_TABS = [
  { id: "demographics", label: "Demographics" },
  { id: "geography", label: "Paises" },
  { id: "revenue", label: "Ingresos" },
  { id: "traffic", label: "Trafico" },
] as const;

type TabId =
  | (typeof PUBLIC_TABS)[number]["id"]
  | (typeof OAUTH_TABS)[number]["id"];

export function YouTubeStatsPage() {
  const { currentAccount } = useAccountStore();
  const channelHandle = currentAccount?.youtube_channel;
  const { data, isLoading, error } = useYouTubeStats(channelHandle);
  const oauth = useYouTubeOAuth();
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useYouTubeAnalytics(oauth.accessToken);
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
            Anade un Social Profile con Network = &quot;youtube&quot; y el
            handle del canal (ej: @DavidAranzabalYoutube) vinculado a este
            Account para ver las estadisticas.
          </p>
        </div>
      </div>
    );
  }

  // Loading — tech glow animation
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-6">
          {/* Outer glow rings */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
            <div className="absolute -inset-4 rounded-full border border-red-500/10 animate-[spin_8s_linear_infinite]" />
            <div className="absolute -inset-8 rounded-full border border-red-500/5 animate-[spin_12s_linear_infinite_reverse]" />
            {/* Inner spinning ring */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg
                className="absolute inset-0 w-20 h-20 animate-[spin_2s_linear_infinite]"
                viewBox="0 0 80 80"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="url(#ytGrad)"
                  strokeWidth="2"
                  strokeDasharray="180 100"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="ytGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ff2d55" />
                    <stop offset="50%" stopColor="#ff6b6b" />
                    <stop offset="100%" stopColor="#ff2d55" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
              {/* YouTube icon */}
              <svg
                className="w-8 h-8 text-red-500 drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              Conectando con{" "}
              <span className="text-red-400 font-semibold drop-shadow-[0_0_6px_rgba(255,45,85,0.4)]">
                {channelHandle}
              </span>
            </p>
            {/* Animated dots */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                Obteniendo estadisticas del canal
              </span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-red-500/60 rounded-full animate-[bounce_1.4s_infinite_0ms]" />
                <span className="w-1 h-1 bg-red-500/60 rounded-full animate-[bounce_1.4s_infinite_200ms]" />
                <span className="w-1 h-1 bg-red-500/60 rounded-full animate-[bounce_1.4s_infinite_400ms]" />
              </span>
            </div>
            {/* Scanning bar */}
            <div className="w-48 h-0.5 bg-muted rounded-full overflow-hidden mx-auto mt-3">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scan {
            0% {
              transform: translateX(-150%);
            }
            100% {
              transform: translateX(450%);
            }
          }
        `}</style>
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

  const isOAuthTab = OAUTH_TABS.some((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      <YouTubeHeader
        channel={data.channel}
        fetchedAt={data.fetchedAt}
        oauth={oauth}
      />

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border border-border w-fit">
        {/* Public tabs */}
        {PUBLIC_TABS.map((tab) => (
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

        {/* Separator */}
        <div className="w-px bg-border my-1" />

        {/* OAuth tabs */}
        {OAUTH_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              activeTab === tab.id
                ? "bg-purple-500 text-white shadow-sm"
                : oauth.isAuthenticated
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-muted-foreground/50 cursor-default"
            )}
          >
            {tab.label}
            {!oauth.isAuthenticated && (
              <span className="ml-1 text-[10px] opacity-60">🔒</span>
            )}
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

      {/* OAuth tabs */}
      {isOAuthTab && !oauth.isAuthenticated && (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="glass-card rounded-xl border border-purple-500/20 p-8 max-w-md text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Analytics privados
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Conecta tu cuenta de YouTube para ver demographics, paises,
              ingresos y trafico.
            </p>
            <button
              onClick={oauth.login}
              disabled={oauth.isLoading}
              className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {oauth.isLoading ? "Conectando..." : "Conectar YouTube Analytics"}
            </button>
            {oauth.error && (
              <p className="text-xs text-red-400 mt-2">{oauth.error}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "demographics" && oauth.isAuthenticated && (
        <DemographicsTab
          data={analyticsData?.demographics ?? null}
          isLoading={analyticsLoading}
          error={analyticsError}
        />
      )}
      {activeTab === "geography" && oauth.isAuthenticated && (
        <GeographyTab
          data={analyticsData?.geography ?? null}
          isLoading={analyticsLoading}
          error={analyticsError}
        />
      )}
      {activeTab === "revenue" && oauth.isAuthenticated && (
        <RevenueTab
          revenue={analyticsData?.revenue ?? null}
          monthly={analyticsData?.monthly ?? null}
          impressions={analyticsData?.impressions ?? null}
          isLoading={analyticsLoading}
          error={analyticsError}
        />
      )}
      {activeTab === "traffic" && oauth.isAuthenticated && (
        <TrafficTab
          traffic={analyticsData?.traffic ?? null}
          devices={analyticsData?.devices ?? null}
          impressions={analyticsData?.impressions ?? null}
          isLoading={analyticsLoading}
          error={analyticsError}
        />
      )}
    </div>
  );
}
