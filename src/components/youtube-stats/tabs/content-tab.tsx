"use client";

import { useMemo } from "react";
import { Bar, Scatter } from "react-chartjs-2";
import "@/lib/chartjs-setup";
import type { YouTubeVideoStats } from "@/types/youtube";
import { ChartCard } from "../chart-card";
import { formatNumber, YT_COLORS } from "../utils";

interface ContentTabProps {
  videos: YouTubeVideoStats[];
}

export function ContentTab({ videos }: ContentTabProps) {
  // Duration distribution
  const durationDistData = useMemo(() => {
    const ranges = [
      { label: "< 5 min", min: 0, max: 300 },
      { label: "5-10 min", min: 300, max: 600 },
      { label: "10-20 min", min: 600, max: 1200 },
      { label: "20-30 min", min: 1200, max: 1800 },
      { label: "30-60 min", min: 1800, max: 3600 },
      { label: "60+ min", min: 3600, max: Infinity },
    ];
    const counts = ranges.map(
      (r) =>
        videos.filter((v) => v.duration >= r.min && v.duration < r.max).length
    );
    return {
      labels: ranges.map((r) => r.label),
      datasets: [
        {
          data: counts,
          backgroundColor: [
            YT_COLORS.blue,
            YT_COLORS.green,
            YT_COLORS.yellow,
            YT_COLORS.orange,
            YT_COLORS.red,
            YT_COLORS.purple,
          ],
          borderRadius: 6,
        },
      ],
    };
  }, [videos]);

  // Duration vs Views scatter
  const durationVsViewsData = useMemo(() => ({
    datasets: [
      {
        data: videos.map((v) => ({
          x: Math.round(v.duration / 60),
          y: v.views,
        })),
        backgroundColor: YT_COLORS.blue,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  }), [videos]);

  // Title length vs Views scatter
  const titleVsViewsData = useMemo(() => ({
    datasets: [
      {
        data: videos.map((v) => ({
          x: v.title.length,
          y: v.views,
        })),
        backgroundColor: YT_COLORS.purple,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  }), [videos]);

  // Avg views by duration range
  const avgViewsByDuration = useMemo(() => {
    const ranges = [
      { label: "< 5 min", min: 0, max: 300 },
      { label: "5-10 min", min: 300, max: 600 },
      { label: "10-20 min", min: 600, max: 1200 },
      { label: "20-30 min", min: 1200, max: 1800 },
      { label: "30+ min", min: 1800, max: Infinity },
    ];
    const data = ranges.map((r) => {
      const inRange = videos.filter(
        (v) => v.duration >= r.min && v.duration < r.max
      );
      return inRange.length > 0
        ? Math.round(
            inRange.reduce((a, v) => a + v.views, 0) / inRange.length
          )
        : 0;
    });
    return {
      labels: ranges.map((r) => r.label),
      datasets: [
        {
          data,
          backgroundColor: YT_COLORS.green,
          borderRadius: 4,
        },
      ],
    };
  }, [videos]);

  // Word cloud from titles
  const wordCloud = useMemo(() => {
    const stopWords = new Set([
      "de", "la", "el", "en", "y", "a", "que", "los", "las", "un", "una",
      "del", "por", "con", "para", "es", "al", "lo", "se", "no", "mi",
      "como", "mas", "te", "tu", "su", "me", "the", "to", "and", "of",
      "in", "is", "it", "for", "on", "with", "this", "that", "my", "you",
      "i", "do", "how", "|", "-", "–", "—",
    ]);
    const freq: Record<string, number> = {};
    for (const v of videos) {
      const words = v.title
        .toLowerCase()
        .replace(/[^\w\sáéíóúñü]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
      for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60);
  }, [videos]);

  const maxFreq = wordCloud.length > 0 ? wordCloud[0][1] : 1;

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Distribucion de Duracion"
          subtitle="Numero de videos por rango"
          tall
        >
          <Bar
            data={durationDistData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            }}
          />
        </ChartCard>
        <ChartCard
          title="Duracion vs Views"
          subtitle="Cada punto = 1 video"
          tall
        >
          <Scatter
            data={durationVsViewsData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  title: { display: true, text: "Duracion (min)" },
                },
                y: {
                  title: { display: true, text: "Views" },
                  ticks: { callback: (v) => formatNumber(v as number) },
                },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Longitud Titulo vs Views"
          subtitle="Cada punto = 1 video"
          tall
        >
          <Scatter
            data={titleVsViewsData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  title: { display: true, text: "Caracteres en titulo" },
                },
                y: {
                  title: { display: true, text: "Views" },
                  ticks: { callback: (v) => formatNumber(v as number) },
                },
              },
            }}
          />
        </ChartCard>
        <ChartCard
          title="Views Promedio por Duracion"
          subtitle="Que duracion funciona mejor"
          tall
        >
          <Bar
            data={avgViewsByDuration}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: (v) => formatNumber(v as number) } },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Word cloud */}
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Palabras mas usadas en titulos
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Frecuencia de palabras en los titulos de tus videos
        </p>
        <div className="flex flex-wrap gap-2">
          {wordCloud.map(([word, count]) => {
            const scale = count / maxFreq;
            const size = 12 + scale * 20;
            const opacity = 0.4 + scale * 0.6;
            return (
              <span
                key={word}
                className="text-red-400 font-medium cursor-default transition-transform hover:scale-110"
                style={{ fontSize: `${size}px`, opacity }}
                title={`${word}: ${count} veces`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
