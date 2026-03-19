import { initTRPC, TRPCError } from "@trpc/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/server/db";
import superjson from "superjson";

export async function createTRPCContext() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  return { userId, clerkUser: user, db: getDb() };
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

  let user = await ctx.db.user.findUnique({
    where: { clerkId: ctx.userId },
  });

  if (!user && primaryEmail) {
    // Check if user exists with this email but no clerkId yet
    user = await ctx.db.user.findUnique({
      where: { email: primaryEmail },
    });
    
    if (user) {
      // Link existing user to this clerkId
      user = await ctx.db.user.update({
        where: { id: user.id },
        data: { clerkId: ctx.userId },
      });
    }
  }

  if (!user) {
    user = await ctx.db.user.create({
      data: {
        clerkId: ctx.userId,
        email: primaryEmail ?? "",
        name: `${ctx.clerkUser.firstName ?? ""} ${ctx.clerkUser.lastName ?? ""}`.trim(),
      },
    });
  } else {
    // Sync info for existing user
    user = await ctx.db.user.update({
      where: { id: user.id },
      data: {
        email: primaryEmail ?? "",
        name: `${ctx.clerkUser.firstName ?? ""} ${ctx.clerkUser.lastName ?? ""}`.trim(),
      },
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, user } });
});
