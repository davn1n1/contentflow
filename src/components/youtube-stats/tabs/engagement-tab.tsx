"use client";

import { useMemo } from "react";
import { Bar, Scatter } from "react-chartjs-2";
import "@/lib/chartjs-setup";
import type { YouTubeVideoStats } from "@/types/youtube";
import { KpiCard } from "../kpi-card";
import { ChartCard } from "../chart-card";
import { formatNumber, YT_COLORS } from "../utils";

interface EngagementTabProps {
  videos: YouTubeVideoStats[];
}

export function EngagementTab({ videos }: EngagementTabProps) {
  // ── KPI metrics ──────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalViews = videos.reduce((a, v) => a + v.views, 0);
    const totalLikes = videos.reduce((a, v) => a + v.likes, 0);
    const totalComments = videos.reduce((a, v) => a + v.comments, 0);

    const likeRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
    const commentRate = totalViews > 0 ? (totalComments / totalViews) * 100 : 0;
    const likesPerVideo = videos.length > 0 ? totalLikes / videos.length : 0;
    const commentsPerVideo =
      videos.length > 0 ? totalComments / videos.length : 0;

    return { likeRate, commentRate, likesPerVideo, commentsPerVideo };
  }, [videos]);

  // ── Scatter: Likes vs Views ──────────────────────────────
  const likesVsViewsData = useMemo(
    () => ({
      datasets: [
        {
          label: "Likes vs Views",
          data: videos.map((v) => ({ x: v.views, y: v.likes })),
          backgroundColor: YT_COLORS.blue,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    }),
    [videos]
  );

  // ── Scatter: Comments vs Views ───────────────────────────
  const commentsVsViewsData = useMemo(
    () => ({
      datasets: [
        {
          label: "Comments vs Views",
          data: videos.map((v) => ({ x: v.views, y: v.comments })),
          backgroundColor: YT_COLORS.orange,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    }),
    [videos]
  );

  // ── Grouped Bar: Engagement by Year ──────────────────────
  const engagementByYearData = useMemo(() => {
    const byYear = new Map<
      number,
      { views: number; likes: number; comments: number }
    >();

    for (const v of videos) {
      const year = new Date(v.publishedAt).getFullYear();
      const entry = byYear.get(year) ?? { views: 0, likes: 0, comments: 0 };
      entry.views += v.views;
      entry.likes += v.likes;
      entry.comments += v.comments;
      byYear.set(year, entry);
    }

    const years = [...byYear.keys()].sort((a, b) => a - b);

    return {
      labels: years.map(String),
      datasets: [
        {
          label: "Like Rate %",
          data: years.map((y) => {
            const e = byYear.get(y)!;
            return e.views > 0
              ? parseFloat(((e.likes / e.views) * 100).toFixed(2))
              : 0;
          }),
          backgroundColor: YT_COLORS.blue,
          borderRadius: 4,
        },
        {
          label: "Comment Rate %",
          data: years.map((y) => {
            const e = byYear.get(y)!;
            return e.views > 0
              ? parseFloat(((e.comments / e.views) * 100).toFixed(3))
              : 0;
          }),
          backgroundColor: YT_COLORS.orange,
          borderRadius: 4,
        },
      ],
    };
  }, [videos]);

  // ── Horizontal Bar: Top 10 Engagement (views > 100) ─────
  const top10EngagementData = useMemo(() => {
    const filtered = videos
      .filter((v) => v.views > 100)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10)
      .reverse();

    return {
      labels: filtered.map((v) =>
        v.title.length > 35 ? v.title.substring(0, 35) + "..." : v.title
      ),
      datasets: [
        {
          label: "Engagement %",
          data: filtered.map((v) => parseFloat(v.engagement.toFixed(2))),
          backgroundColor: YT_COLORS.purple,
          borderRadius: 4,
          borderSkipped: false as const,
        },
      ],
    };
  }, [videos]);

  // ── Shared scatter options builder ───────────────────────
  const scatterOptions = (xLabel: string, yLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        title: { display: true, text: xLabel },
        ticks: { callback: (v: string | number) => formatNumber(v as number) },
      },
      y: {
        title: { display: true, text: yLabel },
        ticks: { callback: (v: string | number) => formatNumber(v as number) },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Like Rate"
          value={kpis.likeRate.toFixed(2) + "%"}
          color="#0a84ff"
        />
        <KpiCard
          label="Comment Rate"
          value={kpis.commentRate.toFixed(3) + "%"}
          color="#ff9f0a"
        />
        <KpiCard
          label="Likes / Video"
          value={formatNumber(Math.round(kpis.likesPerVideo))}
          color="#30d158"
        />
        <KpiCard
          label="Comments / Video"
          value={formatNumber(Math.round(kpis.commentsPerVideo))}
          color="#bf5af2"
        />
      </div>

      {/* Scatter plots row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Likes vs Views"
          subtitle="Correlacion entre likes y visualizaciones"
          tall
        >
          <Scatter
            data={likesVsViewsData}
            options={scatterOptions("Views", "Likes")}
          />
        </ChartCard>
        <ChartCard
          title="Comments vs Views"
          subtitle="Correlacion entre comentarios y visualizaciones"
          tall
        >
          <Scatter
            data={commentsVsViewsData}
            options={scatterOptions("Views", "Comments")}
          />
        </ChartCard>
      </div>

      {/* Engagement by year + Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Engagement por Ano"
          subtitle="Like Rate y Comment Rate agrupados por ano"
          tall
        >
          <Bar
            data={engagementByYearData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom" as const,
                  labels: { boxWidth: 12 },
                },
              },
              scales: {
                x: { title: { display: true, text: "Ano" } },
                y: {
                  title: { display: true, text: "Rate %" },
                  ticks: {
                    callback: (v) => v + "%",
                  },
                },
              },
            }}
          />
        </ChartCard>
        <ChartCard
          title="Top 10 Engagement"
          subtitle="Videos con mayor engagement (views > 100)"
          tall
        >
          <Bar
            data={top10EngagementData}
            options={{
              indexAxis: "y" as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  title: { display: true, text: "Engagement %" },
                  ticks: { callback: (v) => v + "%" },
                },
                y: { ticks: { font: { size: 10 } } },
              },
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}
