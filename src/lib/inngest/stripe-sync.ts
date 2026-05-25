import { inngest } from "./client";

export const stripeSyncFunction = inngest.createFunction(
  {
    id: "stripe-mrr-sync",
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    await step.run("sync-all-products", async () => {
      console.log("Syncing MRR from Stripe for all products...");
      // For each product with a StripeConfig:
      // 1. Pull all active subscriptions
      // 2. Recalculate MRR
      // 3. Update StripeConfig.mrr and create RevenueSnapshot
      // 4. Check sunset signal conditions
    });
  },
);
