"use client";

import "@/lib/chartjs-setup";
import { Doughnut, Bar } from "react-chartjs-2";
import { ChartCard } from "../chart-card";
import { KpiCard } from "../kpi-card";
import { GENDER_LABELS } from "@/lib/youtube/label-maps";
import type { AnalyticsResponse } from "@/lib/youtube/analytics-api";

interface DemographicsTabProps {
  data: AnalyticsResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function DemographicsTab({ data, isLoading, error }: DemographicsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground animate-pulse">
          Cargando datos de demografia...
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
          No hay datos de demografia disponibles.
        </p>
      </div>
    );
  }

  // Process data: rows = [ageGroup, gender, viewerPercentage]
  const genderMap: Record<string, number> = {};
  const ageMap: Record<string, number> = {};
  const ageGenderMap: Record<string, Record<string, number>> = {};

  data.rows.forEach((r) => {
    const age = r[0] as string;
    const gender = r[1] as string;
    const pct = r[2] as number;

    genderMap[gender] = (genderMap[gender] || 0) + pct;
    ageMap[age] = (ageMap[age] || 0) + pct;
    if (!ageGenderMap[age]) ageGenderMap[age] = {};
    ageGenderMap[age][gender] = (ageGenderMap[age][gender] || 0) + pct;
  });

  const ages = Object.keys(ageMap).sort();
  const genders = Object.keys(genderMap);
  const genderColors = ["#0a84ff", "#ff6482", "#bf5af2"];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(genderMap).map(([g, v], i) => (
          <KpiCard
            key={g}
            label={GENDER_LABELS[g] || g}
            value={`${v.toFixed(1)}%`}
            color={genderColors[i]}
          />
        ))}
        <KpiCard
          label="Grupos de Edad"
          value={String(ages.length)}
          color="#8e8ea0"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender donut */}
        <ChartCard title="Distribucion por Genero">
          <Doughnut
            data={{
              labels: Object.keys(genderMap).map(
                (g) => GENDER_LABELS[g] || g
              ),
              datasets: [
                {
                  data: Object.values(genderMap),
                  backgroundColor: genderColors,
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "55%",
              plugins: {
                legend: { position: "bottom", labels: { boxWidth: 10 } },
              },
            }}
          />
        </ChartCard>

        {/* Age bar */}
        <ChartCard title="Distribucion por Edad">
          <Bar
            data={{
              labels: ages.map((a) => a.replace("age", "")),
              datasets: [
                {
                  data: ages.map((a) => ageMap[a]),
                  backgroundColor: "rgba(191,90,242,.7)",
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: (v) => v + "%" } },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Age x Gender grouped */}
      <ChartCard title="Edad x Genero" tall>
        <Bar
          data={{
            labels: ages.map((a) => a.replace("age", "")),
            datasets: genders.map((g, i) => ({
              label: GENDER_LABELS[g] || g,
              data: ages.map((a) => ageGenderMap[a]?.[g] || 0),
              backgroundColor: [
                "rgba(10,132,255,.7)",
                "rgba(255,100,130,.7)",
                "rgba(191,90,242,.7)",
              ][i],
              borderRadius: 4,
            })),
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 10 } } },
            scales: {
              y: { ticks: { callback: (v) => v + "%" } },
            },
          }}
        />
      </ChartCard>
    </div>
  );
}
