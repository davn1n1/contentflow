"use client";

import { useAccountStore } from "@/lib/stores/account-store";
import { useVideos } from "@/lib/hooks/use-videos";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ClientSummaryCard } from "@/components/dashboard/client-summary-card";
import { Video, CheckCircle2, Clock, Zap, PlayCircle } from "lucide-react";
import type { Video as VideoType } from "@/types/database";

export default function DashboardPage() {
  const { accounts, currentAccount } = useAccountStore();

  // Fetch videos for stats (all accounts for agency view)
  const { data: videos = [] } = useVideos({
    accountId: currentAccount?.id,
    limit: 100,
  });

  // Calculate stats
  const totalVideos = videos.length;
  const publishedVideos = videos.filter((v: VideoType) => v.estado === "Published" || v.url_youtube).length;
  const inProgressVideos = videos.filter(
    (v: VideoType) => v.status_copy || v.status_audio || v.status_avatares
  ).length;
  const thisMonth = videos.filter((v: VideoType) => {
    const created = new Date(v.created_time);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  // Pipeline stats
  const pipelineStats = {
    copy: videos.filter((v: VideoType) => v.status_copy && !v.status_audio).length,
    audio: videos.filter((v: VideoType) => v.status_audio && !v.status_avatares).length,
    video: videos.filter((v: VideoType) => v.status_avatares && !v.status_rendering_video).length,
    render: videos.filter((v: VideoType) => v.status_rendering_video && !v.url_youtube).length,
    published: publishedVideos,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your video production pipeline
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Videos"
          value={totalVideos}
          icon={Video}
          gradient="stat-gradient-1"
          trend={{ value: 12, label: "vs last month" }}
        />
        <StatCard
          title="Published"
          value={publishedVideos}
          icon={CheckCircle2}
          gradient="stat-gradient-2"
          subtitle={`${totalVideos > 0 ? Math.round((publishedVideos / totalVideos) * 100) : 0}% completion rate`}
        />
        <StatCard
          title="In Progress"
          value={inProgressVideos}
          icon={PlayCircle}
          gradient="stat-gradient-4"
        />
        <StatCard
          title="This Month"
          value={thisMonth}
          icon={Zap}
          gradient="stat-gradient-3"
          trend={{ value: 8, label: "vs last month" }}
        />
      </div>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PipelineOverview stats={pipelineStats} />

          {/* Client accounts */}
          {accounts.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Accounts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <ClientSummaryCard
                    key={account.id}
                    account={account}
                    videoCount={
                      videos.filter((v: VideoType) => v.account_id === account.id).length
                    }
                    activeCount={
                      videos.filter(
                        (v: VideoType) =>
                          v.account_id === account.id &&
                          (v.status_copy || v.status_audio || v.status_avatares)
                      ).length
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <RecentActivity videos={videos} />
        </div>
      </div>
    </div>
  );
}
