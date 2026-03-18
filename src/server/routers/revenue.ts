import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { syncRevenue } from "../lib/revenue-sync";
import { monthlyWindow } from "@/server/services/dunning";
import { assertProductAccess, assertProductRole } from "@/server/lib/access";
import { router, protectedProcedure } from "../trpc";

function stripSensitiveIntegration(config: any) {
  if (!config) return config;
  return {
    ...config,
    stripeApiKey: null,
    dodoApiKey: null,
    stripeWebhookSecret: null,
    dodoWebhookSecret: null,
    dunningFromEmail: null,
    dunningSenderName: null,
    dunningReplyTo: null,
    dunningEmail1Subject: null,
    dunningEmail1Body: null,
    dunningEmail2Subject: null,
    dunningEmail2Body: null,
    dunningEmail3Subject: null,
    dunningEmail3Body: null,
  };
}

export const revenueRouter = router({
  listSnapshots: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);

      const where: any = { productId: input.productId };
      if (input.from || input.to) {
        where.date = {};
        if (input.from) where.date.gte = new Date(input.from);
        if (input.to) where.date.lte = new Date(input.to);
      }
      return ctx.db.revenueSnapshot.findMany({ where, orderBy: { date: "asc" } });
    }),

  getIntegration: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await assertProductAccess(ctx, input.productId);
      const integration = await ctx.db.integrationConfig.findUnique({ where: { productId: input.productId } });

      if (!integration) return null;
      if (membership.role === "VIEWER") {
        return stripSensitiveIntegration(integration);
      }
      return integration;
    }),

  updateIntegration: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        provider: z.enum(["STRIPE", "DODO_PAYMENTS"]),
        stripeApiKey: z.string().optional(),
        dodoApiKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);
      const { productId, ...data } = input;
      return ctx.db.integrationConfig.upsert({
        where: { productId },
        update: data,
        create: { productId, ...data },
      });
    }),

  getDunningSummary: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await assertProductAccess(ctx, input.productId);
      const isAdmin = membership.role === "OWNER" || membership.role === "EDITOR";

      const integration = await ctx.db.integrationConfig.findUnique({
        where: { productId: input.productId },
        select: {
          provider: true,
          dunningEnabled: true,
          dunningFromEmail: true,
          dunningSenderName: true,
          dunningReplyTo: true,
          stripeWebhookSecret: true,
          dodoWebhookSecret: true,
          dunningEmail1Subject: true,
          dunningEmail1Body: true,
          dunningEmail2Subject: true,
          dunningEmail2Body: true,
          dunningEmail3Subject: true,
          dunningEmail3Body: true,
        },
      });

      const monthStart = monthlyWindow();
      const recovered = await ctx.db.dunningAttempt.aggregate({
        where: {
          productId: input.productId,
          status: "RECOVERED",
          recoveredAt: { gte: monthStart },
        },
        _sum: { amountCents: true },
        _count: { _all: true },
      });

      const atRisk = await ctx.db.dunningAttempt.count({
        where: {
          productId: input.productId,
          status: "FAILED",
        },
      });

      const recentAttempts = await ctx.db.dunningAttempt.findMany({
        where: { productId: input.productId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          customerEmail: true,
          amountCents: true,
          currency: true,
          emailsSent: true,
          status: true,
          updatedAt: true,
        },
      });

      return {
        integration: isAdmin ? integration : stripSensitiveIntegration(integration),
        recoveredThisMonthCents: recovered._sum.amountCents ?? 0,
        recoveredInvoicesThisMonth: recovered._count._all,
        atRiskInvoices: atRisk,
        recentAttempts,
      };
    }),

  listWebhookEvents: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        provider: z.enum(["STRIPE", "DODO_PAYMENTS"]).optional(),
        limit: z.number().int().min(1).max(20).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);
      return ctx.db.webhookEvent.findMany({
        where: {
          productId: input.productId,
          provider: input.provider,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  updateDunningConfig: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        dunningEnabled: z.boolean(),
        dunningFromEmail: z.string().email().optional().or(z.literal("")),
        dunningSenderName: z.string().max(80).optional().or(z.literal("")),
        dunningReplyTo: z.string().email().optional().or(z.literal("")),
        stripeWebhookSecret: z.string().max(200).optional().or(z.literal("")),
        dodoWebhookSecret: z.string().max(200).optional().or(z.literal("")),
        dunningEmail1Subject: z.string().max(160).optional().or(z.literal("")),
        dunningEmail1Body: z.string().max(4000).optional().or(z.literal("")),
        dunningEmail2Subject: z.string().max(160).optional().or(z.literal("")),
        dunningEmail2Body: z.string().max(4000).optional().or(z.literal("")),
        dunningEmail3Subject: z.string().max(160).optional().or(z.literal("")),
        dunningEmail3Body: z.string().max(4000).optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);

      const {
        productId,
        dunningEnabled,
        dunningFromEmail,
        dunningSenderName,
        dunningReplyTo,
        stripeWebhookSecret,
        dodoWebhookSecret,
        dunningEmail1Subject,
        dunningEmail1Body,
        dunningEmail2Subject,
        dunningEmail2Body,
        dunningEmail3Subject,
        dunningEmail3Body,
      } = input;

      if (dunningEnabled && !dunningFromEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "From email is required when dunning is enabled.",
        });
      }

      return ctx.db.integrationConfig.upsert({
        where: { productId },
        create: {
          productId,
          provider: "STRIPE",
          dunningEnabled,
          dunningFromEmail: dunningFromEmail || null,
          dunningSenderName: dunningSenderName || null,
          dunningReplyTo: dunningReplyTo || null,
          stripeWebhookSecret: stripeWebhookSecret || null,
          dodoWebhookSecret: dodoWebhookSecret || null,
          dunningEmail1Subject: dunningEmail1Subject || null,
          dunningEmail1Body: dunningEmail1Body || null,
          dunningEmail2Subject: dunningEmail2Subject || null,
          dunningEmail2Body: dunningEmail2Body || null,
          dunningEmail3Subject: dunningEmail3Subject || null,
          dunningEmail3Body: dunningEmail3Body || null,
        },
        update: {
          dunningEnabled,
          dunningFromEmail: dunningFromEmail || null,
          dunningSenderName: dunningSenderName || null,
          dunningReplyTo: dunningReplyTo || null,
          stripeWebhookSecret: stripeWebhookSecret || null,
          dodoWebhookSecret: dodoWebhookSecret || null,
          dunningEmail1Subject: dunningEmail1Subject || null,
          dunningEmail1Body: dunningEmail1Body || null,
          dunningEmail2Subject: dunningEmail2Subject || null,
          dunningEmail2Body: dunningEmail2Body || null,
          dunningEmail3Subject: dunningEmail3Subject || null,
          dunningEmail3Body: dunningEmail3Body || null,
        },
      });
    }),

  syncNow: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);
      const result = await syncRevenue(input.productId);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (result as any).message || "Sync failed",
        });
      }
      return (result as any).data;
    }),
});
