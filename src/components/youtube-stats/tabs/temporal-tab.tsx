"use client";

import { useMemo } from "react";
import { Bar, Chart } from "react-chartjs-2";
import "@/lib/chartjs-setup";
import type { YouTubeVideoStats } from "@/types/youtube";
import { ChartCard } from "../chart-card";
import { formatNumber, YT_COLORS } from "../utils";

interface TemporalTabProps {
  videos: YouTubeVideoStats[];
}

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const DAY_LABELS_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const RAINBOW_COLORS = [
  "rgba(255, 45, 85, 0.7)",   // red - Domingo
  "rgba(255, 159, 10, 0.7)",  // orange - Lunes
  "rgba(255, 214, 10, 0.7)",  // yellow - Martes
  "rgba(48, 209, 88, 0.7)",   // green - Miercoles
  "rgba(10, 132, 255, 0.7)",  // blue - Jueves
  "rgba(191, 90, 242, 0.7)",  // purple - Viernes
  "rgba(100, 210, 255, 0.7)", // cyan - Sabado
];

export function TemporalTab({ videos }: TemporalTabProps) {
  // 1. Monthly publication frequency
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    videos.forEach((v) => {
      const d = new Date(v.publishedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const sorted = Object.keys(counts).sort();
    return {
      labels: sorted,
      datasets: [
        {
          label: "Videos publicados",
          data: sorted.map((k) => counts[k]),
          backgroundColor: YT_COLORS.blue,
          borderRadius: 3,
        },
      ],
    };
  }, [videos]);

  // 2. Day of week distribution
  const dayOfWeekData = useMemo(() => {
    const counts = new Array(7).fill(0);
    videos.forEach((v) => {
      const day = new Date(v.publishedAt).getDay();
      counts[day]++;
    });
    return {
      labels: DAY_LABELS,
      datasets: [
        {
          label: "Videos",
          data: counts,
          backgroundColor: RAINBOW_COLORS,
          borderRadius: 4,
          borderSkipped: false as const,
        },
      ],
    };
  }, [videos]);

  // 3. Hour of day distribution
  const hourOfDayData = useMemo(() => {
    const counts = new Array(24).fill(0);
    videos.forEach((v) => {
      const hour = new Date(v.publishedAt).getHours();
      counts[hour]++;
    });
    return {
      labels: HOUR_LABELS,
      datasets: [
        {
          label: "Videos",
          data: counts,
          backgroundColor: YT_COLORS.cyan,
          borderRadius: 3,
        },
      ],
    };
  }, [videos]);

  // 4. Average views by year (dual axis: line for avg views, bar for video count)
  const yearlyData = useMemo(() => {
    const yearMap: Record<string, { totalViews: number; count: number }> = {};
    videos.forEach((v) => {
      const year = String(new Date(v.publishedAt).getFullYear());
      if (!yearMap[year]) yearMap[year] = { totalViews: 0, count: 0 };
      yearMap[year].totalViews += v.views;
      yearMap[year].count++;
    });
    const years = Object.keys(yearMap).sort();
    return {
      labels: years,
      datasets: [
        {
          type: "bar" as const,
          label: "Videos publicados",
          data: years.map((y) => yearMap[y].count),
          backgroundColor: YT_COLORS.green,
          borderRadius: 4,
          yAxisID: "yCount",
          order: 2,
        },
        {
          type: "line" as const,
          label: "Avg Views",
          data: years.map((y) =>
            Math.round(yearMap[y].totalViews / yearMap[y].count)
          ),
          borderColor: YT_COLORS.red,
          backgroundColor: YT_COLORS.redBg,
          pointBackgroundColor: YT_COLORS.red,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.3,
          fill: false,
          yAxisID: "yViews",
          order: 1,
        },
      ],
    };
  }, [videos]);

  // 5. Heatmap data: day (0-6) x hour (0-23)
  const heatmapData = useMemo(() => {
    // 7 rows (days) x 24 cols (hours)
    const grid: number[][] = Array.from({ length: 7 }, () =>
      new Array(24).fill(0)
    );
    let maxCount = 0;
    videos.forEach((v) => {
      const d = new Date(v.publishedAt);
      const day = d.getDay();
      const hour = d.getHours();
      grid[day][hour]++;
    });
    grid.forEach((row) =>
      row.forEach((val) => {
        if (val > maxCount) maxCount = val;
      })
    );
    return { grid, maxCount };
  }, [videos]);

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly frequency */}
      <ChartCard
        title="Frecuencia de Publicacion Mensual"
        subtitle="Videos publicados por mes"
        tall
      >
        <Bar
          data={monthlyData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  autoSkip: true,
                  maxTicksLimit: 24,
                  font: { size: 10 },
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                  callback: (v) => formatNumber(v as number),
                },
              },
            },
          }}
        />
      </ChartCard>

      {/* Row 2: Day of week + Hour of day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Distribucion por Dia de la Semana"
          subtitle="Cuando se publican los videos"
        >
          <Bar
            data={dayOfWeekData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1 },
                },
              },
            }}
          />
        </ChartCard>

        <ChartCard
          title="Distribucion por Hora del Dia"
          subtitle="Hora de publicacion (hora local)"
        >
          <Bar
            data={hourOfDayData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: {
                    maxRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 12,
                    font: { size: 10 },
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1 },
                },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Row 3: Avg views by year (dual axis) */}
      <ChartCard
        title="Views Promedio por Ano"
        subtitle="Linea: avg views | Barras: cantidad de videos"
        tall
      >
        <Chart
          type="bar"
          data={yearlyData as never}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom" as const,
                labels: { boxWidth: 12, padding: 16 },
              },
            },
            scales: {
              yViews: {
                type: "linear" as const,
                position: "left" as const,
                title: {
                  display: true,
                  text: "Avg Views",
                  font: { size: 10 },
                },
                ticks: {
                  callback: (v) => formatNumber(v as number),
                },
                grid: { drawOnChartArea: true },
              },
              yCount: {
                type: "linear" as const,
                position: "right" as const,
                title: {
                  display: true,
                  text: "Videos",
                  font: { size: 10 },
                },
                ticks: { stepSize: 1 },
                grid: { drawOnChartArea: false },
              },
            },
          }}
        />
      </ChartCard>

      {/* Row 4: Heatmap - Day x Hour */}
      <div className="glass-card rounded-xl border border-border p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Heatmap de Publicacion
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dia de la semana vs hora del dia
          </p>
        </div>

        {/* Hour labels header */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Top hour labels */}
            <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-[2px] mb-[2px]">
              <div /> {/* empty corner */}
              {HOUR_LABELS.map((h) => (
                <div
                  key={h}
                  className="text-[9px] text-muted-foreground text-center truncate"
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {heatmapData.grid.map((row, dayIdx) => (
              <div
                key={dayIdx}
                className="grid grid-cols-[60px_repeat(24,1fr)] gap-[2px] mb-[2px]"
              >
                <div className="text-[10px] text-muted-foreground flex items-center pr-1">
                  {DAY_LABELS_SHORT[dayIdx]}
                </div>
                {row.map((count, hourIdx) => {
                  const intensity =
                    heatmapData.maxCount > 0
                      ? count / heatmapData.maxCount
                      : 0;
                  return (
                    <div
                      key={hourIdx}
                      className="aspect-square rounded-sm relative group cursor-default"
                      style={{
                        backgroundColor:
                          count === 0
                            ? "rgba(255, 255, 255, 0.03)"
                            : `rgba(255, 45, 85, ${0.1 + intensity * 0.8})`,
                      }}
                      title={`${DAY_LABELS[dayIdx]} ${HOUR_LABELS[hourIdx]} - ${count} video${count !== 1 ? "s" : ""}`}
                    >
                      {count > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] text-muted-foreground">Menos</span>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((level) => (
                <div
                  key={level}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor:
                      level === 0
                        ? "rgba(255, 255, 255, 0.03)"
                        : `rgba(255, 45, 85, ${0.1 + level * 0.8})`,
                  }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">Mas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
