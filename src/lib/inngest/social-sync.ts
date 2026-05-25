import { inngest } from "./client";

export const socialSyncFunction = inngest.createFunction(
  {
    id: "social-stats-sync",
    triggers: [{ cron: "0 0 * * *" }],
  },
  async ({ step }) => {
    await step.run("sync-social-accounts", async () => {
      console.log("Syncing social stats for all products...");
      // For each SocialAccount:
      // 1. Fetch latest followers, engagement, impressions from platform APIs
      // 2. Update SocialAccount record
    });
  },
);
