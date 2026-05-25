import { inngest } from "./client";
import { db } from "@/server/db";
import { SocialService } from "@/server/services/social";

export const socialPostingFunction = inngest.createFunction(
  {
    id: "social-scheduled-posting",
    triggers: [{ cron: "* * * * *" }],
  },
  async ({ step }) => {
    const posts = await step.run("get-scheduled-posts", async () => {
      return db.buildInPublicPost.findMany({
        where: {
          status: "scheduled",
          scheduledAt: { lte: new Date() },
        },
        include: { product: { include: { socialAccounts: true } } },
      });
    });

    for (const post of posts) {
      await step.run(`post-${post.id}`, async () => {
        const socialAccount = post.product.socialAccounts.find(
          (acc) => acc.platform.toLowerCase() === post.platform.toLowerCase()
        );

        if (!socialAccount || !socialAccount.accessToken) {
          await db.buildInPublicPost.update({
            where: { id: post.id },
            data: { status: "failed", errorMessage: "Account not connected" },
          });
          return;
        }

        const result = await SocialService.dispatchPost(
          post.platform,
          socialAccount.id,
          post.draftText
        );

        if (result.success) {
          await db.buildInPublicPost.update({
            where: { id: post.id },
            data: {
              status: "posted",
              postedAt: new Date(),
              platformPostId: result.platformPostId,
            },
          });
        } else {
          await db.buildInPublicPost.update({
            where: { id: post.id },
            data: { status: "failed", errorMessage: result.error },
          });
        }
      });
    }
  }
);
