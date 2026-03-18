import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);

function createClient() {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

type AnalyticsAwareClient = PrismaClient & {
  analyticsConfig?: unknown;
  analyticsSnapshot?: unknown;
};

function hasAnalyticsDelegates(client: AnalyticsAwareClient) {
  return (
    typeof client.analyticsConfig !== "undefined" &&
    typeof client.analyticsSnapshot !== "undefined"
  );
}

export function getDb(): PrismaClient {
  const cached = globalForPrisma.prisma as AnalyticsAwareClient | undefined;

  if (!cached) {
    const fresh = createClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = fresh;
    return fresh;
  }

  if (!hasAnalyticsDelegates(cached)) {
    cached
      .$disconnect()
      .catch(() => {
        // Best-effort cleanup for stale Prisma client in dev HMR.
      });
    const fresh = createClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = fresh;
    return fresh;
  }

  return cached;
}

export const db = getDb();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
