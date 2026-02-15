// YouTube Analytics API v2 client-side calls
// Ported from standalone dashboard (youtube-dashboard.html)

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
  params: AnalyticsQuery,
  accessToken: string
): Promise<AnalyticsResponse | null> {
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || `Analytics Error: ${r.status}`);
  }
  return r.json();
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
  channelCreatedDate?: string
): Promise<YouTubeAnalyticsData> {
  const startDate = channelCreatedDate?.split("T")[0] || "2015-01-01";
  const endDate = new Date().toISOString().split("T")[0];

  const [demographics, geography, traffic, devices, revenue, monthly, impressions] =
    await Promise.all([
      // 1. Demographics (Age & Gender)
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "views,estimatedMinutesWatched",
          dimensions: "ageGroup,gender",
          sort: "-views",
        },
        accessToken
      ).catch(() => null),

      // 2. Geography (Countries)
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "views,estimatedMinutesWatched,averageViewDuration",
          dimensions: "country",
          sort: "-views",
          maxResults: 25,
        },
        accessToken
      ).catch(() => null),

      // 3. Traffic Sources
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "views,estimatedMinutesWatched",
          dimensions: "insightTrafficSourceType",
          sort: "-views",
        },
        accessToken
      ).catch(() => null),

      // 4. Device Types
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "views,estimatedMinutesWatched",
          dimensions: "deviceType",
          sort: "-views",
        },
        accessToken
      ).catch(() => null),

      // 5. Revenue by Month
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "estimatedRevenue,estimatedAdRevenue,grossRevenue",
          dimensions: "month",
          sort: "month",
        },
        accessToken
      ).catch(() => null),

      // 6. Monthly Views & Subscribers
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics:
            "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
          dimensions: "month",
          sort: "month",
        },
        accessToken
      ).catch(() => null),

      // 7. Impressions & CTR by Month
      ytAnalytics(
        {
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics:
            "views,impressions,impressionClickThroughRate,estimatedMinutesWatched",
          dimensions: "month",
          sort: "month",
        },
        accessToken
      ).catch(() => null),
    ]);

  return { demographics, geography, traffic, devices, revenue, monthly, impressions };
}
