import { db } from "@/server/db";
import { getHourlySessions } from "@/server/services/ga4";
import { decryptSecret } from "@/server/services/analytics-crypto";
import { inngest } from "./client";

export const analyticsHourlySync = inngest.createFunction(
  { id: "analytics-hourly-sync" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const connectedProducts = await step.run("get-connected-products", async () => {
      return db.analyticsConfig.findMany({
        where: { isConnected: true },
        select: {
          productId: true,
          clientEmail: true,
          privateKey: true,
          propertyId: true,
        },
      });
    });

    for (const config of connectedProducts) {
      await step.run(`sync-${config.productId}`, async () => {
        try {
          const hourlySessions = await getHourlySessions({
            clientEmail: config.clientEmail,
            privateKey: decryptSecret(config.privateKey),
            propertyId: config.propertyId,
          });

          const recentSnapshot = await db.analyticsSnapshot.findFirst({
            where: { productId: config.productId },
            orderBy: { date: "desc" },
          });

          const avgHourly = recentSnapshot ? Math.round(recentSnapshot.totalSessions / (7 * 24)) : 0;
          if (avgHourly > 10 && hourlySessions > avgHourly * 3) {
            // Placeholder for notification integration.
            console.log(
              `[analytics] spike detected for ${config.productId}: ${hourlySessions} vs avg ${avgHourly}`,
            );
          }

          await db.analyticsConfig.update({
            where: { productId: config.productId },
            data: { lastSyncedAt: new Date() },
          });
        } catch (error) {
          console.error(`[analytics] hourly sync failed for ${config.productId}`, error);
        }
      });
    }
  },
);
