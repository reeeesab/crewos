import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createInviteCode, hashInviteCode, normalizeInviteCode } from "@/server/lib/invite-code";
import { assertProductAccess, assertProductRole } from "@/server/lib/access";
import { router, protectedProcedure } from "@/server/trpc";

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["LIVE", "BETA", "ARCHIVED"]).default("BETA"),
  website: z.string().url().optional().or(z.literal("")),
});

const VIEWER_PERMISSIONS = {
  revenue: true,
  roadmap: true,
  issues: true,
  costs: false,
  analytics: true,
  social: true,
  team: false,
  changelog: false,
  billing: false,
  buildInPublic: false,
  healthScore: true,
  marginData: false,
};

const EDITOR_PERMISSIONS = {
  revenue: true,
  roadmap: true,
  issues: true,
  costs: true,
  analytics: true,
  social: true,
  team: false,
  changelog: true,
  billing: false,
  buildInPublic: true,
  healthScore: true,
  marginData: true,
};

function permissionsForRole(role: "EDITOR" | "VIEWER") {
  return role === "EDITOR" ? EDITOR_PERMISSIONS : VIEWER_PERMISSIONS;
}

export const productRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      where: {
        members: {
          some: {
            userId: ctx.user.id,
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

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.id);

      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
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

      let healthScore = 80;
      const openBugs = product._count.issues;

      healthScore -= openBugs * 5;
      if (product.churnRate > 5) healthScore -= 10;
      if (product.mrr > 5000) healthScore += 10;

      healthScore = Math.max(0, Math.min(100, healthScore));

      ctx.db.product
        .update({
          where: { id: product.id },
          data: { healthScore, openBugs },
        })
        .catch(console.error);

      return {
        ...product,
        healthScore,
        openBugs,
      };
    }),

  listMembers: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);

      return ctx.db.productMember.findMany({
        where: { productId: input.productId },
        include: { user: true },
        orderBy: [{ role: "asc" }, { userId: "asc" }],
      });
    }),

  getInviteCodeInfo: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);

      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
        select: {
          inviteCodeHash: true,
          inviteCodeHint: true,
          inviteCodeUpdatedAt: true,
        },
      });

      return {
        hasCode: Boolean(product?.inviteCodeHash),
        hint: product?.inviteCodeHint ?? null,
        updatedAt: product?.inviteCodeUpdatedAt ?? null,
      };
    }),

  rotateInviteCode: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER"]);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const invite = createInviteCode();
        const now = new Date();

        try {
          await ctx.db.product.update({
            where: { id: input.productId },
            data: {
              inviteCodeHash: invite.hash,
              inviteCodeHint: invite.hint,
              inviteCodeUpdatedAt: now,
            },
          });

          return {
            code: invite.code,
            hint: invite.hint,
            updatedAt: now,
          };
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            continue;
          }
          throw error;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not generate a unique invite code. Please try again.",
      });
    }),

  joinByInviteCode: protectedProcedure
    .input(
      z.object({
        code: z.string().min(6).max(64),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalized = normalizeInviteCode(input.code);
      if (normalized.length < 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite code format is invalid." });
      }

      const inviteCodeHash = hashInviteCode(normalized);
      const product = await ctx.db.product.findFirst({
        where: { inviteCodeHash },
        select: { id: true, status: true },
      });

      if (!product) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite code is invalid or expired." });
      }

      if (product.status === "ARCHIVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This project is archived." });
      }

      const existing = await ctx.db.productMember.findUnique({
        where: {
          userId_productId: {
            userId: ctx.user.id,
            productId: product.id,
          },
        },
      });

      if (existing) {
        return { productId: product.id, alreadyMember: true };
      }

      await ctx.db.productMember.create({
        data: {
          productId: product.id,
          userId: ctx.user.id,
          role: "VIEWER",
          permissions: VIEWER_PERMISSIONS,
        },
      });

      return { productId: product.id, alreadyMember: false };
    }),

  updateMemberPermissions: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        permissions: z.record(z.string(), z.boolean()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetMember = await ctx.db.productMember.findUnique({
        where: { id: input.memberId },
        select: { productId: true },
      });

      if (!targetMember) throw new TRPCError({ code: "NOT_FOUND" });

      await assertProductRole(ctx, targetMember.productId, ["OWNER"]);

      return ctx.db.productMember.update({
        where: { id: input.memberId },
        data: { permissions: input.permissions },
      });
    }),

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

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(productSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.id, ["OWNER", "EDITOR"]);
      const { id, ...data } = input;
      return ctx.db.product.update({ where: { id }, data });
    }),

  searchUserByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
      });
      return user;
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        userId: z.string(),
        role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER"]);

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
          permissions: permissionsForRole(input.role),
        },
      });
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.id, ["OWNER"]);
      return ctx.db.product.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.id, ["OWNER"]);
      return ctx.db.product.delete({ where: { id: input.id } });
    }),
});
