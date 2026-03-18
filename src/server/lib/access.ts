import { TRPCError } from "@trpc/server";
import type { MemberRole, PrismaClient } from "@prisma/client";

type AccessContext = {
  db: PrismaClient;
  user: { id: string };
};

export async function assertProductAccess(ctx: AccessContext, productId: string) {
  const membership = await ctx.db.productMember.findFirst({
    where: { productId, userId: ctx.user.id },
    select: { id: true, role: true, permissions: true },
  });

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this project." });
  }

  return membership;
}

export async function assertProductRole(
  ctx: AccessContext,
  productId: string,
  allowedRoles: MemberRole[],
) {
  const membership = await assertProductAccess(ctx, productId);
  if (!allowedRoles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }
  return membership;
}

