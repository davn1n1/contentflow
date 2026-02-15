"use client";

import "@/lib/chartjs-setup";
import { Bar, Doughnut } from "react-chartjs-2";
import { ChartCard } from "../chart-card";
import { formatNumber } from "../utils";
import {
  TRAFFIC_SOURCE_LABELS,
  DEVICE_LABELS,
  CHART_COLORS,
} from "@/lib/youtube/label-maps";
import type { AnalyticsResponse } from "@/lib/youtube/analytics-api";

interface TrafficTabProps {
  traffic: AnalyticsResponse | null;
  devices: AnalyticsResponse | null;
  impressions: AnalyticsResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function TrafficTab({
  traffic,
  devices,
  impressions,
  isLoading,
  error,
}: TrafficTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground animate-pulse">
          Cargando datos de trafico...
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

  const hasTraffic = traffic?.rows?.length;
  const hasDevices = devices?.rows?.length;

  if (!hasTraffic && !hasDevices) {
    return (
      <div className="glass-card rounded-xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No hay datos de trafico disponibles.
        </p>
      </div>
    );
  }

  // Traffic rows = [insightTrafficSourceType, views, estimatedMinutesWatched]
  const trafficTop10 = traffic?.rows?.slice(0, 10) || [];
  const totalTrafficViews = traffic?.rows?.reduce(
    (a, r) => a + (r[1] as number),
    0
  ) || 0;

  // Devices rows = [deviceType, views, estimatedMinutesWatched]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic sources bar */}
        {hasTraffic && (
          <ChartCard title="Top Fuentes de Trafico" tall>
            <Bar
              data={{
                labels: trafficTop10.map(
                  (r) =>
                    TRAFFIC_SOURCE_LABELS[r[0] as string] || (r[0] as string)
                ),
                datasets: [
                  {
                    data: trafficTop10.map((r) => r[1] as number),
                    backgroundColor: "rgba(255,159,10,.7)",
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
        )}

        {/* Devices donut */}
        {hasDevices && (
          <ChartCard title="Dispositivos" tall>
            <Doughnut
              data={{
                labels: devices!.rows.map(
                  (r) => DEVICE_LABELS[r[0] as string] || (r[0] as string)
                ),
                datasets: [
                  {
                    data: devices!.rows.map((r) => r[1] as number),
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
                    labels: { boxWidth: 10 },
                  },
                },
              }}
            />
          </ChartCard>
        )}
      </div>

      {/* Watch time by traffic source */}
      {hasTraffic && (
        <ChartCard title="Watch Time por Fuente (min)" tall>
          <Bar
            data={{
              labels: trafficTop10.map(
                (r) =>
                  TRAFFIC_SOURCE_LABELS[r[0] as string] || (r[0] as string)
              ),
              datasets: [
                {
                  label: "Watch Time (min)",
                  data: trafficTop10.map((r) =>
                    Math.round(r[2] as number)
                  ),
                  backgroundColor: "rgba(100,210,255,.6)",
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  ticks: { callback: (v) => formatNumber(v as number) },
                },
              },
            }}
          />
        </ChartCard>
      )}

      {/* Traffic sources table */}
      {hasTraffic && (
        <div className="glass-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Detalle de Fuentes de Trafico
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 font-medium">Fuente</th>
                  <th className="pb-2 font-medium text-right">Views</th>
                  <th className="pb-2 font-medium text-right">%</th>
                  <th className="pb-2 font-medium text-right">Watch Time</th>
                </tr>
              </thead>
              <tbody>
                {traffic!.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-foreground">
                      {TRAFFIC_SOURCE_LABELS[r[0] as string] ||
                        (r[0] as string)}
                    </td>
                    <td className="py-2 text-right text-foreground">
                      {formatNumber(r[1] as number)}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {totalTrafficViews > 0
                        ? (
                            ((r[1] as number) / totalTrafficViews) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                    <td className="py-2 text-right text-foreground">
                      {formatNumber(Math.round(r[2] as number))} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
