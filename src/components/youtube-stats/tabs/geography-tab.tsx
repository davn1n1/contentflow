"use client";

import "@/lib/chartjs-setup";
import { Bar, Doughnut } from "react-chartjs-2";
import { ChartCard } from "../chart-card";
import { formatNumber } from "../utils";
import { COUNTRY_LABELS, CHART_COLORS } from "@/lib/youtube/label-maps";
import type { AnalyticsResponse } from "@/lib/youtube/analytics-api";

interface GeographyTabProps {
  data: AnalyticsResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function GeographyTab({ data, isLoading, error }: GeographyTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground animate-pulse">
          Cargando datos de paises...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl border border-red-500/20 p-6 text-center">
        <p className="text-sm text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  if (!data?.rows?.length) {
    return (
      <div className="glass-card rounded-xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No hay datos de paises disponibles.
        </p>
      </div>
    );
  }

  // rows = [country, views, estimatedMinutesWatched, averageViewDuration]
  const countries = data.rows.slice(0, 15);
  const totalViews = data.rows.reduce((a, r) => a + (r[1] as number), 0);

  // Donut: top 8 + rest
  const top8 = data.rows.slice(0, 8);
  const rest = data.rows.slice(8).reduce((a, r) => a + (r[1] as number), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top countries bar */}
        <ChartCard title="Top 15 Paises por Views" tall>
          <Bar
            data={{
              labels: countries.map(
                (r) => COUNTRY_LABELS[r[0] as string] || (r[0] as string)
              ),
              datasets: [
                {
                  data: countries.map((r) => r[1] as number),
                  backgroundColor: "rgba(10,132,255,.7)",
                  borderRadius: 4,
                  borderSkipped: false,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: { callback: (v) => formatNumber(v as number) },
                },
              },
            }}
          />
        </ChartCard>

        {/* Donut distribution */}
        <ChartCard title="Distribucion por Pais" tall>
          <Doughnut
            data={{
              labels: [
                ...top8.map(
                  (r) => COUNTRY_LABELS[r[0] as string] || (r[0] as string)
                ),
                "Otros",
              ],
              datasets: [
                {
                  data: [...top8.map((r) => r[1] as number), rest],
                  backgroundColor: CHART_COLORS,
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "50%",
              plugins: {
                legend: {
                  position: "right",
                  labels: { boxWidth: 10, font: { size: 10 } },
                },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Watch time by country */}
      <ChartCard title="Watch Time por Pais (min)" tall>
        <Bar
          data={{
            labels: countries.map(
              (r) => COUNTRY_LABELS[r[0] as string] || (r[0] as string)
            ),
            datasets: [
              {
                label: "Watch Time (min)",
                data: countries.map((r) => Math.round(r[2] as number)),
                backgroundColor: "rgba(48,209,88,.6)",
                borderRadius: 4,
              },
            ],
          }}
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

      {/* Table */}
      <div className="glass-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Detalle por Pais
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="pb-2 font-medium">Pais</th>
                <th className="pb-2 font-medium text-right">Views</th>
                <th className="pb-2 font-medium text-right">%</th>
                <th className="pb-2 font-medium text-right">Watch Time</th>
                <th className="pb-2 font-medium text-right">Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 20).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-foreground">
                    {COUNTRY_LABELS[r[0] as string] || (r[0] as string)}
                  </td>
                  <td className="py-2 text-right text-foreground">
                    {formatNumber(r[1] as number)}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">
                    {(((r[1] as number) / totalViews) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 text-right text-foreground">
                    {formatNumber(Math.round(r[2] as number))} min
                  </td>
                  <td className="py-2 text-right text-muted-foreground">
                    {Math.round(r[3] as number)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
