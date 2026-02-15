"use client";

import { useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "@/lib/chartjs-setup";
import type { YouTubeVideoStats } from "@/types/youtube";
import { KpiCard } from "../kpi-card";
import { ChartCard } from "../chart-card";
import { formatNumber, formatDuration, YT_COLORS } from "../utils";

interface OverviewTabProps {
  videos: YouTubeVideoStats[];
  subscriberCount: number;
}

export function OverviewTab({ videos, subscriberCount }: OverviewTabProps) {
  const stats = useMemo(() => {
    const totalViews = videos.reduce((a, v) => a + v.views, 0);
    const totalLikes = videos.reduce((a, v) => a + v.likes, 0);
    const totalComments = videos.reduce((a, v) => a + v.comments, 0);
    const avgEngagement =
      videos.length > 0
        ? videos.reduce((a, v) => a + v.engagement, 0) / videos.length
        : 0;
    const avgDuration =
      videos.length > 0
        ? videos.reduce((a, v) => a + v.duration, 0) / videos.length
        : 0;
    const viewsPerVideo = videos.length > 0 ? totalViews / videos.length : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      avgEngagement,
      avgDuration,
      viewsPerVideo,
    };
  }, [videos]);

  // Views timeline (last 50 videos chronologically)
  const timelineData = useMemo(() => {
    const sorted = [...videos]
      .sort(
        (a, b) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      )
      .slice(-50);
    return {
      labels: sorted.map((v) =>
        new Date(v.publishedAt).toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        })
      ),
      datasets: [
        {
          data: sorted.map((v) => v.views),
          backgroundColor: YT_COLORS.red,
          borderRadius: 3,
        },
      ],
    };
  }, [videos]);

  // Views distribution
  const distData = useMemo(() => {
    const ranges = [
      { label: "< 1K", min: 0, max: 1000 },
      { label: "1K-5K", min: 1000, max: 5000 },
      { label: "5K-10K", min: 5000, max: 10000 },
      { label: "10K-50K", min: 10000, max: 50000 },
      { label: "50K-100K", min: 50000, max: 100000 },
      { label: "100K+", min: 100000, max: Infinity },
    ];
    const counts = ranges.map(
      (r) => videos.filter((v) => v.views >= r.min && v.views < r.max).length
    );
    const colors = [
      YT_COLORS.blue,
      YT_COLORS.green,
      YT_COLORS.yellow,
      YT_COLORS.orange,
      YT_COLORS.red,
      YT_COLORS.purple,
    ];
    return {
      labels: ranges.map((r) => r.label),
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    };
  }, [videos]);

  // Top 10 videos
  const top10Data = useMemo(() => {
    const top = [...videos].sort((a, b) => b.views - a.views).slice(0, 10).reverse();
    return {
      labels: top.map((v) =>
        v.title.length > 35 ? v.title.substring(0, 35) + "..." : v.title
      ),
      datasets: [
        {
          data: top.map((v) => v.views),
          backgroundColor: YT_COLORS.red,
          borderRadius: 4,
          borderSkipped: false as const,
        },
      ],
    };
  }, [videos]);

  // Engagement timeline
  const engTimelineData = useMemo(() => {
    const sorted = [...videos]
      .sort(
        (a, b) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      )
      .slice(-50);
    return {
      labels: sorted.map((v) =>
        new Date(v.publishedAt).toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        })
      ),
      datasets: [
        {
          label: "Engagement %",
          data: sorted.map((v) => parseFloat(v.engagement.toFixed(2))),
          borderColor: YT_COLORS.green,
          backgroundColor: YT_COLORS.greenBg,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [videos]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Suscriptores"
          value={formatNumber(subscriberCount)}
          color="#ff2d55"
        />
        <KpiCard
          label="Videos"
          value={String(videos.length)}
          color="#0a84ff"
        />
        <KpiCard
          label="Views totales"
          value={formatNumber(stats.totalViews)}
          color="#30d158"
        />
        <KpiCard
          label="Total Likes"
          value={formatNumber(stats.totalLikes)}
          color="#ffd60a"
        />
        <KpiCard
          label="Views/Video"
          value={formatNumber(Math.round(stats.viewsPerVideo))}
          color="#bf5af2"
        />
        <KpiCard
          label="Avg Engagement"
          value={stats.avgEngagement.toFixed(2) + "%"}
          color="#ff9f0a"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Visualizaciones por Video"
          subtitle="Ultimos 50 videos cronologicamente"
          className="lg:col-span-2"
          tall
        >
          <Bar
            data={timelineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: (v) => formatNumber(v as number) } },
                x: { display: false },
              },
            }}
          />
        </ChartCard>
        <ChartCard title="Distribucion de Views" subtitle="Rango de views por video" tall>
          <Doughnut
            data={distData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "bottom" as const, labels: { boxWidth: 12 } },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top 10 Videos - Mas Vistos" subtitle="Por numero de visualizaciones" tall>
          <Bar
            data={top10Data}
            options={{
              indexAxis: "y" as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { callback: (v) => formatNumber(v as number) } },
                y: { ticks: { font: { size: 10 } } },
              },
            }}
          />
        </ChartCard>
        <ChartCard
          title="Engagement Rate por Video"
          subtitle="(Likes + Comentarios) / Views x 100"
          tall
        >
          <Line
            data={engTimelineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { display: false },
                y: { ticks: { callback: (v) => v + "%" } },
              },
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}
