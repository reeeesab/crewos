import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { assertProductAccess, assertProductRole } from "@/server/lib/access";
import { router, protectedProcedure } from "@/server/trpc";

export const costRouter = router({
  list: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      return ctx.db.cost.findMany({
        where: { productId: input.productId },
        include: { issue: true },
        orderBy: { amount: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(1),
        category: z.enum(["LLM", "CLOUD", "PAYMENTS", "EMAIL", "TOOLING", "OTHER"]),
        amount: z.number().positive(),
        budget: z.number().optional(),
        billingCycle: z.enum(["monthly", "annual", "usage"]).default("monthly"),
        vendor: z.string().optional(),
        issueId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);
      return ctx.db.cost.create({
        data: {
          productId: input.productId,
          name: input.name,
          category: input.category,
          amount: input.amount,
          budget: input.budget,
          billingCycle: input.billingCycle,
          vendor: input.vendor,
          issueId: input.issueId,
          month: new Date().toISOString().slice(0, 7),
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().optional(),
        budget: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.cost.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Cost entry not found." });
      await assertProductRole(ctx, target.productId, ["OWNER", "EDITOR"]);

      const { id, ...data } = input;
      return ctx.db.cost.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.cost.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Cost entry not found." });
      await assertProductRole(ctx, target.productId, ["OWNER", "EDITOR"]);

      return ctx.db.cost.delete({ where: { id: input.id } });
    }),
});
