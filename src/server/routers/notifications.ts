import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

async function assertAccess(ctx: any, productId: string) {
  const member = await ctx.db.productMember.findFirst({
    where: { productId, userId: ctx.user.id },
    select: { id: true },
  });
  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No access to this product." });
  }
}

export const notificationsRouter = router({
  getPreferences: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx, input.productId);
      const pref = await ctx.db.notificationPreference.findUnique({
        where: { productId: input.productId },
      });
      if (pref) return pref;

      return ctx.db.notificationPreference.create({
        data: { productId: input.productId },
      });
    }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        paymentFailedEnabled: z.boolean(),
        healthScoreEnabled: z.boolean(),
        healthScoreThreshold: z.number().int().min(1).max(100),
        trafficSpikeEnabled: z.boolean(),
        issueOverdueEnabled: z.boolean(),
        weeklyDigestEnabled: z.boolean(),
        weeklyDigestDay: z.number().int().min(0).max(6),
        weeklyDigestTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx, input.productId);
      const { productId, ...data } = input;
      return ctx.db.notificationPreference.upsert({
        where: { productId },
        create: { productId, ...data },
        update: data,
      });
    }),

  listEvents: protectedProcedure
    .input(z.object({ productId: z.string(), limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx, input.productId);
      return ctx.db.notificationEvent.findMany({
        where: { productId: input.productId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  getUnreadCount: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertAccess(ctx, input.productId);
      const count = await ctx.db.notificationEvent.count({
        where: { productId: input.productId, isRead: false },
      });
      return { count };
    }),

  markAllRead: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertAccess(ctx, input.productId);
      await ctx.db.notificationEvent.updateMany({
        where: { productId: input.productId, isRead: false },
        data: { isRead: true },
      });
      return { success: true };
    }),
});
