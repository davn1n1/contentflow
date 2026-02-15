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

// YouTube Analytics API v2 with dimensions=month requires BOTH dates to be 1st of month.
// endDate = first of the last COMPLETE month (e.g. Feb 15 → Jan 1, Jan 31 → Jan 1)
function alignEndToMonth(endDate: string): string {
  const d = new Date(endDate + "T12:00:00");
  const lastOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  if (d.getDate() === lastOfMonth.getDate()) {
    // End of month — this month is complete, use 1st of this month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }
  // Mid-month — use 1st of previous month (last complete month)
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`;
}

function alignStartToMonth(startDate: string): string {
  const d = new Date(startDate + "T12:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function fetchAllAnalytics(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<YouTubeAnalyticsData> {
  debugLog("info", "OAuth", `Fetching analytics: ${startDate} → ${endDate}`);

  // For month-dimension queries, dates must align to month boundaries
  const monthStart = alignStartToMonth(startDate);
  const monthEnd = alignEndToMonth(endDate);
  const monthRangeValid = monthStart <= monthEnd;

  debugLog("info", "YT-API", `Month-aligned range: ${monthStart} → ${monthEnd} (valid: ${monthRangeValid})`);

  const [demographics, geography, traffic, devices, revenue, monthly] =
    await Promise.all([
      // Demographics: requires viewerPercentage metric (not views)
      ytAnalytics("Demographics", {
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "viewerPercentage",
        dimensions: "ageGroup,gender",
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

      // Revenue: month dimension requires aligned dates
      monthRangeValid
        ? ytAnalytics("Revenue", {
            ids: "channel==MINE",
            startDate: monthStart,
            endDate: monthEnd,
            metrics: "estimatedRevenue,estimatedAdRevenue,grossRevenue",
            dimensions: "month",
            sort: "month",
          }, accessToken).catch((e) => { debugLog("error", "YT-API", `Revenue catch: ${e.message}`); return null; })
        : Promise.resolve(null),

      // Monthly: month dimension requires aligned dates
      monthRangeValid
        ? ytAnalytics("Monthly", {
            ids: "channel==MINE",
            startDate: monthStart,
            endDate: monthEnd,
            metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
            dimensions: "month",
            sort: "month",
          }, accessToken).catch((e) => { debugLog("error", "YT-API", `Monthly catch: ${e.message}`); return null; })
        : Promise.resolve(null),
    ]);

  // impressions/impressionClickThroughRate not available in Analytics API v2
  const impressions = null;

  const successCount = [demographics, geography, traffic, devices, revenue, monthly]
    .filter(Boolean).length;
  debugLog(successCount === 6 ? "success" : "warn", "OAuth",
    `Analytics completado: ${successCount}/6 queries OK`);

  return { demographics, geography, traffic, devices, revenue, monthly, impressions };
}
