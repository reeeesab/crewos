import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { assertProductAccess } from "@/server/lib/access";
import { router, protectedProcedure } from "@/server/trpc";

export const issueRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        type: z.enum(["FEATURE", "BUG", "MARKETING", "OTHER"]).optional(),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      return ctx.db.issue.findMany({
        where: {
          productId: input.productId,
          ...(input.type && { type: input.type }),
          ...(input.status && { status: input.status }),
        },
        include: {
          assignee: true,
          costs: true,
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["FEATURE", "BUG", "MARKETING", "OTHER"]),
        points: z.number().min(0).default(0),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
        priority: z.enum(["P0", "P1", "P2", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
        milestone: z.string().optional(),
        dueDate: z.string().optional(),
        assigneeId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      const title = input.title.trim();
      const description = (input.description ?? "").trim();
      if (description.length > 0 && title.toLowerCase() === description.toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Title and description should not be the same. Add more detail in the description.",
        });
      }
      let { assigneeId } = input;
      if (assigneeId && assigneeId.startsWith("user_")) {
        const u = await ctx.db.user.findUnique({ where: { clerkId: assigneeId }, select: { id: true } });
        assigneeId = u?.id || undefined;
      }

      return ctx.db.issue.create({
        data: {
          productId: input.productId,
          title,
          description: input.description ?? "",
          type: input.type,
          points: input.points,
          status: input.status ?? "OPEN",
          ...(input.status === "CLOSED" && { closedAt: new Date() }),
          priority: input.priority,
          milestone: input.milestone,
          reporterId: ctx.user.id,
          assigneeId: assigneeId || null,
          ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        },
      });
    }),

  getLeaderboard: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      return ctx.db.userPoints.findMany({
        where: { productId: input.productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              clerkId: true,
            },
          },
        },
        orderBy: { points: "desc" },
      });
    }),


  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(["FEATURE", "BUG", "MARKETING", "OTHER"]).optional(),
        points: z.number().min(0).optional(),
        priority: z.enum(["P0", "P1", "P2", "HIGH", "MEDIUM", "LOW"]).optional(),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
        milestone: z.string().optional(),
        dueDate: z.string().nullable().optional(),
        assigneeId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.issue.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found." });
      await assertProductAccess(ctx, target.productId);

      const { id, dueDate, assigneeId, ...data } = input;
      const title = data.title?.trim();
      const description = data.description?.trim();
      if (title && description && title.toLowerCase() === description.toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Title and description should not be the same. Add more detail in the description.",
        });
      }

      let finalAssigneeId = assigneeId;
      if (finalAssigneeId && finalAssigneeId.startsWith("user_")) {
        const u = await ctx.db.user.findUnique({ where: { clerkId: finalAssigneeId }, select: { id: true } });
        finalAssigneeId = u?.id || undefined;
      }

      const updated = await ctx.db.issue.update({
        where: { id },
        data: {
          ...data,
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(assigneeId !== undefined && { assigneeId: finalAssigneeId || null }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(input.status === "CLOSED" && { closedAt: new Date() }),
        },
      });

      // Award points if moved to CLOSED
      if (input.status === "CLOSED" && updated.assigneeId && updated.points > 0) {
        await ctx.db.userPoints.upsert({
          where: {
            userId_productId: {
              userId: updated.assigneeId,
              productId: target.productId,
            },
          },
          update: { points: { increment: updated.points } },
          create: {
            userId: updated.assigneeId,
            productId: target.productId,
            points: updated.points,
          },
        });
      }

      return updated;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.issue.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found." });
      await assertProductAccess(ctx, target.productId);

      const updated = await ctx.db.issue.update({
        where: { id: input.id },
        data: { status: input.status, ...(input.status === "CLOSED" && { closedAt: new Date() }) },
      });

      // Award points if moved to CLOSED
      if (input.status === "CLOSED" && updated.assigneeId && updated.points > 0) {
        await ctx.db.userPoints.upsert({
          where: {
            userId_productId: {
              userId: updated.assigneeId,
              productId: target.productId,
            },
          },
          update: { points: { increment: updated.points } },
          create: {
            userId: updated.assigneeId,
            productId: target.productId,
            points: updated.points,
          },
        });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.issue.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found." });
      await assertProductAccess(ctx, target.productId);

      return ctx.db.issue.delete({ where: { id: input.id } });
    }),
});
