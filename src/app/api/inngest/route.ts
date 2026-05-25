import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { socialSyncFunction } from "@/lib/inngest/social-sync";
import { socialPostingFunction } from "@/lib/inngest/social-posting";
import { analyticsHourlySync } from "@/lib/inngest/analytics-sync";
import { stripeSyncFunction } from "@/lib/inngest/stripe-sync";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    socialSyncFunction,
    socialPostingFunction,
    analyticsHourlySync,
    stripeSyncFunction,
  ],
});
