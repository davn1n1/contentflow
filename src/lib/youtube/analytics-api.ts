// YouTube Analytics API v2 client-side calls
// Ported from standalone dashboard (youtube-dashboard.html)

import { debugLog } from "@/components/debug/debug-panel";

export interface AnalyticsQuery {
  ids: string;
  startDate: string;
  endDate: string;
  metrics: string;
  dimensions: string;
  sort?: string;
  maxResults?: number;
}

export interface AnalyticsResponse {
  kind: string;
  columnHeaders: { name: string; columnType: string; dataType: string }[];
  rows: (string | number)[][];
}

async function ytAnalytics(
  label: string,
  params: AnalyticsQuery,
  accessToken: string
): Promise<AnalyticsResponse | null> {
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });

  debugLog("info", "YT-API", `Fetching ${label}...`, {
    dimensions: params.dimensions,
    metrics: params.metrics,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    const msg = e.error?.message || `HTTP ${r.status}`;
    debugLog("error", "YT-API", `${label} FAILED: ${msg}`, {
      status: r.status,
      error: e.error || e,
      url: url.toString().replace(accessToken, "TOKEN***"),
    });
    throw new Error(msg);
  }

  const data = await r.json();
  debugLog("success", "YT-API", `${label} OK: ${data.rows?.length ?? 0} rows`, {
    columnHeaders: data.columnHeaders?.map((h: { name: string }) => h.name),
    rowCount: data.rows?.length ?? 0,
    sampleRow: data.rows?.[0],
  });
  return data;
}

export interface YouTubeAnalyticsData {
  demographics: AnalyticsResponse | null;
  geography: AnalyticsResponse | null;
  traffic: AnalyticsResponse | null;
  devices: AnalyticsResponse | null;
  revenue: AnalyticsResponse | null;
  monthly: AnalyticsResponse | null;
  impressions: AnalyticsResponse | null;
}

export async function fetchAllAnalytics(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<YouTubeAnalyticsData> {
  debugLog("info", "OAuth", `Fetching analytics: ${startDate} → ${endDate}`);

  const [demographics, geography, traffic, devices, revenue, monthly, impressions] =
    await Promise.all([
      ytAnalytics("Demographics", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,estimatedMinutesWatched",
        dimensions: "ageGroup,gender",
        sort: "-views",
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Demographics catch: ${e.message}`); return null; }),

      ytAnalytics("Geography", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,estimatedMinutesWatched,averageViewDuration",
        dimensions: "country",
        sort: "-views",
        maxResults: 25,
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Geography catch: ${e.message}`); return null; }),

      ytAnalytics("Traffic", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,estimatedMinutesWatched",
        dimensions: "insightTrafficSourceType",
        sort: "-views",
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Traffic catch: ${e.message}`); return null; }),

      ytAnalytics("Devices", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,estimatedMinutesWatched",
        dimensions: "deviceType",
        sort: "-views",
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Devices catch: ${e.message}`); return null; }),

      ytAnalytics("Revenue", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "estimatedRevenue,estimatedAdRevenue,grossRevenue",
        dimensions: "month",
        sort: "month",
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Revenue catch: ${e.message}`); return null; }),

      ytAnalytics("Monthly", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
        dimensions: "month",
        sort: "month",
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Monthly catch: ${e.message}`); return null; }),

      ytAnalytics("Impressions", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,impressions,impressionClickThroughRate,estimatedMinutesWatched",
        dimensions: "month",
        sort: "month",
      }, accessToken).catch((e) => { debugLog("error", "YT-API", `Impressions catch: ${e.message}`); return null; }),
    ]);

  const successCount = [demographics, geography, traffic, devices, revenue, monthly, impressions]
    .filter(Boolean).length;
  debugLog(successCount === 7 ? "success" : "warn", "OAuth",
    `Analytics completado: ${successCount}/7 queries OK`);

  return { demographics, geography, traffic, devices, revenue, monthly, impressions };
}
