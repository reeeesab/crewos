import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { generateHealthRecommendations } from "@/lib/anthropic";
import { protectedProcedure, router } from "@/server/trpc";

function computeHealthScores({
  mrr,
  churnRate,
  openBugs,
  totalIssues,
  closedIssues,
  totalCosts,
  snapshots,
}: {
  mrr: number;
  churnRate: number;
  openBugs: number;
  totalIssues: number;
  closedIssues: number;
  totalCosts: number;
  snapshots: { mrr: number }[];
}) {
  let revenueScore = 0;
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    const growthPct = prev.mrr > 0 ? ((latest.mrr - prev.mrr) / prev.mrr) * 100 : 0;
    if (growthPct > 10) revenueScore += 20;
    else if (growthPct > 5) revenueScore += 15;
    else if (growthPct > 0) revenueScore += 10;
  } else if (mrr > 0) {
    revenueScore += 10;
  }

  if (churnRate <= 2) revenueScore += 20;
  else if (churnRate <= 5) revenueScore += 15;
  else if (churnRate <= 10) revenueScore += 10;

  let productScore = 0;
  if (openBugs === 0) productScore += 15;
  else if (openBugs <= 3) productScore += 10;
  else if (openBugs <= 5) productScore += 5;

  const closedPct = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0;
  if (closedPct > 70) productScore += 15;
  else if (closedPct > 40) productScore += 10;
  else productScore += 5;

  let financialScore = 0;
  const netMargin = mrr - totalCosts;
  const marginPct = mrr > 0 ? (netMargin / mrr) * 100 : 0;
  if (marginPct > 60) financialScore += 15;
  else if (marginPct > 30) financialScore += 10;
  else if (marginPct > 0) financialScore += 5;

  if (totalCosts < mrr * 0.3) financialScore += 15;
  else if (totalCosts < mrr * 0.6) financialScore += 10;
  else financialScore += 5;

  return {
    revenueScore,
    productScore,
    financialScore,
    totalScore: Math.min(100, revenueScore + productScore + financialScore),
    marginPct,
    closedPct,
    growthPct:
      snapshots.length >= 2 && snapshots[snapshots.length - 2]?.mrr > 0
        ? ((snapshots[snapshots.length - 1].mrr - snapshots[snapshots.length - 2].mrr) /
            snapshots[snapshots.length - 2].mrr) *
          100
        : null,
    costRatioPct: mrr > 0 ? (totalCosts / mrr) * 100 : null,
  };
}

async function assertProductAccess(userId: string, productId: string, db: PrismaClient) {
  const member = await db.productMember.findFirst({
    where: { productId, userId },
    select: { id: true },
  });
  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this product." });
  }
}

export const healthRouter = router({
  recalculate: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductAccess(ctx.user.id, input.productId, ctx.db);

      const [product, costs, snapshots] = await Promise.all([
        ctx.db.product.findUnique({
          where: { id: input.productId },
          select: {
            mrr: true,
            churnRate: true,
            issues: {
              select: { type: true, status: true },
            },
          },
        }),
        ctx.db.cost.findMany({
          where: { productId: input.productId },
          select: { amount: true },
        }),
        ctx.db.revenueSnapshot.findMany({
          where: { productId: input.productId },
          orderBy: { date: "asc" },
          select: { mrr: true },
        }),
      ]);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      }

      const openBugs = product.issues.filter((issue) => issue.type === "BUG" && issue.status !== "CLOSED").length;
      const closedIssues = product.issues.filter((issue) => issue.status === "CLOSED").length;
      const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);

      const scores = computeHealthScores({
        mrr: product.mrr,
        churnRate: product.churnRate,
        openBugs,
        totalIssues: product.issues.length,
        closedIssues,
        totalCosts,
        snapshots,
      });

      const now = new Date();
      await ctx.db.product.update({
        where: { id: input.productId },
        data: {
          healthScore: scores.totalScore,
          openBugs,
          netMargin: product.mrr - totalCosts,
        },
      });

      return { calculatedAt: now };
    }),

  recommendations: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx.user.id, input.productId, ctx.db);

      const [product, costs, snapshots] = await Promise.all([
        ctx.db.product.findUnique({
          where: { id: input.productId },
          select: {
            id: true,
            name: true,
            mrr: true,
            churnRate: true,
            issues: {
              select: { type: true, status: true },
            },
            integration: {
              select: {
                provider: true,
                stripeApiKey: true,
                dodoApiKey: true,
              },
            },
          },
        }),
        ctx.db.cost.findMany({
          where: { productId: input.productId },
          select: { amount: true },
        }),
        ctx.db.revenueSnapshot.findMany({
          where: { productId: input.productId },
          orderBy: { date: "asc" },
          select: { mrr: true },
        }),
      ]);

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      }

      const openBugs = product.issues.filter((issue) => issue.type === "BUG" && issue.status !== "CLOSED").length;
      const closedIssues = product.issues.filter((issue) => issue.status === "CLOSED").length;
      const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
      const scores = computeHealthScores({
        mrr: product.mrr,
        churnRate: product.churnRate,
        openBugs,
        totalIssues: product.issues.length,
        closedIssues,
        totalCosts,
        snapshots,
      });

      const items = await generateHealthRecommendations({
        productName: product.name,
        totalScore: scores.totalScore,
        revenueScore: scores.revenueScore,
        productScore: scores.productScore,
        financialScore: scores.financialScore,
        mrr: product.mrr,
        churnRate: product.churnRate,
        mrrGrowthPct: scores.growthPct,
        costRatioPct: scores.costRatioPct,
        netMarginPct: scores.marginPct,
        openBugs,
        closedIssueRatePct: scores.closedPct,
        hasRevenueIntegration:
          Boolean(product.integration?.stripeApiKey) || Boolean(product.integration?.dodoApiKey),
        costItemsCount: costs.length,
      });

      return {
        items,
        generatedAt: new Date(),
      };
    }),
});
