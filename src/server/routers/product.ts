import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["LIVE", "BETA", "ARCHIVED"]).default("BETA"),
  website: z.string().url().optional().or(z.literal("")),
});

export const productRouter = router({
  // List all products owned by signed-in user
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      where: {
        members: {
          some: {
            userId: ctx.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        members: { include: { user: true } },
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get single product
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findFirst({
        where: {
          id: input.id,
          members: { some: { userId: ctx.user.id } },
        },
        include: {
          members: {
            include: { user: true },
          },
          snapshots: {
            orderBy: { date: "desc" },
            take: 12,
          },
          issues: {
            include: { assignee: true, costs: true },
          },
          costs: {
            include: { issue: true },
          },
          _count: {
            select: {
              issues: true,
            },
          },
        },
      });

      if (!product) throw new TRPCError({ code: "NOT_FOUND" });

      // Calculate simple Health Score (0-100)
      let healthScore = 80; // Baseline
      const openBugs = product._count.issues;
      
      healthScore -= openBugs * 5;
      if (product.churnRate > 5) healthScore -= 10;
      if (product.mrr > 5000) healthScore += 10;
      
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Optional: Update the DB with calculated score (async, non-blocking)
      ctx.db.product.update({
        where: { id: product.id },
        data: { healthScore, openBugs },
      }).catch(console.error);

      return {
        ...product,
        healthScore,
        openBugs,
      };
    }),

  listMembers: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is member
      const member = await ctx.db.productMember.findFirst({
        where: { productId: input.productId, userId: ctx.user.id },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.productMember.findMany({
        where: { productId: input.productId },
        include: { user: true },
        orderBy: { role: "asc" },
      });
    }),

  updateMemberPermissions: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        permissions: z.record(z.string(), z.boolean()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if requester is OWNER of the product
      const targetMember = await ctx.db.productMember.findUnique({
        where: { id: input.memberId },
        select: { productId: true },
      });

      if (!targetMember) throw new TRPCError({ code: "NOT_FOUND" });

      const requester = await ctx.db.productMember.findFirst({
        where: {
          productId: targetMember.productId,
          userId: ctx.user.id,
          role: "OWNER",
        },
      });

      if (!requester) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.productMember.update({
        where: { id: input.memberId },
        data: { permissions: input.permissions },
      });
    }),

  // Create a new product
  create: protectedProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.create({
        data: {
          name: input.name,
          description: input.description ?? "",
          type: input.type ?? "SaaS",
          status: input.status,
          website: input.website ?? "",
          members: {
            create: {
              userId: ctx.user.id,
              role: "OWNER",
              permissions: {
                revenue: true,
                roadmap: true,
                issues: true,
                costs: true,
                analytics: true,
                social: true,
                team: true,
                changelog: true,
                billing: true,
                buildInPublic: true,
                healthScore: true,
                marginData: true,
              },
            },
          },
        },
      });
      return product;
    }),

  // Update product
  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(productSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.product.update({ where: { id }, data });
    }),

  // Search for a user by email (for invitations)
  searchUserByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      // Find the user by EXACT email
      const user = await ctx.db.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
      });
      return user;
    }),

  // Add a member to a product
  addMember: protectedProcedure
    .input(z.object({
      productId: z.string(),
      userId: z.string(),
      role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Must be owner of the product to add members
      const requester = await ctx.db.productMember.findFirst({
        where: { productId: input.productId, userId: ctx.user.id, role: "OWNER" },
      });
      if (!requester) throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can add team members" });

      // Check if user already a member
      const existing = await ctx.db.productMember.findUnique({
        where: {
          userId_productId: {
            userId: input.userId,
            productId: input.productId,
          },
        },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "User is already a member" });

      return ctx.db.productMember.create({
        data: {
          productId: input.productId,
          userId: input.userId,
          role: input.role,
          permissions: {
            revenue: input.role === "EDITOR",
            roadmap: true,
            issues: true,
            costs: input.role === "EDITOR",
            analytics: true,
            social: true,
            team: false,
            changelog: input.role === "EDITOR",
            billing: false,
            buildInPublic: true,
            healthScore: true,
            marginData: false,
          },
        },
      });
    }),

  // Archive / delete
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      });
    }),

  // Permanently delete product (cascade via schema)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Must be owner
      const member = await ctx.db.productMember.findFirst({
        where: { productId: input.id, userId: ctx.user.id, role: "OWNER" },
      });
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can delete products" });

      return ctx.db.product.delete({ where: { id: input.id } });
    }),
});
