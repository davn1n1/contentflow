"use client";

import "@/lib/chartjs-setup";
import { Bar, Line } from "react-chartjs-2";
import { Chart } from "react-chartjs-2";
import { ChartCard } from "../chart-card";
import { KpiCard } from "../kpi-card";
import { formatNumber } from "../utils";
import type { AnalyticsResponse } from "@/lib/youtube/analytics-api";

function fmtMoney(n: number): string {
  return "$" + (n || 0).toFixed(2);
}

interface RevenueTabProps {
  revenue: AnalyticsResponse | null;
  monthly: AnalyticsResponse | null;
  impressions: AnalyticsResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function RevenueTab({
  revenue,
  monthly,
  impressions,
  isLoading,
  error,
}: RevenueTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground animate-pulse">
          Cargando datos de ingresos...
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

  const hasRevenue = revenue?.rows?.length;
  const hasMonthly = monthly?.rows?.length;
  const hasImpressions = impressions?.rows?.length;

  if (!hasRevenue && !hasMonthly && !hasImpressions) {
    return (
      <div className="glass-card rounded-xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No hay datos de ingresos disponibles. El canal puede no estar
          monetizado.
        </p>
      </div>
    );
  }

  // KPIs
  let totalRev = 0;
  let totalAdRev = 0;
  if (revenue?.rows) {
    revenue.rows.forEach((r) => {
      totalRev += r[1] as number;
      totalAdRev += r[2] as number;
    });
  }

  let totalWatch = 0;
  let totalSubGain = 0;
  let totalSubLost = 0;
  if (monthly?.rows) {
    monthly.rows.forEach((r) => {
      totalWatch += r[2] as number;
      totalSubGain += r[3] as number;
      totalSubLost += r[4] as number;
    });
  }

  // RPM calc
  const revMap: Record<string, number> = {};
  const viewMap: Record<string, number> = {};
  if (revenue?.rows) {
    revenue.rows.forEach((r) => {
      revMap[r[0] as string] = r[1] as number;
    });
  }
  if (monthly?.rows) {
    monthly.rows.forEach((r) => {
      viewMap[r[0] as string] = r[1] as number;
    });
  }
  const rpmMonths = Object.keys(revMap)
    .filter((m) => viewMap[m] && viewMap[m] > 0)
    .sort();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos Totales"
          value={fmtMoney(totalRev)}
          color="#30d158"
        />
        <KpiCard
          label="Ingresos Ads"
          value={fmtMoney(totalAdRev)}
          color="#ffd60a"
        />
        <KpiCard
          label="Watch Time Total"
          value={`${formatNumber(Math.round(totalWatch))} min`}
          color="#0a84ff"
        />
        <KpiCard
          label="Suscriptores Netos"
          value={formatNumber(totalSubGain - totalSubLost)}
          color="#bf5af2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by month */}
        {hasRevenue && (
          <ChartCard title="Ingresos por Mes" tall>
            <Bar
              data={{
                labels: revenue!.rows.map((r) => r[0] as string),
                datasets: [
                  {
                    label: "Ingresos ($)",
                    data: revenue!.rows.map((r) =>
                      parseFloat((r[1] as number).toFixed(2))
                    ),
                    backgroundColor: "rgba(48,209,88,.6)",
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (i) => "$" + parseFloat(i.raw as string).toFixed(2),
                    },
                  },
                },
                scales: {
                  y: { ticks: { callback: (v) => "$" + v } },
                },
              }}
            />
          </ChartCard>
        )}

        {/* RPM */}
        {rpmMonths.length > 0 && (
          <ChartCard title="RPM por Mes" tall>
            <Line
              data={{
                labels: rpmMonths,
                datasets: [
                  {
                    label: "RPM ($)",
                    data: rpmMonths.map((m) =>
                      parseFloat(
                        ((revMap[m] / viewMap[m]) * 1000).toFixed(2)
                      )
                    ),
                    borderColor: "rgba(255,159,10,.8)",
                    backgroundColor: "rgba(255,159,10,.1)",
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (i) => "$" + i.raw + " RPM",
                    },
                  },
                },
                scales: {
                  y: { ticks: { callback: (v) => "$" + v } },
                },
              }}
            />
          </ChartCard>
        )}
      </div>

      {/* Impressions & CTR */}
      {hasImpressions && (
        <ChartCard title="Impresiones y CTR por Mes" tall>
          <Chart
            type="bar"
            data={
              {
                labels: impressions!.rows
                  .filter((r) => (r[2] as number) > 0)
                  .map((r) => r[0] as string),
                datasets: [
                  {
                    label: "Impresiones",
                    data: impressions!.rows
                      .filter((r) => (r[2] as number) > 0)
                      .map((r) => r[2] as number),
                    backgroundColor: "rgba(10,132,255,.5)",
                    borderRadius: 3,
                    yAxisID: "y",
                  },
                  {
                    label: "CTR %",
                    data: impressions!.rows
                      .filter((r) => (r[2] as number) > 0)
                      .map((r) =>
                        parseFloat(((r[3] as number) * 100).toFixed(2))
                      ),
                    type: "line" as const,
                    borderColor: "rgba(255,45,85,.8)",
                    yAxisID: "y1",
                    tension: 0.3,
                    pointRadius: 2,
                  },
                ],
              } as never
            }
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { boxWidth: 10 } } },
              scales: {
                y: {
                  position: "left",
                  ticks: { callback: (v) => formatNumber(v as number) },
                },
                y1: {
                  position: "right",
                  grid: { drawOnChartArea: false },
                  ticks: { callback: (v) => v + "%" },
                },
              },
            }}
          />
        </ChartCard>
      )}
    </div>
  );
}
