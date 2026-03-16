import { initTRPC, TRPCError } from "@trpc/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import superjson from "superjson";

export async function createTRPCContext() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  return { userId, clerkUser: user, db };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure — throws if not signed in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.clerkUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const primaryEmail = ctx.clerkUser.emailAddresses[0]?.emailAddress;

  // Sync user to DB on first call
  const user = await ctx.db.user.upsert({
    where: { clerkId: ctx.userId },
    update: {
      email: primaryEmail ?? "",
      name: `${ctx.clerkUser.firstName ?? ""} ${ctx.clerkUser.lastName ?? ""}`.trim(),
    },
    create: {
      clerkId: ctx.userId,
      email: primaryEmail ?? "",
      name: `${ctx.clerkUser.firstName ?? ""} ${ctx.clerkUser.lastName ?? ""}`.trim(),
    },
  });
  return next({ ctx: { ...ctx, userId: ctx.userId, user } });
});
