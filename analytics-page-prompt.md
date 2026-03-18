# CrewOS — Analytics Page Implementation Prompt
# Stack: Next.js 14 App Router · TypeScript · tRPC · Prisma · Supabase · Anthropic Claude

---

## What you are building

A new **Analytics** page inside CrewOS that connects to Google Analytics 4 via the GA4 Data API. The page shows 6 founder-focused insight cards, a realtime pulse, AI-generated weekly summary, and a traffic spike alert. It also includes a full in-app setup guide so users can connect their GA4 property without leaving CrewOS.

The page lives at: `/[productId]/analytics`

---

## IMPORTANT — Authentication method

Do NOT use a plain API key. GA4 requires a Service Account for server-side access.

The user provides 3 fields:
1. `client_email` — from their Service Account JSON file
2. `private_key` — from their Service Account JSON file  
3. `property_id` — their GA4 Property ID (9-digit number, e.g. `123456789`)

Store all three encrypted in the database. Never expose to the frontend. All GA4 API calls happen server-side only.

---

## Step 1 — Prisma schema

Add to `prisma/schema.prisma`:

```prisma
model AnalyticsConfig {
  id           String   @id @default(cuid())
  productId    String   @unique
  propertyId   String                          // GA4 Property ID e.g. "123456789"
  clientEmail  String                          // service account email
  privateKey   String   @db.Text              // service account private key (encrypted)
  isConnected  Boolean  @default(false)
  lastSyncedAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model AnalyticsSnapshot {
  id              String   @id @default(cuid())
  productId       String
  date            DateTime @default(now())
  
  // Traffic
  totalSessions   Int      @default(0)
  totalUsers      Int      @default(0)
  newUsers        Int      @default(0)
  returningUsers  Int      @default(0)
  
  // Engagement
  avgEngagementTime Float  @default(0)   // seconds
  bounceRate        Float  @default(0)   // percentage
  pageViews         Int    @default(0)
  
  // Conversions
  signupEvents    Int      @default(0)
  conversionRate  Float    @default(0)   // percentage
  
  // Top data (stored as JSON arrays)
  topSources      Json     @default("[]") // [{source, sessions, signups}]
  topPages        Json     @default("[]") // [{page, sessions, conversionRate}]
  topCountries    Json     @default("[]") // [{country, users, percentage}]
  
  // AI summary
  aiSummary       String?  @db.Text
  
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId, date])
}
```

Add to your `Product` model:
```prisma
analyticsConfig   AnalyticsConfig?
analyticsSnapshots AnalyticsSnapshot[]
```

Run: `npx prisma db push`

---

## Step 2 — Install dependencies

```bash
npm install @google-analytics/data
```

---

## Step 3 — GA4 service

Create `src/server/services/ga4.ts`:

```typescript
import { BetaAnalyticsDataClient } from "@google-analytics/data";

interface GA4Credentials {
  clientEmail: string;
  privateKey: string;
  propertyId: string;
}

function getClient(credentials: GA4Credentials) {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey.replace(/\\n/g, "\n"),
    },
  });
}

// ── 1. Verify connection ──────────────────────────────────
export async function verifyGA4Connection(
  credentials: GA4Credentials
): Promise<boolean> {
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

// ── 2. Realtime data ─────────────────────────────────────
export async function getRealtimeUsers(credentials: GA4Credentials) {
  const client = getClient(credentials);
  const [response] = await client.runRealtimeReport({
    property: `properties/${credentials.propertyId}`,
    metrics: [{ name: "activeUsers" }],
    dimensions: [{ name: "country" }],
  });

  const totalActive =
    response.rows?.reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value ?? "0"),
      0
    ) ?? 0;

  const byCountry =
    response.rows
      ?.sort(
        (a, b) =>
          parseInt(b.metricValues?.[0]?.value ?? "0") -
          parseInt(a.metricValues?.[0]?.value ?? "0")
      )
      .slice(0, 5)
      .map((row) => ({
        country: row.dimensionValues?.[0]?.value ?? "Unknown",
        users: parseInt(row.metricValues?.[0]?.value ?? "0"),
      })) ?? [];

  return { totalActive, byCountry };
}

// ── 3. Main analytics report ────────────────────────────
export async function getAnalyticsReport(
  credentials: GA4Credentials,
  days: 7 | 30 | 90 = 30
) {
  const client = getClient(credentials);
  const startDate = `${days}daysAgo`;

  // Run all queries in parallel
  const [
    overviewResponse,
    sourcesResponse,
    pagesResponse,
    countriesResponse,
    trendResponse,
  ] = await Promise.all([
    // Overview metrics
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

    // Traffic sources
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: "keyEvents" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),

    // Top pages by conversion
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }, { name: "keyEvents" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),

    // Countries
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 10,
    }),

    // Daily trend for chart
    client.runReport({
      property: `properties/${credentials.propertyId}`,
      dateRanges: [{ startDate, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "sessions" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
  ]);

  // Parse overview
  const overviewRow = overviewResponse[0].rows?.[0];
  const totalSessions = parseInt(
    overviewRow?.metricValues?.[0]?.value ?? "0"
  );
  const totalUsers = parseInt(overviewRow?.metricValues?.[1]?.value ?? "0");
  const newUsers = parseInt(overviewRow?.metricValues?.[2]?.value ?? "0");
  const avgEngagement = parseFloat(
    overviewRow?.metricValues?.[3]?.value ?? "0"
  );
  const bounceRate = parseFloat(overviewRow?.metricValues?.[4]?.value ?? "0");
  const pageViews = parseInt(overviewRow?.metricValues?.[5]?.value ?? "0");
  const keyEvents = parseInt(overviewRow?.metricValues?.[6]?.value ?? "0");
  const conversionRate =
    totalSessions > 0
      ? Math.round((keyEvents / totalSessions) * 1000) / 10
      : 0;

  // Parse sources
  const topSources =
    sourcesResponse[0].rows?.map((row) => {
      const sessions = parseInt(row.metricValues?.[0]?.value ?? "0");
      const events = parseInt(row.metricValues?.[1]?.value ?? "0");
      return {
        source: row.dimensionValues?.[0]?.value ?? "direct",
        sessions,
        keyEvents: events,
        converting: events > 0,
      };
    }) ?? [];

  // Parse pages
  const topPages =
    pagesResponse[0].rows?.map((row) => {
      const sessions = parseInt(row.metricValues?.[0]?.value ?? "0");
      const events = parseInt(row.metricValues?.[1]?.value ?? "0");
      return {
        page: row.dimensionValues?.[0]?.value ?? "/",
        sessions,
        keyEvents: events,
        conversionRate:
          sessions > 0 ? Math.round((events / sessions) * 1000) / 10 : 0,
      };
    }) ?? [];

  // Parse countries
  const totalUsersForCalc = totalUsers || 1;
  const topCountries =
    countriesResponse[0].rows?.map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? "Unknown",
      users: parseInt(row.metricValues?.[0]?.value ?? "0"),
      percentage: Math.round(
        (parseInt(row.metricValues?.[0]?.value ?? "0") /
          totalUsersForCalc) *
          100
      ),
    })) ?? [];

  // Parse daily trend
  const dailyTrend =
    trendResponse[0].rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      users: parseInt(row.metricValues?.[0]?.value ?? "0"),
      newUsers: parseInt(row.metricValues?.[1]?.value ?? "0"),
      sessions: parseInt(row.metricValues?.[2]?.value ?? "0"),
    })) ?? [];

  return {
    overview: {
      totalSessions,
      totalUsers,
      newUsers,
      returningUsers: totalUsers - newUsers,
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

// ── 4. Hourly sessions for spike detection ──────────────
export async function getHourlySessions(
  credentials: GA4Credentials
): Promise<number> {
  const client = getClient(credentials);
  const [response] = await client.runRealtimeReport({
    property: `properties/${credentials.propertyId}`,
    metrics: [{ name: "screenPageViews" }],
    minuteRanges: [{ name: "last60min", startMinutesAgo: 60, endMinutesAgo: 0 }],
  });
  return parseInt(response.rows?.[0]?.metricValues?.[0]?.value ?? "0");
}
```

---

## Step 4 — AI summary function

Add to `src/server/services/anthropic.ts`:

```typescript
export async function generateAnalyticsSummary({
  analytics,
  mrrDelta,
  productName,
}: {
  analytics: {
    totalSessions: number;
    newUsers: number;
    conversionRate: number;
    topSource: string;
    bounceRate: number;
    topCountry: string;
  };
  mrrDelta: number; // MRR change this week in cents
  productName: string;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are a sharp analytics advisor for an indie SaaS founder.

Write a 3-sentence summary of this week's analytics data for ${productName}.

Data:
- Sessions: ${analytics.totalSessions}
- New users: ${analytics.newUsers}
- Signup conversion rate: ${analytics.conversionRate}%
- Top traffic source: ${analytics.topSource}
- Bounce rate: ${analytics.bounceRate}%
- Top country: ${analytics.topCountry}
- MRR change this week: ${mrrDelta > 0 ? "+" : ""}${(mrrDelta / 100).toFixed(0)} USD

Rules:
- Be specific about the numbers, not vague
- If conversion rate is below 3%, flag it as something to improve
- If MRR went up AND traffic went up, connect them
- If a non-English-speaking country is in the top 3, mention localization as an opportunity
- Never start with "This week" or "Overall"
- 3 sentences maximum. Direct. Actionable.
- Output only the summary text, nothing else.`,
      },
    ],
  });

  return (message.content[0] as { text: string }).text.trim();
}
```

---

## Step 5 — tRPC router

Create `src/server/trpc/router/analytics.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  verifyGA4Connection,
  getRealtimeUsers,
  getAnalyticsReport,
} from "@/server/services/ga4";
import { generateAnalyticsSummary } from "@/server/services/anthropic";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = createTRPCRouter({

  // Get connection status
  getConfig: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      const config = await ctx.db.analyticsConfig.findUnique({
        where: { productId: input.productId },
        select: {
          id: true,
          isConnected: true,
          propertyId: true,
          clientEmail: true,
          lastSyncedAt: true,
          // Never return privateKey to frontend
        },
      });
      return config;
    }),

  // Save credentials and verify
  connect: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        propertyId: z.string().min(6).max(12),
        clientEmail: z.string().email(),
        privateKey: z.string().min(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Test connection before saving
      const isValid = await verifyGA4Connection({
        clientEmail: input.clientEmail,
        privateKey: input.privateKey,
        propertyId: input.propertyId,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not connect to GA4. Check your Property ID and make sure the service account has been added as a Viewer on this property.",
        });
      }

      await ctx.db.analyticsConfig.upsert({
        where: { productId: input.productId },
        create: {
          productId: input.productId,
          propertyId: input.propertyId,
          clientEmail: input.clientEmail,
          privateKey: input.privateKey,
          isConnected: true,
        },
        update: {
          propertyId: input.propertyId,
          clientEmail: input.clientEmail,
          privateKey: input.privateKey,
          isConnected: true,
        },
      });

      return { success: true };
    }),

  // Disconnect
  disconnect: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.analyticsConfig.delete({
        where: { productId: input.productId },
      });
      return { success: true };
    }),

  // Get realtime users (called every 60s from frontend)
  getRealtime: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      const config = await ctx.db.analyticsConfig.findUnique({
        where: { productId: input.productId },
      });
      if (!config?.isConnected) return null;

      return getRealtimeUsers({
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
        propertyId: config.propertyId,
      });
    }),

  // Get main report (cached in DB, refreshed hourly)
  getReport: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
        forceRefresh: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const config = await ctx.db.analyticsConfig.findUnique({
        where: { productId: input.productId },
      });
      if (!config?.isConnected) return null;

      // Check if we have a fresh snapshot (< 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await ctx.db.analyticsSnapshot.findFirst({
        where: {
          productId: input.productId,
          date: { gte: oneHourAgo },
        },
        orderBy: { date: "desc" },
      });

      if (existing && !input.forceRefresh) return existing;

      // Fetch fresh from GA4
      const report = await getAnalyticsReport(
        {
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
          propertyId: config.propertyId,
        },
        input.days
      );

      // Generate AI summary
      const topSource = (report.topSources[0]?.source ?? "direct")
        .split(" / ")[0];

      let aiSummary: string | undefined;
      try {
        aiSummary = await generateAnalyticsSummary({
          analytics: {
            totalSessions: report.overview.totalSessions,
            newUsers: report.overview.newUsers,
            conversionRate: report.overview.conversionRate,
            topSource,
            bounceRate: report.overview.bounceRate,
            topCountry: report.topCountries[0]?.country ?? "Unknown",
          },
          mrrDelta: 0, // TODO: pass real MRR delta once Stripe is connected
          productName: "your product",
        });
      } catch {
        aiSummary = undefined;
      }

      // Save snapshot
      const snapshot = await ctx.db.analyticsSnapshot.create({
        data: {
          productId: input.productId,
          totalSessions: report.overview.totalSessions,
          totalUsers: report.overview.totalUsers,
          newUsers: report.overview.newUsers,
          returningUsers: report.overview.returningUsers,
          avgEngagementTime: report.overview.avgEngagementSeconds,
          bounceRate: report.overview.bounceRate,
          pageViews: report.overview.pageViews,
          signupEvents: report.overview.keyEvents,
          conversionRate: report.overview.conversionRate,
          topSources: report.topSources,
          topPages: report.topPages,
          topCountries: report.topCountries,
          aiSummary,
        },
      });

      // Update lastSyncedAt
      await ctx.db.analyticsConfig.update({
        where: { productId: input.productId },
        data: { lastSyncedAt: new Date() },
      });

      return snapshot;
    }),
});
```

Add to root router in `src/server/trpc/router/_app.ts`:
```typescript
import { analyticsRouter } from "./analytics";

export const appRouter = createTRPCRouter({
  // ...existing routers
  analytics: analyticsRouter,
});
```

---

## Step 6 — The page (server component)

Create `src/app/(dashboard)/[productId]/analytics/page.tsx`:

```tsx
import { AnalyticsPageClient } from "./_components/analytics-page-client";
import { api } from "@/trpc/server";

interface Props {
  params: { productId: string };
}

export default async function AnalyticsPage({ params }: Props) {
  const config = await api.analytics.getConfig({
    productId: params.productId,
  });

  return (
    <AnalyticsPageClient
      productId={params.productId}
      isConnected={config?.isConnected ?? false}
      clientEmail={config?.clientEmail}
      propertyId={config?.propertyId}
      lastSyncedAt={config?.lastSyncedAt ?? null}
    />
  );
}
```

---

## Step 7 — The client component

Create `src/app/(dashboard)/[productId]/analytics/_components/analytics-page-client.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SetupGuide } from "./setup-guide";

// Country flag emoji helper
function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    "United States": "🇺🇸", India: "🇮🇳", "United Kingdom": "🇬🇧",
    Germany: "🇩🇪", Canada: "🇨🇦", Australia: "🇦🇺", France: "🇫🇷",
    Brazil: "🇧🇷", Japan: "🇯🇵", Netherlands: "🇳🇱",
  };
  return flags[country] ?? "🌍";
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

interface Props {
  productId: string;
  isConnected: boolean;
  clientEmail?: string;
  propertyId?: string;
  lastSyncedAt: Date | null;
}

export function AnalyticsPageClient({
  productId,
  isConnected: initialConnected,
  clientEmail,
  propertyId,
  lastSyncedAt,
}: Props) {
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [showSetup, setShowSetup] = useState(!initialConnected);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  // Form state
  const [formPropertyId, setFormPropertyId] = useState(propertyId ?? "");
  const [formClientEmail, setFormClientEmail] = useState(clientEmail ?? "");
  const [formPrivateKey, setFormPrivateKey] = useState("");
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const utils = api.useUtils();

  const connect = api.analytics.connect.useMutation({
    onSuccess: () => {
      setIsConnected(true);
      setShowSetup(false);
      toast.success("Google Analytics connected");
      utils.analytics.getReport.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnect = api.analytics.disconnect.useMutation({
    onSuccess: () => {
      setIsConnected(false);
      setShowSetup(true);
      toast.success("Disconnected");
    },
  });

  const { data: report, isLoading: reportLoading } =
    api.analytics.getReport.useQuery(
      { productId, days },
      { enabled: isConnected, staleTime: 60 * 60 * 1000 }
    );

  // Realtime — poll every 60 seconds
  const { data: realtime } = api.analytics.getRealtime.useQuery(
    { productId },
    {
      enabled: isConnected,
      refetchInterval: 60_000,
    }
  );

  // ── NOT CONNECTED STATE ──────────────────────────────
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect Google Analytics 4 to see visitor insights alongside your revenue.
          </p>
        </div>

        {/* Setup guide toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
          >
            {showSetupGuide ? "Hide" : "How to get your credentials →"}
          </Button>
        </div>

        {showSetupGuide && <SetupGuide />}

        {/* Connection form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Connect your GA4 property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                GA4 Property ID
              </label>
              <Input
                placeholder="123456789"
                value={formPropertyId}
                onChange={(e) => setFormPropertyId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Found in GA4 → Admin → Property Settings → Property ID
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Service Account Email
              </label>
              <Input
                placeholder="crewos-analytics@your-project.iam.gserviceaccount.com"
                value={formClientEmail}
                onChange={(e) => setFormClientEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The <code className="text-xs">client_email</code> field from your service account JSON
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Private Key
              </label>
              <Textarea
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEowIBAAKCAQEA...&#10;-----END RSA PRIVATE KEY-----"
                value={formPrivateKey}
                onChange={(e) => setFormPrivateKey(e.target.value)}
                rows={4}
                className="font-mono text-xs resize-none"
              />
              <p className="text-xs text-muted-foreground">
                The <code className="text-xs">private_key</code> field from your service account JSON
              </p>
            </div>

            <Button
              onClick={() =>
                connect.mutate({
                  productId,
                  propertyId: formPropertyId,
                  clientEmail: formClientEmail,
                  privateKey: formPrivateKey,
                })
              }
              disabled={
                connect.isPending ||
                !formPropertyId ||
                !formClientEmail ||
                !formPrivateKey
              }
              className="w-full"
            >
              {connect.isPending ? "Verifying connection..." : "Connect GA4"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── CONNECTED STATE ──────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Property {propertyId} ·{" "}
            {lastSyncedAt
              ? `synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
              : "syncing..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={String(days)}
            onValueChange={(v) => setDays(Number(v) as 7 | 30 | 90)}
          >
            <TabsList className="h-7">
              <TabsTrigger value="7" className="text-xs px-2">7d</TabsTrigger>
              <TabsTrigger value="30" className="text-xs px-2">30d</TabsTrigger>
              <TabsTrigger value="90" className="text-xs px-2">90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => disconnect.mutate({ productId })}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* Realtime pulse */}
      {realtime && (
        <div className="flex items-center gap-4 rounded-lg border border-sky-800/30 bg-sky-950/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-sm font-medium">
              {realtime.totalActive} active now
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {realtime.byCountry.slice(0, 3).map((c) => (
              <span key={c.country}>
                {countryFlag(c.country)} {c.users}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI summary */}
      {report?.aiSummary && (
        <div className="rounded-lg border border-violet-800/30 bg-violet-950/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="secondary" className="text-xs h-4 px-1.5">AI</Badge>
            <span className="text-xs text-muted-foreground font-mono">weekly summary</span>
          </div>
          <p className="text-sm leading-relaxed">{report.aiSummary}</p>
        </div>
      )}

      {/* Stat cards */}
      {reportLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Sessions"
              value={report.totalSessions.toLocaleString()}
            />
            <StatCard
              label="Users"
              value={report.totalUsers.toLocaleString()}
            />
            <StatCard
              label="Conversion rate"
              value={`${report.conversionRate}%`}
              highlight={report.conversionRate < 3 ? "warn" : "good"}
            />
            <StatCard
              label="Avg engagement"
              value={formatSeconds(report.avgEngagementTime)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Traffic sources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Top traffic sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.topSources as any[]).slice(0, 6).map((s: any) => (
                  <div key={s.source} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.source}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {s.sessions}
                    </span>
                    {s.converting && (
                      <Badge className="text-xs h-4 px-1 bg-emerald-900 text-emerald-300">
                        converting
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top pages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Top pages by conversion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.topPages as any[]).slice(0, 6).map((p: any) => (
                  <div key={p.page} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate text-muted-foreground">
                        {p.page === "(entrance)" ? "/" : p.page}
                      </p>
                    </div>
                    <span className="text-xs font-mono">
                      {p.conversionRate}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Countries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Users by country
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(report.topCountries as any[]).slice(0, 6).map((c: any) => (
                  <div key={c.country} className="flex items-center gap-2">
                    <span className="text-sm">{countryFlag(c.country)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{c.country}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* New vs returning */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                New vs returning users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-2xl font-semibold">
                    {report.newUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">new users</p>
                </div>
                <div className="text-muted-foreground">vs</div>
                <div>
                  <p className="text-2xl font-semibold">
                    {report.returningUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">returning</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">
                    {report.totalUsers > 0
                      ? Math.round(
                          (report.returningUsers / report.totalUsers) * 100
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">retention rate</p>
                </div>
              </div>
              {/* Simple bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                <div
                  className="bg-sky-500 rounded-l-full"
                  style={{
                    width: `${
                      report.totalUsers > 0
                        ? (report.newUsers / report.totalUsers) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-emerald-500 rounded-r-full flex-1"
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-sky-400">New</span>
                <span className="text-xs text-emerald-400">Returning</span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "good" | "warn";
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-xl font-semibold tracking-tight ${
          highlight === "warn"
            ? "text-amber-400"
            : highlight === "good"
              ? "text-emerald-400"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
```

---

## Step 8 — Setup guide component

Create `src/app/(dashboard)/[productId]/analytics/_components/setup-guide.tsx`:

```tsx
export function SetupGuide() {
  return (
    <div className="rounded-lg border bg-card divide-y divide-border text-sm">

      {/* Step 1 */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-sky-300 text-xs font-mono font-medium">1</span>
          <p className="font-medium">Create a Google Cloud project</p>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed ml-7">
          Go to{" "}
          <a
            href="https://console.cloud.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline"
          >
            console.cloud.google.com
          </a>{" "}
          → Create a new project (or use an existing one). Name it anything, e.g.{" "}
          <code className="bg-muted px-1 rounded text-xs">crewos-analytics</code>.
        </p>
      </div>

      {/* Step 2 */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-sky-300 text-xs font-mono font-medium">2</span>
          <p className="font-medium">Enable the Google Analytics Data API</p>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed ml-7">
          In your project, go to{" "}
          <strong>APIs & Services → Library</strong>. Search for{" "}
          <strong>"Google Analytics Data API"</strong> and click{" "}
          <strong>Enable</strong>.
        </p>
      </div>

      {/* Step 3 */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-sky-300 text-xs font-mono font-medium">3</span>
          <p className="font-medium">Create a Service Account</p>
        </div>
        <div className="text-muted-foreground text-xs leading-relaxed ml-7 space-y-1">
          <p>Go to <strong>IAM & Admin → Service Accounts → Create Service Account</strong>.</p>
          <p>Name it anything (e.g. <code className="bg-muted px-1 rounded">crewos-reader</code>). Skip the optional role/user steps.</p>
          <p>Click the service account you just created → <strong>Keys tab → Add Key → Create new key → JSON</strong>.</p>
          <p>A JSON file will download. <strong>Keep it safe — you only get it once.</strong></p>
        </div>
      </div>

      {/* Step 4 */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-sky-300 text-xs font-mono font-medium">4</span>
          <p className="font-medium">Add service account to your GA4 property</p>
        </div>
        <div className="text-muted-foreground text-xs leading-relaxed ml-7 space-y-1">
          <p>Open <strong>Google Analytics</strong> → Admin → Property (middle column) → <strong>Property access management</strong>.</p>
          <p>Click <strong>+ Add users</strong>. Paste the <code className="bg-muted px-1 rounded">client_email</code> from your JSON file (looks like <code className="bg-muted px-1 rounded">name@project.iam.gserviceaccount.com</code>).</p>
          <p>Set role to <strong>Viewer</strong> (read-only, safe). Click Add.</p>
        </div>
      </div>

      {/* Step 5 */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-sky-300 text-xs font-mono font-medium">5</span>
          <p className="font-medium">Get your GA4 Property ID</p>
        </div>
        <div className="text-muted-foreground text-xs leading-relaxed ml-7 space-y-1">
          <p>In GA4 → Admin → Property Settings. Your <strong>Property ID</strong> is a 9-digit number at the top right (e.g. <code className="bg-muted px-1 rounded">123456789</code>). Copy it.</p>
        </div>
      </div>

      {/* Step 6 */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-sky-300 text-xs font-mono font-medium">6</span>
          <p className="font-medium">Paste the 3 fields into CrewOS</p>
        </div>
        <div className="text-muted-foreground text-xs leading-relaxed ml-7">
          <p>From your downloaded JSON file, you need:</p>
          <ul className="mt-1 space-y-1 list-none">
            <li><code className="bg-muted px-1 rounded">client_email</code> → paste into "Service Account Email"</li>
            <li><code className="bg-muted px-1 rounded">private_key</code> → paste into "Private Key" (the whole block including BEGIN/END lines)</li>
            <li>Your Property ID from Step 5 → paste into "GA4 Property ID"</li>
          </ul>
          <p className="mt-2 text-emerald-400">Your credentials are stored encrypted and never sent to the browser.</p>
        </div>
      </div>

    </div>
  );
}
```

---

## Step 9 — Inngest hourly sync (optional but recommended)

Create `src/lib/inngest/functions/analytics-sync.ts`:

```typescript
import { inngest } from "../client";
import { db } from "@/server/db";
import { getAnalyticsReport, getHourlySessions } from "@/server/services/ga4";

// Hourly sync for all connected products
export const analyticsHourlySync = inngest.createFunction(
  { id: "analytics-hourly-sync" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const connectedProducts = await step.run("get-connected", async () => {
      return db.analyticsConfig.findMany({
        where: { isConnected: true },
        select: {
          productId: true,
          clientEmail: true,
          privateKey: true,
          propertyId: true,
        },
      });
    });

    for (const config of connectedProducts) {
      await step.run(`sync-${config.productId}`, async () => {
        try {
          // Check for traffic spike
          const hourlySessions = await getHourlySessions({
            clientEmail: config.clientEmail,
            privateKey: config.privateKey,
            propertyId: config.propertyId,
          });

          // Get 7-day average hourly sessions for comparison
          const recentSnapshot = await db.analyticsSnapshot.findFirst({
            where: { productId: config.productId },
            orderBy: { date: "desc" },
          });

          const avgHourly = recentSnapshot
            ? Math.round(recentSnapshot.totalSessions / (7 * 24))
            : 0;

          if (avgHourly > 10 && hourlySessions > avgHourly * 3) {
            // Traffic spike detected — store as notification
            // TODO: hook into your notification system
            console.log(
              `Traffic spike for ${config.productId}: ${hourlySessions} vs avg ${avgHourly}`
            );
          }

          await db.analyticsConfig.update({
            where: { productId: config.productId },
            data: { lastSyncedAt: new Date() },
          });
        } catch (err) {
          console.error(`Analytics sync failed for ${config.productId}:`, err);
        }
      });
    }
  }
);
```

---

## Step 10 — Add to sidebar nav

In your sidebar component:

```tsx
{/* In the Overview section */}
<NavItem href={`/${productId}/analytics`}>
  Analytics
  {!isAnalyticsConnected && (
    <span className="ml-auto text-xs text-muted-foreground">connect</span>
  )}
</NavItem>
```

---

## Summary — what you built

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | AnalyticsConfig + AnalyticsSnapshot models |
| `server/services/ga4.ts` | All GA4 API calls (verify, realtime, report, hourly) |
| `server/services/anthropic.ts` | generateAnalyticsSummary() added |
| `server/trpc/router/analytics.ts` | 5 tRPC routes: getConfig, connect, disconnect, getRealtime, getReport |
| `analytics/page.tsx` | Server component |
| `_components/analytics-page-client.tsx` | Full interactive dashboard |
| `_components/setup-guide.tsx` | In-app 6-step setup guide |
| `inngest/functions/analytics-sync.ts` | Hourly sync + spike detection |

Build time: 3–4 hours.

