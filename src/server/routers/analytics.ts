import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import type { Context } from "../trpc";
import { protectedProcedure, router } from "../trpc";
import { generateAnalyticsSummary } from "@/lib/anthropic";
import { getDb } from "@/server/db";
import {
  getAnalyticsReport,
  getRealtimeUsers,
  type AnalyticsCountry,
  type AnalyticsPage,
  type AnalyticsSource,
  verifyGA4Connection,
} from "@/server/services/ga4";
import { decryptSecret, encryptSecret } from "@/server/services/analytics-crypto";

type AnalyticsReportPayload = {
  id: string;
  date: Date;
  totalSessions: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  avgEngagementTime: number;
  bounceRate: number;
  pageViews: number;
  signupEvents: number;
  conversionRate: number;
  topSources: AnalyticsSource[];
  topPages: AnalyticsPage[];
  topCountries: AnalyticsCountry[];
  aiSummary: string | null;
};

function makeLivePayload(
  report: Awaited<ReturnType<typeof getAnalyticsReport>>,
  days: 7 | 30 | 90,
  aiSummary: string | null,
): AnalyticsReportPayload {
  return {
    id: `live-${days}-${Date.now()}`,
    date: new Date(),
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
  };
}

type ProtectedCtx = Context & { user: { id: string } };

async function assertProductAccess(
  ctx: ProtectedCtx,
  productId: string,
  ownerOnly = false,
) {
  const membership = await ctx.db.productMember.findFirst({
    where: { productId, userId: ctx.user.id },
    select: { role: true },
  });

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this product." });
  }
  if (ownerOnly && membership.role !== "OWNER") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can change analytics settings." });
  }
}

function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapSnapshotToPayload(snapshot: {
  id: string;
  date: Date;
  totalSessions: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  avgEngagementTime: number;
  bounceRate: number;
  pageViews: number;
  signupEvents: number;
  conversionRate: number;
  topSources: unknown;
  topPages: unknown;
  topCountries: unknown;
  aiSummary: string | null;
}): AnalyticsReportPayload {
  return {
    id: snapshot.id,
    date: snapshot.date,
    totalSessions: snapshot.totalSessions,
    totalUsers: snapshot.totalUsers,
    newUsers: snapshot.newUsers,
    returningUsers: snapshot.returningUsers,
    avgEngagementTime: snapshot.avgEngagementTime,
    bounceRate: snapshot.bounceRate,
    pageViews: snapshot.pageViews,
    signupEvents: snapshot.signupEvents,
    conversionRate: snapshot.conversionRate,
    topSources: parseArray<AnalyticsSource>(snapshot.topSources),
    topPages: parseArray<AnalyticsPage>(snapshot.topPages),
    topCountries: parseArray<AnalyticsCountry>(snapshot.topCountries),
    aiSummary: snapshot.aiSummary,
  };
}

export const analyticsRouter = router({
  getConfig: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      await assertProductAccess(ctx, input.productId);

      return db.analyticsConfig.findUnique({
        where: { productId: input.productId },
        select: {
          id: true,
          isConnected: true,
          propertyId: true,
          clientEmail: true,
          lastSyncedAt: true,
        },
      });
    }),

  connect: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        propertyId: z.string().min(6).max(20),
        clientEmail: z.string().email(),
        privateKey: z.string().min(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await assertProductAccess(ctx, input.productId, true);

      const propertyId = input.propertyId.replace(/\D/g, "");
      if (propertyId.length < 6 || propertyId.length > 12) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid GA4 property ID. Please use your numeric property ID.",
        });
      }

      const isValid = await verifyGA4Connection({
        clientEmail: input.clientEmail,
        privateKey: input.privateKey,
        propertyId,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not connect to GA4. Check Property ID and ensure your service account has Viewer access in GA4.",
        });
      }

      let encryptedPrivateKey: string;
      try {
        encryptedPrivateKey = encryptSecret(input.privateKey);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Analytics encryption key is not configured on the server.",
        });
      }

      await db.analyticsConfig.upsert({
        where: { productId: input.productId },
        create: {
          productId: input.productId,
          propertyId,
          clientEmail: input.clientEmail,
          privateKey: encryptedPrivateKey,
          isConnected: true,
        },
        update: {
          propertyId,
          clientEmail: input.clientEmail,
          privateKey: encryptedPrivateKey,
          isConnected: true,
        },
      });

      return { success: true };
    }),

  disconnect: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await assertProductAccess(ctx, input.productId, true);

      await db.analyticsConfig.deleteMany({
        where: { productId: input.productId },
      });

      return { success: true };
    }),

  getRealtime: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      await assertProductAccess(ctx, input.productId);

      const config = await db.analyticsConfig.findUnique({
        where: { productId: input.productId },
      });

      if (!config?.isConnected) return null;

      return getRealtimeUsers({
        clientEmail: config.clientEmail,
        privateKey: decryptSecret(config.privateKey),
        propertyId: config.propertyId,
      });
    }),

  getReport: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
        forceRefresh: z.boolean().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      await assertProductAccess(ctx, input.productId);

      const config = await db.analyticsConfig.findUnique({
        where: { productId: input.productId },
      });
      if (!config?.isConnected) return null;

      const canUseCache = input.days === 30 && !input.forceRefresh;
      if (canUseCache) {
        try {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const existing = await db.analyticsSnapshot.findFirst({
            where: {
              productId: input.productId,
              date: { gte: oneHourAgo },
            },
            orderBy: { date: "desc" },
          });

          if (existing) {
            return mapSnapshotToPayload(existing);
          }
        } catch {
          // If analytics snapshot table is missing/misaligned, fetch live GA4 data below.
        }
      }

      const report = await getAnalyticsReport(
        {
          clientEmail: config.clientEmail,
          privateKey: decryptSecret(config.privateKey),
          propertyId: config.propertyId,
        },
        input.days,
      );

      const product = await db.product.findUnique({
        where: { id: input.productId },
        select: { name: true },
      });

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklySnapshots = await db.revenueSnapshot.findMany({
        where: { productId: input.productId, date: { gte: weekAgo } },
        orderBy: { date: "asc" },
        select: { mrr: true },
      });
      const mrrDelta =
        weeklySnapshots.length >= 2
          ? weeklySnapshots[weeklySnapshots.length - 1].mrr - weeklySnapshots[0].mrr
          : 0;

      const topSource = (report.topSources[0]?.source ?? "direct").split(" / ")[0];
      let aiSummary: string | null = null;
      try {
        aiSummary = await generateAnalyticsSummary({
          analytics: {
            totalSessions: report.overview.totalSessions,
            newUsers: report.overview.newUsers,
            conversionRate: report.overview.conversionRate,
            topSource,
            bounceRate: report.overview.bounceRate,
            topCountry: report.topCountries[0]?.country ?? "Unknown",
            topCountryPercentage: report.topCountries[0]?.percentage ?? 0,
          },
          mrrDelta,
          productName: product?.name ?? "your product",
        });
      } catch {
        aiSummary = null;
      }

      try {
        await db.analyticsConfig.update({
          where: { productId: input.productId },
          data: { lastSyncedAt: new Date() },
        });
      } catch {
        // Continue even if DB metadata update fails.
      }

      if (input.days === 30) {
        try {
          const snapshot = await db.analyticsSnapshot.create({
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
              topSources: report.topSources as unknown as Prisma.InputJsonValue,
              topPages: report.topPages as unknown as Prisma.InputJsonValue,
              topCountries: report.topCountries as unknown as Prisma.InputJsonValue,
              aiSummary,
            },
          });
          return mapSnapshotToPayload(snapshot);
        } catch {
          // Fallback to live payload if snapshot persistence fails.
          return makeLivePayload(report, input.days, aiSummary);
        }
      }

      return makeLivePayload(report, input.days, aiSummary);
    }),
});
