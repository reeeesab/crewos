import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { syncRevenue } from "../lib/revenue-sync";
import { TRPCError } from "@trpc/server";

export const revenueRouter = router({
  listSnapshots: protectedProcedure
    .input(z.object({
      productId: z.string(),
      from: z.string().optional(), // ISO date
      to: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
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
      return ctx.db.integrationConfig.findUnique({ where: { productId: input.productId } });
    }),

  updateIntegration: protectedProcedure
    .input(z.object({
      productId: z.string(),
      provider: z.enum(["STRIPE", "DODO_PAYMENTS"]),
      stripeApiKey: z.string().optional(),
      dodoApiKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { productId, ...data } = input;
      return ctx.db.integrationConfig.upsert({
        where: { productId },
        update: data,
        create: { productId, ...data },
      });
    }),

  syncNow: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await syncRevenue(input.productId);
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: (result as any).message || "Sync failed" });
      }
      return (result as any).data;
    }),
});
