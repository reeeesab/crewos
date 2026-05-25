import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { assertProductAccess, assertProductRole } from "@/server/lib/access";
import { SocialService } from "@/server/services/social";

export const socialRouter = router({
  listAccounts: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      return ctx.db.socialAccount.findMany({
        where: { productId: input.productId },
        select: {
          id: true,
          platform: true,
          handle: true,
          followers: true,
          engagement: true,
          impressions: true,
        },
      });
    }),

  listPosts: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      return ctx.db.buildInPublicPost.findMany({
        where: { productId: input.productId },
        orderBy: { createdAt: "desc" },
      });
    }),

  createDraft: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        platform: z.string(),
        draftText: z.string().min(1),
        sourceType: z.string(),
        sourceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);
      return ctx.db.buildInPublicPost.create({
        data: input,
      });
    }),

  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        draftText: z.string().optional(),
        scheduledAt: z.date().nullish(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.buildInPublicPost.findUnique({
        where: { id: input.id },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      await assertProductRole(ctx, post.productId, ["OWNER", "EDITOR"]);

      const { id, ...data } = input;
      return ctx.db.buildInPublicPost.update({
        where: { id },
        data,
      });
    }),

  postNow: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.buildInPublicPost.findUnique({
        where: { id: input.id },
        include: { product: { include: { socialAccounts: true } } },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      await assertProductRole(ctx, post.productId, ["OWNER", "EDITOR"]);

      const socialAccount = post.product.socialAccounts.find(
        (acc) => acc.platform.toLowerCase() === post.platform.toLowerCase()
      );

      if (!socialAccount || !socialAccount.accessToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No connected ${post.platform} account found.`,
        });
      }

      const result = await SocialService.dispatchPost(
        post.platform,
        socialAccount.id,
        post.draftText
      );

      if (!result.success) {
        await ctx.db.buildInPublicPost.update({
          where: { id: post.id },
          data: { status: "failed", errorMessage: result.error },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to post to social media",
        });
      }

      return ctx.db.buildInPublicPost.update({
        where: { id: post.id },
        data: {
          status: "posted",
          postedAt: new Date(),
          platformPostId: result.platformPostId,
        },
      });
    }),

  deletePost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.buildInPublicPost.findUnique({
        where: { id: input.id },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      await assertProductRole(ctx, post.productId, ["OWNER", "EDITOR"]);

      return ctx.db.buildInPublicPost.delete({
        where: { id: input.id },
      });
    }),

  getAuthUrl: protectedProcedure
    .input(z.object({ productId: z.string(), platform: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const redirectUri = `${baseUrl}/api/social/callback`;
      const state = Buffer.from(JSON.stringify({ productId: input.productId, platform: input.platform })).toString("base64");

      let authUrl = "";
      if (input.platform === "twitter") {
        authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
      } else if (input.platform === "linkedin") {
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20profile%20w_member_social`;
      } else if (input.platform === "threads") {
        authUrl = `https://www.threads.net/oauth/authorize?client_id=${process.env.THREADS_CLIENT_ID}&redirect_uri=${redirectUri}&scope=threads_content_publish&response_type=code&state=${state}`;
      }

      return { authUrl };
    }),
});
