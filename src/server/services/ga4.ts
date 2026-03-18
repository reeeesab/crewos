import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface GA4Credentials {
  clientEmail: string;
  privateKey: string;
  propertyId: string;
}

export interface AnalyticsSource {
  source: string;
  sessions: number;
  keyEvents: number;
  converting: boolean;
}

export interface AnalyticsPage {
  page: string;
  sessions: number;
  keyEvents: number;
  conversionRate: number;
}

export interface AnalyticsCountry {
  country: string;
  users: number;
  percentage: number;
}

export interface DailyTrendPoint {
  date: string;
  users: number;
  newUsers: number;
  sessions: number;
}

export interface AnalyticsReportResult {
  overview: {
    totalSessions: number;
    totalUsers: number;
    newUsers: number;
    returningUsers: number;
    avgEngagementSeconds: number;
    bounceRate: number;
    pageViews: number;
    keyEvents: number;
    conversionRate: number;
  };
  topSources: AnalyticsSource[];
  topPages: AnalyticsPage[];
  topCountries: AnalyticsCountry[];
  dailyTrend: DailyTrendPoint[];
}

function getClient(credentials: GA4Credentials) {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey.replace(/\\n/g, "\n"),
    },
  });
}

function toInt(value: string | null | undefined): number {
  return Number.parseInt(value ?? "0", 10) || 0;
}

function toFloat(value: string | null | undefined): number {
  return Number.parseFloat(value ?? "0") || 0;
}

export async function verifyGA4Connection(credentials: GA4Credentials): Promise<boolean> {
  try {
    const client = getClient(credentials);
    await client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      metrics: [{ name: "activeUsers" }],
    });
    return true;
  } catch {
    return false;
  }
}

export async function getRealtimeUsers(credentials: GA4Credentials) {
  const client = getClient(credentials);
  const [response] = await client.runRealtimeReport({
    property: `properties/${credentials.propertyId}`,
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "country" }],
  });

  const rows = response.rows ?? [];

  const totalActive = rows.reduce((sum, row) => sum + toInt(row.metricValues?.[0]?.value), 0);
  const byCountry = rows
    .slice()
    .sort((a, b) => toInt(b.metricValues?.[0]?.value) - toInt(a.metricValues?.[0]?.value))
    .slice(0, 5)
    .map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? "Unknown",
      users: toInt(row.metricValues?.[0]?.value),
    }));

  return { totalActive, byCountry };
}

export async function getAnalyticsReport(
  credentials: GA4Credentials,
  days: 7 | 30 | 90 = 30,
): Promise<AnalyticsReportResult> {
  const client = getClient(credentials);
  const startDate = `${days}daysAgo`;

  const [overviewResponse, sourcesResponse, pagesResponse, countriesResponse, trendResponse] = await Promise.all([
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "screenPageViews" },
        { name: "keyEvents" },
      ],
    }),
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: "keyEvents" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }, { name: "keyEvents" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 10,
    }),
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
  ]);

  const overviewRow = overviewResponse[0].rows?.[0];
  const totalSessions = toInt(overviewRow?.metricValues?.[0]?.value);
  const totalUsers = toInt(overviewRow?.metricValues?.[1]?.value);
  const newUsers = toInt(overviewRow?.metricValues?.[2]?.value);
  const avgEngagement = toFloat(overviewRow?.metricValues?.[3]?.value);
  const bounceRate = toFloat(overviewRow?.metricValues?.[4]?.value);
  const pageViews = toInt(overviewRow?.metricValues?.[5]?.value);
  const keyEvents = toInt(overviewRow?.metricValues?.[6]?.value);
  const conversionRate = totalSessions > 0 ? Math.round((keyEvents / totalSessions) * 1000) / 10 : 0;

  const topSources: AnalyticsSource[] =
    sourcesResponse[0].rows?.map((row) => {
      const sessions = toInt(row.metricValues?.[0]?.value);
      const events = toInt(row.metricValues?.[1]?.value);
      return {
        source: row.dimensionValues?.[0]?.value ?? "direct",
        sessions,
        keyEvents: events,
        converting: events > 0,
      };
    }) ?? [];

  const topPages: AnalyticsPage[] =
    pagesResponse[0].rows?.map((row) => {
      const sessions = toInt(row.metricValues?.[0]?.value);
      const events = toInt(row.metricValues?.[1]?.value);
      return {
        page: row.dimensionValues?.[0]?.value ?? "/",
        sessions,
        keyEvents: events,
        conversionRate: sessions > 0 ? Math.round((events / sessions) * 1000) / 10 : 0,
      };
    }) ?? [];

  const totalUsersForCalc = totalUsers || 1;
  const topCountries: AnalyticsCountry[] =
    countriesResponse[0].rows?.map((row) => {
      const users = toInt(row.metricValues?.[0]?.value);
      return {
        country: row.dimensionValues?.[0]?.value ?? "Unknown",
        users,
        percentage: Math.round((users / totalUsersForCalc) * 100),
      };
    }) ?? [];

  const dailyTrend: DailyTrendPoint[] =
    trendResponse[0].rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      users: toInt(row.metricValues?.[0]?.value),
      newUsers: toInt(row.metricValues?.[1]?.value),
      sessions: toInt(row.metricValues?.[2]?.value),
    })) ?? [];

  return {
    overview: {
      totalSessions,
      totalUsers,
      newUsers,
      returningUsers: Math.max(totalUsers - newUsers, 0),
      avgEngagementSeconds: Math.round(avgEngagement),
      bounceRate: Math.round(bounceRate * 100) / 100,
      pageViews,
      keyEvents,
      conversionRate,
    },
    topSources,
    topPages,
    topCountries,
    dailyTrend,
  };
}

export async function getHourlySessions(credentials: GA4Credentials): Promise<number> {
  const client = getClient(credentials);
  const [response] = await client.runRealtimeReport({
    property: `properties/${credentials.propertyId}`,
    metrics: [{ name: "screenPageViews" }],
    minuteRanges: [{ name: "last60min", startMinutesAgo: 60, endMinutesAgo: 0 }],
  });
  return toInt(response.rows?.[0]?.metricValues?.[0]?.value);
}
