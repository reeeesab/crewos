// Forced reload for Prisma Client sync
import { router } from "../trpc";
import { productRouter } from "./product";
import { issueRouter } from "./issue";
import { costRouter } from "./cost";
import { revenueRouter } from "./revenue";
import { changelogRouter } from "./changelog";
import { acquisitionRouter } from "./acquisition";
import { analyticsRouter } from "./analytics";
import { notificationsRouter } from "./notifications";
import { healthRouter } from "./health";

export const appRouter = router({
  product: productRouter,
  issue: issueRouter,
  cost: costRouter,
  revenue: revenueRouter,
  changelog: changelogRouter,
  acquisition: acquisitionRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
