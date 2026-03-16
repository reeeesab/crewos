import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const issueRouter = router({
  list: protectedProcedure
    .input(z.object({
      productId: z.string(),
      type: z.enum(["FEATURE", "BUG"]).optional(),
      status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
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
    .input(z.object({
      productId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["FEATURE", "BUG"]),
      priority: z.enum(["P0", "P1", "P2", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
      milestone: z.string().optional(),
      dueDate: z.string().optional(),
      assigneeId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.issue.create({
        data: {
          productId: input.productId,
          title: input.title,
          description: input.description ?? "",
          type: input.type,
          priority: input.priority,
          milestone: input.milestone,
          reporterId: ctx.user.id,
          assigneeId: input.assigneeId || null,
          ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      type: z.enum(["FEATURE", "BUG"]).optional(),
      priority: z.enum(["P0", "P1", "P2", "HIGH", "MEDIUM", "LOW"]).optional(),
      milestone: z.string().optional(),
      dueDate: z.string().nullable().optional(),
      assigneeId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, assigneeId, ...data } = input;
      return ctx.db.issue.update({
        where: { id },
        data: {
          ...data,
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.issue.update({
        where: { id: input.id },
        data: { status: input.status, ...(input.status === "CLOSED" && { closedAt: new Date() }) },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.issue.delete({ where: { id: input.id } });
    }),
});
